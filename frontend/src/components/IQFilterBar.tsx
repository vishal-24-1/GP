import React, { useMemo } from "react";
// Assuming z_select is the refined Dropdown component from your previous discussion
import Dropdown from "../dashboard/components/dropdowns/z_select"; // Ensure this path is correct

// Interface remains the same, but comments highlight expectations
interface IQFilterBarProps {
  testType: string;
  setTestType: (v: string) => void;
  month: string;
  setMonth: (v: string) => void;
  week?: string;
  setWeek?: (v: string) => void;
  weekOptions?: { label: string; value: string }[];
  batch?: string;
  setBatch?: (v: string) => void;
  batchOptions?: { label: string; value: string }[];
  subject?: string;
  setSubject?: (v: string) => void;
  subjectOptions?: { label: string; value: string }[];
  subjectPair?: string;
  setSubjectPair?: (v: string) => void;
  subjectPairOptions?: { label: string; value: string }[];
  grandTestName?: string;
  setGrandTestName?: (v: string) => void;
  grandTestOptions?: { label: string; value: string }[];
  sectionOptions: string[]; // This should be the ALL available sections
  selectedSections: string[]; // This should be the CURRENTLY selected sections
  setSelectedSections: (sections: string[]) => void;
}

// Helper to generate month options, always ensuring the current month is in the list
// Now generates 12 months starting from current, and adds June 2025 specifically if not present.
// The order will be chronological, with June 2025 inserted if not naturally occurring.
const generateMonthOptions = () => {
  const options: { label: string; value: string }[] = [];
  const today = new Date(); // Current date: July 5, 2025
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Generate 12 months starting from the current month
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentYear, currentMonth + i, 1);
    options.push({
      label: date.toLocaleString("default", { month: "long", year: "numeric" }),
      value: `${date.getFullYear()}-${date.getMonth() + 1}`,
    });
  }

  // Ensure June 2025 is present and placed chronologically if current month is after June 2025
  const june2025Label = "June 2025";
  const june2025Value = "2025-6";
  const june2025Date = new Date(2025, 5, 1); // Month is 0-indexed for Date object

  if (!options.some((opt) => opt.value === june2025Value)) {
    // Find the correct insertion point to maintain chronological order
    let inserted = false;
    for (let i = 0; i < options.length; i++) {
      const optionDate = new Date(
        parseInt(options[i].value.split("-")[0]),
        parseInt(options[i].value.split("-")[1]) - 1,
        1
      );
      if (june2025Date < optionDate) {
        options.splice(i, 0, { label: june2025Label, value: june2025Value });
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      options.push({ label: june2025Label, value: june2025Value });
    }
  }

  return options;
};

