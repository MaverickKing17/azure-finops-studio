import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize server-side Gemini client as instructed in the gemini-api skill
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API endpoint for AI financial assistant chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const systemInstruction = `You are the AzureFinOps Intelligence Advisor, a virtual cloud architect and financial counsel embedded within AzureFinOps Dev Studio.
Your purpose is to assist engineers, operators, and finance leads with cloud financial optimization (FinOps), architecture remedies, and tag governance auditing.

Key system attributes to reference if helpful:
1. We have three core optimization modules:
   - "Idle Resource Waste / Annualized Risk" (unattached storage disks, orphaned public IPs, zombie virtual machines).
   - "Avere vFXT Compute" rightsizing candidate (migrating HB-series HPC virtual machines, like resizing HB120-16rs to HB120-8rs when average utilization is low, reducing costs by 60%).
   - "Tag Regulatory Audit Score" indicating regulatory compliance based on three mandatory tags:
     * 'environment': maps environment safety boundaries (dev, staging, prod, sandbox).
     * 'owner': tags custodian ownership.
     * 'cost_center': logs accounting custody / financial accountability.
2. In AzureFinOps Dev Studio, organizations have dedicated Limit Targets:
   - "Contoso Enterprise Ltd" has a budget of CAD 150,000.
3. The currency of this studio is CAD (Canadian Dollars). Always use CAD values or percentages if presenting calculations.

Guidelines:
- Give professional, expert-level counsel. Do not display mock terminal headers, and avoid hyperbolic self-praise.
- Keep your formatting pristine with clean markdown, short paragraphs, or tabular listings.
- Offer actionable advice: suggest reservation commits, scheduling virtual machines, rightsizing, cleanup of zombie blocks, or automating taxonomy checks.`;

      // Structure conversation history for @google/genai
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const turn of history) {
          contents.push({
            role: turn.role === "user" ? "user" : "model",
            parts: [{ text: turn.text }]
          });
        }
      }

      // Add the final question from the user
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      // Simple, direct output text field extraction as instructed in SKILL.md
      res.json({ reply: response.text || "I was unable to formulate a response at this time." });
    } catch (error: any) {
      console.error("Gemini API server route error:", error);
      res.status(500).json({ error: error.message || "An error occurred with the Gemini API." });
    }
  });

  // Mount Vite development middle layer or serve static build files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server startup crash:", err);
});
