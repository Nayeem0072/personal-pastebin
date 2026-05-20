export function detectLanguage(text: string): string | null {
  const t = text.trimStart();

  // JSON — only attempt if it looks like an object or array
  if (t.startsWith("{") || t.startsWith("[")) {
    try { JSON.parse(text); return "json"; } catch {}
  }

  // Shebangs
  if (t.startsWith("#!/usr/bin/env python") || t.startsWith("#!/usr/bin/python")) return "python";
  if (t.startsWith("#!/bin/bash") || t.startsWith("#!/usr/bin/env bash")) return "bash";
  if (t.startsWith("#!/bin/sh")) return "sh";

  // Dockerfile
  if (/^FROM\s+\S/m.test(t) && /^(RUN|CMD|COPY|ADD|EXPOSE|ENV)\s/m.test(t)) return "dockerfile";

  // HTML
  if (/^<!DOCTYPE\s+html/i.test(t) || /^<html[\s>]/i.test(t)) return "html";

  // SQL
  if (/^\s*(SELECT\s|INSERT\s+INTO\s|UPDATE\s|DELETE\s+FROM\s|CREATE\s+TABLE\s|ALTER\s+TABLE\s|DROP\s+TABLE\s)/i.test(t)) return "sql";

  // Go
  if (/^package\s+\w+/.test(t) && /\bfunc\s+\w+/.test(t)) return "go";

  // Rust
  if (/\bfn\s+\w+/.test(t) && /\blet\s+(mut\s+)?\w+/.test(t) && /->/.test(t)) return "rust";

  // Java
  if (/\bpublic\s+class\s+\w+/.test(t) || /\bpublic\s+static\s+void\s+main\b/.test(t)) return "java";

  // C / C++ — #include is the key signal
  if (/^#include\s*[<"]/.test(t)) {
    return /\bstd::|\btemplate\s*</.test(t) ? "cpp" : "c";
  }

  // Python (without shebang): def/class/import at line start, no semicolons
  if (/^(def |class |import |from \S+ import )/m.test(t) && !t.includes(";")) return "python";

  // TypeScript: type annotations, interface, type aliases
  if (/\b(interface|type)\s+\w+\s*[={<(]/.test(t) || /:\s*(string|number|boolean|void|any)\b/.test(t)) return "typescript";

  // JavaScript: const/let/var, arrow functions, ESM
  if (/\b(const|let|var)\s+\w+\s*=/.test(t) || /=>\s*[{(]/.test(t) || /^(export default|export \{|import \{)/m.test(t)) return "javascript";

  // YAML: starts with --- or bare key: value lines (no braces or semicolons)
  if (/^---/.test(t) || (/^[\w-]+:\s*.+$/m.test(t) && !t.includes("{") && !t.includes(";"))) return "yaml";

  // Shell without shebang
  if (/^(echo|export|cd|ls|grep|sed|awk|curl|wget)\s/m.test(t)) return "bash";

  return null;
}
