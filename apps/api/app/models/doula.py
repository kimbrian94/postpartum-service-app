from sqlalchemy import Column, Integer, String, Boolean, Text, TIMESTAMP, Date, Computed
from sqlalchemy.sql import func
from app.database import Base


class Doula(Base):
    """
    Doula/Caregiver model - represents care providers who can be assigned to clients.
    These are managed resources (not user accounts).
    """
    __tablename__ = "doulas"

    id = Column(Integer, primary_key=True, index=True)
    name_korean = Column(String(255), index=True)
    name_english = Column(String(255), index=True)
    name_preferred = Column(String(255), index=True)
    date_of_birth = Column(Date)
    phone_number = Column(String(50))
    email = Column(String(255), index=True)
    legal_status = Column(String(100))  # e.g., citizen, permanent_resident, work_permit
    languages = Column(Text)  # Comma-separated list of languages spoken
    service_area = Column(Text)  # Comma-separated list of service areas (or 'All Areas')
    start_year = Column(Integer)  # Year started working as doula
    has_tdap = Column(Boolean, default=False, nullable=False)  # Tdap vaccination
    has_mmr = Column(Boolean, default=False, nullable=False)  # MMR vaccination
    has_varicella = Column(Boolean, default=False, nullable=False)  # Varicella vaccination
    has_hep_b = Column(Boolean, default=False, nullable=False)  # Hepatitis B vaccination
    vaccination_status = Column(
        String(100),
        Computed(
            """
            CASE 
                WHEN has_tdap AND has_mmr AND has_varicella AND has_hep_b THEN 'fully_vaccinated'
                WHEN has_tdap OR has_mmr OR has_varicella OR has_hep_b THEN 'partially_vaccinated'
                ELSE 'not_vaccinated'
            END
            """,
            persisted=True
        )
    )
    pet_allergies = Column(Text)  # Description of any pet allergies
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    notes = Column(Text)  # Internal notes about doula (certifications, preferences, etc.)
    
    created_at = Column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp()
    )
    updated_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )
