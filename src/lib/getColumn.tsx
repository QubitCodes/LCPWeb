import React from "react";
import { FaRegAddressCard } from "react-icons/fa";

import { motion } from "framer-motion";
import { Grid3X3, Pencil, Trash } from "lucide-react";

import { ColumnDef } from "@tanstack/react-table";
export interface GenerateColumnsOptions<T> {
  onEdit?: (row: T, action: string) => void;
  onDelete?: (row: T) => void;
  onSkillView?: (row: T) => void;
  onAddressView?: (row: T) => void;
  excludeColumns?: string[];
  columnOrder?: string[];
  customHeaders?: Record<string, string>;
  customFormatters?: Record<
    string,
    (value: unknown, row: T) => React.ReactNode
  >;
  customClasses?: Record<string, (value: unknown, row: T) => string>; // ✅ Added
  currencySymbol?: string;
  dateFormat?: Intl.DateTimeFormatOptions;
  locale?: string;
  actionsHeader?: string;
  actionsPosition?: "start" | "end";
}

// Helper to detect ISO date strings
function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  return isoRegex.test(value) && !isNaN(new Date(value).getTime());
}

/**
 * ✅ GenerateColumns — Dynamically builds columns for TanStack Table
 */
export function GenerateColumns<T extends object>(
  data: T[],
  options: GenerateColumnsOptions<T> = {}
): ColumnDef<T>[] {
  if (!data.length) return [];

  const {
    excludeColumns = [],
    columnOrder = [],
    customHeaders = {},
    customFormatters = {},
    customClasses = {}, // ✅ default empty
    currencySymbol = "₹",
    dateFormat = { day: "2-digit", month: "short", year: "numeric" },
    locale = "en-IN",
    actionsHeader = "Actions",
    actionsPosition = "end",
    onEdit,
    onDelete,
    onSkillView,
    onAddressView,
  } = options;

  const allKeys = Object.keys(data[0]);
  const filteredKeys = allKeys.filter(
    (key) => !excludeColumns.includes(key) && !key.endsWith("_id")
  );
  const orderedKeys =
    columnOrder.length > 0
      ? [
          ...columnOrder.filter((key) => filteredKeys.includes(key)),
          ...filteredKeys.filter((key) => !columnOrder.includes(key)),
        ]
      : filteredKeys;

  // 2️⃣ Generate columns
  const dataColumns: ColumnDef<T>[] = orderedKeys.map((key) => ({
    accessorKey: key as keyof T & string,
    header:
      customHeaders[key] ||
      key
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/^./, (str) => str.toUpperCase()),

    cell: ({ getValue, row }) => {
      const value = getValue();
      const customClass = customClasses[key]?.(value, row.original) || "";

      let content: React.ReactNode;

      if (value == null) content = "-";
      else if (customFormatters[key])
        content = customFormatters[key](value, row.original);
      else if (typeof value === "number") {
        const currencyKeys = [
          "price",
          "amount",
          "cost",
          "fee",
          "salary",
          "revenue",
        ];
        const isCurrency = currencyKeys.some((k) =>
          key.toLowerCase().includes(k)
        );
        content = isCurrency
          ? `${currencySymbol}${value.toLocaleString(locale)}`
          : value.toLocaleString(locale);
      }
      // else if (typeof value === "boolean") content = value ? "Yes" : "No";
      else if (isValidDateString(value))
        content = new Date(value).toLocaleDateString(locale, dateFormat);
      else if (Array.isArray(value))
        content = value.length > 0 ? `${value.length} item(s)` : "Empty";
      else if (typeof value === "object")
        content = value ? JSON.stringify(value) : "Empty Object";
      else content = String(value);

      return <p className={customClass}>{content}</p>;
    },
  }));

  // 3️⃣ Add Actions column if required
  const actionsColumn: ColumnDef<T> = {
    id: "actions",
    header: actionsHeader,
    cell: ({ row }) => (
      <div className="flex text-start justify-start gap-2">
        {onAddressView && (
          <motion.span
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onAddressView(row.original)}>
            {/* <FaAddressCard
              className="cursor-pointer hover:text-red-500"
              size={15}
            /> */}
            <FaRegAddressCard
              className="cursor-pointer hover:text-red-500"
              size={16}
            />
          </motion.span>
        )}
        {onEdit && (
          <motion.span
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(row.original, "view")}>
            <Grid3X3 className="cursor-pointer hover:text-blue-500" size={15} />
          </motion.span>
        )}

        {onEdit && (
          <motion.span
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(row.original, "edit")}>
            <Pencil
              className="cursor-pointer hover:text-yellow-500"
              size={15}
            />
          </motion.span>
        )}

        {onDelete && (
          <motion.span
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(row.original)}>
            <Trash className="cursor-pointer hover:text-red-500" size={15} />
          </motion.span>
        )}
        {onSkillView && (
          <motion.span
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSkillView(row.original)}>
            <Trash className="cursor-pointer hover:text-red-500" size={15} />
          </motion.span>
        )}
      </div>
    ),
  };

  return actionsPosition === "start"
    ? [actionsColumn, ...dataColumns]
    : [...dataColumns, actionsColumn];
}
