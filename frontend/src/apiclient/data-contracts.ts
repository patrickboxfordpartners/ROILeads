/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/**
 * IndustryProfile
 * Represents the assumption set for a specific industry.
 */
export interface IndustryProfile {
  /**
   * Key
   * Internal identifier for the industry profile
   */
  key: string;
  /**
   * Label
   * Friendly label used in the UI
   */
  label: string;
  /**
   * Savings Rate
   * Expected automation savings as a % of labor cost
   * @min 0
   * @max 1
   */
  savings_rate: number;
  /**
   * Variance
   * Plus/minus range used to express conservative vs aggressive savings
   * @min 0
   * @max 0.5
   */
  variance: number;
  /**
   * Description
   * Optional explainer text surfaced in summaries
   */
  description?: string | null;
}

/** LeadContact */
export interface LeadContact {
  /**
   * Name
   * @minLength 2
   */
  name: string;
  /**
   * Email
   * @format email
   */
  email: string;
  /**
   * Company
   * @minLength 2
   */
  company: string;
  /**
   * Phone
   * @minLength 5
   */
  phone: string;
  /** Notes */
  notes?: string | null;
}

/** LeadSubmissionRequest */
export interface LeadSubmissionRequest {
  contact: LeadContact;
  /** Validated inputs collected from the calculator. */
  inputs: RoiInputs;
}

/** LeadSubmissionResponse */
export interface LeadSubmissionResponse {
  /** Canonical ROI payload returned to the UI and other integrations. */
  roi: RoiCalculationResult;
  /** Monday Item Id */
  monday_item_id: string;
  /** Monday Update Id */
  monday_update_id: string | null;
}

/**
 * RoiCalculationResult
 * Canonical ROI payload returned to the UI and other integrations.
 */
export interface RoiCalculationResult {
  /** Represents the assumption set for a specific industry. */
  profile: IndustryProfile;
  /** Validated inputs collected from the calculator. */
  inputs: RoiInputs;
  /** Key KPIs surfaced to the end user. */
  metrics: RoiMetrics;
  /** Chart */
  chart: RoiChartBar[];
  /** Short-form insights rendered in the UI or email copy. */
  narrative: RoiNarrative;
}

/**
 * RoiChartBar
 * Dataset entry for the frontend bar chart visualization.
 */
export interface RoiChartBar {
  /** Name */
  name: string;
  /** Annual */
  annual: number;
}

/**
 * RoiInputs
 * Validated inputs collected from the calculator.
 */
export interface RoiInputs {
  /**
   * Hours Per Week
   * Manual hours that a team spends each week
   * @min 0
   * @max 80
   */
  hours_per_week: number;
  /**
   * Labor Rate
   * Average fully-loaded hourly labor rate
   * @min 0
   * @max 1000
   */
  labor_rate: number;
  /**
   * Tool Cost
   * Monthly investment in the automation platform
   * @min 0
   * @max 10000
   */
  tool_cost: number;
  /**
   * Industry
   * Industry profile key used to pick the right assumption set
   */
  industry: string;
}

/**
 * RoiMetrics
 * Key KPIs surfaced to the end user.
 */
export interface RoiMetrics {
  /** Annual Labor Cost */
  annual_labor_cost: number;
  /** Annual Savings Low */
  annual_savings_low: number;
  /** Annual Savings Expected */
  annual_savings_expected: number;
  /** Annual Savings High */
  annual_savings_high: number;
  /** Monthly Savings */
  monthly_savings: number;
  /** Annual Tool Cost */
  annual_tool_cost: number;
  /** Net Annual Savings */
  net_annual_savings: number;
  /** Payback Months */
  payback_months: number | null;
}

/**
 * RoiNarrative
 * Short-form insights rendered in the UI or email copy.
 */
export interface RoiNarrative {
  /** Headline */
  headline: string;
  /** Highlights */
  highlights: string[];
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

export type CheckHealthData = HealthResponse;

export type SubmitLeadData = LeadSubmissionResponse;

export type SubmitLeadError = HTTPValidationError;

export type RunRoiCalculationData = RoiCalculationResult;

export type RunRoiCalculationError = HTTPValidationError;
