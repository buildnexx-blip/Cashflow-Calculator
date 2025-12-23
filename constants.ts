import { AustralianState, InputState, DepreciationLevel } from "./types";

export const COLORS = {
  bg: "#FFFCED",
  primary: "#064E2C",
  accent: "#FD9B63",
  gold: "#C6A672",
  dark: "#0B090A",
  white: "#FFFFFF",
  lightGrey: "#F3F4F6",
};

/**
 * 2024-25 Stage 3 Tax Brackets
 */
export const TAX_BRACKETS = [
  { threshold: 190000, rate: 0.45 },
  { threshold: 135000, rate: 0.37 },
  { threshold: 45000, rate: 0.30 },
  { threshold: 18200, rate: 0.16 },
  { threshold: 0, rate: 0 },
];

export const LOGO_BASE64 = "";

export const DEFAULT_INPUTS: InputState = {
  propertyAddress: "",
  purchasePrice: 850000,
  state: AustralianState.QLD,
  
  depositPercent: 20,
  interestRate: 6.5,
  loanTermYears: 30,
  isInterestOnly: false,
  interestOnlyYears: 5,

  stampDuty: 0,
  buyersAgentFee: 15000,
  solicitorFee: 2000,
  buildingPestFee: 600,
  otherUpfront: 0,

  weeklyRent: 750,
  managementFeePercent: 7,
  vacancyWeeks: 2,
  councilRates: 2500,
  insurance: 1800,
  repairsMaintenance: 1000,
  landTax: 0,
  bodyCorp: 0,
  otherExpenses: 0,

  // Taxation & Depreciation Defaults
  annualSalary: 120000,
  depreciationLevel: DepreciationLevel.Recent,
  manualDepreciation: 0,

  capitalGrowthPercent: 6,
  rentalGrowthPercent: 4,
  inflationPercent: 3,
};