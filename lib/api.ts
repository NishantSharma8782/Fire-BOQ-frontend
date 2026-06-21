import axios from "axios";
import type {
  Project,
  ProjectCreate,
  ProjectSummary,
  Drawing,
  Analysis,
  AnalysisTriggerResponse,
  ManualBuildingData,
  BOQReport,
  BOQGenerateResponse,
  ChatMessage,
  ChatResponse,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsApi = {
  create: (data: ProjectCreate): Promise<Project> =>
    api.post("/projects/", data).then((r) => r.data),

  list: (): Promise<ProjectSummary[]> =>
    api.get("/projects/").then((r) => r.data),

  get: (projectId: string): Promise<Project> =>
    api.get(`/projects/${projectId}`).then((r) => r.data),

  update: (projectId: string, data: ProjectCreate): Promise<Project> =>
    api.put(`/projects/${projectId}`, data).then((r) => r.data),

  delete: (projectId: string): Promise<void> =>
    api.delete(`/projects/${projectId}`).then((r) => r.data),
};

// ── Drawings ──────────────────────────────────────────────────────────────────
export const drawingsApi = {
  upload: (projectId: string, drawingType: string, file: File): Promise<{ success: boolean; drawing: Drawing; message: string }> => {
    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("drawing_type", drawingType);
    formData.append("file", file);
    return api.post("/drawings/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  list: (projectId: string): Promise<Drawing[]> =>
    api.get(`/drawings/${projectId}`).then((r) => r.data),

  delete: (drawingId: string): Promise<void> =>
    api.delete(`/drawings/${drawingId}`).then((r) => r.data),

  getFileUrl: (drawingId: string): string =>
    `${BASE_URL}/drawings/file/${drawingId}`,
};

// ── Analysis ──────────────────────────────────────────────────────────────────
export const analysisApi = {
  trigger: (projectId: string): Promise<AnalysisTriggerResponse> =>
    api.post(`/analysis/${projectId}/analyze`).then((r) => r.data),

  submitManual: (projectId: string, buildingData: ManualBuildingData): Promise<AnalysisTriggerResponse> =>
    api.post(`/analysis/${projectId}/manual`, buildingData).then((r) => r.data),

  get: (projectId: string): Promise<Analysis> =>
    api.get(`/analysis/${projectId}`).then((r) => r.data),
};

// ── BOQ ───────────────────────────────────────────────────────────────────────
export const boqApi = {
  generate: (
    projectId: string,
    params: { standard?: string; boq_type?: string; ai_model?: string } = {}
  ): Promise<BOQGenerateResponse> =>
    api.post(`/boq/${projectId}/generate`, {
      standard: params.standard || "NBC",
      boq_type: params.boq_type || "manual",
      // ai_model is optional — if omitted, backend uses the project's saved ai_model
      ...(params.ai_model ? { ai_model: params.ai_model } : {}),
    }).then((r) => r.data),

  get: (projectId: string): Promise<BOQReport> =>
    api.get(`/boq/${projectId}`).then((r) => r.data),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatApi = {
  send: (projectId: string, message: string, history: ChatMessage[]): Promise<ChatResponse> =>
    api.post("/chat/", { project_id: projectId, message, history }).then((r) => r.data),

  getHistory: (projectId: string, page = 1, pageSize = 30): Promise<{
    messages: ChatMessage[];
    total: number;
    total_pages: number;
    page: number;
  }> =>
    api.get(`/chat/${projectId}/history`, { params: { page, page_size: pageSize } }).then((r) => r.data),
};

// ── Export ────────────────────────────────────────────────────────────────────
export const exportApi = {
  pdfUrl: (projectId: string): string =>
    `${BASE_URL}/export/${projectId}/pdf`,

  excelUrl: (projectId: string): string =>
    `${BASE_URL}/export/${projectId}/excel`,

  csvUrl: (projectId: string): string =>
    `${BASE_URL}/export/${projectId}/csv`,
};

export default api;
