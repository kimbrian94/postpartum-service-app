'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  FileText, 
  DollarSign,
  Mail,
  Calendar,
  CreditCard,
} from 'lucide-react';

interface ClientActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: () => void;
  onDepositInfo: () => void;
  isDepositInfoLoading?: boolean;
}

export function ClientActionsSheet({
  open,
  onOpenChange,
  onExport,
  onDepositInfo,
  isDepositInfoLoading = false,
}: ClientActionsSheetProps) {
  const handleAction = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Client Actions</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col gap-2 mt-6 mb-2">
          {/* Edit - Disabled as we're already in edit mode */}
          <Button
            variant="ghost"
            className="h-14 justify-start text-base"
            disabled
          >
            <Edit className="h-5 w-5 mr-3" />
            Edit Client
            <span className="ml-auto text-xs text-muted-foreground">Current View</span>
          </Button>

          {/* Export */}
          <Button
            variant="ghost"
            className="h-14 justify-start text-base"
            onClick={() => handleAction(onExport)}
          >
            <FileText className="h-5 w-5 mr-3" />
            Export Info
          </Button>

          {/* Deposit Info */}
          <Button
            variant="ghost"
            className="h-14 justify-start text-base"
            onClick={() => handleAction(onDepositInfo)}
            disabled={isDepositInfoLoading}
          >
            <DollarSign className="h-5 w-5 mr-3" />
            {isDepositInfoLoading ? 'Loading...' : 'Deposit Info'}
          </Button>

          {/* Coming Soon Features */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground px-3 mb-2">Coming Soon</p>
            
            <Button
              variant="ghost"
              className="h-14 justify-start text-base"
              disabled
            >
              <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
              <span className="text-muted-foreground">Send Email</span>
            </Button>

            <Button
              variant="ghost"
              className="h-14 justify-start text-base"
              disabled
            >
              <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
              <span className="text-muted-foreground">Schedule Appointment</span>
            </Button>

            <Button
              variant="ghost"
              className="h-14 justify-start text-base"
              disabled
            >
              <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
              <span className="text-muted-foreground">Record Payment</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
