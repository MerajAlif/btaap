import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Plus, X } from "lucide-react";

/**
 * TagPicker
 * - Multi-select tags with search
 * - Suggests from backend (/api/pdfs/tags)
 * - Creatable: add new by typing & pressing Enter or clicking "Create"
 *
 * Props:
 *   value: string[]         // selected tags
 *   onChange: (string[])    // setter
 *   placeholder?: string
 *   label?: string
 */
export default function TagPicker({ value = [], onChange, placeholder = "Search or create tags…", label = "Tags" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api("/api/pdfs/tags", { auth: false });
        setAllTags(res.tags || res.data || []);
      } catch {
        setAllTags([]);
      }
    })();
  }, []);

  const lower = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!lower) return allTags;
    return allTags.filter((t) => t.toLowerCase().includes(lower));
  }, [allTags, lower]);

  const add = (tag) => {
    const t = (tag || "").trim();
    if (!t) return;
    if (!value.includes(t)) onChange?.([...(value || []), t]);
    setQuery("");
  };

  const remove = (tag) => {
    onChange?.((value || []).filter((t) => t !== tag));
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim()) add(query.trim());
    }
  };

  return (
    <div className="space-y-2">
      {label && <div className="text-emerald-900 font-medium text-sm">{label}</div>}

      {/* Selected */}
      <div className="flex flex-wrap gap-2">
        {(value || []).map((tag) => (
          <Badge key={tag} className="bg-emerald-100 text-emerald-700">
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="ml-1 -mr-1 p-1 hover:opacity-80"
              aria-label={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        {!value?.length && (
          <span className="text-xs text-emerald-700/70">No tags selected</span>
        )}
      </div>

      {/* Combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between border-emerald-200">
            Select or create tags
            <Plus className="w-4 h-4 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[320px]">
          <Command>
            <div className="px-2 py-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className="h-9"
              />
            </div>
            <CommandList>
              <CommandEmpty className="py-4 text-sm">No matches</CommandEmpty>
              <CommandGroup heading="Suggestions">
                {filtered.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={() => add(tag)}
                    className="cursor-pointer"
                  >
                    {tag}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  disabled={!query.trim()}
                  onSelect={() => add(query.trim())}
                  className="cursor-pointer text-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create “{query.trim() || "…"}”
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
