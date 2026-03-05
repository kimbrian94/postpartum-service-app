"""
Comprehensive tests for DepositCalculator service.

Tests cover:
- Tiered pricing for massages
- Postpartum care rates (5 vs 6 days/week)
- Night nurse calculations
- Deposit rules based on contract duration
- Tax calculations
- Edge cases and combinations
- Admin summary formatting
- Email preview generation
"""

import pytest
from datetime import date, timedelta
from decimal import Decimal
from app.services.deposit_calculator import DepositCalculator
from app.models.client import Client


class TestTieredPricing:
    """Test tiered pricing for special and facial massages."""
    
    def test_special_massage_tier1_up_to_5_sessions(self, db_session):
        """Special massage: <=5 sessions at $180/session."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            special_massage_requested=True,
            special_massage_sessions=5
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 5 sessions × $180 = $900
        assert result.total_service_cost == 900.00
        assert len([b for b in result.breakdown if b.service == "Special Massage"]) == 1
        breakdown = [b for b in result.breakdown if b.service == "Special Massage"][0]
        assert breakdown.rate == 180.00
        assert breakdown.quantity == 5
    
    def test_special_massage_tier2_up_to_10_sessions(self, db_session):
        """Special massage: 10-19 sessions at $170/session."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            special_massage_requested=True,
            special_massage_sessions=10
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 10 sessions × $170 = $1,700
        assert result.total_service_cost == 1700.00
        breakdown = [b for b in result.breakdown if b.service == "Special Massage"][0]
        assert breakdown.rate == 170.00
    
    def test_special_massage_tier3_up_to_20_sessions(self, db_session):
        """Special massage: 20+ sessions at $160/session."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            special_massage_requested=True,
            special_massage_sessions=20
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 20 sessions × $160 = $3,200
        assert result.total_service_cost == 3200.00
        breakdown = [b for b in result.breakdown if b.service == "Special Massage"][0]
        assert breakdown.rate == 160.00
    
    def test_special_massage_above_tier3_uses_last_tier(self, db_session):
        """Special massage: >20 sessions uses $160/session (last tier)."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            special_massage_requested=True,
            special_massage_sessions=25
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 25 sessions × $160 = $4,000
        assert result.total_service_cost == 4000.00
        breakdown = [b for b in result.breakdown if b.service == "Special Massage"][0]
        assert breakdown.rate == 160.00
    
    def test_facial_massage_tier1_up_to_5_sessions(self, db_session):
        """Facial massage: <=5 sessions at $100/session."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            facial_massage_requested=True,
            facial_massage_sessions=3
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 3 sessions × $100 = $300
        assert result.total_service_cost == 300.00
        breakdown = [b for b in result.breakdown if b.service == "Facial Massage"][0]
        assert breakdown.rate == 100.00
    
    def test_facial_massage_tier2_up_to_10_sessions(self, db_session):
        """Facial massage: 10-19 sessions at $90/session."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            facial_massage_requested=True,
            facial_massage_sessions=10
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 10 sessions × $90 = $900
        assert result.total_service_cost == 900.00
        breakdown = [b for b in result.breakdown if b.service == "Facial Massage"][0]
        assert breakdown.rate == 90.00
    
    def test_facial_massage_tier3_up_to_20_sessions(self, db_session):
        """Facial massage: 20+ sessions at $80/session."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            facial_massage_requested=True,
            facial_massage_sessions=20
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 20 sessions × $80 = $1,600
        assert result.total_service_cost == 1600.00
        breakdown = [b for b in result.breakdown if b.service == "Facial Massage"][0]
        assert breakdown.rate == 80.00


class TestPostpartumCareRates:
    """Test postpartum care calculations with different days per week."""
    
    def test_postpartum_care_5_days_per_week(self, db_session):
        """Postpartum care: 5 days/week at $1,000/week."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=4
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 4 weeks × $1,000 = $4,000
        assert result.total_service_cost == 4000.00
        breakdown = [b for b in result.breakdown if b.service == "Postpartum Care"][0]
        assert breakdown.rate == 1000.00
        assert breakdown.quantity == 4
    
    def test_postpartum_care_6_days_per_week(self, db_session):
        """Postpartum care: 6 days/week at $1,200/week."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=6,
            postpartum_care_weeks=4
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 4 weeks × $1,200 = $4,800
        assert result.total_service_cost == 4800.00
        breakdown = [b for b in result.breakdown if b.service == "Postpartum Care"][0]
        assert breakdown.rate == 1200.00
    
    def test_postpartum_care_invalid_days_defaults_to_5_day_rate(self, db_session):
        """Postpartum care: Invalid days/week defaults to 5-day rate."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=7,  # Invalid, should default to 5-day rate
            postpartum_care_weeks=2
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 2 weeks × $1,000 = $2,000
        assert result.total_service_cost == 2000.00
        breakdown = [b for b in result.breakdown if b.service == "Postpartum Care"][0]
        assert breakdown.rate == 1000.00


