import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_INPUTS, COLORS, LOGO_BASE64 } from './constants';
import { InputState, AustralianState, CalculationResult, UserDetails } from './types';
import { calculateProjections, estimateStampDuty } from './utils/calculations';
import { InputGroup, NumberInput, SelectInput, TextInput } from './components/InputGroup';
import ProjectionChart from './components/ProjectionChart';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from 'jspdf';

// --- ZOHO CRM CONFIGURATION ---
// Extracted from the provided Zoho Web-to-Lead HTML
const ZOHO_CONFIG = {
  actionUrl: "https://crm.zoho.com.au/crm/WebToLeadForm", 
  xnQsjsdp: "6d7e3cca0a1c68c2a5829930ca9bf1a93dd4a6f53d05b0a9c824cd6c031337bc", 
  xmIwtLD: "3e7827f2d4a8798898396f2f5b3bdc4e8c6b176159ef093019ae409c020c21e5fc69f739918272967517914b31c0f8be",
  actionType: "TGVhZHM=",
  returnURL: "https://www.homez.au/cashflow-calculator" 
};

const DISCLAIMER_TEXT = (
  <>
    <p className="mb-2"><strong>Important Information:</strong> This calculator is a modeling tool provided for illustrative purposes only and does not constitute financial, legal, or tax advice. Results are estimates based on the inputs you provide and do not take into account your personal financial circumstances, objectives, or needs.</p>
    <ul className="list-disc pl-5 space-y-1 mb-2">
      <li><strong>Estimates Only:</strong> This is a model, not a prediction. Actual amounts, repayment periods, and investment returns may vary due to market forces and individual circumstances.</li>
      <li><strong>Lending Criteria:</strong> Using this calculator does not guarantee loan eligibility. You must satisfy your lender's specific lending criteria.</li>
      <li><strong>Interest Rates & Repayments:</strong> Calculations assume interest rates remain constant for the loan term unless otherwise modelled. 'Interest Only' repayments do not reduce the principal; reverting to 'Principal & Interest' will significantly increase repayments.</li>
      <li><strong>Fees & Charges:</strong> Government charges (e.g., Stamp Duty) are estimates based on current state brackets. Loan establishment fees, Lenders Mortgage Insurance (LMI), and other bank fees are not included unless explicitly added to 'Purchase Costs'.</li>
    </ul>
    <p><strong>Limitation of Liability:</strong> Homez Buyers Advocacy accepts no liability for errors, omissions, or any loss or damage suffered as a result of reliance on this information. We recommend consulting with a qualified finance professional before making any investment decisions.</p>
  </>
);

