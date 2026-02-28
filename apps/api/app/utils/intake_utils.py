from datetime import datetime
from typing import Optional
import re


def parse_yes_no(value: Optional[str]) -> bool:
    if not value:
        return False
    return str(value).strip().lower() in ["yes", "y", "예", "true"]


def parse_number(value: Optional[str]) -> Optional[int]:
    if value is None:
        return None
    match = re.search(r"\d+", str(value))
    return int(match.group()) if match else None


def parse_pregnancy_number(value: Optional[str]) -> Optional[int]:
    if not value:
        return None
    v = value.lower()
    if "첫째" in v or "first" in v:
        return 1
    if "둘째" in v or "second" in v:
        return 2
    if "셋째" in v or "third" in v:
        return 3
    return parse_number(value)


def parse_date(date_str: str) -> datetime.date:
    formats = ["%m/%d/%Y", "%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%m/%d/%Y %H:%M:%S"]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except Exception:
            continue
    raise ValueError(f"Unable to parse date: {date_str}")


def clean_platform(platform: Optional[str]) -> Optional[str]:
    if not platform:
        return None
    p = platform.lower()
    if "kakao" in p or "카카오" in p:
        return "KakaoTalk"
    if "instagram" in p or "인스타" in p:
        return "Instagram"
    if "email" in p or "이메일" in p:
        return "Email"
    return platform.strip()


def clean_referral(referral: Optional[str]) -> Optional[str]:
    if not referral:
        return None
    r = referral.lower()
    if "친구" in r or "friend" in r:
        return "Friend"
    if "가족" in r or "family" in r:
        return "Family"
    if "instagram" in r:
        return "Instagram"
    return referral.strip()


def clean_language(lang: Optional[str]) -> Optional[str]:
    if not lang:
        return None
    l = lang.lower()
    if "한국어" in l or "korean" in l:
        return "Korean"
    if "영어" in l or "english" in l:
        return "English"
    return lang.split("/")[0].strip() if "/" in lang else lang.strip()


def format_phone_number(phone: Optional[str]) -> Optional[str]:
    """Format phone number to xxx-xxx-xxxx format.
    
    Handles:
    - xxxxxxxxxx (10 digits no separators) -> xxx-xxx-xxxx
    - xxx xxx xxxx (spaces) -> xxx-xxx-xxxx
    - xxx-xxx-xxxx (already correct) -> no change
    - anything else -> leave as is
    """
    if not phone:
        return None
    
    phone = phone.strip()
    
    # Already in correct format
    if re.match(r'^\d{3}-\d{3}-\d{4}$', phone):
        return phone
    
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)
    
    # Only format if we have exactly 10 digits
    if len(digits) == 10:
        return f"{digits[0:3]}-{digits[3:6]}-{digits[6:10]}"
    
    # Otherwise, leave as is
    return phone
