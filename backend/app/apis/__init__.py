from __future__ import annotations

from typing import Optional
import logging

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr, Field

from app.libs.domain_model import RoiCalculationResult, RoiInputs
from app.libs.roi_calculator import calculate_roi

# Setup logging so you can see leads in Vercel logs
logger = logging.getLogger("uvicorn")

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
    message: str

@router.post("/submit", response_model=LeadSubmissionResponse)
def submit_lead(payload: LeadSubmissionRequest) -> LeadSubmissionResponse:
    # 1. Calculate ROI
    roi_result = calculate_roi(payload.inputs)

    # 2. Log the lead details (Your "Email Pivot" starts here)
    # In a real pivot, you would call send_email(payload.contact) here.
    # For now, we log it to prove it works.
    lead_info = (
        f"NEW LEAD RECEIVED:\n"
        f"Name: {payload.contact.name}\n"
        f"Email: {payload.contact.email}\n"
        f"Company: {payload.contact.company}\n"
        f"Savings: ${roi_result.metrics.net_annual_savings:,.0f}"
    )
    print(lead_info) # Prints to Vercel Runtime Logs
    logger.info(lead_info)

    return LeadSubmissionResponse(
        roi=roi_result,
        message="Lead captured successfully",
    )
