import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Sparkles, Loader2, RefreshCw, HelpCircle, AlertTriangle, Lightbulb } from "lucide-react";
import Markdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

interface FinOpsChatProps {
  organizationName: string;
  budget: number;
  projectedSpend: number;
  wasteCost: number;
  complianceScore: number;
}

export const FinOpsChat: React.FC<FinOpsChatProps> = ({
  organizationName,
  budget,
  projectedSpend,
  wasteCost,
  complianceScore,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: `Hello! I am your AI FinOps Advisor. I am trained on your infrastructure telemetry data and continuous regulatory compliance controls.

How can I help you optimize your cloud footprint today? Here are some insights on **${organizationName}** to get started:
* Target Budget: **CAD ${budget.toLocaleString()}**
* Current run-rate: **CAD ${projectedSpend.toLocaleString("en", { maximumFractionDigits: 0 })}**
* Annualized Waste Exposure: **CAD ${(wasteCost * 12).toLocaleString("en", { maximumFractionDigits: 0 })}**
* Governance Score: **${complianceScore}%**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat pane when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const quickPrompts = [
    {
      label: "Optimize Contoso Budget Exposure",
      prompt: `Analyze our active budget limits for ${organizationName}. We currently have a budget of CAD ${budget.toLocaleString()} but our projected spend is CAD ${projectedSpend.toLocaleString("en", { maximumFractionDigits: 0 })}. How can we optimize this?`,
      icon: <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
    },
    {
      label: "Rightsizing Avere Compute Nodes",
      prompt: "Explain the virtual machine rightsizing candidate standard for Avere vFXT Compute nodes. How does Hb-series downsizing save costs?",
      icon: <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
    },
    {
      label: "Governance Tag Audits Rules",
      prompt: `We currently have a governance/compliance score of ${complianceScore}%. What tags does the continuous auditor check for and why are they mandatory?`,
      icon: <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
    },
    {
      label: "Pruning Annualized Waste exposure",
      prompt: `What comprises our Idle Resource Waste containing CAD ${wasteCost.toLocaleString()} in current waste? How can we eliminate this financial leak immediately?`,
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
    }
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setErrorText(null);
    const userMessage: Message = {
      id: Math.random().toString(),
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Build conversation history format for server API call
      const history = messages
        .filter((m) => m.id !== "welcome") // Skip initial welcome message
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history,
          activeMetrics: {
            organizationName,
            budget,
            projectedSpend,
            wasteCost,
            complianceScore,
          }
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned code ${res.status}`);
      }

      const data = await res.json();
      
      const assistantMessage: Message = {
        id: Math.random().toString(),
        role: "model",
        text: data.reply || "Sorry, I spent too long thinking and couldn't process this request.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setErrorText("Telemetry Channel Offline. Make sure your API Key is deployed and retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "model",
        text: `Chat session refreshed. Telemetry tracking is active for **${organizationName}**:\n* Target Budget: **CAD ${budget.toLocaleString()}**\n* Current run-rate: **CAD ${projectedSpend.toLocaleString("en", { maximumFractionDigits: 0 })}**\n* Annualized Waste exposure: **CAD ${(wasteCost * 12).toLocaleString("en", { maximumFractionDigits: 0 })}**`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setErrorText(null);
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-azure to-sky-400 hover:from-sky-500 hover:to-azure text-white p-4 rounded-full shadow-lg shadow-azure/30 transition-all hover:scale-105 active:scale-95 group focus:outline-none cursor-pointer flex items-center justify-center border border-white/10"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out font-display font-semibold text-xs whitespace-nowrap pl-0 group-hover:pl-2">
            Ask AI Advisor
          </span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </button>
      </div>

      {/* Slide-out Glassmorphic Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-6 w-full max-w-lg h-[650px] bg-[#0c1222] border border-[#2b3a60] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-md bg-opacity-95 text-slate-100"
          >
            {/* Header */}
            <div className="bg-[#121c33] border-b border-[#2b3a60] px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-azure/10 border border-azure/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs tracking-tight text-white flex items-center gap-1.5 leading-none">
                    AzureFinOps Advisor
                    <span className="inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-mono uppercase px-1.5 py-0.5 rounded leading-none font-bold">
                      LIVE
                    </span>
                  </h4>
                  <p className="text-[9.5px] text-zinc-400 font-mono mt-1">
                    Secure AI context: {organizationName} • CAD
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  title="Clear Chat Logs"
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-dark-hover/40 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-dark-hover/40 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Log Pane */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="bg-azure/5 border border-azure/20 p-2.5 rounded-lg text-[10px] text-zinc-400 font-mono flex items-start gap-2 select-none leading-normal">
                <p>
                  🛡️ <strong>Governance lineage:</strong> Live context is injected based on your active screen views and active organization state blocks.
                </p>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1 mb-1 font-mono text-[9px] text-zinc-500">
                    <span>{msg.role === "user" ? "You" : "Advisor"}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs inline-block leading-relaxed outline-none ${
                      msg.role === "user"
                        ? "bg-azure text-white rounded-tr-none shadow-md shadow-azure/10"
                        : "bg-[#18223c] border border-[#2b3a60]/60 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    <div className="markdown-body text-xs leading-normal select-text">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1 mb-1 font-mono text-[9px] text-zinc-400">
                    <span>Advisor is computing telemetry...</span>
                  </div>
                  <div className="bg-[#18223c] border border-[#2b3a60]/60 rounded-xl rounded-tl-none px-4 py-3 text-xs text-zinc-400 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                    <span className="font-mono text-[10px]">Processing response with Gemini-3.5-flash...</span>
                  </div>
                </div>
              )}

              {errorText && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-mono">
                  {errorText}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Pill Section */}
            {messages.length <= 2 && (
              <div className="px-5 py-2.5 border-t border-[#2b3a60]/50 bg-[#0d1424]/40 shrink-0 space-y-1.5">
                <span className="block text-[9px] uppercase font-mono tracking-wider text-zinc-500 font-bold">
                  Suggested Context Prompts
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p.prompt)}
                      className="text-left text-[11px] bg-[#151b2e] border border-[#222c46] hover:bg-[#1d263f] text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg font-sans transition-all flex items-center gap-2 cursor-pointer text-ellipsis truncate leading-tight grow"
                    >
                      {p.icon}
                      <span className="truncate">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-4 bg-[#0a0e19] border-t border-[#2b3a60] shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputMessage);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask advisor about cloud waste, HB120 nodes, regulatory tags..."
                  className="flex-1 bg-[#131a2b] border border-[#222c46] rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-azure focus:border-azure transition-all font-sans"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isLoading || !inputMessage.trim()
                      ? "bg-zinc-800 border-zinc-700 text-zinc-500"
                      : "bg-azure hover:bg-sky-500 text-white shadow-md shadow-azure/20"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
