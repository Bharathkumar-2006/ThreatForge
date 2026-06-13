import { ProjectInfo, ModuleData, DashboardStats, ReportData, Threat } from "./types";

const API_BASE = "http://127.0.0.1:8000/api";

export async function fetchProjects(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createProject(name: string): Promise<{ name: string; status: string }> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function renameProject(oldName: string, newName: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(oldName)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_name: newName }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteProject(name: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchProjectInfo(projectName: string): Promise<ProjectInfo> {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectName)}/info`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateProjectInfo(projectName: string, info: ProjectInfo): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectName)}/info`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(info),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchArchitecture(projectName: string): Promise<string> {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectName)}/architecture`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.content;
}

export async function updateArchitecture(projectName: string, content: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectName)}/architecture`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchModules(projectName: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectName)}/modules`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createModule(projectName: string, name: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectName)}/modules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchModuleData(projectName: string, moduleName: string): Promise<ModuleData> {
  const res = await fetch(
    `${API_BASE}/projects/${encodeURIComponent(projectName)}/modules/${encodeURIComponent(moduleName)}`
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateModuleData(
  projectName: string,
  moduleName: string,
  notes: string,
  threats: Threat[]
): Promise<any> {
  const res = await fetch(
    `${API_BASE}/projects/${encodeURIComponent(projectName)}/modules/${encodeURIComponent(moduleName)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes, threats }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteModule(projectName: string, moduleName: string): Promise<any> {
  const res = await fetch(
    `${API_BASE}/projects/${encodeURIComponent(projectName)}/modules/${encodeURIComponent(moduleName)}`,
    {
      method: "DELETE",
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function generateThreats(projectName: string, moduleName: string): Promise<Threat[]> {
  const res = await fetch(
    `${API_BASE}/projects/${encodeURIComponent(projectName)}/modules/${encodeURIComponent(moduleName)}/generate-threats`,
    {
      method: "POST",
    }
  );
  if (!res.ok) {
    const errObj = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(errObj.detail || "Threat generation failed.");
  }
  const data = await res.json();
  return data.threats;
}

export async function fetchDashboardStats(projectName: string): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectName)}/dashboard`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchReportData(projectName: string): Promise<ReportData> {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectName)}/reports`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function getExportTxtUrl(projectName: string): string {
  return `${API_BASE}/projects/${encodeURIComponent(projectName)}/reports/export/txt`;
}

export function getExportPdfUrl(projectName: string): string {
  return `${API_BASE}/projects/${encodeURIComponent(projectName)}/reports/export/pdf`;
}
