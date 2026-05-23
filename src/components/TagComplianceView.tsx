/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, BadgeInfo, CheckCircle, Flame, PenTool, Layers } from "lucide-react";
import { TagComplianceResult, NonCompliantResource } from "../types";

interface TagComplianceViewProps {
  auditResult: TagComplianceResult;
  onRemediate: (resourceName: string, tags: Record<string, string>) => void;
  userRole: string;
}

export const TagComplianceView: React.FC<TagComplianceViewProps> = ({
  auditResult,
  onRemediate,
  userRole
}) => {
  const [selectedResource, setSelectedResource] = useState<NonCompliantResource | null>(null);
  const [envVal, setEnvVal] = useState("development");
  const [ownerVal, setOwnerVal] = useState("");
  const [ccVal, setCcVal] = useState("");

  const handleOpenRemediation = (res: NonCompliantResource) => {
    setSelectedResource(res);
    setEnvVal("development");
    setOwnerVal(`finance_audit@contosoparts.com`);
    setCcVal(`CC-AUD-${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleRemediateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;
    
    onRemediate(selectedResource.resourceName, {
      environment: envVal,
      owner: ownerVal,
      cost_center: ccVal
    });

    setSelectedResource(null);
  };

  // Score colors
  const scoreColorClass = (score: number) => {
    if (score >= 85) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 60) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10 animate-pulse";
  };

  const canModify = userRole === "Enterprise Admin" || userRole === "Billing Admin";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar Score Audit Summary Card */}
      <div className="lg:col-span-1 bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm h-fit">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-azure" />
          <h3 className="font-display font-semibold text-sm text-white">Compliance Overview</h3>
        </div>

        {/* Ring score or huge visual typography display representing state */}
        <div className="flex flex-col items-center justify-center p-6 border border-dark-border/40 rounded-xl bg-dark-main/40 mb-5 text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Global Regulatory Score
          </span>
          <div className={`text-5xl font-display font-extrabold px-6 py-4 rounded-2xl border ${scoreColorClass(auditResult.score)} mb-3`}>
            {auditResult.score}%
          </div>
          
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-2">
            {auditResult.score >= 85 ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            )}
            <span>
              {auditResult.compliantCount} of {auditResult.totalResources} resources audited
            </span>
          </div>

          {/* Audit readiness status block */}
          <div className="mt-2 text-center">
            <span className="inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded text-[10px] font-mono font-semibold">
              ✓ System tag taxonomy matches institutional data boundaries
            </span>
          </div>

          <div className="text-[11px] text-zinc-400 text-left mt-4 border-t border-dark-border/40 pt-3 space-y-2 select-none">
            <p className="font-semibold text-white uppercase text-[9px] tracking-wider mb-1 font-mono">Institutional Governance Standard</p>
            <p className="leading-normal">
              To satisfy strict financial audit trails and regulatory lineage requirements, our continuous scanner validates that every infrastructure asset maintains compliant tags:
            </p>
            <div className="font-mono text-[10px] text-zinc-400 pl-1.5 border-l border-sky-500/50 space-y-1 mt-1.5 leading-tight">
              <div>• <code className="text-sky-400 font-bold">environment</code>: validates regulatory staging & safety boundaries</div>
              <div>• <code className="text-sky-400 font-bold">owner</code>: logs administrative and lineage custody</div>
              <div>• <code className="text-sky-400 font-bold">cost_center</code>: maps institutional budget accountability</div>
            </div>
          </div>
        </div>

        {/* Metrics stack */}
        <div className="space-y-3.5 text-xs">
          <div className="flex items-center justify-between p-3 bg-dark-main border border-dark-border rounded-lg">
            <span className="text-zinc-400">Total Checked Resources</span>
            <span className="font-mono font-semibold text-white">{auditResult.totalResources}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-dark-main border border-dark-border rounded-lg">
            <span className="text-emerald-400">Compliant Count</span>
            <span className="font-mono font-semibold text-emerald-400">{auditResult.compliantCount}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-dark-main border border-dark-border rounded-lg">
            <span className="text-rose-400">Non-Compliant Count</span>
            <span className="font-mono font-semibold text-rose-400">{auditResult.nonCompliantCount}</span>
          </div>

          <div className="flex items-center justify-between p-3 border border-rose-500/30 bg-rose-500/5 rounded-lg">
            <span className="text-rose-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 shrink-0" /> Cumulative Allocation Risk
            </span>
            <span className="font-mono font-semibold text-rose-400">
              CAD {auditResult.auditGrid.reduce((sum, item) => sum + item.estimatedDailyLeak, 0).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day
            </span>
          </div>
        </div>
      </div>

      {/* Main Resource grid split panel */}
      <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-dark-border/60 pb-3 mb-4">
            <div>
              <h3 className="font-display font-semibold text-sm text-white">Non-Compliance Audit Registry</h3>
              <p className="text-xs text-zinc-400">Track and remediate untagged workloads causing financial leakages</p>
            </div>
            
            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-mono">
              {auditResult.nonCompliantCount} Violations Detected
            </span>
          </div>

          {/* Audit Grid Table */}
          {auditResult.auditGrid.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-400">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-2.5" />
              <h4 className="font-display font-semibold text-white text-sm">Perfect Governance Score!</h4>
              <p className="text-xs mt-1 max-w-sm">
                Every single cloud resource matches organizational policies and standard asset tag keys correctly. Excellent work.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-dark-border text-zinc-400">
                    <th className="pb-2 font-mono uppercase tracking-wider font-semibold text-[10px]">Resource Details</th>
                    <th className="pb-2 font-mono uppercase tracking-wider font-semibold text-[10px]">Tier (Service)</th>
                    <th className="pb-2 font-mono uppercase tracking-wider font-semibold text-[10px]">Missing tags</th>
                    <th className="pb-2 font-mono uppercase tracking-wider font-semibold text-[10px]">Daily Spend</th>
                    <th className="pb-2 font-mono uppercase tracking-wider font-semibold text-[10px] text-right">Remedy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40">
                  {auditResult.auditGrid.map((item) => (
                    <tr key={item.id} className="hover:bg-dark-hover/20 transition-colors">
                      <td className="py-3">
                        <span className="font-display font-medium text-white block">{item.resourceName}</span>
                        <span className="text-[10px] text-zinc-500 block truncate max-w-[200px]">{item.resourceGroup}</span>
                      </td>
                      <td className="py-3 font-mono text-zinc-300">
                        {item.serviceName}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.missingTags.map((t) => (
                            <span key={t} className="bg-rose-500/15 text-rose-400 border border-rose-500/20 px-1 rounded font-mono text-[9px]">
                              -{t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 font-mono font-medium text-rose-400">
                        CAD {item.estimatedDailyLeak.toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        {canModify ? (
                          <button
                            onClick={() => handleOpenRemediation(item)}
                            className="bg-azure/10 text-sky-400 hover:bg-azure border border-azure/30 hover:text-white px-2 py-1 rounded transition-all text-[11px] font-mono cursor-pointer"
                          >
                            Resolve
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono italic">Access Blocked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Remediation Panel - overlay modal popup or inline */}
        {selectedResource && (
          <div className="mt-5 p-4 bg-dark-main border border-azure-blue/30 rounded-xl relative">
            <div className="flex items-center justify-between mb-3 border-b border-dark-border/50 pb-2">
              <h4 className="font-display font-semibold text-xs text-white flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-sky-400" /> Remediate Asset Tags:
                <code className="text-sky-400 font-mono bg-dark-card px-1.5 py-0.5 rounded">{selectedResource.resourceName}</code>
              </h4>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer font-bold"
              >
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={handleRemediateSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-end text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-zinc-400">environment</label>
                <select
                  value={envVal}
                  onChange={(e) => setEnvVal(e.target.value)}
                  className="bg-dark-card border border-dark-border rounded px-2.5 py-1.5 text-white focus:border-azure focus:outline-none"
                >
                  <option value="production">production</option>
                  <option value="staging">staging</option>
                  <option value="development">development</option>
                  <option value="sandbox">sandbox</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-zinc-400">owner</label>
                <input
                  type="email"
                  required
                  value={ownerVal}
                  onChange={(e) => setOwnerVal(e.target.value)}
                  placeholder="owner@domain.com"
                  className="bg-dark-card border border-dark-border rounded px-2.5 py-1.5 text-white focus:border-azure focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-zinc-400">cost_center</label>
                <input
                  type="text"
                  required
                  value={ccVal}
                  onChange={(e) => setCcVal(e.target.value)}
                  placeholder="CC-FIN-771"
                  className="bg-dark-card border border-dark-border rounded px-2.5 py-1.5 text-white focus:border-azure focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="bg-azure hover:bg-sky-600 text-white font-semibold font-mono h-9 rounded cursor-pointer transition-colors"
              >
                Remediate Tag Rules
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