const IQFilterBar: React.FC<IQFilterBarProps> = (props) => {
  const { /* testType, */ selectedSections, setSelectedSections } = props;

  // Handler for the multi-select dropdown, ensuring an array is always passed
  const handleSectionSelect = (sections: string | string[]) => {
    // Dropdown component should ideally always return string[] for multiSelect
    setSelectedSections(Array.isArray(sections) ? sections : []);
  };

  // Create a reusable wrapper for each filter item
  const FilterItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-w-[180px]">{children}</div>
  );

  // Memoize options and values to prevent unnecessary recalculations on re-renders
  // This is especially useful for options that don't change often.

  // Test Type options and determined value
  const testTypeOptions = useMemo(
    () => ["Weekly", "Cumulative", "Grand Test"].map((t) => ({ label: t, value: t })),
    []
  );
  const testTypeValue = testTypeOptions.some((opt) => opt.value === props.testType)
    ? props.testType
    : testTypeOptions[0].value; // Default to the first option ("Weekly")

  // Month options and determined value
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const monthValue = monthOptions.some((opt) => opt.value === props.month)
    ? props.month
    : "2025-6"; // Default to June 2025 if current month is not found, or if props.month is invalid/empty

  // Section options and selected values
  const sectionOptions = useMemo(
    () => props.sectionOptions.map((s) => ({ label: s, value: s })),
    [props.sectionOptions]
  );
  // For multi-select, selectedValues should directly reflect the state,
  // potentially an empty array if nothing is selected.
  const currentSelectedSections = selectedSections || [];

  // Week options and determined value
  const weekOpts = useMemo(() => {
    let options = props.weekOptions ? [...props.weekOptions] : [];
    // Ensure 'Week 1' is present and at the start if it doesn't naturally appear.
    if (!options.some((opt) => opt.label === "Week 1" || opt.value === "1")) {
      options.unshift({ label: "Week 1", value: "1" });
    }
    return options;
  }, [props.weekOptions]);
  const weekValue = weekOpts.some((opt) => opt.value === props.week)
    ? props.week
    : (weekOpts.length > 0 ? weekOpts[0].value : ""); // Default to first available week, or empty

  // Batch options and determined value
  const batchValue = props.batchOptions?.some((opt) => opt.value === props.batch)
    ? props.batch
    : (props.batchOptions?.[0]?.value || ""); // Default to first batch option, or empty

  // Subject options and determined value
  const subjectValue = props.subjectOptions?.some((opt) => opt.value === props.subject)
    ? props.subject
    : (props.subjectOptions?.[0]?.value || ""); // Default to first subject option, or empty

  // Subject Pair options and determined value
  const subjectPairValue = props.subjectPairOptions?.some((opt) => opt.value === props.subjectPair)
    ? props.subjectPair
    : (props.subjectPairOptions?.[0]?.value || ""); // Default to first subject pair option, or empty

  // Grand Test Name options and determined value
  const grandTestValue = props.grandTestOptions?.some((opt) => opt.value === props.grandTestName)
    ? props.grandTestName
    : (props.grandTestOptions?.[0]?.value || ""); // Default to first grand test option, or empty

  return (
    <div className="mt-6 w-full">
      <div className="flex flex-row flex-wrap items-end gap-x-6 gap-y-4 w-full">
        {/* Filter Icon */}
        <div className="flex-shrink-0 pb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="#A0A4AB"
            viewBox="0 0 256 256"
          >
            <path d="M230.6,49.53A15.81,15.81,0,0,0,216,40H40A16,16,0,0,0,28.19,66.76l.08.09L96,139.17V216a16,16,0,0,0,24.87,13.32l32-21.34A16,16,0,0,0,160,194.66V139.17l67.74-72.32.08-.09A15.8,15.8,0,0,0,230.6,49.53ZM40,56h0Zm106.18,74.58A8,8,0,0,0,144,136v58.66L112,216V136a8,8,0,0,0-2.16-5.47L40,56H216Z"></path>
          </svg>
        </div>

        <FilterItem>
          <Dropdown
            label="Test Type"
            selectedValue={testTypeValue}
            options={testTypeOptions}
            onSelect={(v) => props.setTestType(v as string)}
          />
        </FilterItem>

        <FilterItem>
          <Dropdown
            label="Month"
            selectedValue={monthValue}
            options={monthOptions}
            onSelect={(v) => props.setMonth(v as string)}
          />
        </FilterItem>

        <FilterItem>
          <Dropdown
            label="Section"
            multiSelect
            selectedValues={currentSelectedSections} // Use the derived state for multi-select
            options={sectionOptions}
            onSelect={handleSectionSelect}
            placeholder="Select Sections"
          />
        </FilterItem>

        {/* --- Conditional Filters based on 'Cumulative' Test Type --- */}
        {testTypeValue === "Cumulative" && props.batchOptions && props.setBatch && (
          <FilterItem>
            <Dropdown
              label="Batch"
              selectedValue={batchValue}
              options={props.batchOptions}
              onSelect={(v) => props.setBatch!(v as string)}
            />
          </FilterItem>
        )}

        {testTypeValue === "Cumulative" && props.subjectPairOptions && props.setSubjectPair && (
          <FilterItem>
            <Dropdown
              label="Subject Pair"
              selectedValue={subjectPairValue}
              options={props.subjectPairOptions}
              onSelect={(v) => props.setSubjectPair!(v as string)}
            />
          </FilterItem>
        )}

        {/* --- Other Conditional Filters (like Weekly, Grand Test) --- */}
        {testTypeValue === "Weekly" && props.weekOptions && props.setWeek && (
          <FilterItem>
            <Dropdown
              label="Week"
              selectedValue={weekValue}
              options={weekOpts}
              onSelect={(v) => props.setWeek!(v as string)}
            />
          </FilterItem>
        )}

        {testTypeValue === "Weekly" && props.subjectOptions && props.setSubject && (
          <FilterItem>
            <Dropdown
              label="Subject"
              selectedValue={subjectValue}
              options={props.subjectOptions}
              onSelect={(v) => props.setSubject!(v as string)}
            />
          </FilterItem>
        )}

        {testTypeValue === "Grand Test" && props.grandTestOptions && props.setGrandTestName && (
          <FilterItem>
            <Dropdown
              label="Grand Test Name"
              selectedValue={grandTestValue}
              options={props.grandTestOptions}
              onSelect={(v) => props.setGrandTestName!(v as string)}
            />
          </FilterItem>
        )}
      </div>

      {/* Divider line below filter bar */}
      <div className="w-full h-[1.5px] bg-gray-200 mt-6 mb-2 rounded" />
    </div>
  );
};

export default React.memo(IQFilterBar); // Wrap with React.memo for performance optimization