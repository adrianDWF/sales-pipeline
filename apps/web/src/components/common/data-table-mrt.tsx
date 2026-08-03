"use client";

import type { TableCellProps } from "@mui/material";
import { Search } from "lucide-react";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_RowData,
  type MRT_TableInstance,
  type MRT_TableOptions,
  useMaterialReactTable,
} from "material-react-table";
import { useSyncExternalStore } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Input } from "@/components/ui/input";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { cn } from "@/lib/utils";

export type MrtColumnMeta = {
  align?: TableCellProps["align"];
  /** Share of table width when fluid layout is active (default 1). */
  fluidWeight?: number;
};

export type DataTableMRTProps<TData extends MRT_RowData> = {
  columns: MRT_ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  enableGlobalFilter?: boolean;
  enableColumnFilters?: boolean;
  enablePagination?: boolean;
  enableColumnPinning?: boolean;
  enableColumnResizing?: boolean;
  enableHiding?: boolean;
  enableRowActions?: boolean;
  renderRowActions?: MRT_TableOptions<TData>["renderRowActions"];
  renderTopToolbarCustomActions?: MRT_TableOptions<TData>["renderTopToolbarCustomActions"];
  initialState?: MRT_TableOptions<TData>["initialState"];
  manualPagination?: boolean;
  rowCount?: number;
  onPaginationChange?: MRT_TableOptions<TData>["onPaginationChange"];
  state?: MRT_TableOptions<TData>["state"];
  getRowId?: MRT_TableOptions<TData>["getRowId"];
  muiTableBodyRowProps?: MRT_TableOptions<TData>["muiTableBodyRowProps"];
  fluidColumnsUntil?: number;
  /** Enable weighted column widths from column meta.fluidWeight at this min viewport width. */
  fluidLayoutMinWidth?: number;
  tableOptions?: Partial<MRT_TableOptions<TData>>;
};

function useMinWidth(minWidth: number) {
  return useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia(`(min-width: ${minWidth}px)`);
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(`(min-width: ${minWidth}px)`).matches,
    () => false,
  );
}

function resolveColumnMeta(meta: unknown): MrtColumnMeta {
  return (meta as MrtColumnMeta | undefined) ?? {};
}

const headCellClassName =
  "bg-muted! text-muted-foreground! border-border! text-xs! font-semibold! uppercase! tracking-wide!";

const bodyCellClassName = "border-border! text-sm! align-middle!";

const pinnedCellClassName = "bg-card!";

/** MUI v9 + material-react-table still pass deprecated InputProps to TextField. */
function MrtGlobalFilterInput<TData extends MRT_RowData>({
  table,
}: {
  table: MRT_TableInstance<TData>;
}) {
  const value = String(table.getState().globalFilter ?? "");

  return (
    <div className="relative min-w-0 md:min-w-60">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        aria-label="Search rows"
        className="pl-8"
        placeholder="Search rows"
        value={value}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
      />
    </div>
  );
}

/** MRT calls MUI lighten/darken on these — must be parseable colors, never CSS variables. */
const mrtThemeColors = {
  baseBackgroundColor: "#ffffff",
  cellNavigationOutlineColor: "#a3a3a3",
  draggingBorderColor: "#171717",
  menuBackgroundColor: "#ffffff",
  pinnedRowBackgroundColor: "#f5f5f5",
  selectedRowBackgroundColor: "rgba(23, 23, 23, 0.08)",
} as const;

