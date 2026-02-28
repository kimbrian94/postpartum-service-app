from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import re

from app.database import get_db
from app.models.client import Client
from app.schemas.intake import ServiceIntakeRequest, ServiceIntakeResponse
from app.utils.intake_utils import (
    parse_yes_no,
    parse_number,
    parse_pregnancy_number,
    parse_date,
    clean_platform,
    clean_referral,
    clean_language,
    format_phone_number,
)

router = APIRouter()


@router.post("/", response_model=ServiceIntakeResponse)
def create_intake(intake: ServiceIntakeRequest, db: Session = Depends(get_db)):
    try:
        due_date = parse_date(intake.due_date)
        pregnancy_number = parse_pregnancy_number(intake.pregnancy_number_text)
        is_twins = parse_yes_no(intake.is_twins)
        has_pets = parse_yes_no(intake.has_pets)
        visitor_parking = parse_yes_no(intake.visitor_parking)
        familiar_korean_food = parse_yes_no(intake.familiar_with_korean_food)

        postpartum_care = parse_yes_no(intake.postpartum_care_service)
        special_massage = parse_yes_no(intake.special_massage_service)
        facial_massage = parse_yes_no(intake.facial_massage_service)
        rmt_massage = parse_yes_no(intake.rmt_massage_service)
        night_nurse = parse_yes_no(intake.night_nurse_service)

        client = Client(
            email=intake.email,
            name_korean=intake.name_korean,
            name_english=intake.name_english,
            phone_number=format_phone_number(intake.phone_number),
            residential_area=intake.residential_area,
            home_address=intake.home_address,
            visitor_parking_available=visitor_parking,
            due_date=due_date,
            pregnancy_number=pregnancy_number,
            is_twins=is_twins,
            has_pets=has_pets,
            other_household_members=intake.other_household_members,
            cultural_background=intake.cultural_background,
            familiar_with_korean_food=familiar_korean_food,
            preferred_cuisine=intake.preferred_cuisine,
            contact_platform=clean_platform(intake.contact_platform),
            platform_username=intake.platform_username,
            referral_source=clean_referral(intake.referral_source),
            referrer_name=intake.referrer_name,
            preferred_language=clean_language(intake.preferred_language),
            postpartum_care_requested=postpartum_care,
            postpartum_care_days_per_week=parse_number(intake.postpartum_care_days_per_week),
            postpartum_care_weeks=parse_number(intake.postpartum_care_weeks),
            special_massage_requested=special_massage,
            special_massage_sessions=parse_number(intake.special_massage_sessions),
            facial_massage_requested=facial_massage,
            facial_massage_sessions=parse_number(intake.facial_massage_sessions),
            rmt_massage_requested=rmt_massage,
            night_nurse_requested=night_nurse,
            night_nurse_weeks=parse_number(intake.night_nurse_weeks),
            status='pending_deposit',
        )

        db.add(client)
        db.commit()
        db.refresh(client)

        return ServiceIntakeResponse(
            success=True,
            client_id=client.id,
            message=f"Successfully created client with name {client.name_english or client.name_korean}",
        )

    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing intake: {str(e)}")
