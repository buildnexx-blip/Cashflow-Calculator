/**
 * @license
 * COPYRIGHT (C) 2024 HOMEZ BUYERS ADVOCACY. ALL RIGHTS RESERVED.
 * 
 * PROPRIETARY AND CONFIDENTIAL:
 * This file contains the proprietary mathematical formulas and growth logic 
 * owned by Homez Buyers Advocacy. Version: 2.5-PRODUCTION
 */

import { AustralianState, InputState, CalculationResult, YearlyProjection, DepreciationLevel } from "../types";
import { TAX_BRACKETS, VERSION } from "../constants";

export const estimateStampDuty = (state: AustralianState, price: number): number => {
  let duty = 0;
  const p = Math.max(0, price);
  switch (state) {
    case AustralianState.NSW:
      if (p > 1089000) duty = 44095 + (p - 1089000) * 0.055;
      else if (p > 327000) duty = 9835 + (p - 327000) * 0.045;
      else duty = p * 0.035;
      break;
    case AustralianState.VIC:
      if (p > 2000000) duty = 110000 + (p - 2000000) * 0.065;
      else if (p > 960000) duty = p * 0.055;
      else duty = p * 0.05; 
      break;
    case AustralianState.QLD:
      if (p > 1000000) duty = 38025 + (p - 1000000) * 0.0575;
      else if (p > 540000) duty = 17325 + (p - 540000) * 0.045;
      else duty = p * 0.035;
      break;
    case AustralianState.WA:
      if (p > 725000) duty = 28453 + (p - 725000) * 0.0515;
      else duty = p * 0.04;
      break;
    case AustralianState.SA:
      if (p > 250000) duty = 8955 + (p - 250000) * 0.05;
      else duty = p * 0.04;
      break;
    default:
      duty = p * 0.045;
  }
  return Math.round(duty);
};

const calculateTotalIncomeTax = (income: number): number => {
  const inc = Math.max(0, income);
  let tax = 0;
  if (inc > 190000) tax += (inc - 190000) * 0.45 + (190000 - 135000) * 0.37 + (135000 - 45000) * 0.30 + (45000 - 18200) * 0.16;
  else if (inc > 135000) tax += (inc - 135000) * 0.37 + (135000 - 45000) * 0.30 + (45000 - 18200) * 0.16;
  else if (inc > 45000) tax += (inc - 45000) * 0.30 + (45000 - 18200) * 0.16;
  else if (inc > 18200) tax += (inc - 18200) * 0.16;
  return Math.max(0, tax);
};

const calculateMarginalTaxRate = (income: number): number => {
  for (const bracket of TAX_BRACKETS) {
    if (income > bracket.threshold) return bracket.rate;
  }
  return 0;
};

