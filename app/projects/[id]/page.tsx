"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Zap,
  FileSpreadsheet,
  Download,
  Map,
  MessageSquare,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Building2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Cpu,
  Calculator,
  X,
  Sparkles,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import DrawingUpload from "@/components/drawings/DrawingUpload";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";
import KonvaCanvas from "@/components/layout/KonvaCanvas";
import BOQTable from "@/components/boq/BOQTable";
import AIAssistant from "@/components/chat/AIAssistant";
import ExportButtons from "@/components/export/ExportButtons";
import { projectsApi, drawingsApi, analysisApi, boqApi } from "@/lib/api";
import type { ManualBuildingData } from "@/lib/types";
import {
  STATUS_LABELS, STATUS_COLORS, formatDateTime,
  BUILDING_TYPE_LABELS, HAZARD_LABELS, HAZARD_COLORS
} from "@/lib/utils";

type Tab = "overview" | "drawings" | "analysis" | "layout" | "boq" | "chat";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "drawings", label: "Drawings", icon: Upload },
  { id: "analysis", label: "AI Analysis", icon: Zap },
  { id: "layout", label: "Layout", icon: Map },
  { id: "boq", label: "BOQ", icon: FileSpreadsheet },
  { id: "chat", label: "AI Assistant", icon: MessageSquare },
];

// BOQ Generate Modal State
interface BOQModalState {
  open: boolean;
  boqType: "manual" | "ai";
}

// ── Overlay backdrop ──────────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
        animation: "fadeIn 0.2s ease",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

const AI_MODEL_META: Record<string, { icon: string; label: string; color: string }> = {
  gemini: { icon: "✨", label: "Gemini 2.0 Flash", color: "#3b82f6" },
  openai: { icon: "🤖", label: "GPT-4o", color: "#10b981" },
  groq:   { icon: "⚡", label: "Groq LLaMA-3.3", color: "#f59e0b" },
  claude: { icon: "🔮", label: "Claude 3.5 Sonnet", color: "#8b5cf6" },
};

