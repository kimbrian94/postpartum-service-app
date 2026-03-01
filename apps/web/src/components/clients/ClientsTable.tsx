'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Check, X, ChevronDown, Edit, Copy, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Client } from '@/lib/api';
import { ClientDetailsDialog } from './ClientDetailsDialog';
import { useToast } from '@/components/ui/use-toast';

// Column grouping configuration
const columnGroups = {
  basic: ['name_english', 'name_korean', 'email', 'phone_number', 'status'],
  dates: ['due_date', 'actual_delivery_date', 'created_at', 'updated_at'],
  location: ['residential_area', 'home_address'],
  household: ['has_pets', 'visitor_parking_available', 'other_household_members', 'pregnancy_number', 'is_twins'],
  cultural: ['cultural_background', 'familiar_with_korean_food', 'preferred_cuisine', 'preferred_language'],
  referral: ['referral_source', 'contact_platform', 'platform_username', 'referrer_name'],
  services: [
    'night_nurse_weeks',
    'night_nurse_requested',
    'postpartum_care_requested',
    'postpartum_care_days_per_week',
    'postpartum_care_weeks',
    'special_massage_requested',
    'special_massage_sessions',
    'facial_massage_requested',
    'facial_massage_sessions',
    'rmt_massage_requested',
  ],
  other: ['internal_notes'],
} as const;

const defaultColumns = [
  'name_korean',
  'name_english',
  'status',
  'email',
  'phone_number',
  'due_date',
  'residential_area',
  'home_address',
  'created_at',
];

const statusVariants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive'> = {
  pending_deposit: 'warning',
  deposit_received: 'info',
  full_payment_received: 'success',
  service_in_progress: 'default',
  service_completed: 'secondary',
  cancelled: 'destructive',
};

const statusLabels: Record<string, string> = {
  pending_deposit: 'Pending Deposit',
  deposit_received: 'Deposit Received',
  full_payment_received: 'Full Payment Complete',
  service_in_progress: 'Service In Progress',
  service_completed: 'Service Completed',
  cancelled: 'Cancelled',
};

