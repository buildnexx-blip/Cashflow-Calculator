import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_INPUTS, COLORS } from '../constants';
import { InputState, CalculationResult, AustralianState, DepreciationLevel } from '../types';
import { calculateProjections, estimateStampDuty } from '../utils/calculations';
import { NumberInput, SelectInput, InputGroup } from '../components/InputGroup';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// --- Types ---
type StrategyType = 'Growth' | 'Yield' | 'Balanced' | 'Custom';

interface Scenario {
  id: 'A' | 'B';
  name: string;
  color: string;
  strategy: StrategyType;
  inputs: InputState;
}

const ComparePage: React.FC = () => {
  // Global Settings (Applies to both)
  const [globalSalary, setGlobalSalary] = useState<number>(120000);

  // Scenario State
  const [scenarioA, setScenarioA] = useState<Scenario>({
    id: 'A',
    name: 'Scenario 1',
    color: COLORS.primary,
    strategy: 'Growth',
    inputs: { 
        ...DEFAULT_INPUTS, 
        purchasePrice: 850000, 
        weeklyRent: 650, 
        state: AustralianState.VIC, 
        capitalGrowthPercent: 7, 
        rentalGrowthPercent: 5,
        annualSalary: 120000,
        stampDuty: estimateStampDuty(AustralianState.VIC, 850000)
    }
  });

  const [scenarioB, setScenarioB] = useState<Scenario>({
    id: 'B',
    name: 'Scenario 2',
    color: COLORS.accent,
    strategy: 'Yield',
    inputs: { 
        ...DEFAULT_INPUTS, 
        purchasePrice: 650000, 
        weeklyRent: 680, 
        state: AustralianState.QLD, 
        capitalGrowthPercent: 5, 
        rentalGrowthPercent: 4,
        annualSalary: 120000,
        stampDuty: estimateStampDuty(AustralianState.QLD, 650000)
    }
  });

  // Sync Salary changes to both inputs to ensure tax calcs are accurate
  useEffect(() => {
    setScenarioA(prev => ({ ...prev, inputs: { ...prev.inputs, annualSalary: globalSalary } }));
    setScenarioB(prev => ({ ...prev, inputs: { ...prev.inputs, annualSalary: globalSalary } }));
  }, [globalSalary]);

  // Calculate Results
  const resultsA = calculateProjections(scenarioA.inputs);
  const resultsB = calculateProjections(scenarioB.inputs);

  // Handlers
  const handleUpdate = (id: 'A' | 'B', field: keyof InputState, value: any) => {
    const setter = id === 'A' ? setScenarioA : setScenarioB;
    setter(prev => {
      const newInputs = { ...prev.inputs, [field]: value };
      
      // Auto-calc stamp duty
      if (field === 'purchasePrice' || field === 'state') {
        newInputs.stampDuty = estimateStampDuty(newInputs.state, newInputs.purchasePrice);
      }

      // If growth assumptions are manually changed, switch to Custom strategy
      let newStrategy = prev.strategy;
      if (field === 'capitalGrowthPercent' || field === 'rentalGrowthPercent') {
        newStrategy = 'Custom';
      }

      return { ...prev, inputs: newInputs, strategy: newStrategy };
    });
  };

  const handleNameChange = (id: 'A' | 'B', name: string) => {
    const setter = id === 'A' ? setScenarioA : setScenarioB;
    setter(prev => ({ ...prev, name }));
  };

  const handleStrategyChange = (id: 'A' | 'B', strategy: StrategyType) => {
    const setter = id === 'A' ? setScenarioA : setScenarioB;
    setter(prev => {
        const newInputs = { ...prev.inputs };
        if (strategy === 'Growth') {
            newInputs.capitalGrowthPercent = 7;
            newInputs.rentalGrowthPercent = 5;
        } else if (strategy === 'Yield') {
            newInputs.capitalGrowthPercent = 5;
            newInputs.rentalGrowthPercent = 4;
        } else if (strategy === 'Balanced') {
            newInputs.capitalGrowthPercent = 6;
            newInputs.rentalGrowthPercent = 4;
        }
        return { ...prev, strategy, inputs: newInputs };
    });
  };

  // --- Derived Metrics for Comparison ---
  const equityGap10Years = resultsA.projections[10].equity - resultsB.projections[10].equity;
  const equityGap30Years = resultsA.projections[30].equity - resultsB.projections[30].equity;
  const cashflowDelta = resultsA.firstYearCashflow.afterTaxCashflow - resultsB.firstYearCashflow.afterTaxCashflow;
  
  // Chart Data Preparation
  const chartData = resultsA.projections.map((pA, i) => {
    const pB = resultsB.projections[i];
    return {
      year: pA.year,
      [`equity${scenarioA.id}`]: pA.equity,
      [`equity${scenarioB.id}`]: pB.equity,
      [`cashflow${scenarioA.id}`]: pA.afterTaxCashflow,
      [`cashflow${scenarioB.id}`]: pB.afterTaxCashflow,
    };
  });

  const currency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-[#FFFCED] pb-24">
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-[#C6A672]/20 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
           {/* Back Button & Branding */}
           <div className="flex items-center gap-6">
               <Link 
                  to="/"
                  className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-[#064E2C] transition-colors"
               >
                  <span className="w-8 h-8 rounded-full border border-gray-200 group-hover:border-[#064E2C] flex items-center justify-center transition-colors">←</span>
                  <span>Return to Calculator</span>
               </Link>
               <div className="h-8 w-[1px] bg-gray-100 hidden md:block" />
               <div className="flex items-center gap-3 select-none">
                  <div className="w-10 h-10 bg-[#064E2C] rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg">H</div>
                  <div className="flex flex-col">
                      <span className="font-serif text-[#064E2C] font-bold tracking-tight text-xl leading-none">Homez</span>
                      <span className="text-[10px] text-[#C6A672] font-bold uppercase tracking-[0.25em] leading-none mt-1">Comparator</span>
                  </div>
               </div>
           </div>
           
           {/* Global Investor Settings */}
           <div className="flex items-center gap-4 bg-[#F9FAFB] p-2 rounded-full border border-gray-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Investor Profile</span>
              <div className="w-[1px] h-6 bg-gray-200" />
              <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-gray-700">Annual Income:</span>
                 <input 
                    type="number" 
                    value={globalSalary} 
                    onChange={(e) => setGlobalSalary(Number(e.target.value))}
                    className="w-32 bg-white border border-gray-200 rounded-full px-3 py-1 text-sm font-bold text-[#064E2C] focus:outline-none focus:ring-2 focus:ring-[#064E2C]/20"
                 />
              </div>
           </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-8 md:pt-12">
        
        {/* --- COMPARISON DASHBOARD --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            
            {/* INPUT COLUMN A */}
            <div className="lg:col-span-3 space-y-6">
                <ScenarioCard 
                    scenario={scenarioA} 
                    results={resultsA} 
                    onUpdate={(f, v) => handleUpdate('A', f, v)}
                    onNameChange={(v) => handleNameChange('A', v)}
                    onStrategyChange={(v) => handleStrategyChange('A', v)}
                    isWinnerEquity={equityGap30Years > 0}
                    isWinnerCashflow={cashflowDelta > 0}
                />
            </div>

            {/* CENTRAL CHARTS & METRICS */}
            <div className="lg:col-span-6 space-y-8">
                
                {/* The Verdict Section */}
                <div className="bg-white rounded-[32px] p-8 border border-[#064E2C]/10 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#064E2C] to-[#D97706]" />
                    <h2 className="text-2xl font-serif font-bold text-[#064E2C] mb-6 text-center">Wealth Velocity Analysis</h2>
                    
                    <div className="grid grid-cols-2 gap-8 mb-8">
                         <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">30 Year Wealth Gap</div>
                             <div className="text-3xl font-serif font-bold text-[#064E2C] mb-1">
                                {currency(Math.abs(equityGap30Years))}
                             </div>
                             <div className="text-xs font-bold text-gray-500">
                                Favoring <span className={`${equityGap30Years > 0 ? 'text-[#064E2C]' : 'text-[#D97706]'}`}>{equityGap30Years > 0 ? scenarioA.name : scenarioB.name}</span>
                             </div>
                         </div>
                         <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Weekly Cashflow Delta</div>
                             <div className="text-3xl font-serif font-bold text-[#064E2C] mb-1">
                                {currency(Math.abs(cashflowDelta / 52))}
                             </div>
                             <div className="text-xs font-bold text-gray-500">
                                Favoring <span className={`${cashflowDelta > 0 ? 'text-[#064E2C]' : 'text-[#D97706]'}`}>{cashflowDelta > 0 ? scenarioA.name : scenarioB.name}</span>
                             </div>
                         </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={scenarioA.color} stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor={scenarioA.color} stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={scenarioB.color} stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor={scenarioB.color} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9CA3AF'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9CA3AF'}} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}m`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    formatter={(value: number) => currency(value)}
                                    labelFormatter={(l) => `Year ${l}`}
                                />
                                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 600}} />
                                <Area type="monotone" name={`${scenarioA.name} Equity`} dataKey={`equity${scenarioA.id}`} stroke={scenarioA.color} fillOpacity={1} fill="url(#colorA)" strokeWidth={3} />
                                <Area type="monotone" name={`${scenarioB.name} Equity`} dataKey={`equity${scenarioB.id}`} stroke={scenarioB.color} fillOpacity={1} fill="url(#colorB)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cashflow Comparison Chart */}
                <div className="bg-white rounded-[32px] p-8 border border-[#064E2C]/10 shadow-sm">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Net Cashflow Trajectory (Post-Tax)</h3>
                    <div className="h-[250px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value: number) => currency(value)} cursor={{fill: 'transparent'}} />
                                <Bar dataKey={`cashflow${scenarioA.id}`} name={`${scenarioA.name} CF`} fill={scenarioA.color} radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey={`cashflow${scenarioB.id}`} name={`${scenarioB.name} CF`} fill={scenarioB.color} radius={[4, 4, 0, 0]} barSize={20} />
                            </ComposedChart>
                         </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* INPUT COLUMN B */}
            <div className="lg:col-span-3 space-y-6">
                <ScenarioCard 
                    scenario={scenarioB} 
                    results={resultsB} 
                    onUpdate={(f, v) => handleUpdate('B', f, v)}
                    onNameChange={(v) => handleNameChange('B', v)}
                    onStrategyChange={(v) => handleStrategyChange('B', v)}
                    isWinnerEquity={equityGap30Years < 0}
                    isWinnerCashflow={cashflowDelta < 0}
                />
            </div>
        </div>

      </div>
    </div>
  );
};

// --- Subcomponents ---

const ScenarioCard: React.FC<{
  scenario: Scenario;
  results: CalculationResult;
  onUpdate: (field: keyof InputState, value: any) => void;
  onNameChange: (val: string) => void;
  onStrategyChange: (val: StrategyType) => void;
  isWinnerEquity: boolean;
  isWinnerCashflow: boolean;
}> = ({ scenario, results, onUpdate, onNameChange, onStrategyChange, isWinnerEquity, isWinnerCashflow }) => {
    
  const currency = (val: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
  const percent = (val: number) => `${val.toFixed(2)}%`;
  const totalCash = results.upfrontCostsTotal + (scenario.inputs.purchasePrice * (scenario.inputs.depositPercent/100));

  return (
    <div className={`bg-white rounded-[32px] overflow-hidden border-2 transition-all duration-300 ${isWinnerEquity ? 'border-[#064E2C] shadow-2xl scale-[1.02]' : 'border-transparent shadow-lg'}`}>
        {/* Header */}
        <div className="p-6" style={{ backgroundColor: `${scenario.color}15` }}>
            <div className="flex flex-col gap-3 mb-4">
                <input 
                    value={scenario.name}
                    onChange={(e) => onNameChange(e.target.value)}
                    className="w-full bg-transparent font-serif font-bold text-2xl text-gray-900 focus:outline-none border-b border-gray-900/10 focus:border-gray-900/50 pb-1"
                />
                <select 
                    value={scenario.strategy} 
                    onChange={(e) => onStrategyChange(e.target.value as StrategyType)}
                    className="text-xs font-bold text-[#064E2C] uppercase tracking-widest bg-white/50 border border-gray-900/10 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#064E2C]/20 cursor-pointer"
                >
                    <option value="Growth">Growth Strategy</option>
                    <option value="Yield">Yield Strategy</option>
                    <option value="Balanced">Balanced Strategy</option>
                    <option value="Custom">Custom</option>
                </select>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                <span>Entry Cost: {currency(totalCash)}</span>
                <div className="flex gap-1">
                    {isWinnerEquity && <span className="bg-[#064E2C] text-white px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">Growth Lead</span>}
                    {isWinnerCashflow && <span className="bg-[#C6A672] text-white px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">Cashflow Lead</span>}
                </div>
            </div>
        </div>

        {/* Key Metrics */}
        <div className="px-6 py-6 grid grid-cols-2 gap-4 border-b border-gray-50">
            <div>
                <div className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Gross Yield</div>
                <div className="text-xl font-bold text-gray-800">{percent((results.firstYearCashflow.effectiveGrossRent / scenario.inputs.purchasePrice) * 100)}</div>
            </div>
            <div>
                <div className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Realized CF</div>
                <div className={`text-xl font-bold ${results.firstYearCashflow.afterTaxCashflow >= 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>
                    {currency(results.firstYearCashflow.afterTaxCashflow)}
                </div>
                <div className="text-[9px] text-gray-400">per annum</div>
            </div>
        </div>

        {/* Inputs */}
        <div className="p-6 space-y-6">
            <Group title="Acquisition">
                <InputRow label="Price">
                    <NumberInput prefix="$" value={scenario.inputs.purchasePrice} onChange={(e) => onUpdate('purchasePrice', Number(e.target.value))} className="py-2 text-sm" />
                </InputRow>
                <InputRow label="State">
                    <SelectInput value={scenario.inputs.state} onChange={(e) => onUpdate('state', e.target.value)} className="py-2 text-sm">
                        {Object.values(AustralianState).map(s => <option key={s} value={s}>{s}</option>)}
                    </SelectInput>
                </InputRow>
                <InputRow label="Deposit %">
                    <NumberInput suffix="%" value={scenario.inputs.depositPercent} onChange={(e) => onUpdate('depositPercent', Number(e.target.value))} className="py-2 text-sm" />
                </InputRow>
                <div className="flex justify-between text-[10px] text-gray-400 font-medium px-2 mt-2">
                    <span>Stamp Duty: {currency(scenario.inputs.stampDuty)}</span>
                    <span>Dep Amt: {currency(scenario.inputs.purchasePrice * (scenario.inputs.depositPercent / 100))}</span>
                </div>
            </Group>

            <Group title="Income & Loan">
                <InputRow label="Rent (Wk)">
                    <NumberInput prefix="$" value={scenario.inputs.weeklyRent} onChange={(e) => onUpdate('weeklyRent', Number(e.target.value))} className="py-2 text-sm" />
                </InputRow>
                <InputRow label="Rate %">
                    <NumberInput suffix="%" value={scenario.inputs.interestRate} onChange={(e) => onUpdate('interestRate', Number(e.target.value))} className="py-2 text-sm" />
                </InputRow>
            </Group>

            <Group title="Holding Costs (Annual)">
                <InputRow label="Rates">
                    <NumberInput prefix="$" value={scenario.inputs.councilRates} onChange={(e) => onUpdate('councilRates', Number(e.target.value))} className="py-2 text-sm" />
                </InputRow>
                <InputRow label="Body Corp">
                    <NumberInput prefix="$" value={scenario.inputs.bodyCorp} onChange={(e) => onUpdate('bodyCorp', Number(e.target.value))} className="py-2 text-sm" />
                </InputRow>
                <InputRow label="Mgmt %">
                    <NumberInput suffix="%" value={scenario.inputs.managementFeePercent} onChange={(e) => onUpdate('managementFeePercent', Number(e.target.value))} className="py-2 text-sm" />
                </InputRow>
            </Group>

            <Group title="Growth Assumptions">
                <InputRow label="Capital %">
                    <NumberInput suffix="%" value={scenario.inputs.capitalGrowthPercent} onChange={(e) => onUpdate('capitalGrowthPercent', Number(e.target.value))} className="py-2 text-sm bg-green-50" />
                </InputRow>
                <InputRow label="Rent %">
                    <NumberInput suffix="%" value={scenario.inputs.rentalGrowthPercent} onChange={(e) => onUpdate('rentalGrowthPercent', Number(e.target.value))} className="py-2 text-sm bg-orange-50" />
                </InputRow>
            </Group>
        </div>
    </div>
  );
};

const Group: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h4 className="text-[10px] font-black text-[#C6A672] uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">{title}</h4>
        <div className="space-y-3">{children}</div>
    </div>
);

const InputRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center gap-3">
        <label className="w-20 text-[11px] font-bold text-gray-500 uppercase tracking-tight">{label}</label>
        <div className="flex-1">{children}</div>
    </div>
);

export default ComparePage;