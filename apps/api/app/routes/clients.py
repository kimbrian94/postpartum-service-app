from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import ValidationError
from app.database import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientResponse, ClientCreate, ClientUpdate
from app.core.security import get_current_user
from app.core.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.get("/", response_model=List[ClientResponse])
def get_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all clients with optional filtering and pagination.

    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    - **status**: Filter by client status
    - **search**: Search by name (Korean or English) or email
    """
    query = db.query(Client)

    # Filter by status if provided
    if status:
        query = query.filter(Client.status == status)

    # Search functionality
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Client.name_korean.ilike(search_term))
            | (Client.name_english.ilike(search_term))
            | (Client.email.ilike(search_term))
        )

    # Order by due date (upcoming first)
    query = query.order_by(Client.due_date.asc())

    clients = query.offset(skip).limit(limit).all()
    logger.info(
        f"Retrieved {len(clients)} clients | "
        f"Filters: status={status}, search={search} | "
        f"User: {current_user.email}"
    )
    return clients


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific client by ID.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("/", response_model=ClientResponse, status_code=201)
def create_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new client record.
    """
    logger.info(f"Creating new client: {client.email} | User: {current_user.email}")
    
    db_client = Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    
    logger.info(f"Client created successfully: ID={db_client.id}, Email={db_client.email}")
    return db_client


@router.patch("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    client_update: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing client record with comprehensive validation.
    Returns a list of validation errors if validation fails.
    """
    logger.info(f"Updating client ID={client_id} | User: {current_user.email}")
    
    # Find the client
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        logger.warning(f"Update failed: Client not found - ID={client_id}")
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get the update data
    update_data = client_update.model_dump(exclude_unset=True)
    logger.debug(f"Update data for client {client_id}: {list(update_data.keys())}")
    
    # Collect all validation errors
    validation_errors = []
    
    # Additional validation: at least one name must be present
    if 'name_english' in update_data or 'name_korean' in update_data:
        new_name_english = update_data.get('name_english', db_client.name_english)
        new_name_korean = update_data.get('name_korean', db_client.name_korean)
        
        if not new_name_english and not new_name_korean:
            validation_errors.append({
                "field": "name_english",
                "message": "At least one name (English or Korean) is required"
            })
            validation_errors.append({
                "field": "name_korean",
                "message": "At least one name (English or Korean) is required"
            })
    
    # Additional validation: check for duplicate email if email is being updated
    if 'email' in update_data:
        existing_client = db.query(Client).filter(
            Client.email == update_data['email'],
            Client.id != client_id
        ).first()
        if existing_client:
            validation_errors.append({
                "field": "email",
                "message": "A client with this email already exists"
            })
    
    # If there are validation errors, return them
    if validation_errors:
        logger.warning(
            f"Validation failed for client {client_id}: "
            f"{len(validation_errors)} error(s)"
        )
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Validation failed",
                "errors": validation_errors
            }
        )
    
    # Apply updates
    for field, value in update_data.items():
        setattr(db_client, field, value)
    
    try:
        db.commit()
        db.refresh(db_client)
        logger.info(f"Client updated successfully: ID={client_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update client {client_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update client: {str(e)}"
        )
    
    return db_client


@router.delete("/{client_id}", status_code=204)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a client record.
    """
    logger.info(f"Deleting client ID={client_id} | User: {current_user.email}")
    
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        logger.warning(f"Delete failed: Client not found - ID={client_id}")
        raise HTTPException(status_code=404, detail="Client not found")

    db.delete(db_client)
    db.commit()
    
    logger.info(f"Client deleted successfully: ID={client_id}")
    return None
