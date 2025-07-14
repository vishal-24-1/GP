import { useEffect, useState } from "react";
import { useFilter } from "@/lib/DashboardFilterContext";
import FilterBar from "@/components/FilterBar";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import PerformanceTrendBarChart from "@/components/ui/analytics/PerformanceTrendBarChart";
import AverageTotalScoreGauge from "../../components/ui/AverageTotalScoreGauge";
import type { DashboardData } from "@/types/dashboard";
import DashboardCard from "@/components/ui/DashboardCard";
import DataTable, { type TableRow } from "../components/tables/DataTable";
import { BarChart2, PercentCircle, Star, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import { fetchDashboardAllMetrics } from "@/api/dashboard.api";

export default function Section1Dashboard() {
  const institutionOptions = ["Institution 1", "Institution 2"];
  const batchOptions = ["Batch A", "Batch B"];
  const sectionOptions = [ "11A", "11B", "12A", "12B"];

  const { filter } = useFilter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const defaultInstitution = filter.institution || institutionOptions[0];
    const defaultBatch = filter.batch || batchOptions[0];
    // const defaultSection = filter.class || sectionOptions[0];
    // const defaultExamType = filter.examType || "Weekly";
    // const defaultSubject = filter.subject || "Physics";
    const defaultSection = "D85"
    const defaultExamType = ""
    const defaultSubject = ""
    fetchDashboardAllMetrics({
      institution: defaultInstitution,
      batch: defaultBatch,
      // section: defaultSection,
      // examType: defaultExamType,
      // subject: defaultSubject,
    })
      .then((data) => setDashboardData(data))
      .catch(() => setError("Failed to fetch dashboard data"))
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>{error}</div>;
  if (!dashboardData) return null;

  // Extract metrics from backend response
  const metrics = dashboardData.metrics || {};
  const neetReadiness = dashboardData.neet_readiness || {};
  const riskBreakdown = dashboardData.risk_breakdown || {};
  const trendGraph = dashboardData.trend_graph || [];
  const overallPerformance = dashboardData.overall_performance || [];

  // Determine max marks from metrics (if available)
  const maxMarks = metrics.average_total_score?.split("/")[1]?.trim() || "0";
  const avgTotalScore = parseFloat(metrics.average_total_score?.split("/")[0]?.trim() || "0");
  const top10PercentAvgScore = parseFloat(metrics.top_10_avg_score?.split("/")[0]?.trim() || "0");
  const bottom10PercentAvgScore = parseFloat(metrics.bottom_10_avg_score?.split("/")[0]?.trim() || "0");

  // Risk breakdown
  const riskData = [
    { name: "Safe", value: riskBreakdown.safe?.percentage || 0, color: "#10b981" },
    { name: "Medium Risk", value: riskBreakdown.medium_risk?.percentage || 0, color: "#f59e42" },
    { name: "At Risk", value: riskBreakdown.at_risk?.percentage || 0, color: "#ef4444" },
  ];

  // Metric cards config for dashboard
  const metricCards = [
    {
      icon: <BarChart2 className="w-9 h-9 text-blue-600" />, // Total Tests
      label: 'Total Tests Conducted',
      value: metrics.total_tests_conducted,
    },
    {
      icon: <PercentCircle className="w-9 h-9 text-blue-600" />, // Accuracy
      label: 'Average Accuracy %',
      value: `${metrics.average_accuracy_percent?.toFixed(1)}%`,
    },
    {
      icon: <Star className="w-9 h-9 text-blue-600" />, // Total Score
      label: 'Average Total Score',
      value: <>{avgTotalScore.toFixed(1)} <span className="text-xs text-slate-400 font-semibold">/ {maxMarks}</span></>,
    },
    {
      icon: <TrendingUp className="w-9 h-9 text-blue-600" />, // Attempt Rate
      label: 'Average Attempt Rate (%)',
      value: metrics.average_attempt_rate_percent?.toFixed(1),
    },
    {
      icon: <ArrowUpRight className="w-9 h-9 text-blue-600" />, // Top 10%
      label: 'Top 10% Avg Score',
      value: <>{top10PercentAvgScore.toFixed(1)} <span className="text-xs text-slate-400">/ {maxMarks}</span></>,
    },
    {
      icon: <ArrowDownRight className="w-9 h-9 text-blue-600" />, // Bottom 10%
      label: 'Bottom 10% Avg Score',
      value: <>{bottom10PercentAvgScore.toFixed(1)} <span className="text-xs text-slate-400 font-semibold">/ {maxMarks}</span></>,
    },
  ];

  // Top 10 performers
  const top10Performers = overallPerformance.map((perf: any) => ({
    id: perf.rank,
    name: perf.name,
    section: perf.section,
    score: perf.overall_score,
  }));

  return (
    <PageContainer>
      <div className="space-y-12 w-full">
        <FilterBar institutions={institutionOptions} batches={batchOptions} classes={sectionOptions} />
        <section className="mb-12">
          <div className="w-full flex flex-col gap-0 shadow-lg rounded-2xl overflow-hidden mb-12">
            <div className="flex flex-row w-full">
              {metricCards.slice(0, 3).map((card, idx) => (
                <div
                  key={card.label}
                  className={`flex flex-1 items-center py-6 px-8 min-w-0 bg-white ${
                    idx === 0 ? "rounded-tl-2xl" : "border-l border-[#E9E9E9]"
                  } ${idx === 2 ? "rounded-tr-2xl" : ""}`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-semibold text-gray-900 truncate">
                      {card.label}
                    </span>
                    <span className="mt-1 truncate font-extrabold text-gray-900 text-2xl">
                      {card.value}
                    </span>
                  </div>
                  <div className="flex items-center justify-center ml-auto">
                    <span className="inline-flex items-center justify-center rounded-full border border-blue-400 bg-white w-16 h-16">
                      {card.icon}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-row w-full border-t border-[#E9E9E9]">
              {metricCards.slice(3, 6).map((card, idx) => (
                <div
                  key={card.label}
                  className={`flex flex-1 items-center py-6 px-8 min-w-0 bg-white ${
                    idx === 0 ? "rounded-bl-2xl" : "border-l border-[#E9E9E9]"
                  } ${idx === 2 ? "rounded-br-2xl" : ""}`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-semibold text-gray-900 truncate">
                      {card.label}
                    </span>
                    <span className="mt-1 truncate font-extrabold text-gray-900 text-2xl">
                      {card.value}
                    </span>
                  </div>
                  <div className="flex items-center justify-center ml-auto">
                    <span className="inline-flex items-center justify-center rounded-full border border-blue-400 bg-white w-16 h-16">
                      {card.icon}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-1 flex flex-col gap-6">
              <div className="w-full border border-blue-100 rounded-2xl p-6 bg-white/90 shadow-md flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-blue-900">Average Total Score</span>
                  <span className="ml-2 px-3 py-2 text-xs rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-semibold">Max: {maxMarks}</span>
                </div>
                <div className="flex flex-col items-center justify-center h-[320px]">
                  <AverageTotalScoreGauge avgScore={avgTotalScore} maxMarks={parseFloat(maxMarks)} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6 md:col-span-1">
              <div className="bg-white/90 rounded-2xl shadow-lg border border-blue-100 px-8 py-6 flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl font-bold text-blue-900">NEET Readiness</span>
                </div>
                <span className="text-5xl font-extrabold text-emerald-600 mb-1">
                  {neetReadiness.percentage_students_above_400?.toFixed(1)}%
                </span>
                <span className="text-sm text-slate-500 font-medium">% students scoring ≥ 400</span>
              </div>
              <div>
                <PerformanceTrendBarChart trendData={trendGraph} maxMarks={parseFloat(maxMarks)} subject={filter.subject || "Physics"} />
              </div>
            </div>
            <div className="md:col-span-1 flex flex-col gap-6">
              <div className="w-full border border-red-100 rounded-2xl p-6 bg-white/90 shadow-md flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-red-900">Risk Breakdown</span>
                </div>
                <div className="flex flex-col items-center justify-center h-[325px] w-full">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={riskData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        fill="#8884d8"
                        label={props => {
                          const { name, percent, cx, cy, midAngle, outerRadius } = props;
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 18;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#22223b"
                              fontSize={13}
                              fontWeight={500}
                              textAnchor={x > cx ? "start" : "end"}
                              alignmentBaseline="middle"
                              style={{ pointerEvents: "none", whiteSpace: "pre" }}
                            >
                              {name} {Math.round(percent * 100)}%
                            </text>
                          );
                        }}
                      >
                        {riskData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-white border border-slate-200 rounded shadow px-3 py-2 text-xs text-blue-900">
                              <b>{d.name}</b>
                            </div>
                          );
                        }
                        return null;
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-4">
                    <span className="flex items-center gap-1 text-xs text-red-500 font-semibold"><span className="inline-block w-3 h-3 rounded-full bg-red-400"></span> At Risk</span>
                    <span className="flex items-center gap-1 text-xs text-orange-400 font-semibold"><span className="inline-block w-3 h-3 rounded-full bg-orange-400"></span> Medium</span>
                    <span className="flex items-center gap-1 text-xs text-emerald-500 font-semibold"><span className="inline-block w-3 h-3 rounded-full bg-emerald-400"></span> Safe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="w-full bg-white/90 border border-blue-100 rounded-2xl shadow-lg px-6 py-4 mb-6 flex flex-col gap-2">
          {/* You can add additional KPIs here if available from backend */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <DashboardCard
            title="Top 10 Performers"
            className="md:col-span-12 bg-white/90 rounded-2xl shadow-lg border border-blue-100 p-6"
            content={(() => (
              <div className="w-full">
                <DataTable
                  rows={top10Performers}
                  columns={[
                    { field: "id", label: "Rank", align: "center" },
                    { field: "name", label: "Name", align: "center" },
                    { field: "section", label: "Section", align: "center" },
                    { field: "score", label: `Overall Score`, align: "center" },
                  ]}
                  renderCell={(row, col) => {
                    if (col.field === "score") {
                      return row.score;
                    }
                    return row[col.field as keyof TableRow] ?? "";
                  }}
                />
              </div>
            ))()}
          />
        </div>
      </div>
    </PageContainer>
  );
}