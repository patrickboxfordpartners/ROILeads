/*
This file is here for exporting a stable API for users apps.
*/

import { Api } from "../apiclient/Apiclient"; // Import the specific generated class

export {
  API_URL,
  APP_BASE_PATH,
  APP_ID,
  Mode,
  WS_API_URL,
  mode,
} from "../constants";

export * from "./auth";

// --- FIX: Instantiate the generated API class, not the generic HttpClient ---
export const apiClient = new Api({
  baseUrl: "/api", // This relative path works with the Vercel rewrite rule
});
// ---------------------------------------------------------------------------

export * as apiTypes from "../apiclient/data-contracts";
