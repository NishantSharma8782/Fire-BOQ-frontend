"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FolderPlus,
  Building2,
  MapPin,
  User,
  FileText,
  AlertTriangle,
  ArrowRight,
  Flame,
  Cpu,
  CheckCircle2,
  Zap,
  Info,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { projectsApi } from "@/lib/api";
import type { ProjectCreate, BuildingType, HazardCategory, AIModel, FireStandard } from "@/lib/types";

// ── Data ──────────────────────────────────────────────────────────────────────
const BUILDING_TYPES: { value: BuildingType; label: string }[] = [
  { value: "office", label: "Office" },
  { value: "residential", label: "Residential" },
  { value: "industrial", label: "Industrial" },
  { value: "hospital", label: "Hospital" },
  { value: "school", label: "School / Educational" },
  { value: "warehouse", label: "Warehouse" },
  { value: "hotel", label: "Hotel" },
  { value: "other", label: "Other" },
];

const HAZARD_TYPES: { value: HazardCategory; label: string; desc: string; color: string }[] = [
  {
    value: "light",
    label: "Light Hazard",
    desc: "Offices, hotels, schools — low combustible loads",
    color: "#10b981",
  },
  {
    value: "ordinary",
    label: "Ordinary Hazard",
    desc: "Hospitals, markets — moderate combustible loads",
    color: "#f59e0b",
  },
  {
    value: "high",
    label: "High Hazard",
    desc: "Warehouses, industries — high combustible loads",
    color: "#ef4444",
  },
];

const FIRE_STANDARDS: { value: FireStandard; label: string; flag: string; desc: string; color: string }[] = [
  {
    value: "NBC",
    label: "NBC 2016",
    flag: "🇮🇳",
    desc: "National Building Code of India 2016. IS 2189, IS 15105, IS 3844. Standard for Indian projects.",
    color: "#ef4444",
  },
  {
    value: "NFPA",
    label: "NFPA 72/13",
    flag: "🇺🇸",
    desc: "NFPA 72 (Fire Alarm), NFPA 13 (Sprinklers), NFPA 14 (Standpipe), NFPA 10 (Extinguishers).",
    color: "#f59e0b",
  },
];

interface AIModelOption {
  value: AIModel;
  name: string;
  icon: string;
  desc: string;
  color: string;
  features: string[];
  needsKey: boolean;
  keyName?: string;
  disabled?: boolean;
}

