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
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { projectsApi } from "@/lib/api";
import type { ProjectCreate, BuildingType, HazardCategory } from "@/lib/types";

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

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProjectCreate>({
    project_name: "",
    client_name: "",
    location: "",
    building_type: "office",
    hazard_category: "light",
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

  return (
    <AppLayout>
      <div style={{ padding: "32px 36px", maxWidth: 800 }}>
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
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>New Project</h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Create a new fire BOQ project
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
          <div className="glass-card" style={{ padding: 28, marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <span style={{ fontSize: 15, fontWeight: 700 }}>Hazard Category</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>— per NBC 2016 Part 4</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {HAZARD_TYPES.map(ht => (
                <div
                  key={ht.value}
                  onClick={() => field("hazard_category", ht.value)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: `2px solid ${form.hazard_category === ht.value ? ht.color : "var(--border)"}`,
                    background: form.hazard_category === ht.value ? `${ht.color}15` : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
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

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isPending}
              style={{ padding: "12px 28px", fontSize: 15 }}
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
