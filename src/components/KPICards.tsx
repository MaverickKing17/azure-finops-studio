/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { TrendingUp, AlertOctagon, Sparkles, DollarSign, Activity } from "lucide-react";

interface KPICardsProps {
  mtdSpend: number;
  dailyBurn: number;
  projectedSpend: number;
  monthlyBudget: number;
  wasteCost: number;
  anomaliesCount: number;
}

export const KPICards: React.FC<KPICardsProps> = ({
  mtdSpend,
  dailyBurn,
  projectedSpend,
  monthlyBudget,
  wasteCost,
  anomaliesCount
}) => {
  const budgetRunRatePercent = Math.round((projectedSpend / monthlyBudget) * 100);
  const isOverBudget = projectedSpend > monthlyBudget;

  const cards = [
    {
      id: "mtd-spend",
      title: "Month-to-Date Spend",
      value: `CAD ${mtdSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `Billing period: May 1 - May 23`,
      icon: <DollarSign className="w-5 h-5 text-sky-400" />,
      tag: "Actual Spend",
      tagColor: "bg-sky-500/10 text-sky-400 border-sky-500/20"
    },
    {
      id: "avg-burn",
      title: "Avg Daily Burn Rate",
      value: `CAD ${dailyBurn.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${anomaliesCount} cost spike anomalies tracked`,
      icon: <Activity className="w-5 h-5 text-amber-400" />,
      tag: anomaliesCount > 0 ? "Spikey Heat" : "Optimal Run",
      tagColor: anomaliesCount > 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    {
      id: "projected-spend",
      title: "Projected Month-End",
      value: `CAD ${projectedSpend.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtitle: `Budget: CAD ${monthlyBudget.toLocaleString()} (${budgetRunRatePercent}% utilized)`,
      icon: <TrendingUp className={`w-5 h-5 ${isOverBudget ? "text-rose-400 animate-pulse" : "text-emerald-400"}`} />,
      tag: isOverBudget ? "Budget Overrun" : "Under Budget",
      tagColor: isOverBudget ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    {
      id: "idle-waste",
      title: "Idle Resource Waste",
      value: `CAD ${wasteCost.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtitle: "Unattached disks, orphaned IPs & zombie VMs",
      icon: <AlertOctagon className="w-5 h-5 text-rose-500" />,
      tag: wasteCost > 0 ? "Action Required" : "Fully Optimized",
      tagColor: wasteCost > 0 ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.id}
          id={card.id}
          className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-sky-500/40 hover:bg-dark-hover/30 transition-all duration-200 shadow-sm relative overflow-hidden group"
        >
          {/* Subtle accent border on top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/20 to-transparent group-hover:via-sky-500/50 transition-all duration-300" />
          
          <div className="flex items-center justify-between mb-3">
            <span className="font-display font-medium text-xs tracking-wide text-zinc-400 uppercase">
              {card.title}
            </span>
            <div className="p-2 bg-dark-main border border-dark-border rounded-lg group-hover:scale-105 transition-all duration-200">
              {card.icon}
            </div>
          </div>
          
          <h3 className="font-display font-bold text-lg xl:text-xl text-white tracking-tight leading-none mb-1">
            {card.value}
          </h3>
          
          <p className="text-xs text-zinc-400 leading-tight mb-3">
            {card.subtitle}
          </p>

          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border ${card.tagColor}`}>
            {card.tag}
          </span>
        </div>
      ))}
    </div>
  );
};
