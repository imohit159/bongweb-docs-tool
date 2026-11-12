"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FilePen, FileText, FolderOpen } from "lucide-react";
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableSearch,
  rowActionsColumn,
  useDataTable,
  type ColumnDef,
} from "@/components/ui/data-table";
import { Banner, BannerTitle } from "@/components/ui/banner";
import { MenuItem } from "@/components/ui/menu-item";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Tabs, TabsItem } from "@/components/ui/tabs";
import {
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUSES,
  PROPOSAL_TYPE_DETAILS,
  PROPOSAL_TYPES,
  canRevise,
  formatProposalNumber,
  type ProposalStatus,
  type ProposalSummary,
  type ProposalType,
} from "../domain";
import { formatDocDate } from "@/lib/dates";
import { formatInr } from "@/lib/money";
import { reviseProposalAction } from "../actions";
import { ProposalStatusBadge } from "./proposal-status-badge";
import { ProposalTypeChooser } from "./proposal-type-chooser";

const ALL = "all";
const TYPE_TABS: readonly (ProposalType | typeof ALL)[] = [ALL, ...PROPOSAL_TYPES];

const columns: ColumnDef<ProposalSummary>[] = [
  {
    id: "number",
    accessorFn: (row) => formatProposalNumber(row.type, row.sequence, row.version),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Number" />,
    meta: { label: "Number", filter: false },
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    meta: { label: "Title", lines: 1, className: "w-full", filter: false },
  },
  {
    accessorKey: "clientName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    meta: { label: "Client", lines: 1, filter: false },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => PROPOSAL_TYPE_DETAILS[row.original.type].label,
    enableGlobalFilter: false,
    meta: { label: "Type", filter: false },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <ProposalStatusBadge status={row.original.status} />,
    enableGlobalFilter: false,
    meta: { label: "Status", filter: false },
  },
  {
    accessorKey: "issueDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Issued" />,
    cell: ({ row }) =>
      row.original.issueDate ? (
        formatDocDate(row.original.issueDate)
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    enableGlobalFilter: false,
    meta: { label: "Issued", filter: false },
  },
  {
    accessorKey: "totalPaise",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
    cell: ({ row }) =>
      row.original.totalPaise === null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        formatInr(row.original.totalPaise)
      ),
    enableGlobalFilter: false,
    meta: { label: "Total", filter: false, className: "text-right tabular-nums" },
  },
];

export function ProposalsList({ proposals }: { proposals: ProposalSummary[] }) {
  if (proposals.length === 0) return <ProposalsEmptyState />;
  return <ProposalsTable proposals={proposals} />;
}

function ProposalsHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Proposals</h1>
        <p className="text-muted-foreground text-sm">
          Quotations, project and retainer proposals, and change requests.
        </p>
      </div>
      <ProposalTypeChooser />
    </div>
  );
}

function ProposalsEmptyState() {
  return (
    <div className="flex flex-col gap-8">
      <ProposalsHeader />
      <section className="border-border flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
        <FileText aria-hidden className="text-muted-foreground size-6" strokeWidth={1.5} />
        <h2 className="font-medium">No offers yet</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          Pick the template that matches the client&apos;s situation. You can revise it later without starting
          over.
        </p>
        <ProposalTypeChooser />
      </section>
    </div>
  );
}

function ProposalsTable({ proposals }: { proposals: ProposalSummary[] }) {
  "use no memo";
  const router = useRouter();
  const [typeTab, setTypeTab] = useState(0);
  const [status, setStatus] = useState<ProposalStatus | typeof ALL>(ALL);
  const [error, setError] = useState<string | null>(null);

  async function revise(id: string) {
    setError(null);
    const result = await reviseProposalAction(id).catch(() => null);
    if (result?.ok) router.push(`/proposals/${result.value.id}`);
    else setError("Could not create the revision. It may already have been revised; refresh and try again.");
  }

  const table = useDataTable({
    data: proposals,
    columns: [
      ...columns,
      rowActionsColumn<ProposalSummary>(
        (row) => (
          <>
            <MenuItem
              index={0}
              icon={FolderOpen}
              label="Open"
              onSelect={() => router.push(`/proposals/${row.original.id}`)}
            />
            <MenuItem
              index={1}
              icon={FilePen}
              label="Revise"
              disabled={!canRevise(row.original.status)}
              onSelect={() => revise(row.original.id)}
            />
            <MenuItem
              index={2}
              icon={Download}
              label="Download PDF"
              onSelect={() => router.push(`/proposals/${row.original.id}?download=1`)}
            />
          </>
        ),
        { label: "Offer actions" },
      ),
    ],
    initialState: { sorting: [{ id: "issueDate", desc: true }] },
  });

  function filterBy(columnId: "type" | "status", value: string) {
    table
      .getColumn(columnId)
      ?.setFilterValue(value === ALL ? undefined : { kind: "options", values: [value] });
  }

  return (
    <div className="flex flex-col gap-6">
      <ProposalsHeader />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          selectedIndex={typeTab}
          onSelect={(index) => {
            setTypeTab(index);
            filterBy("type", TYPE_TABS[index]);
          }}
          idPrefix="proposal-type"
        >
          {TYPE_TABS.map((type, index) => (
            <TabsItem
              key={type}
              index={index}
              label={type === ALL ? "All" : PROPOSAL_TYPE_DETAILS[type].pluralLabel}
            />
          ))}
        </Tabs>
        <div className="flex items-center gap-2">
          <DataTableSearch table={table} placeholder="Search title, client, number…" collapsible={false} />
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as ProposalStatus | typeof ALL);
              filterBy("status", value);
            }}
          >
            <SelectTrigger aria-label="Filter by status" className="w-36" />
            <SelectContent>
              <SelectItem index={0} value={ALL}>
                All statuses
              </SelectItem>
              {PROPOSAL_STATUSES.map((value, index) => (
                <SelectItem key={value} index={index + 1} value={value}>
                  {PROPOSAL_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {error && (
        <Banner status="warning" dismissible onDismiss={() => setError(null)}>
          <BannerTitle>{error}</BannerTitle>
        </Banner>
      )}
      <DataTable
        table={table}
        onRowClick={(row) => router.push(`/proposals/${row.original.id}`)}
        empty={{ title: "No matching offers", description: "Try another type, status or search." }}
      />
      <DataTablePagination table={table} />
    </div>
  );
}
