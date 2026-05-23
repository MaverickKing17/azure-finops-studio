/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AlertCircle, FileText, CheckCircle, HelpCircle, Activity, User, Save, Layers } from "lucide-react";
import { CostAnomaly } from "../types";

interface AnomaliesViewProps {
  anomalies: CostAnomaly[];
  onTriageAnomaly: (id: string, notes: string, status: "acknowledged" | "resolved", assigned?: string) => void;
  userRole: string;
}

export const AnomaliesView: React.FC<AnomaliesViewProps> = ({
  anomalies,
  onTriageAnomaly,
  userRole
}) => {
  const [selectedAnomaly, setSelectedAnomaly] = useState<CostAnomaly | null>(null);
  const [triageNotes, setTriageNotes] = useState("");
  const [assignee, setAssignee] = useState("");
  const [remedyStatus, setRemedyStatus] = useState<"acknowledged" | "resolved">("acknowledged");

  const openTriagePanel = (anom: CostAnomaly) => {
    setSelectedAnomaly(anom);
    setTriageNotes(anom.triageNotes || "");
    setAssignee(anom.assignedTo || "");
    setRemedyStatus(anom.status === "active" ? "acknowledged" : anom.status);
  };

  const handleSaveTriage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnomaly) return;

    onTriageAnomaly(selectedAnomaly.id, triageNotes, remedyStatus, assignee);
    setSelectedAnomaly(null);
  };

  const activeCount = anomalies.filter((a) => a.status === "active").length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Anomalies List panel */}
      <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-dark-border/60 pb-3 mb-4">
          <div>
            <h3 className="font-display font-semibold text-sm text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-500 animate-pulse" /> Anomalous cost Spikes Registry
            </h3>
            <p className="text-xs text-zinc-400">
              Machine learning-style detectors flagging daily spend increases exceeding 30% over rolling averages.
            </p>
          </div>

          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-mono">
            {activeCount} Active Spikes
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-400">
            <CheckCircle className="w-12 h-12 text-emerald-400 mb-2.5" />
            <h4 className="font-display font-semibold text-white">No Spikes Detected</h4>
            <p className="text-xs mt-1 max-w-sm">
              All cloud accounts remain perfectly nested within baseline standard deviation bands. No cost leakage.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                id={anom.id}
                className={`border rounded-xl p-4 transition-all cursor-pointer ${
                  anom.status === "active"
                    ? "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40"
                    : anom.status === "acknowledged"
                    ? "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20"
                    : "bg-dark-main/30 border-dark-border/50 text-zinc-400 opacity-75"
                } ${selectedAnomaly?.id === anom.id ? "ring-1 ring-azure" : ""}`}
                onClick={() => openTriagePanel(anom)}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                        anom.status === "active"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                          : anom.status === "acknowledged"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {anom.status}
                      </span>
                      <span className="font-mono text-zinc-500 text-[10px]">{anom.usageDate}</span>
                    </div>

                    <h4 className="font-display font-bold text-sm text-white mt-1.5">
                      {anom.resourceName}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      {anom.serviceName} • {anom.resourceGroup}
                    </p>
                  </div>

                  {/* Math panel */}
                  <div className="text-right">
                    <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold px-2 py-0.5 rounded font-mono text-[10px]">
                      +{anom.increasePercentage}% Spike
                    </span>
                    
                    <div className="mt-1">
                      <span className="text-white text-xs font-bold font-mono">
                        CAD {anom.actualCost.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        versus CAD {anom.expectedCost.toFixed(2)} expected
                      </span>
                    </div>
                  </div>
                </div>

                {anom.triageNotes && (
                  <div className="mt-3 p-2 bg-dark-main border border-dark-border text-[11px] rounded leading-relaxed text-zinc-400">
                    <strong>Triage Audit Note:</strong> {anom.triageNotes}
                    {anom.assignedTo && <span className="text-[10px] text-sky-400 font-mono block mt-1">✓ Assigned context: {anom.assignedTo}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected anomaly Triage control panel */}
      <div className="lg:col-span-1">
        {selectedAnomaly ? (
          <div className="bg-dark-card border border-azure/30 rounded-xl p-5 shadow-sm">
            <h3 className="font-display font-semibold text-sm text-white border-b border-dark-border/60 pb-2 mb-4 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-400" /> Administrative Triage Panel
            </h3>

            <div className="text-xs mb-4">
              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Spikey Target Resource</span>
              <strong className="text-white text-sm block mt-0.5 truncate">{selectedAnomaly.resourceName}</strong>
              <span className="text-[10px] font-mono text-rose-400 mt-1 block">
                Daily cost spiked from CAD {selectedAnomaly.expectedCost} to CAD {selectedAnomaly.actualCost} (+{selectedAnomaly.increasePercentage}%)
              </span>
            </div>

            <form onSubmit={handleSaveTriage} className="space-y-4 text-xs select-none">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wide">Assign Owner</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    placeholder="dev_ops@domain.com"
                    className="w-full bg-dark-main border border-dark-border/80 rounded-lg pl-8 pr-3 py-2 text-white focus:border-azure focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wide">Remediation Status</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRemedyStatus("acknowledged")}
                    className={`flex-1 py-2 font-mono text-[10px] font-bold uppercase rounded border transition-all cursor-pointer text-center ${
                      remedyStatus === "acknowledged"
                        ? "bg-amber-500/20 border-amber-500/80 text-amber-400 font-bold"
                        : "bg-dark-main border-dark-border text-zinc-400"
                    }`}
                  >
                    Acknowledge
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemedyStatus("resolved")}
                    className={`flex-1 py-2 font-mono text-[10px] font-bold uppercase rounded border transition-all cursor-pointer text-center ${
                      remedyStatus === "resolved"
                        ? "bg-emerald-500/20 border-emerald-500/80 text-emerald-400 font-bold"
                        : "bg-dark-main border-dark-border text-zinc-400"
                    }`}
                  >
                    Resolve
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wide">Triage & Investigation Notes</label>
                <textarea
                  required
                  rows={4}
                  value={triageNotes}
                  onChange={(e) => setTriageNotes(e.target.value)}
                  placeholder="e.g., Confirmed scheduled ETL pipeline was backup-looping, scaling cluster instances. Added cron shutdown policy."
                  className="w-full bg-dark-main border border-dark-border/80 rounded-lg px-3 py-2 text-white focus:border-azure focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-azure hover:bg-sky-600 text-white font-semibold font-mono flex items-center justify-center gap-1.5 h-9 rounded-lg transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Audit Status
              </button>
            </form>
          </div>
        ) : (
          <div className="border border-dark-border bg-dark-main/20 p-5 rounded-xl text-center text-xs text-zinc-400 flex flex-col items-center justify-center h-48">
            <Layers className="w-8 h-8 text-zinc-600 mb-2" />
            <p>Select any cost spike record from the registry to open administrative triage controls.</p>
          </div>
        )}
      </div>
    </div>
  );
};
