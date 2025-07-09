import React from "react";
import { CaretDown } from "@phosphor-icons/react";

type Props = {
  value?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
};

export const DateDropdownInput = React.forwardRef<HTMLInputElement, Props>(
  ({ value, onClick, label, className = "" }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref as any}
      className={`btn btn-sm justify-start truncate flex items-center w-full bg-gray-100 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 hover:shadow-md px-3 py-2 text-gray-700 ${className}`}
      style={{ minHeight: 38 }}
    >
      <span className="truncate flex-1 text-left font-medium text-gray-700">
        {value || label || "Select date"}
      </span>
      <CaretDown className="w-4 h-4 ml-2 text-blue-400 group-hover:text-blue-600 transition-colors duration-200" />
    </button>
  )
);
DateDropdownInput.displayName = "DateDropdownInput";
