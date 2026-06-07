// ── Project Types ────────────────────────────────────────────────────────────
export type BuildingType =
  | "office"
  | "residential"
  | "industrial"
  | "hospital"
  | "school"
  | "warehouse"
  | "hotel"
  | "other";

export type HazardCategory = "light" | "ordinary" | "high";

export type ProjectStatus =
  | "draft"
  | "drawing_uploaded"
  | "analyzed"
  | "boq_generated";

export interface ProjectCreate {
  project_name: string;
  client_name: string;
  location: string;
  building_type: BuildingType;
  hazard_category: HazardCategory;
  remarks?: string;
}

export interface Project extends ProjectCreate {
  id: string;
  project_id: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary {
  id: string;
  project_id: string;
  project_name: string;
  client_name: string;
  location: string;
  building_type: BuildingType;
  hazard_category: HazardCategory;
  status: ProjectStatus;
  created_at: string;
  drawing_count: number;
  has_analysis: boolean;
  has_boq: boolean;
}

// ── Drawing Types ─────────────────────────────────────────────────────────────
export type DrawingType = "floor_plan" | "fire_layout" | "architectural";

export interface Drawing {
  id: string;
  project_id: string;
  filename: string;
  drawing_type: DrawingType;
  file_path: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
}

// ── Analysis Types ─────────────────────────────────────────────────────────────
export interface BuildingData {
  building_type: string;
  rooms: number;
  estimated_area: number;
  floors: number;
  corridors: number;
  stairs: number;
  entrances: number;
  exits: number;
  open_areas: number;
  ceiling_height: number;
  description: string;
}

export interface FireRecommendations {
  smoke_detectors: number;
  heat_detectors: number;
  mcp: number;
  hooters: number;
  fire_extinguishers: number;
  hydrants: number;
  sprinklers: number;
  fire_alarm_panel: number;
  hose_reels: number;
  placement_strategy: string;
}

export interface LayoutCoordinate {
  x: number;
  y: number;
  label?: string;
}

export interface LayoutData {
  canvas_width: number;
  canvas_height: number;
  scale: number;
  building_outline: { x: number; y: number }[];
  smoke_detectors: LayoutCoordinate[];
  heat_detectors: LayoutCoordinate[];
  mcp: LayoutCoordinate[];
  hooters: LayoutCoordinate[];
  sprinklers: LayoutCoordinate[];
  hydrants: LayoutCoordinate[];
  fire_extinguishers: LayoutCoordinate[];
}

export interface Analysis {
  id: string;
  project_id: string;
  building_data: BuildingData;
  recommendations: FireRecommendations;
  layout_data: LayoutData;
  raw_analysis?: string;
  data_source?: "ai" | "manual";
  created_at: string;
}

// Used for manual building measurement entry
export interface ManualBuildingData {
  building_type: string;
  estimated_area: number;
  rooms: number;
  floors: number;
  corridors: number;
  stairs: number;
  entrances: number;
  exits: number;
  open_areas: number;
  ceiling_height: number;
  description: string;
}

// ── BOQ Types ──────────────────────────────────────────────────────────────────
export interface BOQItem {
  sno: number;
  item: string;
  description: string;
  unit: string;
  quantity: number;
  calculation_basis: string;
}

export interface BOQSection {
  section_id: string;
  section_name: string;
  items: BOQItem[];
}

export interface BOQReport {
  id: string;
  project_id: string;
  sections: BOQSection[];
  total_items: number;
  generated_at: string;
  notes?: string;
}

// ── Chat Types ─────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

// ── API Response Types ─────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AnalysisTriggerResponse {
  success: boolean;
  message: string;
  analysis?: Analysis;
  // Present only when success=false
  error_code?: string;
  error_message?: string;
  requires_manual?: boolean;
}

export interface BOQGenerateResponse {
  success: boolean;
  message: string;
  boq?: BOQReport;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  timestamp: string;
}