const AI_MODELS: AIModelOption[] = [
  {
    value: "gemini",
    name: "Gemini 2.0 Flash",
    icon: "✨",
    color: "#3b82f6",
    desc: "Google DeepMind — Vision + Text",
    features: ["Drawing analysis ✓", "BOQ generation ✓", "AI Assistant ✓"],
    needsKey: false,
    disabled: true,
  },
  {
    value: "openai",
    name: "GPT-4o",
    icon: "🤖",
    color: "#10b981",
    desc: "OpenAI — Vision + Text",
    features: ["Drawing analysis ✓", "BOQ generation ✓", "AI Assistant ✓"],
    needsKey: true,
    keyName: "OPENAI_API_KEY",
    disabled: true,
  },
  {
    value: "groq",
    name: "Groq LLaMA-3.3",
    icon: "⚡",
    color: "#f59e0b",
    desc: "Groq — Ultra-fast text inference",
    features: ["Drawing analysis ⚠️ (estimated)", "BOQ generation ✓", "AI Assistant ✓"],
    needsKey: true,
    keyName: "GROQ_API_KEY",
    disabled: false,
  },
  {
    value: "claude",
    name: "Claude 3.5 Sonnet",
    icon: "🔮",
    color: "#8b5cf6",
    desc: "Anthropic — Vision + Text",
    features: ["Drawing analysis ✓", "BOQ generation ✓", "AI Assistant ✓"],
    needsKey: true,
    keyName: "CLAUDE_API_KEY",
    disabled: true,
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function FormField({ label, required, children }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
        display: "flex", alignItems: "center", gap: 4
      }}>
        {label}
        {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProjectCreate>({
    project_name: "",
    client_name: "",
    location: "",
    building_type: "office",
    hazard_category: "light",
    ai_model: "groq",
    fire_standard: "NBC",
    remarks: "",
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (project) => {
      toast.success(`Project ${project.project_id} created!`);
      router.push(`/projects/${project.project_id}`);
    },
    onError: () => {
      toast.error("Failed to create project. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_name || !form.client_name || !form.location) {
      toast.error("Please fill all required fields");
      return;
    }
    createMutation.mutate(form);
  };

  const field = (key: keyof ProjectCreate, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const selectedModel = AI_MODELS.find(m => m.value === form.ai_model)!;

  return (
    <AppLayout>
      <div className="mobile-page-pad" style={{ padding: "32px 36px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #ef4444, #f97316)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(239,68,68,0.3)"
            }}>
              <FolderPlus size={22} color="white" />
            </div>
            <div>
              <h1 className="page-title" style={{ fontSize: 24, fontWeight: 800 }}>New Project</h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Create a new fire BOQ project and select your AI model
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Project Details */}
          <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <FileText size={18} color="#ef4444" />
              <span style={{ fontSize: 15, fontWeight: 700 }}>Project Details</span>
            </div>
            <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Project Name" required>
                <input
                  className="fire-input"
                  placeholder="e.g. ABC Office Complex"
                  value={form.project_name}
                  onChange={e => field("project_name", e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Client Name" required>
                <input
                  className="fire-input"
                  placeholder="e.g. ABC Corporation"
                  value={form.client_name}
                  onChange={e => field("client_name", e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Location" required>
                <input
                  className="fire-input"
                  placeholder="e.g. Mumbai, Maharashtra"
                  value={form.location}
                  onChange={e => field("location", e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Building Type" required>
                <select
                  className="fire-input"
                  value={form.building_type}
                  onChange={e => field("building_type", e.target.value)}
                  style={{ cursor: "pointer" }}
                >
                  {BUILDING_TYPES.map(bt => (
                    <option key={bt.value} value={bt.value}
                      style={{ background: "var(--bg-card)" }}>
                      {bt.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <div style={{ marginTop: 16 }}>
              <FormField label="Remarks / Notes">
                <textarea
                  className="fire-input"
                  placeholder="Additional notes about the project..."
                  value={form.remarks}
                  onChange={e => field("remarks", e.target.value)}
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </FormField>
            </div>
          </div>

          {/* Hazard Category */}
          <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <span style={{ fontSize: 15, fontWeight: 700 }}>Hazard Category</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>— per NBC 2016 Part 4</span>
            </div>
            <div className="hazard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {HAZARD_TYPES.map(ht => (
                <div
                  key={ht.value}
                  onClick={() => field("hazard_category", ht.value)}
                  style={{
                    padding: 16, borderRadius: 12, cursor: "pointer",
                    border: `2px solid ${form.hazard_category === ht.value ? ht.color : "var(--border)"}`,
                    background: form.hazard_category === ht.value ? `${ht.color}15` : "rgba(255,255,255,0.02)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {form.hazard_category === ht.value && (
                    <CheckCircle2 size={14} color={ht.color} style={{ marginBottom: 4 }} />
                  )}
                  <div style={{ fontSize: 14, fontWeight: 700, color: ht.color, marginBottom: 6 }}>
                    {ht.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {ht.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fire Safety Standard */}
          <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Flame size={18} color="#ef4444" />
              <span style={{ fontSize: 15, fontWeight: 700 }}>Fire Safety Standard</span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                background: "rgba(239,68,68,0.12)", color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.3)",
              }}>Project-wide setting</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
              This determines <strong style={{ color: "var(--text-secondary)" }}>coverage areas, spacing rules, and component specifications</strong> used
              in all BOQ calculations for this project. Pre-selected when generating BOQ.
            </div>
            <div className="standard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {FIRE_STANDARDS.map(std => {
                const selected = form.fire_standard === std.value;
                return (
                  <button
                    key={std.value}
                    type="button"
                    onClick={() => field("fire_standard", std.value)}
                    style={{
                      background: selected ? `${std.color}0f` : "rgba(255,255,255,0.02)",
                      border: `2px solid ${selected ? std.color : "var(--border)"}`,
                      borderRadius: 14, padding: "20px 20px",
                      cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{std.flag}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 15, fontWeight: 700,
                          color: selected ? std.color : "var(--text-primary)",
                          marginBottom: 4,
                        }}>
                          {std.label}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                          {std.desc}
                        </div>
                      </div>
                      {selected && <CheckCircle2 size={18} color={std.color} style={{ flexShrink: 0, marginTop: 2 }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── AI Model Selection ─────────────────────────────────────────── */}
          <div className="glass-card" style={{ padding: 28, marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Cpu size={18} color="#8b5cf6" />
              <span style={{ fontSize: 15, fontWeight: 700 }}>AI Model</span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                background: "rgba(139,92,246,0.12)", color: "#8b5cf6",
                border: "1px solid rgba(139,92,246,0.3)",
              }}>Project-wide setting</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
              The selected model will be used for <strong style={{ color: "var(--text-secondary)" }}>all features</strong> in this project:
              drawing analysis, BOQ generation, and the AI assistant.
              You can change this later from project settings.
            </div>

            <div className="model-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {AI_MODELS.map(model => {
                const selected = form.ai_model === model.value;
                return (
                  <button
                    key={model.value}
                    type="button"
                    disabled={model.disabled}
                    onClick={() => !model.disabled && field("ai_model", model.value)}
                    style={{
                      background: model.disabled
                        ? "rgba(255,255,255,0.01)"
                        : selected ? `${model.color}0f` : "rgba(255,255,255,0.02)",
                      border: `2px solid ${
                        model.disabled ? "rgba(255,255,255,0.06)" : selected ? model.color : "var(--border)"
                      }`,
                      borderRadius: 14, padding: "16px 18px",
                      cursor: model.disabled ? "not-allowed" : "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                      opacity: model.disabled ? 0.45 : 1,
                      position: "relative",
                    }}
                  >
                    {/* Coming Soon badge */}
                    {model.disabled && (
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                        padding: "2px 7px", borderRadius: 20,
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.4)",
                        textTransform: "uppercase",
                      }}>
                        Coming Soon
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0, filter: model.disabled ? "grayscale(1)" : "none" }}>{model.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 700,
                          color: model.disabled ? "rgba(255,255,255,0.3)" : selected ? model.color : "var(--text-primary)",
                          marginBottom: 3,
                        }}>
                          {model.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                          {model.desc}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {model.features.map(f => (
                            <div key={f} style={{ fontSize: 11, color: selected ? "var(--text-secondary)" : "var(--text-muted)" }}>
                              {f}
                            </div>
                          ))}
                        </div>
                        {!model.disabled && model.needsKey && (
                          <div style={{
                            marginTop: 8, fontSize: 10,
                            padding: "3px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4,
                            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                            color: "#f59e0b",
                          }}>
                            🔑 Requires {model.keyName} in .env
                          </div>
                        )}
                        {!model.disabled && !model.needsKey && (
                          <div style={{
                            marginTop: 8, fontSize: 10,
                            padding: "3px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4,
                            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
                            color: "#10b981",
                          }}>
                            ✓ Ready — no setup needed
                          </div>
                        )}
                      </div>
                      {selected && !model.disabled && (
                        <CheckCircle2 size={18} color={model.color} style={{ flexShrink: 0, marginTop: 2 }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected model summary */}
            <div style={{
              marginTop: 16, padding: "12px 16px", borderRadius: 10,
              background: `${selectedModel.color}08`,
              border: `1px solid ${selectedModel.color}30`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>{selectedModel.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: selectedModel.color }}>
                  {selectedModel.name} selected
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  All AI operations in this project — drawing analysis, BOQ, and chat — will use this model.
                  {selectedModel.needsKey && ` Make sure ${selectedModel.keyName} is set in backend/.env before running analysis.`}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isPending}
              style={{ padding: "12px 32px", fontSize: 15 }}
            >
              {createMutation.isPending ? (
                <>Creating project...</>
              ) : (
                <>
                  <Flame size={18} />
                  Create Project
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
