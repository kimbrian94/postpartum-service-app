'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Filter, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
import {
  ACTIVE_STATUS_OPTIONS,
  LEGAL_STATUS_OPTIONS,
  SERVICE_AREAS,
  VACCINATION_STATUS_OPTIONS,
} from '@/lib/doulaConstants';

interface DoulasTableProps {
  data: Doula[];
  onSelectDoula: (doula: Doula) => void;
}

type DoulaFilters = {
  search: string;
  language: string;
  serviceAreas: string[];
  activeStatuses: string[];
  vaccinationStatuses: string[];
  legalStatuses: string[];
};

const emptyFilters: DoulaFilters = {
  search: '',
  language: '',
  serviceAreas: [],
  activeStatuses: [],
  vaccinationStatuses: [],
  legalStatuses: [],
};

const activeStatusLabels = Object.fromEntries(
  ACTIVE_STATUS_OPTIONS.map((option) => [option.value, option.label])
);
const vaccinationStatusLabels = Object.fromEntries(
  VACCINATION_STATUS_OPTIONS.map((option) => [option.value, option.label])
);
const legalStatusLabels = Object.fromEntries(
  LEGAL_STATUS_OPTIONS.map((option) => [option.value, option.label])
);

const parseList = (value?: string) =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const includesText = (value: string | undefined, search: string) =>
  value?.toLowerCase().includes(search) ?? false;

const toggleValue = (values: string[], value: string) =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

