from pydantic import BaseModel
from datetime import datetime
from typing import List


class DepositBreakdown(BaseModel):
    service: str
    rate: float
    quantity: float
    unit: str
    subtotal: float
    notes: str | None = None


class DepositCalculation(BaseModel):
    """Admin view of deposit calculation - breakdown and totals."""
    client_id: int
    client_name: str
    total_service_cost: float
    tax_amount: float
    cash_price_tax_amount: float | None = None
    total_with_tax: float
    total_cash_price: float | None = None
    deposit_percentage: float
    deposit_amount: float
    deposit_amount_cash_price: float | None = None
    remaining_balance: float
    remaining_balance_cash_price: float | None = None
    breakdown: List[DepositBreakdown]
    deposit_rule_applied: str
    cash_price_eligible: bool
    cash_price_note: str | None = None
    calculated_at: datetime
    admin_summary: str


class DepositEmailPreview(BaseModel):
    """Email preview for sending to client."""
    subject: str
    body: str


class DepositResponse(BaseModel):
    """Combined response with admin view and email preview."""
    calculation: DepositCalculation
    email_preview: DepositEmailPreview
