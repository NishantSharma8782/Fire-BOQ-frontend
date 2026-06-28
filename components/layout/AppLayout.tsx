"use client";

import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        className="mobile-main-content"
        style={{
          flex: 1,
          marginLeft: "var(--sidebar-w)",
          minHeight: "100vh",
          background: "var(--bg-primary)",
          overflow: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
