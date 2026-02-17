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

function loadMemories() {
  const file = getMemoryFile();
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return data;
  } catch {
    return { version: 1, memories: [] };
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

// --- BM25 Search ---

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[\s\-_.,;:!?'"()[\]{}|/\\@#$%^&*+=<>~`]+/)
    .filter((t) => t.length > 1);
}

function bm25Search(memories, query, limit = 10) {
  const k1 = 1.2;
  const b = 0.75;
  const tagBoost = 2.0;

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // Build document representations
  const docs = memories.map((m) => {
    const contentTokens = tokenize(m.content);
    const tagTokens = (m.tags || []).flatMap((t) => tokenize(t));
    const typeTokens = tokenize(m.type || "");
    return {
      memory: m,
      tokens: contentTokens,
      tagTokens,
      allTokens: [...contentTokens, ...tagTokens, ...typeTokens],
      length: contentTokens.length,
    };
  });

  const N = docs.length;
  if (N === 0) return [];

  const avgdl = docs.reduce((sum, d) => sum + d.length, 0) / N;

  // Compute document frequency for each query term
  const df = {};
  for (const term of queryTokens) {
    df[term] = 0;
    for (const doc of docs) {
      if (doc.allTokens.includes(term)) {
        df[term]++;
      }
    }
  }

  // Score each document
  const scored = docs.map((doc) => {
    let score = 0;

    for (const term of queryTokens) {
      const termDf = df[term] || 0;
      const idf = Math.log((N - termDf + 0.5) / (termDf + 0.5) + 1);

      // Content TF
      const freq = doc.tokens.filter((t) => t === term).length;
      const tf =
        (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (doc.length / avgdl)));

      // Tag TF (boosted)
      const tagFreq = doc.tagTokens.filter((t) => t === term).length;
      const tagTf = tagFreq > 0 ? tagBoost : 0;

      score += idf * (tf + tagTf);
    }

    return { memory: doc.memory, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// --- Commands ---

function cmdStore(args) {
  const content = args.content;
  const type = args.type || "observation";
  const tags = args.tags
    ? args.tags.split(",").map((t) => t.trim().toLowerCase())
    : [];

  const validTypes = ["decision", "learning", "error", "pattern", "observation"];
  if (!validTypes.includes(type)) {
    return { error: `Invalid type "${type}". Valid: ${validTypes.join(", ")}` };
  }

  if (!content) {
    return { error: "Missing --content" };
  }

  const data = loadMemories();
  const now = new Date().toISOString();
  const memory = {
    id: generateId(),
    content,
    type,
    tags,
    created: now,
    updated: now,
    relations: [],
  };

  data.memories.push(memory);
  saveMemories(data);
  return { stored: memory };
}

function cmdSearch(args) {
  const query = args.query;
  const limit = parseInt(args.limit) || 10;

  if (!query) {
    return { error: "Missing --query" };
  }

  const data = loadMemories();
  const results = bm25Search(data.memories, query, limit);
  return {
    query,
    count: results.length,
    results: results.map((r) => ({
      id: r.memory.id,
      content: r.memory.content,
      type: r.memory.type,
      tags: r.memory.tags,
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

  const data = loadMemories();
  let memories = data.memories;

  if (type) {
    memories = memories.filter((m) => m.type === type);
  }
  if (tag) {
    memories = memories.filter((m) => (m.tags || []).includes(tag.toLowerCase()));
  }

  // Most recent first
  memories = memories
    .sort((a, b) => new Date(b.created) - new Date(a.created))
    .slice(0, limit);

  return {
    count: memories.length,
    filters: { type: type || null, tag: tag || null },
    memories: memories.map((m) => ({
      id: m.id,
      content: m.content,
      type: m.type,
      tags: m.tags,
      created: m.created,
    })),
  };
}

function cmdRecent(args) {
  const limit = parseInt(args.limit) || 5;
  const data = loadMemories();

  const memories = data.memories
    .sort((a, b) => new Date(b.created) - new Date(a.created))
    .slice(0, limit);

  return {
    count: memories.length,
    memories: memories.map((m) => ({
      id: m.id,
      content: m.content,
      type: m.type,
      tags: m.tags,
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

  // Avoid duplicate relations
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

function cmdStats() {
  const data = loadMemories();
  const memories = data.memories;

  const byType = {};
  const byTag = {};

  for (const m of memories) {
    byType[m.type] = (byType[m.type] || 0) + 1;
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
    relate: cmdRelate,
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
