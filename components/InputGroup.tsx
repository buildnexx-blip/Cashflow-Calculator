import React from 'react';
import { COLORS } from '../constants';

interface InputGroupProps {
  label: string;
  children: React.ReactNode;
  subLabel?: string;
  className?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, subLabel, children, className }) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex justify-between items-baseline mb-2 px-1">
        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>
        {subLabel && <span className="text-[9px] font-bold text-[#C6A672] uppercase tracking-tighter">{subLabel}</span>}
      </div>
      {children}
    </div>
  );
};

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
  suffix?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({ prefix, suffix, className, ...props }) => {
  return (
    <div className="relative rounded-full shadow-sm group">
      {prefix && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
          <span className="text-gray-400 font-bold text-sm">{prefix}</span>
        </div>
      )}
      <input
        type="number"
        className={`block w-full rounded-full border border-gray-100 py-4 text-gray-900 font-semibold ring-0 placeholder:text-gray-300 focus:ring-4 focus:ring-[#064E2C]/5 focus:border-[#C6A672]/30 sm:text-sm sm:leading-6 bg-[#F9FAFB] transition-all ${prefix ? 'pl-10' : 'pl-6'} ${suffix ? 'pr-10' : 'pr-6'} ${className}`}
        {...props}
      />
      {suffix && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-6">
          <span className="text-gray-400 font-bold text-sm">{suffix}</span>
        </div>
      )}
    </div>
  );
};

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const TextInput: React.FC<TextInputProps> = ({ className, ...props }) => {
  return (
    <div className="relative rounded-full shadow-sm">
      <input
        type="text"
        className={`block w-full rounded-full border border-gray-100 py-4 px-6 text-gray-900 font-semibold ring-0 placeholder:text-gray-300 focus:ring-4 focus:ring-[#064E2C]/5 focus:border-[#C6A672]/30 sm:text-sm sm:leading-6 bg-[#F9FAFB] transition-all ${className}`}
        {...props}
      />
    </div>
  );
};

export const SelectInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => {
  return (
    <div className="relative rounded-full shadow-sm">
      <select
        className={`block w-full rounded-full border border-gray-100 py-4 pl-6 pr-12 text-gray-900 font-semibold ring-0 focus:ring-4 focus:ring-[#064E2C]/5 focus:border-[#C6A672]/30 sm:text-sm sm:leading-6 bg-[#F9FAFB] appearance-none transition-all cursor-pointer`}
        style={{ backgroundImage: 'none' }} 
        {...props}
      >
        {props.children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-6">
        <svg className="h-4 w-4 text-[#C6A672]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}