function BOQGenerateModal({
  state,
  setState,
  onConfirm,
  isGenerating,
  projectAiModel,
  projectFireStandard,
}: {
  state: BOQModalState;
  setState: React.Dispatch<React.SetStateAction<BOQModalState>>;
  onConfirm: () => void;
  isGenerating: boolean;
  projectAiModel: string;
  projectFireStandard: string;
}) {
  const close = () => setState(s => ({ ...s, open: false }));
  const meta = AI_MODEL_META[projectAiModel] || AI_MODEL_META.gemini;

  const isNBC = projectFireStandard === "NBC";
  const stdColor = isNBC ? "#ef4444" : "#f59e0b";
  const stdFlag  = isNBC ? "🇮🇳" : "🇺🇸";
  const stdLabel = isNBC ? "NBC 2016" : "NFPA 72/13";

  const cardBase: React.CSSProperties = {
    borderRadius: 14, padding: "18px 20px", cursor: "pointer",
    transition: "all 0.2s", border: "2px solid",
    textAlign: "left",
  };

  return (
    <Overlay onClose={close}>
      <div style={{
        background: "var(--bg-card, #1a1a2e)", borderRadius: 20,
        border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
        width: "100%", maxWidth: 520, padding: 32,
        animation: "slideUp 0.25s ease",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileSpreadsheet size={22} color="#ef4444" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>Generate BOQ</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Choose how the BOQ should be generated</div>
          </div>
          <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Project settings info strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22,
        }}>
          {/* Standard badge — locked from project */}
          <div style={{
            padding: "10px 14px", borderRadius: 10,
            background: `${stdColor}08`, border: `1px solid ${stdColor}30`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>{stdFlag}</span>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Standard</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: stdColor }}>{stdLabel}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Set in project settings</div>
            </div>
            <CheckCircle2 size={14} color={stdColor} style={{ marginLeft: "auto", flexShrink: 0 }} />
          </div>
          {/* AI model badge */}
          <div style={{
            padding: "10px 14px", borderRadius: 10,
            background: `${meta.color}08`, border: `1px solid ${meta.color}30`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>{meta.icon}</span>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Model</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.label}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Set in project settings</div>
            </div>
            <CheckCircle2 size={14} color={meta.color} style={{ marginLeft: "auto", flexShrink: 0 }} />
          </div>
        </div>

        {/* BOQ Type Selection */}
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
          How should the BOQ be generated?
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          Manual uses deterministic {stdLabel} formulas. AI uses <strong style={{ color: meta.color }}>{meta.label}</strong> for intelligent generation.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Manual */}
          <button
            onClick={() => setState(s => ({ ...s, boqType: "manual" }))}
            style={{
              ...cardBase,
              borderColor: state.boqType === "manual" ? "#10b981" : "var(--border)",
              background: state.boqType === "manual" ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, marginBottom: 10,
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Calculator size={20} color="#10b981" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: state.boqType === "manual" ? "#10b981" : "var(--text-primary)", marginBottom: 4 }}>
              Manual Calculation
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
              Deterministic {stdLabel} formulas. Fast, reliable, fully traceable.
            </div>
            {state.boqType === "manual" && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={13} color="#10b981" />
                <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>Selected</span>
              </div>
            )}
          </button>

          {/* AI */}
          <button
            onClick={() => setState(s => ({ ...s, boqType: "ai" }))}
            style={{
              ...cardBase,
              borderColor: state.boqType === "ai" ? meta.color : "var(--border)",
              background: state.boqType === "ai" ? `${meta.color}0f` : "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, marginBottom: 10,
              background: `${meta.color}15`, border: `1px solid ${meta.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>
              {meta.icon}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: state.boqType === "ai" ? meta.color : "var(--text-primary)", marginBottom: 4 }}>
              AI Generated
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {meta.label} generates the BOQ using project dimensions and {stdLabel} rules.
            </div>
            {state.boqType === "ai" && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={13} color={meta.color} />
                <span style={{ fontSize: 11, color: meta.color, fontWeight: 600 }}>Selected</span>
              </div>
            )}
          </button>
        </div>

        {state.boqType === "ai" && (
          <div style={{
            marginTop: 12, padding: "8px 14px", borderRadius: 10,
            background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
            fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6,
          }}>
            💡 If {meta.label} fails (API key missing or quota exceeded), the system automatically falls back to manual calculation.
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
          <button
            className="btn-primary"
            onClick={onConfirm}
            disabled={isGenerating}
            style={{ padding: "10px 28px" }}
          >
            {state.boqType === "ai" ? <><span>{meta.icon}</span> {isGenerating ? "Generating..." : "Generate AI BOQ"}</> : (isGenerating ? "Generating..." : "Generate BOQ")}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────────
// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [boqModal, setBoqModal] = useState<BOQModalState>({
    open: false,
    boqType: "manual",
  });

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.get(id),
  });

  const { data: drawings } = useQuery({
    queryKey: ["drawings", id],
    queryFn: () => drawingsApi.list(id),
  });

  const { data: analysis } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => analysisApi.get(id),
    retry: false,
    enabled: !!project,
  });

  const { data: boq } = useQuery({
    queryKey: ["boq", id],
    queryFn: () => boqApi.get(id),
    retry: false,
    enabled: !!project,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analysisApi.trigger(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("AI Analysis completed!");
        qc.invalidateQueries({ queryKey: ["analysis", id] });
        qc.invalidateQueries({ queryKey: ["project", id] });
        qc.invalidateQueries({ queryKey: ["projects"] });
        setActiveTab("analysis");
      }
    },
    onError: () => toast.error("Analysis request failed. Please check your connection."),
  });

  const manualMutation = useMutation({
    mutationFn: (data: ManualBuildingData) => analysisApi.submitManual(id, data),
    onSuccess: () => {
      toast.success("Building measurements saved!");
      qc.invalidateQueries({ queryKey: ["analysis", id] });
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setActiveTab("analysis");
    },
    onError: () => toast.error("Failed to save manual measurements. Please try again."),
  });

  const analyzeResult = analyzeMutation.data;
  const analyzeError =
    analyzeResult && !analyzeResult.success
      ? { error_code: analyzeResult.error_code, error_message: analyzeResult.error_message }
      : null;

  const boqMutation = useMutation({
    mutationFn: (params: { standard?: string; boq_type?: string; ai_model?: string }) =>
      boqApi.generate(id, params),
    onSuccess: () => {
      toast.success("BOQ generated successfully!");
      qc.invalidateQueries({ queryKey: ["boq", id] });
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setBoqModal(s => ({ ...s, open: false }));
      setActiveTab("boq");
    },
    onError: () => toast.error("BOQ generation failed. Run AI analysis first."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(id),
    onSuccess: () => {
      toast.success("Project deleted");
      qc.invalidateQueries({ queryKey: ["projects"] });
      router.push("/projects/history");
    },
  });

  // ── Tab next/back logic ────────────────────────────────────────────────────
  const hasDrawings = (drawings?.length || 0) > 0;
  const hasAnalysis = !!analysis;
  const hasBOQ = !!boq;

  const TAB_ORDER: Tab[] = ["overview", "drawings", "analysis", "layout", "boq", "chat"];

  function isNextEnabled(tab: Tab): boolean {
    switch (tab) {
      case "overview": return true;
      case "drawings": return true;   // drawing is optional
      case "analysis": return hasAnalysis;
      case "layout": return hasAnalysis;
      case "boq": return hasBOQ;
      case "chat": return false;
    }
  }

  function getNextLabel(tab: Tab): string {
    switch (tab) {
      case "overview": return "Go to Drawings";
      case "drawings": return "Go to Analysis";
      case "analysis": return "View Layout";
      case "layout": return "View BOQ";
      case "boq": return "Open AI Assistant";
      default: return "Next";
    }
  }

  function getNextHint(tab: Tab): string {
    if (isNextEnabled(tab)) return "";
    switch (tab) {
      case "analysis": return "Complete AI analysis or enter measurements manually first";
      case "layout": return "Complete analysis first to generate layout";
      case "boq": return "Generate BOQ first";
      default: return "";
    }
  }

  const handleNext = useCallback(() => {
    const idx = TAB_ORDER.indexOf(activeTab);
    if (idx < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[idx + 1]);
  }, [activeTab]);

  const handleBack = useCallback(() => {
    const idx = TAB_ORDER.indexOf(activeTab);
    if (idx > 0) setActiveTab(TAB_ORDER[idx - 1]);
  }, [activeTab]);

  const openBOQModal = () => {
    setBoqModal({ open: true, boqType: "manual" });
  };

  const handleBOQConfirm = () => {
    boqMutation.mutate({
      standard: project?.fire_standard || "NBC",
      boq_type: boqModal.boqType,
      ai_model: project?.ai_model || "gemini",
    });
  };

  if (projectLoading) {
    return (
      <AppLayout>
        <div style={{ padding: 36 }}>
          <div className="glass-card shimmer" style={{ height: 100, marginBottom: 20 }} />
          <div className="glass-card shimmer" style={{ height: 400 }} />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div style={{ padding: 36, textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)" }}>Project not found</p>
          <Link href="/projects/history">
            <button className="btn-primary" style={{ marginTop: 16 }}>Back to History</button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const currentTabIdx = TAB_ORDER.indexOf(activeTab);
  const isLastTab = activeTab === "chat";
  const isFirstTab = activeTab === "overview";

  return (
    <AppLayout>
      {/* BOQ Modal */}
      {boqModal.open && (
        <BOQGenerateModal
          state={boqModal}
          setState={setBoqModal}
          onConfirm={handleBOQConfirm}
          isGenerating={boqMutation.isPending}
          projectAiModel={project?.ai_model || "gemini"}
          projectFireStandard={project?.fire_standard || "NBC"}
        />
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div style={{ padding: "28px 36px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/projects/history"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", textDecoration: "none", fontSize: 13, marginBottom: 14 }}>
            <ArrowLeft size={14} /> Back to History
          </Link>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800 }}>{project.project_name}</h1>
                <span className={`status-badge ${STATUS_COLORS[project.status]}`}>
                  {STATUS_LABELS[project.status]}
                </span>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
                  {project.project_id}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>•</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{project.client_name}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>•</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{project.location}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>•</span>
                <span style={{ fontSize: 12, fontWeight: 600 }} className={HAZARD_COLORS[project.hazard_category]}>
                  {HAZARD_LABELS[project.hazard_category]}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>•</span>
                {/* AI Model badge */}
                {(() => {
                  const m = AI_MODEL_META[project.ai_model || "gemini"] || AI_MODEL_META.gemini;
                  return (
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: "2px 8px", borderRadius: 20,
                      background: `${m.color}15`, border: `1px solid ${m.color}35`,
                      color: m.color, display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      {m.icon} {m.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className="btn-secondary"
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending || !hasDrawings}
                title={!hasDrawings ? "Upload a drawing first" : ""}
              >
                <Zap size={15} />
                {analyzeMutation.isPending ? "Analyzing..." : "Analyze Drawing"}
              </button>
              <button
                className="btn-secondary"
                onClick={openBOQModal}
                disabled={boqMutation.isPending || !hasAnalysis}
                title={!hasAnalysis ? "Run analysis first" : ""}
              >
                <FileSpreadsheet size={15} />
                {boqMutation.isPending ? "Generating..." : "Generate BOQ"}
              </button>
              {boq && <ExportButtons projectId={id} />}
              <button
                className="btn-danger"
                onClick={() => {
                  if (confirm("Delete this project? This cannot be undone.")) {
                    deleteMutation.mutate();
                  }
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Progress */}
        <div className="glass-card" style={{ padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 0 }}>
          {[
            { label: "Project Created", done: true },
            { label: "Drawing Uploaded", done: hasDrawings, optional: true },
            { label: "AI Analysis", done: hasAnalysis },
            { label: "Layout Generated", done: hasAnalysis },
            { label: "BOQ Generated", done: hasBOQ },
            { label: "Ready to Export", done: hasBOQ },
          ].map((step, i, arr) => (
            <div key={step.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: step.done ? "linear-gradient(135deg, #10b981, #059669)" : step.optional ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.08)",
                  border: step.done ? "none" : step.optional ? "1px dashed rgba(245,158,11,0.5)" : "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {step.done
                    ? <CheckCircle2 size={13} color="white" />
                    : <Clock size={11} color={step.optional ? "#f59e0b" : "var(--text-muted)"} />
                  }
                </div>
                <span style={{
                  fontSize: 11, fontWeight: step.done ? 600 : 400,
                  color: step.done ? "var(--text-primary)" : step.optional ? "#f59e0b" : "var(--text-muted)",
                  whiteSpace: "nowrap"
                }}>
                  {step.label}{step.optional && !step.done ? " (optional)" : ""}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div style={{
                  flex: 1, height: 1, margin: "0 8px",
                  background: step.done ? "rgba(16,185,129,0.4)" : "var(--border)"
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "10px 16px",
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? "#ef4444" : "var(--text-muted)",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: active ? "2px solid #ef4444" : "2px solid transparent",
                  marginBottom: -1,
                  transition: "all 0.2s",
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="fade-in">
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Project Info */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
                  Project Information
                </div>
                {[
                  ["Project ID", project.project_id],
                  ["Project Name", project.project_name],
                  ["Client", project.client_name],
                  ["Location", project.location],
                  ["Building Type", BUILDING_TYPE_LABELS[project.building_type] || project.building_type],
                  ["Hazard Category", HAZARD_LABELS[project.hazard_category]],
                  ["Created", formatDateTime(project.created_at)],
                  ["Status", STATUS_LABELS[project.status]],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{k}</span>
                    <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, textAlign: "right" }}>{v}</span>
                  </div>
                ))}
                {project.remarks && (
                  <div style={{ marginTop: 12, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>REMARKS</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{project.remarks}</div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {analysis && (
                  <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--text-primary)" }}>
                      Building Summary
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        ["Floor Area", `${analysis.building_data.estimated_area.toFixed(0)} sqm`],
                        ["Floors", analysis.building_data.floors],
                        ["Rooms", analysis.building_data.rooms],
                        ["Corridors", analysis.building_data.corridors],
                        ["Staircases", analysis.building_data.stairs],
                        ["Exits", analysis.building_data.exits],
                      ].map(([k, v]) => (
                        <div key={k as string} style={{ background: "rgba(239,68,68,0.05)", borderRadius: 8, padding: 10 }}>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#ef4444" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analysis && (
                  <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--text-primary)" }}>
                      Fire Equipment Summary
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        ["Smoke Detectors", analysis.recommendations.smoke_detectors, "#3b82f6"],
                        ["Heat Detectors", analysis.recommendations.heat_detectors, "#f59e0b"],
                        ["MCP", analysis.recommendations.mcp, "#ef4444"],
                        ["Hooters", analysis.recommendations.hooters, "#8b5cf6"],
                        ["Sprinklers", analysis.recommendations.sprinklers, "#06b6d4"],
                        ["Hydrants", analysis.recommendations.hydrants, "#10b981"],
                      ].map(([k, v, c]) => (
                        <div key={k as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{k}</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: c as string }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!analysis && (
                  <div className="glass-card" style={{ padding: 24, textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <Zap size={36} color="var(--text-muted)" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
                      No Analysis Yet
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 240 }}>
                      Upload a drawing for AI extraction, or go directly to Analysis and enter measurements manually.
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                      <button className="btn-secondary"
                        onClick={() => setActiveTab("drawings")}
                        style={{ padding: "8px 14px", fontSize: 12 }}>
                        <Upload size={13} /> Upload Drawing
                      </button>
                      <button className="btn-primary"
                        onClick={() => setActiveTab("analysis")}
                        style={{ padding: "8px 14px", fontSize: 12 }}>
                        <Zap size={13} /> Go to Analysis
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "drawings" && (
            <DrawingUpload projectId={id} drawings={drawings || []} />
          )}

          {activeTab === "analysis" && (
            <AnalysisPanel
              analysis={analysis}
              isLoading={analyzeMutation.isPending}
              onAnalyze={() => analyzeMutation.mutate()}
              onManualSubmit={(data) => manualMutation.mutate(data)}
              isManualSubmitting={manualMutation.isPending}
              hasDrawings={hasDrawings}
              analyzeError={analyzeError}
              aiModel={project?.ai_model || "gemini"}
            />
          )}

          {activeTab === "layout" && analysis && (
            <KonvaCanvas layoutData={analysis.layout_data} />
          )}

          {activeTab === "layout" && !analysis && (
            <div className="glass-card" style={{ padding: 60, textAlign: "center" }}>
              <Map size={48} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                No Layout Available
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Run AI Analysis first to generate the fire system layout
              </div>
            </div>
          )}

          {activeTab === "boq" && (
            <BOQTable
              boq={boq}
              onGenerate={openBOQModal}
              isGenerating={boqMutation.isPending}
              hasAnalysis={hasAnalysis}
            />
          )}

          {activeTab === "chat" && (
            <AIAssistant projectId={id} />
          )}
        </div>

        {/* ── Next / Back Navigation Bar ──────────────────────────────────────── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)",
        }}>
          {/* Back button */}
          {!isFirstTab ? (
            <button
              className="btn-secondary"
              onClick={handleBack}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
            >
              <ChevronLeft size={16} />
              Back: {TABS[currentTabIdx - 1]?.label}
            </button>
          ) : (
            <div />
          )}

          {/* Step indicator */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: currentTabIdx === i ? 24 : 8,
                  height: 8, borderRadius: 999,
                  background: currentTabIdx === i ? "#ef4444" : "rgba(255,255,255,0.15)",
                  border: "none", cursor: "pointer",
                  transition: "all 0.3s ease",
                  padding: 0,
                }}
                title={tab.label}
              />
            ))}
          </div>

          {/* Next button */}
          {!isLastTab ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <button
                className="btn-primary"
                onClick={handleNext}
                disabled={!isNextEnabled(activeTab)}
                title={getNextHint(activeTab)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                  opacity: isNextEnabled(activeTab) ? 1 : 0.45,
                }}
              >
                {getNextLabel(activeTab)}
                <ChevronRight size={16} />
              </button>
              {!isNextEnabled(activeTab) && (
                <span style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 200, textAlign: "right" }}>
                  {getNextHint(activeTab)}
                </span>
              )}
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
