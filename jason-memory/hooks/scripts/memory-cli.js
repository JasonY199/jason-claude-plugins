#!/usr/bin/env node

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// --- Project root detection ---

function getProjectRoot() {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return process.cwd();
  }
}

function getProjectName() {
  return path.basename(getProjectRoot());
}

// --- File I/O ---

function getMemoryDir() {
  return path.join(getProjectRoot(), ".memory");
}

function getMemoryFile() {
  return path.join(getMemoryDir(), "memories.json");
}

function migrateV1toV2(data) {
  for (const m of data.memories) {
    if (m.status === undefined) m.status = "active";
    if (m.superseded_by === undefined) m.superseded_by = null;
    if (m.last_accessed === undefined) m.last_accessed = null;
  }
  data.version = 2;
  return data;
}

function loadMemories() {
  const file = getMemoryFile();
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (data.version < 2) {
      const migrated = migrateV1toV2(data);
      saveMemories(migrated);
      return migrated;
    }
    return data;
  } catch {
    return { version: 2, memories: [] };
  }
}

function saveMemories(data) {
  const dir = getMemoryDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getMemoryFile(), JSON.stringify(data, null, 2) + "\n", "utf8");
}

// --- ID generation ---

function generateId() {
  const ts = Math.floor(Date.now() / 1000);
  const hex = crypto.randomBytes(2).toString("hex");
  return `m_${ts}_${hex}`;
}

// --- Synonym expansion ---

const SYNONYMS = {
  db: "database",
  database: "db",
  auth: "authentication",
  authentication: "auth",
  config: "configuration",
  configuration: "config",
  env: "environment",
  environment: "env",
  dep: "dependency",
  dependency: "dep",
  deps: "dependencies",
  dependencies: "deps",
  repo: "repository",
  repository: "repo",
  dir: "directory",
  directory: "dir",
  pkg: "package",
  package: "pkg",
  fn: "function",
  function: "fn",
  err: "error",
  error: "err",
  msg: "message",
  message: "msg",
  req: "request",
  request: "req",
  res: "response",
  response: "res",
  ui: "interface",
  api: "endpoint",
  css: "styling",
  styling: "css",
  ts: "typescript",
  typescript: "ts",
  js: "javascript",
  javascript: "js",
};

// --- Tokenization ---

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[\s\-_.,;:!?'"()[\]{}|/\\@#$%^&*+=<>~`]+/)
    .filter((t) => t.length > 1);
}

function tokenizeWithBigrams(text) {
  const unigrams = tokenize(text);
  const bigrams = [];
  for (let i = 0; i < unigrams.length - 1; i++) {
    bigrams.push(unigrams[i] + "_" + unigrams[i + 1]);
  }
  return { unigrams, bigrams };
}

function expandQuery(tokens) {
  const expanded = new Set(tokens);
  for (const t of tokens) {
    if (SYNONYMS[t]) expanded.add(SYNONYMS[t]);
  }
  return [...expanded];
}

// --- BM25 Search ---

