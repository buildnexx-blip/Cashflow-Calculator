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
  TooltipProps
} from 'recharts';
import { YearlyProjection } from '../types';
import { COLORS } from '../constants';

interface ProjectionChartProps {
  data: YearlyProjection[];
  positiveCashflowYear: number | null;
  isPrintMode?: boolean;
}

// Helper for formatting large numbers (k vs m)
const formatCurrency = (value: number, decimals = 1) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(decimals)}m`;
  }
  return `$${(value / 1000).toFixed(0)}k`;
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    // payload[0].payload is the underlying data object (YearlyProjection)
    const data = payload[0].payload as YearlyProjection;
    
    return (
      <div className="bg-white p-4 border border-[#C6A672] rounded-[16px] shadow-lg min-w-[220px]">
        <p className="font-serif font-bold text-[#064E2C] mb-3 border-b border-gray-100 pb-2">
          Year {data.year}
        </p>
        <div className="space-y-2 text-sm">
          {/* Property Value */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#064E2C]" />
              <span className="text-gray-600 font-medium">Property Value</span>
            </div>
            <span className="font-bold text-gray-800">
              {formatCurrency(data.propertyValue, 2)}
            </span>
          </div>

          {/* Annual Rent */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FD9B63]" />
              <span className="text-gray-600 font-medium">Annual Rent</span>
            </div>
            <span className="font-bold text-gray-800">
              ${(data.grossRent / 1000).toFixed(1)}k
            </span>
          </div>

          {/* Net Cashflow (Added) */}
          <div className="flex justify-between items-center gap-4 pt-2 border-t border-gray-100 mt-2">
            <span className="text-gray-500 font-medium">Net Cashflow</span>
            <span className={`font-bold ${data.netCashflow >= 0 ? 'text-[#064E2C]' : 'text-red-500'}`}>
              ${Math.round(data.netCashflow).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ProjectionChart: React.FC<ProjectionChartProps> = ({ data, positiveCashflowYear, isPrintMode = false }) => {
  const [horizon, setHorizon] = useState<number>(30);
  
  // Force 30 years if in print mode
  const currentHorizon = isPrintMode ? 30 : horizon;
  const filteredData = data.filter(d => d.year <= currentHorizon);
  
  // Axis Formatter using the smart currency formatter
  const axisFormatter = (value: number) => formatCurrency(value, 1);

  // Find data point for crossover for the dot
  // FIX: Explicit check for null, because 0 is falsy
  const crossoverData = positiveCashflowYear !== null ? data.find(d => d.year === positiveCashflowYear) : null;

  return (
    <div className={`w-full bg-white rounded-3xl p-6 border border-[#C6A672] shadow-sm ${isPrintMode ? 'border-none shadow-none p-0' : ''}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h3 className="font-serif text-xl font-semibold text-[#064E2C] mb-4 sm:mb-0">Growth & Income</h3>
        {!isPrintMode && (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-full">
            {[10, 20, 30].map(yr => (
              <button
                key={yr}
                onClick={() => setHorizon(yr)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  horizon === yr 
                    ? 'bg-[#064E2C] text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {yr}Y
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 text-xs font-medium text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#064E2C]"></div>
          <span>Property Value</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FD9B63]"></div>
          <span>Annual Rent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="w-4 border-t-2 border-dashed border-[#0B090A]"></div>
          </div>
          <span>CF+ (Positive Cashflow Year)</span>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            
            {/* X Axis */}
            <XAxis 
              dataKey="year" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(val) => `Yr ${val}`}
            />
            
            {/* Left Y Axis: Property Value */}
            <YAxis 
              yAxisId="left"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tickFormatter={axisFormatter}
              tick={{ fill: COLORS.primary, fontSize: 12 }}
            />
            
            {/* Right Y Axis: Annual Rent */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
              tick={{ fill: COLORS.accent, fontSize: 12 }}
            />

            {/* Custom Tooltip */}
            {!isPrintMode && (
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#C6A672', strokeWidth: 1, strokeDasharray: '4 4' }} />
            )}

            {/* Lines - Disable animation in print mode for capture reliability */}
            <Line 
              name="Property Value"
              yAxisId="left"
              type="monotone" 
              dataKey="propertyValue" 
              stroke={COLORS.primary} 
              strokeWidth={3} 
              dot={false}
              activeDot={!isPrintMode ? { r: 6, fill: COLORS.primary } : false}
              isAnimationActive={!isPrintMode}
            />
            
            <Line 
              name="Annual Rent"
              yAxisId="right"
              type="monotone" 
              dataKey="grossRent" 
              stroke={COLORS.accent} 
              strokeWidth={3} 
              dot={false}
              activeDot={!isPrintMode ? { r: 6, fill: COLORS.accent } : false}
              isAnimationActive={!isPrintMode}
            />

            {/* Crossover Highlights */}
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
                  fontSize: 12,
                  fontWeight: 'bold'
                }} 
              />
            )}
            
            {/* Highlight Dot for Rent when Positive */}
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
    </div>
  );
};

export default ProjectionChart;