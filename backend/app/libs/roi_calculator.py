from __future__ import annotations

from typing import Dict

from app.libs.domain_model import (
    IndustryProfile,
    RoiCalculationResult,
    RoiChartBar,
    RoiInputs,
    RoiMetrics,
    RoiNarrative,
)

# Baseline industry assumptions. Rates represent the share of labor hours than can
# realistically be automated today. Variance expresses conservative vs aggressive scenarios.
INDUSTRY_PROFILES: Dict[str, IndustryProfile] = {
    "general": IndustryProfile(
        key="general",
        label="General / Services",
        savings_rate=0.7,
        variance=0.07,
        description="Knowledge work teams replacing repetitive admin steps",
    ),
    "manufacturing": IndustryProfile(
        key="manufacturing",
        label="Manufacturing",
        savings_rate=0.78,
        variance=0.06,
        description="High-volume production flows with QA loops",
    ),
    "retail": IndustryProfile(
        key="retail",
        label="Retail / E-commerce",
        savings_rate=0.65,
        variance=0.08,
        description="Ops teams automating catalog + support work",
    ),
    "automotive": IndustryProfile(
        key="automotive",
        label="Automotive",
        savings_rate=0.8,
        variance=0.05,
        description="Dealership + service teams orchestrating lead follow-up",
    ),
    "personal_care": IndustryProfile(
        key="personal_care",
        label="Personal Care",
        savings_rate=0.6,
        variance=0.1,
        description="Studios + clinics automating scheduling + reminders",
    ),
}


def _build_chart(annual_labor_cost: float, automated_cost: float) -> list[RoiChartBar]:
    return [
        RoiChartBar(name="Current Cost", annual=annual_labor_cost),
        RoiChartBar(name="Automated Cost", annual=max(automated_cost, 0)),
    ]


def calculate_roi(payload: RoiInputs) -> RoiCalculationResult:
    profile = INDUSTRY_PROFILES.get(payload.industry, INDUSTRY_PROFILES["general"])
    hours_per_year = payload.hours_per_week * 52
    annual_labor_cost = hours_per_year * payload.labor_rate
    savings_expected = annual_labor_cost * profile.savings_rate
    savings_low = annual_labor_cost * max(profile.savings_rate - profile.variance, 0)
    savings_high = annual_labor_cost * min(profile.savings_rate + profile.variance, 0.95)
    monthly_savings = savings_expected / 12
    annual_tool_cost = payload.tool_cost * 12
    net_annual_savings = savings_expected - annual_tool_cost
    net_monthly_savings = monthly_savings - payload.tool_cost
    payback_months = None
    if net_monthly_savings > 0:
        payback_months = payload.tool_cost / net_monthly_savings

    automated_cost = annual_labor_cost - savings_expected + annual_tool_cost

    narrative = RoiNarrative(
        headline=f"${net_annual_savings:,.0f} in net savings within year one",
        highlights=[
            f"Automating {payload.hours_per_week:.0f} hrs/week in {profile.label} unlocks ${monthly_savings:,.0f}/month",
            f"Payback expected in {payback_months:.1f} months" if payback_months else "Savings offset the investment immediately",
            f"Annual tool spend assumed at ${annual_tool_cost:,.0f}",
        ],
    )

    metrics = RoiMetrics(
        annual_labor_cost=annual_labor_cost,
        annual_savings_low=savings_low,
        annual_savings_expected=savings_expected,
        annual_savings_high=savings_high,
        monthly_savings=monthly_savings,
        annual_tool_cost=annual_tool_cost,
        net_annual_savings=net_annual_savings,
        payback_months=payback_months,
    )

    return RoiCalculationResult(
        profile=profile,
        inputs=payload,
        metrics=metrics,
        chart=_build_chart(annual_labor_cost, automated_cost),
        narrative=narrative,
    )
