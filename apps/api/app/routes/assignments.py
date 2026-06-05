from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.database import get_db
from app.models.assignment import Assignment, AssignmentDoulaHistory
from app.models.doula import Doula
from app.models.client import Client
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentWithDetails,
    AssignmentDoulaHistoryResponse,
    AssignmentDoulaSwitchRequest,
    AvailabilityCheckRequest,
    AvailableDoulaResponse,
)
from app.core.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()
BUSINESS_TIMEZONE = ZoneInfo("America/Toronto")


def get_business_date() -> date:
    """Return the app's business date for lifecycle events."""
    return datetime.now(BUSINESS_TIMEZONE).date()


def check_doula_availability(
    db: Session,
    doula_id: int,
    start_date: date,
    end_date: date,
    exclude_assignment_id: Optional[int] = None
) -> bool:
    """
    Check if a doula is available for the given date range.
    Returns True if doula has NO overlapping assignments.
    """
    query = db.query(Assignment).filter(
        Assignment.current_doula_id == doula_id,
        Assignment.start_date <= end_date,
        Assignment.end_date >= start_date,
        Assignment.status != "cancelled",
    )
    
    # Exclude current assignment when updating
    if exclude_assignment_id:
        query = query.filter(Assignment.id != exclude_assignment_id)
    
    conflicting_assignments = query.count()
    return conflicting_assignments == 0


def validate_no_client_overlap(
    db: Session,
    client_id: int,
    start_date: date,
    end_date: date,
    exclude_assignment_id: Optional[int] = None
) -> None:
    """
    Validate that the client doesn't have overlapping assignments.
    Raises HTTPException if overlap detected.
    """
    query = db.query(Assignment).filter(
        Assignment.client_id == client_id,
        Assignment.start_date <= end_date,
        Assignment.end_date >= start_date,
    )
    
    if exclude_assignment_id:
        query = query.filter(Assignment.id != exclude_assignment_id)
    
    if query.first():
        raise HTTPException(
            status_code=400,
            detail="Client already has an assignment during this date range"
        )


def sync_assignment_doula_history_status(db: Session, assignment: Assignment) -> None:
    """
    Keep the active doula history row aligned with assignment lifecycle status.
    Completed/cancelled assignments should not keep an open active coverage row.
    """
    active_history = (
        db.query(AssignmentDoulaHistory)
        .filter(
            AssignmentDoulaHistory.assignment_id == assignment.id,
            AssignmentDoulaHistory.end_date.is_(None),
        )
        .first()
    )

    if assignment.status in ("completed", "cancelled"):
        if active_history:
            if assignment.status == "completed":
                active_history.end_date = assignment.end_date
            else:
                cancellation_date = get_business_date()
                if cancellation_date < active_history.start_date:
                    active_history.start_date = cancellation_date
                active_history.end_date = cancellation_date
        return

    if assignment.status == "in_progress" and not active_history:
        latest_history = (
            db.query(AssignmentDoulaHistory)
            .filter(AssignmentDoulaHistory.assignment_id == assignment.id)
            .order_by(AssignmentDoulaHistory.start_date.desc(), AssignmentDoulaHistory.id.desc())
            .first()
        )
        if latest_history and latest_history.switch_category is None:
            latest_history.end_date = None
        elif not latest_history:
            db.add(AssignmentDoulaHistory(
                assignment_id=assignment.id,
                doula_id=assignment.current_doula_id or assignment.doula_id,
                start_date=assignment.start_date,
            ))


