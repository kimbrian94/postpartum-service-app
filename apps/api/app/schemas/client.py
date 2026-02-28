from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional
from datetime import date, datetime
import re


class ClientBase(BaseModel):
    email: EmailStr
    name_korean: Optional[str] = None
    name_english: Optional[str] = None
    due_date: date
    actual_delivery_date: Optional[date] = None
    residential_area: Optional[str] = None
    home_address: Optional[str] = None
    phone_number: Optional[str] = None
    has_pets: bool = False
    visitor_parking_available: bool = False
    other_household_members: Optional[str] = None
    pregnancy_number: Optional[int] = None
    cultural_background: Optional[str] = None
    familiar_with_korean_food: bool = True
    preferred_cuisine: Optional[str] = None
    referral_source: Optional[str] = None
    contact_platform: Optional[str] = None
    platform_username: Optional[str] = None
    referrer_name: Optional[str] = None
    preferred_language: Optional[str] = None
    night_nurse_weeks: Optional[int] = None
    internal_notes: Optional[str] = None
    # Intake denormalized fields
    is_twins: bool = False
    postpartum_care_requested: bool = False
    postpartum_care_days_per_week: Optional[int] = None
    postpartum_care_weeks: Optional[int] = None
    special_massage_requested: bool = False
    special_massage_sessions: Optional[int] = None
    facial_massage_requested: bool = False
    facial_massage_sessions: Optional[int] = None
    rmt_massage_requested: bool = False
    night_nurse_requested: bool = False
    status: str = "pending_deposit"


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name_korean: Optional[str] = None
    name_english: Optional[str] = None
    due_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    residential_area: Optional[str] = None
    home_address: Optional[str] = None
    phone_number: Optional[str] = None
    has_pets: Optional[bool] = None
    visitor_parking_available: Optional[bool] = None
    other_household_members: Optional[str] = None
    pregnancy_number: Optional[int] = None
    cultural_background: Optional[str] = None
    familiar_with_korean_food: Optional[bool] = None
    preferred_cuisine: Optional[str] = None
    referral_source: Optional[str] = None
    contact_platform: Optional[str] = None
    platform_username: Optional[str] = None
    referrer_name: Optional[str] = None
    preferred_language: Optional[str] = None
    night_nurse_weeks: Optional[int] = None
    internal_notes: Optional[str] = None
    is_twins: Optional[bool] = None
    postpartum_care_requested: Optional[bool] = None
    postpartum_care_days_per_week: Optional[int] = None
    postpartum_care_weeks: Optional[int] = None
    special_massage_requested: Optional[bool] = None
    special_massage_sessions: Optional[int] = None
    facial_massage_requested: Optional[bool] = None
    facial_massage_sessions: Optional[int] = None
    rmt_massage_requested: Optional[bool] = None
    night_nurse_requested: Optional[bool] = None
    status: Optional[str] = None
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v):
        if v is not None and v.strip():
            # Allow digits, spaces, dashes, plus, and parentheses
            if not re.match(r'^[\d\s\-\+\(\)]+$', v):
                raise ValueError('Phone number contains invalid characters')
        return v
    
    @field_validator('pregnancy_number')
    @classmethod
    def validate_pregnancy_number(cls, v):
        if v is not None:
            if v < 1:
                raise ValueError('Pregnancy number must be at least 1')
            if v > 20:
                raise ValueError('Pregnancy number seems unusually high (max 20)')
        return v
    
    @field_validator('postpartum_care_days_per_week')
    @classmethod
    def validate_care_days(cls, v):
        if v is not None:
            if v < 1 or v > 7:
                raise ValueError('Days per week must be between 1 and 7')
        return v
    
    @field_validator('postpartum_care_weeks', 'night_nurse_weeks')
    @classmethod
    def validate_weeks(cls, v):
        if v is not None:
            if v < 1:
                raise ValueError('Weeks must be at least 1')
            if v > 52:
                raise ValueError('Weeks cannot exceed 52')
        return v
    
    @field_validator('special_massage_sessions', 'facial_massage_sessions')
    @classmethod
    def validate_sessions(cls, v):
        if v is not None:
            if v < 1:
                raise ValueError('Sessions must be at least 1')
            if v > 100:
                raise ValueError('Sessions cannot exceed 100')
        return v
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v is not None:
            valid_statuses = [
                'pending_deposit',
                'deposit_received',
                'full_payment_received',
                'service_in_progress',
                'service_completed',
                'cancelled'
            ]
            if v not in valid_statuses:
                raise ValueError(f'Status must be one of: {", ".join(valid_statuses)}')
        return v
    
    @model_validator(mode='after')
    def validate_delivery_date(self):
        if self.actual_delivery_date and self.due_date:
            days_diff = abs((self.actual_delivery_date - self.due_date).days)
            if days_diff > 30:
                raise ValueError('Delivery date is more than 30 days from due date. Please verify.')
        return self
    
    @model_validator(mode='after')
    def validate_service_logic(self):
        if self.postpartum_care_requested and not self.postpartum_care_weeks:
            raise ValueError('Please specify care weeks when postpartum care is requested')
        if self.special_massage_requested and not self.special_massage_sessions:
            raise ValueError('Please specify sessions when special massage is requested')
        if self.facial_massage_requested and not self.facial_massage_sessions:
            raise ValueError('Please specify sessions when facial massage is requested')
        return self


class ClientResponse(ClientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.strftime('%Y-%m-%dT%H:%M:%S') + 'Z' if v else None
        }
