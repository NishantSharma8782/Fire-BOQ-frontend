"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  FolderOpen,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Building2,
} from "lucide-react";
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { projectsApi } from "@/lib/api";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  formatDate,
  BUILDING_TYPE_LABELS,
  HAZARD_LABELS,
  HAZARD_COLORS,
} from "@/lib/utils";

const AI_BADGES: Record<string, { icon: string; label: string; color: string }> = {
  gemini: { icon: "✨", label: "Gemini", color: "#3b82f6" },
  openai: { icon: "🤖", label: "GPT-4o", color: "#10b981" },
  groq:   { icon: "⚡", label: "Groq",   color: "#f59e0b" },
  claude: { icon: "🔮", label: "Claude", color: "#8b5cf6" },
};

export default function ProjectHistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
  });

  const filtered = (projects || []).filter(p => {
    const matchSearch =
      !search ||
      p.project_name.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name.toLowerCase().includes(search.toLowerCase()) ||
      p.project_id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AppLayout>
      <div className="mobile-page-pad" style={{ padding: "32px 36px" }}>
        {/* Header */}
        <div className="page-header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #ef4444, #f97316)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
              flexShrink: 0,
            }}>
              <FolderOpen size={22} color="white" />
            </div>
            <div>
              <h1 className="page-title" style={{ fontSize: 22, fontWeight: 800 }}>Project History</h1>
              <p className="page-subtitle" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {projects?.length || 0} total projects
              </p>
            </div>
          </div>
          <Link href="/projects/new">
            <button className="btn-primary">
              <Plus size={16} /> New Project
            </button>
          </Link>
        </div>

        {/* Filters */}
        <div className="glass-card" style={{ padding: "14px 16px", marginBottom: 18 }}>
          <div className="filters-row" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={15} style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)"
              }} />
              <input
                className="fire-input"
                placeholder="Search projects..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
            <select
              className="fire-input"
              style={{ width: "auto", minWidth: 150, cursor: "pointer" }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="drawing_uploaded">Drawing Uploaded</option>
              <option value="analyzed">Analyzed</option>
              <option value="boq_generated">BOQ Generated</option>
            </select>
          </div>
        </div>

        {/* Projects — Loading */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card shimmer" style={{ height: 80 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: "56px 20px", textAlign: "center" }}>
            <Building2 size={44} color="var(--text-muted)" style={{ marginBottom: 14 }} />
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
              No projects found
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {search ? "Try a different search term" : "Create your first project to get started"}
            </div>
          </div>
        ) : (
          <>
            {/* ── Desktop Table View ── */}
            <div className="glass-card history-table-wrapper" style={{ overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Project ID", "Name", "Client", "Building Type", "Hazard", "AI Model", "Status", "Created", ""].map(h => (
                      <th key={h} style={{
                        padding: "12px 14px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        background: "rgba(239,68,68,0.05)",
                        whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(project => (
                    <tr key={project.id}
                      style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 12, color: "#ef4444", fontWeight: 600
                        }}>
                          {project.project_id}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600 }}>
                        {project.project_name}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>
                        {project.client_name}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>
                        {BUILDING_TYPE_LABELS[project.building_type] || project.building_type}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}
                          className={HAZARD_COLORS[project.hazard_category]}>
                          {HAZARD_LABELS[project.hazard_category]}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {(() => {
                          const m = AI_BADGES[project.ai_model || "gemini"] || AI_BADGES.gemini;
                          return (
                            <span style={{
                              fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                              padding: "3px 9px", borderRadius: 20,
                              background: `${m.color}15`, border: `1px solid ${m.color}35`,
                              color: m.color, display: "inline-flex", alignItems: "center", gap: 4,
                            }}>
                              {m.icon} {m.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className={`status-badge ${STATUS_COLORS[project.status]}`}>
                          {STATUS_LABELS[project.status]}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {formatDate(project.created_at)}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <Link href={`/projects/${project.project_id}`}
                          style={{ color: "#ef4444", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                          Open <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Card View ── */}
            <div className="history-cards-wrapper" style={{ display: "none" }}>
              {filtered.map(project => {
                const m = AI_BADGES[project.ai_model || "gemini"] || AI_BADGES.gemini;
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.project_id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div className="glass-card glass-card-hover" style={{ padding: "16px" }}>
                      {/* Top row */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {project.project_name}
                          </div>
                          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#ef4444", fontWeight: 600 }}>
                            {project.project_id}
                          </div>
                        </div>
                        <span className={`status-badge ${STATUS_COLORS[project.status]}`} style={{ flexShrink: 0, marginLeft: 8 }}>
                          {STATUS_LABELS[project.status]}
                        </span>
                      </div>

                      {/* Details */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginBottom: 10 }}>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                          <span style={{ color: "var(--text-muted)" }}>Client: </span>{project.client_name}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                          <span style={{ color: "var(--text-muted)" }}>Type: </span>
                          {BUILDING_TYPE_LABELS[project.building_type] || project.building_type}
                        </div>
                        <div style={{ fontSize: 12 }} className={HAZARD_COLORS[project.hazard_category]}>
                          <span style={{ color: "var(--text-muted)" }}>Hazard: </span>
                          {HAZARD_LABELS[project.hazard_category]}
                        </div>
                      </div>

                      {/* Bottom row: AI badge + date + arrow */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            padding: "2px 8px", borderRadius: 20,
                            background: `${m.color}15`, border: `1px solid ${m.color}35`,
                            color: m.color, display: "inline-flex", alignItems: "center", gap: 3,
                          }}>
                            {m.icon} {m.label}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {formatDate(project.created_at)}
                          </span>
                        </div>
                        <ArrowRight size={16} color="#ef4444" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
