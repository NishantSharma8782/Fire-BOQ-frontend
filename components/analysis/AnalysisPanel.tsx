"use client";

import { useState } from "react";
import {
  Zap,
  Building2,
  AlertCircle,
  Upload,
  RefreshCw,
  CheckCircle2,
  PenLine,
  BrainCircuit,
  ChevronRight,
  AlertTriangle,
  Info,
} from "lucide-react";
import type { Analysis, ManualBuildingData } from "@/lib/types";

// ── AI Model Meta ────────────────────────────────────────────────────────────
const AI_MODEL_META: Record<string, { icon: string; label: string; visionLabel: string }> = {
  gemini: { icon: "✨", label: "Gemini 2.0 Flash",    visionLabel: "Gemini Vision AI" },
  openai: { icon: "🤖", label: "GPT-4o",              visionLabel: "GPT-4o Vision" },
  groq:   { icon: "⚡", label: "Groq LLaMA-3.3",      visionLabel: "Groq LLaMA-3.3 (estimated)" },
  claude: { icon: "🔮", label: "Claude 3.5 Sonnet",   visionLabel: "Claude Vision" },
};

function getModelMeta(aiModel?: string) {
  return AI_MODEL_META[aiModel?.toLowerCase() || "gemini"] || AI_MODEL_META.gemini;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const ITEM_COLORS: Record<string, string> = {
  smoke_detectors: "#3b82f6",
  heat_detectors: "#f59e0b",
  mcp: "#ef4444",
  hooters: "#8b5cf6",
  fire_extinguishers: "#f97316",
  hydrants: "#10b981",
  sprinklers: "#06b6d4",
  fire_alarm_panel: "#ec4899",
  hose_reels: "#84cc16",
};

const ITEM_LABELS: Record<string, string> = {
  smoke_detectors: "Smoke Detectors",
  heat_detectors: "Heat Detectors",
  mcp: "Manual Call Points",
  hooters: "Hooters / Sounders",
  fire_extinguishers: "Fire Extinguishers",
  hydrants: "Hydrant Valves",
  sprinklers: "Sprinkler Heads",
  fire_alarm_panel: "Fire Alarm Panel",
  hose_reels: "Hose Reels",
};

const BUILDING_TYPES = [
  { value: "office", label: "Office" },
  { value: "residential", label: "Residential" },
  { value: "industrial", label: "Industrial" },
  { value: "hospital", label: "Hospital" },
  { value: "school", label: "School" },
  { value: "warehouse", label: "Warehouse" },
  { value: "hotel", label: "Hotel" },
  { value: "other", label: "Other" },
];

const ERROR_CODE_LABELS: Record<string, string> = {
  API_RATE_LIMIT: "API Rate Limit Exceeded",
  API_KEY_INVALID: "API Key Invalid / Expired",
  API_TIMEOUT: "API Request Timed Out",
  IMAGE_UNREADABLE: "Drawing Could Not Be Read",
  EMPTY_RESPONSE: "AI Returned Empty Response",
  UNKNOWN_ERROR: "AI Analysis Failed",
};

// ── String-based form state (empty fields, no default 0 shown) ─────────────────
interface ManualFormState {
  building_type: string;
  estimated_area: string;
  rooms: string;
  floors: string;
  corridors: string;
  stairs: string;
  entrances: string;
  exits: string;
  open_areas: string;
  ceiling_height: string;
  description: string;
}

const DEFAULT_FORM: ManualFormState = {
  building_type: "office",
  estimated_area: "",
  rooms: "",
  floors: "",
  corridors: "",
  stairs: "",
  entrances: "",
  exits: "",
  open_areas: "",
  ceiling_height: "",
  description: "",
};

function parseFormToData(f: ManualFormState): ManualBuildingData {
  return {
    building_type: f.building_type,
    estimated_area: parseFloat(f.estimated_area) || 0,
    rooms: parseInt(f.rooms) || 0,
    floors: parseInt(f.floors) || 1,
    corridors: parseInt(f.corridors) || 0,
    stairs: parseInt(f.stairs) || 0,
    entrances: parseInt(f.entrances) || 0,
    exits: parseInt(f.exits) || 0,
    open_areas: parseInt(f.open_areas) || 0,
    ceiling_height: parseFloat(f.ceiling_height) || 3.0,
    description: f.description,
  };
}

function dataToForm(d: Partial<ManualBuildingData>): ManualFormState {
  return {
    building_type: d.building_type || "office",
    estimated_area: d.estimated_area ? String(d.estimated_area) : "",
    rooms: d.rooms != null ? String(d.rooms) : "",
    floors: d.floors ? String(d.floors) : "",
    corridors: d.corridors != null ? String(d.corridors) : "",
    stairs: d.stairs != null ? String(d.stairs) : "",
    entrances: d.entrances != null ? String(d.entrances) : "",
    exits: d.exits != null ? String(d.exits) : "",
    open_areas: d.open_areas != null ? String(d.open_areas) : "",
    ceiling_height: d.ceiling_height ? String(d.ceiling_height) : "",
    description: d.description || "",
  };
}

// ── Shared styles (defined at module level to avoid re-creation) ───────────────
const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  fontWeight: 600,
  marginBottom: 5,
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

function getInputStyle(hasError?: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${hasError ? "#ef4444" : "var(--border)"}`,
    borderRadius: 8,
    padding: "9px 12px",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };
}

// ── Field component ───────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  field: keyof ManualFormState;
  form: ManualFormState;
  formErrors: Record<string, string>;
  onFormChange: (field: keyof ManualFormState, value: string) => void;
  allowDecimal?: boolean;  // true for ceiling_height and estimated_area
  required?: boolean;
  placeholder?: string;
  hint?: string;
}

function FormField({
  label,
  field,
  form,
  formErrors,
  onFormChange,
  allowDecimal = false,
  required,
  placeholder,
  hint,
}: FieldProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, arrow keys, home, end
    const allowed = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (allowed.includes(e.key)) return;
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) return;
    // Allow decimal point only for decimal fields
    if (allowDecimal && e.key === ".") {
      // Only allow one decimal point
      if ((form[field] as string).includes(".")) e.preventDefault();
      return;
    }
    // Block anything not a digit
    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={LABEL_STYLE}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      <input
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        pattern={allowDecimal ? "[0-9.]*" : "[0-9]*"}
        value={form[field] as string}
        placeholder={placeholder || ""}
        onChange={(e) => {
          // Strip non-numeric characters on paste
          let val = e.target.value;
          val = allowDecimal ? val.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1") : val.replace(/[^0-9]/g, "");
          onFormChange(field, val);
        }}
        onKeyDown={handleKeyDown}
        style={getInputStyle(!!formErrors[field])}
        autoComplete="off"
      />
      {hint && !formErrors[field] && (
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{hint}</span>
      )}
      {formErrors[field] && (
        <span style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>⚠ {formErrors[field]}</span>
      )}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  analysis: Analysis | undefined;
  isLoading: boolean;
  onAnalyze: () => void;
  onManualSubmit: (data: ManualBuildingData) => void;
  isManualSubmitting: boolean;
  hasDrawings: boolean;
  analyzeError?: { error_code?: string; error_message?: string } | null;
  aiModel?: string;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function AnalysisPanel({
  analysis,
  isLoading,
  onAnalyze,
  onManualSubmit,
  isManualSubmitting,
  hasDrawings,
  analyzeError,
  aiModel,
}: Props) {
  const modelMeta = getModelMeta(aiModel);
  const [mode, setMode] = useState<"choose" | "manual">("choose");
  const [form, setForm] = useState<ManualFormState>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleFormChange = (field: keyof ManualFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: "" }));
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading || isManualSubmitting) {
    const label = isManualSubmitting
      ? "Saving manual measurements..."
      : `${modelMeta.icon} Analyzing Drawing with ${modelMeta.label}...`;
    const sub = isManualSubmitting
      ? "Computing fire equipment requirements from your data..."
      : "Extracting building information, rooms, corridors...";
    return (
      <div className="glass-card" style={{ padding: 60, textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "3px solid transparent",
            borderTopColor: isManualSubmitting ? "#3b82f6" : "#ef4444",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }}
        />
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          {label}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{sub}</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Analysis exists — show results ─────────────────────────────────────────
  if (analysis) {
    return <AnalysisResults analysis={analysis} aiModel={aiModel} onReAnalyze={() => { setMode("choose"); onAnalyze(); }} onManualEdit={() => { setForm(dataToForm(analysis.building_data)); setMode("manual"); }} />;
  }

  // ── AI error state — show error + manual prompt ────────────────────────────
  if (analyzeError && mode === "choose") {
    const errorTitle = ERROR_CODE_LABELS[analyzeError.error_code || ""] || "AI Analysis Failed";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Error card */}
        <div className="glass-card" style={{
          padding: 28,
          background: "rgba(239,68,68,0.04)",
          border: "1px solid rgba(239,68,68,0.25)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AlertTriangle size={22} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>
                ⚠️ {errorTitle}
              </div>
              <div style={{
                fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7,
                background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)",
                borderRadius: 8, padding: "10px 14px",
              }}>
                {analyzeError.error_message}
              </div>
            </div>
          </div>

          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)",
            display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20,
          }}>
            <Info size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <strong style={{ color: "#3b82f6" }}>What to do:</strong> Enter your building measurements manually below.
              All BOQ calculations will use the same IS 2189 / NBC 2016 formulas — only the source of data changes.
              You can also try AI analysis again once the API quota resets.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              className="btn-primary"
              onClick={() => setMode("manual")}
              style={{ padding: "11px 24px", fontSize: 14 }}
            >
              <PenLine size={16} />
              Enter Measurements Manually
              <ChevronRight size={16} />
            </button>
            <button
              className="btn-secondary"
              onClick={onAnalyze}
              style={{ padding: "11px 20px", fontSize: 13 }}
            >
              <RefreshCw size={14} />
              Retry AI Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Mode chooser — no analysis yet ────────────────────────────────────────
  if (mode === "choose") {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
        <div style={{
          width: 68, height: 68, borderRadius: 20, margin: "0 auto 20px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Building2 size={32} color="#ef4444" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: "var(--text-primary)" }}>
          How would you like to get building measurements?
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
          Choose AI extraction from your uploaded drawing, or enter the measurements manually.
          Both methods produce identical BOQ calculations.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 620, margin: "0 auto" }}>
          {/* AI Option */}
          <button
            onClick={onAnalyze}
            disabled={!hasDrawings}
            style={{
              background: hasDrawings ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${hasDrawings ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
              borderRadius: 16, padding: "28px 20px", cursor: hasDrawings ? "pointer" : "not-allowed",
              textAlign: "center", transition: "all 0.2s", opacity: hasDrawings ? 1 : 0.5,
            }}
            onMouseEnter={e => hasDrawings && ((e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)")}
            onMouseLeave={e => hasDrawings && ((e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.07)")}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px",
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BrainCircuit size={26} color="#ef4444" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              {modelMeta.icon} AI from Drawing
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--text-secondary)" }}>{modelMeta.label}</strong> analyzes your uploaded floor plan and automatically extracts room counts,
              floor area, corridors, and more.
            </div>
            {!hasDrawings && (
              <div style={{
                marginTop: 12, padding: "6px 12px", borderRadius: 8,
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                fontSize: 11, color: "#f59e0b",
              }}>
                <Upload size={11} style={{ display: "inline", marginRight: 4 }} />
                Upload a drawing first
              </div>
            )}
          </button>

          {/* Manual Option */}
          <button
            onClick={() => setMode("manual")}
            style={{
              background: "rgba(59,130,246,0.07)",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: 16, padding: "28px 20px", cursor: "pointer",
              textAlign: "center", transition: "all 0.2s",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.12)")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.07)")}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px",
              background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <PenLine size={26} color="#3b82f6" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              ✏️ Manual Entry
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
              Enter building measurements directly — floor area, number of rooms, floors, corridors etc.
              Ideal when AI is unavailable or you have exact survey data.
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── Manual entry form ──────────────────────────────────────────────────────
  return (
    <ManualEntryForm
      form={form}
      formErrors={formErrors}
      onFormChange={handleFormChange}
      onSubmit={() => {
        const data = parseFormToData(form);
        const errors: Record<string, string> = {};
        if (!data.estimated_area || data.estimated_area <= 0)
          errors.estimated_area = "Floor area must be greater than 0";
        if (data.rooms < 0)
          errors.rooms = "Rooms must be 0 or more";
        if (!data.floors || data.floors < 1)
          errors.floors = "Must have at least 1 floor";
        if (!data.ceiling_height || data.ceiling_height < 2)
          errors.ceiling_height = "Ceiling height must be ≥ 2.0 m";
        setFormErrors(errors);
        if (Object.keys(errors).length === 0) {
          onManualSubmit(data);
        }
      }}
      onBack={() => setMode("choose")}
    />
  );
}

// ── Manual Entry Form Component ────────────────────────────────────────────────
function ManualEntryForm({
  form,
  formErrors,
  onFormChange,
  onSubmit,
  onBack,
}: {
  form: ManualFormState;
  formErrors: Record<string, string>;
  onFormChange: (field: keyof ManualFormState, value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div className="glass-card" style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <PenLine size={20} color="#3b82f6" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            Manual Building Measurements
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            All fields marked <span style={{ color: "#ef4444" }}>*</span> are required.
            BOQ will be calculated using IS 2189 / NBC 2016 formulas.
          </div>
        </div>
        <button
          className="btn-secondary"
          onClick={onBack}
          style={{ marginLeft: "auto", padding: "7px 14px", fontSize: 12 }}
        >
          ← Back
        </button>
      </div>

      {/* Building Type */}
      <div style={{ marginBottom: 20 }}>
        <label style={LABEL_STYLE}>Building Type <span style={{ color: "#ef4444" }}>*</span></label>
        <select
          value={form.building_type}
          onChange={e => onFormChange("building_type", e.target.value)}
          style={{ ...getInputStyle(), appearance: "none" }}
        >
          {BUILDING_TYPES.map(bt => (
            <option key={bt.value} value={bt.value}>{bt.label}</option>
          ))}
        </select>
      </div>

      {/* Main fields grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
        <FormField
          label="Total Floor Area (sqm)"
          field="estimated_area"
          form={form} formErrors={formErrors} onFormChange={onFormChange}
          allowDecimal
          required placeholder="e.g. 1200" hint="Total built-up area across all floors"
        />
        <FormField
          label="Number of Rooms"
          field="rooms"
          form={form} formErrors={formErrors} onFormChange={onFormChange}
          required placeholder="e.g. 25" hint="All enclosed spaces"
        />
        <FormField
          label="Number of Floors"
          field="floors"
          form={form} formErrors={formErrors} onFormChange={onFormChange}
          required placeholder="e.g. 4" hint="Include basement if applicable"
        />
        <FormField
          label="Corridors / Passages"
          field="corridors"
          form={form} formErrors={formErrors} onFormChange={onFormChange}
          placeholder="e.g. 8" hint="Including hallways"
        />
        <FormField
          label="Staircases"
          field="stairs"
          form={form} formErrors={formErrors} onFormChange={onFormChange}
          placeholder="e.g. 2" hint="Internal + emergency stairs"
        />
        <FormField
          label="Ceiling Height (m)"
          field="ceiling_height"
          form={form} formErrors={formErrors} onFormChange={onFormChange}
          allowDecimal
          required placeholder="e.g. 3.5" hint="Typical floor-to-ceiling height"
        />
        <FormField
          label="Entrances"
          field="entrances"
          form={form} formErrors={formErrors} onFormChange={onFormChange}
          placeholder="e.g. 2" hint="Main entry points"
        />
        <FormField
          label="Emergency Exits"
          field="exits"
          form={form} formErrors={formErrors} onFormChange={onFormChange}
          placeholder="e.g. 4" hint="Fire exits and emergency doors"
        />
        <FormField
          label="Open Areas / Lobbies"
          field="open_areas"
          form={form} formErrors={formErrors} onFormChange={onFormChange}
          placeholder="e.g. 1" hint="Atriums, lobbies, open floors"
        />
      </div>

      {/* Description */}
      <div style={{ marginBottom: 24 }}>
        <label style={LABEL_STYLE}>Description <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
        <textarea
          value={form.description}
          onChange={e => onFormChange("description", e.target.value)}
          placeholder="Brief description of the building layout, occupancy, or special areas..."
          maxLength={2000}
          rows={3}
          style={{
            ...getInputStyle(),
            resize: "vertical",
            fontFamily: "inherit",
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Submit */}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: "10px 20px" }}>
          Cancel
        </button>
        <button className="btn-primary" onClick={onSubmit} style={{ padding: "10px 28px" }}>
          <CheckCircle2 size={16} />
          Save & Generate Recommendations
        </button>
      </div>
    </div>
  );
}

// ── Analysis Results Component ────────────────────────────────────────────────
function AnalysisResults({
  analysis,
  aiModel,
  onReAnalyze,
  onManualEdit,
}: {
  analysis: Analysis;
  aiModel?: string;
  onReAnalyze: () => void;
  onManualEdit: () => void;
}) {
  const modelMeta = getModelMeta(aiModel || analysis.data_source?.replace("ai_", ""));
  const { building_data: b, recommendations: r } = analysis;
  const isManual = analysis.data_source === "manual";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Success Header */}
      <div className="glass-card" style={{
        padding: "14px 20px",
        background: isManual ? "rgba(59,130,246,0.05)" : "rgba(16,185,129,0.05)",
        border: `1px solid ${isManual ? "rgba(59,130,246,0.2)" : "rgba(16,185,129,0.2)"}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <CheckCircle2 size={20} color={isManual ? "#3b82f6" : "#10b981"} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: isManual ? "#3b82f6" : "#10b981" }}>
            Analysis Complete
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {isManual
              ? "✏️ Manually entered measurements — BOQ calculated using IS standards"
              : `${modelMeta.icon} Powered by ${modelMeta.visionLabel} — Building information extracted from drawing`}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: 11 }}
            onClick={onManualEdit}
          >
            <PenLine size={12} /> Edit Manually
          </button>
          <button
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: 11 }}
            onClick={onReAnalyze}
          >
            <RefreshCw size={12} /> Re-analyze AI
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Building Information */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Building2 size={17} color="#3b82f6" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Building Information</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Floor Area", value: `${b.estimated_area.toFixed(0)} sqm`, color: "#3b82f6" },
              { label: "Floors", value: b.floors, color: "#8b5cf6" },
              { label: "Rooms", value: b.rooms, color: "#10b981" },
              { label: "Corridors", value: b.corridors, color: "#f59e0b" },
              { label: "Staircases", value: b.stairs, color: "#ef4444" },
              { label: "Entrances", value: b.entrances, color: "#06b6d4" },
              { label: "Exits", value: b.exits, color: "#ec4899" },
              { label: "Open Areas", value: b.open_areas, color: "#84cc16" },
              { label: "Ceiling Height", value: `${b.ceiling_height}m`, color: "#f97316" },
            ].map(item => (
              <div key={item.label} style={{
                background: `${item.color}10`,
                border: `1px solid ${item.color}20`,
                borderRadius: 10, padding: "10px 12px",
              }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {b.description && (
            <div style={{
              marginTop: 14, padding: 12,
              background: "rgba(255,255,255,0.03)", borderRadius: 8,
              fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6,
            }}>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                {isManual ? "Description: " : `${modelMeta.label} Description: `}
              </span>
              {b.description}
            </div>
          )}
        </div>

        {/* Fire Recommendations */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={17} color="#ef4444" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Fire Equipment Recommendations</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(ITEM_LABELS).map(([key, label]) => {
              const value = (r as unknown as Record<string, number>)[key];
              if (value === undefined || value === null) return null;
              const color = ITEM_COLORS[key] || "#ef4444";
              const maxVal = 50;
              const pct = Math.min(100, (value / maxVal) * 100);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 130, fontSize: 12, color: "var(--text-secondary)", flexShrink: 0 }}>
                    {label}
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 999, height: 6, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 999,
                      background: color,
                      width: `${pct}%`,
                      transition: "width 1s ease",
                    }} />
                  </div>
                  <div style={{ width: 36, textAlign: "right", fontSize: 14, fontWeight: 800, color }}>
                    {value}
                  </div>
                </div>
              );
            })}
          </div>

          {r.placement_strategy && (
            <div style={{
              marginTop: 16, padding: 12,
              background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: 8, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6,
            }}>
              <span style={{ color: "#ef4444", fontWeight: 600 }}>Placement Strategy: </span>
              {r.placement_strategy}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
