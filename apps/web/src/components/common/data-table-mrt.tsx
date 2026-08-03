"use client";

import type { TableCellProps } from "@mui/material";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_RowData,
  type MRT_TableOptions,
  useMaterialReactTable,
} from "material-react-table";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { cn } from "@/lib/utils";

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
  tableOptions?: Partial<MRT_TableOptions<TData>>;
};

function resolveColumnAlign(meta: unknown): TableCellProps["align"] {
  return (meta as { align?: TableCellProps["align"] } | undefined)?.align === "right"
    ? "right"
    : "left";
}

const headCellClassName =
  "bg-muted! text-muted-foreground! border-border! text-xs! font-semibold! uppercase! tracking-wide!";

const bodyCellClassName = "border-border! text-sm! align-middle!";

const pinnedCellClassName = "bg-card!";

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
  fluidColumnsUntil?: number,
): Partial<
  MRT_TableOptions<TData>
> {
  const getFluidCellSizing = (visibleColumnCount: number) => {
    if (!fluidColumnsUntil || visibleColumnCount > fluidColumnsUntil) return {};
    const width = `${100 / Math.max(visibleColumnCount, 1)}%`;
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
    muiSearchTextFieldProps: {
      placeholder: "Search rows",
      size: "small",
      className: "min-w-0 md:min-w-60",
    },
    muiTableBodyCellProps: ({ cell, column, table }) => ({
      align: resolveColumnAlign(cell.column.columnDef.meta),
      className: cn(
        bodyCellClassName,
        column.getIsPinned() ? pinnedCellClassName : undefined,
      ),
      sx: getFluidCellSizing(table.getVisibleLeafColumns().length),
    }),
    muiTableContainerProps: {
      className: "max-h-[calc(100vh-22rem)] overflow-auto",
    },
    muiTableHeadCellProps: ({ column, table }) => ({
      align: resolveColumnAlign(column.columnDef.meta),
      className: cn(
        headCellClassName,
        column.getIsPinned() ? pinnedCellClassName : undefined,
      ),
      sx: getFluidCellSizing(table.getVisibleLeafColumns().length),
    }),
    muiTablePaperProps: {
      elevation: 0,
      className: "bg-card border-border overflow-hidden rounded-xl border shadow-none",
    },
    muiTopToolbarProps: {
      className: "bg-card border-border min-h-14 border-b",
    },
    muiTableProps: ({ table }) => {
      const visibleColumnCount = table.getVisibleLeafColumns().length;
      const fluid = Boolean(
        fluidColumnsUntil && visibleColumnCount <= fluidColumnsUntil,
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
  tableOptions,
}: DataTableMRTProps<TData>) {
  const surfaceProps = getMrtSurfaceProps<TData>(fluidColumnsUntil);
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
    renderTopToolbarCustomActions,
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
    <div className="space-y-3">
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
