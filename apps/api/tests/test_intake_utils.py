import pytest
from datetime import date

from app.utils import intake_utils as iu


def test_parse_yes_no():
    assert iu.parse_yes_no("Yes") is True
    assert iu.parse_yes_no("예") is True
    assert iu.parse_yes_no("no") is False
    assert iu.parse_yes_no("") is False
    assert iu.parse_yes_no(None) is False


def test_parse_number():
    assert iu.parse_number("5 days") == 5
    assert iu.parse_number("10") == 10
    assert iu.parse_number("none") is None
    assert iu.parse_number(None) is None


def test_parse_pregnancy_number():
    assert iu.parse_pregnancy_number("첫째 / First") == 1
    assert iu.parse_pregnancy_number("second") == 2
    assert iu.parse_pregnancy_number("3") == 3
    assert iu.parse_pregnancy_number(None) is None


def test_parse_date():
    assert iu.parse_date("8/18/2026") == date(2026, 8, 18)
    assert iu.parse_date("2026-08-18") == date(2026, 8, 18)
    assert iu.parse_date("18/08/2026") == date(2026, 8, 18)
    with pytest.raises(ValueError):
        iu.parse_date("not a date")


def test_clean_platform():
    assert iu.clean_platform("카카오톡 채널") == "KakaoTalk"
    assert iu.clean_platform("Instagram") == "Instagram"
    assert iu.clean_platform("Email") == "Email"
    assert iu.clean_platform(None) is None
    assert iu.clean_platform("Other") == "Other"


def test_clean_referral_and_language():
    assert iu.clean_referral("친구 / Friend") == "Friend"
    assert iu.clean_referral("family") == "Family"
    assert iu.clean_referral(None) is None

    assert iu.clean_language("한국어 / Korean") == "Korean"
    assert iu.clean_language("English") == "English"
    assert iu.clean_language(None) is None


def test_format_phone_number():
    # 10 digits without separators -> formatted
    assert iu.format_phone_number("1234567890") == "123-456-7890"
    
    # 10 digits with spaces -> formatted
    assert iu.format_phone_number("123 456 7890") == "123-456-7890"
    
    # Already in correct format -> no change
    assert iu.format_phone_number("123-456-7890") == "123-456-7890"
    
    # Mixed separators (dots, spaces) with 10 digits -> formatted
    assert iu.format_phone_number("123.456.7890") == "123-456-7890"
    assert iu.format_phone_number("123 456-7890") == "123-456-7890"
    
    # Not 10 digits -> leave as is
    assert iu.format_phone_number("12345") == "12345"
    assert iu.format_phone_number("123-45-6789") == "123-45-6789"
    assert iu.format_phone_number("+1 123 456 7890") == "+1 123 456 7890"
    
    # Empty or None -> return as is
    assert iu.format_phone_number(None) is None


