import pytest
from fastapi.testclient import TestClient
from app.schemas.intake import ServiceIntakeRequest, ServiceIntakeResponse


def test_create_intake_success(client: TestClient):
    """Test successful intake creation"""
    intake_data = {
        "timestamp": "2026-01-22T10:00:00Z",
        "email": "test@example.com",
        "name_korean": "김테스트",
        "name_english": "Test Kim",
        "residential_area": "Toronto",
        "home_address": "123 Test St",
        "phone_number": "123-456-7890",
        "due_date": "8/18/2026",
        "preferred_language": "English",
        "pregnancy_number_text": "1",
        "is_twins": "No",
        "contact_platform": "Email",
        "platform_username": "test@example.com",
        "postpartum_care_service": "Yes",
        "postpartum_care_days_per_week": "5",
        "postpartum_care_weeks": "4",
        "special_massage_service": "No",
        "special_massage_sessions": "",
        "facial_massage_service": "Yes",
        "facial_massage_sessions": "2",
        "rmt_massage_service": "No",
        "night_nurse_service": "No",
        "night_nurse_weeks": "",
        "visitor_parking": "Yes",
        "has_pets": "No",
        "other_household_members": "Spouse",
        "cultural_background": "Korean",
        "familiar_with_korean_food": "Yes",
        "preferred_cuisine": "Korean",
        "referral_source": "Friend",
        "referrer_name": "Jane Doe"
    }

    response = client.post("/intake/", json=intake_data)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "client_id" in data
    assert "Successfully created client" in data["message"]


def test_create_intake_invalid_date(client: TestClient):
    """Test intake creation with invalid date"""
    intake_data = {
        "timestamp": "2026-01-22T10:00:00Z",
        "email": "test@example.com",
        "name_korean": "김테스트",
        "name_english": "Test Kim",
        "residential_area": "Toronto",
        "home_address": "123 Test St",
        "phone_number": "123-456-7890",
        "due_date": "invalid date",
        "preferred_language": "English",
        "pregnancy_number_text": "1",
        "is_twins": "No",
        "contact_platform": "Email",
        "platform_username": "test@example.com",
        "postpartum_care_service": "Yes",
        "postpartum_care_days_per_week": "5",
        "postpartum_care_weeks": "4",
        "special_massage_service": "No",
        "special_massage_sessions": "",
        "facial_massage_service": "Yes",
        "facial_massage_sessions": "2",
        "rmt_massage_service": "No",
        "night_nurse_service": "No",
        "night_nurse_weeks": "",
        "visitor_parking": "Yes",
        "has_pets": "No",
        "other_household_members": "Spouse",
        "cultural_background": "Korean",
        "familiar_with_korean_food": "Yes",
        "preferred_cuisine": "Korean",
        "referral_source": "Friend",
        "referrer_name": "Jane Doe"
    }

    response = client.post("/intake/", json=intake_data)
    assert response.status_code == 400
    assert "invalid date" in response.json()["detail"].lower()


def test_create_intake_missing_required_fields(client: TestClient):
    """Test intake creation with missing required fields"""
    intake_data = {
        "timestamp": "2026-01-22T10:00:00Z",
        # Missing email
        "name_korean": "김테스트",
        "name_english": "Test Kim",
        "residential_area": "Toronto",
        "home_address": "123 Test St",
        "phone_number": "123-456-7890",
        "due_date": "8/18/2026",
        "preferred_language": "English",
        "pregnancy_number_text": "1",
        "is_twins": "No",
        "contact_platform": "Email",
        "platform_username": "test@example.com",
        "postpartum_care_service": "Yes",
        "postpartum_care_days_per_week": "5",
        "postpartum_care_weeks": "4",
        "special_massage_service": "No",
        "special_massage_sessions": "",
        "facial_massage_service": "Yes",
        "facial_massage_sessions": "2",
        "rmt_massage_service": "No",
        "night_nurse_service": "No",
        "night_nurse_weeks": "",
        "visitor_parking": "Yes",
        "has_pets": "No",
        "other_household_members": "Spouse",
        "cultural_background": "Korean",
        "familiar_with_korean_food": "Yes",
        "preferred_cuisine": "Korean",
        "referral_source": "Friend",
        "referrer_name": "Jane Doe"
    }

    response = client.post("/intake/", json=intake_data)
    assert response.status_code == 422  # Validation error


def test_create_intake_with_optional_fields(client: TestClient):
    """Test intake creation with minimal required fields"""
    intake_data = {
        "timestamp": "2026-01-22T10:00:00Z",
        "email": "test@example.com",
        "due_date": "8/18/2026",
        "preferred_language": "English",
        "pregnancy_number_text": "1",
        "is_twins": "No",
        "contact_platform": "Email",
        "platform_username": "test@example.com",
        "postpartum_care_service": "Yes",
        "postpartum_care_days_per_week": "5",
        "postpartum_care_weeks": "4",
        "special_massage_service": "No",
        "facial_massage_service": "No",
        "rmt_massage_service": "No",
        "night_nurse_service": "No",
        "visitor_parking": "Yes",
        "has_pets": "No",
        "familiar_with_korean_food": "Yes",
        "referral_source": "Friend"
    }

    response = client.post("/intake/", json=intake_data)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "client_id" in data