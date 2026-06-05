from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional
from datetime import datetime, date


class DoulaBase(BaseModel):
    """Base schema for Doula with required fields"""
    name_korean: Optional[str] = None
    name_english: Optional[str] = None
    name_preferred: Optional[str] = None
    date_of_birth: Optional[date] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    legal_status: Optional[str] = None  # e.g., citizen, permanent_resident, work_permit
    has_tdap: bool = False  # Tdap vaccination
    has_mmr: bool = False  # MMR vaccination
    has_varicella: bool = False  # Varicella vaccination
    has_hep_b: bool = False  # Hepatitis B vaccination
    languages: Optional[str] = None  # Comma-separated list
    service_area: Optional[str] = None  # Comma-separated list of service areas
    start_year: Optional[int] = None  # Year started working as doula
    pet_allergies: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None

    @model_validator(mode='after')
    def validate_at_least_one_name(self):
        """Ensure at least one name is provided"""
        if not self.name_korean and not self.name_english and not self.name_preferred:
            raise ValueError('At least one of name_preferred, name_korean, or name_english must be provided')
        return self


class DoulaCreate(DoulaBase):
    """Schema for creating a new Doula"""
    pass


class DoulaUpdate(BaseModel):
    """Schema for updating a Doula"""
    name_korean: Optional[str] = None
    name_english: Optional[str] = None
    name_preferred: Optional[str] = None
    date_of_birth: Optional[date] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    legal_status: Optional[str] = None
    languages: Optional[str] = None
    service_area: Optional[str] = None
    start_year: Optional[int] = None
    has_tdap: Optional[bool] = None
    has_mmr: Optional[bool] = None
    has_varicella: Optional[bool] = None
    has_hep_b: Optional[bool] = None
    pet_allergies: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class DoulaResponse(DoulaBase):
    """Schema for Doula response"""
    id: int
    vaccination_status: str  # Computed field: fully_vaccinated, partially_vaccinated, not_vaccinated
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DoulaWithAvailability(DoulaResponse):
    """Doula response with availability indicator for a specific date range"""
    is_available: bool = True  # Will be computed based on existing assignments