@router.post("/", response_model=AssignmentResponse, status_code=201)
def create_assignment(assignment: AssignmentCreate, db: Session = Depends(get_db)):
    """Create a new assignment with availability validation"""
    logger.info(
        f"Creating assignment: Client={assignment.client_id}, "
        f"Doula={assignment.doula_id}, Dates={assignment.start_date} to {assignment.end_date}"
    )
    
    # Validate client exists
    client = db.query(Client).filter(Client.id == assignment.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail=f"Client {assignment.client_id} not found")
    
    # Validate doula exists and is active
    doula = db.query(Doula).filter(Doula.id == assignment.doula_id).first()
    if not doula:
        raise HTTPException(status_code=404, detail=f"Doula {assignment.doula_id} not found")
    if not doula.is_active:
        doula_name = doula.name_preferred or doula.name_english or doula.name_korean or "Unknown"
        raise HTTPException(status_code=400, detail=f"Doula {doula_name} is not active")
    
    # Check client doesn't have overlapping assignments
    validate_no_client_overlap(
        db, assignment.client_id, assignment.start_date, assignment.end_date
    )
    
    # Check doula availability
    if not check_doula_availability(
        db, assignment.doula_id, assignment.start_date, assignment.end_date
    ):
        doula_name = doula.name_preferred or doula.name_english or doula.name_korean or "Unknown"
        raise HTTPException(
            status_code=400,
            detail=f"Doula {doula_name} is not available for the selected date range"
        )
    
    try:
        db_assignment = Assignment(
            client_id=assignment.client_id,
            doula_id=assignment.doula_id,
            current_doula_id=assignment.doula_id,
            start_date=assignment.start_date,
            end_date=assignment.end_date,
            service_type=assignment.service_type,
            days_per_week=assignment.days_per_week,
            total_weeks=assignment.total_weeks,
            status=assignment.status,
            notes=assignment.notes,
        )
        
        db.add(db_assignment)
        db.flush()

        initial_history_end_date = None
        initial_history_start_date = assignment.start_date
        if assignment.status == "completed":
            initial_history_end_date = assignment.end_date
        elif assignment.status == "cancelled":
            initial_history_end_date = get_business_date()
            if initial_history_end_date < initial_history_start_date:
                initial_history_start_date = initial_history_end_date

        db.add(AssignmentDoulaHistory(
            assignment_id=db_assignment.id,
            doula_id=assignment.doula_id,
            start_date=initial_history_start_date,
            end_date=initial_history_end_date,
        ))

        db.commit()
        db.refresh(db_assignment)
        
        logger.info(f"Assignment created successfully: ID={db_assignment.id}")
        return db_assignment
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating assignment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error creating assignment: {str(e)}")


