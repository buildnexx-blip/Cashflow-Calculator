/**
 * @license
 * COPYRIGHT (C) 2024 HOMEZ BUYERS ADVOCACY. ALL RIGHTS RESERVED.
 * 
 * PROPRIETARY AND CONFIDENTIAL:
 * This file contains the proprietary mathematical formulas and growth logic 
 * owned by Homez Buyers Advocacy. This code and the logic within it are protected 
 * by Australian and International Copyright and Trade Secret laws.
 * 
 * Unauthorized copying, reverse engineering, or redistribution of this logic 
 * via any medium is strictly prohibited.
 * 
 * Version: 2.2-STABLE
 * Engine: Homez Wealth Projection Engine (HWPE)
 */

import { AustralianState, InputState, CalculationResult, YearlyProjection, DepreciationLevel } from "../types";
import { TAX_BRACKETS } from "../constants";

export const estimateStampDuty = (state: AustralianState, price: number): number => {
  let duty = 0;
  switch (state) {
    case AustralianState.NSW:
      if (price > 1089000) duty = 44095 + (price - 1089000) * 0.055;
      else if (price > 327000) duty = 9835 + (price - 327000) * 0.045;
      else duty = price * 0.035;
      break;
    case AustralianState.VIC:
      if (price > 2000000) duty = 110000 + (price - 2000000) * 0.065;
      else if (price > 960000) duty = price * 0.055;
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
      duty = price * 0.045;
  }
  return Math.round(duty);
};

const calculateTotalIncomeTax = (income: number): number => {
  let tax = 0;
  if (income > 190000) tax += (income - 190000) * 0.45 + (190000 - 135000) * 0.37 + (135000 - 45000) * 0.30 + (45000 - 18200) * 0.16;
  else if (income > 135000) tax += (income - 135000) * 0.37 + (135000 - 45000) * 0.30 + (45000 - 18200) * 0.16;
  else if (income > 45000) tax += (income - 45000) * 0.30 + (45000 - 18200) * 0.16;
  else if (income > 18200) tax += (income - 18200) * 0.16;
  return tax;
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

  const depositAmount = purchasePrice * (depositPercent / 100);
  const loanPrincipal = Math.max(0, purchasePrice - depositAmount);
  const upfrontCostsTotal = inputs.stampDuty + inputs.buyersAgentFee + inputs.solicitorFee + inputs.buildingPestFee + inputs.otherUpfront;
  
  const monthlyRate = (interestRate / 100) / 12;
  const totalMonths = loanTermYears * 12;
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
      currentExpenses = {
        councilRates: currentExpenses.councilRates * (1 + inflationPercent / 100),
        insurance: currentExpenses.insurance * (1 + inflationPercent / 100),
        repairsMaintenance: currentExpenses.repairsMaintenance * (1 + inflationPercent / 100),
        landTax: currentExpenses.landTax * (1 + inflationPercent / 100),
        bodyCorp: currentExpenses.bodyCorp * (1 + inflationPercent / 100),
        otherExpenses: currentExpenses.otherExpenses * (1 + inflationPercent / 100),
      };
    }

    const annualGrossRent = currentWeeklyRent * (52 - vacancyWeeks);
    const managementFee = annualGrossRent * (managementFeePercent / 100);
    const operatingExpenses = managementFee + Object.values(currentExpenses).reduce((a, b) => a + b, 0);

    let interestPaidYear = 0;
    let principalPaidYear = 0;

    let tempBalance = currentLoanBalance;
    const isIOPeriod = isInterestOnly && year < interestOnlyYears;
    
    for (let m = 1; m <= 12; m++) {
      const globalMonthIndex = (year * 12) + m;
      const interestPayment = tempBalance * monthlyRate;
      let totalPayment = 0;

      if (isIOPeriod) {
        totalPayment = interestPayment;
      } else if (interestRate === 0) {
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
      equity: currentPropertyValue - Math.max(0, currentLoanBalance),
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
    lvr: (loanPrincipal / purchasePrice) * 100,
    marginalTaxRate: marginalRate,
    firstYearCashflow: {
      potentialGrossRent: weeklyRent * 52,
      vacancyLoss: (weeklyRent * 52) - y0.grossRent,
      effectiveGrossRent: y0.grossRent,
      managementFees: y0.grossRent * (managementFeePercent / 100),
      otherOperatingExpenses: y0.totalExpenses - (y0.grossRent * (managementFeePercent / 100)),
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
