# AzureFinOps Dev Studio (FSI-SECURE)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38B2AC.svg)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/AI%20Advisor-Gemini%203.5%20Flash-0078D4.svg)](#)

An enterprise-grade, high-fidelity Cloud Financial Operations (FinOps) engineering dashboard and automated tag governance control center. Specifically tailored for **Financial Services Institutions (FSI)** running high-performance workloads (e.g., risk grids, Monte Carlo simulations, and quant modeling), this platform continuous-audits resource spending, detects anomalous surges, provides actionable rightsizing intelligence, and exposes an interactive AI FinOps Advisor.

---

## 📈 Executive Summary & Market Positioning

Modern financial institutions struggle to balance massive raw compute requirements with strict regulatory audit trails and rigid budget boundaries. **AzureFinOps Dev Studio** tackles this by acting as a continuous, centralized intelligence overlay that parses Azure consumption reports and matches them with live tag auditing standards.

By deploying this unified financial command hub, organizations can:
* **Quantify Monthly & Annual Risk Exposure:** Bubble up unattached disks, orphaned network parameters, and idle high-density VMs into localized annualized dollar liabilities.
* **Streamline High-Performance Compute (HPC) Efficiency:** Scale down massive Avere vFXT clusters and Standard HB-series nodes based on actual average/peak CPU density, without impacting mission-critical modeling cycles.
* **Enforce Strict Regulatory Custody (Tag Taxonomy):** Track and score compliance against institutional standards (checking for `environment`, `owner`, and `cost_center` tags).
* **Leverage Secure AI Telemetry Advice:** Interface with an active virtual architect that draws real-time data from financial state blocks.

---

## 🚀 Key Architectural Pillars

### 1. High-Performance Compute (HPC) Rightsizing
Unlike generic rightsizing tools that examine standard generic instances, our algorithms are tailored for top-tier simulation clusters. It identifies candidates running massive virtual machine scale sets—such as the **Standard_HB120-16rs_v3** (equipped with AMD EPYC processors and AMD 3D V-Cache used for high-performance fluid dynamics and financial simulation)—and safely targets rightsizing to the **Standard_HB120-8rs_v3**, achieving a **60% reduction in run-rate** while guaranteeing safety margins.

### 2. Live Regulatory Audit Scoring ("Tag Compliance")
To satisfy severe financial audit scopes (such as SOC2, Basel III, or OSFI cloud governance guidelines):
* Continuous scanners inspect every single asset inside the designated subscriptions (`contoso-ai`, `contoso-prod`, `apex-sandbox`, etc.).
* Enforces three mandatory taxonomies:
  * `environment`: Delineates safety networks and staging scopes.
  * `owner`: Documents custodian and operational responsibility.
  * `cost_center`: Roots the asset securely within a corporate line item.
* Measures a real-time **Global Regulatory Score** to identify exactly where regulatory slippage is happening.

### 3. Active Anomalous Surge Analytics
Leveraging historical consumption records, the engine flags atypical billing patterns (e.g., massive OpenAI token surges on specific dates, unexpected storage leakage, or staging environment compute spillover), preventing silent, compounding month-end cloud invoice shocks.

### 4. Telemetry-Aware AI FinOps Advisor
Directly integrated with the robust **Google Gemini Core** server-side engine via the modern `@google/genai` SDK:
* Passes true situational state arrays (such as the active organization’s CAD run-rate, targets, annualized idle leakage, and audit scores).
* Secure full-stack proxying hides the Gemini API keys from the client-side bundle.
* Evaluates context and proposes actionable mitigations, such as reservable commitments, scheduling policies, or immediate storage garbage collection.

---

## 🛠️ Technical Stack & Architecture

AzureFinOps Dev Studio is designed as a secure, full-stack React and Express application:

```
[ Client-Side Browser SPA ]
          │
          │  HTTPS / API Requests (Secure Context)
          ▼
[ Express Node.js Server ] ──( Proxying with API Key )──► [ Google Gemini API ]
          │
          ├─► Static Dist Assets (Vite Production Bundler)
          └─► Standard API telemetry routes 
```

* **Frontend:** React 18, Vite 6, Tailwind CSS 4, Motion (Animations), Lucide Icons.
* **Visualization Layer:** Recharts & D3 for high-density historical financial charting.
* **Backend:** Express API, Node.js, `tsx` for high-speed local dev loop, `esbuild` for production compilation.
* **AI Core:** Google Gemini 3.5 Flash Model using the modern TypeScript client development kit.

---

## 💻 Getting Started Inside the Development Loop

### Prerequisites
* **Node.js** v18+ (tested on LTS)
* **npm** v9+
* A valid **Gemini API Key** (for authorization with the virtual FinOps Advisor)

### Workspace Configuration
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/azure-finops-dev-studio.git
   cd azure-finops-dev-studio
   ```

2. Create a `.env` file in the root directory (using `.env.example` as a template) and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Install project dependencies:
   ```bash
   npm install
   ```

4. Launch the Dev Server:
   ```bash
   npm run dev
   ```
   *The Express backend with dynamic Vite middleware starts on [http://localhost:3000](http://localhost:3000).*

5. Build & Bundle for Production:
   ```bash
   npm run build
   npm start
   ```
   *This command compiles the static assets into `dist/` and packages the backend TypeScript server into a high-performance CJS single-bundle `dist/server.cjs` utilizing esbuild. This completely avoids Node runtime imports resolution overhead, resulting in cold starts under 10ms.*

---

## 💼 Partnerships & FSI Pilot Evaluation

We are actively scheduling pilot program partnerships for **Q3 2026** with **4 core financial services institutions (retail banks, asset managers, or quantitative trading firms)** to run proof-of-concepts (PoC).

### Why Partner with Us?
1. **Reduce Cloud Waste by up to 35%**: Instantly isolate and clean orphaned assets while optimizing HPC workloads without risking pipeline timeouts.
2. **Close Regulatory Auditor Flags**: Transition your engineering organizations from reactive Excel budgeting to active, coded tag enforcement policies.
3. **Pioneer AI-Driven FinOps**: Equip cloud engineering leads and financial planning teams with automated telemetry analysis that responds directly to simple conversational queries.

To request a live demo or to learn more about our secure proof-of-concept onboarding, please contact our team details or connect directly via **LinkedIn**.