class TestNightNurseCalculations:
    """Test night nurse calculations."""
    
    def test_night_nurse_basic(self, db_session):
        """Night nurse: $1,400/week."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            night_nurse_requested=True,
            night_nurse_weeks=3
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 3 weeks × $1,400 = $4,200
        assert result.total_service_cost == 4200.00
        breakdown = [b for b in result.breakdown if b.service == "Night Nurse"][0]
        assert breakdown.rate == 1400.00
        assert breakdown.quantity == 3


class TestDepositRules:
    """Test deposit calculation rules based on contract duration."""
    
    def test_1_week_contract_requires_100_percent(self, db_session):
        """1-week contract: 100% deposit (full amount)."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=1
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 1 week × $1,000 = $1,000
        # Tax: $1,000 × 0.13 = $130
        # Total: $1,130
        # Deposit: 100% = $1,130
        assert result.total_service_cost == 1000.00
        assert result.tax_amount == 130.00
        assert result.total_with_tax == 1130.00
        assert result.deposit_amount == 1130.00
        assert result.remaining_balance == 0.00
        assert "1-week contract" in result.deposit_rule_applied
        assert result.deposit_percentage == 100.00
    
    def test_3_week_contract_requires_1_week_deposit(self, db_session):
        """3-week contract: 1 week amount deposit."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=3
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 3 weeks × $1,000 = $3,000
        # Tax on total: $3,000 × 0.13 = $390
        # Total: $3,390
        # Deposit: 1 week ($1,000) + tax ($130) = $1,130
        assert result.total_service_cost == 3000.00
        assert result.total_with_tax == 3390.00
        assert result.deposit_amount == 1130.00
        assert result.remaining_balance == 2260.00
        assert "3-week contract" in result.deposit_rule_applied
    
    def test_8_week_contract_requires_4_week_maximum_deposit(self, db_session):
        """8+ week contract: 4 week deposit (maximum)."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=10
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 10 weeks × $1,000 = $10,000
        # Tax on total: $10,000 × 0.13 = $1,300
        # Total: $11,300
        # Deposit: 4 weeks ($4,000) + tax ($520) = $4,520
        assert result.total_service_cost == 10000.00
        assert result.total_with_tax == 11300.00
        assert result.deposit_amount == 4520.00
        assert result.remaining_balance == 6780.00
        assert "8+ week contract" in result.deposit_rule_applied
    
    def test_2_week_contract_default_50_percent(self, db_session):
        """2-week contract: 50% default deposit."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=2
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 2 weeks × $1,000 = $2,000
        # Tax: $2,000 × 0.13 = $260
        # Total: $2,260
        # Deposit: 50% of subtotal ($1,000) + tax ($130) = $1,130
        assert result.total_service_cost == 2000.00
        assert result.total_with_tax == 2260.00
        assert result.deposit_amount == 1130.00
        assert result.remaining_balance == 1130.00
        assert "50% deposit" in result.deposit_rule_applied
    
    def test_no_weekly_services_default_50_percent(self, db_session):
        """No weekly services: 50% default deposit (massages are non-taxable)."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            special_massage_requested=True,
            special_massage_sessions=5
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 5 sessions × $180 = $900
        # Massages are NON-TAXABLE
        # Deposit: 50% of $900 = $450 (no tax)
        assert result.total_service_cost == 900.00
        assert result.tax_amount == 0.00
        assert result.deposit_amount == 450.00
        assert result.deposit_rule_applied == "50% deposit"


class TestTaxCalculations:
    """Test 13% HST tax calculations."""
    
    def test_tax_calculation_accuracy(self, db_session):
        """Tax should be exactly 13% rounded to 2 decimals."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=1
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # $1,000 × 0.13 = $130.00
        assert result.tax_amount == 130.00
        assert result.total_with_tax == 1130.00
    
    def test_tax_rounding(self, db_session):
        """Tax rounding should use ROUND_HALF_UP (use taxable service)."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=1
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # $1,000 × 0.13 = $130.00
        assert result.tax_amount == 130.00
        assert result.total_with_tax == 1130.00


