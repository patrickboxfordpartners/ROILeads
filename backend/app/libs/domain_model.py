from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class IndustryProfile(BaseModel):
    """Represents the assumption set for a specific industry."""

    key: str = Field(..., description="Internal identifier for the industry profile")
    label: str = Field(..., description="Friendly label used in the UI")
    savings_rate: float = Field(..., ge=0, le=1, description="Expected automation savings as a % of labor cost")
    variance: float = Field(..., ge=0, le=0.5, description="Plus/minus range used to express conservative vs aggressive savings")
    description: Optional[str] = Field(
        default=None, description="Optional explainer text surfaced in summaries"
    )


class RoiInputs(BaseModel):
    """Validated inputs collected from the calculator."""

    hours_per_week: float = Field(..., ge=0, le=80, description="Manual hours that a team spends each week")
    labor_rate: float = Field(..., ge=0, le=1000, description="Average fully-loaded hourly labor rate")
    tool_cost: float = Field(..., ge=0, le=10000, description="Monthly investment in the automation platform")
    industry: str = Field(..., description="Industry profile key used to pick the right assumption set")


class RoiChartBar(BaseModel):
    """Dataset entry for the frontend bar chart visualization."""

    name: str
    annual: float


class RoiMetrics(BaseModel):
    """Key KPIs surfaced to the end user."""

    annual_labor_cost: float
    annual_savings_low: float
    annual_savings_expected: float
    annual_savings_high: float
    monthly_savings: float
    annual_tool_cost: float
    net_annual_savings: float
    payback_months: Optional[float]


class RoiNarrative(BaseModel):
    """Short-form insights rendered in the UI or email copy."""

    headline: str
    highlights: List[str]


class RoiCalculationResult(BaseModel):
    """Canonical ROI payload returned to the UI and other integrations."""

    profile: IndustryProfile
    inputs: RoiInputs
    metrics: RoiMetrics
    chart: List[RoiChartBar]
    narrative: RoiNarrative
