import React, { useState, useEffect } from 'react';
import { DEFAULT_INPUTS, VERSION } from './constants';
import { InputState, AustralianState, CalculationResult, UserDetails, DepreciationLevel } from './types';
import { calculateProjections, estimateStampDuty, runDiagnostics } from './utils/calculations';
import { InputGroup, NumberInput, SelectInput, TextInput } from './components/InputGroup';
import ProjectionChart from './components/ProjectionChart';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from 'jspdf';

const FAQ_DATA = [
  {
    question: "How does the HWPE Engine calculate cashflow?",
    answer: "The Homez Wealth Projection Engine (HWPE) simulates 30 years of ownership by indexing rental growth against local market vacancy rates and variable holding costs. It specifically accounts for the 2024-25 Stage 3 tax changes to provide a highly accurate post-tax 'realized' income figure."
  },
  {
    question: "Is stamp duty calculated automatically?",
    answer: "Yes. Our engine contains state-specific statutory tables for NSW, VIC, QLD, WA, SA, TAS, NT, and ACT. It updates in real-time as you adjust the purchase price to ensure your upfront capital requirement estimates are precise."
  },
  {
    question: "What is the difference between Pre-Tax and Post-Tax cashflow?",
    answer: "Pre-tax cashflow is your raw 'rental income minus expenses'. Post-tax cashflow (Realized Yield) includes your potential ATO tax refund derived from interest expense deductions and non-cash depreciation benefits, giving you the true 'cash in pocket' figure."
  },
  {
    question: "How are capital growth projections determined?",
    answer: "While we allow users to input their own growth assumptions, the engine defaults to a conservative 6% p.a. compound growth rate, reflecting historical long-term averages for high-performance Australian metro residential markets."
  }
];

const COMPREHENSIVE_DISCLAIMER = (
  <section className="mt-16 p-10 bg-[#064E2C]/5 rounded-[40px] border border-[#064E2C]/10 text-gray-500 w-full no-print">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
      <div className="md:col-span-2">
        <h3 className="text-[11px] font-black text-[#C6A672] uppercase tracking-[0.2em] mb-6 border-b border-[#C6A672]/20 pb-2 inline-block">Important Information & Legal Disclaimer</h3>
        <div className="text-[11px] leading-relaxed space-y-4 pr-6 opacity-80">
          <p><strong>Modeling Tool Only:</strong> This calculator is a modeling tool provided for illustrative purposes only and does not constitute financial, legal, or tax advice. Results are estimates based on the inputs you provide and do not take into account your personal financial circumstances, objectives, or needs. This proprietary HWPE Engine ({VERSION}) is provided by Homez Buyers Advocacy.</p>
          <p><strong>Taxation & Stage 3:</strong> Calculations are based on the 2024-25 Australian Federal Tax Brackets (Stage 3). Tax offsets assume property losses are fully deductible against your provided salary; individual eligibility and results may vary.</p>
          <p><strong>Depreciation:</strong> Estimates are general benchmarks based on property age and type. For exact figures and statutory tax claims, a professional Quantity Surveyor report is required.</p>
          <p><strong>Limitation of Liability:</strong> Homez Buyers Advocacy, its directors, and employees accept no liability for any errors, omissions, or decisions made based on this tool. Users must consult with qualified financial, tax, and legal professionals before making investment decisions.</p>
        </div>
      </div>
      <div className="md:border-l border-gray-200 md:pl-12 flex flex-col justify-center items-center text-center">
        <div className="opacity-60 mb-4 font-serif text-xl font-bold text-[#064E2C]">Homez Buyers Advocacy</div>
        <p className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">
          © {new Date().getFullYear()} Homez Buyers Advocacy
        </p>
        <p className="text-[10px] mt-2 text-[#C6A672] font-semibold">ABN 50 677 376 368</p>
        <div className="mt-6 pt-6 border-t border-gray-100 w-full">
           <p className="text-[10px] text-gray-400 italic font-medium leading-tight uppercase tracking-tighter">Proprietary Growth & Cashflow Analysis Engine for Australian Property Portfolios.</p>
        </div>
      </div>
    </div>
  </section>
);

