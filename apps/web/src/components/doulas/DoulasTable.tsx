'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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
import { type Doula } from '@/types';
import { formatDoulaName } from '@/lib/displayNames';

interface DoulasTableProps {
  data: Doula[];
  onSelectDoula: (doula: Doula) => void;
}

// Column definitions
export const columns: ColumnDef<Doula>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <div className="w-[60px]">{row.getValue('id')}</div>,
  },
  {
    accessorKey: 'name_preferred',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Preferred Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue('name_preferred') as string | undefined;
      return <div className="font-medium">{name || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'name_korean',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Korean Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue('name_korean') as string | undefined;
      return <div>{name || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'name_english',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          English Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue('name_english') as string | undefined;
      return <div>{name || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      const email = row.getValue('email') as string | undefined;
      return <div className="max-w-[200px] truncate">{email || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'phone_number',
    header: 'Phone',
    cell: ({ row }) => {
      const phone = row.getValue('phone_number') as string | undefined;
      return <div>{phone || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'languages',
    header: 'Languages',
    cell: ({ row }) => {
      const languages = row.getValue('languages') as string | undefined;
      return <div className="max-w-[150px] truncate">{languages || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'service_area',
    header: 'Service Area',
    cell: ({ row }) => {
      const serviceArea = row.getValue('service_area') as string | undefined;
      if (!serviceArea) return <div className="text-muted-foreground">N/A</div>;
      
      // If it's "All Areas", show it prominently
      if (serviceArea === 'All Areas') {
        return (
          <Badge variant="default" className="text-xs">
            All Areas
          </Badge>
        );
      }
      
      // For multiple areas, show truncated text with count
      const areas = serviceArea.split(',').map(a => a.trim());
      if (areas.length > 2) {
        return (
          <div className="text-sm">
            <div className="truncate max-w-[150px]" title={serviceArea}>
              {areas.slice(0, 2).join(', ')}
            </div>
            <div className="text-xs text-muted-foreground">
              +{areas.length - 2} more
            </div>
          </div>
        );
      }
      
      return <div className="max-w-[150px] truncate text-sm" title={serviceArea}>{serviceArea}</div>;
    },
  },
  {
    accessorKey: 'start_year',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Start Year
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const year = row.getValue('start_year') as number | undefined;
      return <div>{year ?? 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'vaccination_status',
    header: 'Vaccination',
    cell: ({ row }) => {
      const doula = row.original;
      const status = doula.vaccination_status;
      const vaccines = [];
      
      if (doula.has_tdap) vaccines.push('Tdap');
      if (doula.has_mmr) vaccines.push('MMR');
      if (doula.has_varicella) vaccines.push('Var');
      if (doula.has_hep_b) vaccines.push('Hep B');
      
      const variant = status === 'fully_vaccinated' ? 'default' : 
                     status === 'partially_vaccinated' ? 'secondary' : 'outline';
      
      return (
        <div className="space-y-1">
          <Badge variant={variant} className="text-xs">
            {status === 'fully_vaccinated' ? 'Full' : 
             status === 'partially_vaccinated' ? 'Partial' : 'None'}
          </Badge>
          {vaccines.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {vaccines.join(', ')}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean;
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'legal_status',
    header: 'Legal Status',
    cell: ({ row }) => {
      const status = row.getValue('legal_status') as string | undefined;
      if (!status) return <div>N/A</div>;
      const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return <div className="text-sm">{label}</div>;
    },
  },
  {
    accessorKey: 'pet_allergies',
    header: 'Pet Allergies',
    cell: ({ row }) => {
      const allergies = row.getValue('pet_allergies') as string | undefined;
      if (!allergies || allergies.toLowerCase() === 'none') return <div className="text-muted-foreground">None</div>;
      return <div className="max-w-[120px] truncate text-sm">{allergies}</div>;
    },
  },
];

export function DoulasTable({ data, onSelectDoula }: DoulasTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name_preferred', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    legal_status: false,
    pet_allergies: false,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const searchTerm = filterValue.toLowerCase();
      const doula = row.original;
      
      // Search in names, email, languages, service_area
      return (
        doula.name_korean?.toLowerCase().includes(searchTerm) ||
        doula.name_english?.toLowerCase().includes(searchTerm) ||
        doula.name_preferred?.toLowerCase().includes(searchTerm) ||
        doula.email?.toLowerCase().includes(searchTerm) ||
        doula.languages?.toLowerCase().includes(searchTerm) ||
        doula.service_area?.toLowerCase().includes(searchTerm) ||
        false
      );
    },
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search doulas..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectDoula(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No doulas found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-4">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const doula = row.original;
                return (
                  <Card
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onSelectDoula(doula)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">
                              {formatDoulaName(doula, 'N/A')}
                            </div>
                          </div>
                          <Badge variant={doula.is_active ? 'default' : 'secondary'}>
                            {doula.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {doula.email && (
                            <div className="col-span-2 truncate text-muted-foreground">
                              {doula.email}
                            </div>
                          )}
                          {doula.phone_number && (
                            <div className="text-muted-foreground">{doula.phone_number}</div>
                          )}
                          {doula.start_year && (
                            <div className="text-muted-foreground">
                              Since {doula.start_year}
                            </div>
                          )}
                          {doula.languages && (
                            <div className="col-span-2 text-muted-foreground truncate">
                              Languages: {doula.languages}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No doulas found.
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex items-center py-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} doula(s) total
        </div>
      </div>
    </div>
  );
}
