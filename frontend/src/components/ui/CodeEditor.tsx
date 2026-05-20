import { useMemo, useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/language";
import { vim } from "@replit/codemirror-vim";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  minHeight?: string;
  onPaste?: (text: string) => void;
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

export function CodeEditor({ value, onChange, language, placeholder, minHeight, onPaste }: CodeEditorProps) {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute("data-theme") !== "light"
  );
  const [vimMode, setVimMode] = useState(
    () => localStorage.getItem("clippr-vim-mode") === "true"
  );

  useEffect(() => {
    const themeObserver = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const storageHandler = (e: StorageEvent) => {
      if (e.key === "clippr-vim-mode") setVimMode(e.newValue === "true");
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      themeObserver.disconnect();
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const onPasteRef = useRef(onPaste);
  useEffect(() => { onPasteRef.current = onPaste; });

  const pasteExt = useMemo(() => EditorView.domEventHandlers({
    paste(event) {
      const text = event.clipboardData?.getData("text/plain") ?? "";
      if (text) onPasteRef.current?.(text);
    },
  }), []);

  const extensions = useMemo(() => {
    const langKey = LANG_MAP[language] ?? null;
    const langExt = langKey ? loadLanguage(langKey as Parameters<typeof loadLanguage>[0]) : null;
    return [
      fontTheme,
      EditorView.lineWrapping,
      bracketMatching(),
      ...(vimMode ? [vim()] : [keymap.of([indentWithTab])]),
      ...(langExt ? [langExt] : []),
    ];
  }, [language, vimMode]);

  return (
    <div className="code-editor-wrapper">
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={isDark ? githubDark : githubLight}
        extensions={[...extensions, pasteExt]}
        placeholder={placeholder}
        style={{ minHeight: minHeight ?? "260px" }}
        basicSetup={{ lineNumbers: false, foldGutter: false }}
      />
    </div>
  );
}
