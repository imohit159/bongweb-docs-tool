"use client";

import { Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getProposalTemplate } from "../../templates";
import { useEditor } from "./editor-store";
import { useMissingFields } from "./use-editor-derived";

function useSections() {
  const type = useEditor((s) => s.proposal.type);
  const active = useEditor((s) => s.activeSection);
  const setActive = useEditor((s) => s.setActiveSection);
  const { bySection } = useMissingFields();
  return { sections: getProposalTemplate(type).sections, active, setActive, bySection };
}

export function SectionNav({ className }: { className?: string }) {
  const { sections, active, setActive, bySection } = useSections();
  return (
    <nav
      aria-label="Sections"
      className={cn("min-h-0 flex-col gap-0.5 overflow-y-auto py-3 pr-2 pl-3", className)}
    >
      <p className="text-muted-foreground px-2 pb-2 text-xs font-medium">Sections</p>
      {sections.map((section) => {
        const missing = bySection.get(section.id) ?? 0;
        const isActive = section.id === active;
        return (
          <button
            key={section.id}
            type="button"
            aria-current={isActive ? "step" : undefined}
            onClick={() => setActive(section.id)}
            title={section.label}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              isActive
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{section.label}</span>
            {missing ? (
              <span
                className="bg-primary/25 text-foreground rounded-full px-1.5 text-[0.7rem] leading-5 tabular-nums"
                aria-label={`${missing} required ${missing === 1 ? "field" : "fields"} empty`}
              >
                {missing}
              </span>
            ) : (
              <Check aria-label="Complete" className="text-muted-foreground size-3.5 shrink-0" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

export function SectionSelect({ className }: { className?: string }) {
  const { sections, active, setActive, bySection } = useSections();
  return (
    <div className={className}>
      <Select value={active} onValueChange={setActive}>
        <SelectTrigger aria-label="Section" className="w-full" />
        <SelectContent>
          {sections.map((section, index) => {
            const missing = bySection.get(section.id) ?? 0;
            return (
              <SelectItem key={section.id} index={index} value={section.id}>
                {section.label}
                {missing ? ` · ${missing} to fill` : ""}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
