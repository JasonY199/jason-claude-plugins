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

// --- Porter Stemmer ---

const _stemCache = {};

function porterStem(word) {
  if (word.length < 3) return word;

  const isConsonant = (w, i) => {
    const c = w[i];
    if ("aeiou".includes(c)) return false;
    if (c === "y") return i === 0 || !isConsonant(w, i - 1);
    return true;
  };

  const measure = (w) => {
    let m = 0;
    let prev = null;
    for (let i = 0; i < w.length; i++) {
      const cons = isConsonant(w, i);
      if (!cons && prev === true) m++;
      prev = cons;
    }
    return m;
  };

  const hasVowel = (w) => {
    for (let i = 0; i < w.length; i++) {
      if (!isConsonant(w, i)) return true;
    }
    return false;
  };

  const endsDouble = (w) =>
    w.length >= 2 && w[w.length - 1] === w[w.length - 2] && isConsonant(w, w.length - 1);

  const endsCVC = (w) => {
    const l = w.length;
    if (l < 3) return false;
    return (
      isConsonant(w, l - 1) &&
      !isConsonant(w, l - 2) &&
      isConsonant(w, l - 3) &&
      !"wxy".includes(w[l - 1])
    );
  };

  let w = word;

  // Step 1a
  if (w.endsWith("sses")) w = w.slice(0, -2);
  else if (w.endsWith("ies")) w = w.slice(0, -2);
  else if (!w.endsWith("ss") && w.endsWith("s")) w = w.slice(0, -1);

  // Step 1b
  let step1bModified = false;
  if (w.endsWith("eed")) {
    if (measure(w.slice(0, -3)) > 0) w = w.slice(0, -1);
  } else if (w.endsWith("ed") && hasVowel(w.slice(0, -2))) {
    w = w.slice(0, -2);
    step1bModified = true;
  } else if (w.endsWith("ing") && hasVowel(w.slice(0, -3))) {
    w = w.slice(0, -3);
    step1bModified = true;
  }
  if (step1bModified) {
    if (w.endsWith("at") || w.endsWith("bl") || w.endsWith("iz")) {
      w += "e";
    } else if (endsDouble(w) && !"lsz".includes(w[w.length - 1])) {
      w = w.slice(0, -1);
    } else if (measure(w) === 1 && endsCVC(w)) {
      w += "e";
    }
  }

  // Step 1c
  if (w.endsWith("y") && hasVowel(w.slice(0, -1))) {
    w = w.slice(0, -1) + "i";
  }

  // Step 2
  const step2 = [
    ["ational", "ate"], ["tional", "tion"], ["enci", "ence"], ["anci", "ance"],
    ["izer", "ize"], ["abli", "able"], ["alli", "al"], ["entli", "ent"],
    ["eli", "e"], ["ousli", "ous"], ["ization", "ize"], ["ation", "ate"],
    ["ator", "ate"], ["alism", "al"], ["iveness", "ive"], ["fulness", "ful"],
    ["ousness", "ous"], ["aliti", "al"], ["iviti", "ive"], ["biliti", "ble"],
  ];
  for (const [suffix, replacement] of step2) {
    if (w.endsWith(suffix)) {
      const stem = w.slice(0, -suffix.length);
      if (measure(stem) > 0) w = stem + replacement;
      break;
    }
  }

  // Step 3
  const step3 = [
    ["icate", "ic"], ["ative", ""], ["alize", "al"], ["iciti", "ic"],
    ["ical", "ic"], ["ful", ""], ["ness", ""],
  ];
  for (const [suffix, replacement] of step3) {
    if (w.endsWith(suffix)) {
      const stem = w.slice(0, -suffix.length);
      if (measure(stem) > 0) w = stem + replacement;
      break;
    }
  }

  // Step 4
  const step4 = [
    "al", "ance", "ence", "er", "ic", "able", "ible", "ant", "ement",
    "ment", "ent", "ion", "ou", "ism", "ate", "iti", "ous", "ive", "ize",
  ];
  for (const suffix of step4) {
    if (w.endsWith(suffix)) {
      const stem = w.slice(0, -suffix.length);
      if (suffix === "ion") {
        if (measure(stem) > 1 && (stem.endsWith("s") || stem.endsWith("t"))) {
          w = stem;
        }
      } else if (measure(stem) > 1) {
        w = stem;
      }
      break;
    }
  }

  // Step 5a
  if (w.endsWith("e")) {
    const stem = w.slice(0, -1);
    if (measure(stem) > 1 || (measure(stem) === 1 && !endsCVC(stem))) {
      w = stem;
    }
  }

  // Step 5b
  if (endsDouble(w) && w.endsWith("l") && measure(w) > 1) {
    w = w.slice(0, -1);
  }

  return w;
}

