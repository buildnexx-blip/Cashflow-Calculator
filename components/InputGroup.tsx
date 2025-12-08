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
    <div className={`mb-4 ${className}`}>
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-sm font-semibold text-gray-700 block">{label}</label>
        {subLabel && <span className="text-xs text-gray-500">{subLabel}</span>}
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
    <div className="relative rounded-full shadow-sm">
      {prefix && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <span className="text-gray-500 sm:text-sm">{prefix}</span>
        </div>
      )}
      <input
        type="number"
        className={`block w-full rounded-full border-0 py-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[${COLORS.primary}] sm:text-sm sm:leading-6 bg-gray-50 ${prefix ? 'pl-8' : 'pl-4'} ${suffix ? 'pr-8' : 'pr-4'} ${className}`}
        {...props}
      />
      {suffix && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-gray-500 sm:text-sm">{suffix}</span>
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
        className={`block w-full rounded-full border-0 py-2.5 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[${COLORS.primary}] sm:text-sm sm:leading-6 bg-gray-50 ${className}`}
        {...props}
      />
    </div>
  );
};

export const SelectInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => {
  return (
    <div className="relative rounded-full shadow-sm">
      <select
        className={`block w-full rounded-full border-0 py-2.5 pl-4 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[${COLORS.primary}] sm:text-sm sm:leading-6 bg-gray-50 appearance-none`}
        style={{ backgroundImage: 'none' }} 
        {...props}
      >
        {props.children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}