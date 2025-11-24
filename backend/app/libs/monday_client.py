from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests

from app.libs.domain_model import RoiCalculationResult


class MondayError(RuntimeError):
    """Raised when Monday.com responds with an error or configuration is missing."""


@dataclass(slots=True)
class LeadDetails:
    name: str
    email: str
    company: str
    phone: str
    notes: Optional[str] = None


class MondayClient:
    """Tiny helper around the Monday.com GraphQL API."""

    API_URL = "https://api.monday.com/v2"

    def __init__(self, *, api_token: Optional[str] = None) -> None:
        self.api_token = api_token or os.environ.get("MONDAY_API_TOKEN")
        
        # Load configuration from environment or fall back to defaults
        self.BOARD_ID = int(os.environ.get("MONDAY_BOARD_ID", "18384756296"))
        self.ROI_COLUMN_ID = os.environ.get("MONDAY_ROI_COLUMN_ID", "numeric_mkxwvks")

        if not self.api_token:
            raise MondayError("MONDAY_API_TOKEN is not configured")

    def create_lead_with_roi(self, lead: LeadDetails, roi: RoiCalculationResult) -> Dict[str, Any]:
        """Creates a lead item and adds a formatted ROI summary update."""

        item_id = self._create_item(lead, roi)
        update_id = self._create_update(item_id, lead, roi)
        return {"item_id": item_id, "update_id": update_id}

    def _create_item(self, lead: LeadDetails, roi: RoiCalculationResult) -> str:
        item_name = f"{lead.company} — {lead.name}"
        column_values = {
            self.ROI_COLUMN_ID: f"{roi.metrics.net_annual_savings:.0f}",
        }
        mutation = """
            mutation ($boardId: ID!, $itemName: String!, $columnVals: JSON!) {
                create_item(board_id: $boardId, item_name: $itemName, column_values: $columnVals) {
                    id
                }
            }
        """
        variables = {
            "boardId": self.BOARD_ID,
            "itemName": item_name,
            "columnVals": json.dumps(column_values),
        }

        data = self._post(mutation, variables)
        item_data = data.get("create_item")
        if not item_data or "id" not in item_data:
            raise MondayError("Failed to parse Monday.com create_item response")
        return item_data["id"]

    def _create_update(self, item_id: str, lead: LeadDetails, roi: RoiCalculationResult) -> Optional[str]:
        summary = self._format_update_body(lead, roi)
        mutation = """
            mutation ($itemId: ID!, $body: String!) {
                create_update(item_id: $itemId, body: $body) {
                    id
                }
            }
        """
        variables = {
            "itemId": item_id,
            "body": summary,
        }
        data = self._post(mutation, variables)
        update_data = data.get("create_update")
        return update_data.get("id") if update_data else None

    def _post(self, query: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.post(
            self.API_URL,
            json={"query": query, "variables": variables},
            headers={
                "Authorization": self.api_token,
                "Content-Type": "application/json",
            },
            timeout=20,
        )
        response.raise_for_status()
        payload = response.json()
        errors = payload.get("errors")
        if errors:
            first_error = errors[0]
            message = first_error.get("message", "Unknown Monday.com error")
            raise MondayError(message)
        return payload.get("data", {})

    @staticmethod
    def _format_update_body(lead: LeadDetails, roi: RoiCalculationResult) -> str:
        metrics = roi.metrics
        highlights = "\n".join(f"• {point}" for point in roi.narrative.highlights)
        return (
            f"Lead: {lead.name} — {lead.company}\n"
            f"Email: {lead.email}\n"
            f"Phone: {lead.phone}\n"
            f"Hours automated: {roi.inputs.hours_per_week:.0f}/week\n"
            f"Monthly savings: ${metrics.monthly_savings:,.0f}\n"
            f"Net annual savings: ${metrics.net_annual_savings:,.0f}\n"
            f"Payback: {metrics.payback_months:.1f} months if applicable\n\n"
            f"Highlights:\n{highlights}\n"
            + (f"Notes: {lead.notes}\n" if lead.notes else "")
        )
