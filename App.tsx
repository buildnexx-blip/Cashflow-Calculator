import React, { useState, useEffect } from 'react';
import { DEFAULT_INPUTS } from './constants';
import { InputState, AustralianState, CalculationResult, UserDetails, DepreciationLevel } from './types';
import { calculateProjections, estimateStampDuty } from './utils/calculations';
import { InputGroup, NumberInput, SelectInput, TextInput } from './components/InputGroup';
import ProjectionChart from './components/ProjectionChart';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from 'jspdf';

const DISCLAIMER_TEXT = (
  <>
    <p className="mb-2"><strong>Proprietary Intelligence Notice:</strong> This software and the underlying 10-year wealth projection algorithms (HWPE Engine V2.2) are the exclusive intellectual property of Homez Buyers Advocacy. Calculations are provided for illustrative purposes and do not constitute formal financial, legal, or tax advice.</p>
    <ul className="list-disc pl-5 space-y-1 mb-2">
      <li><strong>Taxation & Stage 3:</strong> Modeling follows the 2024-25 Australian Federal Tax Framework.</li>
      <li><strong>IP Protection:</strong> Unauthorized access, reverse engineering, or commercial use of this methodology is a violation of Australian Copyright and Trade Secret laws.</li>
      <li><strong>Liability:</strong> Results are estimates based on user inputs. Market volatility and individual circumstances may result in performance variance.</li>
    </ul>
    <p>© {new Date().getFullYear()} Homez Buyers Advocacy. All Rights Reserved. ABN 50 677 376 368.</p>
  </>
);

