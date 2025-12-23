
import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_INPUTS, COLORS, LOGO_BASE64 } from './constants';
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
    <p className="mb-2"><strong>Important Information:</strong> This calculator is a modeling tool provided for illustrative purposes only and does not constitute financial, legal, or tax advice. Results are estimates based on the inputs you provide and do not take into account your personal financial circumstances, objectives, or needs.</p>
    <ul className="list-disc pl-5 space-y-1 mb-2">
      <li><strong>Taxation & Stage 3:</strong> Calculations are based on the 2024-25 Australian Federal Tax Brackets (Stage 3). Tax offsets assume property losses are fully deductible against your provided salary.</li>
      <li><strong>Depreciation:</strong> Estimates are general based on property age and type. For exact figures, a Quantity Surveyor report is required.</li>
      <li><strong>Estimates Only:</strong> This is a model, not a prediction. Actual amounts and returns may vary due to market forces and individual circumstances.</li>
    </ul>
    <p><strong>Limitation of Liability:</strong> Homez Buyers Advocacy accepts no liability for errors or decisions made based on this tool. Always consult with a qualified financial advisor.</p>
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

  const sendEmailWithReport = async (userDetails: UserDetails, pdf: jsPDF, fileName: string) => {
    setIsDispatching(true);
    setDispatchError(null);
    
    try {
      const pdfBase64 = pdf.output('datauristring').split(',')[1];

      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: userDetails.email,
          userName: userDetails.name,
          pdfBase64: pdfBase64,
          fileName: fileName
        })
      });

      if (!response.ok) throw new Error('Failed to dispatch email');
    } catch (error) {
      console.error("Email Error:", error);
      setDispatchError("The report was downloaded, but the automated email failed. Please save the file manually.");
    } finally {
      setIsDispatching(false);
    }
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
        
        const fileName = `Homez_Analysis_${userDetails.name.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName); // User gets the file immediately
        
        setIsGenerating(false);
        await sendEmailWithReport(userDetails, pdf, fileName); // Start email process
        return fileName;
      } catch (error) {
        console.error("PDF Error", error);
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
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#064E2C]">Homez Buyers Advocacy</h1>
          <p className="text-[#C6A672] text-lg font-medium">Cashflow & Tax Performance V2.2</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 rounded-full font-bold bg-[#064E2C] text-white shadow-xl hover:bg-[#053d22] transition-all transform active:scale-95">
          Generate Full Report
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-[24px] p-6 shadow-sm border border-[#C6A672]/30">
            <h2 className="text-xl font-serif font-semibold text-[#064E2C] mb-4 text-center">Investment Parameters</h2>
            <InputGroup label="Purchase Price"><NumberInput prefix="$" value={inputs.purchasePrice} onChange={(e) => handlePropertyChange('purchasePrice', Number(e.target.value))} /></InputGroup>
            <InputGroup label="Weekly Rent"><NumberInput prefix="$" value={inputs.weeklyRent} onChange={(e) => handleInputChange('weeklyRent', Number(e.target.value))} /></InputGroup>
            <InputGroup label="Interest Rate %"><NumberInput suffix="%" value={inputs.interestRate} onChange={(e) => handleInputChange('interestRate', Number(e.target.value))} /></InputGroup>
            <InputGroup label="Annual Salary"><NumberInput prefix="$" value={inputs.annualSalary} onChange={(e) => handleInputChange('annualSalary', Number(e.target.value))} /></InputGroup>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPITile label="Post-Tax CF (Wk)" value={`$${Math.round(results.firstYearCashflow.afterTaxCashflow / 52).toLocaleString()}`} subtext="After Refund" highlight={results.firstYearCashflow.afterTaxCashflow > 0} />
            <KPITile label="Gross Yield" value={`${((results.firstYearCashflow.effectiveGrossRent / inputs.purchasePrice) * 100).toFixed(2)}%`} subtext="Year 1" />
            <KPITile label="Tax Refund" value={`$${Math.round(results.firstYearCashflow.taxRefund).toLocaleString()}`} subtext="Annual Est." />
            <KPITile label="Cash Needed" value={`$${Math.round(totalCashRequired).toLocaleString()}`} subtext="Deposit + Costs" />
          </div>

          <ProjectionChart data={results.projections} positiveCashflowYear={results.positiveCashflowAfterTaxYear} />
          
          <div className="bg-white rounded-[24px] p-6 border border-[#C6A672]/30 shadow-sm overflow-hidden">
             <h3 className="text-lg font-serif font-semibold text-[#064E2C] mb-4">Cashflow Analysis (Year 1)</h3>
             <table className="w-full text-sm">
                <tbody>
                   <TableRow label="Effective Gross Rent" value={results.firstYearCashflow.effectiveGrossRent} />
                   <TableRow label="Mortgage Payments" value={-results.firstYearCashflow.mortgageRepayments} />
                   <TableRow label="Operating Expenses" value={-results.firstYearCashflow.otherOperatingExpenses} />
                   <tr className="font-bold border-t border-gray-100"><td className="py-3">Pre-Tax Cashflow</td><td className="text-right text-red-500">${Math.round(results.firstYearCashflow.netCashflow).toLocaleString()}</td></tr>
                   <tr className="text-green-600 font-medium italic"><td>+ Estimated Tax Refund</td><td className="text-right">${Math.round(results.firstYearCashflow.taxRefund).toLocaleString()}</td></tr>
                   <tr className="font-black text-lg bg-[#064E2C] text-white"><td className="px-4 py-3 rounded-l-lg">Post-Tax Position</td><td className="px-4 py-3 text-right rounded-r-lg">${Math.round(results.firstYearCashflow.afterTaxCashflow).toLocaleString()}</td></tr>
                </tbody>
             </table>
          </div>
        </div>
      </div>

      <div className="mt-12 p-8 bg-white rounded-3xl border border-gray-100 text-[10px] text-gray-400 leading-relaxed shadow-sm">
        {DISCLAIMER_TEXT}
      </div>

      {isModalOpen && (
        <ShareModal 
          onClose={() => setIsModalOpen(false)} 
          onGenerate={generatePDF} 
          isGenerating={isGenerating} 
          isDispatching={isDispatching} 
          dispatchError={dispatchError} 
        />
      )}
      <div className="fixed top-[-9999px] left-[-9999px]"><PrintReport inputs={inputs} results={results} clientDetails={clientDetails} /></div>
    </div>
  );
};

const KPITile: React.FC<{ label: string; value: string; subtext: string; highlight?: boolean }> = ({ label, value, subtext, highlight }) => (
  <div className="bg-white rounded-2xl p-5 border border-[#C6A672]/30 shadow-sm text-center">
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-xl font-serif font-bold ${highlight === true ? 'text-[#064E2C]' : highlight === false ? 'text-red-500' : 'text-gray-900'}`}>{value}</p>
    <p className="text-[9px] text-[#C6A672] font-medium">{subtext}</p>
  </div>
);

const TableRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <tr className="border-b border-gray-50"><td className="py-3 text-gray-600">{label}</td><td className="py-3 text-right font-bold">${Math.round(value).toLocaleString()}</td></tr>
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
      <div className="bg-white rounded-[32px] max-w-md w-full p-10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-300 hover:text-gray-600">✕</button>
        {!isDone ? (
          <>
            <h3 className="text-2xl font-serif font-bold text-[#064E2C] mb-4 text-center">Personalized Strategy Report</h3>
            <p className="text-gray-500 text-sm text-center mb-8">We will generate your PDF and send a copy to your email address.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="First Name" className="w-full rounded-full border border-gray-200 px-5 py-3 outline-none focus:ring-2 focus:ring-[#064E2C]/20" onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input required placeholder="Last Name" className="w-full rounded-full border border-gray-200 px-5 py-3 outline-none focus:ring-2 focus:ring-[#064E2C]/20" onChange={e => setFormData({...formData, lastName: e.target.value})} />
              <input required type="email" placeholder="Email Address" className="w-full rounded-full border border-gray-200 px-5 py-3 outline-none focus:ring-2 focus:ring-[#064E2C]/20" onChange={e => setFormData({...formData, email: e.target.value})} />
              <input required type="tel" placeholder="Mobile Number" className="w-full rounded-full border border-gray-200 px-5 py-3 outline-none focus:ring-2 focus:ring-[#064E2C]/20" onChange={e => setFormData({...formData, phone: e.target.value})} />
              <button type="submit" disabled={isGenerating || isDispatching} className="w-full mt-6 bg-[#064E2C] text-white font-bold py-4 rounded-full shadow-lg disabled:opacity-50">
                {isGenerating ? 'Creating PDF...' : isDispatching ? 'Sending Email...' : 'Generate & Send Report'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-[#064E2C] text-2xl">✓</div>
            <h3 className="text-2xl font-serif font-bold text-[#064E2C]">Report Ready</h3>
            <p className="text-gray-500 text-sm">{dispatchError ? dispatchError : `A professional copy has been sent to ${formData.email}. Homez Admin has been CC'd.`}</p>
            <button onClick={onClose} className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-full">Return to Calculator</button>
          </div>
        )}
      </div>
    </div>
  );
};

const PrintReport: React.FC<{ inputs: InputState, results: CalculationResult, clientDetails: UserDetails | null }> = ({ inputs, results, clientDetails }) => (
  <div className="bg-white p-12 w-[800px] font-sans">
    <div id="print-page-1" className="h-[1100px] relative border-b-4 border-[#064E2C] pb-10 mb-10">
      <h1 className="text-4xl font-serif font-bold text-[#064E2C] mb-2">Homez Property Analysis</h1>
      <p className="text-[#C6A672] font-bold uppercase tracking-widest mb-10">Confidential Strategy Report</p>
      <div className="grid grid-cols-2 gap-10 mb-10">
        <div className="bg-gray-50 p-6 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Prepared For</p>
          <p className="text-xl font-bold">{clientDetails?.name || 'Valued Client'}</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Property Value</p>
          <p className="text-xl font-bold">${inputs.purchasePrice.toLocaleString()}</p>
        </div>
      </div>
      <div className="bg-[#064E2C] text-white p-10 rounded-3xl grid grid-cols-3 gap-6 text-center">
        <div><p className="text-[10px] opacity-60 mb-1">CASH REQUIRED</p><p className="text-2xl font-bold">${Math.round(results.loanAmount * 0.2 + results.upfrontCostsTotal).toLocaleString()}</p></div>
        <div><p className="text-[10px] opacity-60 mb-1">WEEKLY CASHFLOW</p><p className="text-2xl font-bold">${Math.round(results.firstYearCashflow.afterTaxCashflow / 52).toLocaleString()}</p></div>
        <div><p className="text-[10px] opacity-60 mb-1">GROSS YIELD</p><p className="text-2xl font-bold">{((results.firstYearCashflow.effectiveGrossRent / inputs.purchasePrice) * 100).toFixed(2)}%</p></div>
      </div>
    </div>
    <div id="print-page-2" className="h-[1100px]">
      <h2 className="text-2xl font-serif font-bold mb-6">10-Year Growth Forecast</h2>
      <ProjectionChart data={results.projections} positiveCashflowYear={results.positiveCashflowAfterTaxYear} isPrintMode={true} />
    </div>
  </div>
);

export default App;
