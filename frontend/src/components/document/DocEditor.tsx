import { useState } from "react";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";
import { SUPPORTED_LANGUAGES, PRIVACY_OPTIONS } from "../../lib/constants";
import { setDefaultLanguage, setDefaultPrivacy } from "../../lib/pasteDefaults";
import type { Group } from "../../api/groups";

interface DocEditorProps {
  title: string;
  content: string;
  language: string;
  privacy: string;
  groupId: number | null;
  userGroups: Group[];
  showSetDefault?: boolean;
  onSetDefault?: () => void;
  onChange: (field: string, value: string | number | null) => void;
}

export function DocEditor({
  title, content, language, privacy, groupId, userGroups, showSetDefault, onSetDefault, onChange,
}: DocEditorProps) {
  const [defaultSaved, setDefaultSaved] = useState(false);

  function handleSetDefault() {
    setDefaultLanguage(language);
    setDefaultPrivacy(privacy);
    setDefaultSaved(true);
    setTimeout(() => setDefaultSaved(false), 2000);
    onSetDefault?.();
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Untitled paste"
        value={title}
        onChange={(e) => onChange("title", e.target.value)}
        className="text-[15px] font-medium bg-transparent border-transparent hover:border-border focus:!border-blue/40 px-0 rounded-none border-b"
      />

      <Textarea
        value={content}
        onChange={(e) => onChange("content", e.target.value)}
        placeholder="// Paste your code, config, or text here..."
        className="min-h-[260px] sm:min-h-[440px] text-[13px] leading-7"
        required
      />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="w-40">
          <Select
            value={language}
            options={SUPPORTED_LANGUAGES}
            onChange={(e) => onChange("language", e.target.value)}
          />
        </div>
        <div className="w-36">
          <Select
            value={privacy}
            options={PRIVACY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(e) => onChange("privacy", e.target.value)}
          />
        </div>
        {privacy === "group" && (
          <div className="w-44">
            <Select
              value={groupId?.toString() ?? ""}
              options={[
                { value: "", label: "Select group..." },
                ...userGroups.map((g) => ({ value: String(g.id), label: g.name })),
              ]}
              onChange={(e) => onChange("groupId", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        )}
        {showSetDefault && (
          <button
            type="button"
            onClick={handleSetDefault}
            style={{
              background: "none",
              border: "none",
              padding: "0 4px",
              cursor: "pointer",
              fontSize: 12,
              color: defaultSaved ? "#4ade80" : "#555568",
              transition: "color 0.2s",
            }}
          >
            {defaultSaved ? "✓ Defaults saved" : "Set as default"}
          </button>
        )}
      </div>
    </div>
  );
}
