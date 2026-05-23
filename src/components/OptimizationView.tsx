/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Sparkles,
  TrendingDown,
  Trash2,
  Sliders,
  Scale,
  Zap,
  CheckCircle,
  HelpCircle,
  Clock,
  Coins
} from "lucide-react";
import { VMRightSizingRec, IdleAssetRec, RISavingsPlanRec } from "../types";

interface OptimizationViewProps {
  rightSizingList: VMRightSizingRec[];
  idleAssetsList: IdleAssetRec[];
  riList: RISavingsPlanRec[];
  onExecuteRightSize: (id: string) => void;
  onExecuteReclaimIdle: (id: string) => void;
  userRole: string;
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  rightSizingList,
  idleAssetsList,
  riList,
  onExecuteRightSize,
  onExecuteReclaimIdle,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<"sizing" | "idle" | "ri">("sizing");
  
  // State for Reserved Instance Slider Model
  const [riCoverage, setRiCoverage] = useState(70); // default 70% coverage

  const canModify = userRole === "Enterprise Admin";

  // Calculate dynamic savings metrics based on selected slider coverage index
  const riModel = riList[0] || {
    currentMonthlyOnDemand: 52000,
    recommendedCommitmentHourly: 42.5,
    estimatedSavings1Year: 18200,
    savingsPercentage: 35,
    breakEvenMonths: 6.8
  };

  const dynamicSim = () => {
    // scale factor based on coverage input slider
    const factor = riCoverage / 75; // normalized around 75%
    const monthlySpend = riModel.currentMonthlyOnDemand;
    
    // 35% standard savings curve
    const baseSavings = monthlySpend * (riModel.savingsPercentage / 100) * factor;
    const hourlyCommit = riModel.recommendedCommitmentHourly * factor;
    const cumulative1Year = baseSavings * 12;
    const breakEven = parseFloat((riModel.breakEvenMonths * (1 + (75 - riCoverage) * 0.005)).toFixed(1));

    return {
      monthlySpend,
      hourlyCommit: parseFloat(hourlyCommit.toFixed(2)),
      monthlySavings: Math.round(baseSavings),
      annualSavings: Math.round(cumulative1Year),
      breakEven
    };
  };

