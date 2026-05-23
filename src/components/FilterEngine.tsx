/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Filter, Users, ShieldAlert, Library, Calendar, Globe } from "lucide-react";
import { FinOpsFilterState, FinOpsRole, Organization } from "../types";
import { ORGANIZATIONS, SUBSCRIPTION_NAMES } from "../data/mockData";

interface FilterEngineProps {
  filter: FinOpsFilterState;
  onChangeFilter: (updates: Partial<FinOpsFilterState>) => void;
  currentRole: FinOpsRole;
  onChangeRole: (role: FinOpsRole) => void;
  availableGroups: string[];
  availableServices: string[];
  availableRegions: string[];
}

export const FilterEngine: React.FC<FilterEngineProps> = ({
  filter,
  onChangeFilter,
  currentRole,
  onChangeRole,
  availableGroups,
  availableServices,
  availableRegions
}) => {
  const currentOrg = ORGANIZATIONS.find((o) => o.id === filter.organizationId) || ORGANIZATIONS[0];

  // Handle Organization change: need to reset sub selection to 'all' because subscriptions reside inside the selected org
  const handleOrgChange = (orgId: string) => {
    const nextOrg = ORGANIZATIONS.find((o) => o.id === orgId) || ORGANIZATIONS[0];
    onChangeFilter({
      organizationId: orgId,
      subscriptionId: "all",
      resourceGroup: "all",
      serviceName: "all",
      environment: "all",
      businessUnit: "all"
    });
  };

  // Determine pre-set dates filter
  const handleTimePresetChange = (days: number) => {
    const today = new Date("2026-05-23");
    const start = new Date(today.getTime());
    start.setDate(today.getDate() - (days - 1));
    
    onChangeFilter({
      dateRange: {
        startDate: start.toISOString().split("T")[0],
        endDate: "2026-05-23"
      }
    });
  };

  const currentPresetDays = () => {
    const start = new Date(filter.dateRange.startDate);
    const end = new Date(filter.dateRange.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysActive = currentPresetDays();

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 mb-6 shadow-sm">
      {/* Simulation Persona and Role Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-dark-border/60 pb-4 mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-azure/10 rounded-lg">
            <Users className="w-5 h-5 text-azure" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-sm text-white">
              SaaS Multi-Tenant Simulator Mode
            </h2>
            <p className="text-xs text-zinc-400">
              Switching corporate tenants isolates dataset namespaces and enforces strict authorization.
            </p>
          </div>
        </div>

        {/* Roles and Tenant switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Org Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Tenant:</span>
            <select
              value={filter.organizationId}
              onChange={(e) => handleOrgChange(e.target.value)}
              className="bg-dark-main border border-dark-border text-xs text-sky-400 font-medium px-3 py-1.5 rounded-lg focus:border-azure focus:outline-none transition-all cursor-pointer"
            >
              {ORGANIZATIONS.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-500" /> Role Proxy:
            </span>
            <select
              value={currentRole}
              onChange={(e) => onChangeRole(e.target.value as FinOpsRole)}
              className="bg-dark-main border border-dark-border text-xs text-amber-400 font-medium px-3 py-1.5 rounded-lg focus:border-azure focus:outline-none transition-all cursor-pointer"
            >
              <option value="Enterprise Admin">Enterprise Admin (Full RBAC)</option>
              <option value="Billing Admin">Billing Admin (Audit Only)</option>
              <option value="Resource Contributor">Resource Contributor (Constained)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Filter Options */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Subscription picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Subscription
          </label>
          <select
            value={filter.subscriptionId}
            onChange={(e) => onChangeFilter({ subscriptionId: e.target.value })}
            className="bg-dark-main border border-dark-border text-xs text-white px-2.5 py-2 rounded-lg focus:border-azure focus:outline-none cursor-pointer hover:border-dark-border/80 transition-all font-medium"
          >
            <option value="all">All Subscriptions</option>
            {currentOrg.subscriptions.map((subId) => (
              <option key={subId} value={subId}>
                {SUBSCRIPTION_NAMES[subId] || subId}
              </option>
            ))}
          </select>
        </div>

        {/* Resource group picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Resource Group
          </label>
          <select
            value={filter.resourceGroup}
            onChange={(e) => onChangeFilter({ resourceGroup: e.target.value })}
            className="bg-dark-main border border-dark-border text-xs text-white px-2.5 py-2 rounded-lg focus:border-azure focus:outline-none cursor-pointer hover:border-dark-border/80 transition-all font-medium"
          >
            <option value="all">All Resource Groups</option>
            {availableGroups.map((rg) => (
              <option key={rg} value={rg}>
                {rg}
              </option>
            ))}
          </select>
        </div>

        {/* Service filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Service Type
          </label>
          <select
            value={filter.serviceName}
            onChange={(e) => onChangeFilter({ serviceName: e.target.value })}
            className="bg-dark-main border border-dark-border text-xs text-white px-2.5 py-2 rounded-lg focus:border-azure focus:outline-none cursor-pointer hover:border-dark-border/80 transition-all font-medium"
          >
            <option value="all">All Services</option>
            {availableServices.map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))}
          </select>
        </div>

        {/* Location / Region picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Globe className="w-3 h-3 text-cyan-400" /> Region
          </label>
          <select
            value={filter.region}
            onChange={(e) => onChangeFilter({ region: e.target.value })}
            className="bg-dark-main border border-dark-border text-xs text-white px-2.5 py-2 rounded-lg focus:border-azure focus:outline-none cursor-pointer hover:border-dark-border/80 transition-all font-medium"
          >
            <option value="all">All Locations</option>
            {availableRegions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Environment selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Tag: environment
          </label>
          <select
            value={filter.environment}
            onChange={(e) => onChangeFilter({ environment: e.target.value })}
            className="bg-dark-main border border-dark-border text-xs text-white px-2.5 py-2 rounded-lg focus:border-azure focus:outline-none cursor-pointer hover:border-dark-border/80 transition-all font-medium"
          >
            <option value="all">All Envs</option>
            <option value="production">production</option>
            <option value="staging">staging</option>
            <option value="development">development</option>
            <option value="sandbox">sandbox</option>
          </select>
        </div>

        {/* Time period quick preset config */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-violet-400" /> Billing window
          </label>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleTimePresetChange(30)}
              className={`text-[10px] font-mono border py-2 rounded-lg transition-all cursor-pointer text-center ${
                daysActive === 30
                  ? "bg-azure/20 border-azure text-sky-400 font-bold"
                  : "bg-dark-main border-dark-border text-zinc-400 hover:text-white"
              }`}
            >
              30D
            </button>
            <button
              onClick={() => handleTimePresetChange(60)}
              className={`text-[10px] font-mono border py-2 rounded-lg transition-all cursor-pointer text-center ${
                daysActive === 60
                  ? "bg-azure/20 border-azure text-sky-400 font-bold"
                  : "bg-dark-main border-dark-border text-zinc-400 hover:text-white"
              }`}
            >
              60D
            </button>
            <button
              onClick={() => handleTimePresetChange(90)}
              className={`text-[10px] font-mono border py-2 rounded-lg transition-all cursor-pointer text-center ${
                daysActive === 90
                  ? "bg-azure/20 border-azure text-sky-400 font-bold"
                  : "bg-dark-main border-dark-border text-zinc-400 hover:text-white"
              }`}
            >
              90D
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
