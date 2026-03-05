from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.security import get_current_user
from app.core.logging_config import get_logger
from app.services.deposit_calculator import DepositCalculator
from app.schemas.deposit import DepositResponse

logger = get_logger(__name__)
router = APIRouter(prefix="/deposits", tags=["Deposits"])


@router.get("/{client_id}", response_model=DepositResponse)
def get_deposit_info(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get complete deposit information for a client.
    
    Returns:
    - calculation: Admin view with breakdown, totals, deposit amount
    - email_preview: Ready-to-send email with subject and body
    
    The calculation provides detailed breakdown for internal review,
    while email_preview is formatted for client communication.
    """
    try:
        calculator = DepositCalculator(db)
        result = calculator.get_deposit_response(client_id)
        
        logger.info(
            f"Deposit info retrieved for client {client_id}: "
            f"${result.calculation.deposit_amount:.2f} deposit, "
            f"${result.calculation.total_with_tax:.2f} total | "
            f"User: {current_user.email}"
        )
        
        return result
    
    except ValueError as e:
        logger.warning(f"Deposit calculation failed for client {client_id}: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        logger.error(
            f"Unexpected error getting deposit info for client {client_id}: {str(e)}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Failed to get deposit information")
