from pydantic import BaseModel, EmailStr
from typing import Optional


class ServiceIntakeRequest(BaseModel):
    """Schema for Google Form intake data - raw form values"""
    email: EmailStr
    name_korean: Optional[str] = None
    name_english: Optional[str] = None
    residential_area: Optional[str] = None
    home_address: Optional[str] = None
    phone_number: Optional[str] = None
    due_date: str  # will be parsed in backend
    preferred_language: Optional[str] = None

    pregnancy_number_text: Optional[str] = None
    is_twins: Optional[str] = None

    contact_platform: Optional[str] = None
    platform_username: Optional[str] = None

    postpartum_care_service: Optional[str] = None
    postpartum_care_days_per_week: Optional[str] = None
    postpartum_care_weeks: Optional[str] = None

    special_massage_service: Optional[str] = None
    special_massage_sessions: Optional[str] = None

    facial_massage_service: Optional[str] = None
    facial_massage_sessions: Optional[str] = None

    rmt_massage_service: Optional[str] = None

    night_nurse_service: Optional[str] = None
    night_nurse_weeks: Optional[str] = None

    visitor_parking: Optional[str] = None
    has_pets: Optional[str] = None
    other_household_members: Optional[str] = None

    cultural_background: Optional[str] = None
    familiar_with_korean_food: Optional[str] = None
    preferred_cuisine: Optional[str] = None

    referral_source: Optional[str] = None
    referrer_name: Optional[str] = None


class ServiceIntakeResponse(BaseModel):
    success: bool
    client_id: int
    message: str