const App: React.FC = () => {
  const [inputs, setInputs] = useState<InputState>(DEFAULT_INPUTS);
  const [results, setResults] = useState<CalculationResult | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Initial Calculation & Recalc on change
  useEffect(() => {
    const calcResults = calculateProjections(inputs);
    setResults(calcResults);
  }, [inputs]);

  // Handler for Price/State changes to auto-update Stamp Duty
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

  const handleShareClick = () => {
    setIsModalOpen(true);
  };

  const generatePDF = async (userDetails: UserDetails): Promise<string | null> => {
    setIsGenerating(true);
    
    // Allow DOM to settle
    await new Promise(resolve => setTimeout(resolve, 500));

    const page1Element = document.getElementById('print-page-1');
    const page2Element = document.getElementById('print-page-2');

    if (page1Element && page2Element) {
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        
        // --- CAPTURE PAGE 1 ---
        const canvas1 = await html2canvas(page1Element, {
           scale: 2, 
           backgroundColor: '#ffffff',
           useCORS: true,
           logging: false,
           windowWidth: 1200
        });
        const imgData1 = canvas1.toDataURL('image/png');
        const imgHeight1 = (canvas1.height * pdfWidth) / canvas1.width;
        pdf.addImage(imgData1, 'PNG', 0, 0, pdfWidth, imgHeight1);

        // --- CAPTURE PAGE 2 ---
        pdf.addPage();
        const canvas2 = await html2canvas(page2Element, {
            scale: 2, 
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            windowWidth: 1200
         });
         const imgData2 = canvas2.toDataURL('image/png');
         const imgHeight2 = (canvas2.height * pdfWidth) / canvas2.width;
         pdf.addImage(imgData2, 'PNG', 0, 0, pdfWidth, imgHeight2);

        // Generate Filename
        const safeName = userDetails.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `Homez_Analysis_${safeName}.pdf`;

        // Save PDF
        pdf.save(fileName);

        return fileName;

      } catch (error) {
        console.error("Error generating PDF", error);
        alert("There was an error generating the report. Please try again.");
        return null;
      } finally {
        setIsGenerating(false);
      }
    }
    return null;
  };
  
  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('purchasePrice')) {
      const newInputs = { ...DEFAULT_INPUTS };
      Object.keys(DEFAULT_INPUTS).forEach((key) => {
        const val = params.get(key);
        if (val !== null) {
          // @ts-ignore
          if (key === 'propertyAddress') {
             // @ts-ignore
             newInputs[key] = val;
          } else if (key === 'state' || key === 'isInterestOnly') {
             // @ts-ignore
             newInputs[key] = key === 'isInterestOnly' ? val === 'true' : val;
          } else {
             // @ts-ignore
             newInputs[key] = Number(val);
          }
        }
      });
      setInputs(newInputs);
    } else {
      // Init stamp duty
      setInputs(prev => ({...prev, stampDuty: estimateStampDuty(prev.state, prev.purchasePrice)}));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!results) return null;

  const depositAmount = inputs.purchasePrice * (inputs.depositPercent / 100);
  const totalCashRequired = results.upfrontCostsTotal + depositAmount;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto relative">
      {/* Header */}
      <header className="mb-8 text-center md:text-left flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
        <div>
          {LOGO_BASE64 ? (
            <img src={LOGO_BASE64} alt="Homez Buyers Advocacy" className="h-16 md:h-20 mb-2" />
          ) : (
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#064E2C]">Homez Buyers Advocacy</h1>
          )}
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#064E2C] mt-2">Capital & Rental Growth</h2>
          <p className="text-[#C6A672] text-lg font-medium">Cashflow Calculator</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: INPUTS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Section 1: Property */}
          <section className="bg-white rounded-[24px] p-6 shadow-sm border border-[#C6A672]/30">
            <h2 className="text-xl font-serif font-semibold text-[#064E2C] mb-4">Property Details</h2>
            <InputGroup label="Address (Optional)">
               <TextInput 
                  placeholder="e.g. 123 Smith St, Sydney"
                  value={inputs.propertyAddress || ''}
                  onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
               />
            </InputGroup>
            <InputGroup label="Purchase Price">
              <NumberInput 
                prefix="$" 
                value={inputs.purchasePrice} 
                onChange={(e) => handlePropertyChange('purchasePrice', Number(e.target.value))} 
              />
            </InputGroup>
            <InputGroup label="State">
              <SelectInput 
                value={inputs.state} 
                onChange={(e) => handlePropertyChange('state', e.target.value as AustralianState)}
              >
                {Object.values(AustralianState).map(s => <option key={s} value={s}>{s}</option>)}
              </SelectInput>
            </InputGroup>
          </section>

          {/* New Section: Purchase Costs */}
          <section className="bg-white rounded-[24px] p-6 shadow-sm border border-[#C6A672]/30">
             <h2 className="text-xl font-serif font-semibold text-[#064E2C] mb-4">Purchase Costs</h2>
             <InputGroup label="Stamp Duty" subLabel="(Auto or Edit)">
                <NumberInput 
                   prefix="$"
                   value={inputs.stampDuty}
                   onChange={(e) => handleInputChange('stampDuty', Number(e.target.value))}
                />
             </InputGroup>
             <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Buyer's Agent">
                   <NumberInput 
                      prefix="$"
                      value={inputs.buyersAgentFee}
                      onChange={(e) => handleInputChange('buyersAgentFee', Number(e.target.value))}
                   />
                </InputGroup>
                <InputGroup label="Solicitor">
                   <NumberInput 
                      prefix="$"
                      value={inputs.solicitorFee}
                      onChange={(e) => handleInputChange('solicitorFee', Number(e.target.value))}
                   />
                </InputGroup>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Build & Pest">
                   <NumberInput 
                      prefix="$"
                      value={inputs.buildingPestFee}
                      onChange={(e) => handleInputChange('buildingPestFee', Number(e.target.value))}
                   />
                </InputGroup>
                <InputGroup label="Misc / Other">
                   <NumberInput 
                      prefix="$"
                      value={inputs.otherUpfront}
                      onChange={(e) => handleInputChange('otherUpfront', Number(e.target.value))}
                   />
                </InputGroup>
             </div>
          </section>

          {/* Section 2: Finance */}
          <section className="bg-white rounded-[24px] p-6 shadow-sm border border-[#C6A672]/30">
            <h2 className="text-xl font-serif font-semibold text-[#064E2C] mb-4">Finance</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Deposit" subLabel="%">
                <NumberInput 
                  suffix="%" 
                  value={inputs.depositPercent} 
                  onChange={(e) => handleInputChange('depositPercent', Number(e.target.value))} 
                />
              </InputGroup>
              <InputGroup label="Rate" subLabel="%">
                <NumberInput 
                  suffix="%" 
                  value={inputs.interestRate} 
                  onChange={(e) => handleInputChange('interestRate', Number(e.target.value))} 
                />
              </InputGroup>
            </div>
            
            <div className="flex items-center justify-between py-3 border-t border-b border-gray-100 my-4">
              <span className="text-sm font-semibold text-gray-700">Interest Only?</span>
              <button 
                onClick={() => handleInputChange('isInterestOnly', !inputs.isInterestOnly)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${inputs.isInterestOnly ? 'bg-[#064E2C]' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${inputs.isInterestOnly ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {inputs.isInterestOnly && (
               <InputGroup label="IO Period" subLabel="Years">
               <NumberInput 
                 value={inputs.interestOnlyYears} 
                 onChange={(e) => handleInputChange('interestOnlyYears', Number(e.target.value))} 
               />
             </InputGroup>
            )}

            <InputGroup label="Loan Term" subLabel="Years">
              <NumberInput 
                value={inputs.loanTermYears} 
                onChange={(e) => handleInputChange('loanTermYears', Number(e.target.value))} 
              />
            </InputGroup>
          </section>

          {/* Section 3: Income & Expenses */}
          <section className="bg-white rounded-[24px] p-6 shadow-sm border border-[#C6A672]/30">
            <h2 className="text-xl font-serif font-semibold text-[#064E2C] mb-4">Income & Expenses</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Weekly Rent">
                <NumberInput 
                  prefix="$" 
                  value={inputs.weeklyRent} 
                  onChange={(e) => handleInputChange('weeklyRent', Number(e.target.value))} 
                />
              </InputGroup>
              <InputGroup label="Vacancy" subLabel="Weeks/Yr">
                <NumberInput 
                  value={inputs.vacancyWeeks} 
                  onChange={(e) => handleInputChange('vacancyWeeks', Number(e.target.value))} 
                />
              </InputGroup>
            </div>
            
            <div className="my-4 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Operating Expenses (Annual)</h3>
              <div className="grid grid-cols-2 gap-4">
                 <InputGroup label="Mgmt Fee" subLabel="%">
                   <NumberInput suffix="%" value={inputs.managementFeePercent} onChange={(e) => handleInputChange('managementFeePercent', Number(e.target.value))} />
                 </InputGroup>
                 <InputGroup label="Council Rates">
                   <NumberInput prefix="$" value={inputs.councilRates} onChange={(e) => handleInputChange('councilRates', Number(e.target.value))} />
                 </InputGroup>
                 
                 <InputGroup label="Insurance">
                   <NumberInput prefix="$" value={inputs.insurance} onChange={(e) => handleInputChange('insurance', Number(e.target.value))} />
                 </InputGroup>
                 <InputGroup label="Repairs & Maint">
                   <NumberInput prefix="$" value={inputs.repairsMaintenance} onChange={(e) => handleInputChange('repairsMaintenance', Number(e.target.value))} />
                 </InputGroup>
                 
                 <InputGroup label="Body Corporate">
                   <NumberInput prefix="$" value={inputs.bodyCorp} onChange={(e) => handleInputChange('bodyCorp', Number(e.target.value))} />
                 </InputGroup>
                 <InputGroup label="Land Tax">
                   <NumberInput prefix="$" value={inputs.landTax} onChange={(e) => handleInputChange('landTax', Number(e.target.value))} />
                 </InputGroup>
                 
                 <InputGroup label="Misc / Other" className="col-span-2">
                   <NumberInput prefix="$" value={inputs.otherExpenses} onChange={(e) => handleInputChange('otherExpenses', Number(e.target.value))} />
                 </InputGroup>
              </div>
            </div>
          </section>

           {/* Section 4: Projections */}
           <section className="bg-white rounded-[24px] p-6 shadow-sm border border-[#C6A672]/30">
            <h2 className="text-xl font-serif font-semibold text-[#064E2C] mb-4">Forecast Assumptions</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Capital Growth" subLabel="% p.a.">
                <NumberInput 
                  suffix="%" 
                  value={inputs.capitalGrowthPercent} 
                  onChange={(e) => handleInputChange('capitalGrowthPercent', Number(e.target.value))} 
                  className="bg-green-50"
                />
              </InputGroup>
              <InputGroup label="Rental Growth" subLabel="% p.a.">
                <NumberInput 
                  suffix="%" 
                  value={inputs.rentalGrowthPercent} 
                  onChange={(e) => handleInputChange('rentalGrowthPercent', Number(e.target.value))}
                  className="bg-orange-50"
                />
              </InputGroup>
            </div>
          </section>
          
          <div className="flex gap-4">
             <button onClick={resetDefaults} className="flex-1 py-3 rounded-full text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                Reset
             </button>
             <button onClick={handleShareClick} className="flex-1 py-3 rounded-full text-sm font-semibold bg-[#064E2C] text-white hover:bg-[#053d22] transition-colors shadow-lg shadow-green-900/20">
                Share Scenario
             </button>
          </div>

        </div>

        {/* RIGHT COLUMN: RESULTS */}
        <div className="lg:col-span-8 space-y-6" id="results-panel">
          
          {/* KPI TILES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPITile 
               label="Gross Yield" 
               value={`${((results.firstYearCashflow.effectiveGrossRent / inputs.purchasePrice) * 100).toFixed(2)}%`}
               subtext="Year 1"
            />
            <KPITile 
               label="Net Cashflow" 
               value={`$${Math.round(results.firstYearCashflow.netCashflow / 52).toLocaleString()}`}
               subtext="Per Week"
               highlight={results.firstYearCashflow.netCashflow > 0}
            />
            <KPITile 
               label="Net Cashflow" 
               value={`$${Math.round(results.firstYearCashflow.netCashflow).toLocaleString()}`}
               subtext="Per Year"
               highlight={results.firstYearCashflow.netCashflow > 0}
            />
            <KPITile 
               label="Cash Required" 
               value={`$${Math.round(totalCashRequired).toLocaleString()}`}
               subtext="Deposit + Costs"
            />
          </div>

          {/* COSTS TABLE */}
          <div className="bg-white rounded-[24px] p-6 border border-[#C6A672]/30">
            <h3 className="text-lg font-serif font-semibold text-[#064E2C] mb-4">Estimated Upfront Costs</h3>
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-[#FFFCED] text-[#C6A672]">
                    <tr>
                      <th className="px-4 py-2 rounded-l-lg">Item</th>
                      <th className="px-4 py-2 text-right rounded-r-lg">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableRow label={`Deposit (${inputs.depositPercent}%)`} value={depositAmount} />
                    <TableRow label="Stamp Duty" value={inputs.stampDuty} />
                    <TableRow label="Buyer's Agent Fee" value={inputs.buyersAgentFee} />
                    <TableRow label="Solicitor / Conveyancer" value={inputs.solicitorFee} />
                    <TableRow label="Building & Pest" value={inputs.buildingPestFee} />
                    {inputs.otherUpfront > 0 && (
                      <TableRow label="Misc / Other" value={inputs.otherUpfront} />
                    )}
                    <tr className="font-bold border-t border-gray-200">
                      <td className="px-4 py-3 text-[#064E2C]">Total Cash Required</td>
                      <td className="px-4 py-3 text-right text-[#064E2C]">${totalCashRequired.toLocaleString()}</td>
                    </tr>
                  </tbody>
               </table>
            </div>
          </div>

          {/* CURRENT CASHFLOW BREAKDOWN */}
          <div className="bg-white rounded-[24px] p-6 border border-[#C6A672]/30">
            <h3 className="text-lg font-serif font-semibold text-[#064E2C] mb-4">Current Cashflow Position</h3>
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-[#064E2C] text-white">
                    <tr>
                      <th className="px-4 py-2 rounded-l-lg">Item</th>
                      <th className="px-4 py-2 text-right rounded-r-lg">Annual Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <TableRow label="Loan Amount" value={results.loanAmount} />
                    <TableRow label="Gross Rental Income" value={results.firstYearCashflow.potentialGrossRent} />
                    <tr className="border-b border-gray-50 text-gray-500 italic">
                      <td className="px-4 py-3 pl-8">Less: Vacancy ({inputs.vacancyWeeks} weeks)</td>
                      <td className="px-4 py-3 text-right">-${Math.round(results.firstYearCashflow.vacancyLoss).toLocaleString()}</td>
                    </tr>
                    <tr className="bg-[#FFFCED]">
                      <td className="px-4 py-3 font-semibold text-[#064E2C]">Effective Gross Rent</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#064E2C]">${Math.round(results.firstYearCashflow.effectiveGrossRent).toLocaleString()}</td>
                    </tr>
                    
                    <tr className="border-b border-gray-50 mt-2">
                       <td className="px-4 py-3 font-semibold text-gray-700 pt-6">Expenses</td>
                       <td className="px-4 py-3 pt-6"></td>
                    </tr>
                    <TableRow label="Mortgage Repayments" value={results.firstYearCashflow.mortgageRepayments} />
                    <TableRow label="Property Management" value={results.firstYearCashflow.managementFees} />
                    <TableRow label="Council Rates" value={inputs.councilRates} />
                    <TableRow label="Insurance" value={inputs.insurance} />
                    <TableRow label="Repairs & Maintenance" value={inputs.repairsMaintenance} />
                    {inputs.landTax > 0 && <TableRow label="Land Tax" value={inputs.landTax} />}
                    {inputs.bodyCorp > 0 && <TableRow label="Body Corporate" value={inputs.bodyCorp} />}
                    {inputs.otherExpenses > 0 && <TableRow label="Other Expenses" value={inputs.otherExpenses} />}
                    
                    <tr className="border-t-2 border-[#C6A672]">
                      <td className="px-4 py-4 font-bold text-lg text-[#064E2C]">Net Cashflow</td>
                      <td className={`px-4 py-4 text-right font-bold text-lg ${results.firstYearCashflow.netCashflow > 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>
                        ${Math.round(results.firstYearCashflow.netCashflow).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
               </table>
            </div>
          </div>

          {/* MAIN CHART */}
          <ProjectionChart 
            data={results.projections} 
            positiveCashflowYear={results.positiveCashflowYear} 
          />

          {/* PROJECTION TABLE (Short Term) */}
           <div className="bg-white rounded-[24px] p-6 border border-[#C6A672]/30">
            <h3 className="text-lg font-serif font-semibold text-[#064E2C] mb-4">10 Year Forecast</h3>
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-[#064E2C] text-white">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Year</th>
                      <th className="px-4 py-3">Value</th>
                      <th className="px-4 py-3">Loan</th>
                      <th className="px-4 py-3">Equity</th>
                      <th className="px-4 py-3">Rent (Wk)</th>
                      <th className="px-4 py-3">CF (Wk)</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">CF (Yr)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.projections.slice(0, 11).map((p) => (
                      <tr key={p.year} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium">Year {p.year}</td>
                        <td className="px-4 py-3">${Math.round(p.propertyValue).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-500">${Math.round(p.loanBalance).toLocaleString()}</td>
                        <td className="px-4 py-3 text-green-700 font-medium">${Math.round(p.equity).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-700">${Math.round(p.weeklyRent).toLocaleString()}</td>
                        <td className={`px-4 py-3 font-medium ${p.netCashflow > 0 ? 'text-green-600' : 'text-red-500'}`}>
                           ${Math.round(p.netCashflow / 52).toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${p.netCashflow > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          ${Math.round(p.netCashflow).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimers Section (Bottom of App - Collapsible) */}
      <DisclaimerAccordion />

      {/* OFF-SCREEN PRINT TEMPLATES (Hidden but captured) */}
      <div className="fixed top-0 left-[-9999px]">
         <PrintReport inputs={inputs} results={results} />
      </div>

      {/* Share Modal */}
      {isModalOpen && (
        <ShareModal 
          onClose={() => setIsModalOpen(false)} 
          onGenerate={generatePDF}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
};

// --- HELPER COMPONENTS ---

const DisclaimerAccordion: React.FC = () => {
   const [isOpen, setIsOpen] = useState(false);

   return (
     <div className="mt-12 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
       >
         <span className="text-sm font-serif font-bold text-[#064E2C]">Disclaimers & Assumptions</span>
         <svg 
           className={`w-5 h-5 text-[#064E2C] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
           fill="none" 
           viewBox="0 0 24 24" 
           stroke="currentColor"
         >
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
         </svg>
       </button>
       
       {isOpen && (
         <div className="p-6 bg-white text-xs text-gray-500 leading-relaxed border-t border-gray-200">
           {DISCLAIMER_TEXT}
         </div>
       )}
     </div>
   );
 };

// --- PRINT REPORT COMPONENT ---
const PrintReport: React.FC<{ inputs: InputState, results: CalculationResult }> = ({ inputs, results }) => {
   const depositAmount = inputs.purchasePrice * (inputs.depositPercent / 100);
   const totalCashRequired = results.upfrontCostsTotal + depositAmount;

   return (
      <>
      {/* PAGE 1: OVERVIEW & CASHFLOW */}
      <div id="print-page-1" className="w-[900px] h-auto bg-white p-10 font-sans text-gray-800">
         {/* Print Header */}
         <div className="border-b-2 border-[#064E2C] pb-6 flex justify-between items-end mb-8">
            <div>
               {LOGO_BASE64 ? (
                 <img src={LOGO_BASE64} alt="Homez" className="h-16 mb-2" />
               ) : (
                 <h1 className="text-3xl font-serif font-bold text-[#064E2C]">Homez Buyers Advocacy</h1>
               )}
               <p className="text-[#C6A672] font-medium">Investment Property Analysis</p>
            </div>
            <div className="text-right text-sm text-gray-500">
               <p>{new Date().toLocaleDateString()}</p>
               <p>{inputs.propertyAddress || 'Proposed Property'}</p>
            </div>
         </div>

         {/* KPIs */}
         <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
            <h3 className="font-serif font-bold text-[#064E2C] mb-4">Key Performance Indicators</h3>
            <div className="grid grid-cols-4 gap-4">
               <div className="bg-white p-4 rounded shadow-sm text-center">
                  <div className="text-xs text-gray-500 uppercase">Gross Yield</div>
                  <div className="text-xl font-bold text-[#064E2C]">{((results.firstYearCashflow.effectiveGrossRent / inputs.purchasePrice) * 100).toFixed(2)}%</div>
               </div>
               <div className="bg-white p-4 rounded shadow-sm text-center">
                  <div className="text-xs text-gray-500 uppercase">Cashflow (Weekly)</div>
                  <div className={`text-xl font-bold ${results.firstYearCashflow.netCashflow > 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>
                     ${Math.round(results.firstYearCashflow.netCashflow / 52).toLocaleString()}
                  </div>
               </div>
               <div className="bg-white p-4 rounded shadow-sm text-center">
                  <div className="text-xs text-gray-500 uppercase">Cashflow (Annual)</div>
                  <div className={`text-xl font-bold ${results.firstYearCashflow.netCashflow > 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>
                     ${Math.round(results.firstYearCashflow.netCashflow).toLocaleString()}
                  </div>
               </div>
               <div className="bg-white p-4 rounded shadow-sm text-center">
                  <div className="text-xs text-gray-500 uppercase">Cash Required</div>
                  <div className="text-xl font-bold text-[#064E2C]">${totalCashRequired.toLocaleString()}</div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-8">
            {/* Column 1: Property, Finance, Detailed Costs */}
            <div className="space-y-6">
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="font-serif font-bold text-[#064E2C] mb-3 border-b border-gray-200 pb-2">Property & Finance</h3>
                  <table className="w-full text-sm">
                     <tbody>
                        <TableRow label="Purchase Price" value={inputs.purchasePrice} />
                        <TableRow label="Loan Amount" value={results.loanAmount} />
                        <tr><td className="py-1 text-gray-700">Interest Rate</td><td className="text-right font-medium">{inputs.interestRate}%</td></tr>
                        <tr><td className="py-1 text-gray-700">Loan Term</td><td className="text-right font-medium">{inputs.loanTermYears} Yrs ({inputs.isInterestOnly ? `IO ${inputs.interestOnlyYears}yr` : 'P&I'})</td></tr>
                     </tbody>
                  </table>
               </div>

               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="font-serif font-bold text-[#064E2C] mb-3 border-b border-gray-200 pb-2">Estimated Upfront Costs</h3>
                  <table className="w-full text-sm">
                     <tbody>
                        <TableRow label={`Deposit (${inputs.depositPercent}%)`} value={depositAmount} />
                        <TableRow label="Stamp Duty" value={inputs.stampDuty} />
                        <TableRow label="Buyer's Agent Fee" value={inputs.buyersAgentFee} />
                        <TableRow label="Solicitor / Conveyancer" value={inputs.solicitorFee} />
                        <TableRow label="Building & Pest" value={inputs.buildingPestFee} />
                        {inputs.otherUpfront > 0 && <TableRow label="Misc / Other" value={inputs.otherUpfront} /> }
                        <tr className="font-bold text-[#064E2C] border-t border-gray-200">
                           <td className="py-2 pt-3">Total Cash Required</td>
                           <td className="py-2 pt-3 text-right">${totalCashRequired.toLocaleString()}</td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Column 2: Detailed Cashflow */}
            <div className="space-y-6">
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 h-full">
                  <h3 className="font-serif font-bold text-[#064E2C] mb-3 border-b border-gray-200 pb-2">Current Cashflow Position</h3>
                  <table className="w-full text-sm">
                     <tbody>
                        <TableRow label="Gross Rental Income" value={results.firstYearCashflow.potentialGrossRent} />
                         <tr className="text-gray-500 italic text-xs">
                           <td className="pl-4 py-1">Less: Vacancy ({inputs.vacancyWeeks} wks)</td>
                           <td className="text-right py-1">-${Math.round(results.firstYearCashflow.vacancyLoss).toLocaleString()}</td>
                        </tr>
                        <tr className="font-semibold text-[#064E2C] bg-[#FFFCED]">
                           <td className="py-2 pl-2">Effective Gross Rent</td>
                           <td className="py-2 pr-2 text-right">${Math.round(results.firstYearCashflow.effectiveGrossRent).toLocaleString()}</td>
                        </tr>
                        
                        <tr><td colSpan={2} className="py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Expenses</td></tr>
                        
                        <TableRow label="Mortgage Repayments" value={results.firstYearCashflow.mortgageRepayments} />
                        <TableRow label="Mgmt Fees" value={results.firstYearCashflow.managementFees} />
                        <TableRow label="Council Rates" value={inputs.councilRates} />
                        <TableRow label="Insurance" value={inputs.insurance} />
                        <TableRow label="Repairs & Maint" value={inputs.repairsMaintenance} />
                        {inputs.landTax > 0 && <TableRow label="Land Tax" value={inputs.landTax} />}
                        {inputs.bodyCorp > 0 && <TableRow label="Body Corporate" value={inputs.bodyCorp} />}
                        {inputs.otherExpenses > 0 && <TableRow label="Other Expenses" value={inputs.otherExpenses} />}

                        <tr className="font-bold text-[#064E2C] border-t-2 border-[#C6A672] text-base">
                           <td className="py-3">Net Cashflow</td>
                           <td className={`py-3 text-right ${results.firstYearCashflow.netCashflow > 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>
                              ${Math.round(results.firstYearCashflow.netCashflow).toLocaleString()}
                           </td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>

      {/* PAGE 2: CHARTS & PROJECTIONS */}
      <div id="print-page-2" className="w-[900px] h-auto bg-white p-10 font-sans text-gray-800 flex flex-col justify-between">
         <div>
            {/* Small Header Context */}
            <div className="border-b border-gray-200 pb-4 mb-8 flex justify-between items-end">
               <h3 className="text-xl font-serif font-bold text-[#064E2C]">Projections & Forecast</h3>
               <span className="text-sm text-gray-400">Page 2</span>
            </div>

            {/* Chart Section */}
            <div className="mb-10">
               <ProjectionChart 
                  data={results.projections} 
                  positiveCashflowYear={results.positiveCashflowYear} 
                  isPrintMode={true} 
               />
            </div>

            {/* Full Projection Table */}
            <div className="mb-10">
               <h3 className="font-serif font-bold text-[#064E2C] mb-3 border-b border-gray-200 pb-2">10 Year Projection</h3>
               <table className="w-full text-xs text-left">
                  <thead className="bg-[#064E2C] text-white">
                     <tr>
                        <th className="p-2">Year</th>
                        <th className="p-2">Value</th>
                        <th className="p-2">Loan</th>
                        <th className="p-2">Equity</th>
                        <th className="p-2">Rent (Wk)</th>
                        <th className="p-2 text-right">Cashflow (Yr)</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {results.projections.slice(0, 11).map(p => (
                        <tr key={p.year}>
                           <td className="p-2 font-medium">Yr {p.year}</td>
                           <td className="p-2">${Math.round(p.propertyValue).toLocaleString()}</td>
                           <td className="p-2 text-gray-500">${Math.round(p.loanBalance).toLocaleString()}</td>
                           <td className="p-2 font-medium text-green-700">${Math.round(p.equity).toLocaleString()}</td>
                           <td className="p-2">${Math.round(p.weeklyRent).toLocaleString()}</td>
                           <td className={`p-2 text-right font-bold ${p.netCashflow > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              ${Math.round(p.netCashflow).toLocaleString()}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
         
         {/* Extended Disclaimer for PDF */}
         <div className="bg-gray-50 p-4 rounded text-[10px] text-gray-500 leading-relaxed border-t border-gray-200">
            {DISCLAIMER_TEXT}
         </div>
      </div>
      </>
   )
}

// --- SHARE MODAL COMPONENT ---

interface ShareModalProps {
  onClose: () => void;
  onGenerate: (data: UserDetails) => Promise<string | null>;
  isGenerating: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({ onClose, onGenerate, isGenerating }) => {
  // Local state matches the Zoho form fields exactly
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    purchaseType: 'Investment (Residential)' // Default mapped to LEADCF2
  });
  
  const [generatedFile, setGeneratedFile] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [zohoSubmitted, setZohoSubmitted] = useState(false);

  // NOTE: This handles the Dual Action:
  // 1. Generate the PDF Client Side
  // 2. Submit the Form to Zoho via hidden iframe
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct UserDetails for PDF generation (combining names)
    const pdfDetails: UserDetails = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      goal: formData.purchaseType.includes('Investment') ? 'Investment' : 'Owner Occupier'
    };

    // 1. Generate PDF
    const fileName = await onGenerate(pdfDetails);
    if (fileName) {
       setGeneratedFile(fileName);
       
       // 2. Trigger Zoho Submission via the hidden formRef
       // We use a small timeout to allow UI update if needed
       if (formRef.current) {
          formRef.current.submit();
          setZohoSubmitted(true);
       }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] max-w-md w-full p-8 shadow-2xl animate-fade-in relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!generatedFile ? (
           // STEP 1: Form
           <>
              <h3 className="text-2xl font-serif font-bold text-[#064E2C] mb-2 text-center">Download Report</h3>
              <p className="text-center text-gray-500 text-sm mb-6">Enter your details to generate and download the full analysis PDF. One of our strategists will be in touch.</p>
              
              {/* HIDDEN IFRAME FOR ZOHO TARGET */}
              <iframe name="zoho_hidden_frame" id="zoho_hidden_frame" className="hidden" style={{display:'none'}}></iframe>

              {/* ACTUAL FORM THAT SUBMITS TO ZOHO */}
              <form 
                ref={formRef}
                action={ZOHO_CONFIG.actionUrl} 
                method="POST" 
                target="zoho_hidden_frame"
                onSubmit={handleSubmit} 
                className="space-y-4"
              >
               {/* Zoho Hidden Fields */}
               <input type="hidden" name="xnQsjsdp" value={ZOHO_CONFIG.xnQsjsdp} />
               <input type="hidden" name="xmIwtLD" value={ZOHO_CONFIG.xmIwtLD} />
               <input type="hidden" name="actionType" value={ZOHO_CONFIG.actionType} />
               <input type="hidden" name="returnURL" value={ZOHO_CONFIG.returnURL} />

               {/* FIRST NAME */}
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input 
                     required
                     name="First Name" 
                     type="text" 
                     className="w-full rounded-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#064E2C] focus:border-transparent outline-none"
                     value={formData.firstName}
                     onChange={e => setFormData({...formData, firstName: e.target.value})}
                  />
               </div>

               {/* LAST NAME */}
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input 
                     required
                     name="Last Name" 
                     type="text" 
                     className="w-full rounded-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#064E2C] focus:border-transparent outline-none"
                     value={formData.lastName}
                     onChange={e => setFormData({...formData, lastName: e.target.value})}
                  />
               </div>

               {/* EMAIL */}
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input 
                     required
                     name="Email"
                     type="email" 
                     className="w-full rounded-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#064E2C] focus:border-transparent outline-none"
                     value={formData.email}
                     onChange={e => setFormData({...formData, email: e.target.value})}
                  />
               </div>

               {/* PHONE / MOBILE */}
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone / Mobile</label>
                  <input 
                     required
                     name="Phone"
                     type="tel" 
                     className="w-full rounded-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[#064E2C] focus:border-transparent outline-none"
                     value={formData.phone}
                     onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
               </div>
               
               {/* TYPE OF PURCHASE (LEADCF2) */}
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type of Purchase</label>
                  <div className="relative">
                    <select 
                      name="LEADCF2"
                      value={formData.purchaseType}
                      onChange={(e) => setFormData({...formData, purchaseType: e.target.value})}
                      className="w-full rounded-full border border-gray-300 px-4 py-2 appearance-none focus:ring-2 focus:ring-[#064E2C] focus:border-transparent outline-none bg-white"
                    >
                      <option value="-None-">-None-</option>
                      <option value="Investment (Residential)">Investment (Residential)</option>
                      <option value="Primary Residence">Primary Residence</option>
                      <option value="Investment (Commercial)">Investment (Commercial)</option>
                      <option value="Primary Commercial">Primary Commercial</option>
                      <option value="SMSF Investment">SMSF Investment</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
               </div>

               <button 
                  type="submit" 
                  disabled={isGenerating}
                  className="w-full mt-6 bg-[#064E2C] text-white font-bold py-3 rounded-full hover:bg-[#053d22] transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
               >
                  {isGenerating ? (
                     <>
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Generating...
                     </>
                  ) : (
                     'Generate & Enquire'
                  )}
               </button>
              </form>
           </>
        ) : (
           // STEP 2: Success
           <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                 <svg className="w-8 h-8 text-[#064E2C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
              </div>
              <div>
                 <h3 className="text-2xl font-serif font-bold text-[#064E2C] mb-2">Success!</h3>
                 <p className="text-gray-600 text-sm">
                    Your PDF report has been downloaded.
                 </p>
                 {zohoSubmitted && (
                     <p className="text-xs text-[#064E2C] mt-2 font-medium">
                        Your inquiry has been sent to our team.
                     </p>
                 )}
                 <div className="bg-amber-50 border border-[#C6A672] p-4 rounded-xl mt-4 text-left">
                    <p className="text-sm font-medium text-[#064E2C] mb-1">Check your downloads</p>
                    <p className="text-xs text-gray-600">
                       The file <strong>{generatedFile}</strong> should appear in your browser downloads shortly.
                    </p>
                 </div>
              </div>
              
              <button onClick={onClose} className="block w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-full hover:bg-gray-200 transition-colors">
                 Close
              </button>
           </div>
        )}
      </div>
    </div>
  );
}

// Helper Components for App.tsx

const KPITile: React.FC<{ label: string; value: string; subtext: string; highlight?: boolean }> = ({ label, value, subtext, highlight }) => (
  <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#C6A672]/30 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</span>
    <span className={`text-2xl md:text-3xl font-serif font-bold ${highlight === true ? 'text-[#064E2C]' : highlight === false ? 'text-red-500' : 'text-[#0B090A]'}`}>
      {value}
    </span>
    <span className="text-xs text-[#C6A672] mt-1 font-medium">{subtext}</span>
  </div>
);

const TableRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <tr className="border-b border-gray-50 last:border-0">
    <td className="px-4 py-3 text-gray-700">{label}</td>
    <td className="px-4 py-3 text-right font-medium">${Math.round(value).toLocaleString()}</td>
  </tr>
);

export default App;