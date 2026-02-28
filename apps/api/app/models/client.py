from sqlalchemy import Column, Integer, String, Date, Boolean, Text, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    name_korean = Column(String(255))
    name_english = Column(String(255))
    due_date = Column(Date, nullable=False, index=True)
    actual_delivery_date = Column(Date)
    residential_area = Column(String(255))
    home_address = Column(Text)
    phone_number = Column(String(50))
    # Intake / Denormalized service request fields (temporary)
    is_twins = Column(Boolean, default=False)
    has_pets = Column(Boolean, default=False)
    visitor_parking_available = Column(Boolean, default=False)
    other_household_members = Column(Text)
    pregnancy_number = Column(Integer)
    cultural_background = Column(String(255))
    familiar_with_korean_food = Column(Boolean, default=True)
    preferred_cuisine = Column(Text)
    # Denormalized service request columns
    postpartum_care_requested = Column(Boolean, default=False)
    postpartum_care_days_per_week = Column(Integer)
    postpartum_care_weeks = Column(Integer)

    special_massage_requested = Column(Boolean, default=False)
    special_massage_sessions = Column(Integer)

    facial_massage_requested = Column(Boolean, default=False)
    facial_massage_sessions = Column(Integer)

    rmt_massage_requested = Column(Boolean, default=False)

    night_nurse_requested = Column(Boolean, default=False)
    night_nurse_weeks = Column(Integer)
    referral_source = Column(String(255))
    contact_platform = Column(String(100))
    platform_username = Column(String(255))
    referrer_name = Column(String(255))
    preferred_language = Column(String(50))
    night_nurse_weeks = Column(Integer)
    internal_notes = Column(Text)
    status = Column(String(50), nullable=False, default="pending_deposit", index=True)
    created_at = Column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp()
    )
    updated_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )
