export enum AustralianState {
  NSW = 'NSW',
  VIC = 'VIC',
  QLD = 'QLD',
  SA = 'SA',
  WA = 'WA',
  TAS = 'TAS',
  ACT = 'ACT',
  NT = 'NT',
}

export interface InputState {
  // Property
  propertyAddress?: string;
  purchasePrice: number;
  state: AustralianState;
  
  // Finance
  depositPercent: number;
  interestRate: number;
  loanTermYears: number;
  isInterestOnly: boolean;
  interestOnlyYears: number;

  // Upfront Costs
  stampDuty: number; // calculated or overridden
  buyersAgentFee: number;
  solicitorFee: number;
  buildingPestFee: number;
  otherUpfront: number;

  // Income & Expenses (Annualized in logic, but input as weekly often)
  weeklyRent: number;
  managementFeePercent: number;
  vacancyWeeks: number;
  councilRates: number; // annual
  insurance: number; // annual
  repairsMaintenance: number; // annual
  landTax: number; // annual
  bodyCorp: number; // annual
  otherExpenses: number; // annual

  // Projections
  capitalGrowthPercent: number;
  rentalGrowthPercent: number;
  inflationPercent: number; // for expenses
}

export interface YearlyProjection {
  year: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  grossRent: number;
  weeklyRent: number;
  netCashflow: number;
  totalExpenses: number;
  interestPaid: number;
  principalPaid: number;
}

export interface CalculationResult {
  upfrontCostsTotal: number;
  loanAmount: number;
  lvr: number;
  firstYearCashflow: {
    potentialGrossRent: number; // Rent * 52
    vacancyLoss: number; // Rent * vacancyWeeks
    effectiveGrossRent: number; // potential - vacancy
    managementFees: number;
    otherOperatingExpenses: number; // rates, insurance, etc
    mortgageRepayments: number;
    netCashflow: number;
  };
  projections: YearlyProjection[];
  positiveCashflowYear: number | null; // The year it turns positive
}

export interface UserDetails {
  name: string;
  email: string;
  phone: string;
  goal: 'Owner Occupier' | 'Investment';
}