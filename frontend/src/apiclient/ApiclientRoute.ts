import {
  CheckHealthData,
  LeadSubmissionRequest,
  RoiInputs,
  RunRoiCalculationData,
  SubmitLeadData,
} from "./data-contracts";

export namespace Apiclient {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * No description
   * @tags leads, dbtn/module:leads
   * @name submit_lead
   * @summary Submit Lead
   * @request POST:/routes/leads/submit
   */
  export namespace submit_lead {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = LeadSubmissionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SubmitLeadData;
  }

  /**
   * @description Calculate automation ROI using shared calculator assumptions.
   * @tags roi, dbtn/module:roi
   * @name run_roi_calculation
   * @summary Run Roi Calculation
   * @request POST:/routes/roi/calculate
   */
  export namespace run_roi_calculation {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = RoiInputs;
    export type RequestHeaders = {};
    export type ResponseBody = RunRoiCalculationData;
  }
}
