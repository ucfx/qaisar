"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  RowSelectionState
} from "@tanstack/react-table";
import { DeleteAlert } from "./delete-alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";  // Modified this import path
import { Checkbox } from "./ui/checkbox";  // Modified this import path
import { TableCommand } from "@/types";
import { CommandActions } from "./command-actions";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreVertical, Pencil, Trash, Folder } from "lucide-react";
import { toast } from 'sonner'
import { CommandDialog } from "./command-dialog";
import { formatSecondsToDuration } from "@/util/formatSecondsToDuration";

type ColumnHandlers = {
  onDelete: (id: string) => void;
  onEdit?: (command: TableCommand) => void;
  onOpenDirectory?: (command: TableCommand) => void;
};

function getColumns(handlers: ColumnHandlers): ColumnDef<TableCommand>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          disabled={true}
          className="ml-2"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          disabled={true}

          className="ml-2"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-start"
              onClick={() => handlers.onOpenDirectory?.(row.original)}
            >
              <Folder className="h-4 w-4" />
              Dir
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-start"
              onClick={() => handlers.onEdit?.(row.original)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center justify-start"
              onClick={() => handlers.onDelete(row.original.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    },
    {
      accessorKey: "command",
      header: "Command",
    },
    {
      accessorKey: "group",
      header: ({ column }) => {
        return (
          <Button
            className="p-0"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Group
            {column.getIsSorted() === "asc" ? " ↑" : column.getIsSorted() === "desc" ? " ↓" : ""}
          </Button>
        )
      },
    },
    {
      accessorKey: "info.status",
      header: "Status",
    },
    {
      id: "iteration",
      header: "Iter.",
      cell: ({ row }) => {
        const info = row.original.info;
        return `${info.iter || 0}/${info.total || 0}`;
      },
    },
    {
      id: "eta",
      header: "ETA",
      cell: ({ row }) => {
        const info = row.original.info;
        return info.eta ? formatSecondsToDuration(info.eta) : "00:00:00";
      },
    },
    {
      id: "cmd_action",
      cell: ({ row }) => <CommandActions command={row.original} />,
    },
  ];
}

export function DataTable({ data, onDelete, handleAddCommand }: {
  data: TableCommand[],
  onDelete: (id: string) => void,
  handleAddCommand: (newCommand: TableCommand) => void,
}) {
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [commandEditing, setCommandEditing] = useState<TableCommand | undefined>(undefined);

  const columns = getColumns({
    onDelete: (id) => setDeleteId(id),
    onEdit: (command) => {
      // TODO: Implement edit handler
      console.log('Edit:', command);
      setCommandEditing(command);
    },
    onOpenDirectory: async (command) => {
      const res = await fetch("http://localhost:5000/open-dir", {
        method: 'POST',
        body: JSON.stringify({ dir: command.directory }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const r = await res.json();

      if (!r.success) {
        toast.error(r.message);
      } else {
        toast.success("Directory opened successfully");
      }
    },
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      rowSelection,
      sorting,
    },
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead className="bg-secondary" key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <CommandDialog onAddCommand={handleAddCommand} commandInfo={commandEditing} setCommandEditing={setCommandEditing} editing />
      <DeleteAlert
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </>
  );
}
