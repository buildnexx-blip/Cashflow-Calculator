import { AustralianState, InputState, CalculationResult, YearlyProjection } from "../types";

export const estimateStampDuty = (state: AustralianState, price: number): number => {
  // Simplified brackets for estimation purposes. 
  // In a real app, this would be a comprehensive lookup table.
  let duty = 0;
  
  switch (state) {
    case AustralianState.NSW:
      if (price > 1089000) duty = 44095 + (price - 1089000) * 0.055;
      else if (price > 327000) duty = 9835 + (price - 327000) * 0.045;
      else duty = price * 0.035;
      break;
    case AustralianState.VIC:
      if (price > 960000) duty = price * 0.055; // Simplified
      else duty = price * 0.05; 
      break;
    case AustralianState.QLD:
      if (price > 1000000) duty = 38025 + (price - 1000000) * 0.0575;
      else if (price > 540000) duty = 17325 + (price - 540000) * 0.045;
      else duty = price * 0.035;
      break;
    case AustralianState.WA:
      if (price > 725000) duty = 28453 + (price - 725000) * 0.0515;
      else duty = price * 0.04;
      break;
    case AustralianState.SA:
      if (price > 250000) duty = 8955 + (price - 250000) * 0.05;
      else duty = price * 0.04;
      break;
    default:
      duty = price * 0.04; // Generic average
  }

  return Math.round(duty);
};

