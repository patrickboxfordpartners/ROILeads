import {
  CheckHealthData,
  LeadSubmissionRequest,
  RoiInputs,
  RunRoiCalculationData,
  RunRoiCalculationError,
  SubmitLeadData,
  SubmitLeadError,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Apiclient<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags leads, dbtn/module:leads
   * @name submit_lead
   * @summary Submit Lead
   * @request POST:/routes/leads/submit
   */
  submit_lead = (data: LeadSubmissionRequest, params: RequestParams = {}) =>
    this.request<SubmitLeadData, SubmitLeadError>({
      path: `/routes/leads/submit`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Calculate automation ROI using shared calculator assumptions.
   *
   * @tags roi, dbtn/module:roi
   * @name run_roi_calculation
   * @summary Run Roi Calculation
   * @request POST:/routes/roi/calculate
   */
  run_roi_calculation = (data: RoiInputs, params: RequestParams = {}) =>
    this.request<RunRoiCalculationData, RunRoiCalculationError>({
      path: `/routes/roi/calculate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