const App: React.FC = () => {
  const [inputs, setInputs] = useState<InputState>(() => ({
    ...DEFAULT_INPUTS,
    stampDuty: estimateStampDuty(DEFAULT_INPUTS.state, DEFAULT_INPUTS.purchasePrice)
  }));
  
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAfterTax, setShowAfterTax] = useState(true);
  const [clientDetails, setClientDetails] = useState<UserDetails | null>(null);
  const [isFaqVisible, setIsFaqVisible] = useState(false);

  useEffect(() => {
    const calcResults = calculateProjections(inputs);
    setResults(calcResults);
    runDiagnostics(inputs);
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

  const generatePDF = async (userDetails: UserDetails): Promise<boolean> => {
    setClientDetails(userDetails);
    setIsGenerating(true);
    
    // Allow React to render the print view with new details before capturing
    await new Promise(resolve => setTimeout(resolve, 500));

    const page1Element = document.getElementById('print-page-1');
    const page2Element = document.getElementById('print-page-2');
    const page3Element = document.getElementById('print-page-3');

    if (page1Element && page2Element && page3Element) {
      try {
        const pdf = new jsPDF('p', 'mm', 'a4', true); // 'true' enables compression
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Page 1
        const canvas1 = await html2canvas(page1Element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        // Use JPEG with 0.75 quality to reduce size (Crucial for Vercel 4.5MB limit)
        pdf.addImage(canvas1.toDataURL('image/jpeg', 0.75), 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        // Page 2
        pdf.addPage();
        const canvas2 = await html2canvas(page2Element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        pdf.addImage(canvas2.toDataURL('image/jpeg', 0.75), 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        // Page 3
        pdf.addPage();
        const canvas3 = await html2canvas(page3Element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        pdf.addImage(canvas3.toDataURL('image/jpeg', 0.75), 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        const fileName = `Homez_Proprietary_Analysis_${userDetails.name.replace(/\s+/g, '_')}.pdf`;
        
        // Local user download
        pdf.save(fileName);

        // Convert to Base64 for Resend API dispatch
        const pdfBase64 = pdf.output('datauristring').split(',')[1];

        // Automated dispatch to Homez Admin + Client via Resend
        const emailResponse = await fetch('/api/send-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: userDetails.email,
            userName: userDetails.name,
            pdfBase64: pdfBase64,
            fileName: fileName
          }),
        });

        if (!emailResponse.ok) {
           const errText = await emailResponse.text();
           console.error("Email API Error:", errText);
           alert(`System Alert: Email dispatch failed. Please check internet connection or try again later.\n\nError: ${errText.substring(0, 100)}`);
        } else {
           // Success Alert
           // We do nothing here as the UI updates to 'Strategy Released' view
        }
        
        setIsGenerating(false);
        return true;
      } catch (error) {
        console.error("Critical: Engine Dispatch Failure", error);
        alert("System Critical: Report generation failed. Please contact support.");
        setIsGenerating(false);
        return false;
      }
    }
    setIsGenerating(false);
    return false;
  };

  if (!results) return null;

  const depositAmount = inputs.purchasePrice * (inputs.depositPercent / 100);
  const totalCashRequired = results.upfrontCostsTotal + depositAmount;

  return (
    <div className="min-h-screen bg-[#FFFCED] p-4 md:p-8 lg:p-12 max-w-[1440px] mx-auto relative flex flex-col antialiased">
      <header className="mb-12 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[#C6A672]/20 pb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#064E2C]">Homez</h1>
            <div className="h-8 w-[1px] bg-[#C6A672]/30 hidden md:block" />
            <span className="text-[10px] bg-[#064E2C] text-white px-3 py-1 rounded-full font-black tracking-widest uppercase">Engine {VERSION}</span>
          </div>
          <h2 className="text-lg md:text-xl font-medium text-[#C6A672] font-sans tracking-tight">Proprietary Wealth Projection & Growth Analysis</h2>
        </div>
        <div className="flex items-center gap-4 no-print">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-[#064E2C] uppercase tracking-widest mb-1">Status: Secure</span>
                <span className="px-4 py-1.5 bg-[#064E2C]/5 text-[#064E2C] text-[10px] font-bold rounded-full border border-[#064E2C]/10 uppercase tracking-widest">24-25 Tax Year Compliant</span>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="px-10 py-5 rounded-full font-bold bg-[#064E2C] text-white shadow-2xl hover:bg-[#053d22] transition-all transform hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-widest">
              Download Report
            </button>
        </div>
      </header>

      <div id="main-calculator" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* LEFT COLUMN: INPUTS (ORDER 1 on Mobile) */}
        <div className="lg:col-span-4 space-y-10 order-1">
          <section className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(198,166,114,0.1)] border border-[#C6A672]/20">
            <h2 className="text-[14px] font-black text-[#C6A672] uppercase tracking-[0.2em] mb-8 border-b border-[#C6A672]/10 pb-3">PROPERTY DETAILS</h2>
            <InputGroup label="Address (Optional)"><TextInput placeholder="e.g. 123 Smith St, Sydney" value={inputs.propertyAddress || ''} onChange={(e) => handleInputChange('propertyAddress', e.target.value)} /></InputGroup>
            <div className="grid grid-cols-2 gap-6">
              <InputGroup label="Purchase Price"><NumberInput prefix="$" value={inputs.purchasePrice} onChange={(e) => handlePropertyChange('purchasePrice', Number(e.target.value))} /></InputGroup>
              <InputGroup label="State">
                <SelectInput value={inputs.state} onChange={(e) => handlePropertyChange('state', e.target.value as AustralianState)}>
                  {Object.values(AustralianState).map(s => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </InputGroup>
            </div>
          </section>

          <section className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(198,166,114,0.1)] border border-[#C6A672]/20">
             <h2 className="text-[14px] font-black text-[#C6A672] uppercase tracking-[0.2em] mb-8 border-b border-[#C6A672]/10 pb-3">ACQUISITION COSTS</h2>
             <InputGroup label="Stamp Duty" subLabel="(HWPE System)"><NumberInput prefix="$" value={inputs.stampDuty} onChange={(e) => handleInputChange('stampDuty', Number(e.target.value))} /></InputGroup>
             <div className="grid grid-cols-2 gap-6">
                <InputGroup label="Buyer's Agent"><NumberInput prefix="$" value={inputs.buyersAgentFee} onChange={(e) => handleInputChange('buyersAgentFee', Number(e.target.value))} /></InputGroup>
                <InputGroup label="Solicitor Fee"><NumberInput prefix="$" value={inputs.solicitorFee} onChange={(e) => handleInputChange('solicitorFee', Number(e.target.value))} /></InputGroup>
             </div>
             <div className="grid grid-cols-2 gap-6">
                <InputGroup label="Build & Pest"><NumberInput prefix="$" value={inputs.buildingPestFee} onChange={(e) => handleInputChange('buildingPestFee', Number(e.target.value))} /></InputGroup>
                <InputGroup label="Misc Costs"><NumberInput prefix="$" value={inputs.otherUpfront} onChange={(e) => handleInputChange('otherUpfront', Number(e.target.value))} /></InputGroup>
             </div>
          </section>

          <section className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(198,166,114,0.1)] border border-[#C6A672]/20">
            <h2 className="text-[14px] font-black text-[#C6A672] uppercase tracking-[0.2em] mb-8 border-b border-[#C6A672]/10 pb-3">FINANCE STRATEGY</h2>
            <div className="grid grid-cols-2 gap-6">
              <InputGroup label="Deposit %"><NumberInput suffix="%" value={inputs.depositPercent} onChange={(e) => handleInputChange('depositPercent', Number(e.target.value))} /></InputGroup>
              <InputGroup label="Rate %"><NumberInput suffix="%" value={inputs.interestRate} onChange={(e) => handleInputChange('interestRate', Number(e.target.value))} /></InputGroup>
            </div>
            <div className="flex items-center justify-between py-5 border-t border-b border-gray-100 my-6">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">Interest Only Strategy</span>
                <span className="text-[10px] text-[#C6A672] font-semibold uppercase tracking-wider">Cashflow Optimization</span>
              </div>
              <button onClick={() => handleInputChange('isInterestOnly', !inputs.isInterestOnly)} className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inputs.isInterestOnly ? 'bg-[#064E2C]' : 'bg-gray-200'}`}><span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${inputs.isInterestOnly ? 'translate-x-5' : 'translate-x-0'}`} /></button>
            </div>
            <div className="grid grid-cols-2 gap-6">
               {inputs.isInterestOnly && (
                  <InputGroup label="IO Period (Yrs)"><NumberInput value={inputs.interestOnlyYears} onChange={(e) => handleInputChange('interestOnlyYears', Number(e.target.value))} /></InputGroup>
               )}
               <InputGroup label="Loan Term (Yrs)" className={!inputs.isInterestOnly ? "col-span-2" : ""}><NumberInput value={inputs.loanTermYears} onChange={(e) => handleInputChange('loanTermYears', Number(e.target.value))} /></InputGroup>
            </div>
          </section>

          <section className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(198,166,114,0.1)] border border-[#C6A672]/20">
            <h2 className="text-[14px] font-black text-[#C6A672] uppercase tracking-[0.2em] mb-8 border-b border-[#C6A672]/10 pb-3">INCOME & EXPENSES</h2>
            <div className="grid grid-cols-2 gap-6">
              <InputGroup label="Weekly Rent"><NumberInput prefix="$" value={inputs.weeklyRent} onChange={(e) => handleInputChange('weeklyRent', Number(e.target.value))} /></InputGroup>
              <InputGroup label="Vacancy (Wks)"><NumberInput value={inputs.vacancyWeeks} onChange={(e) => handleInputChange('vacancyWeeks', Number(e.target.value))} /></InputGroup>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100">
               <h3 className="text-[11px] font-black text-[#C6A672] uppercase tracking-widest mb-6 underline underline-offset-4 decoration-[#C6A672]/20">OPERATING EXPENSES (ANNUAL)</h3>
               <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                 <InputGroup label="Mgmt Fee %"><NumberInput suffix="%" value={inputs.managementFeePercent} onChange={(e) => handleInputChange('managementFeePercent', Number(e.target.value))} /></InputGroup>
                 <InputGroup label="Council Rates"><NumberInput prefix="$" value={inputs.councilRates} onChange={(e) => handleInputChange('councilRates', Number(e.target.value))} /></InputGroup>
                 <InputGroup label="Insurance"><NumberInput prefix="$" value={inputs.insurance} onChange={(e) => handleInputChange('insurance', Number(e.target.value))} /></InputGroup>
                 <InputGroup label="Maintenance"><NumberInput prefix="$" value={inputs.repairsMaintenance} onChange={(e) => handleInputChange('repairsMaintenance', Number(e.target.value))} /></InputGroup>
                 <InputGroup label="Body Corp"><NumberInput prefix="$" value={inputs.bodyCorp} onChange={(e) => handleInputChange('bodyCorp', Number(e.target.value))} /></InputGroup>
                 <InputGroup label="Misc Expenses"><NumberInput prefix="$" value={inputs.otherExpenses} onChange={(e) => handleInputChange('otherExpenses', Number(e.target.value))} /></InputGroup>
               </div>
            </div>
          </section>

          <section className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgba(198,166,114,0.1)] border border-[#C6A672]/20">
             <h2 className="text-[14px] font-black text-[#C6A672] uppercase tracking-[0.2em] mb-8 border-b border-[#C6A672]/10 pb-3">TAX & GROWTH INDEX</h2>
             <InputGroup label="Annual Salary (Gross)" subLabel={`Marginal Rate: ${(results.marginalTaxRate * 100).toFixed(0)}%`}>
               <NumberInput prefix="$" value={inputs.annualSalary} onChange={(e) => handleInputChange('annualSalary', Number(e.target.value))} />
             </InputGroup>
             <InputGroup label="Depreciation Strategy">
                <SelectInput value={inputs.depreciationLevel} onChange={(e) => handleInputChange('depreciationLevel', e.target.value as DepreciationLevel)}>
                   {Object.values(DepreciationLevel).map(l => <option key={l} value={l}>{l}</option>)}
                </SelectInput>
             </InputGroup>
             {inputs.depreciationLevel === DepreciationLevel.Manual && (
               <InputGroup label="Manual Depreciation (Year 1)">
                 <NumberInput prefix="$" value={inputs.manualDepreciation} onChange={(e) => handleInputChange('manualDepreciation', Number(e.target.value))} />
               </InputGroup>
             )}
             <div className="grid grid-cols-2 gap-6">
              <InputGroup label="Cap. Growth %"><NumberInput suffix="%" value={inputs.capitalGrowthPercent} onChange={(e) => handleInputChange('capitalGrowthPercent', Number(e.target.value))} className="bg-green-50/50" /></InputGroup>
              <InputGroup label="Rent Growth %"><NumberInput suffix="%" value={inputs.rentalGrowthPercent} onChange={(e) => handleInputChange('rentalGrowthPercent', Number(e.target.value))} className="bg-orange-50/50" /></InputGroup>
             </div>
          </section>
          
          <div className="flex gap-4 no-print sticky bottom-8 pt-4 z-10">
             <button onClick={resetDefaults} className="flex-1 py-5 rounded-full text-xs font-bold border-2 border-gray-100 text-gray-400 bg-white hover:border-[#C6A672]/30 hover:text-gray-600 transition-all uppercase tracking-widest">Reset</button>
             <button onClick={() => setIsModalOpen(true)} className="flex-[2] py-5 rounded-full text-xs font-bold bg-[#064E2C] text-white hover:bg-[#053d22] transition-all shadow-2xl shadow-green-900/40 uppercase tracking-widest">Download Full Report</button>
          </div>
        </div>

        {/* RIGHT COLUMN: RESULTS (ORDER 2 on Mobile) */}
        <div className="lg:col-span-8 space-y-10 order-2 lg:sticky lg:top-8">
          {/* Summary Performance Section */}
          <section className="bg-white rounded-[40px] p-10 shadow-[0_8px_40px_rgba(6,78,44,0.08)] border border-[#064E2C]/5 overflow-hidden proprietary-watermark">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
              <div>
                <h2 className="text-3xl font-serif font-bold text-[#064E2C] mb-1 tracking-tight uppercase">PERFORMANCE SNAPSHOT</h2>
                <p className="text-[#C6A672] text-[11px] font-black uppercase tracking-[0.25em]">High Fidelity Yield Analysis</p>
              </div>
              <div className="flex bg-[#F9FAFB] rounded-full p-1.5 border border-gray-100 no-print">
                   <button onClick={() => setShowAfterTax(false)} className={`px-8 py-3 rounded-full text-[10px] font-bold transition-all uppercase tracking-[0.2em] ${!showAfterTax ? 'bg-[#C6A672] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>Pre-Tax</button>
                   <button onClick={() => setShowAfterTax(true)} className={`px-8 py-3 rounded-full text-[10px] font-bold transition-all uppercase tracking-[0.2em] ${showAfterTax ? 'bg-[#064E2C] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>Post-Tax</button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
              <KPITile label="Gross Yield" value={`${((results.firstYearCashflow.effectiveGrossRent / inputs.purchasePrice) * 100).toFixed(2)}%`} subtext="Annualized" />
              <KPITile label={showAfterTax ? "Post-Tax (Wk)" : "Pre-Tax (Wk)"} value={`$${Math.round((showAfterTax ? results.firstYearCashflow.afterTaxCashflow : results.firstYearCashflow.netCashflow) / 52).toLocaleString()}`} subtext="Weekly Surplus" highlight={(showAfterTax ? results.firstYearCashflow.afterTaxCashflow : results.firstYearCashflow.netCashflow) > 0} />
              <KPITile label={showAfterTax ? "Post-Tax (Mth)" : "Pre-Tax (Mth)"} value={`$${Math.round((showAfterTax ? results.firstYearCashflow.afterTaxCashflow : results.firstYearCashflow.netCashflow) / 12).toLocaleString()}`} subtext="Monthly Surplus" highlight={(showAfterTax ? results.firstYearCashflow.afterTaxCashflow : results.firstYearCashflow.netCashflow) > 0} />
              <KPITile label="Tax Recovery" value={`$${Math.round(results.firstYearCashflow.taxRefund).toLocaleString()}`} subtext="Est. Year 0" />
              <KPITile label="Entry Capital" value={`$${Math.round(totalCashRequired).toLocaleString()}`} subtext="Total Upfront" />
            </div>

            <div className="border-t border-gray-50 pt-10">
                <ProjectionChart data={results.projections} positiveCashflowYear={showAfterTax ? results.positiveCashflowAfterTaxYear : results.positiveCashflowYear} />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-10">
            {/* CASHFLOW & TAX PROJECTION */}
            <section className="bg-white rounded-[32px] p-8 border border-[#C6A672]/20 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-6">
                <h3 className="text-xl font-serif font-bold text-[#064E2C] uppercase tracking-tight">CASHFLOW & TAX PROJECTION (YEAR 0)</h3>
                <div className="text-[10px] font-bold text-[#C6A672] px-4 py-1.5 bg-[#FFFCED] rounded-full border border-[#C6A672]/10 uppercase tracking-widest">{showAfterTax ? 'CONSOLIDATED POSITION' : 'OPERATIONAL ONLY'}</div>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left leading-relaxed">
                    <thead className="bg-[#064E2C]/5 text-[#064E2C]"><tr><th className="px-6 py-4 rounded-l-2xl uppercase text-[10px] font-black tracking-widest">REVENUE & EXPENSES</th><th className="px-6 py-4 text-right uppercase text-[10px] font-black tracking-widest">MONTHLY</th><th className="px-6 py-4 text-right rounded-r-2xl uppercase text-[10px] font-black tracking-widest">ANNUAL</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        <tr className="hover:bg-gray-50/50 transition-colors"><td className="px-6 py-5 text-gray-800 font-medium">Effective Gross Rent</td><td className="px-6 py-5 text-right font-medium text-gray-500">${Math.round(results.firstYearCashflow.effectiveGrossRent / 12).toLocaleString()}</td><td className="px-6 py-5 text-right font-bold text-gray-900">${Math.round(results.firstYearCashflow.effectiveGrossRent).toLocaleString()}</td></tr>
                        <tr className="hover:bg-gray-50/50 transition-colors text-gray-500"><td className="px-6 py-4 pl-10 text-xs italic">Less: Total Mortgage (P&I / IO)</td><td className="px-6 py-4 text-right">-${Math.round(results.firstYearCashflow.mortgageRepayments / 12).toLocaleString()}</td><td className="px-6 py-4 text-right">-${Math.round(results.firstYearCashflow.mortgageRepayments).toLocaleString()}</td></tr>
                        <tr className="hover:bg-gray-50/50 transition-colors text-gray-500"><td className="px-6 py-4 pl-10 text-xs italic">Less: Operating & Management</td><td className="px-6 py-4 text-right">-${Math.round((results.firstYearCashflow.managementFees + results.firstYearCashflow.otherOperatingExpenses) / 12).toLocaleString()}</td><td className="px-6 py-4 text-right">-${Math.round(results.firstYearCashflow.managementFees + results.firstYearCashflow.otherOperatingExpenses).toLocaleString()}</td></tr>
                        <tr className="bg-gray-50/80 font-bold"><td className="px-6 py-6 text-[#064E2C] uppercase text-[11px] tracking-widest">NET OPERATIONAL CASHFLOW (PRE-TAX)</td><td className={`px-6 py-6 text-right ${results.firstYearCashflow.netCashflow > 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>${Math.round(results.firstYearCashflow.netCashflow / 12).toLocaleString()}</td><td className={`px-6 py-6 text-right ${results.firstYearCashflow.netCashflow > 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>${Math.round(results.firstYearCashflow.netCashflow).toLocaleString()}</td></tr>
                        <tr className="text-[#C6A672]"><td className="px-6 py-4 text-xs italic">Non-Cash: Depreciation (Paper Loss)</td><td className="px-6 py-4 text-right">-${Math.round(results.firstYearCashflow.depreciation / 12).toLocaleString()}</td><td className="px-6 py-4 text-right">-${Math.round(results.firstYearCashflow.depreciation).toLocaleString()}</td></tr>
                        <tr className="bg-[#064E2C]/5 font-bold text-[#064E2C]"><td className="px-6 py-5 uppercase text-[11px] tracking-widest">ATO Taxation Recovery Estimate</td><td className="px-6 py-5 text-right">${Math.round(results.firstYearCashflow.taxRefund / 12).toLocaleString()}</td><td className="px-6 py-5 text-right">${Math.round(results.firstYearCashflow.taxRefund).toLocaleString()}</td></tr>
                        <tr className="bg-[#064E2C] text-white font-bold">
                            <td className="px-6 py-6 rounded-bl-2xl text-lg font-serif uppercase">NET OPERATIONAL CASHFLOW (POST-TAX)</td>
                            <td className="px-6 py-6 text-right text-lg font-serif">${Math.round(results.firstYearCashflow.afterTaxCashflow / 12).toLocaleString()}</td>
                            <td className="px-6 py-6 text-right text-lg font-serif rounded-br-2xl">${Math.round(results.firstYearCashflow.afterTaxCashflow).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
                </div>
            </section>

            {/* 10 YEAR SCALING FORECAST */}
            <section className="bg-white rounded-[32px] p-8 border border-[#C6A672]/20 shadow-sm overflow-hidden">
                <h3 className="text-xl font-serif font-bold text-[#064E2C] mb-8 border-b border-gray-50 pb-6 uppercase tracking-tight">10 YEAR SCALING FORECAST</h3>
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#064E2C] text-white">
                        <tr>
                            <th className="px-6 py-4 rounded-l-2xl uppercase text-[10px] font-black tracking-widest">YEAR</th>
                            <th className="px-6 py-4 uppercase text-[10px] font-black tracking-widest">ASSET VALUE</th>
                            <th className="px-6 py-4 uppercase text-[10px] font-black tracking-widest">WEEKLY RENT</th>
                            <th className="px-6 py-4 uppercase text-[10px] font-black tracking-widest">EQUITY</th>
                            <th className="px-6 py-4 uppercase text-[10px] font-black tracking-widest">PRE-TAX CF</th>
                            <th className="px-6 py-4 text-right rounded-r-2xl uppercase text-[10px] font-black tracking-widest">POST-TAX CF</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {results.projections.slice(0, 11).map((p) => (
                        <tr key={p.year} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-[#C6A672]">{p.year === 0 ? 'ENTRY' : `YR ${p.year}`}</td>
                            <td className="px-6 py-4 font-bold text-gray-900">${Math.round(p.propertyValue).toLocaleString()}</td>
                            <td className="px-6 py-4 font-medium text-gray-600">${Math.round(p.weeklyRent).toLocaleString()}</td>
                            <td className="px-6 py-4 text-green-700 font-black">${Math.round(p.equity).toLocaleString()}</td>
                            <td className={`px-6 py-4 font-bold ${p.netCashflow >= 0 ? 'text-green-600' : 'text-red-400'}`}>${Math.round(p.netCashflow).toLocaleString()}</td>
                            <td className={`px-6 py-4 text-right font-black ${p.afterTaxCashflow >= 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>${Math.round(p.afterTaxCashflow).toLocaleString()}</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
                </div>
                <div className="mt-6 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <span>* CF = Annual Net Cash Flow Position</span>
                    <span className="italic">HWPE Predictive Logic Engine {VERSION}</span>
                </div>
            </section>
          </div>
        </div>
      </div>

      <section className="w-full mt-24 bg-white rounded-[40px] border border-[#C6A672]/20 overflow-hidden shadow-sm no-print">
        <button 
          onClick={() => setIsFaqVisible(!isFaqVisible)}
          className="w-full flex justify-between items-center p-12 text-left hover:bg-gray-50/50 transition-all focus:outline-none"
        >
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-serif font-bold text-[#064E2C] uppercase tracking-tight">HWPE STRATEGY INSIGHTS</h2>
            <div className="h-6 w-[1px] bg-[#C6A672]/30" />
            <span className="text-[10px] font-black text-[#C6A672] px-4 py-1.5 bg-[#FFFCED] rounded-full uppercase tracking-widest border border-[#C6A672]/10">Investor Knowledge Hub</span>
          </div>
          <div className={`w-10 h-10 rounded-full border border-[#C6A672]/30 flex items-center justify-center transition-transform duration-500 ${isFaqVisible ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4 text-[#C6A672]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </button>
        <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isFaqVisible ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100 border-t border-gray-100">
            {FAQ_DATA.map((faq, idx) => (
              <div key={idx} className="p-12 bg-white hover:bg-gray-50/30 transition-all group">
                <h3 className="font-serif text-xl font-bold text-[#064E2C] mb-4 group-hover:text-[#C6A672] transition-colors">{faq.question}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {COMPREHENSIVE_DISCLAIMER}

      {isModalOpen && <ShareModal onClose={() => setIsModalOpen(false)} onGenerate={generatePDF} isGenerating={isGenerating} />}
      <div className="fixed top-[-9999px] left-[-9999px]"><PrintReport inputs={inputs} results={results} clientDetails={clientDetails} /></div>
    </div>
  );
};

const KPITile: React.FC<{ label: string; value: string; subtext: string; highlight?: boolean }> = ({ label, value, subtext, highlight }) => (
  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center transition-all hover:shadow-xl hover:border-[#C6A672]/40 hover:-translate-y-1">
    <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 uppercase">{label}</span>
    <span className={`text-2xl font-serif font-bold mb-1 ${highlight === true ? 'text-[#064E2C]' : highlight === false ? 'text-red-500' : 'text-[#0B090A]'}`}>{value}</span>
    <span className="text-[10px] text-[#C6A672] font-black uppercase tracking-widest uppercase">{subtext}</span>
  </div>
);

const PrintTile: React.FC<{ label: string; value: string; subtext: string; highlight?: boolean }> = ({ label, value, subtext, highlight }) => (
    <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-gray-100 flex flex-col items-center justify-center text-center h-[140px]">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{label}</span>
      <span className={`text-2xl font-serif font-bold mb-1 ${highlight === true ? 'text-[#064E2C]' : highlight === false ? 'text-red-500' : 'text-[#0B090A]'}`}>{value}</span>
      <span className="text-[8px] text-[#C6A672] font-black uppercase tracking-widest">{subtext}</span>
    </div>
);

interface ShareModalProps { onClose: () => void; onGenerate: (data: UserDetails) => Promise<boolean>; isGenerating: boolean; }

const ShareModal: React.FC<ShareModalProps> = ({ onClose, onGenerate, isGenerating }) => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const details: UserDetails = { name: `${formData.firstName} ${formData.lastName}`, email: formData.email, phone: formData.phone, goal: 'Investment' };
    const success = await onGenerate(details);
    if (success) setIsDone(true);
  };

  return (
    <div className="fixed inset-0 bg-[#064E2C]/80 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
      <div className="bg-white rounded-[48px] max-w-lg w-full p-12 shadow-2xl relative border border-white/20 animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-300 hover:text-[#064E2C] transition-colors focus:outline-none p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {!isDone ? (
           <>
              <div className="text-center mb-10">
                <h3 className="text-4xl font-serif font-bold text-[#064E2C] mb-4">Finalize Strategy</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-medium">Export your proprietary HWPE analysis as a professional multi-page portfolio report.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
               <div className="grid grid-cols-2 gap-5">
                <input required placeholder="First Name" className="w-full rounded-full bg-gray-50 border border-gray-100 px-7 py-4 outline-none focus:ring-4 focus:ring-[#064E2C]/5 focus:border-[#064E2C]/30 transition-all font-medium text-gray-700" onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <input required placeholder="Last Name" className="w-full rounded-full bg-gray-50 border border-gray-100 px-7 py-4 outline-none focus:ring-4 focus:ring-[#064E2C]/5 focus:border-[#064E2C]/30 transition-all font-medium text-gray-700" onChange={e => setFormData({...formData, lastName: e.target.value})} />
               </div>
               <input required type="email" placeholder="Email Address" className="w-full rounded-full bg-gray-50 border border-gray-100 px-7 py-4 outline-none focus:ring-4 focus:ring-[#064E2C]/5 focus:border-[#064E2C]/30 transition-all font-medium text-gray-700" onChange={e => setFormData({...formData, email: e.target.value})} />
               <input required type="tel" placeholder="Mobile Number" className="w-full rounded-full bg-gray-50 border border-gray-100 px-7 py-4 outline-none focus:ring-4 focus:ring-[#064E2C]/5 focus:border-[#064E2C]/30 transition-all font-medium text-gray-700" onChange={e => setFormData({...formData, phone: e.target.value})} />
               <button type="submit" disabled={isGenerating} className="w-full mt-8 bg-[#064E2C] text-white font-black py-5 rounded-full shadow-2xl disabled:opacity-70 transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-widest text-xs">
                 {isGenerating ? 'Analyzing Logic Pools...' : 'Generate Full PDF Report'}
               </button>
               <p className="text-[10px] text-center text-gray-400 mt-6 font-bold uppercase tracking-widest">Secured by Homez Engine {VERSION}</p>
              </form>
           </>
        ) : (
           <div className="text-center py-10 space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-[#064E2C] rounded-full flex items-center justify-center mx-auto text-white shadow-2xl">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 className="text-3xl font-serif font-bold text-[#064E2C] mb-2">Strategy Released</h3>
                <p className="text-gray-500 text-sm leading-relaxed px-10">Your high-fidelity portfolio analysis has been successfully generated and dispatched.</p>
              </div>
              <button onClick={onClose} className="block w-full bg-gray-50 text-[#064E2C] font-black py-5 rounded-full hover:bg-gray-100 transition-all border border-gray-100 uppercase tracking-widest text-xs">Close Secure Interface</button>
           </div>
        )}
      </div>
    </div>
  );
};

const HomezLogoMark: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`flex flex-col items-end ${className}`}>
        <h1 className="text-3xl font-serif font-bold text-[#064E2C] tracking-tight leading-none">HOMEZ</h1>
        <p className="text-[#C6A672] text-[8px] font-bold uppercase tracking-[0.35em] leading-none mt-1">Buyers Advocacy</p>
    </div>
);

const Footer: React.FC<{ page: number, total: number }> = ({ page, total }) => (
    <div className="mt-auto border-t border-gray-100 pt-6 flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-widest font-medium">
        <div className="flex items-center gap-2">
            <span className="font-bold text-[#064E2C]">HOMEZ Buyers Advocacy</span>
            <span>•</span>
            <span>HWPE Engine v{VERSION}</span>
        </div>
        <span>Page {page} of {total}</span>
    </div>
);

const PrintReport: React.FC<{ inputs: InputState, results: CalculationResult, clientDetails: UserDetails | null }> = ({ inputs, results, clientDetails }) => {
  const currency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  const percent = (val: number) => `${val.toFixed(2)}%`;
  
  const totalCashRequired = results.upfrontCostsTotal + (inputs.purchasePrice * (inputs.depositPercent/100));

  return (
    <div className="bg-white">
      {/* PAGE 1: EXECUTIVE SUMMARY & INPUTS */}
      <div id="print-page-1" className="w-[794px] h-[1123px] bg-white p-12 flex flex-col relative overflow-hidden">
         {/* Background Elements */}
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#064E2C]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
         
         {/* Header */}
         <div className="flex justify-between items-end mb-12 relative z-10 border-b border-[#064E2C] pb-6">
            <div className="flex flex-col items-start gap-2">
               <h2 className="text-4xl font-serif font-bold text-gray-900 leading-none">Investment Strategy</h2>
               <span className="text-[#064E2C] text-[10px] font-bold uppercase tracking-widest pl-0.5">
                  Confidential Analysis
               </span>
            </div>
            <HomezLogoMark />
         </div>

         {/* Introduction */}
         <div className="mb-10 relative z-10 bg-[#FFFCED] rounded-xl p-6 border border-[#C6A672]/20">
            <p className="text-xs text-gray-600 leading-relaxed mb-2">
                Prepared exclusively for <span className="font-bold text-[#064E2C] text-sm">{clientDetails?.name}</span>
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Date: {new Date().toLocaleDateString('en-AU', { dateStyle: 'long' })} • Ref: {clientDetails?.name.split(' ').map(n => n[0]).join('')}-{Date.now().toString().slice(-4)}
            </p>
         </div>

         {/* Property & Loan Grid */}
         <div className="grid grid-cols-2 gap-8 mb-10 relative z-10">
            <div className="bg-white rounded-2xl p-0">
               <h3 className="text-[#064E2C] text-[11px] font-black uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Property Particulars</h3>
               <div className="space-y-3">
                  <Row label="Address" value={inputs.propertyAddress || "TBA"} />
                  <Row label="State / Territory" value={inputs.state} />
                  <Row label="Purchase Price" value={currency(inputs.purchasePrice)} highlight />
                  <Row label="Weekly Rental" value={currency(inputs.weeklyRent)} />
                  <Row label="Gross Yield" value={percent((inputs.weeklyRent * 52) / inputs.purchasePrice * 100)} />
               </div>
            </div>
            <div className="bg-white rounded-2xl p-0">
               <h3 className="text-[#064E2C] text-[11px] font-black uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Financial Structure</h3>
               <div className="space-y-3">
                  <Row label="Loan Amount" value={currency(results.loanAmount)} />
                  <Row label="LVR" value={percent(results.lvr)} />
                  <Row label="Interest Rate" value={`${inputs.interestRate}%`} />
                  <Row label="Loan Type" value={inputs.isInterestOnly ? `Interest Only (${inputs.interestOnlyYears}yr)` : "Principal & Interest"} />
                  <Row label="Total Cash Required" value={currency(totalCashRequired)} highlight />
               </div>
            </div>
         </div>

         {/* Performance Snapshot (Tiles) - REPLACES GREEN BLOCK */}
         <div className="flex-1">
             <h3 className="text-[#064E2C] text-[11px] font-black uppercase tracking-widest mb-6">Year 1 Performance Snapshot</h3>
             <div className="grid grid-cols-3 gap-4 mb-4">
                 <PrintTile label="Gross Yield" value={`${((results.firstYearCashflow.effectiveGrossRent / inputs.purchasePrice) * 100).toFixed(2)}%`} subtext="Annualized Return" />
                 <PrintTile label="Pre-Tax (Wk)" value={`$${Math.round(results.firstYearCashflow.netCashflow / 52).toLocaleString()}`} subtext="Weekly Cashflow" highlight={results.firstYearCashflow.netCashflow > 0} />
                 <PrintTile label="Post-Tax (Wk)" value={`$${Math.round(results.firstYearCashflow.afterTaxCashflow / 52).toLocaleString()}`} subtext="Weekly Realized" highlight={results.firstYearCashflow.afterTaxCashflow > 0} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <PrintTile label="Tax Recovery" value={currency(results.firstYearCashflow.taxRefund)} subtext="Est. Year 0 Refund" />
                 <PrintTile label="Upfront Capital" value={currency(totalCashRequired)} subtext="Total Entry Costs" />
             </div>
         </div>

         <Footer page={1} total={3} />
      </div>

      {/* PAGE 2: CHARTS & YEAR 0 BREAKDOWN */}
      <div id="print-page-2" className="w-[794px] h-[1123px] bg-white p-12 flex flex-col relative overflow-hidden">
         {/* Header */}
         <div className="flex justify-between items-center mb-8 border-b border-[#C6A672]/30 pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#064E2C]">Wealth Velocity</h2>
            <HomezLogoMark />
         </div>

         {/* Chart Section */}
         <div className="h-[350px] mb-48 w-full">
            <ProjectionChart data={results.projections} positiveCashflowYear={results.positiveCashflowAfterTaxYear} isPrintMode={true} />
         </div>

         {/* Year 0 Breakdown Table */}
         <div className="flex-1">
             <h3 className="text-[#064E2C] text-[11px] font-black uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Year 0: Operational Cashflow Detail</h3>
             <table className="w-full text-[10px] leading-relaxed">
                <thead className="bg-[#064E2C]/5 text-[#064E2C]"><tr><th className="px-4 py-3 text-left font-black tracking-widest uppercase rounded-l-lg">Item</th><th className="px-4 py-3 text-right font-black tracking-widest uppercase">Monthly</th><th className="px-4 py-3 text-right font-black tracking-widest uppercase rounded-r-lg">Annual</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                    <tr><td className="px-4 py-3 font-medium">Effective Gross Rent</td><td className="px-4 py-3 text-right text-gray-500">${Math.round(results.firstYearCashflow.effectiveGrossRent / 12).toLocaleString()}</td><td className="px-4 py-3 text-right font-bold text-gray-900">${Math.round(results.firstYearCashflow.effectiveGrossRent).toLocaleString()}</td></tr>
                    <tr><td className="px-4 py-3 font-medium text-gray-500">Less: Mortgage Repayments</td><td className="px-4 py-3 text-right text-red-400">-${Math.round(results.firstYearCashflow.mortgageRepayments / 12).toLocaleString()}</td><td className="px-4 py-3 text-right text-red-400">-${Math.round(results.firstYearCashflow.mortgageRepayments).toLocaleString()}</td></tr>
                    <tr><td className="px-4 py-3 font-medium text-gray-500">Less: Operating Expenses</td><td className="px-4 py-3 text-right text-red-400">-${Math.round((results.firstYearCashflow.managementFees + results.firstYearCashflow.otherOperatingExpenses) / 12).toLocaleString()}</td><td className="px-4 py-3 text-right text-red-400">-${Math.round(results.firstYearCashflow.managementFees + results.firstYearCashflow.otherOperatingExpenses).toLocaleString()}</td></tr>
                    <tr className="bg-gray-50 font-bold"><td className="px-4 py-3 text-[#064E2C] uppercase tracking-wider">Net Operating Cashflow (Pre-Tax)</td><td className={`px-4 py-3 text-right ${results.firstYearCashflow.netCashflow > 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>${Math.round(results.firstYearCashflow.netCashflow / 12).toLocaleString()}</td><td className={`px-4 py-3 text-right ${results.firstYearCashflow.netCashflow > 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>${Math.round(results.firstYearCashflow.netCashflow).toLocaleString()}</td></tr>
                    <tr><td className="px-4 py-3 font-medium text-[#C6A672] italic">Non-Cash: Depreciation Benefits</td><td className="px-4 py-3 text-right text-gray-400">-${Math.round(results.firstYearCashflow.depreciation / 12).toLocaleString()}</td><td className="px-4 py-3 text-right text-gray-400">-${Math.round(results.firstYearCashflow.depreciation).toLocaleString()}</td></tr>
                    <tr><td className="px-4 py-3 font-medium text-[#064E2C]">ATO Tax Refund (Est.)</td><td className="px-4 py-3 text-right text-[#064E2C]">+${Math.round(results.firstYearCashflow.taxRefund / 12).toLocaleString()}</td><td className="px-4 py-3 text-right text-[#064E2C]">+${Math.round(results.firstYearCashflow.taxRefund).toLocaleString()}</td></tr>
                    <tr className="bg-[#064E2C] text-white font-bold text-xs"><td className="px-4 py-4 rounded-l-lg uppercase tracking-wider">Net Position (Post-Tax)</td><td className="px-4 py-4 text-right">${Math.round(results.firstYearCashflow.afterTaxCashflow / 12).toLocaleString()}</td><td className="px-4 py-4 text-right rounded-r-lg">${Math.round(results.firstYearCashflow.afterTaxCashflow).toLocaleString()}</td></tr>
                </tbody>
             </table>
         </div>

         <Footer page={2} total={3} />
      </div>

      {/* PAGE 3: 10 YEAR TABLE & DISCLAIMER */}
      <div id="print-page-3" className="w-[794px] h-[1123px] bg-white p-12 flex flex-col relative overflow-hidden">
         {/* Header */}
         <div className="flex justify-between items-center mb-10 border-b border-[#C6A672]/30 pb-6">
            <h2 className="text-2xl font-serif font-bold text-[#064E2C]">10-Year Growth Forecast</h2>
            <HomezLogoMark />
         </div>

         {/* Table Section */}
         <div className="flex-1 mb-8">
            <div className="rounded-xl border border-gray-100 overflow-hidden mb-6">
               <table className="w-full text-[10px] leading-relaxed">
                  <thead className="bg-[#064E2C] text-white">
                     <tr>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Year</th>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Asset Value</th>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Loan Balance</th>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[#C6A672]">Equity</th>
                        <th className="px-4 py-3 text-right font-bold uppercase tracking-wider">Pre-Tax CF</th>
                        <th className="px-4 py-3 text-right font-bold uppercase tracking-wider">Post-Tax CF</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {results.projections.slice(0, 11).map((p, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                           <td className="px-4 py-3 font-bold text-[#064E2C]">{p.year === 0 ? 'Entry' : `Yr ${p.year}`}</td>
                           <td className="px-4 py-3 font-medium">{currency(p.propertyValue)}</td>
                           <td className="px-4 py-3 text-gray-500">{currency(p.loanBalance)}</td>
                           <td className="px-4 py-3 font-bold text-[#C6A672]">{currency(p.equity)}</td>
                           <td className={`px-4 py-3 text-right font-medium ${p.netCashflow >= 0 ? 'text-green-600' : 'text-red-400'}`}>{currency(p.netCashflow)}</td>
                           <td className={`px-4 py-3 text-right font-bold ${p.afterTaxCashflow >= 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>{currency(p.afterTaxCashflow)}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            <div className="flex gap-4 text-[9px] text-gray-400 bg-gray-50 p-4 rounded-lg border border-gray-100">
               <p><span className="font-bold text-[#064E2C]">Model Assumptions:</span> Capital Growth: {inputs.capitalGrowthPercent}% • Rental Growth: {inputs.rentalGrowthPercent}% • CPI: {inputs.inflationPercent}% • Vacancy: {inputs.vacancyWeeks} weeks</p>
            </div>
         </div>

         {/* Disclaimer */}
         <div className="mt-auto border-t border-gray-200 pt-8">
            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Legal Disclaimer & Important Information</h4>
            <div className="columns-2 gap-8">
                <p className="text-[8px] text-gray-400 leading-relaxed text-justify mb-4">
                   This report is produced by the Homez Wealth Projection Engine (HWPE) for illustrative modeling purposes only. It does not constitute financial, legal, tax, or real estate advice. All figures are estimates based on the user-provided inputs and assumptions (including capital growth, rental growth, and inflation rates) and statutory tax scales for the 2024-25 financial year. 
                </p>
                <p className="text-[8px] text-gray-400 leading-relaxed text-justify">
                   Actual results may differ materially depending on market conditions, changes in taxation law, and individual financial circumstances. Homez Buyers Advocacy and its affiliates accept no liability for any loss or damage arising from reliance on this information. Users should consult with a qualified financial advisor, accountant, and solicitor before making investment decisions. Depreciation estimates are indicative only; a professional Quantity Surveyor report is required for ATO tax deductions.
                </p>
            </div>
         </div>

         <Footer page={3} total={3} />
      </div>
    </div>
  );
};

const Row = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div className="flex justify-between items-center text-[10px] py-1">
        <span className="text-gray-500 font-medium uppercase tracking-wide">{label}</span>
        <span className={`font-bold ${highlight ? 'text-[#064E2C]' : 'text-gray-900'}`}>{value}</span>
    </div>
);

export default App;