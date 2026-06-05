'use client';

import { useState, useEffect } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAssignments } from '@/lib/api';
import type { AssignmentWithDetails } from '@/types';
import { formatDoulaName } from '@/lib/displayNames';
import { getAppointmentStatusStyle } from '@/lib/appointmentStatus';

interface AssignmentsTableProps {
  onSelectAssignment: (assignment: AssignmentWithDetails) => void;
  refreshTrigger: number;
}

// Column definitions
export const columns: ColumnDef<AssignmentWithDetails>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <div className="w-[60px]">{row.getValue('id')}</div>,
  },
  {
    accessorKey: 'client.name_english',
    id: 'client_name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Client Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const client = row.original.client;
      const name = client.name_english || client.name_korean || 'N/A';
      return <div className="font-medium">{name}</div>;
    },
    filterFn: (row, id, value) => {
      const client = row.original.client;
      const searchTerm = String(value).toLowerCase();
      const nameKorean = client.name_korean?.toLowerCase() || '';
      const nameEnglish = client.name_english?.toLowerCase() || '';
      const email = client.email?.toLowerCase() || '';
      return nameKorean.includes(searchTerm) || nameEnglish.includes(searchTerm) || email.includes(searchTerm);
    },
  },
  {
    accessorKey: 'doula.name_english',
    id: 'doula_name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Doula Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const doula = row.original.current_doula || row.original.doula;
      const name = formatDoulaName(doula, 'N/A');
      const hasSwitchHistory = (row.original.doula_history?.length || 0) > 1;
      return (
        <div className="space-y-1">
          <div>{name}</div>
          {hasSwitchHistory && (
            <Badge variant="secondary" className="text-xs">Switched</Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const doula = row.original.current_doula || row.original.doula;
      const searchTerm = String(value).toLowerCase();
      const nameKorean = doula.name_korean?.toLowerCase() || '';
      const nameEnglish = doula.name_english?.toLowerCase() || '';
      const namePreferred = doula.name_preferred?.toLowerCase() || '';
      const email = doula.email?.toLowerCase() || '';
      return namePreferred.includes(searchTerm) || nameKorean.includes(searchTerm) || nameEnglish.includes(searchTerm) || email.includes(searchTerm);
    },
  },
  {
    accessorKey: 'start_date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Start Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const startDate = row.getValue('start_date') as string;
      if (!startDate) return <div>N/A</div>;
      
      // Extract just the date part to avoid timezone conversion
      const dateOnly = startDate.split('T')[0];
      const date = new Date(dateOnly + 'T12:00:00');
      
      return <div className="whitespace-nowrap">{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: 'end_date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          End Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const endDate = row.getValue('end_date') as string;
      if (!endDate) return <div>N/A</div>;
      
      // Extract just the date part to avoid timezone conversion
      const dateOnly = endDate.split('T')[0];
      const date = new Date(dateOnly + 'T12:00:00');
      
      return <div className="whitespace-nowrap">{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const style = getAppointmentStatusStyle(status);
      return (
        <Badge variant="outline" className={`${style.badgeClassName} whitespace-nowrap font-semibold`}>
          {style.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'service_type',
    header: 'Service Type',
    cell: ({ row }) => {
      const serviceType = row.getValue('service_type') as string;
      return <div className="whitespace-nowrap">{serviceType || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'days_per_week',
    header: 'Days/Week',
    cell: ({ row }) => {
      const days = row.getValue('days_per_week') as number | null;
      return <div className="text-center">{days || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'total_weeks',
    header: 'Total Weeks',
    cell: ({ row }) => {
      const weeks = row.getValue('total_weeks') as number | null;
      return <div className="text-center">{weeks || 'N/A'}</div>;
    },
  },
];

export function AssignmentsTable({ onSelectAssignment, refreshTrigger }: AssignmentsTableProps) {
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Fetch assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const data = await getAssignments();
        setAssignments(data);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [refreshTrigger]);

  const table = useReactTable({
    data: assignments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const searchTerm = String(filterValue).toLowerCase();
      const client = row.original.client;
      const doula = row.original.current_doula || row.original.doula;
      
      // Search in client names and email
      const clientMatch = 
        client.name_korean?.toLowerCase().includes(searchTerm) ||
        client.name_english?.toLowerCase().includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm);
      
      // Search in doula names and email
      const doulaMatch =
        doula.name_korean?.toLowerCase().includes(searchTerm) ||
        doula.name_english?.toLowerCase().includes(searchTerm) ||
        doula.name_preferred?.toLowerCase().includes(searchTerm) ||
        doula.email?.toLowerCase().includes(searchTerm);
      
      return Boolean(clientMatch || doulaMatch);
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <Card className="rounded-md shadow-sm">
        <CardContent className="p-6">
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">Loading assignments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-md shadow-sm">
      <CardContent className="p-0">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Appointment List</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Search, sort, and open assignments for service details.
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                aria-label="Search assignments"
                placeholder="Search client or doula..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="mx-4 rounded-md border">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
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
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        onClick={() => onSelectAssignment(row.original)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onSelectAssignment(row.original);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Open assignment ${row.original.id}`}
                        className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[-2px]"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
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
                        className="h-48 text-center"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">No assignments found</p>
                          <p className="text-sm text-muted-foreground">Try a different search term.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t px-4 pb-4 pt-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} assignment(s)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous assignments page"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next assignments page"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
