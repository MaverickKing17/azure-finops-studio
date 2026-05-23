/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AzureCostRecord,
  Organization,
  CostAnomaly,
  VMRightSizingRec,
  IdleAssetRec,
  RISavingsPlanRec,
  ForecastDataPoint,
  TagComplianceResult,
  NonCompliantResource,
  FinOpsFilterState,
  FinOpsRole
} from "../types";

// Setup our metadata organizations
export const ORGANIZATIONS: Organization[] = [
  {
    id: "contoso",
    name: "Contoso Enterprise Ltd",
    subscriptions: ["contoso-prod", "contoso-ai"],
    budget: 150000 // CAD per month
  },
  {
    id: "logistics",
    name: "Global Logistics Svc",
    subscriptions: ["logistics-shipping", "logistics-analytics"],
    budget: 85000 // CAD per month
  },
  {
    id: "apex",
    name: "Apex Innovation Lab",
    subscriptions: ["apex-sandbox", "apex-iot"],
    budget: 35000 // CAD per month
  }
];

export const SUBSCRIPTION_NAMES: Record<string, string> = {
  "contoso-prod": "Contoso Production Subscription",
  "contoso-ai": "Contoso Cognitive AI Subscription",
  "logistics-shipping": "Core Shipping Infrastructure Sub",
  "logistics-analytics": "Fleet & Analytics Sub",
  "apex-sandbox": "Apex R&D Sandbox Sub",
  "apex-iot": "IoT Edge & Telemetry Sub"
};

// Map subId to organization ID
export const SUBSCRIPTION_ORG_MAP: Record<string, string> = {
  "contoso-prod": "contoso",
  "contoso-ai": "contoso",
  "logistics-shipping": "logistics",
  "logistics-analytics": "logistics",
  "apex-sandbox": "apex",
  "apex-iot": "apex"
};

const LOCATIONS = ["canadacentral", "eastus", "westeurope", "southeastasia"];

// Helper to generate dates sequentially
const generateDateRange = (days: number, endDateStr: string): string[] => {
  const dates: string[] = [];
  const end = new Date(endDateStr);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getTime());
    d.setDate(end.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

// Seed deterministic noise based on string hash
const seededRandom = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(Math.sin(hash)) % 1;
};

/**
 * Stateful Simulation Database Engine that emulates Firestore NoSQL collections.
 * Allows updating states dynamically during user interaction!
 */
