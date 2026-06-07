"use client";

import { Download, FileText, Table, FileSpreadsheet } from "lucide-react";
import { exportApi } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  projectId: string;
}

export default function ExportButtons({ projectId }: Props) {
  const downloadFile = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`${filename} downloaded`);
    } catch {
      toast.error("Export failed. Generate BOQ first.");
    }
  };

  const buttons = [
    {
      label: "PDF",
      icon: FileText,
      color: "#ef4444",
      url: exportApi.pdfUrl(projectId),
      filename: `FireBOQ_${projectId}.pdf`,
    },
    {
      label: "Excel",
      icon: FileSpreadsheet,
      color: "#10b981",
      url: exportApi.excelUrl(projectId),
      filename: `FireBOQ_${projectId}.xlsx`,
    },
    {
      label: "CSV",
      icon: Table,
      color: "#3b82f6",
      url: exportApi.csvUrl(projectId),
      filename: `FireBOQ_${projectId}.csv`,
    },
  ];

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {buttons.map(btn => {
        const Icon = btn.icon;
        return (
          <button
            key={btn.label}
            onClick={() => downloadFile(btn.url, btn.filename)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "8px 14px", borderRadius: 8,
              fontSize: 12, fontWeight: 600,
              background: `${btn.color}15`,
              border: `1px solid ${btn.color}40`,
              color: btn.color, cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = `${btn.color}25`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = `${btn.color}15`;
            }}
          >
            <Download size={13} />
            {btn.label}
          </button>
        );
      })}
    </div>
  );
}
