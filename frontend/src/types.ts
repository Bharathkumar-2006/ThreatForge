export interface ProjectInfo {
  name: string;
  description: string;
  tech_stack: string;
  notes: string;
}

export interface Threat {
  threat_name: string;
  stride_category: string;
  risk_level: string;
  attack_scenario: string;
  mitigation: string;
}

export interface ModuleData {
  name: string;
  notes: string;
  threats: Threat[];
}

export interface DashboardStats {
  total_modules: number;
  total_threats: number;
  risk_counts: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
}

export interface ReportData {
  threats: (Threat & { module_name: string })[];
  text_report: string;
}
