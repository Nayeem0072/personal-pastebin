import { createHighlighter, type Highlighter } from "shiki";

let highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: [], // load on demand
    });
  }
  return highlighter;
}

// Languages we explicitly support (kept small for startup speed; Shiki lazy-loads)
const SUPPORTED_LANGS = new Set([
  "plaintext", "typescript", "javascript", "tsx", "jsx",
  "python", "rust", "go", "java", "c", "cpp", "csharp",
  "html", "css", "json", "yaml", "toml", "sql", "bash", "sh",
  "markdown", "dockerfile", "nginx", "xml", "php", "ruby",
  "swift", "kotlin", "dart", "vue", "svelte",
]);

export async function highlightCode(code: string, lang: string): Promise<string> {
  const hl = await getHighlighter();
  const safeLang = SUPPORTED_LANGS.has(lang) ? lang : "plaintext";

  // Load language if not yet loaded
  const loaded = hl.getLoadedLanguages();
  if (!loaded.includes(safeLang as any)) {
    try {
      await hl.loadLanguage(safeLang as any);
    } catch {
      // fallback to plaintext
      return hl.codeToHtml(code, { lang: "plaintext", theme: "github-dark", colorReplacements: { "#24292e": "transparent" } });
    }
  }

  return hl.codeToHtml(code, {
    lang: safeLang,
    theme: "github-dark",
    colorReplacements: { "#24292e": "transparent" },
  });
}

export { SUPPORTED_LANGS };