export class FinOpsDatabase {
  private rawRecords: AzureCostRecord[] = [];
  private anomalies: CostAnomaly[] = [];
  private rightSizing: VMRightSizingRec[] = [];
  private idleAssets: IdleAssetRec[] = [];
  private riRecommendations: RISavingsPlanRec[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    if (this.isInitialized) return;

    const endDate = "2026-05-23"; // Fixed anchor from metadata
    const dateRange = generateDateRange(90, endDate);

    // Categories to build
    const services = [
      { name: "Avere vFXT Compute", meter: "High-Performance Financial Modeling Compute", share: 0.35 },
      { name: "Azure OpenAI Inference", meter: "gpt-4o token consumption", share: 0.25 },
      { name: "Cognitive Services Search", meter: "Vector Indexes", share: 0.15 },
      { name: "Databases", meter: "Azure SQL DB", share: 0.13 },
      { name: "Storage", meter: "Managed Blocks", share: 0.07 },
      { name: "Networking", meter: "Virtual Network", share: 0.05 }
    ];

    // Seed variables
    let tempIdCounter = 1;

    // Generate spend per organization, subscription, service and date
    ORGANIZATIONS.forEach((org) => {
      org.subscriptions.forEach((subId) => {
        const subName = SUBSCRIPTION_NAMES[subId];

        // Resources list for this sub to keep consistency
        const resourceTemplates = Array.from({ length: 12 }).map((_, rIdx) => {
          const service = services[rIdx % services.length];
          const resNum = 100 + rIdx;
          const resourceName = `${subId}-${service.name.toLowerCase().replace(/ /g, "")}-res${resNum}`;
          const isNonCompliant =
            (org.id === "apex" && rIdx % 2 === 1) || // Apex has heavy non-compliance
            (org.id === "logistics" && rIdx === 3) ||
            (org.id === "contoso" && rIdx === 11);

          const rLocation = LOCATIONS[rIdx % LOCATIONS.length];

          // Determine tags
          const tags: Record<string, string> = {};
          
          if (!isNonCompliant || org.id !== "apex") {
            tags.environment = rIdx % 3 === 0 ? "production" : rIdx % 3 === 1 ? "staging" : "development";
            tags.business_unit = rIdx % 2 === 0 ? "Engineering" : "AI Research";
            tags.owner = `lead_dev_${resNum}@${org.id}parts.com`;
            tags.cost_center = `CC-SUB-${org.id.toUpperCase()}-${resNum}`;
          } else {
            // Apex Sandbox has missing mandatory tags
            if (rIdx % 4 === 1) {
              tags.environment = "sandbox"; // Owner and cost_center omitted
            } else if (rIdx % 4 === 3) {
              tags.business_unit = "Operations"; // missing environment, owner, etc.
            } else {
              // entirely empty tags
            }
          }

          // Resource baseline daily spend
          const multiplier = org.id === "contoso" ? 2.5 : org.id === "logistics" ? 1.4 : 0.6;
          const baseCost = (service.share * 150 + seededRandom(resourceName) * 40) * multiplier;

          // Resource utilization rate baseline
          const isVM = service.name === "Avere vFXT Compute" || service.name === "Compute";
          const utilizationRate = isVM 
            ? (rIdx % 5 === 0 ? 8 + seededRandom(resourceName) * 5 : 45 + seededRandom(resourceName) * 35) 
            : undefined;

          // status
          const status = isVM && utilizationRate && utilizationRate < 15 ? "idle" : "active";

          return {
            resourceId: `/subscriptions/${subId}/resourceGroups/rg-${org.id}-primary/providers/Microsoft.${service.name.replace(/ /g, "")}/${resourceName}`,
            resourceName,
            service,
            rLocation,
            tags,
            baseCost,
            utilizationRate,
            status,
            resourceGroup: `rg-${org.id}-primary`
          };
        });

        // Loop daily spend
        dateRange.forEach((date, dateIdx) => {
          resourceTemplates.forEach((res, resIdx) => {
            const seedKey = `${subId}-${res.resourceName}-${date}`;
            const randNoise = seededRandom(seedKey);
            const weekdayWeight = new Date(date).getDay() === 0 || new Date(date).getDay() === 6 ? 0.75 : 1.0;

            let actualDailyCost = res.baseCost * (0.95 + randNoise * 0.15) * weekdayWeight;

            // Introduce dynamic spike anomalies on specific dates
            // Spike 1: OpenAI tokens spike in contoso-ai (Azure OpenAI Inference)
            if (
              subId === "contoso-ai" &&
              res.service.name === "Azure OpenAI Inference" &&
              date >= "2026-05-16" &&
              date <= "2026-05-19"
            ) {
              const peakFactor = date === "2026-05-18" ? 3.4 : 1.8;
              actualDailyCost *= peakFactor;
            }

            // Spike 2: Databases spikes in logistics-shipping (Databases Capacity burst)
            if (
              subId === "logistics-shipping" &&
              res.service.name === "Databases" &&
              date >= "2026-05-02" &&
              date <= "2026-05-04"
            ) {
              const peakFactor = date === "2026-05-03" ? 2.9 : 1.6;
              actualDailyCost *= peakFactor;
            }

            // Spike 3: Compute scaling loop in apex-sandbox (Compute node spillover)
            if (
              subId === "apex-sandbox" &&
              (res.service.name === "Compute" || res.service.name === "Avere vFXT Compute") &&
              date === "2016-04-12"
            ) {
              actualDailyCost *= 2.8;
            }

            // Spike 4: Modelling leak spike in contoso-prod on 2026-05-20
            if (
              subId === "contoso-prod" &&
              res.service.name === "Avere vFXT Compute" &&
              date === "2026-05-20"
            ) {
              actualDailyCost *= 3.1;
            }

            this.rawRecords.push({
              id: `cost-rec-${tempIdCounter++}`,
              subscriptionId: subId,
              subscriptionName: subName,
              resourceGroup: res.resourceGroup,
              resourceLocation: res.rLocation,
              serviceName: res.service.name,
              meterCategory: res.service.meter,
              pretaxCost: parseFloat(actualDailyCost.toFixed(2)),
              currency: "CAD",
              tags: { ...res.tags } as any,
              usageDate: date,
              resourceName: res.resourceName,
              utilizationRate: res.utilizationRate,
              status: res.status as any
            });
          });
        });

        // ----------------- Generate Recommendations ------------------
        resourceTemplates.forEach((res) => {
          // VM Right-sizing Candidate
          if ((res.service.name === "Compute" || res.service.name === "Avere vFXT Compute") && res.utilizationRate && res.utilizationRate < 15) {
            const costMonthly = Math.round(res.baseCost * 30.5);
            const proposedMonthly = Math.round(res.baseCost * 0.4 * 30.5);
            this.rightSizing.push({
              id: `rec-right-${org.id}-${res.resourceName}`,
              resourceId: res.resourceId,
              resourceName: res.resourceName,
              subscriptionName: subName,
              currentSize: "Standard_HB120-16rs_v3", // HPC simulation size suitable for Financial Modeling
              recommendedSize: "Standard_HB120-8rs_v3",
              currentCostMonthly: costMonthly,
              recommendedCostMonthly: proposedMonthly,
              estimatedSavingsMonthly: costMonthly - proposedMonthly,
              avgCpuPercent: Math.round(res.utilizationRate * 10) / 10,
              maxCpuPercent: Math.round(res.utilizationRate * 1.5 * 10) / 10,
              justification: `CPU compute density requirements and high memory bounds hovered under ${Math.round(res.utilizationRate)}% over 30 days. Proposed downsize optimizes cash flow without threatening peak compute performance.`,
              impact: "Reboot Required"
            });
          }

          // Idle Asset Candidate
          if (res.service.name === "Storage" && seededRandom(res.resourceName) > 0.75) {
            this.idleAssets.push({
              id: `rec-idle-${org.id}-${res.resourceName}`,
              resourceId: res.resourceId,
              resourceName: res.resourceName,
              subscriptionName: subName,
              assetType: "Unattached Disk",
              monthlyCost: Math.round(res.baseCost * 1.2 * 30.5),
              lastUsedDate: "2026-04-15",
              justification: `Disk has been fully detached from any host VM for wider than 30 sequential days.`
            });
          }
        });
      });
    });

    // ----------------- Extra General Savings Recommendations (Module 5) ------------------
    this.idleAssets.push({
      id: "rec-idle-apex-orphanip",
      resourceId: "/subscriptions/apex-sandbox/resourceGroups/rg-apex-primary/providers/Microsoft.Networking/publicIPs/orphaned-ip-01",
      resourceName: "apex-orphaned-ip",
      subscriptionName: "Apex R&D Sandbox Sub",
      assetType: "Orphaned public IP",
      monthlyCost: 15.2,
      lastUsedDate: "2026-05-01",
      justification: "IP address is allocated but does not resolve or map to any active load balancer, network interface, or cluster load."
    });

    this.idleAssets.push({
      id: "rec-idle-glob-zombie",
      resourceId: "/subscriptions/logistics-shipping/resourceGroups/rg-logistics-primary/providers/Microsoft.Compute/zombievm-02",
      resourceName: "logistics-legacy-db-zombie",
      subscriptionName: "Core Shipping Infrastructure Sub",
      assetType: "Zombie VM",
      monthlyCost: 620,
      lastUsedDate: "2026-03-20",
      justification: "No TCP packet handshake, disc read operations, or CPU interrupts registered dynamically for over 60 cumulative days."
    });

    this.riRecommendations = [
      {
        id: "ri-comp-01",
        serviceFamily: "Compute",
        currentMonthlyOnDemand: 52000,
        recommendedCommitmentHourly: 42.5,
        estimatedSavings1Year: 18200,
        savingsPercentage: 35,
        breakEvenMonths: 6.8
      },
      {
        id: "ri-db-01",
        serviceFamily: "Databases",
        currentMonthlyOnDemand: 28000,
        recommendedCommitmentHourly: 21.0,
        estimatedSavings1Year: 11200,
        savingsPercentage: 40,
        breakEvenMonths: 5.2
      }
    ];

    // --------------- Rolling Anomaly Detection Calculations (>30% spikes) -----------------
    this.calculateAnomalies();

    this.isInitialized = true;
  }

