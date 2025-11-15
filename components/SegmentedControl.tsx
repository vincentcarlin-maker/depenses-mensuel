import React from 'react';

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  colorClass?: string;
  className?: string;
}

const SegmentedControl = <T extends string>({ options, value, onChange, colorClass = 'text-cyan-600 dark:text-cyan-400', className = '' }: SegmentedControlProps<T>) => {
  if (!options || options.length === 0) {
    return null;
  }
  
  const selectedIndex = options.indexOf(value);
  // Default to the first option if the current value is not in the options list.
  // This can happen if the list of options changes (e.g. a car is deleted).
  const finalSelectedIndex = selectedIndex === -1 ? 0 : selectedIndex;

  return (
    <div className={`relative flex w-full bg-slate-100 dark:bg-slate-700 rounded-full p-1 ${className}`}>
      <span
        className="absolute top-1 bottom-1 rounded-full bg-white dark:bg-slate-800 shadow-md transition-transform duration-300 ease-in-out"
        style={{
          width: `calc(100% / ${options.length})`,
          transform: `translateX(calc(${finalSelectedIndex} * 100%))`
        }}
        aria-hidden="true"
      />
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`relative z-10 p-2 rounded-full text-sm font-semibold transition-colors flex-1 truncate
            ${value === option ? colorClass : 'text-slate-600 dark:text-slate-300'}
          `}
          title={option}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;
