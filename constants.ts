import { AustralianState, InputState } from "./types";

export const COLORS = {
  bg: "#FFFCED",
  primary: "#064E2C",
  accent: "#FD9B63",
  gold: "#C6A672",
  dark: "#0B090A",
  white: "#FFFFFF",
  lightGrey: "#F3F4F6",
};

// INSTRUCTIONS FOR LOGO:
// 1. Go to https://www.base64-image.de/
// 2. Upload your original "Homez" logo file (PNG or JPG).
// 3. Click "Copy Image" or copy the generated string.
// 4. Paste the string inside the quotes below to use your logo "as is".
// Example format: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
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

  stampDuty: 0, // Will be auto-calced on init
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

  capitalGrowthPercent: 6,
  rentalGrowthPercent: 4,
  inflationPercent: 3,
};