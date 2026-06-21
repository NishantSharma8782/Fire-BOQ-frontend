"use client";

import { FileSpreadsheet, AlertCircle, Cpu, Calculator, BookOpen } from "lucide-react";
import type { BOQReport } from "@/lib/types";

interface Props {
  boq: BOQReport | undefined;
  onGenerate: () => void;
  isGenerating: boolean;
  hasAnalysis: boolean;
}

const SECTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "rgba(239,68,68,0.1)", text: "#f87171", border: "rgba(239,68,68,0.3)" },
  B: { bg: "rgba(59,130,246,0.1)", text: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  C: { bg: "rgba(16,185,129,0.1)", text: "#34d399", border: "rgba(16,185,129,0.3)" },
};

const MODEL_LABELS: Record<string, string> = {
  gemini: "Gemini 2.0 Flash",
  openai: "GPT-4o",
  groq:   "Groq LLaMA-3.3",
  claude: "Claude 3.5 Sonnet",
  "ai_fallback": "Fallback",
  "": "",
};

const MODEL_COLORS: Record<string, string> = {
  gemini: "#3b82f6",
  openai: "#10b981",
  groq:   "#f59e0b",
  claude: "#8b5cf6",
  "": "#6b7280",
};

const MODEL_ICONS: Record<string, string> = {
  gemini: "✨",
  openai: "🤖",
  groq:   "⚡",
  claude: "🔮",
  "": "",
};

export default function BOQTable({ boq, onGenerate, isGenerating, hasAnalysis }: Props) {
  if (isGenerating) {
    return (
      <div className="glass-card" style={{ padding: 60, textAlign: "center" }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          border: "3px solid transparent", borderTopColor: "#ef4444",
          animation: "spin 1s linear infinite", margin: "0 auto 16px"
        }} />
        <div style={{ fontSize: 16, fontWeight: 700 }}>Generating BOQ...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!boq) {
    return (
      <div className="glass-card" style={{ padding: 60, textAlign: "center" }}>
        <div style={{
          width: 60, height: 60, borderRadius: 18,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px"
        }}>
          <FileSpreadsheet size={28} color="#ef4444" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No BOQ Generated</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
          {hasAnalysis
            ? "Click Generate BOQ to create the Fire Bill of Quantities"
            : "Run AI Analysis first to enable BOQ generation"
          }
        </div>
        <button
          className="btn-primary"
          onClick={onGenerate}
          disabled={!hasAnalysis}
          style={{ padding: "12px 28px" }}
        >
          <FileSpreadsheet size={17} />
          {hasAnalysis ? "Generate BOQ" : "Run Analysis First"}
        </button>
      </div>
    );
  }

  const isAI = boq.boq_type === "ai";
  const isFallback = boq.boq_type === "ai_fallback";
  const standard = boq.standard || "NBC";
  const aiModel = boq.ai_model || "";
  const modelLabel = MODEL_LABELS[aiModel] || aiModel;
  const modelColor = MODEL_COLORS[aiModel] || "#6b7280";
  const modelIcon = MODEL_ICONS[aiModel] || "🤖";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* BOQ Header */}
      <div className="glass-card" style={{
        padding: "16px 24px",
        background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399", marginBottom: 4 }}>
                ✅ BOQ Generated
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {boq.sections.length} sections • {boq.total_items} items total
              </div>
            </div>

            {/* Standard badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 20,
              background: standard === "NFPA" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${standard === "NFPA" ? "rgba(245,158,11,0.35)" : "rgba(239,68,68,0.3)"}`,
            }}>
              <BookOpen size={11} color={standard === "NFPA" ? "#f59e0b" : "#ef4444"} />
              <span style={{ fontSize: 11, fontWeight: 700, color: standard === "NFPA" ? "#f59e0b" : "#ef4444" }}>
                {standard === "NFPA" ? "NFPA 72/13/14" : "NBC 2016 / IS"}
              </span>
            </div>

            {/* BOQ type badge */}
            {isAI && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 20,
                background: `${modelColor}15`,
                border: `1px solid ${modelColor}40`,
              }}>
                <span style={{ fontSize: 13 }}>{modelIcon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: modelColor }}>
                  AI • {modelLabel}
                </span>
              </div>
            )}
            {!isAI && !isFallback && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 20,
                background: "rgba(107,114,128,0.1)",
                border: "1px solid rgba(107,114,128,0.3)",
              }}>
                <Calculator size={11} color="#9ca3af" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>Manual Calc</span>
              </div>
            )}
            {isFallback && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 20,
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.3)",
              }}>
                <AlertCircle size={11} color="#f59e0b" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>AI Fallback</span>
              </div>
            )}
          </div>

          <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: 12 }} onClick={onGenerate}>
            Regenerate BOQ
          </button>
        </div>
      </div>

      {/* Sections */}
      {boq.sections.map(section => {
        const colors = SECTION_COLORS[section.section_id] || SECTION_COLORS.A;
        return (
          <div key={section.section_id} className="glass-card" style={{ overflow: "hidden" }}>
            {/* Section Header */}
            <div style={{
              padding: "12px 20px",
              background: colors.bg, borderBottom: `1px solid ${colors.border}`,
              display: "flex", alignItems: "center", gap: 10
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: colors.border, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: colors.text
              }}>
                {section.section_id}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>
                  Section {section.section_id}: {section.section_name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {section.items.length} items
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ overflowX: "auto" }}>
              <table className="boq-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>S.No</th>
                    <th style={{ width: 150 }}>Item</th>
                    <th>Description</th>
                    <th style={{ width: 60 }}>Unit</th>
                    <th style={{ width: 80, textAlign: "right" }}>Qty</th>
                    <th style={{ width: 220 }}>Calculation Basis</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((item) => (
                    <tr key={item.sno}>
                      <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
                        {item.sno}
                      </td>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                          {item.item}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                        {item.description}
                      </td>
                      <td style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
                        {item.unit}
                      </td>
                      <td style={{ textAlign: "right", fontSize: 15, fontWeight: 800, color: colors.text }}>
                        {item.quantity % 1 === 0 ? item.quantity.toFixed(0) : item.quantity.toFixed(1)}
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                        {item.calculation_basis}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Notes */}
      {boq.notes && (
        <div className="glass-card" style={{
          padding: 16,
          background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)"
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            <AlertCircle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              <strong style={{ color: "#f59e0b" }}>Important Note: </strong>
              {boq.notes}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
