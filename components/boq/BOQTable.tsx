"use client";

import { FileSpreadsheet, AlertCircle, Cpu, Calculator, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { BOQReport } from "@/lib/types";

interface Props {
  boq: BOQReport | undefined;
  onGenerate: () => void;
  isGenerating: boolean;
  hasAnalysis: boolean;
}

const SECTION_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  A: { bg: "rgba(239,68,68,0.08)", text: "#f87171", border: "rgba(239,68,68,0.25)", glow: "#ef4444" },
  B: { bg: "rgba(59,130,246,0.08)", text: "#60a5fa", border: "rgba(59,130,246,0.25)", glow: "#3b82f6" },
  C: { bg: "rgba(16,185,129,0.08)", text: "#34d399", border: "rgba(16,185,129,0.25)", glow: "#10b981" },
};

const MODEL_LABELS: Record<string, string> = {
  gemini: "Gemini 2.0 Flash",
  openai: "GPT-4o",
  groq: "Groq LLaMA-3.3",
  claude: "Claude 3.5 Sonnet",
  ai_fallback: "Fallback",
  "": "",
};
const MODEL_COLORS: Record<string, string> = {
  gemini: "#3b82f6", openai: "#10b981", groq: "#f59e0b", claude: "#8b5cf6", "": "#6b7280",
};
const MODEL_ICONS: Record<string, string> = {
  gemini: "✨", openai: "🤖", groq: "⚡", claude: "🔮", "": "",
};

// ── Collapsible section for mobile ────────────────────────────────────────────
function BOQSection({ section, colors }: {
  section: BOQReport["sections"][0];
  colors: typeof SECTION_COLORS["A"];
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="glass-card" style={{ overflow: "hidden" }}>
      {/* Section Header — tappable to collapse on mobile */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%", padding: "14px 18px",
          background: colors.bg,
          borderBottom: expanded ? `1px solid ${colors.border}` : "none",
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer", border: "none", textAlign: "left",
          transition: "all 0.2s",
        }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: colors.border,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: colors.text,
          flexShrink: 0,
        }}>
          {section.section_id}
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>
            Section {section.section_id}: {section.section_name}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
            {section.items.length} items
          </div>
        </div>
        <div style={{ color: colors.text, flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* ── Desktop: Table View ── */}
      {expanded && (
        <div>
          <div className="boq-table-wrapper" style={{ overflowX: "auto" }}>
            <table className="boq-table history-table-wrapper" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ width: 44 }}>S.No</th>
                  <th style={{ width: 160 }}>Item</th>
                  <th>Description</th>
                  <th style={{ width: 64 }}>Unit</th>
                  <th style={{ width: 72, textAlign: "right" }}>Qty</th>
                  <th style={{ width: 200 }}>Calculation Basis</th>
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
                    <td style={{ textAlign: "right", fontSize: 16, fontWeight: 800, color: colors.text }}>
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

          {/* ── Mobile: Card View ── */}
          <div className="history-cards-wrapper" style={{ display: "none", padding: "8px 12px 12px", flexDirection: "column", gap: 8 }}>
            {section.items.map((item) => (
              <div key={item.sno} style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${colors.border}`,
                borderRadius: 10, padding: "12px 14px",
              }}>
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
                        background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4,
                      }}>
                        {item.sno}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                        {item.item}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      {item.description}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: colors.text, lineHeight: 1 }}>
                      {item.quantity % 1 === 0 ? item.quantity.toFixed(0) : item.quantity.toFixed(1)}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{item.unit}</div>
                  </div>
                </div>
                {/* Calc basis */}
                {item.calculation_basis && (
                  <div style={{
                    fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5,
                    padding: "5px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 6,
                    borderLeft: `2px solid ${colors.glow}40`,
                  }}>
                    {item.calculation_basis}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BOQTable({ boq, onGenerate, isGenerating, hasAnalysis }: Props) {

  // Loading state
  if (isGenerating) {
    return (
      <div className="glass-card" style={{ padding: "56px 24px", textAlign: "center" }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          border: "3px solid transparent", borderTopColor: "#ef4444",
          animation: "spin 1s linear infinite", margin: "0 auto 18px"
        }} />
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Generating BOQ...</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Calculating fire equipment quantities per standards
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Empty state
  if (!boq) {
    return (
      <div className="glass-card" style={{
        padding: "56px 24px", textAlign: "center",
        background: "rgba(239,68,68,0.02)", border: "1px dashed rgba(239,68,68,0.2)",
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: 20,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 18px",
        }}>
          <FileSpreadsheet size={32} color="#ef4444" />
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>No BOQ Generated Yet</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, maxWidth: 360, margin: "0 auto 24px", lineHeight: 1.6 }}>
          {hasAnalysis
            ? "Click Generate BOQ to create the Fire Bill of Quantities based on your analysis"
            : "Run AI Analysis first to enable BOQ generation"
          }
        </div>
        <button
          className="btn-primary"
          onClick={onGenerate}
          disabled={!hasAnalysis}
          style={{ padding: "12px 32px", fontSize: 15 }}
        >
          <FileSpreadsheet size={18} />
          {hasAnalysis ? "Generate BOQ" : "Run Analysis First"}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── BOQ Header Banner ── */}
      <div className="glass-card" style={{
        padding: "16px 20px",
        background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          {/* Left: status + badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <FileSpreadsheet size={18} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>✅ BOQ Generated</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {boq.sections.length} sections • {boq.total_items} items total
              </div>
            </div>

            {/* Standard badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 20,
              background: standard === "NFPA" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${standard === "NFPA" ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.25)"}`,
            }}>
              <BookOpen size={11} color={standard === "NFPA" ? "#f59e0b" : "#ef4444"} />
              <span style={{ fontSize: 11, fontWeight: 700, color: standard === "NFPA" ? "#f59e0b" : "#ef4444" }}>
                {standard === "NFPA" ? "NFPA 72/13" : "NBC 2016 / IS"}
              </span>
            </div>

            {/* BOQ type badge */}
            {isAI && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 20,
                background: `${modelColor}12`, border: `1px solid ${modelColor}35`,
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
                background: "rgba(107,114,128,0.08)", border: "1px solid rgba(107,114,128,0.25)",
              }}>
                <Calculator size={11} color="#9ca3af" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>Manual Calc</span>
              </div>
            )}
            {isFallback && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 20,
                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
              }}>
                <AlertCircle size={11} color="#f59e0b" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>AI Fallback</span>
              </div>
            )}
          </div>

          {/* Regenerate button */}
          <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: 12, flexShrink: 0 }} onClick={onGenerate}>
            Regenerate BOQ
          </button>
        </div>
      </div>

      {/* ── BOQ Sections ── */}
      {boq.sections.map(section => {
        const colors = SECTION_COLORS[section.section_id] || SECTION_COLORS.A;
        return <BOQSection key={section.section_id} section={section} colors={colors} />;
      })}

      {/* ── Notes ── */}
      {boq.notes && (
        <div className="glass-card" style={{
          padding: "14px 18px",
          background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.2)",
        }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
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
