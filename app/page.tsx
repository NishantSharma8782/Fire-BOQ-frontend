"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  FolderOpen,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  FolderPlus,
  Flame,
  ShieldCheck,
  Zap,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { projectsApi } from "@/lib/api";
import { STATUS_LABELS, STATUS_COLORS, formatDate, BUILDING_TYPE_LABELS } from "@/lib/utils";
import type { ProjectSummary } from "@/lib/types";

function StatCard({ value, label, icon: Icon, color }: {
  value: number | string;
  label: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div className="stat-value gradient-text">{value}</div>
          <div className="stat-label" style={{ marginTop: 6 }}>{label}</div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}20`,
          border: `1px solid ${color}40`,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link href={`/projects/${project.project_id}`} style={{ textDecoration: "none" }}>
      <div className="glass-card glass-card-hover" style={{ padding: "20px 24px", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
              {project.project_name}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace" }}>
              {project.project_id}
            </div>
          </div>
          <span className={`status-badge ${STATUS_COLORS[project.status]}`}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--text-muted)" }}>Client: </span>
            {project.client_name}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--text-muted)" }}>Type: </span>
            {BUILDING_TYPE_LABELS[project.building_type] || project.building_type}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {project.drawing_count > 0 && (
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 999,
                background: "rgba(59,130,246,0.15)", color: "#60a5fa",
                border: "1px solid rgba(59,130,246,0.25)"
              }}>
                {project.drawing_count} drawing{project.drawing_count > 1 ? "s" : ""}
              </span>
            )}
            {project.has_analysis && (
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 999,
                background: "rgba(16,185,129,0.15)", color: "#34d399",
                border: "1px solid rgba(16,185,129,0.25)"
              }}>
                AI Analyzed
              </span>
            )}
            {project.has_boq && (
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 999,
                background: "rgba(239,68,68,0.15)", color: "#f87171",
                border: "1px solid rgba(239,68,68,0.25)"
              }}>
                BOQ Ready
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {formatDate(project.created_at)}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
  });

  const total = projects?.length || 0;
  const analyzed = projects?.filter(p => p.has_analysis).length || 0;
  const boqReady = projects?.filter(p => p.has_boq).length || 0;
  const recent = projects?.slice(0, 5) || [];

  return (
    <AppLayout>
      <div style={{ padding: "32px 36px", maxWidth: 1200 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, #ef4444, #f97316)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 20px rgba(239,68,68,0.35)"
            }}>
              <Flame size={26} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>
                Dashboard
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                AI-Powered Fire Safety BOQ Platform
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          <StatCard value={total} label="Total Projects" icon={FolderOpen} color="#ef4444" />
          <StatCard value={analyzed} label="AI Analyzed" icon={Zap} color="#f59e0b" />
          <StatCard value={boqReady} label="BOQ Generated" icon={CheckCircle2} color="#10b981" />
          <StatCard value={total - boqReady} label="In Progress" icon={Clock} color="#3b82f6" />
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
          {[
            {
              href: "/projects/new",
              icon: FolderPlus,
              title: "New Project",
              desc: "Create a new fire BOQ project",
              color: "#ef4444",
            },
            {
              href: "/projects/history",
              icon: FolderOpen,
              title: "All Projects",
              desc: "View and manage all projects",
              color: "#3b82f6",
            },
            {
              href: "#",
              icon: ShieldCheck,
              title: "Standards",
              desc: "NBC 2016 · IS 2189 · IS 15105",
              color: "#10b981",
            },
          ].map(({ href, icon: Icon, title, desc, color }) => (
            <Link key={title} href={href} style={{ textDecoration: "none" }}>
              <div className="glass-card glass-card-hover" style={{ padding: 20, cursor: "pointer" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: `${color}20`, border: `1px solid ${color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 12
                }}>
                  <Icon size={20} color={color} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  {title}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Projects */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              Recent Projects
            </h2>
            <Link href="/projects/history"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 13, color: "#ef4444", textDecoration: "none", fontWeight: 500
              }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card shimmer" style={{ height: 100 }} />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="glass-card" style={{
              padding: "60px 24px", textAlign: "center"
            }}>
              <Flame size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>
                No projects yet
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                Create your first fire BOQ project to get started
              </div>
              <Link href="/projects/new">
                <button className="btn-primary">
                  <FolderPlus size={16} /> Create Project
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recent.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
