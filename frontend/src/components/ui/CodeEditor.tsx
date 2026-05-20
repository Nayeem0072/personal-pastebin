import { useMemo, useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/language";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  minHeight?: string;
}

const LANG_MAP: Record<string, string | null> = {
  plaintext: null,
  bash: "shell",
  sh: "shell",
  typescript: "typescript",
  javascript: "javascript",
  tsx: "tsx",
  jsx: "jsx",
  python: "python",
  rust: "rust",
  go: "go",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  html: "html",
  css: "css",
  json: "json",
  yaml: "yaml",
  toml: "toml",
  sql: "sql",
  markdown: "markdown",
  dockerfile: "dockerfile",
  nginx: "nginx",
  xml: "xml",
  php: "php",
  ruby: "ruby",
  swift: "swift",
  kotlin: "kotlin",
  dart: "dart",
  vue: "vue",
  svelte: "svelte",
};

const fontTheme = EditorView.theme({
  "&": { fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", background: "transparent" },
  ".cm-content": { fontFamily: "'JetBrains Mono', monospace", caretColor: "var(--color-blue)" },
  ".cm-gutters": { background: "transparent", border: "none" },
  ".cm-placeholder": { color: "var(--color-ink-3)" },
});

export function CodeEditor({ value, onChange, language, placeholder, minHeight }: CodeEditorProps) {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute("data-theme") !== "light"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const extensions = useMemo(() => {
    const langKey = LANG_MAP[language] ?? null;
    const langExt = langKey ? loadLanguage(langKey as Parameters<typeof loadLanguage>[0]) : null;
    return [
      fontTheme,
      EditorView.lineWrapping,
      keymap.of([indentWithTab]),
      bracketMatching(),
      ...(langExt ? [langExt] : []),
    ];
  }, [language]);

  return (
    <div className="code-editor-wrapper">
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={isDark ? githubDark : githubLight}
        extensions={extensions}
        placeholder={placeholder}
        style={{ minHeight: minHeight ?? "260px" }}
        basicSetup={{ lineNumbers: false, foldGutter: false }}
      />
    </div>
  );
}
