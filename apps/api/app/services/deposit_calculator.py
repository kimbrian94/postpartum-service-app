from sqlalchemy.orm import Session
from app.models.client import Client
from app.schemas.deposit import (
    DepositCalculation, 
    DepositBreakdown, 
    DepositEmailPreview,
    DepositResponse
)
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timedelta


class DepositCalculator:
    """Service for calculating deposits and generating email content."""
    
    # Tax rate (13% HST for Ontario, Canada)
    TAX_RATE = Decimal("0.13")
    
    # Postpartum care rates
    POSTPARTUM_RATES = {
        5: Decimal("1000.00"),  # 5 days/week
        6: Decimal("1200.00"),  # 6 days/week
    }
    
    # Special massage tiered pricing
    SPECIAL_MASSAGE_RATES = [
        (10, Decimal("180.00")),   # 5 <= sessions < 10
        (20, Decimal("170.00")),   # 10 <= sessions < 20
        (float('inf'), Decimal("160.00")),  # 20 <= sessions
    ]
    
    # Facial massage tiered pricing
    FACIAL_MASSAGE_RATES = [
        (10, Decimal("100.00")),   # 5 <= sessions < 10
        (20, Decimal("90.00")),    # 10 <= sessions < 20
        (float('inf'), Decimal("80.00")),   # 20 <= sessions
    ]
    
    # Night nurse rate
    NIGHT_NURSE_RATE_PER_WEEK = Decimal("1400.00")
    
    def __init__(self, db: Session):
        self.db = db
    
    def _get_tiered_rate(self, quantity: int, rate_tiers: list) -> Decimal:
        """
        Get rate based on tiered pricing.
        
        Tiers are defined as upper bounds (exclusive):
        - quantity < tier1: rate1
        - tier1 <= quantity < tier2: rate2
        - tier2 <= quantity: rate3
        """
        for max_qty, rate in rate_tiers:
            if quantity < max_qty:
                return rate
        # If exceeds all tiers, use the last tier rate
        return rate_tiers[-1][1]
    
    def _calculate_total_weeks(self, client: Client) -> Decimal:
        """Calculate total contract weeks."""
        total_weeks = Decimal("0")
        
        if client.postpartum_care_requested and client.postpartum_care_weeks:
            total_weeks += Decimal(str(client.postpartum_care_weeks))
        
        if client.night_nurse_requested and client.night_nurse_weeks:
            total_weeks += Decimal(str(client.night_nurse_weeks))
        
        return total_weeks
    
    def _calculate_deposit_percentage(self, total_weeks: Decimal, weekly_cost: Decimal, total_cost: Decimal) -> tuple[Decimal, str]:
        """
        Calculate deposit percentage based on contract duration.
        
        Rules:
        - 1 week: 100% (full amount)
        - 3 weeks: 1 week amount only
        - 8+ weeks: 4 week fee deposit (maximum)
        - Default: 50%
        
        Returns: (deposit_amount, rule_description)
        """
        if total_weeks <= 0:
            # No weekly services, use 50% default
            return total_cost * Decimal("0.50"), "50% default deposit"
        
        if total_weeks == 1:
            # 1 week contract: full amount
            return total_cost, "1-week contract: Full payment required"
        
        elif total_weeks == 3:
            # 3 week contract: 1 week amount only
            deposit = weekly_cost if weekly_cost > 0 else total_cost * Decimal("0.50")
            return deposit, "3-week contract: 1 week deposit"
        
        elif total_weeks >= 8:
            # 8+ weeks: 4 week fee deposit (maximum)
            four_week_cost = weekly_cost * Decimal("4") if weekly_cost > 0 else total_cost * Decimal("0.50")
            return four_week_cost, "8+ week contract: 4 week deposit (maximum)"
        
        else:
            # Default: 50%
            return total_cost * Decimal("0.50"), "50% deposit"
    
    def calculate(self, client_id: int) -> DepositCalculation:
        """Calculate deposit amount for a client."""
        client = self.db.query(Client).filter(Client.id == client_id).first()
        
        if not client:
            raise ValueError(f"Client {client_id} not found")
        
        breakdown = []
        
        # Separate tracking for each service type
        postpartum_cost = Decimal("0.00")
        postpartum_cash_eligible = False
        
        night_nurse_cost = Decimal("0.00")
        night_nurse_cash_eligible = False
        
        non_taxable_services_cost = Decimal("0.00")  # All massages
        weekly_service_cost = Decimal("0.00")  # For deposit calculation
        
        # Track cash price eligibility
        cash_price_services = []
        
        # Postpartum care calculation (TAXABLE, cash price if 4+ weeks)
        postpartum_weeks = 0
        if client.postpartum_care_requested and client.postpartum_care_weeks and client.postpartum_care_days_per_week:
            days_per_week = client.postpartum_care_days_per_week
            postpartum_weeks = client.postpartum_care_weeks
            weeks = Decimal(str(postpartum_weeks))
            
            # Get rate based on days per week (default to 5 if not 5 or 6)
            rate_per_week = self.POSTPARTUM_RATES.get(days_per_week, self.POSTPARTUM_RATES[5])
            
            cost = rate_per_week * weeks
            postpartum_cost = cost
            weekly_service_cost += rate_per_week
            
            # Check cash price eligibility (4+ weeks)
            if postpartum_weeks >= 4:
                postpartum_cash_eligible = True
                cash_price_services.append("Postpartum Care")
            
            breakdown.append(DepositBreakdown(
                service="Postpartum Care",
                rate=float(rate_per_week),
                quantity=float(weeks),
                unit=f"weeks ({days_per_week} days/week)",
                subtotal=float(cost),
                notes=f"${rate_per_week}/week × {weeks} weeks" + (" (Cash price option available)" if postpartum_weeks >= 4 else "")
            ))
        
        # Night nurse calculation (TAXABLE, cash price if 4+ weeks)
        night_nurse_weeks = 0
        if client.night_nurse_requested and client.night_nurse_weeks:
            night_nurse_weeks = client.night_nurse_weeks
            weeks = Decimal(str(night_nurse_weeks))
            cost = self.NIGHT_NURSE_RATE_PER_WEEK * weeks
            night_nurse_cost = cost
            weekly_service_cost += self.NIGHT_NURSE_RATE_PER_WEEK
            
            # Check cash price eligibility (4+ weeks)
            if night_nurse_weeks >= 4:
                night_nurse_cash_eligible = True
                cash_price_services.append("Night Nurse")
            
            breakdown.append(DepositBreakdown(
                service="Night Nurse",
                rate=float(self.NIGHT_NURSE_RATE_PER_WEEK),
                quantity=float(weeks),
                unit="weeks",
                subtotal=float(cost),
                notes=f"${self.NIGHT_NURSE_RATE_PER_WEEK}/week × {weeks} weeks" + (" (Cash price option available)" if night_nurse_weeks >= 4 else "")
            ))
        
        # Special massage calculation (NON-TAXABLE, 50% deposit fixed)
        if client.special_massage_requested and client.special_massage_sessions:
            sessions = client.special_massage_sessions
            rate = self._get_tiered_rate(sessions, self.SPECIAL_MASSAGE_RATES)
            cost = rate * Decimal(str(sessions))
            non_taxable_services_cost += cost
            
            breakdown.append(DepositBreakdown(
                service="Special Massage",
                rate=float(rate),
                quantity=float(sessions),
                unit="sessions",
                subtotal=float(cost),
                notes=f"${rate}/session × {sessions} sessions (tiered pricing, no tax)"
            ))
        
        # Facial massage calculation (NON-TAXABLE, 50% deposit fixed)
        if client.facial_massage_requested and client.facial_massage_sessions:
            sessions = client.facial_massage_sessions
            rate = self._get_tiered_rate(sessions, self.FACIAL_MASSAGE_RATES)
            cost = rate * Decimal(str(sessions))
            non_taxable_services_cost += cost
            
            breakdown.append(DepositBreakdown(
                service="Facial Massage",
                rate=float(rate),
                quantity=float(sessions),
                unit="sessions",
                subtotal=float(cost),
                notes=f"${rate}/session × {sessions} sessions (tiered pricing, no tax)"
            ))
        
        # RMT Massage - NOT included in invoice (skip)
        
        # Calculate total taxable services
        taxable_services_cost = postpartum_cost + night_nurse_cost
        
        # Calculate tax for standard payment (on all taxable services)
        tax_amount = (taxable_services_cost * self.TAX_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        
        # Calculate tax for cash price option (only on non-eligible services)
        postpartum_tax = Decimal("0.00") if postpartum_cash_eligible else (postpartum_cost * self.TAX_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        night_nurse_tax = Decimal("0.00") if night_nurse_cash_eligible else (night_nurse_cost * self.TAX_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        cash_price_tax_amount = postpartum_tax + night_nurse_tax
        
        # Total costs
        total_service_cost = taxable_services_cost + non_taxable_services_cost
        total_with_tax = taxable_services_cost + tax_amount + non_taxable_services_cost
        total_cash_price = taxable_services_cost + cash_price_tax_amount + non_taxable_services_cost
        
        # Calculate deposit based on rules (SEPARATELY for each service)
        postpartum_deposit_before_tax = Decimal("0.00")
        night_nurse_deposit_before_tax = Decimal("0.00")
        postpartum_deposit_rule = None
        night_nurse_deposit_rule = None
        
        # Calculate postpartum care deposit if applicable
        if client.postpartum_care_requested and postpartum_weeks > 0:
            postpartum_deposit_before_tax, postpartum_deposit_rule = self._calculate_deposit_percentage(
                Decimal(str(postpartum_weeks)),
                self.POSTPARTUM_RATES.get(client.postpartum_care_days_per_week, self.POSTPARTUM_RATES[5]),
                postpartum_cost
            )
        
        # Calculate night nurse deposit if applicable
        if client.night_nurse_requested and night_nurse_weeks > 0:
            night_nurse_deposit_before_tax, night_nurse_deposit_rule = self._calculate_deposit_percentage(
                Decimal(str(night_nurse_weeks)),
                self.NIGHT_NURSE_RATE_PER_WEEK,
                night_nurse_cost
            )
        
        # Combine deposits from both services
        taxable_deposit_before_tax = postpartum_deposit_before_tax + night_nurse_deposit_before_tax
        
        # Build combined deposit rule description
        if postpartum_deposit_rule and night_nurse_deposit_rule:
            deposit_rule = f"Postpartum: {postpartum_deposit_rule} | Night Nurse: {night_nurse_deposit_rule}"
        elif postpartum_deposit_rule:
            deposit_rule = postpartum_deposit_rule
        elif night_nurse_deposit_rule:
            deposit_rule = night_nurse_deposit_rule
        else:
            deposit_rule = "50% deposit"
        
        # For non-taxable services (massages): always 50%
        massage_deposit = non_taxable_services_cost * Decimal("0.50")
        
        # Standard deposit calculation (with tax on all services)
        deposit_tax = (taxable_deposit_before_tax * self.TAX_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        deposit_amount = taxable_deposit_before_tax + deposit_tax + massage_deposit
        remaining_balance = total_with_tax - deposit_amount
        
        # Cash price calculation (no tax only on 4+ week eligible services)
        cash_price_eligible = postpartum_cash_eligible or night_nurse_cash_eligible
        deposit_amount_cash_price = None
        remaining_balance_cash_price = None
        cash_price_note = None
        
        if cash_price_eligible:
            # Add tax only to non-eligible service deposits (use already-calculated deposits)
            postpartum_deposit_tax = Decimal("0.00") if postpartum_cash_eligible else (postpartum_deposit_before_tax * self.TAX_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            night_nurse_deposit_tax = Decimal("0.00") if night_nurse_cash_eligible else (night_nurse_deposit_before_tax * self.TAX_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            
            cash_price_deposit_tax = postpartum_deposit_tax + night_nurse_deposit_tax
            deposit_amount_cash_price = taxable_deposit_before_tax + cash_price_deposit_tax + massage_deposit
            
            remaining_balance_cash_price = total_cash_price - deposit_amount_cash_price
            
            cash_price_note = f"Cash price option available for {', '.join(cash_price_services)} (4+ weeks). " + \
                            f"Cash price excludes tax on eligible services. You may submit tax later with receipt if needed."
        
        # Calculate actual percentage for display
        actual_percentage = (deposit_amount / total_with_tax * Decimal("100")) if total_with_tax > 0 else Decimal("0")
        
        client_name = client.name_english or client.name_korean or f"Client #{client_id}"
        
        # Generate admin summary
        admin_summary = self._generate_admin_summary(
            breakdown=breakdown,
            total_service_cost=float(total_service_cost),
            taxable_amount=float(taxable_services_cost),
            non_taxable_amount=float(non_taxable_services_cost),
            tax_amount=float(tax_amount),
            cash_price_tax_amount=float(cash_price_tax_amount) if cash_price_eligible else None,
            total_with_tax=float(total_with_tax),
            total_cash_price=float(total_cash_price) if cash_price_eligible else None,
            deposit_amount=float(deposit_amount),
            deposit_amount_cash_price=float(deposit_amount_cash_price) if deposit_amount_cash_price else None,
            remaining_balance=float(remaining_balance),
            remaining_balance_cash_price=float(remaining_balance_cash_price) if remaining_balance_cash_price else None,
            deposit_rule=deposit_rule,
            cash_price_eligible=cash_price_eligible,
            cash_price_note=cash_price_note,
            client=client
        )
        
        return DepositCalculation(
            client_id=client_id,
            client_name=client_name,
            total_service_cost=float(total_service_cost),
            tax_amount=float(tax_amount),
            cash_price_tax_amount=float(cash_price_tax_amount) if cash_price_eligible else None,
            total_with_tax=float(total_with_tax),
            total_cash_price=float(total_cash_price) if cash_price_eligible else None,
            deposit_percentage=float(actual_percentage.quantize(Decimal("0.01"))),
            deposit_amount=float(deposit_amount),
            deposit_amount_cash_price=float(deposit_amount_cash_price) if deposit_amount_cash_price else None,
            remaining_balance=float(remaining_balance),
            remaining_balance_cash_price=float(remaining_balance_cash_price) if remaining_balance_cash_price else None,
            breakdown=breakdown,
            deposit_rule_applied=deposit_rule,
            cash_price_eligible=cash_price_eligible,
            cash_price_note=cash_price_note,
            calculated_at=datetime.utcnow(),
            admin_summary=admin_summary
        )
    
    def _generate_admin_summary(
        self,
        breakdown: list,
        total_service_cost: float,
        taxable_amount: float,
        non_taxable_amount: float,
        tax_amount: float,
        cash_price_tax_amount: float | None,
        total_with_tax: float,
        total_cash_price: float | None,
        deposit_amount: float,
        deposit_amount_cash_price: float | None,
        remaining_balance: float,
        remaining_balance_cash_price: float | None,
        deposit_rule: str,
        cash_price_eligible: bool,
        cash_price_note: str | None,
        client
    ) -> str:
        """Generate formatted summary for admin view."""
        # Format breakdown
        breakdown_lines = []
        for item in breakdown:
            breakdown_lines.append(
                f"  • {item.service}: ${item.rate:,.2f} × {item.quantity} {item.unit} = ${item.subtotal:,.2f}"
            )
            if item.notes and "Cash price option available" in item.notes:
                breakdown_lines.append(f"    {item.notes}")
        breakdown_text = "\n".join(breakdown_lines)
        
        # Calculate deposit due date (2 weeks before due date, or default)
        deposit_due_date = "To be confirmed"
        if client.due_date:
            due_date = client.due_date - timedelta(days=14)
            deposit_due_date = due_date.strftime("%B %d, %Y")
        
        # Build detailed payment breakdown per service
        payment_breakdown_lines = []
        
        for item in breakdown:
            is_taxable = item.service in ["Postpartum Care", "Night Nurse"]
            is_cash_eligible = "Cash price option available" in (item.notes or "")
            
            # Service fee
            service_fee = item.subtotal
            payment_breakdown_lines.append(f"{item.service}:")
            payment_breakdown_lines.append(f"  Service Fee:             ${service_fee:,.2f}")
            
            # Calculate deposit for this service
            if is_taxable:
                # Use deposit rule to determine deposit percentage/amount
                if "Full payment required" in deposit_rule or "1-week" in deposit_rule:
                    service_deposit_before_tax = service_fee
                elif "3-week" in deposit_rule:
                    service_deposit_before_tax = item.rate  # 1 week
                elif "8+ week" in deposit_rule or "4 week deposit" in deposit_rule:
                    service_deposit_before_tax = item.rate * 4  # 4 weeks
                else:
                    service_deposit_before_tax = service_fee * 0.5  # 50%
                
                service_tax = service_fee * 0.13
                service_deposit_tax = service_deposit_before_tax * 0.13
                
                payment_breakdown_lines.append(f"  Tax (13%):               ${service_tax:,.2f}")
                payment_breakdown_lines.append(f"  Deposit (before tax):    ${service_deposit_before_tax:,.2f}")
                payment_breakdown_lines.append(f"  Deposit Tax:             ${service_deposit_tax:,.2f}")
                payment_breakdown_lines.append(f"  Total Deposit:           ${service_deposit_before_tax + service_deposit_tax:,.2f}")
                
                if is_cash_eligible:
                    payment_breakdown_lines.append(f"  Cash Price Deposit:      ${service_deposit_before_tax:,.2f} (no tax)")
            else:
                # Non-taxable service (massages)
                service_deposit = service_fee * 0.5
                payment_breakdown_lines.append(f"  Tax:                     $0.00 (non-taxable)")
                payment_breakdown_lines.append(f"  Deposit (50%):           ${service_deposit:,.2f}")
            
            payment_breakdown_lines.append("")  # Empty line between services
        
        # Add totals
        payment_breakdown_lines.append("TOTALS:")
        payment_breakdown_lines.append(f"  Total Service Fee:       ${total_service_cost:,.2f}")
        payment_breakdown_lines.append(f"  Total Tax (HST 13%):     ${tax_amount:,.2f}")
        payment_breakdown_lines.append(f"  Grand Total:             ${total_with_tax:,.2f}")
        payment_breakdown_lines.append("")
        payment_breakdown_lines.append(f"  Total Deposit Required:  ${deposit_amount:,.2f}")
        payment_breakdown_lines.append(f"  Remaining Balance:       ${remaining_balance:,.2f}")
        
        # Add cash price option if eligible
        if cash_price_eligible and deposit_amount_cash_price is not None:
            payment_breakdown_lines.append("")
            payment_breakdown_lines.append("* CASH PRICE OPTION (No Tax):")
            payment_breakdown_lines.append(f"  Total Deposit (Cash):    ${deposit_amount_cash_price:,.2f}")
            payment_breakdown_lines.append(f"  Remaining Balance:       ${remaining_balance_cash_price:,.2f}")
            payment_breakdown_lines.append(f"  Note: {cash_price_note}")
        
        payment_breakdown_lines.append("")
        payment_breakdown_lines.append(f"Deposit Rule: {deposit_rule}")
        
        payment_breakdown = "\n".join(payment_breakdown_lines)
        
        summary = f"""━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERVICE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{breakdown_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{payment_breakdown}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━""".strip()
        
        return summary
    
    def _generate_email_preview_internal(
        self,
        client_id: int,
        client_name: str,
        total_service_cost: float,
        tax_amount: float,
        cash_price_tax_amount: float | None,
        total_with_tax: float,
        total_cash_price: float | None,
        deposit_amount: float,
        deposit_amount_cash_price: float | None,
        remaining_balance: float,
        remaining_balance_cash_price: float | None,
        breakdown: list,
        deposit_rule: str,
        cash_price_eligible: bool,
        cash_price_note: str | None,
        client
    ) -> tuple[DepositEmailPreview, DepositEmailPreview]:
        """Internal method to generate both English and Korean email previews."""
        english_email = self._generate_english_email(
            client_id, client_name, total_service_cost, tax_amount,
            cash_price_tax_amount, total_with_tax, total_cash_price,
            deposit_amount, deposit_amount_cash_price, remaining_balance,
            remaining_balance_cash_price, breakdown, deposit_rule,
            cash_price_eligible, cash_price_note, client
        )
        
        korean_email = self._generate_korean_email(
            client_id, client_name, total_service_cost, tax_amount,
            cash_price_tax_amount, total_with_tax, total_cash_price,
            deposit_amount, deposit_amount_cash_price, remaining_balance,
            remaining_balance_cash_price, breakdown, deposit_rule,
            cash_price_eligible, cash_price_note, client
        )
        
        return english_email, korean_email
    
    def _generate_korean_email(
        self,
        client_id: int,
        client_name: str,
        total_service_cost: float,
        tax_amount: float,
        cash_price_tax_amount: float | None,
        total_with_tax: float,
        total_cash_price: float | None,
        deposit_amount: float,
        deposit_amount_cash_price: float | None,
        remaining_balance: float,
        remaining_balance_cash_price: float | None,
        breakdown: list,
        deposit_rule: str,
        cash_price_eligible: bool,
        cash_price_note: str | None,
        client
    ) -> DepositEmailPreview:
        """Generate Korean version of email preview."""
        subject = f"예약금 안내 - {client_name}"
        
        # Build service sections in Korean
        service_sections = []
        
        for item in breakdown:
            section_lines = []
            
            # Translate service names
            service_name_kr = {
                "Postpartum Care": "산후조리 서비스",
                "Night Nurse": "나이트 너스",
                "Special Massage": "산후 스페셜 전신 마사지",
                "Facial Massage": "산후 페이셜 마사지",
                "RMT Massage": "RMT 마사지"
            }.get(item.service, item.service)
            
            section_lines.append(service_name_kr)
            
            # For taxable services (Postpartum Care, Night Nurse)
            if item.service in ["Postpartum Care", "Night Nurse"]:
                weeks_str = str(int(item.quantity))
                
                if "(" in item.unit:
                    days_per_week = item.unit.split("(")[1].split(")")[0]
                    frequency_text = f"{days_per_week.replace('days/week', '일')}, {weeks_str}주"
                else:
                    frequency_text = f"{weeks_str}주"
                
                service_cost = item.subtotal
                service_tax = service_cost * 0.13
                service_total = service_cost + service_tax
                
                service_deposit_before_tax = 0
                cash_eligible = "Cash price option available" in (item.notes or "")
                
                if "Full payment required" in deposit_rule or (item.service == "Postpartum Care" and "Postpartum: 1-week" in deposit_rule) or (item.service == "Night Nurse" and "Night Nurse: 1-week" in deposit_rule):
                    service_deposit_before_tax = service_cost
                elif "3-week" in deposit_rule:
                    service_deposit_before_tax = item.rate
                elif "8+ week" in deposit_rule or "4 week deposit" in deposit_rule:
                    service_deposit_before_tax = item.rate * 4
                else:
                    service_deposit_before_tax = service_cost * 0.5
                
                service_deposit_tax = service_deposit_before_tax * 0.13
                service_deposit_with_tax = service_deposit_before_tax + service_deposit_tax
                
                section_lines.append(f"총 서비스 금액: ${service_cost:,.2f} + tax ({frequency_text} 기준)")
                
                if cash_eligible:
                    section_lines.append(f"예약금: ${service_deposit_with_tax:,.2f} (${service_deposit_before_tax:,.2f} before tax) ({int(service_deposit_before_tax / item.rate)}주 기준)")
                else:
                    section_lines.append(f"예약금: ${service_deposit_with_tax:,.2f}")
                
                if cash_eligible:
                    section_lines.append(f"")
                    section_lines.append(f"* 4주 이상 계약하시는 산모님들한해서는 택스를 뺀 현금가격을 옵션으로 드리고 있습니다.")
                    section_lines.append(f"  나중에 택스보고를 하시고 싶으실 경우엔 저희에게 택스부분만 납부해주시면")
                    section_lines.append(f"  택스보고하실 수 있도록 영수증 프린트해드립니다!")
                    section_lines.append(f"  현금가격을 원하시면 ${service_deposit_before_tax:,.0f}만 보내주시면 됩니다.")
            
            else:
                # Non-taxable services (massages)
                sessions_str = str(int(item.quantity))
                service_deposit = item.subtotal * 0.5
                
                section_lines.append(f"총 서비스 금액: ${item.subtotal:,.2f} ({sessions_str} sessions)")
                section_lines.append(f"예약금: ${service_deposit:,.2f}")
            
            service_sections.append("\n".join(section_lines))
        
        services_text = "\n\n".join(service_sections)
        
        # Calculate total deposit
        total_deposit_text = f"총 예약금: ${deposit_amount:,.2f}"
        if cash_price_eligible and deposit_amount_cash_price:
            total_deposit_text += f" (${deposit_amount_cash_price:,.2f} before tax)"
        
        body = f"""안녕하세요,
구글 폼을 작성해 주셔서 감사합니다!

다음 단계는 예약 확정을 위한 예약금 입금입니다!
아래 예약금 안내를 참고해 주세요.

{services_text}

{total_deposit_text}

E-Transfer to: khannasofficial@gmail.com

예약금 입금이 확인되면 예약이 확정됩니다.
그 전까지는 예약 확정이 아니니 산모님의 자리 확보를 위해 빠른 예약 진행 부탁드립니다 :)

입금 확인 후, 회계팀에서 계약 내용, 산모를 위한 영양 가이드, 산후관리사 업무내용 등을 이메일로 보내드립니다.

잔금은 서비스가 시작하시기 전에 같은 방법으로 입금해주시면 되십니다.

혹시라도 예정일에 변동이 생기시거나 서비스 전에 저희에게 알려주셔야하는 점이 있으시다면 언제든지 저희에게 이메일 해주시면 됩니다!

저희 해나스 관리사님과 매니저팀이 산모님의 예정일 약 일주일전부터 준비를 하지만 변동 사항이 많은 예정일 특성상, 아기를 낳으러 병원가실때 저희에게 꼭! 연락 부탁드립니다 :)

궁금하신 점이나 확인이 필요한 부분이 있으면 언제든 편하게 말씀해 주세요.
해나스를 믿고 선택해주셔서 감사합니다!""".strip()
        
        return DepositEmailPreview(
            subject=subject,
            body=body
        )
    
    def _generate_english_email(
        self,
        client_id: int,
        client_name: str,
        total_service_cost: float,
        tax_amount: float,
        cash_price_tax_amount: float | None,
        total_with_tax: float,
        total_cash_price: float | None,
        deposit_amount: float,
        deposit_amount_cash_price: float | None,
        remaining_balance: float,
        remaining_balance_cash_price: float | None,
        breakdown: list,
        deposit_rule: str,
        cash_price_eligible: bool,
        cash_price_note: str | None,
        client
    ) -> DepositEmailPreview:
        """Generate English version of email preview."""
        subject = f"Deposit Invoice - {client_name}"
        
        # Build service sections
        service_sections = []
        
        # Process each service in breakdown
        for item in breakdown:
            section_lines = []
            section_lines.append(f"{item.service}")
            
            # For taxable services (Postpartum Care, Night Nurse)
            if item.service in ["Postpartum Care", "Night Nurse"]:
                # Extract weeks from quantity
                weeks_str = str(int(item.quantity))
                
                # Extract days/week from unit (e.g., "weeks (5 days/week)" -> "5 days/week")
                # For Night Nurse, unit is just "weeks"
                if "(" in item.unit:
                    days_per_week = item.unit.split("(")[1].split(")")[0]
                    frequency_text = f"{days_per_week}, {weeks_str} weeks"
                else:
                    frequency_text = f"{weeks_str} weeks"
                
                # Calculate service cost and tax
                service_cost = item.subtotal
                service_tax = service_cost * 0.13
                service_total = service_cost + service_tax
                
                # Calculate deposit for this service
                # Find the specific deposit amount based on service
                service_deposit_before_tax = 0
                service_deposit_with_tax = 0
                cash_eligible = "Cash price option available" in (item.notes or "")
                
                # Determine deposit based on deposit rule
                if "Full payment required" in deposit_rule or (item.service == "Postpartum Care" and "Postpartum: 1-week" in deposit_rule) or (item.service == "Night Nurse" and "Night Nurse: 1-week" in deposit_rule):
                    service_deposit_before_tax = service_cost
                elif "3-week" in deposit_rule:
                    service_deposit_before_tax = item.rate  # 1 week amount
                elif "8+ week" in deposit_rule or "4 week deposit" in deposit_rule:
                    service_deposit_before_tax = item.rate * 4  # 4 weeks
                else:
                    service_deposit_before_tax = service_cost * 0.5  # 50%
                
                service_deposit_tax = service_deposit_before_tax * 0.13
                service_deposit_with_tax = service_deposit_before_tax + service_deposit_tax
                
                section_lines.append(f"Total service fee: ${service_cost:,.2f} + tax ({frequency_text})")
                
                # Show "before tax" amount only if cash price is eligible (4+ weeks)
                if cash_eligible:
                    section_lines.append(f"Deposit: ${service_deposit_with_tax:,.2f} (${service_deposit_before_tax:,.2f} before tax)")
                else:
                    section_lines.append(f"Deposit: ${service_deposit_with_tax:,.2f}")
                
                # Add cash price option if eligible
                if cash_eligible:
                    section_lines.append(f"* For mothers who contract 4 weeks or longer, we offer a cash price option excluding tax.")
                    section_lines.append(f"  If you later wish to report the tax, you may submit only the tax portion to us,")
                    section_lines.append(f"  and we will provide a printed receipt for tax filing.")
                    section_lines.append(f"  If you choose the cash price option, please send ${service_deposit_before_tax:,.2f}.")
            
            # For non-taxable services (massages)
            else:
                sessions_str = str(int(item.quantity))
                service_deposit = item.subtotal * 0.5
                
                section_lines.append(f"Total service fee: ${item.subtotal:,.2f} ({sessions_str} sessions)")
                section_lines.append(f"Deposit: ${service_deposit:,.2f}")
            
            service_sections.append("\n".join(section_lines))
        
        services_text = "\n\n".join(service_sections)
        
        # Calculate total deposit (standard option)
        total_deposit_text = f"Total Deposit: ${deposit_amount:,.2f}"
        if cash_price_eligible and deposit_amount_cash_price:
            total_deposit_text += f" (or ${deposit_amount_cash_price:,.2f} if choosing cash price option)"
        
        body = f"""Thank you so much for completing the Google Form!

The next step to confirm your booking is submitting the deposit.
Please find the deposit details below.

{services_text}

{total_deposit_text}

E-Transfer to: khannasofficial@gmail.com

Once the deposit payment is received and confirmed, your booking will be officially secured.
Please note that the reservation is not confirmed until the deposit has been received, so we kindly recommend proceeding with the payment as soon as possible to secure your spot.

After the payment is confirmed, our accounting team will email you the contract details, a nutritional guide prepared for mothers, and an overview of the postpartum care services provided by our doula.

The remaining balance can be paid using the same method prior to the start of the service.

If there are any changes to your due date, or if there is anything you would like to inform us of before the service begins, please feel free to contact us anytime via email.

Our Hanna's doula and management team typically begin preparing about one week before your due date. However, as due dates can often change, we kindly ask that you contact us as soon as you head to the hospital for delivery.

If you have any questions or need further clarification, please do not hesitate to reach out to us at any time.
Thank you very much for trusting and choosing Hanna's Moms Care.

Warm regards,
Hanna's Moms Care Team""".strip()
        
        return DepositEmailPreview(
            subject=subject,
            body=body
        )
    
    def get_deposit_response(self, client_id: int) -> DepositResponse:
        """Get complete deposit information for both admin view and email preview."""
        # Get the admin calculation view
        calculation = self.calculate(client_id)
        
        # Get the client for email generation
        client = self.db.query(Client).filter(Client.id == client_id).first()
        
        # Generate both English and Korean email previews
        email_preview, email_preview_korean = self._generate_email_preview_internal(
            client_id=calculation.client_id,
            client_name=calculation.client_name,
            total_service_cost=calculation.total_service_cost,
            tax_amount=calculation.tax_amount,
            cash_price_tax_amount=calculation.cash_price_tax_amount if calculation.cash_price_eligible else None,
            total_with_tax=calculation.total_with_tax,
            total_cash_price=calculation.total_cash_price if calculation.cash_price_eligible else None,
            deposit_amount=calculation.deposit_amount,
            deposit_amount_cash_price=calculation.deposit_amount_cash_price,
            remaining_balance=calculation.remaining_balance,
            remaining_balance_cash_price=calculation.remaining_balance_cash_price,
            breakdown=calculation.breakdown,
            deposit_rule=calculation.deposit_rule_applied,
            cash_price_eligible=calculation.cash_price_eligible,
            cash_price_note=calculation.cash_price_note,
            client=client
        )
        
        return DepositResponse(
            calculation=calculation,
            email_preview=email_preview,
            email_preview_korean=email_preview_korean
        )
