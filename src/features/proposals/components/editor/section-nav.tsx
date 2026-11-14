"use client";

import { DocumentSectionNav } from "@/features/documents/components/section-nav";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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
    <DocumentSectionNav
      sections={sections}
      active={active}
      onSelect={setActive}
      bySection={bySection}
      className={className}
    />
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
