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

export enum DepreciationLevel {
  New = 'New Build (High)',
  Recent = 'Recent / Renovated (Med)',
  Old = 'Older Existing (Low)',
  Manual = 'Manual Input',
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
  stampDuty: number; 
  buyersAgentFee: number;
  solicitorFee: number;
  buildingPestFee: number;
  otherUpfront: number;

  // Income & Expenses
  weeklyRent: number;
  managementFeePercent: number;
  vacancyWeeks: number;
  councilRates: number; 
  insurance: number; 
  repairsMaintenance: number; 
  landTax: number; 
  bodyCorp: number; 
  otherExpenses: number; 

  // Taxation & Depreciation
  annualSalary: number;
  depreciationLevel: DepreciationLevel;
  manualDepreciation: number;

  // Projections
  capitalGrowthPercent: number;
  rentalGrowthPercent: number;
  inflationPercent: number; 
}

export interface YearlyProjection {
  year: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  grossRent: number;
  weeklyRent: number;
  netCashflow: number;
  afterTaxCashflow: number; 
  taxRefund: number;        
  totalExpenses: number;
  interestPaid: number;
  principalPaid: number;
  depreciation: number;     
}

export interface CalculationResult {
  upfrontCostsTotal: number;
  loanAmount: number;
  lvr: number;
  marginalTaxRate: number;
  firstYearCashflow: {
    potentialGrossRent: number;
    vacancyLoss: number;
    effectiveGrossRent: number;
    managementFees: number;
    otherOperatingExpenses: number;
    mortgageRepayments: number;
    netCashflow: number;
    taxRefund: number;        
    afterTaxCashflow: number; 
    depreciation: number;     
  };
  projections: YearlyProjection[];
  positiveCashflowYear: number | null;
  positiveCashflowAfterTaxYear: number | null;
}

export interface UserDetails {
  name: string;
  email: string;
  phone: string;
  goal: 'Owner Occupier' | 'Investment';
}