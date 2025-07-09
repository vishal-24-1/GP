import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Question, OptionAttempts } from "../types/questions";
import type { TableRow } from "@/DummyData/TableRow";

interface QuestionViewModalProps {
  open: boolean;
  onClose: () => void;
  row: TableRow | null;
  modalClassName?: string;
}

// Helper function remains the same, as its logic is sound for data transformation.
function toModalQuestion(row: TableRow | null): Question | null {
  if (!row) return null;
  const optionAttempts: OptionAttempts = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };
  if (Array.isArray(row.options)) {
    row.options.forEach((opt: any, idx: number) => {
      const key = String.fromCharCode(65 + idx) as keyof OptionAttempts;
      if (key in optionAttempts) {
        optionAttempts[key] = opt.count;
      }
    });
  }
  const totalAttempts = row.options?.reduce((sum: number, opt: any) => sum + (opt.count || 0), 0) || 0;
  const correctOptIdx = typeof row.correctAnswer === 'string' ? row.correctAnswer.charCodeAt(0) - 65 : 0;
  const correct = row.options && row.options[correctOptIdx]?.count ? row.options[correctOptIdx].count : 0;
  const incorrect = totalAttempts - correct;
  const accuracy = totalAttempts ? Number(((correct / totalAttempts) * 100).toFixed(2)) : 0;
  const correctPercentage = totalAttempts ? Math.round((correct / totalAttempts) * 100) : 0;
  const incorrectPercentage = totalAttempts ? Math.round((incorrect / totalAttempts) * 100) : 0;
  const optionDistribution = optionAttempts;
  const totalCount = row.totalCount ?? 0;
  // Find most common incorrect option
  let mostCommonIncorrect = '';
  let maxWrong = -1;
  Object.entries(optionAttempts).forEach(([opt, count]) => {
    if (opt !== row.correctAnswer && count > maxWrong) {
      maxWrong = count;
      mostCommonIncorrect = opt;
    }
  });
  return {
    questionId: String(row.id ?? row.number ?? ''),
    subject: row.subject ?? '',
    totalCount,
    attempts: totalAttempts,
    correct,
    incorrect,
    accuracy,
    viewable: true,
    modal: {
      questionText: row.text ?? '',
      subject: row.subject ?? '',
      totalAttempts,
      optionAttempts,
      correctPercentage,
      incorrectPercentage,
      mostCommonIncorrectPercentage: totalAttempts ? Math.round(((optionAttempts[mostCommonIncorrect as keyof OptionAttempts] || 0) / totalAttempts) * 100) : 0,
      optionDistribution,
      totalCount,
      correct,
      incorrect,
      accuracy,
      rightOption: row.correctAnswer || '',
      mostCommonIncorrect,
    },
  };
}

