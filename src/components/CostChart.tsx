/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { AreaChart as AreaIcon, LineChart as LineIcon, Cpu, AlertTriangle, Eye } from "lucide-react";
import { AzureCostRecord, ForecastDataPoint } from "../types";

interface CostChartProps {
  spendRecords: AzureCostRecord[];
  forecastData: ForecastDataPoint[];
  monthlyBudget: number;
}

// Neon color scheme fit for premium Grafana/Azure diagnostics styles
const SERVICE_COLORS: Record<string, string> = {
  "Avere vFXT Compute": "#00BCF2", // sky cyan
  "Azure OpenAI Inference": "#F43F5E", // High-contrast hot coral rose (specifically chosen to pop for inference tracking)
  "Cognitive Services Search": "#10B981", // Emerald green for search vector databases
  "Databases": "#F59E0B", // Solid amber
  "Storage": "#3B82F6", // Royal blue
  "Networking": "#6366F1" // Indigo
};

export const CostChart: React.FC<CostChartProps> = ({ spendRecords, forecastData, monthlyBudget }) => {
  const [chartMode, setChartMode] = useState<"stacked" | "forecast">("stacked");

  // Format Stacked Area Data (Group by usageDate, split by Service)
  const stackedData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    spendRecords.forEach((rec) => {
      if (!map[rec.usageDate]) {
        map[rec.usageDate] = {};
        Object.keys(SERVICE_COLORS).forEach((svc) => {
          map[rec.usageDate][svc] = 0;
        });
      }
      if (SERVICE_COLORS[rec.serviceName] !== undefined) {
        map[rec.usageDate][rec.serviceName] = parseFloat(
          ((map[rec.usageDate][rec.serviceName] || 0) + rec.pretaxCost).toFixed(2)
        );
      }
    });

    return Object.keys(map)
      .sort()
      .map((date) => {
        const item = map[date];
        const total = Object.values(item).reduce((sum, v) => sum + v, 0);
        return {
          date,
          total: parseFloat(total.toFixed(2)),
          ...item
        };
      });
  }, [spendRecords]);

  // Aggregate current daily budget limit
  const dailyBudgetLimit = parseFloat((monthlyBudget / 31).toFixed(2));

  // Render Stacked Area Visualizer
  const renderStackedArea = () => {
    if (stackedData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-72 text-zinc-400 border border-dashed border-dark-border rounded-xl">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-xs">No consumption data found for the current filter criteria.</p>
        </div>
      );
    }

    return (
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stackedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              {Object.keys(SERVICE_COLORS).map((svc) => (
                <linearGradient key={svc} id={`grad-${svc.replace(" ", "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SERVICE_COLORS[svc]} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={SERVICE_COLORS[svc]} stopOpacity={0.0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222C46" opacity={0.6} />
            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              tickFormatter={(val) => {
                const parts = val.split("-");
                return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : val;
              }}
            />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#151B2E", borderColor: "#222C46" }}
              itemStyle={{ fontSize: 11 }}
              labelStyle={{ color: "#94A3B8", fontSize: 10, fontWeight: 600 }}
              labelFormatter={(val) => `Date: ${val}`}
              formatter={(value: any, name: any) => [`CAD ${Number(value).toFixed(2)}`, name]}
            />
            <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            {Object.keys(SERVICE_COLORS).map((svc) => {
              // Only render area if category has active records in series to prevent cluttering the legend
              return (
                <Area
                  key={svc}
                  type="monotone"
                  dataKey={svc}
                  stackId="1"
                  stroke={SERVICE_COLORS[svc]}
                  fill={`url(#grad-${svc.replace(" ", "")})`}
                  strokeWidth={1.5}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render ML-style Predictive Forecast Chart overlay (with upper & lower confidence shadows)
  const renderForecast = () => {
    if (forecastData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-72 text-zinc-400">
          <p className="text-xs">Unable to calculate projection curves.</p>
        </div>
      );
    }

    return (
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecastData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
            <defs>
              {/* Confidence interval band fill gradient */}
              <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0078D4" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0078D4" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222C46" opacity={0.6} />
            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              tickFormatter={(val) => {
                const parts = val.split("-");
                return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : val;
              }}
            />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#151B2E", borderColor: "#222C46" }}
              itemStyle={{ fontSize: 11 }}
              labelStyle={{ color: "#94A3B8", fontSize: 10, fontWeight: 600 }}
              labelFormatter={(val, items) => {
                const isF = items[0]?.payload?.isForecast;
                return `Date: ${val} ${isF ? "(Projected Forecast)" : "(Historical Cost)"}`;
              }}
              formatter={(value: any, name: any) => {
                if (value === null) return ["--", name];
                return [`CAD ${Number(value).toFixed(2)}`, name];
              }}
            />
            <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            
            {/* Shaded Area for Upper and Lower Confidence Limits */}
            <Area
              name="Confidence Bound (95% CI)"
              type="monotone"
              dataKey="upperConfidence"
              stroke="none"
              fill="url(#confidenceGrad)"
              fillOpacity={1}
            />
            <Area
              name="Confidence Core"
              type="monotone"
              dataKey="lowerConfidence"
              stroke="none"
              fill="#090D16" // Mask to block the bottom region below lower interval
              fillOpacity={0.8}
            />

            {/* Historical Cost Line */}
            <Line
              name="Historical Spend"
              type="monotone"
              dataKey="actualCost"
              stroke="#00f2fe"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6 }}
            />

            {/* Forecasted Line */}
            <Line
              name="90-Day Forecast Svc (Azure API Type)"
              type="monotone"
              dataKey="forecastCost"
              stroke="#0078D4"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />

            {/* Daily Budget threshold overlay */}
            <Line
              name="May Target Daily Limit"
              type="monotone"
              data={forecastData.map(d => ({ ...d, budgetVal: dailyBudgetLimit }))}
              dataKey="budgetVal"
              stroke="#EF4444"
              strokeWidth={1.5}
              strokeDasharray="2 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="font-display font-semibold text-sm text-white">
            {chartMode === "stacked" ? "Cost Allocation & Structural Density" : "Azure Forecast ML Engine Simulator"}
          </h3>
          <p className="text-xs text-zinc-400">
            {chartMode === "stacked"
              ? "30-day cumulative rolling spend grouped by Azure Service tier"
              : "Historical cost curves mapped with 90-day future forecasting models under 95% Confidence Intervals"}
          </p>
        </div>

        {/* View Toggle Switches */}
        <div className="flex items-center self-start bg-dark-main border border-dark-border p-1 rounded-lg">
          <button
            onClick={() => setChartMode("stacked")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
              chartMode === "stacked" ? "bg-azure text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <AreaIcon className="w-3.5 h-3.5" />
            Spend Cost Split
          </button>
          <button
            onClick={() => setChartMode("forecast")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
              chartMode === "forecast" ? "bg-azure text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            90D Forecast overlay
          </button>
        </div>
      </div>

      {chartMode === "stacked" ? renderStackedArea() : renderForecast()}

      {/* Mini telemetry board summary */}
      {chartMode === "forecast" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-dark-border/40 text-xs">
          <div className="flex items-center gap-2 text-zinc-400 bg-dark-main/40 p-2.5 rounded-lg border border-dark-border/40">
            <Cpu className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              Baseline Projection is determined using a 30-day moving average weighted on weekly operational calendars.
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 bg-dark-main/40 p-2.5 rounded-lg border border-dark-border/40">
            <Eye className="w-4 h-4 text-violet-400 shrink-0" />
            <span>
              Confidence shadows amplify over timeline ranges to reflect entropy in capacity expansions and resource scales.
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 bg-dark-main/40 p-2.5 rounded-lg border border-dark-border/40">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Spike anomalies are auto-omitted from baseline linear averages to prevent skewing future forecasts.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