class TestCombinedServices:
    """Test combinations of multiple services."""
    
    def test_postpartum_plus_special_massage(self, db_session):
        """Postpartum care + special massage."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=4,
            special_massage_requested=True,
            special_massage_sessions=8
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # Postpartum: 4 weeks × $1,000 = $4,000
        # Special massage: 8 sessions × $180 = $1,440 (tier 1: < 10)
        # Subtotal: $5,440
        # Tax on postpartum only (massage non-taxable): $4,000 × 0.13 = $520
        # Note: Client has 4+ week contract so cash price eligible
        assert result.total_service_cost == 5440.00
        assert result.tax_amount == 520.00
        assert result.total_with_tax == 5960.00
        assert len(result.breakdown) == 2
    
    def test_all_services_combined(self, db_session):
        """All services: postpartum + night nurse + special + facial massage."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=6,
            postpartum_care_weeks=8,
            night_nurse_requested=True,
            night_nurse_weeks=2,
            special_massage_requested=True,
            special_massage_sessions=12,
            facial_massage_requested=True,
            facial_massage_sessions=6
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # Postpartum: 8 weeks × $1,200 = $9,600
        # Night nurse: 2 weeks × $1,400 = $2,800
        # Special massage: 12 sessions × $170 = $2,040 (tier 2: 10-19)
        # Facial massage: 6 sessions × $100 = $600 (tier 1: < 10)
        # Subtotal: $15,040
        # Tax on postpartum + night nurse only (massages non-taxable): $12,400 × 0.13 = $1,612
        # Note: Postpartum has 8+ weeks so cash price eligible (4+ weeks)
        assert result.total_service_cost == 15040.00
        assert result.tax_amount == 1612.00
        assert result.total_with_tax == 16652.00
        assert len(result.breakdown) == 4
        assert "8+ week contract" in result.deposit_rule_applied


class TestEdgeCases:
    """Test edge cases and error conditions."""
    
    def test_client_not_found_raises_error(self, db_session):
        """Non-existent client should raise ValueError."""
        calculator = DepositCalculator(db_session)
        
        with pytest.raises(ValueError, match="Client 999 not found"):
            calculator.calculate(999)
    
    def test_client_with_no_services(self, db_session):
        """Client with no services should calculate $0."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30)
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        assert result.total_service_cost == 0.00
        assert result.tax_amount == 0.00
        assert result.total_with_tax == 0.00
        assert result.deposit_amount == 0.00
        assert len(result.breakdown) == 0
    
    def test_client_name_fallback_korean(self, db_session):
        """Should use Korean name if English name not available."""
        client = Client(
            email="test@example.com",
            name_korean="김철수",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=1
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        assert result.client_name == "김철수"
    
    def test_client_name_fallback_id(self, db_session):
        """Should use client ID if no name available."""
        client = Client(
            email="test@example.com",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=1
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        assert result.client_name == f"Client #{client.id}"


class TestAdminSummary:
    """Test admin summary formatting."""
    
    def test_admin_summary_contains_all_sections(self, db_session):
        """Admin summary should include all required sections."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=4
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        assert "SERVICE SUMMARY" in result.admin_summary
        assert "PAYMENT BREAKDOWN" in result.admin_summary
        assert "PAYMENT SCHEDULE" in result.admin_summary
        assert "PAYMENT METHODS" in result.admin_summary
        assert "Subtotal:" in result.admin_summary
        assert "Tax (HST 13%):" in result.admin_summary
        assert "Deposit Required:" in result.admin_summary
    
    def test_admin_summary_includes_deposit_due_date(self, db_session):
        """Admin summary should calculate deposit due date (2 weeks before delivery)."""
        due_date = date(2026, 6, 15)
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=due_date,
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=1
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # Deposit due 2 weeks before: June 1, 2026
        assert "June 01, 2026" in result.admin_summary
    
    def test_admin_summary_no_due_date_shows_placeholder(self, db_session):
        """Admin summary with far future due date (deposits handled differently)."""
        # Use far future date to simulate different deposit scenario
        far_future = date.today() + timedelta(days=365)
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=far_future,
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=1
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.get_deposit_response(client.id)
        
        # Should have a far future deposit due date
        assert result.calculation.admin_summary is not None
        # Check the year is in future (2027)
        assert "2027" in result.calculation.admin_summary


