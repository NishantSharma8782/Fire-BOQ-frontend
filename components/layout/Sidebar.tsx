"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderPlus,
  History,
  Flame,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, mobileLabel: "Home" },
  { href: "/projects/new", label: "New Project", icon: FolderPlus, mobileLabel: "New" },
  { href: "/projects/history", label: "Project History", icon: History, mobileLabel: "History" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop Sidebar ────────────────────────────────────────── */}
      <aside
        className="hide-on-mobile"
        style={{
          width: "var(--sidebar-w)",
          minHeight: "100vh",
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "linear-gradient(135deg, #ef4444, #f97316)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 15px rgba(239,68,68,0.4)",
              }}
            >
              <Flame size={22} color="white" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #ef4444, #f97316)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Fire BOQ
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                AI Platform
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 10,
              paddingLeft: 4,
            }}
          >
            Navigation
          </div>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={cn("nav-item", active && "active")}
                style={{ marginBottom: 4 }}>
                <Icon size={18} />
                <span style={{ flex: 1 }}>{label}</span>
                {active && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(249,115,22,0.08))",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 2 }}>
              🔥 Powered by Gemini AI
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
              NBC 2016 • IS 2189 • IS 15105
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Header ─────────────────────────────────────── */}
      <div className="mobile-header">
        <div className="mobile-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #ef4444, #f97316)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 3px 10px rgba(239,68,68,0.4)",
              }}
            >
              <Flame size={18} color="white" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #ef4444, #f97316)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1.1,
                }}
              >
                Fire BOQ
              </div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 500 }}>
                AI Platform
              </div>
            </div>
          </div>
          {/* Powered by badge */}
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#ef4444",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 20,
            padding: "4px 10px",
          }}>
            🔥 AI Powered
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Navigation Bar ──────────────────────────── */}
      <nav className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          {navItems.map(({ href, icon: Icon, mobileLabel }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn("mobile-nav-item", active && "active")}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span>{mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