const getDepreciationEstimate = (level: DepreciationLevel, price: number, manual: number): number => {
  switch (level) {
    case DepreciationLevel.New: return price * 0.022; 
    case DepreciationLevel.Recent: return price * 0.012; 
    case DepreciationLevel.Old: return 2000; 
    case DepreciationLevel.Manual: return manual;
    default: return 0;
  }
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
    annualSalary,
    depreciationLevel,
    manualDepreciation
  } = inputs;

  const depositAmount = purchasePrice * (Math.min(100, Math.max(0, depositPercent)) / 100);
  const loanPrincipal = Math.max(0, purchasePrice - depositAmount);
  const upfrontCostsTotal = inputs.stampDuty + inputs.buyersAgentFee + inputs.solicitorFee + inputs.buildingPestFee + inputs.otherUpfront;
  
  const safeRate = Math.max(0, interestRate);
  const monthlyRate = (safeRate / 100) / 12;
  const totalMonths = Math.max(1, loanTermYears * 12);
  const marginalRate = calculateMarginalTaxRate(annualSalary);
  const totalBaseTax = calculateTotalIncomeTax(annualSalary);

  const projections: YearlyProjection[] = [];

  let currentPropertyValue = purchasePrice;
  let currentWeeklyRent = weeklyRent;
  let currentLoanBalance = loanPrincipal;
  
  let currentExpenses = { councilRates, insurance, repairsMaintenance, landTax, bodyCorp, otherExpenses };

  let positiveCashflowYear: number | null = null;
  let positiveCashflowAfterTaxYear: number | null = null;

  for (let year = 0; year <= 30; year++) {
    if (year > 0) {
      currentPropertyValue *= (1 + capitalGrowthPercent / 100);
      currentWeeklyRent *= (1 + rentalGrowthPercent / 100);
      const infl = (1 + inflationPercent / 100);
      currentExpenses = {
        councilRates: currentExpenses.councilRates * infl,
        insurance: currentExpenses.insurance * infl,
        repairsMaintenance: currentExpenses.repairsMaintenance * infl,
        landTax: currentExpenses.landTax * infl,
        bodyCorp: currentExpenses.bodyCorp * infl,
        otherExpenses: currentExpenses.otherExpenses * infl,
      };
    }

    const annualGrossRent = currentWeeklyRent * Math.max(0, 52 - vacancyWeeks);
    const managementFee = annualGrossRent * (managementFeePercent / 100);
    const operatingExpenses = managementFee + Object.values(currentExpenses).reduce((a, b) => a + b, 0);

    let interestPaidYear = 0;
    let principalPaidYear = 0;
    let tempBalance = currentLoanBalance;

    if (tempBalance > 0) {
      const isIOPeriod = isInterestOnly && year < interestOnlyYears;
      for (let m = 1; m <= 12; m++) {
        const globalMonthIndex = (year * 12) + m;
        const interestPayment = tempBalance * monthlyRate;
        let totalPayment = 0;

        if (isIOPeriod) {
          totalPayment = interestPayment;
        } else if (safeRate === 0) {
          const remainingMonths = Math.max(1, totalMonths - (isInterestOnly ? interestOnlyYears * 12 : 0) - ((year > (isInterestOnly ? interestOnlyYears : 0) ? (year - (isInterestOnly ? interestOnlyYears : 0)) * 12 : 0) + m - 1));
          totalPayment = tempBalance / remainingMonths;
        } else {
          const totalPIMonths = totalMonths - (isInterestOnly ? interestOnlyYears * 12 : 0);
          const monthsElapsedInPI = Math.max(0, globalMonthIndex - (isInterestOnly ? interestOnlyYears * 12 : 0)) - 1;
          const monthsRemaining = totalPIMonths - monthsElapsedInPI;
          
          if (monthsRemaining <= 0) {
            totalPayment = tempBalance + interestPayment;
          } else {
            totalPayment = (tempBalance * monthlyRate * Math.pow(1 + monthlyRate, monthsRemaining)) / (Math.pow(1 + monthlyRate, monthsRemaining) - 1);
          }
        }

        const principalPayment = Math.max(0, totalPayment - interestPayment);
        interestPaidYear += interestPayment;
        const actualPrincipal = Math.min(principalPayment, tempBalance);
        principalPaidYear += actualPrincipal;
        tempBalance -= actualPrincipal;
      }
    }

    const baseDepreciation = getDepreciationEstimate(depreciationLevel, purchasePrice, manualDepreciation);
    const yearlyDepreciation = year < 10 ? baseDepreciation * Math.pow(0.85, year) : 0;

    const netCashflow = annualGrossRent - operatingExpenses - (interestPaidYear + principalPaidYear);
    const taxableProfitLoss = annualGrossRent - operatingExpenses - interestPaidYear - yearlyDepreciation;
    
    let taxRefund = 0;
    if (taxableProfitLoss < 0) {
      const theoreticalRefund = Math.abs(taxableProfitLoss) * marginalRate;
      taxRefund = Math.min(theoreticalRefund, totalBaseTax); 
    }

    const afterTaxCashflow = netCashflow + taxRefund;

    if (netCashflow > 0 && positiveCashflowYear === null && year > 0) positiveCashflowYear = year;
    if (afterTaxCashflow > 0 && positiveCashflowAfterTaxYear === null && year > 0) positiveCashflowAfterTaxYear = year;

    projections.push({
      year,
      propertyValue: currentPropertyValue,
      loanBalance: Math.max(0, currentLoanBalance),
      equity: Math.max(0, currentPropertyValue - Math.max(0, currentLoanBalance)),
      grossRent: annualGrossRent,
      weeklyRent: currentWeeklyRent,
      netCashflow,
      afterTaxCashflow,
      taxRefund,
      totalExpenses: operatingExpenses,
      interestPaid: interestPaidYear,
      principalPaid: principalPaidYear,
      depreciation: yearlyDepreciation
    });

    currentLoanBalance = tempBalance;
  }

  const y0 = projections[0];

  return {
    upfrontCostsTotal,
    loanAmount: loanPrincipal,
    lvr: purchasePrice > 0 ? (loanPrincipal / purchasePrice) * 100 : 0,
    marginalTaxRate: marginalRate,
    firstYearCashflow: {
      potentialGrossRent: weeklyRent * 52,
      vacancyLoss: (weeklyRent * 52) - y0.grossRent,
      effectiveGrossRent: y0.grossRent,
      managementFees: y0.grossRent * (managementFeePercent / 100),
      otherOperatingExpenses: Math.max(0, y0.totalExpenses - (y0.grossRent * (managementFeePercent / 100))),
      mortgageRepayments: y0.interestPaid + y0.principalPaid,
      netCashflow: y0.netCashflow,
      taxRefund: y0.taxRefund,
      afterTaxCashflow: y0.afterTaxCashflow,
      depreciation: y0.depreciation
    },
    projections,
    positiveCashflowYear,
    positiveCashflowAfterTaxYear
  };
};

export const runDiagnostics = (inputs: InputState) => {
  if (process.env.NODE_ENV === 'production') return;
  console.group(`HWPE ${VERSION} DIAGNOSTICS`);
  const start = performance.now();
  const results = calculateProjections(inputs);
  const end = performance.now();
  console.log(`Execution Time: ${(end - start).toFixed(4)}ms`);
  console.log(`Initial Yield: ${results.firstYearCashflow.effectiveGrossRent > 0 ? ((results.firstYearCashflow.effectiveGrossRent / inputs.purchasePrice) * 100).toFixed(2) : '0.00'}%`);
  console.table({
    lvrMatch: results.lvr.toFixed(2) + "%",
    taxSanity: results.firstYearCashflow.taxRefund >= 0 ? "VALID" : "INVALID"
  });
  console.groupEnd();
};