  const simResult = dynamicSim();

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm">
      {/* Tab select row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-dark-border/60 pb-3 mb-5 gap-3">
        <div>
          <h3 className="font-display font-semibold text-sm text-white flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-400" /> Enterprise FinOps Optimization стратегия Desk
          </h3>
          <p className="text-xs text-zinc-400">Generate actionable optimization suggestions to prune dead capacity and right-size systems</p>
        </div>

        {/* Small tabs */}
        <div className="flex items-center bg-dark-main border border-dark-border p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab("sizing")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
              activeTab === "sizing" ? "bg-azure text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            VM Right-Sizing
          </button>
          <button
            onClick={() => setActiveTab("idle")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
              activeTab === "idle" ? "bg-azure text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Idle Assets ({idleAssetsList.length})
          </button>
          <button
            onClick={() => setActiveTab("ri")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
              activeTab === "ri" ? "bg-azure text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            RI & Savings Plans
          </button>
        </div>
      </div>

      {/* Permissions banner warning if not Enterprise Admin */}
      {!canModify && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <Zap className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>RBAC Limitation:</strong> Your session role proxy is currently <strong>{userRole}</strong>. Executing right-sizing migrations or decommissioning resources requires <strong>Enterprise Admin</strong> access privileges. Let's toggle role proxy in filtration bar to execute.
          </span>
        </div>
      )}

      {/* RENDER ACTIVE OPTIMIZATION ENGINE VIEW */}
      {activeTab === "sizing" && (
        <div>
          {rightSizingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-400 border border-dashed border-dark-border rounded-xl">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
              <h4 className="font-display font-semibold text-white">All Active VMs Perfected!</h4>
              <p className="text-xs mt-1">There are no Virtual Machines idling or violating standard sizing bands. CPU utilization lines are healthy.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rightSizingList.map((rec) => (
                <div
                  key={rec.id}
                  id={rec.id}
                  className="border border-dark-border bg-dark-main/40 hover:border-sky-500/30 transition-all rounded-xl p-5 relative group"
                >
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-dark-border pb-3 mb-4">
                    <div>
                      <span className="text-[10px] bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-mono uppercase">
                        Virtual Machine Downsizing
                      </span>
                      <h4 className="font-display font-semibold text-base text-white mt-1 border-b border-transparent group-hover:border-sky-500/20 pb-0.5 inline-block">
                        {rec.resourceName}
                      </h4>
                      <p className="text-xs font-mono text-zinc-500 mt-0.5">{rec.resourceId}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-zinc-400 font-mono block">Estimated Savings:</span>
                      <span className="text-lg font-bold font-display text-emerald-400 leading-tight">
                        CAD {rec.estimatedSavingsMonthly}/month
                      </span>
                    </div>
                  </div>

                  {/* Specification grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
                    <div>
                      <span className="text-zinc-400 block font-mono text-[10px] uppercase">Current SKU & Cost</span>
                      <code className="text-rose-400 font-mono text-xs">{rec.currentSize}</code>
                      <span className="text-zinc-500 block text-[10px] mt-0.5">Current Monthly Cost: <strong className="text-rose-400">CAD {rec.currentCostMonthly}/mo</strong></span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block font-mono text-[10px] uppercase">Proposed SKU & Cost</span>
                      <code className="text-emerald-400 font-mono text-xs">{rec.recommendedSize}</code>
                      <span className="text-zinc-500 block text-[10px] mt-0.5">Proposed Monthly Cost: <strong className="text-emerald-400">CAD {rec.recommendedCostMonthly}/mo</strong></span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block font-mono text-[10px] uppercase font-semibold">Utilization (Avg / Max)</span>
                      <span className="font-mono text-white text-xs block mt-0.5">
                        {rec.avgCpuPercent}% / {rec.maxCpuPercent}% CPU
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block font-mono text-[10px] uppercase font-semibold">Remediation Impact</span>
                      <span className="font-mono text-amber-400 text-xs block mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" /> {rec.impact}
                      </span>
                    </div>
                  </div>

                  {/* Financial ROI Dashboard Box */}
                  <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-xs font-mono">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Estimated Efficiency ROI</span>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs">
                          <div>
                            <span className="text-zinc-400">Net Monthly Savings:</span>{" "}
                            <span className="text-emerald-400 font-bold">CAD {rec.estimatedSavingsMonthly.toLocaleString()}/mo</span>
                          </div>
                          <div className="hidden sm:block text-zinc-600">|</div>
                          <div>
                            <span className="text-zinc-400">Annualized Efficiency Gain:</span>{" "}
                            <span className="text-emerald-400 font-extrabold text-sm">CAD {(rec.estimatedSavingsMonthly * 12).toLocaleString()}/yr</span>
                          </div>
                        </div>
                      </div>
                      <span className="self-start sm:self-center text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                        ROI: {Math.round((rec.estimatedSavingsMonthly / rec.currentCostMonthly) * 100)}% Reclaimed
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-dark-card p-3 rounded-lg border border-dark-border/40">
                    <p className="text-zinc-400 max-w-2xl leading-relaxed">
                      <strong>Rationale:</strong> {rec.justification}
                    </p>

                    <button
                      disabled={!canModify}
                      onClick={() => onExecuteRightSize(rec.id)}
                      className={`font-mono text-xs font-bold px-4 py-2.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                        canModify
                          ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500 text-emerald-400 hover:text-white"
                          : "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      {canModify ? "Approve Rightsizing" : "Queue Optimization"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "idle" && (
        <div>
          {idleAssetsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-400 border border-dashed border-dark-border rounded-xl">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
              <h4 className="font-display font-semibold text-white">Cloud Waste Fully Reclaimed!</h4>
              <p className="text-xs mt-1">Excellent job. No orphaned IP addresses, zombie VMs, or unattached disk blocks are active on this account.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {idleAssetsList.map((rec) => (
                <div
                  key={rec.id}
                  id={rec.id}
                  className="bg-dark-main/30 border border-dark-border rounded-xl p-4 flex flex-col justify-between group hover:border-rose-400/30 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-dark-border/50 pb-2 mb-2.5">
                      <span className="font-mono text-[9px] uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded">
                        {rec.assetType}
                      </span>
                      <span className="text-zinc-400 font-mono text-[10px]">
                        Last Touched: {rec.lastUsedDate}
                      </span>
                    </div>

                    <h4 className="font-display font-semibold text-sm text-white group-hover:text-rose-400 transition-colors">
                      {rec.resourceName}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">{rec.resourceId}</p>

                    <p className="text-xs text-zinc-400 leading-relaxed mt-2.5 border-l-2 border-dark-border pl-2.5">
                      {rec.justification}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-dark-border/50 pt-3 mt-4 gap-3">
                    <div>
                      <span className="text-[10px] text-zinc-500 block font-mono">Cost Leaking:</span>
                      <span className="font-mono text-xs font-bold text-rose-400">CAD {rec.monthlyCost}/month</span>
                    </div>

                    <button
                      disabled={!canModify}
                      onClick={() => onExecuteReclaimIdle(rec.id)}
                      className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        canModify
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white"
                          : "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Decommission
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "ri" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Commitment coverage interactive slider */}
          <div className="bg-dark-main/30 border border-dark-border p-5 rounded-xl">
            <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400 animate-spin" /> Live Commitment Coverage Modeler
            </h4>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-zinc-400 font-mono">Target Commitment Target:</span>
                <span className="text-sm font-bold font-mono text-white bg-azure/20 border border-azure/30 px-2 py-0.5 rounded">
                  {riCoverage}% Coverage
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="95"
                value={riCoverage}
                onChange={(e) => setRiCoverage(Number(e.target.value))}
                className="w-full accent-azure bg-dark-card border border-dark-border rounded-lg h-1.5 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>30% (Low risk, low discount)</span>
                <span>95% (High risk, maximum reward)</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed bg-dark-card p-3 rounded-lg border border-dark-border/40">
              <strong>Optimization Strategy:</strong> Purchasing Azure Reserved Instances requires committing to a flat hourly rate for 1 or 3 years. At <strong>{riCoverage}%</strong> coverage, you buffer high-utilization nodes perfectly without risking over-committing on seasonal lulls.
            </p>
          </div>

          {/* Dynamic math visual indicators block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-dark-card border border-dark-border rounded-lg flex flex-col justify-between">
              <div>
                <span className="text-zinc-500 uppercase text-[9px] block">Current On-Demand Baseline</span>
                <span className="text-white text-sm font-bold block mt-1">
                  CAD {simResult.monthlySpend.toLocaleString()}/mo
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">Historical retail billing rate across resources.</p>
            </div>

            <div className="p-4 bg-dark-card border border-dark-border rounded-lg flex flex-col justify-between">
              <div>
                <span className="text-sky-400 uppercase text-[9px] block">Projected Prepay Commitment</span>
                <span className="text-sky-400 text-sm font-bold block mt-1">
                  CAD {simResult.hourlyCommit}/hour
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">Compulsory hourly spend commitment to Azure Billing.</p>
            </div>

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex flex-col justify-between">
              <div>
                <span className="text-emerald-400 uppercase text-[9px] block">Dynamic Net Savings (Est)</span>
                <span className="text-emerald-400 text-sm font-bold block mt-1">
                  CAD {simResult.monthlySavings.toLocaleString()}/mo
                </span>
                <span className="text-[10px] text-zinc-500 block">CAD {simResult.annualSavings.toLocaleString()}/year</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">Expected budget reclaimed via prepay discounts.</p>
            </div>

            <div className="p-4 bg-dark-card border border-dark-border rounded-lg flex flex-col justify-between">
              <div>
                <span className="text-zinc-500 uppercase text-[9px] block">Amortization crossover</span>
                <span className="text-white text-sm font-bold block mt-1">
                  {simResult.breakEven} Months
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">Time required before discounts offset setup commitments.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
