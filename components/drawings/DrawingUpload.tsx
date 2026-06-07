"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload,
  FileImage,
  File as FileIcon,
  Trash2,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { drawingsApi } from "@/lib/api";
import { formatFileSize, formatDateTime } from "@/lib/utils";
import type { Drawing, DrawingType } from "@/lib/types";

const DRAWING_TYPES: { value: DrawingType; label: string }[] = [
  { value: "floor_plan", label: "Floor Plan" },
  { value: "fire_layout", label: "Fire Layout" },
  { value: "architectural", label: "Architectural Drawing" },
];

interface Props {
  projectId: string;
  drawings: Drawing[];
}

export default function DrawingUpload({ projectId, drawings }: Props) {
  const qc = useQueryClient();
  const [dragOver, setDragOver] = useState(false);
  const [selectedType, setSelectedType] = useState<DrawingType>("floor_plan");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: DrawingType }) =>
      drawingsApi.upload(projectId, type, file),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["drawings", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Upload failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: drawingsApi.delete,
    onSuccess: () => {
      toast.success("Drawing deleted");
      qc.invalidateQueries({ queryKey: ["drawings", projectId] });
    },
  });

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type) && !file.name.toLowerCase().match(/\.(jpg|jpeg|png|pdf)$/)) {
      toast.error("Only PDF, PNG, JPG files are supported");
      return;
    }
    uploadMutation.mutate({ file, type: selectedType });
  }, [selectedType, uploadMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div>
      {/* Drawing Type Selector */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
          Drawing Type
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {DRAWING_TYPES.map(dt => (
            <button
              key={dt.value}
              onClick={() => setSelectedType(dt.value)}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                border: `1px solid ${selectedType === dt.value ? "#ef4444" : "var(--border)"}`,
                background: selectedType === dt.value ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.03)",
                color: selectedType === dt.value ? "#ef4444" : "var(--text-secondary)",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`dropzone ${dragOver ? "active" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ marginBottom: 20 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          style={{ display: "none" }}
          onChange={e => handleFiles(e.target.files)}
        />
        <div style={{ marginBottom: 12 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px"
          }}>
            {uploadMutation.isPending
              ? <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#ef4444", animation: "spin 0.8s linear infinite" }} />
              : <Upload size={26} color="#ef4444" />
            }
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            {uploadMutation.isPending ? "Uploading..." : "Drop drawing here or click to browse"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Supports PDF, PNG, JPG, JPEG • Max 50MB
          </div>
        </div>
      </div>

      {/* Uploaded Drawings */}
      {drawings.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
            Uploaded Drawings ({drawings.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {drawings.map(drawing => (
              <div key={drawing.id} className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: drawing.mime_type === "application/pdf"
                    ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)",
                  border: drawing.mime_type === "application/pdf"
                    ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(59,130,246,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {drawing.mime_type === "application/pdf"
                    ? <FileIcon size={20} color="#ef4444" />
                    : <FileImage size={20} color="#3b82f6" />
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {drawing.filename}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                      {DRAWING_TYPES.find(dt => dt.value === drawing.drawing_type)?.label || drawing.drawing_type}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatFileSize(drawing.file_size)}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDateTime(drawing.uploaded_at)}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={drawingsApi.getFileUrl(drawing.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none" }}
                  >
                    <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                      <Eye size={13} /> View
                    </button>
                  </a>
                  <button
                    className="btn-danger"
                    style={{ padding: "6px 10px" }}
                    onClick={() => deleteMutation.mutate(drawing.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {drawings.length === 0 && !uploadMutation.isPending && (
        <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, color: "var(--text-muted)" }}>
          No drawings uploaded yet. Upload a floor plan to enable AI analysis.
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
