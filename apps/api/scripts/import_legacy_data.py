"""
Import legacy intake form responses from CSV into the database via the intake API.

Usage:
    python scripts/import_legacy_data.py
"""

import pandas as pd
import requests
from datetime import datetime
import time

# Configuration
API_URL = "http://localhost:8000/api/intake"
CSV_FILE = "resources/to-be-deleted/2025-2026 계약전 설문지 - New - Legacy Responses (formatted).csv"
DELAY_BETWEEN_REQUESTS = 0.5  # seconds

def map_row_to_payload(row):
    """Map CSV row to intake API payload."""
    
    return {
        "email": str(row.get('Email Address', '')).strip() or None,
        "name_korean": str(row.get('한글 이름\nFull Korean Name', '')).strip() or None,
        "name_english": str(row.get('영어 이름\nFull English Name', '')).strip() or None,
        "phone_number": str(row.get('전화번호\nPhone Number(ex. 647-xxx-xxxx)', '')).strip() or None,
        "residential_area": str(row.get('사시는 곳의 지역을 선택해주세요!\nPlease select your residential area!', '')).strip() or None,
        "home_address": str(row.get('주소\nHome Address', '')).strip() or None,
        "due_date": str(row.get('출산 예정일\nDue date', '')).strip() or None,
        "preferred_language": str(row.get('선호하시는 언어가 무엇인가요?\nWhat is your preferred language?', '')).strip() or None,
        "pregnancy_number_text": str(row.get('출산 예정 아기가 몇번째 아기이신가요?\nThis pregnancy is my…', '')).strip() or None,
        "is_twins": str(row.get('쌍둥이 임신이신가요?\nAre you expecting twins?', '')).strip() or None,
        "contact_platform": str(row.get('어느 플랫폼을 통해 상담을 받으셨나요?\nWhich platform did you use when you inquired about our services?', '')).strip() or None,
        "platform_username": str(row.get('카카오톡 채널 혹은 인스타그램을 통해 상담받으신 경우,\n프로필 이름 혹은 아이디를 알려주세요.\nIf you contacted us via KakaoTalk or Instagram, please enter your KakaoTalk name or Instagram username.', '')).strip() or None,
        "postpartum_care_service": str(row.get('산후조리 서비스를 신청하시나요?\nWill you be registering for In-Home Postpartum Care Service', '')).strip() or None,
        "postpartum_care_days_per_week": str(row.get('산후조리 서비스 - 주당 이용 일수 \nIn-Home Postpartum Care - Days per week', '')).strip() or None,
        "postpartum_care_weeks": str(row.get('산후조리 서비스 - 이용 주 수\nIn-Home Postpartum Care - Total number of weeks', '')).strip() or None,
        "special_massage_service": str(row.get('스페셜 산후 전신 마사지를 신청하시나요?\nWill you be registering for Special Postpartum Body Massage', '')).strip() or None,
        "special_massage_sessions": str(row.get('스페셜 산후 마사지 - 계약 횟수\nSpecial Postpartum Body Massage - Number of sessions', '')).strip() or None,
        "facial_massage_service": str(row.get('산후 페이셜 마사지를 추가하시겠습니까?\nWould you like to add a Special Facial Massage', '')).strip() or None,
        "facial_massage_sessions": str(row.get('산후 페이셜 마사지 - 계약 횟수\nPostpartum Facial Massage - Number of sessions', '')).strip() or None,
        "rmt_massage_service": str(row.get('RMT 마사지를 신청하시나요?\nWill you be registering for RMT Massage', '')).strip() or None,
        "night_nurse_service": str(row.get('나이트 널스 서비스를 신청하시나요?\nWill you be registering for Overnight Service', '')).strip() or None,
        "night_nurse_weeks": str(row.get('나이트 널스 서비스 - 이용 주 수\nOvernight Service - Total number of weeks', '')).strip() or None,
        "visitor_parking": str(row.get('방문객 주차 가능 여부\nVisitor Parking availability', '')).strip() or None,
        "has_pets": str(row.get('애완동물 여부\nDo you have pets?', '')).strip() or None,
        "other_household_members": str(row.get("산후조리를 받으실 때 남편분 외에 다른 가족이 집에 있으신가요? ('예'라고 답하신 경우, 자세한 내용을 알려주세요.)\nAre there any other members in your household other than your spouse? (If your answer is 'yes' tell us the details.)", '')).strip() or None,
        "cultural_background": str(row.get('산모님의 문화적 배경은 무엇인가요?(예: 한국)\nWhat is your cultural background?(ex. Korean, Chinese, Italian, Canadian etc.)', '')).strip() or None,
        "familiar_with_korean_food": str(row.get('한국 음식을 잘 아시고 좋아하시나요?\n* 만약 아니시라면, 어떤 음식을 선호하시나요?\nAre you familiar with and enjoy Korean cuisine?\n* If your answer is NO, what types of cuisine do you prefer?', '')).strip() or None,
        "referral_source": str(row.get('해나스 맘스 케어를 어떻게 아시게 되셨습니까?\nHow did you hear about us?', '')).strip() or None,
        "referrer_name": str(row.get('가족 또는 친구분의 추천을 받으셨다면, 추천해주신 분의 이름이 무엇인가요?\nIf you were referred to us by a family member or friend, what is/are their name(s)?', '')).strip() or None,
    }