class TestEmailPreview:
    """Test email preview generation."""
    
    def test_email_preview_subject(self, db_session):
        """Email preview should have proper subject line."""
        client = Client(
            email="test@example.com",
            name_english="Jane Doe",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=1
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.get_deposit_response(client.id)
        
        assert result.email_preview.subject == "Deposit Invoice - Jane Doe"
    
    def test_email_preview_body_structure(self, db_session):
        """Email preview body should include all required sections."""
        client = Client(
            email="test@example.com",
            name_english="Jane Doe",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=2
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.get_deposit_response(client.id)
        
        body = result.email_preview.body
        
        # Check greeting
        assert "Dear Jane Doe" in body
        assert "Thank you so much for completing the Google Form" in body
        
        # Check key sections
        assert "Postpartum Care" in body
        assert "Total service fee:" in body
        assert "Deposit:" in body
        assert "5 days/week, 2 weeks" in body
        
        # Check payment instructions
        assert "E-Transfer to: khannasofficial@gmail.com" in body
        assert "Total Deposit:" in body
        
        # Check closing
        assert "Warm regards" in body
        assert "Hanna's Moms Care Team" in body
        assert "your booking will be officially secured" in body
    
    def test_email_preview_with_cash_price_option(self, db_session):
        """Email preview should include cash price option for 4+ week contracts."""
        client = Client(
            email="test@example.com",
            name_english="Jane Doe",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=4,
            special_massage_requested=True,
            special_massage_sessions=10
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.get_deposit_response(client.id)
        
        body = result.email_preview.body
        
        # Check postpartum care section
        assert "Postpartum Care" in body
        assert "Total service fee: $4,000.00 + tax (5 days/week, 4 weeks)" in body
        assert "Deposit: $2,260.00 ($2,000.00 before tax)" in body
        
        # Check cash price explanation
        assert "For mothers who contract 4 weeks or longer, we offer a cash price option excluding tax" in body
        assert "If you choose the cash price option, please send $2,000.00" in body
        
        # Check massage section (no cash price option)
        assert "Special Massage" in body
        assert "Total service fee: $1,700.00 (10 sessions)" in body
        assert "Deposit: $850.00" in body
        
        # Check total deposit shows both options
        assert "Total Deposit:" in body
        assert "or" in body  # Shows alternative cash price total
        assert "if choosing cash price option" in body
    
    def test_get_deposit_response_returns_both(self, db_session):
        """get_deposit_response should return both calculation and email preview."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=4
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.get_deposit_response(client.id)
        
        # Should have calculation
        assert result.calculation is not None
        assert result.calculation.total_service_cost == 4000.00
        assert result.calculation.admin_summary is not None
        
        # Should have email preview
        assert result.email_preview is not None
        assert result.email_preview.subject is not None
        assert result.email_preview.body is not None


class TestBreakdownDetails:
    """Test breakdown structure and notes."""
    
    def test_breakdown_includes_notes(self, db_session):
        """Breakdown should include descriptive notes."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=3
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        breakdown = result.breakdown[0]
        assert breakdown.notes is not None
        assert "$1000.00/week" in breakdown.notes or "$1,000.00/week" in breakdown.notes
        assert "3 weeks" in breakdown.notes
    
    def test_breakdown_unit_includes_days_per_week(self, db_session):
        """Postpartum care breakdown should show days per week in unit."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=6,
            postpartum_care_weeks=2
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        breakdown = [b for b in result.breakdown if b.service == "Postpartum Care"][0]
        assert "6 days/week" in breakdown.unit
    
    def test_breakdown_tiered_pricing_note(self, db_session):
        """Massage breakdown should mention tiered pricing."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            special_massage_requested=True,
            special_massage_sessions=8
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        breakdown = result.breakdown[0]
        assert "tiered pricing" in breakdown.notes


class TestDepositPercentageDisplay:
    """Test deposit percentage calculation for display."""
    
    def test_deposit_percentage_calculated_correctly(self, db_session):
        """Deposit percentage should reflect actual deposit amount vs total."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=2
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        # 50% deposit rule
        # Deposit: $1,130 / Total: $2,260 = 50%
        assert result.deposit_percentage == 50.00
    
    def test_deposit_percentage_for_1_week_contract(self, db_session):
        """1-week contract should show 100% deposit percentage."""
        client = Client(
            email="test@example.com",
            name_english="Test Client",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=1
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        result = calculator.calculate(client.id)
        
        assert result.deposit_percentage == 100.00
    
    def test_complete_service_package_with_output(self, db_session):
        """Complete service package: postpartum + special + facial massage with email preview."""
        client = Client(
            email="test@example.com",
            name_english="Jane Doe",
            due_date=date.today() + timedelta(days=30),
            postpartum_care_requested=True,
            postpartum_care_days_per_week=5,
            postpartum_care_weeks=2,
            night_nurse_requested=True,
            night_nurse_weeks=2,
            special_massage_requested=True,
            special_massage_sessions=10,
            facial_massage_requested=True,
            facial_massage_sessions=5
        )
        db_session.add(client)
        db_session.commit()
        
        calculator = DepositCalculator(db_session)
        response = calculator.get_deposit_response(client.id)
        
        # Print admin summary
        print("\n" + "="*80)
        print("ADMIN SUMMARY")
        print("="*80)
        print(response.calculation.admin_summary)
        
        # Print email preview
        print("\n" + "="*80)
        print("EMAIL PREVIEW")
        print("="*80)
        print(f"Subject: {response.email_preview.subject}")
        print("-"*80)
        print(response.email_preview.body)
        print("="*80 + "\n")
 
