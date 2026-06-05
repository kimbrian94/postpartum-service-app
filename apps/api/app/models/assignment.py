from sqlalchemy import Column, Integer, String, Date, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Assignment(Base):
    """
    Assignment model - links clients to doulas for a specific service period.
    Represents the full duration of a service engagement (e.g., 2 weeks of postpartum care).
    """
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    doula_id = Column(Integer, ForeignKey("doulas.id", ondelete="RESTRICT"), nullable=False, index=True)
    current_doula_id = Column(Integer, ForeignKey("doulas.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    # Date range for the assignment
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    
    # Service details
    service_type = Column(String(100), nullable=False, default="postpartum_care")  # Future: massage, night_nurse, etc.
    days_per_week = Column(Integer)  # e.g., 5 days per week
    total_weeks = Column(Integer)  # e.g., 2 weeks
    
    # Status tracking
    status = Column(
        String(50), 
        nullable=False, 
        default="not_started", 
        index=True
    )  # not_started, in_progress, completed, cancelled
    
    # Additional info
    notes = Column(Text)  # Assignment-specific notes
    cancellation_reason = Column(Text)  # Reason for cancellation (if status is cancelled)
    
    created_at = Column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp()
    )
    updated_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )
    
    # Relationships
    client = relationship("Client", backref="assignments")
    doula = relationship("Doula", foreign_keys=[doula_id], backref="assignments")
    current_doula = relationship("Doula", foreign_keys=[current_doula_id])
    doula_history = relationship(
        "AssignmentDoulaHistory",
        back_populates="assignment",
        cascade="all, delete-orphan",
        order_by="AssignmentDoulaHistory.start_date",
    )


class AssignmentDoulaHistory(Base):
    """
    Tracks which doula covered an assignment during a specific date range.
    An end_date of NULL means this is the current active doula.
    """
    __tablename__ = "assignment_doula_history"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    doula_id = Column(Integer, ForeignKey("doulas.id", ondelete="RESTRICT"), nullable=False, index=True)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, index=True)
    switch_reason = Column(Text)
    switch_category = Column(String(50))
    notes = Column(Text)
    created_by = Column(String(255))
    created_at = Column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp()
    )

    assignment = relationship("Assignment", back_populates="doula_history")
    doula = relationship("Doula")