const QuestionViewModal: React.FC<QuestionViewModalProps> = ({ open, onClose, row, modalClassName }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (open && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  const safeQuestion = toModalQuestion(row);

  if (!open || !safeQuestion || !safeQuestion.modal) {
    return null;
  }

  const modal = safeQuestion.modal;
  const optionCounts = modal.optionAttempts;
  const rightOption = modal.rightOption || (Object.keys(optionCounts)[0] || 'A'); // Fallback to 'A' if no right option

  const optionAccuracy = (Object.keys(optionCounts) as (keyof typeof optionCounts)[]).map(opt => ({
    option: opt,
    count: optionCounts[opt],
    percent: modal.totalAttempts ? Math.round(((optionCounts[opt] ?? 0) / modal.totalAttempts) * 100) : 0,
    isCorrect: opt === rightOption,
    isMostWrong: opt === modal.mostCommonIncorrect,
  }));

  // Define colors for the chart bars and legends
  const correctColor = "#225091"; // A deeper, more prominent blue
  const mostWrongColor = "#5795e0"; // A slightly muted blue for contrast
  const otherOptionsColor = "#b6d0f5"; // A very light blue

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        ref={modalRef}
        className={modalClassName ? modalClassName :
          "bg-white rounded-xl shadow-2xl w-full max-w-7xl min-h-[600px] max-h-[95vh] p-0 relative flex flex-col border border-blue-200 animate-fadeIn"
        }
        role="dialog"
        aria-modal="true"
        style={{ boxShadow: '0 10px 40px rgba(34, 80, 145, 0.25)' }}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl flex-shrink-0">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between w-full">
              <h2 className="font-extrabold text-2xl md:text-3xl text-blue-900 leading-tight">
                Question {safeQuestion.questionId}
              </h2>
              <button
                className="text-gray-400 hover:text-blue-600 p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-base md:text-lg text-gray-800 mt-2 font-medium break-words max-w-full leading-relaxed">
              {modal.questionText}
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm text-gray-700 font-medium">
              <div><span className="font-semibold text-gray-900">Subject:</span> {safeQuestion.subject}</div>
              <div><span className="font-semibold text-gray-900">Total Attempts:</span> {modal.totalAttempts}</div>
              <div><span className="font-semibold text-gray-900">Total Students:</span> {modal.totalCount}</div>
              <div>
                <span className="font-semibold text-gray-900">Accuracy:</span>{" "}
                <span className="font-bold text-green-600 text-lg">{modal.accuracy}%</span>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <span className="font-semibold text-gray-900">Right Option:</span>{" "}
                <span className="font-mono text-blue-800 font-extrabold text-lg align-middle px-2.5 py-1 bg-blue-100 rounded-md border border-blue-300">
                  {rightOption}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Section: Now the only scrollable part */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch p-6 flex-1 overflow-y-auto">
          {/* Left Column: Chart */}
          <div className="flex-1 min-w-[300px] flex flex-col items-center justify-start py-3 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
            <h3 className="font-semibold text-blue-900 mb-4 text-lg">Option-wise Response Distribution</h3>
            <div className="w-full px-3" style={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={optionAccuracy} margin={{ left: 5, right: 5, top: 5, bottom: 20 }}>
                  <XAxis
                    dataKey="option"
                    label={{ value: "Option", position: "bottom", offset: 0, fill: '#334155', fontWeight: 600 }}
                    tick={{ fill: '#334155', fontWeight: 600, fontSize: 13 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    padding={{ left: 15, right: 15 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    label={{ value: "Students", angle: -90, position: "insideLeft", fill: '#334155', fontWeight: 600 }}
                    tick={{ fill: '#334155', fontWeight: 600, fontSize: 13 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(238, 242, 246, 0.6)' }}
                    contentStyle={{
                      background: '#ffffff',
                      borderColor: '#93c5fd',
                      color: '#1e40af',
                      fontWeight: 700,
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{ color: '#0f172a' }}
                    formatter={(value: number, _name: string, props: any) =>
                      [
                        `${value} students (${props.payload.percent}%)`,
                        props.payload.isCorrect
                          ? "Correct Answer"
                          : props.payload.isMostWrong
                          ? "Most Common Incorrect"
                          : "Other Option",
                      ]
                    }
                  />
                  <Bar dataKey="count" minPointSize={2} radius={[4, 4, 0, 0]}>
                    {optionAccuracy.map((entry) => (
                      <Cell
                        key={entry.option}
                        fill={
                          entry.isCorrect
                            ? correctColor
                            : entry.isMostWrong
                            ? mostWrongColor
                            : otherOptionsColor
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-xs font-medium justify-center text-gray-700 w-full">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm inline-block" style={{ backgroundColor: correctColor, border: `1px solid ${correctColor}` }} /> Correct Option
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm inline-block" style={{ backgroundColor: mostWrongColor, border: `1px solid ${mostWrongColor}` }} /> Most Common Wrong
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm inline-block" style={{ backgroundColor: otherOptionsColor, border: `1px solid ${otherOptionsColor}` }} /> Other Options
              </span>
            </div>
          </div>

          {/* Right Column: Statistics */}
          <div className="flex-1 min-w-[300px] flex flex-col gap-5 bg-blue-50 rounded-lg p-5 border border-blue-100 shadow-sm justify-center items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 text-center w-full">
              <div className="flex flex-col gap-1 items-center bg-white p-3 rounded-md shadow-xs border border-gray-100">
                <span className="font-semibold text-gray-800 text-base">Correct Responses</span>
                <span className="text-3xl font-extrabold text-green-700">{modal.correctPercentage}%</span>
              </div>
              <div className="flex flex-col gap-1 items-center bg-white p-3 rounded-md shadow-xs border border-gray-100">
                <span className="font-semibold text-gray-800 text-base">Incorrect Responses</span>
                <span className="text-3xl font-extrabold text-red-600">{modal.incorrectPercentage}%</span>
              </div>
              <div className="flex flex-col gap-1 items-center bg-white p-3 rounded-md shadow-xs border border-gray-100 col-span-full">
                <span className="font-semibold text-gray-800 text-base">Most Common Wrong Option</span>
                <span className="text-2xl font-extrabold text-orange-500">{modal.mostCommonIncorrect}</span>
              </div>
            </div>

            <div className="w-full">
              <h3 className="font-semibold text-gray-800 text-base mb-3 text-center">Detailed Option Distribution</h3>
              <div className="flex flex-col gap-2 w-full">
                {optionAccuracy.map((opt) => (
                  <div key={opt.option} className="flex items-center gap-2 p-2.5 bg-white rounded-md border border-gray-100 shadow-xs hover:shadow-md transition-shadow duration-200">
                    <span className={`w-4 h-4 rounded-full inline-block flex-shrink-0 ${
                      opt.isCorrect
                        ? "bg-green-500"
                        : opt.isMostWrong
                        ? "bg-orange-400"
                        : "bg-gray-200"
                    }`} />
                    <span className="font-mono font-bold text-gray-900 text-lg">{opt.option}</span>
                    {/* FIXED: Removed the extra '}' character */}
                    <span className="ml-auto text-gray-700 text-sm font-medium">{opt.count} students</span>
                    <span className="text-xs text-gray-500">({opt.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionViewModal;