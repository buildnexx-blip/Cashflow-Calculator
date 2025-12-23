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

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as YearlyProjection;
    return (
      <div className="bg-white p-4 border border-[#C6A672] rounded-[16px] shadow-lg min-w-[240px]">
        <p className="font-serif font-bold text-[#064E2C] mb-3 border-b border-gray-100 pb-2 flex justify-between">
          <span>Year {data.year}</span>
          <span className="text-[10px] text-[#C6A672] uppercase tracking-widest mt-1">Growth Index</span>
        </p>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#064E2C]" />
              <span className="text-gray-600 font-medium">Value</span>
            </div>
            <span className="font-bold text-gray-800">{formatCurrency(data.propertyValue, 2)}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FD9B63]" />
              <span className="text-gray-600 font-medium">Weekly Rent</span>
            </div>
            <span className="font-bold text-gray-800">${Math.round(data.weeklyRent)}</span>
          </div>
          <div className="pt-2 border-t border-gray-100 mt-2 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Pre-Tax CF (Wk)</span>
              <span className={`text-xs font-bold ${data.netCashflow >= 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>
                ${Math.round(data.netCashflow / 52).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Post-Tax CF (Wk)</span>
              <span className={`text-xs font-bold ${data.afterTaxCashflow >= 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>
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
    <div className={`w-full bg-white rounded-3xl p-6 border border-[#C6A672] shadow-sm ${isPrintMode ? 'border-none shadow-none p-0' : ''}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h3 className="font-serif text-xl font-semibold text-[#064E2C] mb-4 sm:mb-0">Wealth & Cashflow Growth</h3>
        {!isPrintMode && (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-full">
            {[10, 20, 30].map(yr => (
              <button
                key={yr}
                onClick={() => setHorizon(yr)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  horizon === yr 
                    ? 'bg-[#064E2C] text-white shadow-md' 
                    : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                {yr}Y
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 20, right: 30, bottom: 50, left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="year" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }}
              label={{ value: 'Year', position: 'insideBottom', offset: -25, fill: '#9CA3AF', fontSize: 12, fontWeight: 700 }}
            />
            <YAxis 
              yAxisId="left"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatCurrency(val, 1)}
              tick={{ fill: COLORS.primary, fontSize: 11, fontWeight: 600 }}
            >
              <Label 
                value="Property Value" 
                angle={-90} 
                position="insideLeft" 
                style={{ textAnchor: 'middle', fill: COLORS.primary, fontSize: 12, fontWeight: 700 }}
                offset={-10}
              />
            </YAxis>
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
              tick={{ fill: COLORS.accent, fontSize: 11, fontWeight: 600 }}
            >
              <Label 
                value="Gross Rent (Annual)" 
                angle={90} 
                position="insideRight" 
                style={{ textAnchor: 'middle', fill: COLORS.accent, fontSize: 12, fontWeight: 700 }}
                offset={-10}
              />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#C6A672', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 'bold' }}
            />
            <Line 
              yAxisId="left"
              name="Property Value"
              type="monotone" 
              dataKey="propertyValue" 
              stroke={COLORS.primary} 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, fill: COLORS.primary, strokeWidth: 0 }}
            />
            <Line 
              yAxisId="right"
              name="Gross Rent (Annual)"
              type="monotone" 
              dataKey="grossRent" 
              stroke={COLORS.accent} 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, fill: COLORS.accent, strokeWidth: 0 }}
            />
            {positiveCashflowYear !== null && positiveCashflowYear <= currentHorizon && (
              <ReferenceLine 
                x={positiveCashflowYear} 
                stroke={COLORS.dark} 
                strokeDasharray="4 4" 
                yAxisId="left"
                label={{ 
                  value: 'CF+', 
                  position: 'insideTopLeft', 
                  fill: COLORS.dark,
                  fontSize: 10,
                  fontWeight: 'bold'
                }} 
              />
            )}
            {crossoverData && positiveCashflowYear !== null && positiveCashflowYear <= currentHorizon && (
                <ReferenceDot
                    yAxisId="right"
                    x={positiveCashflowYear}
                    y={crossoverData.grossRent}
                    r={5}
                    fill={COLORS.white}
                    stroke={COLORS.dark}
                    strokeWidth={2}
                />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-gray-400 mt-2 text-right italic font-medium">Note: CF = Cash Flow</p>
    </div>
  );
};

export default ProjectionChart;