"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";

import { format } from "date-fns";
//import * as XLSX from "xlsx";
import * as XLSX from "xlsx-js-style";

// icons
import { ArrowsClockwise as ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { paginationStore } from "@src/app/stores/paginationStore";
import { IPagination } from "@src/types/common";
import { motion } from "framer-motion";
import { Plus as PlusIcon, Search, Upload as UploadIcon } from "lucide-react";
import AnimatedDivDown from "../animated_components/AnimatedDivDown";
import AddButton from "../ui/AddButton";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

// custom components (you should already have them in your project)

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  EnableIsComplete?: boolean;
  IsComplete?: (val: boolean) => void;
  IsCompleteValue?: boolean;
  ExcelBulkUpload?: boolean;
  ExcelTitle?: string;
  ExcelUploadData?: () => void;
  ExcelReUploadData?: () => void;
  excelColorFromColumnName?: string;
  excelColorTargetColumnNames?: string[];
  excelSumColumnNames?: string[];
  excelShowTotal?: boolean;
  EnableDialog?: boolean;
  ButtonTitle?: string;
  openDialog?: () => void;
  defaultInVisibleColumns?: string[];
  EnableFilter?: boolean;
  ColumnsToBeFilterd?: string;
  PlaceHolder?: string;
  totalCount?: number;
  isLoading?: boolean;
  lastPage?: number;
  paginationData?: Partial<IPagination>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  paginationData,
  title,
  EnableIsComplete,
  IsComplete,
  IsCompleteValue = false,
  ExcelBulkUpload = false,
  ExcelTitle = "Table-Data.xlsx",
  ExcelUploadData,
  ExcelReUploadData,
  excelColorFromColumnName,
  excelColorTargetColumnNames,
  excelSumColumnNames,
  excelShowTotal = false,
  EnableDialog = false,
  ButtonTitle,
  defaultInVisibleColumns,
  openDialog,
  EnableFilter = false,
  ColumnsToBeFilterd,
  PlaceHolder,
}: DataTableProps<TData, TValue>) {
  console.log("Dialog", EnableDialog);
  console.log("ExcelBulkUpload", ExcelBulkUpload);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  // Helper function to safely extract column ID
  const getColumnId = (
    column: ColumnDef<TData, TValue>
  ): string | undefined => {
    // Try to get the ID directly
    if (column.id) return column.id;

    // Try to access accessorKey if it exists
    if ("accessorKey" in column && typeof column.accessorKey === "string") {
      return column.accessorKey;
    }

    // Return undefined if no ID could be determined
    return undefined;
  };

  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  const setSearchTerm = paginationStore((state) => state.setsearchValue);
  const searchTerm = paginationStore((state) => state.searchValue);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(() => {
      const initialState: VisibilityState = {};

      if (defaultInVisibleColumns) {
        // Create a set for faster lookup
        const visibleColumnsSet = new Set(defaultInVisibleColumns);

        // Initialize all columns as hidden first
        columns.forEach((column) => {
          // Safely get the column id
          const id = getColumnId(column);
          if (id) initialState[id] = false;
        });

        // Then set the default InVisible columns
        columns.forEach((column) => {
          const id = getColumnId(column);
          if (id && !visibleColumnsSet.has(id)) {
            initialState[id] = true;
          }
        });
      } else {
        // If no defaultVisibleColumns provided, show all columns
        columns.forEach((column) => {
          const id = getColumnId(column);
          if (id) initialState[id] = true;
        });
      }

      return initialState;
    });

  type CustomerGroupItem = Record<string, unknown>;

  const [selectedValue, setSelectedValue] = React.useState<string | undefined>(
    undefined
  );
  const [filterdDataTemp, setfilterdDataTemp] = React.useState<
    TData[] | undefined
  >(undefined);

  const FilterContent = Array.from(
    new Set(
      (data ?? [])
        .map((item) => {
          let value: unknown = undefined;
          if (
            typeof ColumnsToBeFilterd === "string" &&
            ColumnsToBeFilterd.length > 0
          ) {
            value = (item as CustomerGroupItem)?.[ColumnsToBeFilterd];
          }
          return typeof value === "string" ? value : undefined;
        })
        .filter((name): name is string => !!name)
    )
  );

  React.useEffect(() => {
    if (selectedValue) {
      const filterdData = data?.filter((item) =>
        typeof ColumnsToBeFilterd === "string" && ColumnsToBeFilterd.length > 0
          ? (item as CustomerGroupItem)?.[ColumnsToBeFilterd] === selectedValue
          : false
      );
      setfilterdDataTemp(filterdData);
    } else {
      setfilterdDataTemp(undefined);
    }
  }, [selectedValue, data, ColumnsToBeFilterd]);
  const limit = paginationStore((state) => state.limit);

  const table = useReactTable({
    data: filterdDataTemp ?? data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility,
      sorting,
      pagination: {
        pageIndex: 0,
        pageSize: limit,
      },
    },
  });

  const offset = paginationStore((state) => state.page);

  // Calculate the range of rows shown on the current page
  const pageSize = limit;
  const pageIndex = Math.floor((offset ?? 0) / pageSize);

  // const startRow = pageIndex * pageSize + 1;
  // const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  //-------------------------------------
  const handleExportExcel = (
    colorColumnName?: string, // Example: "creditStatus"
    targetColumnNames?: string[] // Example: ["creditStatus"]
  ) => {
    const visibleColumns = table
      .getAllColumns()
      .filter((col) => col.getIsVisible() && col.id !== colorColumnName);

    // Get headers
    const headers = visibleColumns.map((column) => {
      const headerContent = column.columnDef.header;
      return typeof headerContent === "string" ? headerContent : column.id;
    });

    // Start Excel data
    const excelData: XLSX.CellObject[][] = [
      headers.map((header) => ({
        v: header,
        t: "s",
        s: {
          font: { bold: true },
          fill: { fgColor: { rgb: "b2d8d8" } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
          alignment: { horizontal: "center" },
        },
      })),
    ];

    table.getFilteredRowModel().rows.forEach((row) => {
      // Find the color value from the color column
      const colorCell = row
        .getAllCells()
        .find((cell) => cell.column.id === colorColumnName);
      const colorValue = colorCell?.getValue();

      // Map colorValue to HEX
      // let backgroundColor: string | undefined;
      // if (colorValue === "GREEN") backgroundColor = "00FF00";
      // else if (colorValue === "YELLOW") backgroundColor = "FFFF00";
      // else if (colorValue === "RED") backgroundColor = "FF0000";
      // else backgroundColor = undefined;

      const rowData: XLSX.CellObject[] = visibleColumns.map((column) => {
        const cell = row.getAllCells().find((c) => c.column.id === column.id);
        let value: number | string;

        if (column.id === "createdOn" || column.id === "modifiedOn") {
          if (cell?.getValue()) {
            try {
              const date = new Date(cell.getValue() as string);
              if (!isNaN(date.getTime())) {
                value = format(date, "dd-MM-yyyy");
              } else {
                value = "-";
              }
            } catch (e) {
              console.error("Error parsing date:", e);
              value = "-";
            }
          } else {
            value = "-";
          }
        } else {
          const cellValue = cell?.getValue();
          if (excelSumColumnNames?.includes(column.id)) {
            value = Number(cellValue);
          } else {
            value = cellValue?.toString() ?? "-";
          }
        }
        // else {
        //   const cellValue = cell?.getValue();
        //   value = cellValue?.toString() ?? "-";
        // }

        // Check if this column should have background color
        const applyColor = targetColumnNames?.includes(column.id);

        return {
          v: value,
          t: excelSumColumnNames?.includes(column.id) ? "n" : "s",
          s: {
            font: { bold: false },
            fill:
              applyColor && colorValue
                ? { fgColor: { rgb: colorValue } }
                : undefined,
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
            alignment: {
              horizontal: excelSumColumnNames?.includes(column.id)
                ? "right"
                : "center",
            },
          },
        };
      });

      excelData.push(rowData);
    });

    if (excelShowTotal) {
      const sumRow: XLSX.CellObject[] = visibleColumns.map((column, index) => {
        if (excelSumColumnNames?.includes(column.id)) {
          const total = table.getFilteredRowModel().rows.reduce((acc, row) => {
            const cell = row
              .getAllCells()
              .find((c) => c.column.id === column.id);
            const num = Number(cell?.getValue());
            return acc + (isNaN(num) ? 0 : num);
          }, 0);

          return {
            v: Number(total).toFixed(2),
            t: "n",
            s: {
              font: { bold: true },
              fill: { fgColor: { rgb: "fcfc96" } },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
              alignment: { horizontal: "right" },
            },
          };
        } else if (index === 0) {
          return {
            v: "TOTAL",
            t: "s",
            s: {
              font: { bold: true },
              fill: { fgColor: { rgb: "fcfc96" } },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
              alignment: { horizontal: "center" },
            },
          };
        } else {
          return {
            v: "",
            t: "s",
            s: {
              fill: { fgColor: { rgb: "fcfc96" } },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
            },
          };
        }
      });

      excelData.push(sumRow);
    }

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    ws["!cols"] = headers.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, ExcelTitle);
  };
  const nextpage = paginationStore((state) => state.nextpage);
  const prevpage = paginationStore((state) => state.prevpage);
  const page = paginationStore((state) => state.page);

  return (
    <>
      <AnimatedDivDown delay={0.3} className="rounded-xl">
        <div className="flex w-full items-center justify-between">
          <div className="relative my-2 flex gap-3 items-center w-1/2">
            {EnableDialog && (
              <AddButton onClick={openDialog}>
                <PlusIcon size={18} />
                {ButtonTitle}
              </AddButton>
            )}

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8C8C8C]" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10 rounded-2xl bg-background border-bg-primary dark:border-input dark:bg-sidebar shadow-none placeholder:text-[#8C8C8C]"
              />
            </div>
          </div>

          {ExcelBulkUpload && (
            <div className="flex">
              <AddButton onClick={ExcelReUploadData}>
                <ArrowsClockwiseIcon weight="bold" size={18} />
                Re-Upload File
              </AddButton>

              <AddButton onClick={ExcelUploadData}>
                <UploadIcon size={18} />
                {ButtonTitle}
              </AddButton>
            </div>
          )}
          {!ExcelBulkUpload && (
            <div className="flex items-center gap-3">
              {EnableFilter && (
                <div className="flex-1 items-center gap-2">
                  {" "}
                  <Select
                    onValueChange={(value) => {
                      if (value === "All") {
                        setSelectedValue(undefined);
                      } else {
                        setSelectedValue(value);
                      }
                    }}>
                    <SelectTrigger className="col-span-3 data-[placeholder]:text-[#595959] border-none whitespace-nowrap rounded-2xl shadow-none bg-white text-[#595959] hover:colorGradient active:colorGradient hover:text-white active:text-white ">
                      <SelectValue placeholder={PlaceHolder} />
                    </SelectTrigger>
                    <SelectContent>
                      {["All", ...FilterContent]?.map((item) => (
                        <SelectItem key={item} value={String(item)}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {EnableIsComplete && (
                <div className="flex items-center gap-2 bg-white p-[8px] pl-[16px] rounded-3xl text-sm font-medium text-[#595959]">
                  <span>{IsCompleteValue ? "Completed" : "Pending"}</span>
                  <Switch
                    value={IsCompleteValue ? "Completed" : "Pending"}
                    onCheckedChange={(e) => IsComplete?.(e)}
                  />
                </div>
              )}
              <Button
                onClick={() =>
                  handleExportExcel(
                    excelColorFromColumnName,
                    excelColorTargetColumnNames
                  )
                }
                variant="outline"
                className="Button_class ">
                Export to Excel
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="Button_class">
                    Column Visibility
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-2xl border-none shadow-2xl max-h-[50svh] scroll overflow-y-auto"
                  onCloseAutoFocus={(e) => {
                    // Only prevent default for checkbox interactions
                    if (
                      !(
                        (e as FocusEvent).relatedTarget as HTMLElement
                      )?.closest(".dropdown-item")
                    ) {
                      e.preventDefault();
                    }
                  }}>
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize rounded-xl m-1 dropdown-item"
                          checked={column.getIsVisible()}
                          onSelect={(e) => e.preventDefault()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }>
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </AnimatedDivDown>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className={`rounded-2xl p-4 mt-1 bg-table`}>
        <div className="text-datatable-headingColor text-m font-semibold mb-4">
          {title}
        </div>
        <div className="flex-1">
          <div className="rounded-2xl overflow-hidden tableBorder border w-full">
            <div className="overflow-x-auto">
              <Table className="w-full table-auto">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            className="text-left whitespace-nowrap px-6 bg-datatable-foreground text-datatable-rowheadingColor font-semibold">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        className="text-center"
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="whitespace-nowrap text-table-cell text-left px-6">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center">
                        {isLoading ? "Loading Data..." : "No results."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4">
            <div className="flex-1 text-sm text-[#595959] ml-2">
              {/* {table.getRowModel().rows.length} of{" "}
                  {table.getFilteredRowModel().rows.length} row(s) selected. */}
              Showing{" "}
              {(paginationData?.currentPage ?? 0) *
                (paginationData?.perPage ?? 0) -
                ((paginationData?.perPage ?? 0) - 1)}
              -
              {(paginationData?.currentPage ?? 0) *
                (paginationData?.perPage ?? 0)}{" "}
              of {paginationData?.total || 0} row(s)
            </div>
            {/* <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          className="p-1 py-1 border rounded text-sm font-medium">
          {[10, 20, 30, 40, 50].map((size) => (
            <option key={size} value={size} className="text-sm font-medium">
              Row No : {size}
            </option>
          ))}
        </select> */}

            <Button
              className="Button_class"
              variant="outline"
              size="sm"
              onClick={() => {
                // table.previousPage();
                if (prevpage) {
                  prevpage();
                }
              }}
              disabled={(paginationData?.currentPage ?? 1) <= 1}>
              Previous
            </Button>
            <Button
              className="Button_class"
              variant="outline"
              size="sm"
              onClick={() => {
                // table.nextPage();
                if (nextpage) {
                  nextpage();
                }
              }}
              disabled={
                (paginationData?.currentPage ?? 1) >=
                (paginationData?.lastPage ?? 1)
              }>
              Next
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
