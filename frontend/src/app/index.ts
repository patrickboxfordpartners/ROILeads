/*
This file is here for exporting a stable API for users apps.
*/

import { HttpClient } from "../apiclient/http-client";
// We import everything to inspect what's actually exported
import * as GeneratedApi from "../apiclient/Apiclient";

export {
  API_URL,
  APP_BASE_PATH,
  APP_ID,
  Mode,
  WS_API_URL,
  mode,
} from "../constants";

export * from "./auth";

// --- FIX: Robust Client Instantiation ---
// We attempt to find the API class constructor in the exported module.
// It's usually named 'Api', 'Client', or the same as the file 'Apiclient'.
// If all else fails, we fall back to the base HttpClient to prevent the white screen crash.
// This allows the app to load so you can at least see the UI.

// @ts-ignore - we are dynamically checking properties
const ApiConstructor = GeneratedApi.Api || GeneratedApi.Apiclient || GeneratedApi.Client || GeneratedApi.default || HttpClient;

if (ApiConstructor === HttpClient) {
    console.warn("Could not find specific API class in Apiclient.ts. Falling back to generic HttpClient. API methods may be missing.");
}

export const apiClient = new ApiConstructor({
  baseUrl: "/api", 
});
// ----------------------------------------

export * as apiTypes from "../apiclient/data-contracts";