const BooleanCell = ({ value }: { value: boolean }) => (
  <div className="flex items-center justify-center">
    {value ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-gray-400" />}
  </div>
);

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <div className="w-[60px]">{row.getValue('id')}</div>,
    enableHiding: false,
  },
  {
    accessorKey: 'name_korean',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name (Korean)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const nameKorean = row.getValue('name_korean') as string;
      return <div className="font-medium">{nameKorean || 'N/A'}</div>;
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
          Name (English)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const nameEnglish = row.getValue('name_english') as string;
      return <div>{nameEnglish || 'N/A'}</div>;
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
      return (
        <Badge variant={statusVariants[status] || 'default'} className="whitespace-nowrap border shadow-sm font-semibold text-sm">
          {statusLabels[status] || status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <div className="lowercase">{row.getValue('email')}</div>,
  },
  {
    accessorKey: 'phone_number',
    header: 'Phone',
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('phone_number') || 'N/A'}</div>,
  },
  {
    accessorKey: 'due_date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dueDate = row.getValue('due_date') as string | null;
      if (!dueDate) return <div>N/A</div>;
      
      // Extract just the date part to avoid timezone conversion
      const dateOnly = dueDate.split('T')[0]; // "2025-03-15"
      // Add noon time to avoid edge cases
      const date = new Date(dateOnly + 'T12:00:00');
      
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: 'actual_delivery_date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Delivery Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const deliveryDate = row.getValue('actual_delivery_date') as string | null;
      if (!deliveryDate) return <div>N/A</div>;
      
      // Extract just the date part to avoid timezone conversion
      const dateOnly = deliveryDate.split('T')[0];
      // Add noon time to avoid edge cases
      const date = new Date(dateOnly + 'T12:00:00');
      
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: 'residential_area',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Area
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue('residential_area') || 'N/A'}</div>,
  },
  {
    accessorKey: 'home_address',
    header: 'Address',
    cell: ({ row }) => {
      const address = row.getValue('home_address') as string;
      return <div className="max-w-[200px] truncate">{address || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'has_pets',
    header: 'Pets',
    cell: ({ row }) => <BooleanCell value={row.getValue('has_pets')} />,
  },
  {
    accessorKey: 'visitor_parking_available',
    header: 'Parking',
    cell: ({ row }) => <BooleanCell value={row.getValue('visitor_parking_available')} />,
  },
  {
    accessorKey: 'other_household_members',
    header: 'Household',
    cell: ({ row }) => {
      const members = row.getValue('other_household_members') as string;
      return <div className="max-w-[150px] truncate">{members || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'pregnancy_number',
    header: 'Baby #',
    cell: ({ row }) => {
      const num = row.getValue('pregnancy_number') as number;
      return <div className="text-center">{num || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'cultural_background',
    header: 'Culture',
    cell: ({ row }) => <div>{row.getValue('cultural_background') || 'N/A'}</div>,
  },
  {
    accessorKey: 'familiar_with_korean_food',
    header: 'Korean Food',
    cell: ({ row }) => <BooleanCell value={row.getValue('familiar_with_korean_food')} />,
  },
  {
    accessorKey: 'preferred_cuisine',
    header: 'Cuisine Pref.',
    cell: ({ row }) => {
      const cuisine = row.getValue('preferred_cuisine') as string;
      return <div className="max-w-[150px] truncate">{cuisine || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'referral_source',
    header: 'Referral Source',
    cell: ({ row }) => <div>{row.getValue('referral_source') || 'N/A'}</div>,
  },
  {
    accessorKey: 'contact_platform',
    header: 'Platform',
    cell: ({ row }) => <div>{row.getValue('contact_platform') || 'N/A'}</div>,
  },
  {
    accessorKey: 'platform_username',
    header: 'Username',
    cell: ({ row }) => <div>{row.getValue('platform_username') || 'N/A'}</div>,
  },
  {
    accessorKey: 'referrer_name',
    header: 'Referrer',
    cell: ({ row }) => <div>{row.getValue('referrer_name') || 'N/A'}</div>,
  },
  {
    accessorKey: 'preferred_language',
    header: 'Language',
    cell: ({ row }) => <div>{row.getValue('preferred_language') || 'N/A'}</div>,
  },
  {
    accessorKey: 'night_nurse_weeks',
    header: 'Night Nurse',
    cell: ({ row }) => {
      const weeks = row.getValue('night_nurse_weeks') as number;
      return <div>{weeks ? `${weeks} weeks` : 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'internal_notes',
    header: 'Notes',
    cell: ({ row }) => {
      const notes = row.getValue('internal_notes') as string;
      return <div className="max-w-[200px] truncate">{notes || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'is_twins',
    header: 'Twins',
    cell: ({ row }) => <BooleanCell value={row.getValue('is_twins')} />,
  },
  {
    accessorKey: 'postpartum_care_requested',
    header: 'Postpartum Care',
    cell: ({ row }) => <BooleanCell value={row.getValue('postpartum_care_requested')} />,
  },
  {
    accessorKey: 'postpartum_care_days_per_week',
    header: 'PC Days/Week',
    cell: ({ row }) => {
      const days = row.getValue('postpartum_care_days_per_week') as number;
      return <div>{days || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'postpartum_care_weeks',
    header: 'PC Weeks',
    cell: ({ row }) => {
      const weeks = row.getValue('postpartum_care_weeks') as number;
      return <div>{weeks || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'special_massage_requested',
    header: 'Special Massage',
    cell: ({ row }) => <BooleanCell value={row.getValue('special_massage_requested')} />,
  },
  {
    accessorKey: 'special_massage_sessions',
    header: 'Special Sessions',
    cell: ({ row }) => {
      const sessions = row.getValue('special_massage_sessions') as number;
      return <div>{sessions || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'facial_massage_requested',
    header: 'Facial Massage',
    cell: ({ row }) => <BooleanCell value={row.getValue('facial_massage_requested')} />,
  },
  {
    accessorKey: 'facial_massage_sessions',
    header: 'Facial Sessions',
    cell: ({ row }) => {
      const sessions = row.getValue('facial_massage_sessions') as number;
      return <div>{sessions || 'N/A'}</div>;
    },
  },
  {
    accessorKey: 'rmt_massage_requested',
    header: 'RMT Massage',
    cell: ({ row }) => <BooleanCell value={row.getValue('rmt_massage_requested')} />,
  },
  {
    accessorKey: 'night_nurse_requested',
    header: 'Night Nurse Req.',
    cell: ({ row }) => <BooleanCell value={row.getValue('night_nurse_requested')} />,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'));
      return <div>{date.toLocaleString('en-US', { timeZone: 'America/New_York' })}</div>;
    },
  },
  {
    accessorKey: 'updated_at',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('updated_at'));
      return <div>{date.toLocaleString('en-US', { timeZone: 'America/New_York' })}</div>;
    },
  },
];

// Actions column - will be added dynamically in the component

interface ClientsTableProps {
  data: Client[];
  onClientUpdated?: () => void;
}

export function ClientsTable({ data, onClientUpdated }: ClientsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'due_date', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    const visibility: VisibilityState = { id: false };
    columns.forEach((column) => {
      if ('accessorKey' in column && column.accessorKey) {
        const key = column.accessorKey as string;
        if (key !== 'id') {
          visibility[key] = defaultColumns.includes(key);
        }
      }
    });
    return visibility;
  });
  const [rowSelection, setRowSelection] = React.useState({});
  
  // Use controlled input with deferred value for filtering
  const [searchInput, setSearchInput] = React.useState('');
  const deferredSearch = React.useDeferredValue(searchInput);
  
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: data.length,
  });
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; client: Client } | null>(null);
  const [exportData, setExportData] = React.useState<string | null>(null);
  const [selectedYears, setSelectedYears] = React.useState<number[]>([]);

  const { toast } = useToast();

  // Extract unique years from due dates
  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    data.forEach((client) => {
      if (client.due_date) {
        const year = new Date(client.due_date).getFullYear();
        if (!isNaN(year)) {
          years.add(year);
        }
      }
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [data]);

  // Filter data by selected years
  const filteredData = React.useMemo(() => {
    if (selectedYears.length === 0) {
      return data;
    }
    return data.filter((client) => {
      if (!client.due_date) return false;
      const year = new Date(client.due_date).getFullYear();
      return selectedYears.includes(year);
    });
  }, [data, selectedYears]);

  const toggleYear = (year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  // Helper functions for column management
  const toggleAllColumns = (visible: boolean) => {
    const newVisibility: VisibilityState = { id: false };
    table
      .getAllColumns()
      .filter((column) => column.getCanHide())
      .forEach((column) => {
        newVisibility[column.id] = visible;
      });
    setColumnVisibility(newVisibility);
  };

  const resetToDefault = () => {
    const newVisibility: VisibilityState = { id: false };
    table
      .getAllColumns()
      .filter((column) => column.getCanHide())
      .forEach((column) => {
        newVisibility[column.id] = defaultColumns.includes(column.id);
      });
    setColumnVisibility(newVisibility);
  };

  const toggleGroup = (groupKey: keyof typeof columnGroups, visible: boolean) => {
    const newVisibility = { ...columnVisibility };
    columnGroups[groupKey].forEach((columnId) => {
      newVisibility[columnId] = visible;
    });
    setColumnVisibility(newVisibility);
  };

  const handleUpdateClient = (updatedClient: Partial<Client>) => {
    setDialogOpen(false);
    
    // Trigger parent refresh to get latest data from server
    if (onClientUpdated) {
      onClientUpdated();
    }
  };

  const handleRowClick = (event: React.MouseEvent, client: Client) => {
    event.preventDefault();
    
    // Close existing menu if clicking on a different row
    if (contextMenu && contextMenu.client.id !== client.id) {
      setContextMenu(null);
      return;
    }
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      client,
    });
  };

  const handleExportClient = (client: Client) => {
    const exportText = `Client Information\n${'='.repeat(50)}\n\n` +
      `Name (English): ${client.name_english || 'N/A'}\n` +
      `Name (Korean): ${client.name_korean || 'N/A'}\n` +
      `Email: ${client.email}\n` +
      `Phone: ${client.phone_number || 'N/A'}\n` +
      `Status: ${statusLabels[client.status] || client.status}\n\n` +
      `Due Date: ${client.due_date ? new Date(client.due_date.split('T')[0] + 'T12:00:00').toLocaleDateString() : 'N/A'}\n` +
      `Delivery Date: ${client.actual_delivery_date ? new Date(client.actual_delivery_date.split('T')[0] + 'T12:00:00').toLocaleDateString() : 'N/A'}\n` +
      `Twins: ${client.is_twins ? 'Yes' : 'No'}\n\n` +
      `Residential Area: ${client.residential_area || 'N/A'}\n` +
      `Home Address: ${client.home_address || 'N/A'}\n` +
      `Parking Available: ${client.visitor_parking_available ? 'Yes' : 'No'}\n` +
      `Has Pets: ${client.has_pets ? 'Yes' : 'No'}\n` +
      `Other Household Members: ${client.other_household_members || 'N/A'}\n` +
      `Pregnancy Number: ${client.pregnancy_number || 'N/A'}\n\n` +
      `Cultural Background: ${client.cultural_background || 'N/A'}\n` +
      `Familiar with Korean Food: ${client.familiar_with_korean_food ? 'Yes' : 'No'}\n` +
      `Preferred Cuisine: ${client.preferred_cuisine || 'N/A'}\n` +
      `Preferred Language: ${client.preferred_language || 'N/A'}\n\n` +
      `Services Requested:\n` +
      `- Postpartum Care: ${client.postpartum_care_requested ? `Yes (${client.postpartum_care_days_per_week || 0} days/week for ${client.postpartum_care_weeks || 0} weeks)` : 'No'}\n` +
      `- Night Nurse: ${client.night_nurse_requested ? `Yes (${client.night_nurse_weeks || 0} weeks)` : 'No'}\n` +
      `- Special Massage: ${client.special_massage_requested ? `Yes (${client.special_massage_sessions || 0} sessions)` : 'No'}\n` +
      `- Facial Massage: ${client.facial_massage_requested ? `Yes (${client.facial_massage_sessions || 0} sessions)` : 'No'}\n` +
      `- RMT Massage: ${client.rmt_massage_requested ? 'Yes' : 'No'}\n\n` +
      `Referral Source: ${client.referral_source || 'N/A'}\n` +
      `Contact Platform: ${client.contact_platform || 'N/A'}\n` +
      `Platform Username: ${client.platform_username || 'N/A'}\n` +
      `Referrer Name: ${client.referrer_name || 'N/A'}\n\n` +
      `Internal Notes: ${client.internal_notes || 'N/A'}\n\n` +
      `Created: ${new Date(client.created_at).toLocaleString()}\n` +
      `Last Updated: ${new Date(client.updated_at).toLocaleString()}`;
    
    setExportData(exportText);
    setContextMenu(null);
  };

  const handleCopyToClipboard = async () => {
    if (exportData) {
      await navigator.clipboard.writeText(exportData);
      toast({
        description: '✓ Copied to clipboard',
        variant: 'success',
      });
      setExportData(null);
    }
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setDialogOpen(true);
    setContextMenu(null);
  };

  // Close context menu on various interactions
  React.useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    
    if (contextMenu) {
      // Close on scroll
      const scrollContainer = document.querySelector('.overflow-auto');
      scrollContainer?.addEventListener('scroll', handleCloseMenu);
      
      // Close on any click outside
      document.addEventListener('click', handleCloseMenu);
      
      // Close on escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleCloseMenu();
      };
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        scrollContainer?.removeEventListener('scroll', handleCloseMenu);
        document.removeEventListener('click', handleCloseMenu);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [contextMenu]);

  // Close menu when user starts searching or changing filters
  React.useEffect(() => {
    setContextMenu(null);
  }, [searchInput, columnFilters, sorting, pagination, selectedYears]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: deferredSearch, // Use deferred value
      pagination,
    },
  });

  return (
    <div className="w-full h-full flex flex-col">
      {/* TEMPORARY VERSION CHECK - REMOVE AFTER CONFIRMING */}
      <div className="bg-blue-500 text-white text-xs px-2 py-1 text-center font-bold">
        VERSION: YEAR_FILTER_v3 - {new Date().toISOString()}
      </div>
      <div className="flex items-center justify-between py-4 flex-shrink-0">
        <Input
          placeholder="Search clients..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-3 ml-auto">
          {/* Year Filter */}
          {availableYears.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium whitespace-nowrap">Filter by Year:</span>
              <div className="flex gap-2 flex-wrap">
                {availableYears.map((year) => (
                  <Button
                    key={year}
                    variant={selectedYears.includes(year) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleYear(year)}
                    className="h-8"
                  >
                    {year}
                  </Button>
                ))}
                {selectedYears.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedYears([])}
                    className="h-8 text-muted-foreground"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[280px]">
            {/* Quick Actions */}
            <div className="p-2 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => toggleAllColumns(true)}
              >
                Show All Columns
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => toggleAllColumns(false)}
              >
                Hide All Columns
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={resetToDefault}
              >
                Reset to Default
              </Button>
            </div>

            <Separator className="my-2" />

            {/* Column Groups */}
            <ScrollArea className="h-[400px]">
              <div className="p-2 space-y-4">
                {Object.entries(columnGroups).map(([groupKey, columns]) => (
                  <div key={groupKey} className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-sm font-medium capitalize">
                        {groupKey.replace(/_/g, ' ')}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => toggleGroup(groupKey as keyof typeof columnGroups, true)}
                        >
                          All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => toggleGroup(groupKey as keyof typeof columnGroups, false)}
                        >
                          None
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 pl-2">
                      {columns.map((columnId) => {
                        const column = table.getColumn(columnId);
                        if (!column) return null;
                        return (
                          <DropdownMenuCheckboxItem
                            key={columnId}
                            className="capitalize text-sm"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                            onSelect={(e) => e.preventDefault()}
                          >
                            {columnId.replace(/_/g, ' ')}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
      
      <div className="rounded-md border flex-1 min-h-0 flex flex-col">
        <div className="custom-scrollbar flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10 shadow-sm after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="bg-white">
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
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={(e) => handleRowClick(e, row.original)}
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
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageSize === data.length ? 'all' : `${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to ${Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of`} {table.getFilteredRowModel().rows.length} client(s)
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <select
              className="h-8 w-[100px] rounded-md border border-input bg-background px-2 py-1 text-sm"
              value={table.getState().pagination.pageSize === data.length ? 'all' : table.getState().pagination.pageSize}
              onChange={(e) => {
                const value = e.target.value;
                table.setPageSize(value === 'all' ? data.length : Number(value));
              }}
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="150">150</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => handleExportClient(contextMenu.client)}
          >
            <FileText className="h-4 w-4" />
            Export Client Info
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => handleEditClient(contextMenu.client)}
          >
            <Edit className="h-4 w-4" />
            Edit Client
          </button>
        </div>
      )}

      {/* Export Data Dialog */}
      {exportData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setExportData(null)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Client Information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded">
                {exportData}
              </pre>
            </ScrollArea>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setExportData(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      <ClientDetailsDialog
        client={selectedClient}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={handleUpdateClient}
      />
    </div>
  );
}
