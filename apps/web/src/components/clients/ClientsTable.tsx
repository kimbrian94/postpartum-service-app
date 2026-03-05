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
import { ArrowUpDown, Check, X, ChevronDown, Edit, Copy, FileText, SlidersHorizontal, DollarSign } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Client, DepositResponse, getDepositInfo } from '@/lib/api';
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
  const [depositInfo, setDepositInfo] = React.useState<DepositResponse | null>(null);
  const [depositInfoLoading, setDepositInfoLoading] = React.useState(false);
  const [emailPreviewTab, setEmailPreviewTab] = React.useState('english');
  const [selectedYears, setSelectedYears] = React.useState<number[]>(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear];
  });
  const [filterSheetOpen, setFilterSheetOpen] = React.useState(false);

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
    return Array.from(years).sort((a, b) => b - a); // Descending order
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

  const handleViewDepositInfo = async (client: Client) => {
    setDepositInfoLoading(true);
    setContextMenu(null);
    
    try {
      const depositData = await getDepositInfo(client.id);
      setDepositInfo(depositData);
    } catch (error) {
      console.error('Failed to fetch deposit info:', error);
      toast({
        description: '✗ Failed to load deposit information',
        variant: 'destructive',
      });
    } finally {
      setDepositInfoLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!exportData) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(exportData);
      } else {
        // Fallback for environments where navigator.clipboard is unavailable
        const textarea = document.createElement('textarea');
        textarea.value = exportData;
        textarea.style.position = 'fixed'; // Avoid scrolling to bottom
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      toast({
        description: '✓ Copied to clipboard',
        variant: 'success',
      });
      setExportData(null);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
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
      // Close on any scroll event (using capture phase to detect scroll in any element)
      window.addEventListener('scroll', handleCloseMenu, true);
      
      // Close on any click outside
      document.addEventListener('click', handleCloseMenu);
      
      // Close on escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleCloseMenu();
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        window.removeEventListener('scroll', handleCloseMenu, true);
        document.removeEventListener('click', handleCloseMenu);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [contextMenu]);

  // Close menu when user starts searching or changing filters
  React.useEffect(() => {
    setContextMenu(null);
  }, [searchInput, columnFilters, sorting, pagination, selectedYears]);

  // Custom global filter function for Korean character support
  const globalFilterFn = React.useCallback((row: any, columnId: string, filterValue: string) => {
    if (!filterValue) return true;
    
    const searchLower = filterValue.toLowerCase();
    const client = row.original;
    
    // Search in multiple fields including Korean characters
    const searchableFields = [
      client.name_korean,
      client.name_english,
      client.email,
      client.phone_number,
      client.status,
      client.residential_area,
      client.home_address,
      client.referral_source,
      client.cultural_background,
      client.preferred_language,
    ];
    
    return searchableFields.some(field => 
      field && String(field).toLowerCase().includes(searchLower)
    );
  }, []);

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
    globalFilterFn: globalFilterFn,
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
      {/* Top Bar - Responsive */}
      <div className="flex items-center gap-2 py-3 md:py-4 flex-shrink-0">
        <Input
          placeholder="Search..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="flex-1 md:max-w-sm"
        />
        
        {/* Desktop: Show filters inline */}
        <div className="hidden md:flex items-center gap-2 md:ml-auto">
          {/* Year Filter Chips */}
          {availableYears.length > 0 && (
            <>
              <Button
                variant={selectedYears.length === 0 ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedYears([])}
                className="h-9"
              >
                All
              </Button>
              {availableYears.map((year) => (
                <Button
                  key={year}
                  variant={selectedYears.includes(year) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => toggleYear(year)}
                  className="h-9"
                >
                  {year}
                </Button>
              ))}
              <Separator orientation="vertical" className="h-6 mx-1" />
            </>
          )}

          {/* Columns dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
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

        {/* Mobile: Filter Sheet */}
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col">
            <SheetHeader>
              <SheetTitle>Filter & Sort</SheetTitle>
              <SheetDescription>
                Manage client list view
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              {/* Sort Options */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Sort By</h4>
                <Select
                  value={`${sorting[0]?.id || 'due_date'}-${sorting[0]?.desc ? 'desc' : 'asc'}`}
                  onValueChange={(value) => {
                    const [id, direction] = value.split('-');
                    setSorting([{ id, desc: direction === 'desc' }]);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="due_date-asc">Due Date (Earliest First)</SelectItem>
                    <SelectItem value="due_date-desc">Due Date (Latest First)</SelectItem>
                    <SelectItem value="name_korean-asc">Name (Korean base)</SelectItem>
                    <SelectItem value="name_english-asc">Name (English A-Z)</SelectItem>
                    <SelectItem value="status-asc">Status</SelectItem>
                    <SelectItem value="created_at-desc">Date Created (Newest First)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              {availableYears.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Filter by Year</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedYears.length === 0 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedYears([])}
                      className="h-9"
                    >
                      All Years
                    </Button>
                    {availableYears.map((year) => (
                      <Button
                        key={year}
                        variant={selectedYears.includes(year) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleYear(year)}
                        className="h-9"
                      >
                        {year}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Badge (Mobile) */}
      {selectedYears.length > 0 && (
        <div className="flex md:hidden items-center gap-2 pb-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Year:</span>
          {selectedYears.map((year) => (
            <Badge key={year} variant="secondary" className="text-xs h-6">
              {year}
              <button
                onClick={() => toggleYear(year)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {/* Mobile: Card List View */}
      <div className="md:hidden flex-1 overflow-auto space-y-3 pb-4">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const client = row.original;
            return (
              <Card
                key={row.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setSelectedClient(client);
                  setDialogOpen(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">
                        {client.name_korean || client.name_english || 'N/A'}
                      </h3>
                      {client.name_korean && client.name_english && (
                        <p className="text-sm text-muted-foreground truncate">
                          {client.name_english}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant={statusVariants[client.status] || 'default'} 
                      className="text-xs font-semibold flex-shrink-0"
                    >
                      {statusLabels[client.status] || client.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {/* Contact Info */}
                  <div className="space-y-1">
                    {client.email && (
                      <p className="text-muted-foreground truncate">{client.email}</p>
                    )}
                    {client.phone_number && (
                      <p className="text-muted-foreground">{client.phone_number}</p>
                    )}
                  </div>

                  {/* Key Info Grid */}
                  {(client.due_date || client.residential_area || client.pregnancy_number || client.is_twins) && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      {client.due_date && (
                        <div>
                          <p className="text-xs text-muted-foreground">Due Date</p>
                          <p className="font-medium">
                            {new Date(client.due_date.split('T')[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      )}
                      {client.residential_area && (
                        <div>
                          <p className="text-xs text-muted-foreground">Area</p>
                          <p className="font-medium truncate">{client.residential_area}</p>
                        </div>
                      )}
                      {client.pregnancy_number && (
                        <div>
                          <p className="text-xs text-muted-foreground">Baby #</p>
                          <p className="font-medium">{client.pregnancy_number}</p>
                        </div>
                      )}
                      {client.is_twins && (
                        <div>
                          <p className="text-xs text-muted-foreground">Twins</p>
                          <p className="font-medium">Yes</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Services Summary */}
                  {(client.postpartum_care_requested || client.night_nurse_requested || client.special_massage_requested) && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Services</p>
                      <div className="flex flex-wrap gap-1">
                        {client.postpartum_care_requested && (
                          <Badge variant="outline" className="text-xs">
                            Postpartum Care
                          </Badge>
                        )}
                        {client.night_nurse_requested && (
                          <Badge variant="outline" className="text-xs">
                            Night Nurse
                          </Badge>
                        )}
                        {client.special_massage_requested && (
                          <Badge variant="outline" className="text-xs">
                            Special Massage
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No clients found
          </div>
        )}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:flex rounded-md border flex-1 min-h-0 flex-col">
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
      
      {/* Pagination - Simplified on mobile */}
      <div className="flex items-center justify-between space-x-2 py-3 md:py-4 flex-shrink-0">
        <div className="text-sm text-muted-foreground">
          <span className="hidden sm:inline">
            Showing {table.getState().pagination.pageSize === data.length ? 'all' : `${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-${Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of`}
          </span>
          {' '}{table.getFilteredRowModel().rows.length} client{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center space-x-2 md:space-x-6">
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Rows:</span>
            <select
              className="h-8 w-[80px] rounded-md border border-input bg-background px-2 py-1 text-sm"
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-2 z-50 min-w-[200px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            className="w-full px-5 py-3 text-left text-base hover:bg-gray-100 flex items-center gap-3"
            onClick={() => handleEditClient(contextMenu.client)}
          >
            <Edit className="h-5 w-5" />
            Edit Client
          </button>
          <button
            className="w-full px-5 py-3 text-left text-base hover:bg-gray-100 flex items-center gap-3"
            onClick={() => handleViewDepositInfo(contextMenu.client)}
          >
            <DollarSign className="h-5 w-5" />
            Deposit Info
          </button>
          <button
            className="w-full px-5 py-3 text-left text-base hover:bg-gray-100 flex items-center gap-3"
            onClick={() => handleExportClient(contextMenu.client)}
          >
            <FileText className="h-5 w-5" />
            Export Client Info
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

      {/* Deposit Info Dialog */}
      {depositInfo && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={() => setDepositInfo(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDepositInfo(null);
            }
          }}
          tabIndex={0}
        >
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b">
              <h3 className="text-lg md:text-xl font-semibold">Deposit Information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDepositInfo(null)}
              >
                ✕
              </Button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="space-y-6">
                {/* Admin Summary */}
                <div className="border rounded-lg">
                  <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                    <h4 className="font-semibold text-sm uppercase text-gray-600">Admin Summary</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(depositInfo.calculation.admin_summary);
                        toast({
                          description: '✓ Admin summary copied',
                          variant: 'success',
                        });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Copy</span>
                    </Button>
                  </div>
                  <div className="p-3 overflow-x-auto">
                    <pre className="text-xs md:text-sm font-mono whitespace-pre-wrap break-words">
                      {depositInfo.calculation.admin_summary}
                    </pre>
                  </div>
                </div>

                {/* Email Preview - Tabbed (English/Korean) */}
                <div className="border rounded-lg">
                  <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                    <h4 className="font-semibold text-sm uppercase text-gray-600">Email Preview</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const emailToCopy = emailPreviewTab === 'english' 
                          ? depositInfo.email_preview.body 
                          : depositInfo.email_preview_korean.body;
                        const message = emailPreviewTab === 'english' 
                          ? '✓ English email copied' 
                          : '✓ Korean email copied';
                        navigator.clipboard.writeText(emailToCopy);
                        toast({
                          description: message,
                          variant: 'success',
                        });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Copy</span>
                    </Button>
                  </div>
                  <div className="p-3">
                    <Tabs defaultValue="english" className="w-full" onValueChange={setEmailPreviewTab}>
                      <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="english">English</TabsTrigger>
                        <TabsTrigger value="korean">한국어</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="english" className="space-y-3 mt-4">
                        <div className="mb-3 pb-3 border-b">
                          <span className="font-semibold text-sm text-gray-700">Subject:</span>
                          <span className="ml-2 text-sm">{depositInfo.email_preview.subject}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <pre className="text-xs md:text-sm font-mono whitespace-pre-wrap break-words">
                            {depositInfo.email_preview.body}
                          </pre>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="korean" className="space-y-3 mt-4">
                        <div className="mb-3 pb-3 border-b">
                          <span className="font-semibold text-sm text-gray-700">Subject:</span>
                          <span className="ml-2 text-sm">{depositInfo.email_preview_korean.subject}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <pre className="text-xs md:text-sm font-mono whitespace-pre-wrap break-words">
                            {depositInfo.email_preview_korean.body}
                          </pre>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 md:p-6 border-t bg-gray-50 flex flex-col sm:flex-row justify-end gap-2">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => {
                  const fullText = `ADMIN SUMMARY\n${'='.repeat(80)}\n${depositInfo.calculation.admin_summary}\n\n\nENGLISH EMAIL PREVIEW\n${'='.repeat(80)}\nSubject: ${depositInfo.email_preview.subject}\n\n${depositInfo.email_preview.body}\n\n\nKOREAN EMAIL PREVIEW (한국어)\n${'='.repeat(80)}\nSubject: ${depositInfo.email_preview_korean.subject}\n\n${depositInfo.email_preview_korean.body}`;
                  navigator.clipboard.writeText(fullText);
                  toast({
                    description: '✓ All content copied',
                    variant: 'success',
                  });
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
              <Button className="w-full sm:w-auto" onClick={() => setDepositInfo(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {depositInfoLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span>Loading deposit information...</span>
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