def main():
    print("=" * 80)
    print("Legacy Data Import Script")
    print("=" * 80)
    
    # Load CSV
    print(f"\n📂 Loading CSV file: {CSV_FILE}")
    df = pd.read_csv(CSV_FILE)
    total_rows = len(df)
    print(f"   Found {total_rows} rows to import")
    
    # Track results
    successful = []
    failed = []
    
    # Process each row
    print(f"\n🚀 Starting import...\n")
    
    for index, row in df.iterrows():
        row_num = index + 1
        email = row.get('Email Address', 'N/A')
        
        try:
            # Map row to payload
            payload = map_row_to_payload(row)
            
            # Send to API
            response = requests.post(API_URL, json=payload, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            successful.append({
                "row": row_num,
                "email": email,
                "client_id": result.get("client_id")
            })
            
            print(f"✅ [{row_num}/{total_rows}] {email}")
            
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json().get('detail', str(e))
                    error_msg = error_detail
                except:
                    error_msg = e.response.text[:200]
            
            failed.append({
                "row": row_num,
                "email": email,
                "error": error_msg
            })
            
            print(f"❌ [{row_num}/{total_rows}] {email} - {error_msg}")
        
        except Exception as e:
            failed.append({
                "row": row_num,
                "email": email,
                "error": str(e)
            })
            
            print(f"❌ [{row_num}/{total_rows}] {email} - {str(e)}")
        
        # Delay to avoid overwhelming the API
        time.sleep(DELAY_BETWEEN_REQUESTS)
    
    # Summary
    print("\n" + "=" * 80)
    print("Import Summary")
    print("=" * 80)
    print(f"Total rows:      {total_rows}")
    print(f"✅ Successful:   {len(successful)}")
    print(f"❌ Failed:       {len(failed)}")
    
    # Save results
    if successful:
        success_df = pd.DataFrame(successful)
        success_df.to_csv("scripts/import_successful.csv", index=False)
        print(f"\n💾 Successful imports saved to: scripts/import_successful.csv")
    
    if failed:
        failed_df = pd.DataFrame(failed)
        failed_df.to_csv("scripts/import_failed.csv", index=False)
        print(f"💾 Failed imports saved to: scripts/import_failed.csv")
        print("\n⚠️  Please review failed imports and fix data issues before retrying.")
    
    print("\n✨ Import complete!")


if __name__ == "__main__":
    main()