function stem(word) {
  if (_stemCache[word] !== undefined) return _stemCache[word];
  const result = porterStem(word);
  _stemCache[word] = result;
  return result;
}

// --- Synonym expansion ---
// True abbreviation/synonym pairs only. Conceptual associations
// (e.g., "orm" ↔ "database") are handled by co-occurrence expansion.

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
  css: "styling",
  styling: "css",
  ts: "typescript",
  typescript: "ts",
  js: "javascript",
  javascript: "js",
  lib: "library",
  library: "lib",
  dev: "development",
  development: "dev",
  prod: "production",
  production: "prod",
  doc: "documentation",
  documentation: "doc",
  docs: "documentation",
  app: "application",
  application: "app",
  impl: "implementation",
  implementation: "impl",
  param: "parameter",
  parameter: "param",
  params: "parameters",
  parameters: "params",
  nav: "navigation",
  navigation: "nav",
  ui: "frontend",
  frontend: "ui",
};

// --- Tokenization ---

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[\s\-_.,;:!?'"()[\]{}|/\\@#$%^&*+=<>~`]+/)
    .filter((t) => t.length > 1);
}

function stemTokenize(text) {
  return tokenize(text).map(stem);
}

function stemTokenizeWithBigrams(text) {
  const unigrams = stemTokenize(text);
  const bigrams = [];
  for (let i = 0; i < unigrams.length - 1; i++) {
    bigrams.push(unigrams[i] + "_" + unigrams[i + 1]);
  }
  return { unigrams, bigrams };
}

function expandWithSynonyms(rawTokens) {
  const expanded = new Set(rawTokens);
  for (const t of rawTokens) {
    if (SYNONYMS[t]) expanded.add(SYNONYMS[t]);
  }
  return [...expanded];
}

// --- Co-occurrence expansion ---
// Learns which words appear together across the corpus.
// If "drizzle" and "orm" co-occur in memories, searching "orm"
// will boost documents containing "drizzle" — without explicit synonyms.

function buildCooccurrence(memories) {
  const cooc = {};
  for (const m of memories) {
    const tokens = [...new Set(stemTokenize(m.content))];
    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        const a = tokens[i];
        const b = tokens[j];
        if (!cooc[a]) cooc[a] = {};
        if (!cooc[b]) cooc[b] = {};
        cooc[a][b] = (cooc[a][b] || 0) + 1;
        cooc[b][a] = (cooc[b][a] || 0) + 1;
      }
    }
  }
  return cooc;
}

function getCooccurrenceExpansions(stemmedTokens, cooc, topN = 3) {
  const existing = new Set(stemmedTokens);
  const expansions = [];
  for (const t of stemmedTokens) {
    if (!cooc[t]) continue;
    const related = Object.entries(cooc[t])
      .filter(([word]) => !existing.has(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);
    for (const [word] of related) {
      if (!existing.has(word)) {
        expansions.push(word);
        existing.add(word);
      }
    }
  }
  return expansions;
}

// --- BM25 Search ---

function bm25Search(memories, query, limit = 10) {
  const k1 = 1.2;
  const b = 0.75;
  const tagBoost = 2.0;
  const bigramBoost = 1.5;
  const coocWeight = 0.3;

  // Query processing: raw tokens → synonym expansion → stem → co-occurrence expansion
  const rawTokens = tokenize(query);
  const synonymExpanded = expandWithSynonyms(rawTokens);
  const stemmedQueryTokens = [...new Set(synonymExpanded.map(stem))];

  // Bigrams from original query order (stemmed)
  const orderedStems = rawTokens.map(stem);
  const queryBigrams = [];
  for (let i = 0; i < orderedStems.length - 1; i++) {
    queryBigrams.push(orderedStems[i] + "_" + orderedStems[i + 1]);
  }

  if (stemmedQueryTokens.length === 0 && queryBigrams.length === 0) return [];

  // Co-occurrence expansion from corpus
  const cooc = buildCooccurrence(memories);
  const coocTerms = getCooccurrenceExpansions(stemmedQueryTokens, cooc, 3);

  // Build stemmed document representations
  const docs = memories.map((m) => {
    const { unigrams, bigrams } = stemTokenizeWithBigrams(m.content);
    const tagTokens = (m.tags || []).flatMap((t) => tokenize(t).map(stem));
    const typeTokens = tokenize(m.type || "").map(stem);
    return {
      memory: m,
      tokens: unigrams,
      bigrams,
      tagTokens,
      allTokens: [...unigrams, ...tagTokens, ...typeTokens],
      length: unigrams.length,
    };
  });

  const N = docs.length;
  if (N === 0) return [];
  const avgdl = docs.reduce((sum, d) => sum + d.length, 0) / N;

  // Document frequency for primary query terms
  const df = {};
  for (const term of stemmedQueryTokens) {
    df[term] = docs.filter((d) => d.allTokens.includes(term)).length;
  }

  // Document frequency for co-occurrence terms
  const coocDf = {};
  for (const term of coocTerms) {
    coocDf[term] = docs.filter((d) => d.allTokens.includes(term)).length;
  }

  // Document frequency for bigrams
  const bigramDf = {};
  for (const bg of queryBigrams) {
    bigramDf[bg] = docs.filter((d) => d.bigrams.includes(bg)).length;
  }

  const scored = docs.map((doc) => {
    let score = 0;

    // Primary unigram scoring (query + synonym terms — full weight)
    for (const term of stemmedQueryTokens) {
      const termDf = df[term] || 0;
      const idf = Math.log((N - termDf + 0.5) / (termDf + 0.5) + 1);
      const freq = doc.tokens.filter((t) => t === term).length;
      const tf = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (doc.length / avgdl)));
      const tagFreq = doc.tagTokens.filter((t) => t === term).length;
      const tagTf = tagFreq > 0 ? tagBoost : 0;
      score += idf * (tf + tagTf);
    }

    // Co-occurrence scoring (reduced weight — these are associations, not equivalences)
    for (const term of coocTerms) {
      const termDf = coocDf[term] || 0;
      const idf = Math.log((N - termDf + 0.5) / (termDf + 0.5) + 1);
      const freq = doc.tokens.filter((t) => t === term).length;
      const tf = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (doc.length / avgdl)));
      score += coocWeight * idf * tf;
    }

    // Bigram scoring (stemmed)
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

