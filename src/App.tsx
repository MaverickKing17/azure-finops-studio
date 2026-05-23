/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  ShieldAlert,
  Sliders,
  TrendingDown,
  Activity,
  LogOut,
  FolderLock,
  Compass,
  AlertTriangle,
  HelpCircle,
  PiggyBank,
  CheckCircle,
  Coins,
  DollarSign
} from "lucide-react";
import { FinOpsFilterState, FinOpsRole } from "./types";
import { dbInstance, ORGANIZATIONS, SUBSCRIPTION_NAMES } from "./data/mockData";

// Components
import { KPICards } from "./components/KPICards";
import { FilterEngine } from "./components/FilterEngine";
import { CostChart } from "./components/CostChart";
import { TagComplianceView } from "./components/TagComplianceView";
import { OptimizationView } from "./components/OptimizationView";
import { AnomaliesView } from "./components/AnomaliesView";

export default function App() {
  // Navigation Workspaces tabs
  const [activeWorkspace, setActiveWorkspace] = useState<"dashboard" | "compliance" | "strategy" | "anomalies">("dashboard");

  // User RBAC simulation state
  const [currentRole, setCurrentRole] = useState<FinOpsRole>("Enterprise Admin");

  // Dynamic refresh state to force reload components on inline db update actions
  const [refreshSeed, setRefreshSeed] = useState(0);
  const triggerRefresh = () => setRefreshSeed((s) => s + 1);

  // Global Filter State Defaults (anchored around final date of May 23, 2026)
  const [filter, setFilter] = useState<FinOpsFilterState>({
    organizationId: "contoso",
    subscriptionId: "all",
    resourceGroup: "all",
    serviceName: "all",
    environment: "all",
    businessUnit: "all",
    region: "all",
    dateRange: {
      startDate: "2026-04-24", // Default to last 30 days
      endDate: "2026-05-23"
    }
  });

  const handleUpdateFilter = (updates: Partial<FinOpsFilterState>) => {
    setFilter((prev) => ({ ...prev, ...updates }));
  };

  // -------------------------------------------------------------
  // Stateful Data Computations from our NoSQL Simulator DB Instance
  // -------------------------------------------------------------
  const activeOrg = useMemo(() => {
    return ORGANIZATIONS.find((o) => o.id === filter.organizationId) || ORGANIZATIONS[0];
  }, [filter.organizationId]);

  // Query Spend records based on active filters
  const spendRecords = useMemo(() => {
    return dbInstance.querySpend(filter);
  }, [filter, refreshSeed]);

  // Derive unique dropdown selectors dynamically relative to selected Tenant to prevent broken empty queries
  const { availableGroups, availableServices, availableRegions } = useMemo(() => {
    // query base spend for the selected org to see what exists
    const baseOrgSpend = dbInstance.querySpend({
      organizationId: filter.organizationId,
      subscriptionId: "all",
      resourceGroup: "all",
      serviceName: "all",
      environment: "all",
      businessUnit: "all",
      region: "all",
      dateRange: { startDate: "2026-02-22", endDate: "2026-05-23" } // probe full history
    });

    const groups = new Set<string>();
    const services = new Set<string>();
    const regions = new Set<string>();

    baseOrgSpend.forEach((item) => {
      if (item.resourceGroup) groups.add(item.resourceGroup);
      if (item.serviceName) services.add(item.serviceName);
      if (item.resourceLocation) regions.add(item.resourceLocation);
    });

    return {
      availableGroups: Array.from(groups).sort(),
      availableServices: Array.from(services).sort(),
      availableRegions: Array.from(regions).sort()
    };
  }, [filter.organizationId, refreshSeed]);

  // Query Anomalies
  const anomalies = useMemo(() => {
    return dbInstance.queryAnomalies(filter.organizationId);
  }, [filter.organizationId, refreshSeed]);

  // Query Recommendations
  const rightSizingList = useMemo(() => {
    return dbInstance.queryRightSizing(filter.organizationId, filter.subscriptionId);
  }, [filter.organizationId, filter.subscriptionId, refreshSeed]);

  const idleAssetsList = useMemo(() => {
    return dbInstance.queryIdleAssets(filter.organizationId, filter.subscriptionId);
  }, [filter.organizationId, filter.subscriptionId, refreshSeed]);

  const riList = useMemo(() => {
    return dbInstance.queryRIRecommendations();
  }, [refreshSeed]);

  // Query Tag auditing
  const auditResult = useMemo(() => {
    return dbInstance.auditTags(filter.organizationId, filter.subscriptionId);
  }, [filter.organizationId, filter.subscriptionId, refreshSeed]);

  // Query Predictive Forecast Data Curve
  const forecastData = useMemo(() => {
    return dbInstance.generateForecast(filter);
  }, [filter, refreshSeed]);

  // -------------------------------------------------------------
  // Dynamic May 2026 KPI Aggregations (May 1st - May 23rd)
  // -------------------------------------------------------------
  const mtdSpend = useMemo(() => {
    const mayRecords = spendRecords.filter(
      (r) => r.usageDate >= "2026-05-01" && r.usageDate <= "2026-05-23"
    );
    return mayRecords.reduce((sum, item) => sum + item.pretaxCost, 0);
  }, [spendRecords]);

  const dailyBurn = useMemo(() => {
    return mtdSpend / 23; // May 1 to May 23 is 23 active calendar days
  }, [mtdSpend]);

  const projectedSpend = useMemo(() => {
    return dailyBurn * 31; // Projected full month of May
  }, [dailyBurn]);

  const wasteCost = useMemo(() => {
    return idleAssetsList.reduce((sum, item) => sum + item.monthlyCost, 0);
  }, [idleAssetsList]);

  // -------------------------------------------------------------
  // Inline DB Mutation Handler Calls
  // -------------------------------------------------------------
  const handleExecuteRightSize = (id: string) => {
    const ok = dbInstance.executeRightSize(id);
    if (ok) triggerRefresh();
  };

  const handleExecuteReclaimIdle = (id: string) => {
    const ok = dbInstance.executeReclaimIdle(id);
    if (ok) triggerRefresh();
  };

  const handleRemediateTags = (resourceName: string, resolvedTags: Record<string, string>) => {
    const ok = dbInstance.resolveComplianceTags(resourceName, resolvedTags);
    if (ok) triggerRefresh();
  };

  const handleTriageAnomaly = (
    id: string,
    notes: string,
    status: "acknowledged" | "resolved",
    assigned?: string
  ) => {
    const ok = dbInstance.updateAnomaly(id, {
      triageNotes: notes,
      status,
      assignedTo: assigned
    });
    if (ok) triggerRefresh();
  };

  // -------------------------------------------------------------
  // Sidebar Workspace options mapping
  // -------------------------------------------------------------
  const navItems = [
    {
      id: "dashboard",
      name: "Control Panel",
      icon: <LayoutDashboard className="w-4 h-4" />,
      desc: "Executive cloud cost tracking and forecast models"
    },
    {
      id: "anomalies",
      name: "Cost Spike Triage",
      icon: <Activity className="w-4 h-4" />,
      desc: "ML anomaly alerts and operational logging triage board",
      badge: anomalies.filter((a) => a.status === "active").length || undefined
    },
    {
      id: "compliance",
      name: "Compliance Auditor",
      icon: <ShieldAlert className="w-4 h-4" />,
      desc: "Tag taxonomy auditor and automated allocation risk scoring",
      badge: auditResult.nonCompliantCount || undefined
    },
    {
      id: "strategy",
      name: "Strategy Desk",
      icon: <Sliders className="w-4 h-4" />,
      desc: "Automated rightsizing suggestions and financial simulations",
      badge: rightSizingList.length + idleAssetsList.length || undefined
    }
  ];

  return (
    <div className="min-h-screen bg-dark-main text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Dynamic Master Corporate Header */}
      <header className="bg-dark-card border-b border-dark-border px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-azure p-2 rounded-xl text-white shadow-lg shadow-azure/20 flex items-center justify-center font-display font-black text-lg tracking-wider">
            AZ
          </div>
          <div>
            <h1 className="font-display font-extrabold text-base text-white tracking-tight leading-none">
              AzureFinOps Dev Studio
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono mt-1">
              Simulated Enterprise Cloud Financial Control Hub • UTC-Time: 2026-05-23
            </p>
          </div>
        </div>

        {/* Global budget status slider */}
        <div className="hidden xl:flex items-center gap-4 bg-dark-main border border-dark-border/80 rounded-xl px-4 py-2 text-xs">
          <div>
            <span className="text-zinc-500 font-mono text-[9px] block uppercase tracking-wider">
              {activeOrg.name} Target Budget
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-white font-bold font-mono">
                CAD {projectedSpend.toLocaleString("en", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-zinc-400 text-[10px]">/ CAD {activeOrg.budget.toLocaleString()}</span>
            </div>
          </div>

          {/* Budget progress bar */}
          <div className="w-24 bg-dark-card border border-dark-border rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                projectedSpend > activeOrg.budget
                  ? "bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] border-rose-400"
                  : "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)] border-emerald-300"
              }`}
              style={{ width: `${Math.min((projectedSpend / activeOrg.budget) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Active Operator metadata tag */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
            OPERATOR: kingnarmer
          </span>
        </div>
      </header>

      {/* Main Console Workspace Structure */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <nav className="w-full lg:w-72 bg-dark-card border-r border-dark-border p-4 flex flex-col justify-between shrink-0 gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-3 block mb-2">
              Optimization center
            </span>

            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveWorkspace(item.id as any)}
                className={`w-full flex items-start gap-3.5 px-3.5 py-3 rounded-xl text-left border transition-all cursor-pointer group ${
                  activeWorkspace === item.id
                    ? "bg-azure text-white border-azure/40 shadow-md shadow-azure/15"
                    : "bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-dark-hover/30 hover:border-dark-border/40"
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 transition-transform group-hover:scale-105 ${
                  activeWorkspace === item.id ? "bg-white/10 text-white" : "bg-dark-main border border-dark-border text-zinc-400 group-hover:text-white"
                }`}>
                  {item.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-xs tracking-tight">
                      {item.name}
                    </span>
                    {item.badge !== undefined && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                        activeWorkspace === item.id
                          ? "bg-white text-azure"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] mt-0.5 tracking-tight truncate leading-tight ${
                    activeWorkspace === item.id ? "text-sky-100" : "text-zinc-500 group-hover:text-zinc-400"
                  }`}>
                    {item.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Quick FinOps tips/rules info */}
          <div className="bg-dark-main border border-dark-border p-3.5 rounded-xl text-[11px] text-zinc-400 space-y-2">
            <h5 className="font-mono text-zinc-300 font-bold flex items-center gap-1 uppercase tracking-wide text-[10px]">
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" /> FinOps Core Mandate
            </h5>
            <p className="leading-relaxed">
              Pruning unused capacities, resolving non-allocated missing tags, and committing on solid coverage profiles yields up to 45% standard cloud optimization relief.
            </p>
          </div>
        </nav>

        {/* Main Work Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Dynamic Interactive Filter Box available globally */}
          <FilterEngine
            filter={filter}
            onChangeFilter={handleUpdateFilter}
            currentRole={currentRole}
            onChangeRole={setCurrentRole}
            availableGroups={availableGroups}
            availableServices={availableServices}
            availableRegions={availableRegions}
          />

          {/* KPI Summary Cards Bar available globally */}
          <KPICards
            mtdSpend={mtdSpend}
            dailyBurn={dailyBurn}
            projectedSpend={projectedSpend}
            monthlyBudget={activeOrg.budget}
            wasteCost={wasteCost}
            anomaliesCount={anomalies.filter((a) => a.status === "active").length}
          />

          {/* Animated Page view swap panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeWorkspace}
              initial={{ opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -7 }}
              transition={{ duration: 0.18 }}
              className="outline-none"
            >
              {activeWorkspace === "dashboard" && (
                <div className="space-y-6">
                  {/* Big telemetery line/area chart */}
                  <CostChart
                    spendRecords={spendRecords}
                    forecastData={forecastData}
                    monthlyBudget={activeOrg.budget}
                  />

                  {/* High Density resource detail list representing database entries */}
                  <div className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-border/60 pb-3 mb-4 gap-2">
                      <div>
                        <h4 className="font-display font-semibold text-sm text-white">
                          Azure Active Consumption Stream ({spendRecords.length} records)
                        </h4>
                        <p className="text-xs text-zinc-400">
                          Granular database records filtered and queried directly from Microsoft.CostManagement/query
                        </p>
                      </div>

                      <span className="bg-dark-main border border-dark-border px-3 py-1 text-[11px] text-zinc-400 rounded-lg font-mono">
                        Currency: CAD
                      </span>
                    </div>

                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-dark-border text-zinc-500 uppercase tracking-wider text-[10px] font-mono font-semibold">
                            <th className="pb-2.5">Date</th>
                            <th className="pb-2.5">Resource Class</th>
                            <th className="pb-2.5">RG Group</th>
                            <th className="pb-2.5">Region</th>
                            <th className="pb-2.5">Tags Allocated</th>
                            <th className="pb-2.5 text-right">Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border/40 font-mono">
                          {spendRecords.slice(-50).map((rec) => (
                            <tr key={rec.id} className="hover:bg-dark-hover/10 transition-colors text-zinc-300">
                              <td className="py-2 text-[11px] text-zinc-400 font-mono">{rec.usageDate}</td>
                              <td className="py-2">
                                <span className="font-display font-medium text-white block font-mono text-[11px]">{rec.resourceName}</span>
                                <span className="text-[10px] text-zinc-500 block">{rec.serviceName} • {rec.meterCategory}</span>
                              </td>
                              <td className="py-2 text-zinc-400 text-[11px]">{rec.resourceGroup}</td>
                              <td className="py-2 text-zinc-500 text-[11px]">{rec.resourceLocation}</td>
                              <td className="py-2">
                                <div className="flex flex-wrap gap-1">
                                  {Object.keys(rec.tags).length === 0 ? (
                                    <span className="text-rose-500/80 bg-rose-500/5 border border-rose-500/10 px-1 py-0.2 rounded text-[10px] leading-none">
                                      untagged
                                    </span>
                                  ) : (
                                    Object.entries(rec.tags)
                                      .slice(0, 2)
                                      .map(([k, v]) => (
                                        <span key={k} className="text-zinc-400 bg-dark-main border border-dark-border px-1 py-0.2 rounded text-[10px] leading-none">
                                          {k}:{v}
                                        </span>
                                      ))
                                  )}
                                  {Object.keys(rec.tags).length > 2 && (
                                    <span className="text-zinc-500 font-mono text-[9px] mt-0.5">+{Object.keys(rec.tags).length - 2} more</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 text-right text-sky-400 font-bold text-[11px]">
                                CAD {rec.pretaxCost.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeWorkspace === "anomalies" && (
                <AnomaliesView
                  anomalies={anomalies}
                  onTriageAnomaly={handleTriageAnomaly}
                  userRole={currentRole}
                />
              )}

              {activeWorkspace === "compliance" && (
                <TagComplianceView
                  auditResult={auditResult}
                  onRemediate={handleRemediateTags}
                  userRole={currentRole}
                />
              )}

              {activeWorkspace === "strategy" && (
                <OptimizationView
                  rightSizingList={rightSizingList}
                  idleAssetsList={idleAssetsList}
                  riList={riList}
                  onExecuteRightSize={handleExecuteRightSize}
                  onExecuteReclaimIdle={handleExecuteReclaimIdle}
                  userRole={currentRole}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Corporate footer details */}
      <footer className="bg-dark-card border-t border-dark-border px-6 py-3.5 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 font-mono">
        <span>Contoso Cloud FinOps Portal v2.4.1 (Simulated Platform)</span>
        <span className="mt-1.5 md:mt-0 flex items-center gap-1 text-zinc-400">
          Built according to Azure Cost Management API & Azure ConsumptionREST Standards
        </span>
      </footer>
    </div>
  );
}
