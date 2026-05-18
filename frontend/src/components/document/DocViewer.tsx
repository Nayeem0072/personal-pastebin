import { marked } from "marked";
import DOMPurify from "dompurify";

interface DocViewerProps {
  html: string;
  language?: string;
  content?: string;
}

export function DocViewer({ html, language, content }: DocViewerProps) {
  if (language === "markdown" && content) {
    const rendered = DOMPurify.sanitize(marked.parse(content) as string);
    return (
      <div
        className="md-body"
        style={{ padding: "1.5rem 2rem", color: "#EEEEF5" }}
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    );
  }

  // Strip Shiki's inline background-color so the app background shows through
  const cleanHtml = html.replace(/background-color\s*:[^;"']+;?/gi, "");
  return (
    <div
      style={{ background: "#1C1C22", overflowX: "auto", padding: "1.5rem", fontFamily: "JetBrains Mono, monospace", fontSize: 13, lineHeight: 1.75 }}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
