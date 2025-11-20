import base64
import os
import time

import dotenv
import httpx

from app.internal.dbapi import get_dbapi_client


def from_b64(b64: str) -> str:
    return base64.urlsafe_b64decode(b64.encode("utf-8")).decode("utf-8")


def fetch_and_inject_deployment_secrets() -> None:
    deployment_id = os.environ.get("DATABUTTON_DEPLOYMENT_ID")
    if not deployment_id:
        print("Missing deployment id, not fetching secrets")
        return

    client: httpx.Client = get_dbapi_client()
    try:
        t0 = time.monotonic()
        delay = 1.0
        response: httpx.Response | None = None

        attempt = 1
        while True:
            response = client.get(
                f"/secrets/v2/deployment/{deployment_id}",
                timeout=30.0,
            )
            if 200 <= response.status_code < 300:
                break

            # Retry logic
            attempt += 1
            if attempt > 5:
                break
            print(f"Retrying secrets fetch in {delay}s after {attempt} attempts")
            time.sleep(delay)
            delay *= 2.0
        t1 = time.monotonic()
        print(f"Time to fetch secrets: {t1 - t0}")

        # Can raise if the last attempt failed
        response.raise_for_status()
        result = response.json()
        # Note: result data type here is PollSecretsRequest from devx
        secrets: list[dict[str, str]] = result.get("secrets")
        items = ((s.get("name"), s.get("valueBase64")) for s in secrets)
        cleaned_vars = {k: from_b64(v) for k, v in items if v is not None and k}
        os.environ.update(**cleaned_vars)

    except Exception:
        # Catch all exceptions to avoid leaking secrets into logs
        raise RuntimeError("Failed to fetch secrets")


def fetch_and_inject_secrets() -> None:
    is_devx_workspace = os.environ.get("DATABUTTON_SERVICE_TYPE") == "devx"
    if is_devx_workspace:
        dotenv.load_dotenv(os.environ.get("DOT_ENV_FILE", ".env"))
        return

    is_deployed = bool(os.environ.get("DATABUTTON_DEPLOYMENT_ID"))
    if is_deployed:
        fetch_and_inject_deployment_secrets()
        return

    raise RuntimeError("Unexpected environment when fetching secrets")
