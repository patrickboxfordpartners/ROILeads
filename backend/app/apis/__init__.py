from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.libs.domain_model import RoiCalculationResult, RoiInputs
from app.libs.monday_client import LeadDetails, MondayClient, MondayError
from app.libs.roi_calculator import calculate_roi

router = APIRouter(prefix="/leads", tags=["leads"])


class LeadContact(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    company: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=5)
    notes: Optional[str] = Field(default=None, max_length=1000)


class LeadSubmissionRequest(BaseModel):
    contact: LeadContact
    inputs: RoiInputs


class LeadSubmissionResponse(BaseModel):
    roi: RoiCalculationResult
    monday_item_id: str
    monday_update_id: Optional[str]


@router.post("/submit", response_model=LeadSubmissionResponse)
def submit_lead(payload: LeadSubmissionRequest) -> LeadSubmissionResponse:
    roi_result = calculate_roi(payload.inputs)

    client = MondayClient()
    lead_details = LeadDetails(
        name=payload.contact.name,
        email=payload.contact.email,
        company=payload.contact.company,
        phone=payload.contact.phone,
        notes=payload.contact.notes,
    )
    
    try:
        monday_response = client.create_lead_with_roi(lead_details, roi_result)
    except MondayError as e:
        # Log the internal error here if logging is set up
        raise HTTPException(status_code=502, detail=f"Failed to save lead to CRM: {str(e)}")

    return LeadSubmissionResponse(
        roi=roi_result,
        monday_item_id=monday_response["item_id"],
        monday_update_id=monday_response.get("update_id"),
    )
