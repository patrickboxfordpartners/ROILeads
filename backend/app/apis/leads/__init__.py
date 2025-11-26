from __future__ import annotations

from typing import Optional
import logging

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr, Field

from app.libs.domain_model import RoiCalculationResult, RoiInputs
from app.libs.roi_calculator import calculate_roi

# Setup logging
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
    # 1. Calculate ROI first
    roi_result = calculate_roi(payload.inputs)

    # 2. Log the lead details (This serves as your "database" in Vercel logs for now)
    lead_info = (
        f"NEW LEAD SUBMITTED:\n"
        f"Name: {payload.contact.name}\n"
        f"Email: {payload.contact.email}\n"
        f"Company: {payload.contact.company}\n"
        f"Phone: {payload.contact.phone}\n"
        f"Notes: {payload.contact.notes}\n"
        f"Potential Savings: ${roi_result.metrics.net_annual_savings:,.2f}"
    )
    logger.info(lead_info)
    print(lead_info) # Ensure it prints to stdout

    # 3. TODO: Add Email Sending Logic Here (SendGrid/SMTP)
    # For now, we just return success.

    return LeadSubmissionResponse(
        roi=roi_result,
        message="Lead received successfully. Check logs.",
    )
