"use client";

import { useState } from "react";
import { IconFileText, IconFolderOpen } from "@tabler/icons-react";
import { MenuItem } from "@/components/ui/menu-item";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Tabs, TabsItem } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableSearch,
  useDataTable,
  rowActionsColumn,
  type ColumnDef,
} from "@/components/ui/data-table";
import { formatDocDate } from "@/lib/dates";
import { formatInr } from "@/lib/money";
import {
  AGREEMENT_STATUS_LABELS,
  AGREEMENT_STATUSES,
  AGREEMENT_TYPES,
  type AgreementType,
  AGREEMENT_TYPE_LABELS,
  formatAgreementNumber,
  type AgreementSummary,
  type AgreementStatus,
} from "../domain";
import type { AcceptedAgreementProposal } from "../service";
import { NewAgreement } from "./new-agreement";

export function AgreementStatusBadge({ status }: { status: AgreementStatus }) {
  return (
    <Badge variant="dashed" color={status === "signed" ? "green" : status === "sent" ? "blue" : "gray"}>
      {AGREEMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
const columns: ColumnDef<AgreementSummary>[] = [
  {
    id: "number",
    accessorFn: (r) => formatAgreementNumber(r.sequence),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Number" />,
    meta: { label: "Number", filter: false },
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    meta: { label: "Title", filter: false, className: "w-full", lines: 1 },
  },
  {
    accessorKey: "clientName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    meta: { label: "Client", lines: 1, filter: false },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => AGREEMENT_TYPE_LABELS[row.original.type],
    enableGlobalFilter: false,
    meta: { label: "Type", filter: false },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <AgreementStatusBadge status={row.original.status} />,
    enableGlobalFilter: false,
    meta: { label: "Status", filter: false },
  },
  {
    accessorKey: "issueDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Issued" />,
    cell: ({ row }) => (row.original.issueDate ? formatDocDate(row.original.issueDate) : "—"),
    meta: { label: "Date", filter: false },
  },
  {
    accessorKey: "totalPaise",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
    cell: ({ row }) => formatInr(row.original.totalPaise),
    meta: { label: "Fee", filter: false, className: "text-right tabular-nums" },
  },
];
export function AgreementsList({
  agreements,
  sources,
}: {
  agreements: AgreementSummary[];
  sources: AcceptedAgreementProposal[];
}) {
  "use no memo";
  const router = useRouter();
  const [typeTab, setTypeTab] = useState(0);
  const [status, setStatus] = useState("all");
  const types: readonly (AgreementType | "all")[] = ["all", ...AGREEMENT_TYPES];
  const table = useDataTable({
    data: agreements,
    columns: [
      ...columns,
      rowActionsColumn<AgreementSummary>(
        (row) => (
          <MenuItem
            index={0}
            icon={IconFolderOpen}
            label="Open"
            onSelect={() => router.push(`/agreements/${row.original.id}`)}
          />
        ),
        { label: "Agreement actions" },
      ),
    ],
    initialState: { sorting: [{ id: "issueDate", desc: true }] },
  });
  function filterBy(columnId: "type" | "status", value: string) {
    table
      .getColumn(columnId)
      ?.setFilterValue(value === "all" ? undefined : { kind: "options", values: [value] });
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Agreements</h1>
          <p className="text-muted-foreground text-sm">
            Project and retainer service agreements from accepted proposals.
          </p>
        </div>
        <NewAgreement sources={sources} />
      </div>
      {agreements.length === 0 ? (
        <section className="border-border flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <IconFileText aria-hidden className="text-muted-foreground size-6" strokeWidth={1.5} />
          <h2 className="font-medium">No agreements yet</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            Create a service agreement from an accepted project or retainer proposal and the option agreed
            with your client.
          </p>
          <NewAgreement sources={sources} />
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              selectedIndex={typeTab}
              onSelect={(index) => {
                setTypeTab(index);
                filterBy("type", types[index]);
              }}
              idPrefix="agreement-type"
            >
              {types.map((type, index) => (
                <TabsItem
                  key={type}
                  index={index}
                  label={type === "all" ? "All" : type === "project" ? "Projects" : "Retainers"}
                />
              ))}
            </Tabs>
            <div className="flex flex-wrap items-center gap-2">
              <DataTableSearch
                table={table}
                placeholder="Search title, client, number…"
                collapsible={false}
              />
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  filterBy("status", value);
                }}
              >
                <SelectTrigger aria-label="Filter by status" className="w-36" />
                <SelectContent>
                  <SelectItem index={0} value="all">
                    All statuses
                  </SelectItem>
                  {AGREEMENT_STATUSES.map((value, index) => (
                    <SelectItem key={value} index={index + 1} value={value}>
                      {AGREEMENT_STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DataTable
            table={table}
            onRowClick={(row) => router.push(`/agreements/${row.original.id}`)}
            empty={{
              title: agreements.length ? "No matching agreements" : "No agreements yet",
              description: agreements.length
                ? "Try another type, status or search."
                : "Create an agreement from an accepted project or retainer proposal.",
            }}
          />
          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
}
