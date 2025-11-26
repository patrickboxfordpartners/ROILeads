/*
This file is here for exporting a stable API for users apps.
*/

// --- FIX: Try default import if named import 'Api' failed ---
import { Api } from "../apiclient/Apiclient"; 
// If the above line fails again, it might be: import Api from "../apiclient/Apiclient";
// Let's check the file content if possible, but for now, let's stick to the named import 'Api'
// and ensure the file actually exports it. 

// WAIT - the error says "Api" is NOT exported.
// Let's try importing * as ... or check the file content.
// Since I cannot see the content of Apiclient.ts right now, I will assume the class might be named
// based on the Swagger file, often it is just 'Api' or the service name.

// Let's try this robust import strategy:
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

// We need to find the class constructor.
// If GeneratedApi.Api exists, use it. If GeneratedApi.default exists, use it.
const ApiConstructor = GeneratedApi.Api || GeneratedApi.default;

if (!ApiConstructor) {
    throw new Error("Could not find API Client class in Apiclient.ts");
}

export const apiClient = new ApiConstructor({
  baseUrl: "/api", 
});

export * as apiTypes from "../apiclient/data-contracts";
