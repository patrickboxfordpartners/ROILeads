from fastapi import APIRouter

from app.libs.domain_model import RoiCalculationResult, RoiInputs
from app.libs.roi_calculator import calculate_roi

router = APIRouter(prefix="/roi", tags=["roi"])


@router.post("/calculate", response_model=RoiCalculationResult)
def run_roi_calculation(request: RoiInputs) -> RoiCalculationResult:
    """Calculate automation ROI using shared calculator assumptions."""

    return calculate_roi(request)