const filterCount = (filters: DoulaFilters) =>
  filters.serviceAreas.length +
  filters.activeStatuses.length +
  filters.vaccinationStatuses.length +
  filters.legalStatuses.length +
  (filters.search.trim() ? 1 : 0) +
  (filters.language.trim() ? 1 : 0);

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
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    legal_status: false,
    pet_allergies: false,
  });
  const [filters, setFilters] = useState<DoulaFilters>(emptyFilters);
  const activeFilterCount = filterCount(filters);

  const updateFilter = <K extends keyof DoulaFilters>(key: K, value: DoulaFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(emptyFilters);

  const filteredData = React.useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    const languageTerm = filters.language.trim().toLowerCase();

    return data.filter((doula) => {
      if (searchTerm) {
        const matchesSearch =
          includesText(doula.name_korean, searchTerm) ||
          includesText(doula.name_english, searchTerm) ||
          includesText(doula.name_preferred, searchTerm) ||
          includesText(doula.email, searchTerm) ||
          includesText(doula.phone_number, searchTerm) ||
          includesText(doula.languages, searchTerm) ||
          includesText(doula.service_area, searchTerm);

        if (!matchesSearch) return false;
      }

      if (languageTerm && !includesText(doula.languages, languageTerm)) {
        return false;
      }

      if (filters.serviceAreas.length > 0) {
        const areas = parseList(doula.service_area);
        const hasAllAreas = areas.includes('All Areas');
        const matchesArea = filters.serviceAreas.some((area) => {
          if (area === 'All Areas') return hasAllAreas;
          return hasAllAreas || areas.includes(area);
        });

        if (!matchesArea) return false;
      }

      if (filters.activeStatuses.length > 0) {
        const activeStatus = doula.is_active ? 'active' : 'inactive';
        if (!filters.activeStatuses.includes(activeStatus)) return false;
      }

      if (
        filters.vaccinationStatuses.length > 0 &&
        !filters.vaccinationStatuses.includes(doula.vaccination_status)
      ) {
        return false;
      }

      if (filters.legalStatuses.length > 0) {
        if (!doula.legal_status || !filters.legalStatuses.includes(doula.legal_status)) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  });

  const renderFilterCheckbox = (
    id: string,
    label: string,
    selected: boolean,
    onCheckedChange: () => void
  ) => (
    <div key={id} className="flex items-center gap-2">
      <Checkbox id={id} checked={selected} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal leading-none">
        {label}
      </Label>
    </div>
  );

  const removeFilterValue = (key: keyof DoulaFilters, value: string) => {
    const currentValue = filters[key];
    if (Array.isArray(currentValue)) {
      updateFilter(key, currentValue.filter((item) => item !== value) as DoulaFilters[typeof key]);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search doulas..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-8"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="shrink-0 justify-start gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden min-[380px]:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-0 sm:ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex w-[min(100vw,440px)] flex-col overflow-hidden sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Filter Doulas</SheetTitle>
                <SheetDescription>
                  Narrow the list by service coverage, status, credentials, and profile details.
                </SheetDescription>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto py-4">
                <div className="space-y-6">
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Languages</h3>
                    <Input
                      placeholder="Korean, English, Spanish..."
                      value={filters.language}
                      onChange={(e) => updateFilter('language', e.target.value)}
                    />
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Service Area</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {SERVICE_AREAS.map((area) =>
                        renderFilterCheckbox(
                          `filter-service-area-${area}`,
                          area,
                          filters.serviceAreas.includes(area),
                          () => updateFilter('serviceAreas', toggleValue(filters.serviceAreas, area))
                        )
                      )}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Status</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {ACTIVE_STATUS_OPTIONS.map((option) =>
                        renderFilterCheckbox(
                          `filter-active-${option.value}`,
                          option.label,
                          filters.activeStatuses.includes(option.value),
                          () => updateFilter('activeStatuses', toggleValue(filters.activeStatuses, option.value))
                        )
                      )}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Vaccination</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {VACCINATION_STATUS_OPTIONS.map((option) =>
                        renderFilterCheckbox(
                          `filter-vaccination-${option.value}`,
                          option.label,
                          filters.vaccinationStatuses.includes(option.value),
                          () =>
                            updateFilter(
                              'vaccinationStatuses',
                              toggleValue(filters.vaccinationStatuses, option.value)
                            )
                        )
                      )}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Legal Status</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {LEGAL_STATUS_OPTIONS.map((option) =>
                        renderFilterCheckbox(
                          `filter-legal-${option.value}`,
                          option.label,
                          filters.legalStatuses.includes(option.value),
                          () => updateFilter('legalStatuses', toggleValue(filters.legalStatuses, option.value))
                        )
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <SheetFooter className="gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={clearFilters} disabled={activeFilterCount === 0}>
                  Clear all
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          {activeFilterCount > 0 && (
            <Button variant="ghost" onClick={clearFilters} className="justify-start sm:w-auto">
              Clear all
            </Button>
          )}
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.search.trim() && (
              <Badge variant="secondary" className="gap-1">
                Search: {filters.search.trim()}
                <button type="button" onClick={() => updateFilter('search', '')} aria-label="Remove search filter">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.language.trim() && (
              <Badge variant="secondary" className="gap-1">
                Language: {filters.language.trim()}
                <button type="button" onClick={() => updateFilter('language', '')} aria-label="Remove language filter">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.serviceAreas.map((area) => (
              <Badge key={`area-${area}`} variant="secondary" className="gap-1">
                {area}
                <button type="button" onClick={() => removeFilterValue('serviceAreas', area)} aria-label={`Remove ${area} filter`}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.activeStatuses.map((status) => (
              <Badge key={`active-${status}`} variant="secondary" className="gap-1">
                {activeStatusLabels[status] ?? status}
                <button type="button" onClick={() => removeFilterValue('activeStatuses', status)} aria-label={`Remove ${status} filter`}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.vaccinationStatuses.map((status) => (
              <Badge key={`vaccination-${status}`} variant="secondary" className="gap-1">
                {vaccinationStatusLabels[status] ?? status}
                <button type="button" onClick={() => removeFilterValue('vaccinationStatuses', status)} aria-label={`Remove ${status} filter`}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.legalStatuses.map((status) => (
              <Badge key={`legal-${status}`} variant="secondary" className="gap-1">
                {legalStatusLabels[status] ?? status}
                <button type="button" onClick={() => removeFilterValue('legalStatuses', status)} aria-label={`Remove ${status} filter`}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden min-h-0 flex-1 rounded-md border md:block">
        <ScrollArea className="h-full">
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
      <div className="min-h-0 flex-1 md:hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
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
          Showing {table.getRowModel().rows.length} of {data.length} doula(s)
        </div>
      </div>
    </div>
  );
}
