from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.doula import Doula
from app.schemas.doula import DoulaCreate, DoulaUpdate, DoulaResponse
from app.core.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.post("/", response_model=DoulaResponse, status_code=201)
def create_doula(doula: DoulaCreate, db: Session = Depends(get_db)):
    """Create a new doula (admin only)"""
    doula_name = doula.name_preferred or doula.name_english or doula.name_korean or "Unknown"
    logger.info(f"Creating new doula: {doula_name}")
    
    try:
        db_doula = Doula(
            name_korean=doula.name_korean,
            name_english=doula.name_english,
            name_preferred=doula.name_preferred,
            date_of_birth=doula.date_of_birth,
            phone_number=doula.phone_number,
            email=doula.email,
            legal_status=doula.legal_status,
            languages=doula.languages,
            service_area=doula.service_area,
            start_year=doula.start_year,
            has_tdap=doula.has_tdap,
            has_mmr=doula.has_mmr,
            has_varicella=doula.has_varicella,
            has_hep_b=doula.has_hep_b,
            pet_allergies=doula.pet_allergies,
            is_active=doula.is_active,
            notes=doula.notes,
        )
        
        db.add(db_doula)
        db.commit()
        db.refresh(db_doula)
        
        created_name = db_doula.name_preferred or db_doula.name_english or db_doula.name_korean or "Unknown"
        logger.info(f"Doula created successfully: ID={db_doula.id}, Name={created_name}")
        return db_doula
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating doula: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error creating doula: {str(e)}")


@router.get("/", response_model=List[DoulaResponse])
def list_doulas(
    active_only: bool = Query(True, description="Filter for active doulas only"),
    db: Session = Depends(get_db)
):
    """Get list of all doulas with optional active filter"""
    logger.info(f"Fetching doulas (active_only={active_only})")
    
    try:
        query = db.query(Doula)
        
        if active_only:
            query = query.filter(Doula.is_active == True)
        
        doulas = query.order_by(Doula.name_preferred, Doula.name_english, Doula.name_korean).all()
        
        logger.info(f"Retrieved {len(doulas)} doulas")
        return doulas
    
    except Exception as e:
        logger.error(f"Error fetching doulas: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching doulas: {str(e)}")


@router.get("/{doula_id}", response_model=DoulaResponse)
def get_doula(doula_id: int, db: Session = Depends(get_db)):
    """Get a specific doula by ID"""
    logger.info(f"Fetching doula ID: {doula_id}")
    
    doula = db.query(Doula).filter(Doula.id == doula_id).first()
    
    if not doula:
        logger.warning(f"Doula not found: ID={doula_id}")
        raise HTTPException(status_code=404, detail=f"Doula with ID {doula_id} not found")
    
    return doula


@router.put("/{doula_id}", response_model=DoulaResponse)
def update_doula(doula_id: int, doula_update: DoulaUpdate, db: Session = Depends(get_db)):
    """Update a doula's information"""
    logger.info(f"Updating doula ID: {doula_id}")
    
    doula = db.query(Doula).filter(Doula.id == doula_id).first()
    
    if not doula:
        logger.warning(f"Doula not found: ID={doula_id}")
        raise HTTPException(status_code=404, detail=f"Doula with ID {doula_id} not found")
    
    try:
        # Update only provided fields
        update_data = doula_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(doula, field, value)
        
        db.commit()
        db.refresh(doula)
        
        logger.info(f"Doula updated successfully: ID={doula.id}")
        return doula
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating doula: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error updating doula: {str(e)}")


@router.delete("/{doula_id}", status_code=204)
def deactivate_doula(doula_id: int, db: Session = Depends(get_db)):
    """Soft delete (deactivate) a doula"""
    logger.info(f"Deactivating doula ID: {doula_id}")
    
    doula = db.query(Doula).filter(Doula.id == doula_id).first()
    
    if not doula:
        logger.warning(f"Doula not found: ID={doula_id}")
        raise HTTPException(status_code=404, detail=f"Doula with ID {doula_id} not found")
    
    try:
        doula.is_active = False
        db.commit()
        
        logger.info(f"Doula deactivated successfully: ID={doula.id}")
        return None
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error deactivating doula: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error deactivating doula: {str(e)}")