  /**
   * Scans generated records and builds the interactive Anomalies Collection.
   */
  private calculateAnomalies() {
    this.anomalies = [];
    const subGroups: Record<string, Record<string, AzureCostRecord[]>> = {};

    // Group items by sub and service
    this.rawRecords.forEach((rec) => {
      if (!subGroups[rec.subscriptionId]) subGroups[rec.subscriptionId] = {};
      if (!subGroups[rec.subscriptionId][rec.serviceName]) {
        subGroups[rec.subscriptionId][rec.serviceName] = [];
      }
      subGroups[rec.subscriptionId][rec.serviceName].push(rec);
    });

    // Detect spikes >30% over 7-day rolling average
    Object.keys(subGroups).forEach((subId) => {
      Object.keys(subGroups[subId]).forEach((serviceName) => {
        const sortedRecords = [...subGroups[subId][serviceName]].sort(
          (a, b) => new Date(a.usageDate).getTime() - new Date(b.usageDate).getTime()
        );

        for (let i = 7; i < sortedRecords.length; i++) {
          const current = sortedRecords[i];
          const previous7 = sortedRecords.slice(i - 7, i);
          const avg7 = previous7.reduce((sum, item) => sum + item.pretaxCost, 0) / 7;

          // Spike percentage computation
          if (avg7 > 10) { // filter noise
            const percentIncrease = ((current.pretaxCost - avg7) / avg7) * 100;
            if (percentIncrease > 30) {
              // Highlight selected days as major anomalies to display
              const dateObj = new Date(current.usageDate);
              const isMajorDay = 
                current.usageDate === "2026-05-18" || // Contoso AI
                current.usageDate === "2026-05-03" || // Logistics DB
                current.usageDate === "2026-04-12" || // Apex Compute
                current.usageDate === "2026-05-20";  // Kubernetes VM leak

              if (isMajorDay) {
                this.anomalies.push({
                  id: `anom-${current.id}`,
                  subscriptionId: current.subscriptionId,
                  subscriptionName: current.subscriptionName,
                  resourceGroup: current.resourceGroup,
                  serviceName: current.serviceName,
                  resourceName: current.resourceName,
                  usageDate: current.usageDate,
                  actualCost: current.pretaxCost,
                  expectedCost: parseFloat(avg7.toFixed(2)),
                  increasePercentage: Math.round(percentIncrease),
                  status: "active",
                  assignedTo: current.tags.owner || `ops_team@${SUBSCRIPTION_ORG_MAP[subId]}corp.com`
                });
              }
            }
          }
        }
      });
    });

    // Ensure we sort anomalies newest first
    this.anomalies.sort((a, b) => new Date(b.usageDate).getTime() - new Date(a.usageDate).getTime());
  }

