from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal
from datetime import date, datetime


# Type aliases for status values
AssignmentStatus = Literal["in_progress", "completed", "cancelled"]
SwitchCategory = Literal[
    "client_request",
    "doula_unavailable",
    "performance_issue",
    "mutual_agreement",
    "scheduling_conflict",
    "personality_mismatch",
    "language_barrier",
    "other",
]


class AssignmentBase(BaseModel):
    """Base schema for Assignment"""
    client_id: int
    doula_id: int
    current_doula_id: Optional[int] = None
    start_date: date
    end_date: date
    service_type: str = "postpartum_care"
    days_per_week: Optional[int] = None
    total_weeks: Optional[int] = None
    status: AssignmentStatus = "in_progress"
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None

    @field_validator('start_date')
    @classmethod
    def validate_start_date_not_sunday(cls, v, info):
        """Ensure start_date is valid for the schedule"""
        # Sunday is never valid (weekday() returns 6 for Sunday)
        if v.weekday() == 6:
            raise ValueError('start_date cannot be Sunday. Please select Monday through Saturday.')
        
        # If we have days_per_week info, validate accordingly
        if 'days_per_week' in info.data:
            days_per_week = info.data['days_per_week']
            # For 5 days/week, Saturday is also not valid (weekday() returns 5 for Saturday)
            if days_per_week == 5 and v.weekday() == 5:
                raise ValueError('For 5 days/week schedule, start_date must be Monday-Friday.')
        
        return v

    @field_validator('end_date')
    @classmethod
    def validate_date_range(cls, v, info):
        """Ensure end_date is not before start_date"""
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('end_date must be on or after start_date')
        return v


class AssignmentCreate(AssignmentBase):
    """Schema for creating a new Assignment"""
    pass


class AssignmentUpdate(BaseModel):
    """Schema for updating an Assignment"""
    doula_id: Optional[int] = None
    current_doula_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    service_type: Optional[str] = None
    days_per_week: Optional[int] = None
    total_weeks: Optional[int] = None
    status: Optional[AssignmentStatus] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None


class AssignmentResponse(AssignmentBase):
    """Schema for Assignment response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Nested schemas for detailed responses
class ClientSummary(BaseModel):
    """Minimal client info for assignment details"""
    id: int
    name_korean: Optional[str] = None
    name_english: Optional[str] = None
    email: str
    phone_number: Optional[str] = None
    due_date: Optional[date] = None

    class Config:
        from_attributes = True


class DoulaSummary(BaseModel):
    """Minimal doula info for assignment details"""
    id: int
    name_korean: Optional[str] = None
    name_english: Optional[str] = None
    name_preferred: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


class AssignmentDoulaHistoryResponse(BaseModel):
    """A doula coverage period within an assignment"""
    id: int
    assignment_id: int
    doula_id: int
    start_date: date
    end_date: Optional[date] = None
    switch_reason: Optional[str] = None
    switch_category: Optional[SwitchCategory] = None
    notes: Optional[str] = None
    created_at: datetime
    created_by: Optional[str] = None
    doula: DoulaSummary

    class Config:
        from_attributes = True


class AssignmentDoulaSwitchRequest(BaseModel):
    """Request body for switching the active doula on an assignment"""
    new_doula_id: int
    effective_start_date: date
    switch_reason: str
    switch_category: SwitchCategory
    notes: Optional[str] = None
    created_by: Optional[str] = None

    @field_validator('switch_reason')
    @classmethod
    def validate_switch_reason(cls, v):
        if not v or not v.strip():
            raise ValueError('switch_reason is required')
        return v.strip()


class AssignmentWithDetails(AssignmentResponse):
    """Assignment with nested client and doula information"""
    client: ClientSummary
    doula: DoulaSummary
    current_doula: Optional[DoulaSummary] = None
    doula_history: List[AssignmentDoulaHistoryResponse] = Field(default_factory=list)


# Availability checking schemas
class AvailabilityCheckRequest(BaseModel):
    """Request to check doula availability for a date range"""
    start_date: date
    end_date: date
    exclude_assignment_id: Optional[int] = None  # For updates, exclude current assignment

    @field_validator('end_date')
    @classmethod
    def validate_date_range(cls, v, info):
        """Ensure end_date is not before start_date"""
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('end_date must be on or after start_date')
        return v


class AvailableDoulaResponse(BaseModel):
    """Doula with availability status"""
    id: int
    name_korean: Optional[str] = None
    name_english: Optional[str] = None
    name_preferred: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    is_available: bool

    class Config:
        from_attributes = True
