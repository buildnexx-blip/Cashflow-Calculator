import React, { useState } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  TooltipProps,
  Legend,
  Label
} from 'recharts';
import { YearlyProjection } from '../types';
import { COLORS } from '../constants';

interface ProjectionChartProps {
  data: YearlyProjection[];
  positiveCashflowYear: number | null;
  isPrintMode?: boolean;
}

const formatCurrency = (value: number, decimals = 1) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(decimals)}m`;
  }
  return `$${(value / 1000).toFixed(0)}k`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as YearlyProjection;
    return (
      <div className="bg-white p-6 border border-[#C6A672]/20 rounded-[24px] shadow-2xl min-w-[260px] backdrop-blur-sm">
        <p className="font-serif font-bold text-[#064E2C] mb-4 border-b border-gray-50 pb-3 flex justify-between items-center">
          <span className="text-lg">Year {data.year}</span>
          <span className="text-[9px] text-[#C6A672] font-black uppercase tracking-[0.2em] px-2 py-1 bg-[#FFFCED] rounded-full">Projected</span>
        </p>
        <div className="space-y-3.5 text-sm">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#064E2C]" />
              <span className="text-gray-500 font-semibold text-xs uppercase tracking-widest">Asset Value</span>
            </div>
            <span className="font-bold text-gray-900">{formatCurrency(data.propertyValue, 2)}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FD9B63]" />
              <span className="text-gray-500 font-semibold text-xs uppercase tracking-widest">Wkly Rent</span>
            </div>
            <span className="font-bold text-gray-900">${Math.round(data.weeklyRent)}</span>
          </div>
          <div className="pt-4 border-t border-gray-50 mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pre-Tax Surplus</span>
              <span className={`text-xs font-black ${data.netCashflow >= 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>
                ${Math.round(data.netCashflow / 52).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Post-Tax Surplus</span>
              <span className={`text-xs font-black ${data.afterTaxCashflow >= 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>
                ${Math.round(data.afterTaxCashflow / 52).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ProjectionChart: React.FC<ProjectionChartProps> = ({ data, positiveCashflowYear, isPrintMode = false }) => {
  const [horizon, setHorizon] = useState<number>(30);
  const currentHorizon = isPrintMode ? 30 : horizon;
  const filteredData = data.filter(d => d.year <= currentHorizon);
  const crossoverData = positiveCashflowYear !== null ? data.find(d => d.year === positiveCashflowYear) : null;

  return (
    <div className={`w-full bg-white rounded-[32px] ${isPrintMode ? 'p-0' : 'p-2'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-6">
        <h3 className="font-serif text-2xl font-bold text-[#064E2C]">WEALTH VELOCITY</h3>
        {!isPrintMode && (
          <div className="flex space-x-1.5 bg-gray-50 p-1.5 rounded-full border border-gray-100">
            {[10, 20, 30].map(yr => (
              <button
                key={yr}
                onClick={() => setHorizon(yr)}
                className={`px-6 py-2 rounded-full text-[10px] font-black transition-all uppercase tracking-widest ${
                  horizon === yr 
                    ? 'bg-[#064E2C] text-white shadow-xl' 
                    : 'text-gray-400 hover:text-[#064E2C]'
                }`}
              >
                {yr} Years
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-[450px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 20, right: 60, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
            <XAxis 
              dataKey="year" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 900 }}
              dy={15}
            >
              <Label 
                value="YEAR" 
                offset={-20} 
                position="insideBottom" 
                style={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 900, letterSpacing: '0.2em' }} 
              />
            </XAxis>
            <YAxis 
              yAxisId="left"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatCurrency(val, 0)}
              tick={{ fill: COLORS.primary, fontSize: 10, fontWeight: 900 }}
              dx={-5}
            >
              <Label 
                value="PROPERTY VALUE" 
                angle={-90} 
                position="insideLeft" 
                offset={-45}
                style={{ fill: COLORS.primary, fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textAnchor: 'middle' }} 
              />
            </YAxis>
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
              tick={{ fill: COLORS.accent, fontSize: 10, fontWeight: 900 }}
              dx={5}
            >
              <Label 
                value="GROSS ANNUAL RENT" 
                angle={90} 
                position="insideRight" 
                offset={-45}
                style={{ fill: COLORS.accent, fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textAnchor: 'middle' }} 
              />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#C6A672', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend 
              verticalAlign="bottom" 
              align="center" 
              iconType="circle"
              wrapperStyle={{ paddingTop: '50px', fontSize: '10px', fontWeight: '900', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            />
            <Line 
              yAxisId="left"
              name="Property Valuation"
              type="monotone" 
              dataKey="propertyValue" 
              stroke={COLORS.primary} 
              strokeWidth={4} 
              dot={false}
              activeDot={{ r: 8, fill: COLORS.primary, strokeWidth: 4, stroke: 'white' }}
            />
            <Line 
              yAxisId="right"
              name="Gross Annual Rent"
              type="monotone" 
              dataKey="grossRent" 
              stroke={COLORS.accent} 
              strokeWidth={4} 
              dot={false}
              activeDot={{ r: 8, fill: COLORS.accent, strokeWidth: 4, stroke: 'white' }}
            />
            {positiveCashflowYear !== null && positiveCashflowYear <= currentHorizon && (
              <ReferenceLine 
                x={positiveCashflowYear} 
                stroke={COLORS.dark} 
                strokeDasharray="4 4" 
                yAxisId="left"
                label={{ 
                  value: 'BREAK-EVEN', 
                  position: 'insideTopLeft', 
                  fill: COLORS.dark,
                  fontSize: 9,
                  fontWeight: '900',
                }} 
              />
            )}
            {crossoverData && positiveCashflowYear !== null && positiveCashflowYear <= currentHorizon && (
                <ReferenceDot
                    yAxisId="right"
                    x={positiveCashflowYear}
                    y={crossoverData.grossRent}
                    r={6}
                    fill="white"
                    stroke={COLORS.dark}
                    strokeWidth={3}
                />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {!isPrintMode && <p className="text-[9px] text-gray-300 mt-6 text-center italic font-black uppercase tracking-widest">Note: Growth indices are modeled at {horizon}-year volatility cycles.</p>}
    </div>
  );
};

export default ProjectionChart;