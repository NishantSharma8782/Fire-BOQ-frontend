"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
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

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

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
      // If success=false, the error is shown in AnalysisPanel — no toast spam
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

  // Extract AI error details to pass to AnalysisPanel
  const analyzeResult = analyzeMutation.data;
  const analyzeError =
    analyzeResult && !analyzeResult.success
      ? { error_code: analyzeResult.error_code, error_message: analyzeResult.error_message }
      : null;

  const boqMutation = useMutation({
    mutationFn: () => boqApi.generate(id),
    onSuccess: () => {
      toast.success("BOQ generated successfully!");
      qc.invalidateQueries({ queryKey: ["boq", id] });
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
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

  return (
    <AppLayout>
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
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
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
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className="btn-secondary"
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending || !drawings?.length}
                title={!drawings?.length ? "Upload a drawing first" : ""}
              >
                <Zap size={15} />
                {analyzeMutation.isPending ? "Analyzing..." : "Analyze Drawing"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => boqMutation.mutate()}
                disabled={boqMutation.isPending || !analysis}
                title={!analysis ? "Run analysis first" : ""}
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
            { label: "Drawing Uploaded", done: (drawings?.length || 0) > 0 },
            { label: "AI Analysis", done: !!analysis },
            { label: "Layout Generated", done: !!analysis },
            { label: "BOQ Generated", done: !!boq },
            { label: "Ready to Export", done: !!boq },
          ].map((step, i, arr) => (
            <div key={step.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: step.done ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.08)",
                  border: step.done ? "none" : "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {step.done
                    ? <CheckCircle2 size={13} color="white" />
                    : <Clock size={11} color="var(--text-muted)" />
                  }
                </div>
                <span style={{
                  fontSize: 11, fontWeight: step.done ? 600 : 400,
                  color: step.done ? "var(--text-primary)" : "var(--text-muted)",
                  whiteSpace: "nowrap"
                }}>
                  {step.label}
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
                    <Zap size={36} color="var(--text-muted)" />
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
                      No Analysis Yet
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Upload a drawing and run AI analysis to see building insights here
                    </div>
                    <button className="btn-primary"
                      onClick={() => setActiveTab("drawings")}
                      style={{ padding: "8px 16px", fontSize: 13 }}>
                      <Upload size={14} /> Upload Drawing
                    </button>
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
              hasDrawings={(drawings?.length || 0) > 0}
              analyzeError={analyzeError}
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
            <BOQTable boq={boq} onGenerate={() => boqMutation.mutate()} isGenerating={boqMutation.isPending} hasAnalysis={!!analysis} />
          )}

          {activeTab === "chat" && (
            <AIAssistant projectId={id} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
