import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown } from 'lucide-react'; // Assuming lucide-react is installed for icons

// --- TYPE DEFINITIONS ---
export interface DropdownOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  options: DropdownOption[];
  onSelect: (selected: string | string[]) => void; // Unified onSelect handler
  selectedValue?: string;    // For single-select
  selectedValues?: string[]; // For multi-select
  placeholder?: string;      // Text inside the button when nothing is selected
  label?: string;            // Optional title label above the dropdown
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  disabled?: boolean;
  multiSelect?: boolean;
}

// --- REFINED COMPONENT ---
const SelectDropdown: React.FC<SelectDropdownProps> = ({
  options = [],
  onSelect,
  selectedValue,
  selectedValues = [], // Ensure it defaults to an empty array for safety
  placeholder = 'Select an option',
  label,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  disabled = false,
  multiSelect = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Unified Select Handler ---
  // Modified: No longer closes dropdown for multi-select
  const handleSelect = useCallback((optionValue: string) => {
    if (multiSelect) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onSelect(newValues);
      // DO NOT CALL setIsOpen(false) here for multi-select.
      // This keeps the dropdown open after an individual selection.
    } else {
      onSelect(optionValue);
      setIsOpen(false); // Close dropdown for single-select as before
    }
  }, [multiSelect, selectedValues, onSelect]);

  // --- New: Handler for Select All / Deselect All ---
  const handleSelectAllToggle = useCallback(() => {
    if (!multiSelect) return; // This function is only for multi-select

    const allOptionValues = options.map((opt) => opt.value);
    if (selectedValues.length === options.length) {
      // All are currently selected, so deselect all
      onSelect([]);
    } else {
      // Not all are selected, so select all
      onSelect(allOptionValues);
    }
    // DO NOT CALL setIsOpen(false) here either.
    // The dropdown should remain open after a select all/deselect all action.
  }, [multiSelect, options, selectedValues, onSelect]);


  // --- Determine Button Display Text (Memoized for performance) ---
  const getButtonLabel = useMemo(() => {
    if (multiSelect) {
      if (selectedValues.length === 0) return placeholder;
      if (selectedValues.length === options.length) return "All selected"; // New label for all selected
      // Display the count for multiple selections (e.g., "3 items selected")
      return `${selectedValues.length} items selected`;
    }
    // Single-select logic remains the same
    const selectedOption = options.find((o) => o.value === selectedValue);
    return selectedOption?.label || placeholder;
  }, [multiSelect, selectedValues, options, selectedValue, placeholder]);

  const isAllSelected = multiSelect && selectedValues.length === options.length;

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {label && <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>}

      {/* --- Trigger Button --- */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-gray-200 shadow-sm rounded-lg px-3 h-9 text-gray-800 font-medium flex items-center justify-between w-full cursor-pointer transition-colors duration-200 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-sm">{getButtonLabel}</span> {/* Use the memoized getter */}
        <ChevronDown className={`w-4 h-4 ml-2 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* --- Dropdown Menu --- */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-30 p-1 ${dropdownClassName}`}
          role="listbox"
          aria-activedescendant={multiSelect ? undefined : selectedValue} // Only active descendant for single select
        >
          <ul className={`max-h-60 overflow-y-auto ${multiSelect ? 'space-y-1' : ''}`}>
            {multiSelect && options.length > 0 && ( // Only show "Select All" if multi-select and options exist
              <li
                className={`px-3 py-2 text-sm font-semibold rounded-md cursor-pointer transition-colors duration-150 border-b border-gray-100 
                  ${isAllSelected ? 'bg-indigo-100 text-indigo-800' : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={handleSelectAllToggle}
                role="option"
                aria-selected={isAllSelected}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    readOnly
                    checked={isAllSelected}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3 pointer-events-none" // pointer-events-none to ensure click on li triggers
                  />
                  <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
                </div>
              </li>
            )}

            {options.map((option) => {
              const isSelected = multiSelect ? selectedValues.includes(option.value) : selectedValue === option.value;
              return (
                <li
                  key={option.value}
                  className={`px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors duration-150 ${
                    isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSelect(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  id={option.value}
                >
                  {multiSelect ? (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        readOnly
                        checked={isSelected}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3 pointer-events-none" // Keep pointer-events-none
                      />
                      <span>{option.label}</span>
                    </div>
                  ) : (
                    <span>{option.label}</span>
                  )}
                </li>
              );
            })}
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 text-center">No options available</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default React.memo(SelectDropdown); // Use React.memo for performance