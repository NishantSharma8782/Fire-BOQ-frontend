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
      <div style={{ padding: "32px 36px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #ef4444, #f97316)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(239,68,68,0.3)"
            }}>
              <FolderOpen size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Project History</h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
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
        <div className="glass-card" style={{ padding: "16px 20px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={16} style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)", color: "var(--text-muted)"
            }} />
            <input
              className="fire-input"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>
          <select
            className="fire-input"
            style={{ width: "auto", minWidth: 160, cursor: "pointer" }}
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

        {/* Projects Table */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card shimmer" style={{ height: 80 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: "60px 24px", textAlign: "center" }}>
            <Building2 size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>
              No projects found
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {search ? "Try a different search term" : "Create your first project to get started"}
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Project ID", "Name", "Client", "Building Type", "Hazard", "Status", "Created", ""].map(h => (
                    <th key={h} style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      background: "rgba(239,68,68,0.05)",
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
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 12, color: "#ef4444", fontWeight: 600
                      }}>
                        {project.project_id}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600 }}>
                      {project.project_name}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-secondary)" }}>
                      {project.client_name}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-secondary)" }}>
                      {BUILDING_TYPE_LABELS[project.building_type] || project.building_type}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}
                        className={HAZARD_COLORS[project.hazard_category]}>
                        {HAZARD_LABELS[project.hazard_category]}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className={`status-badge ${STATUS_COLORS[project.status]}`}>
                        {STATUS_LABELS[project.status]}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-muted)" }}>
                      {formatDate(project.created_at)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
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
        )}
      </div>
    </AppLayout>
  );
}
