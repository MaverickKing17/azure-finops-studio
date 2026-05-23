/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core Azure Consumption Schema mirroring Microsoft.CostManagement/query response items
export interface AzureCostRecord {
  id: string; // Unique resource ID
  subscriptionId: string;
  subscriptionName: string;
  resourceGroup: string;
  resourceLocation: string; // e.g. "eastus", "westeurope", "canadacentral", "southeastasia"
  serviceName: string; // e.g. "Compute", "Storage", "Networking", "OpenAI Inference", "Databases", "Kubernetes", "AI Services"
  meterCategory: string; // e.g. "Virtual Machines", "Managed Disks", "ExpressRoute", "Azure OpenAI", "Cosmos DB", "Virtual Network"
  pretaxCost: number;
  currency: string; // "CAD"
  tags: {
    environment?: string; // production, staging, development, sandbox (mandatory)
    business_unit?: string; // Engineering, Finance, Marketing, Operations, AI Research (mandatory)
    owner?: string; // Owner email/ID (mandatory)
    cost_center?: string; // CC billing code (mandatory)
    [key: string]: string | undefined;
  };
  usageDate: string; // "YYYY-MM-DD"
  // Resource resource-level properties to enable Deep Optimization & Audits
  resourceName: string;
  utilizationRate?: number; // CPU/Memory/Ops utilisation (0 to 100%) for VM right-sizing
  status?: "active" | "idle" | "zombie"; // To support idle/zombie detection
}

// Multi-Tenant Simulation Configurations
export type FinOpsRole = "Enterprise Admin" | "Billing Admin" | "Resource Contributor";

export interface Organization {
  id: string;
  name: string;
  subscriptions: string[]; // subscriptionIds belonging to this org
  budget: number; // Monthly budget in CAD
}

export interface UserSession {
  currentOrgId: string;
  currentRole: FinOpsRole;
  currentSubscriptionId: string | "all"; // Global or segregated view
}

// Global Dashboard Filter Controls
export interface FinOpsFilterState {
  organizationId: string;
  subscriptionId: string | "all";
  resourceGroup: string | "all";
  serviceName: string | "all";
  environment: string | "all";
  businessUnit: string | "all";
  region: string | "all";
  dateRange: {
    startDate: string; // "YYYY-MM-DD"
    endDate: string; // "YYYY-MM-DD"
  };
}

// Tag Compliance Metrics
export interface TagComplianceResult {
  score: number; // 0 to 100
  totalResources: number;
  compliantCount: number;
  nonCompliantCount: number;
  auditGrid: NonCompliantResource[];
}

export interface NonCompliantResource {
  id: string;
  resourceName: string;
  serviceName: string;
  subscriptionName: string;
  resourceGroup: string;
  missingTags: string[]; // ["environment", "owner", etc.]
  invalidTags: string[]; // tags present but value empty or invalid
  estimatedDailyLeak: number; // Potential leakage in CAD due to poor allocation tracking
}

// Cost Anomalies
export interface CostAnomaly {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  resourceGroup: string;
  serviceName: string;
  resourceName: string;
  usageDate: string;
  actualCost: number;
  expectedCost: number; // 7-day rolling average
  increasePercentage: number; // e.g., 45% (Must be >30% to trigger)
  status: "active" | "acknowledged" | "resolved";
  assignedTo?: string; // Owner email for triage
  triageNotes?: string;
}

// Optimization Categories
export interface VMRightSizingRec {
  id: string;
  resourceId: string;
  resourceName: string;
  subscriptionName: string;
  currentSize: string; // e.g., Standard_D8s_v5
  recommendedSize: string; // e.g., Standard_D4s_v5
  currentCostMonthly: number;
  recommendedCostMonthly: number;
  estimatedSavingsMonthly: number;
  avgCpuPercent: number;
  maxCpuPercent: number;
  justification: string;
  impact: "No Impact" | "Minimal Downtime" | "Reboot Required";
}

export interface IdleAssetRec {
  id: string;
  resourceId: string;
  resourceName: string;
  subscriptionName: string;
  assetType: "Unattached Disk" | "Orphaned public IP" | "Unused ExpressRoute" | "Zombie VM";
  monthlyCost: number;
  lastUsedDate: string;
  justification: string;
}

export interface RISavingsPlanRec {
  id: string;
  serviceFamily: "Compute" | "Databases" | "Storage";
  currentMonthlyOnDemand: number;
  recommendedCommitmentHourly: number; // CAD/hour prepay commitment
  estimatedSavings1Year: number; // CAD monthly savings
  savingsPercentage: number; // e.g. 35
  breakEvenMonths: number; // e.g. 7.4 months
}

export interface OptimizationStrategyReport {
  vmRightSizing: VMRightSizingRec[];
  idleAssets: IdleAssetRec[];
  riSavingsPlans: RISavingsPlanRec[];
  totalPotentialSavings: number;
}

// Forecast Model matching Azure Forecast API
export interface ForecastDataPoint {
  date: string; // "YYYY-MM-DD"
  actualCost: number | null; // Null for future dates
  forecastCost: number;
  upperConfidence: number;
  lowerConfidence: number;
  isForecast: boolean;
}
