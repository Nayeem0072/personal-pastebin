import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";
import { SUPPORTED_LANGUAGES, PRIVACY_OPTIONS } from "../../lib/constants";
import type { Group } from "../../api/groups";

interface DocEditorProps {
  title: string;
  content: string;
  language: string;
  description: string;
  privacy: string;
  groupId: number | null;
  userGroups: Group[];
  onChange: (field: string, value: string | number | null) => void;
}

export function DocEditor({
  title, content, language, description, privacy, groupId, userGroups, onChange,
}: DocEditorProps) {
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

      <div className="flex flex-wrap gap-3">
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
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Add a description..."
            value={description}
            onChange={(e) => onChange("description", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