  /**
   * Filters raw consumption records according to UI filter state.
   */
  public querySpend(filter: FinOpsFilterState): AzureCostRecord[] {
    return this.rawRecords.filter((rec) => {
      // 1. Organization filtering
      const recOrg = SUBSCRIPTION_ORG_MAP[rec.subscriptionId];
      if (recOrg !== filter.organizationId) return false;

      // 2. Subscription filtering
      if (filter.subscriptionId !== "all" && rec.subscriptionId !== filter.subscriptionId) return false;

      // 3. Resource Group filtering
      if (filter.resourceGroup !== "all" && rec.resourceGroup !== filter.resourceGroup) return false;

      // 4. Service category filtering
      if (filter.serviceName !== "all" && rec.serviceName !== filter.serviceName) return false;

      // 5. Environment tag filtering
      if (filter.environment !== "all" && rec.tags.environment !== filter.environment) return false;

      // 6. Business unit tag filtering
      if (filter.businessUnit !== "all" && rec.tags.business_unit !== filter.businessUnit) return false;

      // 7. Resource location (region) filtering
      if (filter.region !== "all" && rec.resourceLocation !== filter.region) return false;

      // 8. Date range filtering
      if (rec.usageDate < filter.dateRange.startDate || rec.usageDate > filter.dateRange.endDate) return false;

      return true;
    });
  }

  /**
   * Fetches the database anomalies matching current filters.
   */
  public queryAnomalies(orgId: string): CostAnomaly[] {
    return this.anomalies.filter((anom) => SUBSCRIPTION_ORG_MAP[anom.subscriptionId] === orgId);
  }