const App: React.FC = () => {
  const [inputs, setInputs] = useState<InputState>(() => ({
    ...DEFAULT_INPUTS,
    stampDuty: estimateStampDuty(DEFAULT_INPUTS.state, DEFAULT_INPUTS.purchasePrice)
  }));
  
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [showAfterTax, setShowAfterTax] = useState(true);
  const [clientDetails, setClientDetails] = useState<UserDetails | null>(null);
  
  // Level 3 Deterrence: Developer Console Barrier
  useEffect(() => {
    const consoleStyles = [
      'color: #064E2C',
      'background: #FFFCED',
      'font-size: 20px',
      'border: 2px solid #C6A672',
      'padding: 10px',
      'font-weight: bold',
      'font-family: serif'
    ].join(';');

    console.log('%c STOP! PROPRIETARY SYSTEM PROTECTED ', 'color: white; background: #064E2C; font-size: 24px; font-weight: bold;');
    console.log('%cThis software is the intellectual property of Homez. Reverse engineering is strictly prohibited.', consoleStyles);
    console.log('Unauthorized replication of the HWPE (Homez Wealth Projection Engine) logic is monitored and legally actionable.');
  }, []);

  useEffect(() => {
    const calcResults = calculateProjections(inputs);
    setResults(calcResults);
  }, [inputs]);

  const handlePropertyChange = (field: keyof InputState, value: any) => {
    const newInputs = { ...inputs, [field]: value };
    if (field === 'purchasePrice' || field === 'state') {
      newInputs.stampDuty = estimateStampDuty(newInputs.state, newInputs.purchasePrice);
    }
    setInputs(newInputs);
  };

  const handleInputChange = (field: keyof InputState, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const resetDefaults = () => {
    const defaultsWithDuty = {
      ...DEFAULT_INPUTS,
      stampDuty: estimateStampDuty(DEFAULT_INPUTS.state, DEFAULT_INPUTS.purchasePrice)
    };
    setInputs(defaultsWithDuty);
  };

  const generatePDF = async (userDetails: UserDetails): Promise<string | null> => {
    setClientDetails(userDetails);
    setIsGenerating(true);
    
    const page1Element = document.getElementById('print-page-1');
    const page2Element = document.getElementById('print-page-2');

    if (page1Element && page2Element) {
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvas1 = await html2canvas(page1Element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        pdf.addImage(canvas1.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        pdf.addPage();
        const canvas2 = await html2canvas(page2Element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        const fileName = `Homez_Proprietary_Analysis_${userDetails.name.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
        
        setIsGenerating(false);
        return fileName;
      } catch (error) {
        console.error("PDF engine crash", error);
        setIsGenerating(false);
        return null;
      }
    }
    setIsGenerating(false);
    return null;
  };

  if (!results) return null;

  const depositAmount = inputs.purchasePrice * (inputs.depositPercent / 100);
  const totalCashRequired = results.upfrontCostsTotal + depositAmount;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto relative flex flex-col">
      <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#064E2C]">Homez Buyers Advocacy</h1>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-[#064E2C]">Wealth Projection Engine</h2>
            <span className="text-[9px] bg-[#064E2C] text-white px-2 py-0.5 rounded font-black tracking-tighter">HWPE v2.2</span>
          </div>
          <p className="text-[#C6A672] text-lg font-medium">Proprietary Growth & Cashflow Analysis</p>
        </div>
        <div className="flex items-center gap-3">
            <span className="hidden md:block px-3 py-1 bg-green-100 text-[#064E2C] text-[10px] font-bold rounded-full border border-green-200 uppercase tracking-widest">Stage 3 compliant</span>
            <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 rounded-full font-bold bg-[#064E2C] text-white shadow-xl hover:bg-[#053d22] transition-all transform active:scale-95">
              Secure Full Report
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* LEFT COLUMN: INPUTS */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-[24px] p-6 shadow-sm border border-[#C6A672]/30">
            <h2 className="text-xl font-serif font-semibold text-[#064E2C] mb-4">Property Details</h2>
            <InputGroup label="Address (Optional)"><TextInput placeholder="e.g. 123 Smith St, Sydney" value={inputs.propertyAddress || ''} onChange={(e) => handleInputChange('propertyAddress', e.target.value)} /></InputGroup>
            <InputGroup label="Purchase Price"><NumberInput prefix="$" value={inputs.purchasePrice} onChange={(e) => handlePropertyChange('purchasePrice', Number(e.target.value))} /></InputGroup>
            <InputGroup label="State">
              <SelectInput value={inputs.state} onChange={(e) => handlePropertyChange('state', e.target.value as AustralianState)}>
                {Object.values(AustralianState).map(s => <option key={s} value={s}>{s}</option>)}
              </SelectInput>
            </InputGroup>
          </section>

          <section className="bg-white rounded-[24px] p-6 shadow-sm border border-[#C6A672]/30">
             <h2 className="text-xl font-serif font-semibold text-[#064E2C] mb-4">Purchase Costs</h2>
             <InputGroup label="Stamp Duty" subLabel="(Auto-Calc Engine)"><NumberInput prefix="$" value={inputs.stampDuty} onChange={(e) => handleInputChange('stampDuty', Number(e.target.value))} /></InputGroup>
             <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Buyer's Agent"><NumberInput prefix="$" value={inputs.buyersAgentFee} onChange={(e) => handleInputChange('buyersAgentFee', Number(e.target.value))} /></InputGroup>
                <InputGroup label="Solicitor"><NumberInput prefix="$" value={inputs.solicitorFee} onChange={(e) => handleInputChange('solicitorFee', Number(e.target.value))} /></InputGroup>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Build & Pest"><NumberInput prefix="$" value={inputs.buildingPestFee} onChange={(e) => handleInputChange('buildingPestFee', Number(e.target.value))} /></InputGroup>
                <InputGroup label="Misc / Other"><NumberInput prefix="$" value={inputs.otherUpfront} onChange={(e) => handleInputChange('otherUpfront', Number(e.target.value))} /></InputGroup>
             </div>
          </section>

          <section className="bg-white rounded-[24px] p-6 shadow-sm border border-[#C6A672]/30">
            <h2 className="text-xl font-serif font-semibold text-[#064E2C] mb-4">Finance</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Deposit %"><NumberInput suffix="%" value={inputs.depositPercent} onChange={(e) => handleInputChange('depositPercent', Number(e.target.value))} /></InputGroup>
              <InputGroup label="Rate %"><NumberInput suffix="%" value={inputs.interestRate} onChange={(e) => handleInputChange('interestRate', Number(e.target.value))} /></InputGroup>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-b border-gray-100 my-4">
              <span className="text-sm font-semibold text-gray-700">Interest Only?</span>
              <button onClick={() => handleInputChange('isInterestOnly', !inputs.isInterestOnly)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inputs.isInterestOnly ? 'bg-[#064E2C]' : 'bg-gray-200'}`}><span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${inputs.isInterestOnly ? 'translate-x-5' : 'translate-x-0'}`} /></button>
            </div>
            {inputs.isInterestOnly && <InputGroup label="IO Period (Years)"><NumberInput value={inputs.interestOnlyYears} onChange={(e) => handleInputChange('interestOnlyYears', Number(e.target.value))} /></InputGroup>}
            <InputGroup label="Loan Term (Years)"><NumberInput value={inputs.loanTermYears} onChange={(e) => handleInputChange('loanTermYears', Number(e.target.value))} /></InputGroup>
          </section>

          <section className="bg-white rounded-[24px] p-6 shadow-sm border border-[#C6A672]/30">
            <h2 className="text-xl font-serif font-semibold text-[#064E2C] mb-4">Income & Expenses</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Weekly Rent"><NumberInput prefix="$" value={inputs.weeklyRent} onChange={(e) => handleInputChange('weeklyRent', Number(e.target.value))} /></InputGroup>
              <InputGroup label="Vacancy (Wks/Yr)"><NumberInput value={inputs.vacancyWeeks} onChange={(e) => handleInputChange('vacancyWeeks', Number(e.target.value))} /></InputGroup>
            </div>
            <div className="my-4 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-widest text-[10px]">Annual Holding Costs</h3>
              <div className="grid grid-cols-2 gap-4">
                 <InputGroup label="Mgmt Fee %"><NumberInput suffix="%" value={inputs.managementFeePercent} onChange={(e) => handleInputChange('managementFeePercent', Number(e.target.value))} /></InputGroup>
                 <InputGroup label="Council Rates"><NumberInput prefix="$" value={inputs.councilRates} onChange={(e) => handleInputChange('councilRates', Number(e.target.value))} /></InputGroup>
                 <InputGroup label="Insurance"><NumberInput prefix="$" value={inputs.insurance} onChange={(e) => handleInputChange('insurance', Number(e.target.value))} /></InputGroup>
                 <InputGroup label="Repairs & Maint"><NumberInput prefix="$" value={inputs.repairsMaintenance} onChange={(e) => handleInputChange('repairsMaintenance', Number(e.target.value))} /></InputGroup>
                 <InputGroup label="Body Corporate"><NumberInput prefix="$" value={inputs.bodyCorp} onChange={(e) => handleInputChange('bodyCorp', Number(e.target.value))} /></InputGroup>
                 <InputGroup label="Land Tax"><NumberInput prefix="$" value={inputs.landTax} onChange={(e) => handleInputChange('landTax', Number(e.target.value))} /></InputGroup>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[24px] p-6 shadow-sm border border-[#C6A672]/30">
             <h2 className="text-xl font-serif font-semibold text-[#064E2C] mb-4">Tax & Depreciation</h2>
             <InputGroup label="Annual Salary (Before Tax)" subLabel={`Marginal Rate: ${(results.marginalTaxRate * 100).toFixed(0)}%`}><NumberInput prefix="$" value={inputs.annualSalary} onChange={(e) => handleInputChange('annualSalary', Number(e.target.value))} /></InputGroup>
             <InputGroup label="Depreciation Strategy">
                <SelectInput value={inputs.depreciationLevel} onChange={(e) => handleInputChange('depreciationLevel', e.target.value as DepreciationLevel)}>
                   {Object.values(DepreciationLevel).map(l => <option key={l} value={l}>{l}</option>)}
                </SelectInput>
             </InputGroup>
          </section>

          <section className="bg-white rounded-[24px] p-6 shadow-sm border border-[#C6A672]/30">
            <h2 className="text-xl font-serif font-semibold text-[#064E2C] mb-4">Strategic Assumptions</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Cap. Growth %"><NumberInput suffix="%" value={inputs.capitalGrowthPercent} onChange={(e) => handleInputChange('capitalGrowthPercent', Number(e.target.value))} className="bg-green-50" /></InputGroup>
              <InputGroup label="Rent Growth %"><NumberInput suffix="%" value={inputs.rentalGrowthPercent} onChange={(e) => handleInputChange('rentalGrowthPercent', Number(e.target.value))} className="bg-orange-50" /></InputGroup>
            </div>
          </section>
          
          <div className="flex gap-4">
             <button onClick={resetDefaults} className="flex-1 py-4 rounded-full text-xs font-bold border border-gray-300 text-gray-500 hover:bg-gray-50 transition-all">Reset</button>
             <button onClick={() => setIsModalOpen(true)} className="flex-[2] py-4 rounded-full text-xs font-bold bg-[#064E2C] text-white hover:bg-[#053d22] transition-all shadow-xl shadow-green-900/20">Secure Full PDF</button>
          </div>
        </div>

        {/* RIGHT COLUMN: RESULTS */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KPITile label="Gross Yield" value={`${((results.firstYearCashflow.effectiveGrossRent / inputs.purchasePrice) * 100).toFixed(2)}%`} subtext="Year 0" />
            <KPITile label={showAfterTax ? "Post-Tax (Wk)" : "Pre-Tax (Wk)"} value={`$${Math.round((showAfterTax ? results.firstYearCashflow.afterTaxCashflow : results.firstYearCashflow.netCashflow) / 52).toLocaleString()}`} subtext={showAfterTax ? "After Tax" : "Pre-Tax"} highlight={(showAfterTax ? results.firstYearCashflow.afterTaxCashflow : results.firstYearCashflow.netCashflow) > 0} />
            <KPITile label={showAfterTax ? "Post-Tax (Mth)" : "Pre-Tax (Mth)"} value={`$${Math.round((showAfterTax ? results.firstYearCashflow.afterTaxCashflow : results.firstYearCashflow.netCashflow) / 12).toLocaleString()}`} subtext={showAfterTax ? "After Tax" : "Pre-Tax"} highlight={(showAfterTax ? results.firstYearCashflow.afterTaxCashflow : results.firstYearCashflow.netCashflow) > 0} />
            <KPITile label="Tax Refund" value={`$${Math.round(results.firstYearCashflow.taxRefund).toLocaleString()}`} subtext="Est. Year 0" />
            <KPITile label="Cash Needed" value={`$${Math.round(totalCashRequired).toLocaleString()}`} subtext="Deposit + Costs" />
          </div>

          <div className="flex justify-between items-center bg-[#064E2C]/5 p-4 rounded-2xl border border-[#064E2C]/10">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-[#064E2C] animate-pulse"></span>
               <span className="text-xs font-bold text-[#064E2C] uppercase tracking-[0.2em]">Strategy Visualization</span>
            </div>
            <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100">
               <button onClick={() => setShowAfterTax(false)} className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${!showAfterTax ? 'bg-[#C6A672] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Pre-Tax</button>
               <button onClick={() => setShowAfterTax(true)} className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${showAfterTax ? 'bg-[#064E2C] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Post-Tax</button>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#C6A672]/30 shadow-sm overflow-hidden relative proprietary-watermark">
            <h3 className="text-lg font-serif font-semibold text-[#064E2C] mb-4">Estimated Entry Capital Profile</h3>
            <div className="overflow-x-auto relative z-10">
               <table className="w-full text-sm text-left">
                  <thead className="bg-[#FFFCED] text-[#C6A672]"><tr><th className="px-4 py-2 rounded-l-lg">Component</th><th className="px-4 py-2 text-right rounded-r-lg">Estimate</th></tr></thead>
                  <tbody>
                    <TableRow label={`Deposit Amount (${inputs.depositPercent}%)`} value={depositAmount} />
                    <TableRow label="Statutory Stamp Duty" value={inputs.stampDuty} />
                    <TableRow label="Professional Buyer's Agent Fee" value={inputs.buyersAgentFee} />
                    <TableRow label="Conveyancing & Due Diligence" value={inputs.solicitorFee + inputs.buildingPestFee} />
                    <tr className="font-bold border-t border-gray-200"><td className="px-4 py-4 text-[#064E2C]">Total Capital Expenditure</td><td className="px-4 py-4 text-right text-[#064E2C]">${totalCashRequired.toLocaleString()}</td></tr>
                  </tbody>
               </table>
            </div>
          </div>

          <ProjectionChart data={results.projections} positiveCashflowYear={showAfterTax ? results.positiveCashflowAfterTaxYear : results.positiveCashflowYear} />

          <div className="bg-white rounded-[24px] p-6 border border-[#C6A672]/30 shadow-sm overflow-hidden relative proprietary-watermark">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <h3 className="text-lg font-serif font-semibold text-[#064E2C]">Cashflow & Tax Bridge (Year 0)</h3>
                <span className="text-[9px] font-bold text-[#C6A672] uppercase tracking-[0.2em] mt-1 flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  Homez HWPE Proprietary Logic Engine
                </span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 uppercase tracking-widest">Confidential Analysis</span>
            </div>
            <div className="overflow-x-auto relative z-10">
               <table className="w-full text-sm text-left leading-relaxed">
                  <thead className="bg-[#064E2C] text-white"><tr><th className="px-4 py-3 rounded-l-lg">Item</th><th className="px-4 py-3 text-right">Monthly</th><th className="px-4 py-3 text-right rounded-r-lg">Annual</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="border-b border-gray-50"><td className="px-4 py-3 text-gray-700">Gross Rental Income</td><td className="px-4 py-3 text-right">${Math.round(results.firstYearCashflow.potentialGrossRent / 12).toLocaleString()}</td><td className="px-4 py-3 text-right font-medium">${Math.round(results.firstYearCashflow.potentialGrossRent).toLocaleString()}</td></tr>
                    <tr className="border-b border-gray-50 text-gray-500 italic"><td className="px-4 py-3 pl-8">Less: Professional Vacancy Allowance</td><td className="px-4 py-3 text-right">-${Math.round(results.firstYearCashflow.vacancyLoss / 12).toLocaleString()}</td><td className="px-4 py-3 text-right">-${Math.round(results.firstYearCashflow.vacancyLoss).toLocaleString()}</td></tr>
                    <tr className="bg-[#FFFCED] font-semibold text-[#064E2C]"><td className="px-4 py-3">Effective Gross Yield Cash</td><td className="px-4 py-3 text-right">${Math.round(results.firstYearCashflow.effectiveGrossRent / 12).toLocaleString()}</td><td className="px-4 py-3 text-right">${Math.round(results.firstYearCashflow.effectiveGrossRent).toLocaleString()}</td></tr>
                    <tr><td className="px-4 py-3 font-bold text-gray-900 bg-gray-50 uppercase tracking-widest text-[10px]" colSpan={3}>Operating Cash Outflow</td></tr>
                    <tr className="border-b border-gray-50"><td className="px-4 py-3 text-gray-700">Mortgage Service Requirements</td><td className="px-4 py-3 text-right text-gray-500">${Math.round(results.firstYearCashflow.mortgageRepayments / 12).toLocaleString()}</td><td className="px-4 py-3 text-right font-medium">${Math.round(results.firstYearCashflow.mortgageRepayments).toLocaleString()}</td></tr>
                    <tr className="border-b border-gray-50"><td className="px-4 py-3 text-gray-700">Property Maintenance & Holding Costs</td><td className="px-4 py-3 text-right text-gray-500">${Math.round(results.firstYearCashflow.otherOperatingExpenses / 12).toLocaleString()}</td><td className="px-4 py-3 text-right font-medium">${Math.round(results.firstYearCashflow.otherOperatingExpenses).toLocaleString()}</td></tr>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold"><td className="px-4 py-4 text-gray-900">Net Operational Cashflow (Pre-Tax)</td><td className={`px-4 py-4 text-right ${results.firstYearCashflow.netCashflow > 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>${Math.round(results.firstYearCashflow.netCashflow / 12).toLocaleString()}</td><td className={`px-4 py-4 text-right ${results.firstYearCashflow.netCashflow > 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>${Math.round(results.firstYearCashflow.netCashflow).toLocaleString()}</td></tr>
                    <tr><td className="px-4 py-3 font-bold text-gray-900 bg-gray-50 uppercase tracking-widest text-[10px]" colSpan={3}>Tax Structural Benefits</td></tr>
                    <tr className="border-b border-gray-50 text-[#C6A672] italic"><td className="px-4 py-3">Plant & Equipment Depreciation (Paper)</td><td className="px-4 py-3 text-right">${Math.round(results.firstYearCashflow.depreciation / 12).toLocaleString()}</td><td className="px-4 py-3 text-right font-medium">${Math.round(results.firstYearCashflow.depreciation).toLocaleString()}</td></tr>
                    <tr className="bg-[#064E2C]/5 font-bold text-[#064E2C]"><td className="px-4 py-3">Estimated ATO Taxation Recovery</td><td className="px-4 py-3 text-right">${Math.round(results.firstYearCashflow.taxRefund / 12).toLocaleString()}</td><td className="px-4 py-3 text-right">${Math.round(results.firstYearCashflow.taxRefund).toLocaleString()}</td></tr>
                    <tr className="bg-[#064E2C] text-white font-bold"><td className="px-4 py-4 text-lg">Consolidated Post-Tax Position</td><td className="px-4 py-4 text-right text-lg">${Math.round(results.firstYearCashflow.afterTaxCashflow / 12).toLocaleString()}</td><td className="px-4 py-4 text-right text-lg">${Math.round(results.firstYearCashflow.afterTaxCashflow).toLocaleString()}</td></tr>
                  </tbody>
               </table>
            </div>
          </div>

          {/* 10-YEAR FORECAST TABLE */}
          <div className="bg-white rounded-[24px] p-6 border border-[#C6A672]/30 shadow-sm overflow-hidden">
            <h3 className="text-lg font-serif font-semibold text-[#064E2C] mb-4">10-Year High-Performance Forecast</h3>
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-[#064E2C] text-white">
                     <tr>
                        <th className="px-4 py-3 rounded-l-lg">Year</th>
                        <th className="px-4 py-3">Property Value</th>
                        <th className="px-4 py-3">Equity Pool</th>
                        <th className="px-4 py-3">Weekly Rent</th>
                        <th className="px-4 py-3">Pre-Tax CF</th>
                        <th className="px-4 py-3 text-right rounded-r-lg">Post-Tax CF</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.projections.slice(0, 11).map((p) => (
                      <tr key={p.year} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-400">{p.year === 0 ? 'ENTRY' : p.year}</td>
                        <td className="px-4 py-3 font-semibold">${Math.round(p.propertyValue).toLocaleString()}</td>
                        <td className="px-4 py-3 text-green-700 font-bold">${Math.round(p.equity).toLocaleString()}</td>
                        <td className="px-4 py-3 font-medium">${Math.round(p.weeklyRent).toLocaleString()}</td>
                        <td className={`px-4 py-3 font-bold ${p.netCashflow >= 0 ? 'text-green-600' : 'text-red-500'}`}>${Math.round(p.netCashflow).toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right font-bold ${p.afterTaxCashflow >= 0 ? 'text-green-600' : 'text-red-500'}`}>${Math.round(p.afterTaxCashflow).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
         <div className="p-6 bg-[#F9FAFB] text-[10px] text-gray-400 leading-relaxed italic border-t border-gray-200">{DISCLAIMER_TEXT}</div>
      </div>

      <footer className="mt-12 mb-8 py-8 border-t border-gray-200 flex flex-col items-center">
        <div className="flex items-center gap-4 mb-4 opacity-50">
           <span className="h-px w-8 bg-gray-300"></span>
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Homez Portfolio Intelligence</span>
           <span className="h-px w-8 bg-gray-300"></span>
        </div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest text-center">
          © {new Date().getFullYear()} Homez Buyers Advocacy. All Rights Reserved. 
          <br className="md:hidden" />
          <span className="hidden md:inline mx-2">•</span> 
          ABN 50 677 376 368
          <span className="hidden md:inline mx-2">•</span> 
          Engine: HWPE-STABLE-V2.2
        </p>
        <p className="text-[9px] text-gray-400 mt-3 text-center max-w-2xl px-4 leading-relaxed">
          The calculation methodologies used in this tool are proprietary trade secrets of Homez. Unauthorized access, harvesting, or replication of this system's logic constitutes intellectual property theft and will be pursued under international law.
        </p>
      </footer>

      {isModalOpen && <ShareModal onClose={() => setIsModalOpen(false)} onGenerate={generatePDF} isGenerating={isGenerating} isDispatching={isDispatching} dispatchError={dispatchError} />}
      <div className="fixed top-[-9999px] left-[-9999px]"><PrintReport inputs={inputs} results={results} clientDetails={clientDetails} /></div>
    </div>
  );
};

const KPITile: React.FC<{ label: string; value: string; subtext: string; highlight?: boolean }> = ({ label, value, subtext, highlight }) => (
  <div className="bg-white rounded-2xl p-4 border border-[#C6A672]/30 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:border-[#C6A672]/60">
    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</span>
    <span className={`text-lg font-serif font-bold ${highlight === true ? 'text-[#064E2C]' : highlight === false ? 'text-red-500' : 'text-[#0B090A]'}`}>{value}</span>
    <span className="text-[9px] text-[#C6A672] mt-1 font-medium">{subtext}</span>
  </div>
);

const TableRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"><td className="px-4 py-3 text-gray-600">{label}</td><td className="px-4 py-3 text-right font-medium">${Math.round(value).toLocaleString()}</td></tr>
);

interface ShareModalProps { onClose: () => void; onGenerate: (data: UserDetails) => Promise<string | null>; isGenerating: boolean; isDispatching: boolean; dispatchError: string | null; }

const ShareModal: React.FC<ShareModalProps> = ({ onClose, onGenerate, isGenerating, isDispatching, dispatchError }) => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const details: UserDetails = { name: `${formData.firstName} ${formData.lastName}`, email: formData.email, phone: formData.phone, goal: 'Investment' };
    await onGenerate(details);
    setIsDone(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white rounded-[32px] max-w-md w-full p-10 shadow-2xl relative border border-[#C6A672]/20">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-300 hover:text-gray-500">✕</button>
        {!isDone ? (
           <>
              <h3 className="text-3xl font-serif font-bold text-[#064E2C] mb-3 text-center">Secure High-Res Analysis</h3>
              <p className="text-center text-gray-400 text-sm mb-8">Generated via the Homez HWPE logic engine. Proprietary methodology, dispatched immediately.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                <input required placeholder="First Name" className="w-full rounded-full border border-gray-200 px-5 py-3 outline-none focus:ring-2 focus:ring-[#064E2C]/20" onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <input required placeholder="Last Name" className="w-full rounded-full border border-gray-200 px-5 py-3 outline-none focus:ring-2 focus:ring-[#064E2C]/20" onChange={e => setFormData({...formData, lastName: e.target.value})} />
               </div>
               <input required type="email" placeholder="Email Address" className="w-full rounded-full border border-gray-200 px-5 py-3 outline-none focus:ring-2 focus:ring-[#064E2C]/20" onChange={e => setFormData({...formData, email: e.target.value})} />
               <input required type="tel" placeholder="Mobile Number" className="w-full rounded-full border border-gray-200 px-5 py-3 outline-none focus:ring-2 focus:ring-[#064E2C]/20" onChange={e => setFormData({...formData, phone: e.target.value})} />
               <button type="submit" disabled={isGenerating} className="w-full mt-6 bg-[#064E2C] text-white font-bold py-4 rounded-full shadow-lg disabled:opacity-70 transition-all transform active:scale-95">
                 {isGenerating ? 'Encoding HWPE Logic...' : 'Generate Secure Report'}
               </button>
              </form>
           </>
        ) : (
           <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-[#064E2C] border border-green-200">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#064E2C]">Transmission Complete</h3>
              <div className="text-gray-500 text-sm space-y-3 leading-relaxed">
                <p>Your proprietary property strategy report has been generated and downloaded.</p>
                <p className="text-xs">Subject to Homez IP Protection Terms.</p>
              </div>
              <button onClick={onClose} className="block w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-full hover:bg-gray-200">Close</button>
           </div>
        )}
      </div>
    </div>
  );
};

const PrintReport: React.FC<{ inputs: InputState, results: CalculationResult, clientDetails: UserDetails | null }> = ({ inputs, results, clientDetails }) => (
  <div className="bg-white">
      <div id="print-page-1" className="w-[800px] h-[1132px] bg-white p-16 font-sans text-gray-800 flex flex-col relative overflow-hidden">
         {/* Print Watermark Layer */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] rotate-[-45deg] pointer-events-none select-none text-9xl font-black uppercase whitespace-nowrap text-[#064E2C]">
            PROPRIETARY HOMEZ ENGINE • HWPE V2.2 • PROPRIETARY HOMEZ ENGINE
         </div>
         <div className="border-b-[4px] border-[#064E2C] pb-10 flex justify-between items-end mb-12">
            <div><h1 className="text-4xl font-serif font-bold text-[#064E2C] leading-none mb-2">Homez Buyers Advocacy</h1><p className="text-[#C6A672] font-semibold text-sm tracking-widest uppercase">Proprietary Strategy Performance Report</p></div>
            <div className="text-right text-[10px] text-gray-400 font-bold"><p className="text-[#064E2C] mb-1">{new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p><p>SECURE DOCUMENT: HWPE-STABLE</p></div>
         </div>
         <div className="grid grid-cols-2 gap-12 mb-12">
            <div><h3 className="text-[10px] font-bold text-[#C6A672] uppercase tracking-[0.2em] mb-4">Client Information</h3><div className="bg-[#FFFCED]/30 p-6 rounded-3xl border border-[#C6A672]/10"><p className="text-xl font-serif font-bold text-[#064E2C]">{clientDetails?.name || 'Valued Client'}</p><p className="text-sm text-gray-500 mt-2">{clientDetails?.email}</p><p className="text-sm text-gray-500">{clientDetails?.phone}</p></div></div>
            <div><h3 className="text-[10px] font-bold text-[#C6A672] uppercase tracking-[0.2em] mb-4">Portfolio Target</h3><div className="bg-[#FFFCED]/30 p-6 rounded-3xl border border-[#C6A672]/10"><p className="text-xl font-serif font-bold text-[#064E2C]">{inputs.propertyAddress || 'Confidential Address'}</p><p className="text-sm text-gray-500 mt-2">{inputs.state} • Allocation: ${inputs.purchasePrice.toLocaleString()}</p></div></div>
         </div>
         <div className="bg-[#064E2C] p-10 rounded-[40px] shadow-2xl mb-12 relative overflow-hidden text-white">
           <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-[0.3em] mb-8 text-center">HWPE Model Output (Year 0)</h3>
           <div className="grid grid-cols-5 gap-4">
             <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-center"><p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-2">Net Yield</p><p className="text-2xl font-serif font-bold">{((results.firstYearCashflow.effectiveGrossRent / inputs.purchasePrice) * 100).toFixed(2)}%</p></div>
             <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-center"><p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-2">Post-Tax (Wk)</p><p className="text-2xl font-serif font-bold">${Math.round(results.firstYearCashflow.afterTaxCashflow / 52).toLocaleString()}</p></div>
             <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-center"><p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-2">Pre-Tax (Wk)</p><p className="text-2xl font-serif font-bold">${Math.round(results.firstYearCashflow.netCashflow / 52).toLocaleString()}</p></div>
             <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-center"><p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-2">ATO Benefit</p><p className="text-2xl font-serif font-bold">${Math.round(results.firstYearCashflow.taxRefund).toLocaleString()}</p></div>
             <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-center"><p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-2">Cap. Required</p><p className="text-2xl font-serif font-bold">${(results.upfrontCostsTotal + inputs.purchasePrice * (inputs.depositPercent / 100)).toLocaleString()}</p></div>
           </div>
         </div>
         <div className="mt-auto pt-10 text-[9px] text-gray-300 italic border-t border-gray-100 flex justify-between uppercase tracking-widest"><div>© Homez Buyers Advocacy • Proprietary IP Protected Analysis</div><div>Page 01 // 02</div></div>
      </div>
      <div id="print-page-2" className="w-[800px] h-[1132px] bg-white p-16 font-sans text-gray-800 flex flex-col relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] rotate-[-45deg] pointer-events-none select-none text-9xl font-black uppercase whitespace-nowrap text-[#064E2C]">
            PROPRIETARY HOMEZ ENGINE • HWPE V2.2 • PROPRIETARY HOMEZ ENGINE
         </div>
         <div className="border-b-[4px] border-[#C6A672] pb-8 flex justify-between items-end mb-10"><h2 className="text-3xl font-serif font-bold text-[#064E2C]">Portfolio Wealth Scaling</h2><div className="text-right text-[10px] text-gray-400 font-bold tracking-[0.3em]">30-YEAR LOGIC PROJECTION</div></div>
         <div className="mb-12 p-8 bg-[#FFFCED]/10 rounded-[40px] border border-[#C6A672]/20"><ProjectionChart data={results.projections} positiveCashflowYear={results.positiveCashflowAfterTaxYear} isPrintMode={true} /></div>
         <div className="flex-1"><h3 className="text-[10px] font-bold text-[#C6A672] uppercase tracking-[0.2em] mb-6">Confidential Portfolio Matrix</h3><div className="overflow-hidden rounded-[32px] border border-gray-100 shadow-sm"><table className="w-full text-[11px] text-left leading-normal"><thead className="bg-[#064E2C] text-white"><tr><th className="px-6 py-4 font-bold uppercase tracking-widest">Year</th><th className="px-6 py-4 font-bold uppercase tracking-widest">Asset Value</th><th className="px-6 py-4 font-bold uppercase tracking-widest">Equity Accum.</th><th className="px-6 py-4 font-bold uppercase tracking-widest">Pre-Tax CF</th><th className="px-6 py-4 text-right font-bold pr-8 uppercase tracking-widest">Net Cash (Post-Tax)</th></tr></thead><tbody className="divide-y divide-gray-100">{results.projections.slice(0, 11).map((p, idx) => (<tr key={p.year} className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}><td className="px-6 py-4 font-bold text-[#C6A672]">{p.year === 0 ? 'ENTRY' : `YR ${p.year}`}</td><td className="px-6 py-4 font-bold text-gray-900">${Math.round(p.propertyValue).toLocaleString()}</td><td className="px-6 py-4 font-bold text-green-700">${Math.round(p.equity).toLocaleString()}</td><td className={`px-6 py-4 font-bold ${p.netCashflow >= 0 ? 'text-green-600' : 'text-red-400'}`}>${Math.round(p.netCashflow).toLocaleString()}</td><td className={`px-6 py-4 text-right font-black pr-8 ${p.afterTaxCashflow >= 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>${Math.round(p.afterTaxCashflow).toLocaleString()}</td></tr>))}</tbody></table></div></div>
         <div className="mt-12 p-8 bg-gray-50 rounded-[32px] border border-gray-100"><h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 italic">Calculated Basis & Proprietary Methodology</h3><div className="text-[7.5px] text-gray-400 leading-relaxed font-medium">{DISCLAIMER_TEXT}</div></div>
         <div className="mt-8 pt-8 text-[9px] text-gray-300 italic border-t border-gray-100 flex justify-between uppercase tracking-widest"><div>© Homez Buyers Advocacy • High Fidelity Portfolio Engine</div><div>Page 02 // 02</div></div>
      </div>
  </div>
);

export default App;