// --- Jaccard similarity for dedup (stemmed) ---

function jaccardSimilarity(textA, textB) {
  const tokensA = new Set(stemTokenize(textA));
  const tokensB = new Set(stemTokenize(textB));
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
  // Scale threshold for short texts — fewer tokens means higher chance of spurious matches
  if (!noDedup) {
    const activeMemories = filterActive(data.memories, false);
    for (const existing of activeMemories) {
      const sim = jaccardSimilarity(content, existing.content);
      const newTokenCount = new Set(stemTokenize(content)).size;
      const existingTokenCount = new Set(stemTokenize(existing.content)).size;
      const minTokens = Math.min(newTokenCount, existingTokenCount);
      const supersedeThreshold = minTokens < 8 ? 0.8 : 0.6;
      if (sim >= supersedeThreshold) {
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

  // No last_accessed update — list is incidental access

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

  // No last_accessed update — recent is incidental access

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

function cmdUnrelate(args) {
  const { from, to } = args;
  if (!from || !to) {
    return { error: "Missing --from or --to" };
  }

  const data = loadMemories();
  const fromMem = data.memories.find((m) => m.id === from);

  if (!fromMem) return { error: `Memory not found: ${from}` };

  const before = (fromMem.relations || []).length;
  fromMem.relations = (fromMem.relations || []).filter(
    (r) => r.target !== to,
  );
  const after = fromMem.relations.length;

  if (before === after) {
    return { error: `No relation found from ${from} to ${to}` };
  }

  fromMem.updated = new Date().toISOString();
  saveMemories(data);
  return { unrelated: { from, to, removed: before - after } };
}

function cmdRestore(args) {
  if (!args.id) {
    return { error: "Missing --id" };
  }

  const data = loadMemories();
  const memory = data.memories.find((m) => m.id === args.id);

  if (!memory) {
    return { error: `Memory not found: ${args.id}` };
  }

  if (memory.status === "active") {
    return { error: "Memory is already active" };
  }

  memory.status = "active";
  memory.updated = new Date().toISOString();
  saveMemories(data);

  return { restored: { id: memory.id, content: memory.content, previous_status: "archived" } };
}

function cmdUpdate(args) {
  if (!args.id) {
    return { error: "Missing --id" };
  }
  if (!args.content && !args.tags && !args.type) {
    return { error: "Provide at least one of --content, --tags, or --type" };
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

  const previous = { content: memory.content, type: memory.type, tags: [...memory.tags] };
  if (args.content) memory.content = args.content;
  if (args.type) memory.type = args.type;
  if (args.tags) {
    memory.tags = args.tags.split(",").map((t) => t.trim().toLowerCase());
  }
  memory.updated = new Date().toISOString();

  saveMemories(data);
  return { updated: { id: memory.id, previous, current: { content: memory.content, type: memory.type, tags: memory.tags } } };
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

  // No last_accessed update — digest is incidental access

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
  const days = parseInt(args.days) || 120;

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
    restore: cmdRestore,
    relate: cmdRelate,
    unrelate: cmdUnrelate,
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
