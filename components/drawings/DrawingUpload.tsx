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
  CloudUpload,
  ImageIcon,
  Layers,
} from "lucide-react";
import { drawingsApi } from "@/lib/api";
import { formatFileSize, formatDateTime } from "@/lib/utils";
import type { Drawing, DrawingType } from "@/lib/types";

const DRAWING_TYPES: {
  value: DrawingType;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    value: "floor_plan",
    label: "Floor Plan",
    desc: "2D room layout",
    icon: Layers,
    color: "#ef4444",
  },
  {
    value: "fire_layout",
    label: "Fire Layout",
    desc: "Fire system overlay",
    icon: ImageIcon,
    color: "#f97316",
  },
  {
    value: "architectural",
    label: "Architectural",
    desc: "Full drawing set",
    icon: FileImage,
    color: "#3b82f6",
  },
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

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (
        !allowed.includes(file.type) &&
        !file.name.toLowerCase().match(/\.(jpg|jpeg|png|pdf)$/)
      ) {
        toast.error("Only PDF, PNG, JPG files are supported");
        return;
      }
      uploadMutation.mutate({ file, type: selectedType });
    },
    [selectedType, uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const selectedInfo = DRAWING_TYPES.find((dt) => dt.value === selectedType)!;

  return (
    <>
      {/* ─── Inline mobile styles ─────────────────────────────────────── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0%   { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        /* Drawing type buttons — 3 col desktop, 1 col mobile */
        .dt-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (max-width: 600px) {
          .dt-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }

        /* Drawing type button */
        .dt-btn {
          padding: 14px;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        .dt-btn:hover { filter: brightness(1.1); }

        /* Drop zone */
        .upload-dropzone {
          border-radius: 18px;
          padding: 36px 24px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          transition: all 0.25s ease;
          border: 2px dashed rgba(239,68,68,0.3);
          background: rgba(239,68,68,0.04);
          gap: 0;
        }
        .upload-dropzone:hover, .upload-dropzone.drag-over {
          border-color: rgba(239,68,68,0.6);
          background: rgba(239,68,68,0.08);
        }
        @media (max-width: 600px) {
          .upload-dropzone {
            padding: 28px 16px;
            border-radius: 14px;
          }
        }

        /* File row */
        .file-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        @media (max-width: 600px) {
          .file-row {
            flex-wrap: wrap;
            gap: 10px;
          }
          .file-row-actions {
            margin-left: auto;
          }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Step 1: Drawing Type ── */}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
            marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%",
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, color: "#ef4444",
            }}>1</span>
            Select Drawing Type
          </div>

          <div className="dt-grid">
            {DRAWING_TYPES.map((dt) => {
              const Icon = dt.icon;
              const active = selectedType === dt.value;
              return (
                <button
                  key={dt.value}
                  className="dt-btn"
                  onClick={() => setSelectedType(dt.value)}
                  style={{
                    border: `2px solid ${active ? dt.color : "rgba(255,255,255,0.08)"}`,
                    background: active
                      ? `${dt.color}12`
                      : "rgba(255,255,255,0.02)",
                  }}
                >
                  {/* Icon box */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: active ? `${dt.color}20` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${active ? dt.color + "50" : "rgba(255,255,255,0.08)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}>
                    <Icon size={18} color={active ? dt.color : "var(--text-muted)"} />
                  </div>

                  {/* Label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: active ? dt.color : "var(--text-primary)",
                      marginBottom: 2,
                    }}>
                      {dt.label}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                      {dt.desc}
                    </div>
                  </div>

                  {/* Check */}
                  {active && (
                    <CheckCircle2 size={16} color={dt.color} style={{ flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Step 2: Upload Zone ── */}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
            marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%",
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, color: "#ef4444",
            }}>2</span>
            Upload Drawing File
          </div>

          <div
            className={`upload-dropzone${dragOver ? " drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
            style={{ cursor: uploadMutation.isPending ? "wait" : "pointer" }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              style={{ display: "none" }}
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* Upload icon */}
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: uploadMutation.isPending
                ? "rgba(59,130,246,0.1)"
                : "rgba(239,68,68,0.08)",
              border: `2px dashed ${uploadMutation.isPending
                ? "rgba(59,130,246,0.4)"
                : dragOver ? "rgba(239,68,68,0.7)" : "rgba(239,68,68,0.3)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
              transition: "all 0.25s ease",
              position: "relative",
            }}>
              {uploadMutation.isPending ? (
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  border: "3px solid transparent", borderTopColor: "#3b82f6",
                  animation: "spin 0.8s linear infinite",
                }} />
              ) : (
                <CloudUpload size={30} color={dragOver ? "#ef4444" : "#f87171"} />
              )}
            </div>

            <div style={{
              fontSize: 16, fontWeight: 700, color: "var(--text-primary)",
              marginBottom: 6,
            }}>
              {uploadMutation.isPending
                ? "Uploading..."
                : dragOver
                  ? "Drop it here! 🎯"
                  : "Drop file here or tap to browse"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
              PDF, PNG, JPG &nbsp;•&nbsp; Max 50MB
            </div>

            {/* Type pill */}
            {!uploadMutation.isPending && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 999,
                background: `${selectedInfo.color}12`,
                border: `1px solid ${selectedInfo.color}40`,
                fontSize: 12, color: selectedInfo.color, fontWeight: 600,
              }}>
                <CheckCircle2 size={12} />
                Uploading as: {selectedInfo.label}
              </div>
            )}
          </div>
        </div>

        {/* ── Uploaded Files ── */}
        {drawings.length > 0 && (
          <div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.08em",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: "#10b981",
                }}>✓</span>
                Uploaded Files
              </div>
              <span style={{
                fontSize: 11, padding: "2px 10px", borderRadius: 999,
                background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                color: "#10b981", fontWeight: 700,
              }}>
                {drawings.length} file{drawings.length > 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {drawings.map((drawing) => {
                const isPdf = drawing.mime_type === "application/pdf";
                const typeInfo = DRAWING_TYPES.find((dt) => dt.value === drawing.drawing_type);
                const TypeIcon = typeInfo?.icon || FileIcon;
                return (
                  <div key={drawing.id} className="glass-card" style={{ padding: "14px 16px" }}>
                    <div className="file-row">
                      {/* File type icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: isPdf ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)",
                        border: isPdf
                          ? "1px solid rgba(239,68,68,0.25)"
                          : "1px solid rgba(59,130,246,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <TypeIcon size={22} color={isPdf ? "#ef4444" : "#3b82f6"} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
                          marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {drawing.filename}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: 10, padding: "2px 7px", borderRadius: 999,
                            background: `${typeInfo?.color || "#ef4444"}12`,
                            color: typeInfo?.color || "#f87171",
                            border: `1px solid ${typeInfo?.color || "#ef4444"}30`,
                            fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                          }}>
                            {typeInfo?.label || drawing.drawing_type}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {formatFileSize(drawing.file_size)}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {formatDateTime(drawing.uploaded_at)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="file-row-actions" style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <a
                          href={drawingsApi.getFileUrl(drawing.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none" }}
                        >
                          <button
                            className="btn-secondary"
                            style={{ padding: "7px 13px", fontSize: 12 }}
                          >
                            <Eye size={13} /> View
                          </button>
                        </a>
                        <button
                          className="btn-danger"
                          style={{ padding: "7px 11px" }}
                          onClick={() => deleteMutation.mutate(drawing.id)}
                          disabled={deleteMutation.isPending}
                          title="Delete drawing"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty hint ── */}
        {drawings.length === 0 && !uploadMutation.isPending && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontSize: 12, color: "var(--text-muted)", padding: "8px 0",
          }}>
            <Upload size={13} />
            No drawings uploaded yet — upload to enable AI analysis
          </div>
        )}
      </div>
    </>
  );
}