export const calculateProjections = (inputs: InputState): CalculationResult => {
  const {
    purchasePrice,
    depositPercent,
    interestRate,
    loanTermYears,
    isInterestOnly,
    interestOnlyYears,
    weeklyRent,
    managementFeePercent,
    vacancyWeeks,
    councilRates,
    insurance,
    repairsMaintenance,
    landTax,
    bodyCorp,
    otherExpenses,
    capitalGrowthPercent,
    rentalGrowthPercent,
    inflationPercent,
  } = inputs;

  const depositAmount = purchasePrice * (depositPercent / 100);
  const loanPrincipal = purchasePrice - depositAmount;
  const upfrontCostsTotal = inputs.stampDuty + inputs.buyersAgentFee + inputs.solicitorFee + inputs.buildingPestFee + inputs.otherUpfront;
  
  const monthlyRate = (interestRate / 100) / 12;
  const totalMonths = loanTermYears * 12;

  // --- Calculate Year 0 (Current Position / Snapshot) ---
  // This represents the "Day 1" annualized position based on inputs, before any growth.
  
  const y0GrossRent = weeklyRent * (52 - vacancyWeeks);
  const y0MgmtFee = y0GrossRent * (managementFeePercent / 100);
  const y0OperatingExpenses = 
    y0MgmtFee + 
    councilRates + 
    insurance + 
    repairsMaintenance + 
    landTax + 
    bodyCorp + 
    otherExpenses;
  
  // Year 0 Mortgage (Annualized estimate)
  let y0AnnualMortgage = 0;
  if (isInterestOnly) {
     y0AnnualMortgage = loanPrincipal * (interestRate / 100);
  } else {
     // Standard P&I annual sum
     const pmt = (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
     y0AnnualMortgage = pmt * 12;
  }
  
  const y0NetCashflow = y0GrossRent - y0OperatingExpenses - y0AnnualMortgage;

  const projections: YearlyProjection[] = [];
  let positiveCashflowYear: number | null = null;
  let hasFoundPositive = false;

  // Check Year 0 logic - if already positive, set year to 0
  if (y0NetCashflow > 0) {
    positiveCashflowYear = 0;
    hasFoundPositive = true;
  }

  // Push Year 0 Snapshot
  projections.push({
    year: 0,
    propertyValue: purchasePrice,
    loanBalance: loanPrincipal,
    equity: depositAmount,
    grossRent: y0GrossRent,
    weeklyRent: weeklyRent, // Current weekly rent
    netCashflow: y0NetCashflow,
    totalExpenses: y0OperatingExpenses,
    interestPaid: 0,
    principalPaid: 0
  });

  // --- Prepare for Projection Loop ---
  // We assume Year 1 represents the state at the end of Year 1 (or during Year 1 with growth applied).
  // To ensure Y1 differs from Y0, we apply growth immediately for the Year 1 forecast.
  
  let currentPropertyValue = purchasePrice * (1 + capitalGrowthPercent / 100);
  let currentWeeklyRent = weeklyRent * (1 + rentalGrowthPercent / 100);
  let currentLoanBalance = loanPrincipal;
  
  let currentExpenses = {
    councilRates: councilRates * (1 + inflationPercent / 100),
    insurance: insurance * (1 + inflationPercent / 100),
    repairsMaintenance: repairsMaintenance * (1 + inflationPercent / 100),
    landTax: landTax * (1 + inflationPercent / 100),
    bodyCorp: bodyCorp * (1 + inflationPercent / 100),
    otherExpenses: otherExpenses * (1 + inflationPercent / 100)
  };

  // --- Projection Loop (Years 1 to 30) ---

  for (let year = 1; year <= 30; year++) {
    // 1. Calculate Rental Income
    const annualGrossRent = currentWeeklyRent * (52 - vacancyWeeks);
    const managementFee = annualGrossRent * (managementFeePercent / 100);
    
    // 2. Calculate Operating Expenses
    const operatingExpenses = 
      managementFee + 
      currentExpenses.councilRates + 
      currentExpenses.insurance + 
      currentExpenses.repairsMaintenance + 
      currentExpenses.landTax + 
      currentExpenses.bodyCorp + 
      currentExpenses.otherExpenses;

    // 3. Calculate Mortgage
    let interestPaidYear = 0;
    let principalPaidYear = 0;

    for (let m = 1; m <= 12; m++) {
      const monthIndex = (year - 1) * 12 + m;
      const isIOPeriod = isInterestOnly && year <= interestOnlyYears;
      
      const interestPayment = currentLoanBalance * monthlyRate;
      let totalPayment = 0;

      if (isIOPeriod) {
        totalPayment = interestPayment;
        principalPaidYear += 0;
      } else {
        const monthsRemaining = totalMonths - ((isInterestOnly ? interestOnlyYears : 0) * 12) - (monthIndex - (isInterestOnly ? interestOnlyYears * 12 : 0) - 1);
        if (monthsRemaining <= 0 || currentLoanBalance <= 0) {
           totalPayment = currentLoanBalance;
        } else {
           totalPayment = (currentLoanBalance * monthlyRate * Math.pow(1 + monthlyRate, monthsRemaining)) / (Math.pow(1 + monthlyRate, monthsRemaining) - 1);
        }
      }

      const principalPayment = totalPayment - interestPayment;
      interestPaidYear += interestPayment;
      const actualPrincipal = Math.min(principalPayment, currentLoanBalance);
      principalPaidYear += actualPrincipal;
      currentLoanBalance -= actualPrincipal;
    }

    const totalMortgageRepayments = interestPaidYear + principalPaidYear;
    const netCashflow = annualGrossRent - operatingExpenses - totalMortgageRepayments;

    // Check for positive cashflow crossover
    if (netCashflow > 0 && !hasFoundPositive) {
      positiveCashflowYear = year;
      hasFoundPositive = true;
    }

    // Store Projection
    projections.push({
      year,
      propertyValue: currentPropertyValue,
      loanBalance: Math.max(0, currentLoanBalance),
      equity: currentPropertyValue - Math.max(0, currentLoanBalance),
      grossRent: annualGrossRent,
      weeklyRent: currentWeeklyRent,
      netCashflow,
      totalExpenses: operatingExpenses,
      interestPaid: interestPaidYear,
      principalPaid: principalPaidYear
    });

    // Inflate values for NEXT year
    currentPropertyValue *= (1 + capitalGrowthPercent / 100);
    currentWeeklyRent *= (1 + rentalGrowthPercent / 100);
    
    currentExpenses = {
      councilRates: currentExpenses.councilRates * (1 + inflationPercent / 100),
      insurance: currentExpenses.insurance * (1 + inflationPercent / 100),
      repairsMaintenance: currentExpenses.repairsMaintenance * (1 + inflationPercent / 100),
      landTax: currentExpenses.landTax * (1 + inflationPercent / 100),
      bodyCorp: currentExpenses.bodyCorp * (1 + inflationPercent / 100),
      otherExpenses: currentExpenses.otherExpenses * (1 + inflationPercent / 100),
    };
  }

  // Snapshot for Breakdown Table (Using Year 0 / Current Inputs)
  // We use the Potential Rent from inputs, not the inflated year 1 rent.
  const potentialGrossRentY0 = weeklyRent * 52;
  const vacancyLossY0 = potentialGrossRentY0 - y0GrossRent;
  const managementFeesY0 = y0MgmtFee;
  const otherOperatingExpensesY0 = y0OperatingExpenses - managementFeesY0;

  return {
    upfrontCostsTotal,
    loanAmount: loanPrincipal,
    lvr: (loanPrincipal / purchasePrice) * 100,
    // Return Year 0 Snapshot for the "Current Cashflow" table
    firstYearCashflow: {
      potentialGrossRent: potentialGrossRentY0,
      vacancyLoss: vacancyLossY0,
      effectiveGrossRent: y0GrossRent,
      managementFees: managementFeesY0,
      otherOperatingExpenses: otherOperatingExpensesY0,
      mortgageRepayments: y0AnnualMortgage,
      netCashflow: y0NetCashflow
    },
    projections,
    positiveCashflowYear
  };
};