function bm25Search(memories, query, limit = 10) {
  const k1 = 1.2;
  const b = 0.75;
  const tagBoost = 2.0;
  const bigramBoost = 1.5;

  const { unigrams: queryUnigrams, bigrams: queryBigrams } = tokenizeWithBigrams(query);
  const expandedUnigrams = expandQuery(queryUnigrams);
  if (expandedUnigrams.length === 0 && queryBigrams.length === 0) return [];

  const docs = memories.map((m) => {
    const { unigrams: contentUnigrams, bigrams: contentBigrams } = tokenizeWithBigrams(m.content);
    const tagTokens = (m.tags || []).flatMap((t) => tokenize(t));
    const typeTokens = tokenize(m.type || "");
    return {
      memory: m,
      tokens: contentUnigrams,
      bigrams: contentBigrams,
      tagTokens,
      allTokens: [...contentUnigrams, ...tagTokens, ...typeTokens],
      length: contentUnigrams.length,
    };
  });

  const N = docs.length;
  if (N === 0) return [];

  const avgdl = docs.reduce((sum, d) => sum + d.length, 0) / N;

  // Document frequency for unigrams
  const df = {};
  for (const term of expandedUnigrams) {
    df[term] = 0;
    for (const doc of docs) {
      if (doc.allTokens.includes(term)) df[term]++;
    }
  }

  // Document frequency for bigrams
  const bigramDf = {};
  for (const bg of queryBigrams) {
    bigramDf[bg] = 0;
    for (const doc of docs) {
      if (doc.bigrams.includes(bg)) bigramDf[bg]++;
    }
  }

  const scored = docs.map((doc) => {
    let score = 0;

    // Unigram scoring
    for (const term of expandedUnigrams) {
      const termDf = df[term] || 0;
      const idf = Math.log((N - termDf + 0.5) / (termDf + 0.5) + 1);
      const freq = doc.tokens.filter((t) => t === term).length;
      const tf = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (doc.length / avgdl)));
      const tagFreq = doc.tagTokens.filter((t) => t === term).length;
      const tagTf = tagFreq > 0 ? tagBoost : 0;
      score += idf * (tf + tagTf);
    }

    // Bigram scoring
    for (const bg of queryBigrams) {
      const bgDf = bigramDf[bg] || 0;
      const idf = Math.log((N - bgDf + 0.5) / (bgDf + 0.5) + 1);
      const freq = doc.bigrams.filter((b) => b === bg).length;
      if (freq > 0) score += idf * bigramBoost;
    }

    return { memory: doc.memory, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// --- Jaccard similarity for dedup ---

function jaccardSimilarity(textA, textB) {
  const tokensA = new Set(tokenize(textA));
  const tokensB = new Set(tokenize(textB));
  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  return intersection / (tokensA.size + tokensB.size - intersection);
}

// --- Helpers ---

function filterActive(memories, includeAll) {
  if (includeAll) return memories;
  return memories.filter((m) => m.status === "active");
}

function touchLastAccessed(data, ids) {
  const now = new Date().toISOString();
  let changed = false;
  for (const m of data.memories) {
    if (ids.has(m.id)) {
      m.last_accessed = now;
      changed = true;
    }
  }
  if (changed) saveMemories(data);
}

// --- Commands ---

function cmdStore(args) {
  const content = args.content;
  const type = args.type || "observation";
  const tags = args.tags
    ? args.tags.split(",").map((t) => t.trim().toLowerCase())
    : [];
  const noDedup = args["no-dedup"] === true;

  const validTypes = ["decision", "learning", "error", "pattern", "observation"];
  if (!validTypes.includes(type)) {
    return { error: `Invalid type "${type}". Valid: ${validTypes.join(", ")}` };
  }

  if (!content) {
    return { error: "Missing --content" };
  }

  const data = loadMemories();
  const now = new Date().toISOString();

  // Auto-dedup: check for similar active memories
  if (!noDedup) {
    const activeMemories = filterActive(data.memories, false);
    for (const existing of activeMemories) {
      const sim = jaccardSimilarity(content, existing.content);
      if (sim >= 0.6) {
        // High similarity — same content or near-duplicate
        if (sim >= 0.9) {
          return { action: "skipped", reason: "near-duplicate", existing_id: existing.id, similarity: Math.round(sim * 1000) / 1000 };
        }
        // Similar but different — supersede
        existing.status = "superseded";
        existing.superseded_by = null; // will be set after new memory is created
        existing.updated = now;

        const memory = {
          id: generateId(),
          content,
          type,
          tags,
          created: now,
          updated: now,
          relations: [],
          status: "active",
          superseded_by: null,
          last_accessed: null,
        };

        existing.superseded_by = memory.id;
        data.memories.push(memory);
        saveMemories(data);
        return { action: "superseded", stored: memory, replaced_id: existing.id, similarity: Math.round(sim * 1000) / 1000 };
      }
    }
  }

  // No match — store new
  const memory = {
    id: generateId(),
    content,
    type,
    tags,
    created: now,
    updated: now,
    relations: [],
    status: "active",
    superseded_by: null,
    last_accessed: null,
  };

  data.memories.push(memory);
  saveMemories(data);
  return { action: "created", stored: memory };
}

function cmdSearch(args) {
  const query = args.query;
  const limit = parseInt(args.limit) || 10;
  const includeAll = args.all === true;

  if (!query) {
    return { error: "Missing --query" };
  }

  const data = loadMemories();
  const memories = filterActive(data.memories, includeAll);
  const results = bm25Search(memories, query, limit);

  // Track last_accessed
  const ids = new Set(results.map((r) => r.memory.id));
  touchLastAccessed(data, ids);

  return {
    query,
    count: results.length,
    results: results.map((r) => ({
      id: r.memory.id,
      content: r.memory.content,
      type: r.memory.type,
      tags: r.memory.tags,
      status: r.memory.status,
      score: Math.round(r.score * 1000) / 1000,
      created: r.memory.created,
      relations: r.memory.relations,
    })),
  };
}

function cmdList(args) {
  const type = args.type;
  const tag = args.tag;
  const limit = parseInt(args.limit) || 20;
  const includeAll = args.all === true;

  const data = loadMemories();
  let memories = filterActive(data.memories, includeAll);

  if (type) {
    memories = memories.filter((m) => m.type === type);
  }
  if (tag) {
    memories = memories.filter((m) => (m.tags || []).includes(tag.toLowerCase()));
  }

  memories = memories
    .sort((a, b) => new Date(b.created) - new Date(a.created))
    .slice(0, limit);

  // Track last_accessed
  const ids = new Set(memories.map((m) => m.id));
  touchLastAccessed(data, ids);

  return {
    count: memories.length,
    filters: { type: type || null, tag: tag || null },
    memories: memories.map((m) => ({
      id: m.id,
      content: m.content,
      type: m.type,
      tags: m.tags,
      status: m.status,
      created: m.created,
    })),
  };
}

function cmdRecent(args) {
  const limit = parseInt(args.limit) || 5;
  const includeAll = args.all === true;

  const data = loadMemories();
  const memories = filterActive(data.memories, includeAll)
    .sort((a, b) => new Date(b.created) - new Date(a.created))
    .slice(0, limit);

  // Track last_accessed
  const ids = new Set(memories.map((m) => m.id));
  touchLastAccessed(data, ids);

  return {
    count: memories.length,
    memories: memories.map((m) => ({
      id: m.id,
      content: m.content,
      type: m.type,
      tags: m.tags,
      status: m.status,
      created: m.created,
    })),
  };
}

function cmdGet(args) {
  if (!args.id) {
    return { error: "Missing --id" };
  }

  const data = loadMemories();
  const memory = data.memories.find((m) => m.id === args.id);

  if (!memory) {
    return { error: `Memory not found: ${args.id}` };
  }

  // Track last_accessed
  touchLastAccessed(data, new Set([memory.id]));

  return { memory };
}

function cmdDelete(args) {
  if (!args.id) {
    return { error: "Missing --id" };
  }

  const data = loadMemories();
  const idx = data.memories.findIndex((m) => m.id === args.id);

  if (idx === -1) {
    return { error: `Memory not found: ${args.id}` };
  }

  const removed = data.memories.splice(idx, 1)[0];

  // Clean up relations pointing to deleted memory
  for (const m of data.memories) {
    m.relations = (m.relations || []).filter((r) => r.target !== args.id);
  }

  saveMemories(data);
  return { deleted: { id: removed.id, content: removed.content } };
}

function cmdArchive(args) {
  if (!args.id) {
    return { error: "Missing --id" };
  }

  const data = loadMemories();
  const memory = data.memories.find((m) => m.id === args.id);

  if (!memory) {
    return { error: `Memory not found: ${args.id}` };
  }

  if (memory.status === "archived") {
    return { error: "Memory is already archived" };
  }

  memory.status = "archived";
  memory.updated = new Date().toISOString();
  saveMemories(data);

  return { archived: { id: memory.id, content: memory.content } };
}

function cmdRelate(args) {
  const { from, to, type } = args;
  if (!from || !to || !type) {
    return { error: "Missing --from, --to, or --type" };
  }

  const validRelTypes = [
    "causes", "fixes", "supports", "opposes", "follows", "related", "contradicts",
  ];
  if (!validRelTypes.includes(type)) {
    return {
      error: `Invalid relation type "${type}". Valid: ${validRelTypes.join(", ")}`,
    };
  }

  const data = loadMemories();
  const fromMem = data.memories.find((m) => m.id === from);
  const toMem = data.memories.find((m) => m.id === to);

  if (!fromMem) return { error: `Memory not found: ${from}` };
  if (!toMem) return { error: `Memory not found: ${to}` };

  if (!fromMem.relations) fromMem.relations = [];

  const exists = fromMem.relations.some(
    (r) => r.target === to && r.type === type,
  );
  if (exists) {
    return { error: "Relation already exists" };
  }

  fromMem.relations.push({ target: to, type });
  fromMem.updated = new Date().toISOString();
  saveMemories(data);

  return {
    related: {
      from: { id: from, content: fromMem.content },
      to: { id: to, content: toMem.content },
      type,
    },
  };
}

function cmdUpdate(args) {
  if (!args.id) {
    return { error: "Missing --id" };
  }
  if (!args.content) {
    return { error: "Missing --content" };
  }

  const data = loadMemories();
  const memory = data.memories.find((m) => m.id === args.id);

  if (!memory) {
    return { error: `Memory not found: ${args.id}` };
  }

  const validTypes = ["decision", "learning", "error", "pattern", "observation"];
  if (args.type && !validTypes.includes(args.type)) {
    return { error: `Invalid type "${args.type}". Valid: ${validTypes.join(", ")}` };
  }

  const previous = memory.content;
  memory.content = args.content;
  if (args.type) memory.type = args.type;
  if (args.tags) {
    memory.tags = args.tags.split(",").map((t) => t.trim().toLowerCase());
  }
  memory.updated = new Date().toISOString();

  saveMemories(data);
  return { updated: { id: memory.id, previous, current: memory.content, type: memory.type } };
}

function cmdFindSimilar(args) {
  if (!args.content) {
    return { error: "Missing --content" };
  }

  const threshold = parseFloat(args.threshold) || 0.5;
  const limit = parseInt(args.limit) || 3;
  const includeAll = args.all === true;

  const data = loadMemories();
  const memories = filterActive(data.memories, includeAll);
  const results = bm25Search(memories, args.content, limit);

  const filtered = results.filter((r) => r.score >= threshold);

  return {
    query: args.content,
    threshold,
    count: filtered.length,
    matches: filtered.map((r) => ({
      id: r.memory.id,
      content: r.memory.content,
      type: r.memory.type,
      tags: r.memory.tags,
      status: r.memory.status,
      score: Math.round(r.score * 1000) / 1000,
    })),
  };
}

function cmdDigest(args) {
  const limit = parseInt(args.limit) || 15;

  const data = loadMemories();
  const active = filterActive(data.memories, false);

  // Group by type, prioritized order
  const typeOrder = ["decision", "pattern", "error", "learning", "observation"];
  const grouped = {};
  for (const t of typeOrder) {
    grouped[t] = active.filter((m) => m.type === t);
  }

  // Pick top memories per group, filling up to limit
  const picked = [];
  let remaining = limit;

  for (const t of typeOrder) {
    if (remaining <= 0) break;
    const mems = grouped[t];
    // Sort by created desc, take up to remaining
    const sorted = mems.sort((a, b) => new Date(b.created) - new Date(a.created));
    const take = Math.min(sorted.length, remaining);
    for (let i = 0; i < take; i++) {
      picked.push(sorted[i]);
    }
    remaining -= take;
  }

  // Build type counts for summary line
  const typeCounts = {};
  for (const t of typeOrder) {
    if (grouped[t].length > 0) typeCounts[t] = grouped[t].length;
  }

  // Track last_accessed
  const ids = new Set(picked.map((m) => m.id));
  touchLastAccessed(data, ids);

  return {
    project: getProjectName(),
    total_active: active.length,
    type_counts: typeCounts,
    memories: picked.map((m) => ({
      type: m.type,
      content: m.content,
      tags: m.tags,
    })),
  };
}

function cmdStale(args) {
  const days = parseInt(args.days) || 30;

  const data = loadMemories();
  const active = filterActive(data.memories, false);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const stale = active.filter((m) => {
    if (!m.last_accessed) return true;
    return m.last_accessed < cutoff;
  });

  return {
    days,
    count: stale.length,
    memories: stale.map((m) => ({
      id: m.id,
      content: m.content,
      type: m.type,
      tags: m.tags,
      last_accessed: m.last_accessed,
      created: m.created,
    })),
  };
}

function cmdStats() {
  const data = loadMemories();
  const memories = data.memories;

  const byType = {};
  const byTag = {};
  const byStatus = {};

  for (const m of memories) {
    byType[m.type] = (byType[m.type] || 0) + 1;
    const status = m.status || "active";
    byStatus[status] = (byStatus[status] || 0) + 1;
    for (const tag of m.tags || []) {
      byTag[tag] = (byTag[tag] || 0) + 1;
    }
  }

  const relationCount = memories.reduce(
    (sum, m) => sum + (m.relations || []).length,
    0,
  );

  return {
    project: getProjectName(),
    total: memories.length,
    byStatus,
    byType,
    byTag,
    relations: relationCount,
  };
}

// --- Argument parsing ---

function parseArgs(argv) {
  const args = {};
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      positional.push(argv[i]);
    }
  }

  return { command: positional[0], args };
}

// --- Main ---

function main() {
  const { command, args } = parseArgs(process.argv.slice(2));

  const commands = {
    store: cmdStore,
    search: cmdSearch,
    list: cmdList,
    recent: cmdRecent,
    get: cmdGet,
    delete: cmdDelete,
    archive: cmdArchive,
    relate: cmdRelate,
    update: cmdUpdate,
    "find-similar": cmdFindSimilar,
    digest: cmdDigest,
    stale: cmdStale,
    stats: cmdStats,
  };

  if (!command || !commands[command]) {
    const result = {
      error: `Unknown command: ${command || "(none)"}`,
      usage: `memory-cli.js <${Object.keys(commands).join("|")}> [options]`,
    };
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    process.exit(1);
  }

  const result = commands[command](args);
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main();