@router.get("/", response_model=List[AssignmentWithDetails])
def list_assignments(
    start_date: Optional[date] = Query(None, description="Filter assignments starting on or after this date"),
    end_date: Optional[date] = Query(None, description="Filter assignments ending on or before this date"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    doula_id: Optional[int] = Query(None, description="Filter by doula ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """Get list of assignments with optional filters"""
    logger.info(f"Fetching assignments with filters: start={start_date}, end={end_date}, client={client_id}, doula={doula_id}, status={status}")
    
    try:
        query = db.query(Assignment)
        
        # Apply filters
        if start_date:
            query = query.filter(Assignment.end_date >= start_date)
        if end_date:
            query = query.filter(Assignment.start_date <= end_date)
        if client_id:
            query = query.filter(Assignment.client_id == client_id)
        if doula_id:
            query = query.filter(Assignment.current_doula_id == doula_id)
        if status:
            query = query.filter(Assignment.status == status)
        
        assignments = query.order_by(Assignment.start_date.desc()).all()
        
        logger.info(f"Retrieved {len(assignments)} assignments")
        return assignments
    
    except Exception as e:
        logger.error(f"Error fetching assignments: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching assignments: {str(e)}")


@router.get("/available-doulas", response_model=List[AvailableDoulaResponse])
def get_available_doulas(
    start_date: date = Query(..., description="Assignment start date"),
    end_date: date = Query(..., description="Assignment end date"),
    exclude_assignment_id: Optional[int] = Query(None, description="Exclude this assignment when checking (for updates)"),
    db: Session = Depends(get_db)
):
    """Get list of doulas with availability status for the given date range"""
    logger.info(f"Checking doula availability for {start_date} to {end_date}")
    
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="end_date must be on or after start_date")
    
    try:
        # Get all active doulas
        doulas = db.query(Doula).filter(Doula.is_active == True).order_by(Doula.name_preferred, Doula.name_english, Doula.name_korean).all()
        
        # Check availability for each
        available_doulas = []
        for doula in doulas:
            is_available = check_doula_availability(
                db, doula.id, start_date, end_date, exclude_assignment_id
            )
            available_doulas.append(
                AvailableDoulaResponse(
                    id=doula.id,
                    name_korean=doula.name_korean,
                    name_english=doula.name_english,
                    name_preferred=doula.name_preferred,
                    phone_number=doula.phone_number,
                    email=doula.email,
                    is_available=is_available,
                )
            )
        
        available_count = sum(1 for d in available_doulas if d.is_available)
        logger.info(f"Found {available_count} available doulas out of {len(doulas)} total")
        
        return available_doulas
    
    except Exception as e:
        logger.error(f"Error checking doula availability: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error checking availability: {str(e)}")


@router.get("/{assignment_id}", response_model=AssignmentWithDetails)
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Get a specific assignment by ID with full details"""
    logger.info(f"Fetching assignment ID: {assignment_id}")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    
    if not assignment:
        logger.warning(f"Assignment not found: ID={assignment_id}")
        raise HTTPException(status_code=404, detail=f"Assignment with ID {assignment_id} not found")
    
    return assignment


@router.put("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: int,
    assignment_update: AssignmentUpdate,
    db: Session = Depends(get_db)
):
    """Update an assignment"""
    logger.info(f"Updating assignment ID: {assignment_id}")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    
    if not assignment:
        logger.warning(f"Assignment not found: ID={assignment_id}")
        raise HTTPException(status_code=404, detail=f"Assignment with ID {assignment_id} not found")
    
    try:
        update_data = assignment_update.model_dump(exclude_unset=True)

        if 'doula_id' in update_data and update_data['doula_id'] != assignment.current_doula_id:
            raise HTTPException(
                status_code=400,
                detail="Use the switch doula action to change the assigned doula"
            )
        if 'current_doula_id' in update_data and update_data['current_doula_id'] != assignment.current_doula_id:
            raise HTTPException(
                status_code=400,
                detail="Use the switch doula action to change the assigned doula"
            )
        
        # If dates are being updated, check availability for the current doula
        new_start = update_data.get('start_date', assignment.start_date)
        new_end = update_data.get('end_date', assignment.end_date)
        new_doula_id = assignment.current_doula_id
        
        # Validate date range
        if new_end < new_start:
            raise HTTPException(status_code=400, detail="end_date must be on or after start_date")
        
        # Check if dates changed - if so, validate availability
        if (new_start != assignment.start_date or 
            new_end != assignment.end_date):
            
            # Check client doesn't have overlapping assignments
            validate_no_client_overlap(
                db, assignment.client_id, new_start, new_end, assignment_id
            )
            
            # Check doula availability
            if not check_doula_availability(db, new_doula_id, new_start, new_end, assignment_id):
                raise HTTPException(
                    status_code=400,
                    detail=f"Doula is not available for the selected date range"
                )
        
        # Apply updates
        for field, value in update_data.items():
            if field not in ("doula_id", "current_doula_id"):
                setattr(assignment, field, value)

        sync_assignment_doula_history_status(db, assignment)
        
        db.commit()
        db.refresh(assignment)
        
        logger.info(f"Assignment updated successfully: ID={assignment.id}")
        return assignment
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating assignment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error updating assignment: {str(e)}")


@router.get("/{assignment_id}/doula-history", response_model=List[AssignmentDoulaHistoryResponse])
def get_assignment_doula_history(assignment_id: int, db: Session = Depends(get_db)):
    """Get the doula switch history for an assignment"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail=f"Assignment with ID {assignment_id} not found")

    return (
        db.query(AssignmentDoulaHistory)
        .filter(AssignmentDoulaHistory.assignment_id == assignment_id)
        .order_by(AssignmentDoulaHistory.start_date.asc(), AssignmentDoulaHistory.id.asc())
        .all()
    )


@router.post("/{assignment_id}/switch-doula", response_model=AssignmentWithDetails)
def switch_assignment_doula(
    assignment_id: int,
    switch_request: AssignmentDoulaSwitchRequest,
    db: Session = Depends(get_db)
):
    """Switch the active doula for an assignment and preserve switch history"""
    logger.info(
        f"Switching assignment ID={assignment_id} to doula ID={switch_request.new_doula_id} "
        f"effective {switch_request.effective_start_date}"
    )

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail=f"Assignment with ID {assignment_id} not found")
    if assignment.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot switch doula for a cancelled assignment")

    new_doula = db.query(Doula).filter(Doula.id == switch_request.new_doula_id).first()
    if not new_doula:
        raise HTTPException(status_code=404, detail=f"Doula {switch_request.new_doula_id} not found")
    if not new_doula.is_active:
        doula_name = new_doula.name_preferred or new_doula.name_english or new_doula.name_korean or "Unknown"
        raise HTTPException(status_code=400, detail=f"Doula {doula_name} is not active")
    if switch_request.new_doula_id == assignment.current_doula_id:
        raise HTTPException(status_code=400, detail="New doula must be different from the current doula")
    if switch_request.effective_start_date <= assignment.start_date:
        raise HTTPException(status_code=400, detail="Switch date must be after the assignment start date")
    if switch_request.effective_start_date > assignment.end_date:
        raise HTTPException(status_code=400, detail="Switch date must be within the assignment date range")

    active_history = (
        db.query(AssignmentDoulaHistory)
        .filter(
            AssignmentDoulaHistory.assignment_id == assignment_id,
            AssignmentDoulaHistory.end_date.is_(None),
        )
        .first()
    )
    if not active_history:
        active_history = AssignmentDoulaHistory(
            assignment_id=assignment.id,
            doula_id=assignment.current_doula_id or assignment.doula_id,
            start_date=assignment.start_date,
        )
        db.add(active_history)
        db.flush()

    if switch_request.effective_start_date <= active_history.start_date:
        raise HTTPException(status_code=400, detail="Switch date must be after the current doula start date")

    if not check_doula_availability(
        db,
        switch_request.new_doula_id,
        switch_request.effective_start_date,
        assignment.end_date,
        assignment_id,
    ):
        doula_name = new_doula.name_preferred or new_doula.name_english or new_doula.name_korean or "Unknown"
        raise HTTPException(
            status_code=400,
            detail=f"Doula {doula_name} is not available from the switch date through assignment end date"
        )

    try:
        active_history.end_date = switch_request.effective_start_date - timedelta(days=1)
        active_history.switch_reason = switch_request.switch_reason
        active_history.switch_category = switch_request.switch_category
        active_history.notes = switch_request.notes
        active_history.created_by = switch_request.created_by

        db.add(AssignmentDoulaHistory(
            assignment_id=assignment.id,
            doula_id=switch_request.new_doula_id,
            start_date=switch_request.effective_start_date,
        ))

        assignment.current_doula_id = switch_request.new_doula_id
        assignment.doula_id = switch_request.new_doula_id

        db.commit()
        db.refresh(assignment)
        logger.info(f"Doula switched successfully for assignment ID={assignment_id}")
        return assignment
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error switching doula: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error switching doula: {str(e)}")


@router.delete("/{assignment_id}", status_code=204)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Delete an assignment"""
    logger.info(f"Deleting assignment ID: {assignment_id}")
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    
    if not assignment:
        logger.warning(f"Assignment not found: ID={assignment_id}")
        raise HTTPException(status_code=404, detail=f"Assignment with ID {assignment_id} not found")
    
    try:
        db.delete(assignment)
        db.commit()
        
        logger.info(f"Assignment deleted successfully: ID={assignment_id}")
        return None
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting assignment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error deleting assignment: {str(e)}")