  /**
   * Triages / updates active audit status for anomalies.
   */
  public updateAnomaly(id: string, update: Partial<CostAnomaly>): boolean {
    const idx = this.anomalies.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.anomalies[idx] = { ...this.anomalies[idx], ...update };
      return true;
    }
    return false;
  }

  /**
   * Fetches VM RightSizing Recommendations matching filters.
   */
  public queryRightSizing(orgId: string, subId: string | "all"): VMRightSizingRec[] {
    return this.rightSizing.filter((rec) => {
      const recSubId = Object.keys(this.rightSizing).find(() => true); // lookup helper
      const matchedOrg = ORGANIZATIONS.find((o) => o.id === orgId);
      if (!matchedOrg) return false;
      const isSubInOrg = matchedOrg.subscriptions.some((s) => rec.resourceId.includes(s));
      if (!isSubInOrg) return false;
      if (subId !== "all" && !rec.resourceId.includes(subId)) return false;
      return true;
    });
  }

  /**
   * Dispatches optimization triggers: downsizing a machine updates baseline records too!
   */
  public executeRightSize(recId: string): boolean {
    const idx = this.rightSizing.findIndex((r) => r.id === recId);
    if (idx !== -1) {
      const rec = this.rightSizing[idx];
      // Reduce future pretaxCost of matches in raw records
      this.rawRecords.forEach((item) => {
        if (item.resourceName === rec.resourceName && item.usageDate >= "2026-05-15") {
          item.pretaxCost = parseFloat((item.pretaxCost * (rec.recommendedCostMonthly / rec.currentCostMonthly)).toFixed(2));
          item.utilizationRate = 48.0; // Simulated healthy utilization under new size
          item.status = "active";
        }
      });
      // Delete recommendation representing completed task
      this.rightSizing.splice(idx, 1);
      // Recompute anomalies base due to structural drop
      this.calculateAnomalies();
      return true;
    }
    return false;
  }

  /**
   * Fetches Idle asset recommendations
   */
  public queryIdleAssets(orgId: string, subId: string | "all"): IdleAssetRec[] {
    return this.idleAssets.filter((rec) => {
      const matchedOrg = ORGANIZATIONS.find((o) => o.id === orgId);
      if (!matchedOrg) return false;
      const isSubInOrg = matchedOrg.subscriptions.some((s) => rec.resourceId.includes(s));
      if (!isSubInOrg) return false;
      if (subId !== "all" && !rec.resourceId.includes(subId)) return false;
      return true;
    });
  }

  /**
   * Reclaims an idle asset (deletes resource and saves cost).
   */
  public executeReclaimIdle(recId: string): boolean {
    const idx = this.idleAssets.findIndex((i) => i.id === recId);
    if (idx !== -1) {
      const rec = this.idleAssets[idx];
      // Set pretaxCost of this resource to 0 for recent dates (simulating elimination)
      this.rawRecords.forEach((item) => {
        if (item.resourceName === rec.resourceName && item.usageDate >= "2026-05-18") {
          item.pretaxCost = 0;
          item.status = "zombie"; // Decommissioned marker
        }
      });
      // Remove asset from recommendation pile
      this.idleAssets.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Fetches reserved instances recommendations
   */
  public queryRIRecommendations(): RISavingsPlanRec[] {
    return this.riRecommendations;
  }

  /**
   * Compliance Auditing Logic (Module 3)
   */
  public auditTags(orgId: string, subId: string | "all"): TagComplianceResult {
    const mandatoryTags = ["environment", "owner", "cost_center"];
    const nonCompliantList: NonCompliantResource[] = [];
    let checkedCount = 0;
    let compliantCount = 0;

    // We look at distinct active resources in this sub range to avoid double-scoring daily entries
    const seenResources = new Set<string>();
    const resourcesMap: Record<string, AzureCostRecord> = {};

    this.rawRecords.forEach((rec) => {
      const recOrg = SUBSCRIPTION_ORG_MAP[rec.subscriptionId];
      if (recOrg !== orgId) return;
      if (subId !== "all" && rec.subscriptionId !== subId) return;

      if (!seenResources.has(rec.resourceName)) {
        seenResources.add(rec.resourceName);
        resourcesMap[rec.resourceName] = rec;
      }
    });

    Object.values(resourcesMap).forEach((res) => {
      checkedCount++;
      const missing: string[] = [];
      const invalid: string[] = [];

      mandatoryTags.forEach((tag) => {
        const val = res.tags[tag];
        if (!val) {
          missing.push(tag);
        } else if (val.trim() === "") {
          invalid.push(tag);
        }
      });

      if (missing.length === 0 && invalid.length === 0) {
        compliantCount++;
      } else {
        // Daily average cost as proxy of financial leak (leakage = unallocated cost overhead)
        const dailyLeak = res.pretaxCost;
        nonCompliantList.push({
          id: `audit-${res.id}`,
          resourceName: res.resourceName,
          serviceName: res.serviceName,
          subscriptionName: res.subscriptionName,
          resourceGroup: res.resourceGroup,
          missingTags: missing,
          invalidTags: invalid,
          estimatedDailyLeak: parseFloat(dailyLeak.toFixed(2))
        });
      }
    });

    const score = checkedCount > 0 ? Math.round((compliantCount / checkedCount) * 100) : 100;

    return {
      score,
      totalResources: checkedCount,
      compliantCount,
      nonCompliantCount: checkedCount - compliantCount,
      auditGrid: nonCompliantList
    };
  }

  /**
   * Direct Tag Mitigation - lets the user rectify a compliance tag rule online!
   */
  public resolveComplianceTags(resourceName: string, resolvedTags: Record<string, string>): boolean {
    let success = false;
    this.rawRecords.forEach((item) => {
      if (item.resourceName === resourceName) {
        item.tags = { ...item.tags, ...resolvedTags } as any;
        success = true;
      }
    });
    return success;
  }

  /**
   * Generates forecasting points with upper confidence bounds (Module 4)
   */
  public generateForecast(filter: FinOpsFilterState): ForecastDataPoint[] {
    const historicalSpend = this.querySpend(filter);
    
    // Group historical spend by usage date
    const dailySpendMap: Record<string, number> = {};
    historicalSpend.forEach((rec) => {
      dailySpendMap[rec.usageDate] = (dailySpendMap[rec.usageDate] || 0) + rec.pretaxCost;
    });

    const dates = Object.keys(dailySpendMap).sort();
    const dataPoints: ForecastDataPoint[] = [];

    // Push actuals
    dates.forEach((dateStr) => {
      dataPoints.push({
        date: dateStr,
        actualCost: parseFloat(dailySpendMap[dateStr].toFixed(2)),
        forecastCost: parseFloat(dailySpendMap[dateStr].toFixed(2)),
        upperConfidence: parseFloat((dailySpendMap[dateStr] * 1.05).toFixed(2)),
        lowerConfidence: parseFloat((dailySpendMap[dateStr] * 0.95).toFixed(2)),
        isForecast: false
      });
    });

    if (dataPoints.length === 0) return [];

    // Generate 90-day projected forecast continuing from the endDate
    const lastDateStr = dates[dates.length - 1];
    const lastDate = new Date(lastDateStr);
    
    // Simple moving average + seasonality trend for forecast
    // Calculate average baseline spend
    const last30Days = dates.slice(-30);
    const avg30Spend = last30Days.reduce((sum, d) => sum + dailySpendMap[d], 0) / (last30Days.length || 1);

    for (let i = 1; i <= 90; i++) {
      const fDate = new Date(lastDate.getTime());
      fDate.setDate(lastDate.getDate() + i);
      const fDateStr = fDate.toISOString().split("T")[0];

      // Add soft weekend drop pattern
      const day = fDate.getDay();
      const dayMultiplier = day === 0 || day === 6 ? 0.78 : 1.02;
      
      // Steady organic scale factor + noise
      const scaleFactor = 1 + (i * 0.0012); // subtle 0.12% compound increase per day (enterprise scaling)
      const forecastBaseline = avg30Spend * scaleFactor * dayMultiplier;
      const noise = seededRandom(fDateStr) * 0.04 - 0.02; // ±2% random noise
      const forecastedVal = parseFloat((forecastBaseline * (1 + noise)).toFixed(2));

      // Confidence intervals widen as the forecast goes further into the future (Azure Forecast model)
      const errorMargin = 0.05 + (i * 0.002); // expands by 0.2% daily
      
      dataPoints.push({
        date: fDateStr,
        actualCost: null,
        forecastCost: forecastedVal,
        upperConfidence: parseFloat((forecastedVal * (1 + errorMargin)).toFixed(2)),
        lowerConfidence: parseFloat((forecastedVal * (1 - errorMargin)).toFixed(2)),
        isForecast: true
      });
    }

    return dataPoints;
  }
}

// Single database singleton manager
export const dbInstance = new FinOpsDatabase();