export function getMrtSurfaceProps<TData extends MRT_RowData>(
  options: {
    fluidColumnsUntil?: number;
    fluidLayoutActive?: boolean;
  } = {},
): Partial<MRT_TableOptions<TData>> {
  const { fluidColumnsUntil, fluidLayoutActive = false } = options;

  const getFluidCellSizing = (
    column: { columnDef: { meta?: unknown }; id: string },
    visibleColumnCount: number,
    visibleColumns: { columnDef: { meta?: unknown }; id: string }[],
  ) => {
    if (!fluidLayoutActive || !fluidColumnsUntil || visibleColumnCount > fluidColumnsUntil) {
      return {};
    }

    const weights = visibleColumns.map(
      (col) => resolveColumnMeta(col.columnDef.meta).fluidWeight ?? 1,
    );
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const columnIndex = visibleColumns.findIndex((col) => col.id === column.id);
    const weight = weights[columnIndex] ?? 1;
    const width = `${(weight / totalWeight) * 100}%`;

    return { width, minWidth: 0, maxWidth: width };
  };

  return {
    mrtTheme: mrtThemeColors,
    muiBottomToolbarProps: {
      className: "bg-card border-border min-h-14 border-t",
    },
    muiPaginationProps: {
      rowsPerPageOptions: [10, 25, 50, 100],
      SelectProps: {
        size: "small",
      },
      shape: "rounded",
      showRowsPerPage: true,
      variant: "outlined",
    },
    muiTableBodyCellProps: ({ cell, column, table }) => {
      const visibleColumns = table.getVisibleLeafColumns();
      return {
        align: resolveColumnMeta(cell.column.columnDef.meta).align === "right" ? "right" : "left",
        className: cn(
          bodyCellClassName,
          column.getIsPinned() ? pinnedCellClassName : undefined,
        ),
        sx: getFluidCellSizing(column, visibleColumns.length, visibleColumns),
      };
    },
    muiTableContainerProps: {
      className: "max-h-[calc(100vh-22rem)] w-full overflow-auto",
    },
    muiTableHeadCellProps: ({ column, table }) => {
      const visibleColumns = table.getVisibleLeafColumns();
      return {
        align: resolveColumnMeta(column.columnDef.meta).align === "right" ? "right" : "left",
        className: cn(
          headCellClassName,
          column.getIsPinned() ? pinnedCellClassName : undefined,
        ),
        sx: getFluidCellSizing(column, visibleColumns.length, visibleColumns),
      };
    },
    muiTablePaperProps: {
      elevation: 0,
      className: "bg-card border-border w-full overflow-hidden rounded-xl border shadow-none",
    },
    muiTopToolbarProps: {
      className: "bg-card border-border min-h-14 border-b",
    },
    muiTableProps: ({ table }) => {
      const visibleColumnCount = table.getVisibleLeafColumns().length;
      const fluid = Boolean(
        fluidLayoutActive && fluidColumnsUntil && visibleColumnCount <= fluidColumnsUntil,
      );
      return {
        sx: {
          tableLayout: "fixed",
          width: fluid ? "100%" : table.getTotalSize(),
          minWidth: fluid ? "100%" : table.getTotalSize(),
        },
      };
    },
  };
}

export function DataTableMRT<TData extends MRT_RowData>(props: DataTableMRTProps<TData>) {
  const mounted = useClientMounted();

  if (!mounted) {
    return (
      <div
        aria-hidden
        className="bg-card border-border h-[min(24rem,calc(100vh-22rem))] animate-pulse rounded-xl border"
      />
    );
  }

  return <DataTableMRTClient {...props} />;
}

function DataTableMRTClient<TData extends MRT_RowData>({
  columns,
  data,
  isLoading = false,
  isError = false,
  errorMessage,
  emptyMessage = "No records to display.",
  enableGlobalFilter = false,
  enableColumnFilters = false,
  enablePagination = true,
  enableColumnPinning = true,
  enableColumnResizing = true,
  enableHiding = true,
  enableRowActions = false,
  renderRowActions,
  renderTopToolbarCustomActions,
  initialState,
  manualPagination = false,
  rowCount,
  onPaginationChange,
  state,
  getRowId,
  muiTableBodyRowProps,
  fluidColumnsUntil,
  fluidLayoutMinWidth = 1200,
  tableOptions,
}: DataTableMRTProps<TData>) {
  const fluidLayoutActive = useMinWidth(fluidLayoutMinWidth);
  const surfaceProps = getMrtSurfaceProps<TData>({
    fluidColumnsUntil,
    fluidLayoutActive,
  });
  const resolvedErrorMessage = errorMessage ?? "Unable to load table data.";

  const table = useMaterialReactTable<TData>({
    columns,
    data,
    enableColumnActions: false,
    enableColumnFilters,
    enableColumnPinning,
    enableColumnResizing,
    enableGlobalFilter,
    enableHiding,
    enablePagination,
    enableRowActions,
    enableSorting: true,
    enableStickyHeader: true,
    getRowId,
    initialState: {
      density: "comfortable",
      pagination: { pageIndex: 0, pageSize: 25 },
      showGlobalFilter: enableGlobalFilter,
      ...initialState,
    },
    manualPagination,
    muiTableBodyRowProps,
    onPaginationChange,
    positionActionsColumn: "last",
    positionGlobalFilter: enableGlobalFilter ? "none" : undefined,
    renderTopToolbarCustomActions: enableGlobalFilter
      ? ({ table }) => (
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {renderTopToolbarCustomActions?.({ table })}
            <MrtGlobalFilterInput table={table} />
          </div>
        )
      : renderTopToolbarCustomActions,
    renderEmptyRowsFallback: () => (
      <div className="px-4 py-12">
        <EmptyState
          title="No rows found"
          description={emptyMessage}
          className="border-0 shadow-none"
        />
      </div>
    ),
    renderRowActions,
    rowCount,
    state: {
      isLoading,
      showProgressBars: isLoading,
      ...state,
    },
    ...surfaceProps,
    ...tableOptions,
  });

  return (
    <div className="w-full min-w-0 space-y-3">
      {isError ? (
        <ErrorState
          title="Table unavailable"
          description={resolvedErrorMessage}
        />
      ) : null}
      <MaterialReactTable table={table} />
    </div>
  );
}
