import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Layers, 
  Activity, 
  Search, 
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { fetchDashboardStats, fetchReportData } from "../api";
import { DashboardStats, Threat } from "../types";

interface DashboardProps {
  projectName: string;
  onSelectTab: (tab: string) => void;
  modules: string[];
}

export default function Dashboard({ projectName, onSelectTab, modules }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allThreats, setAllThreats] = useState<(Threat & { module_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsData, reportData] = await Promise.all([
        fetchDashboardStats(projectName),
        fetchReportData(projectName)
      ]);
      setStats(statsData);
      setAllThreats(reportData.threats);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectName) {
      loadData();
    }
  }, [projectName, modules]); // Reload stats when project changes or a module is created/deleted

  const filteredThreats = allThreats.filter(t => 
    t.threat_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.stride_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.attack_scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.mitigation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.module_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Loading security posture metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-slate-900 p-8 flex items-center justify-center">
        <div className="bg-red-950/20 border border-red-500/20 p-6 rounded-lg text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">Error Loading Dashboard</h3>
          <p className="text-red-400 text-sm">{error}</p>
          <button 
            onClick={loadData} 
            className="mt-4 px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const criticalCount = stats?.risk_counts.Critical || 0;
  const highCount = stats?.risk_counts.High || 0;
  const mediumCount = stats?.risk_counts.Medium || 0;
  const lowCount = stats?.risk_counts.Low || 0;

  return (
    <div className="flex-1 bg-slate-900 overflow-y-auto p-6 md:p-8 text-slate-100 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Security Posture Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">
            Analyzing threats for project: <span className="text-indigo-400 font-medium">{projectName}</span>
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0 bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real-time local scan active</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Modules Card */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 hover:border-slate-800 transition-colors flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Modules Modeled</span>
            <span className="text-3xl font-extrabold text-white">{stats?.total_modules || 0}</span>
          </div>
          <div className="bg-indigo-600/10 p-3 rounded-lg text-indigo-400 border border-indigo-500/10">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Total Threats Card */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 hover:border-slate-800 transition-colors flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Total Threats Found</span>
            <span className="text-3xl font-extrabold text-white">{stats?.total_threats || 0}</span>
          </div>
          <div className="bg-rose-600/10 p-3 rounded-lg text-rose-400 border border-rose-500/10">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Risk Distribution Card */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 hover:border-slate-800 transition-colors flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Highest Severity Risk</span>
            <span className="text-lg font-bold text-white flex items-center space-x-1.5 mt-1">
              {criticalCount > 0 ? (
                <span className="text-red-500">Critical</span>
              ) : highCount > 0 ? (
                <span className="text-orange-500">High</span>
              ) : mediumCount > 0 ? (
                <span className="text-amber-500">Medium</span>
              ) : (
                <span className="text-emerald-500">Low</span>
              )}
            </span>
          </div>
          <div className="bg-amber-600/10 p-3 rounded-lg text-amber-400 border border-amber-500/10">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Severity Breakdown Bar */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-6 mb-8">
        <h3 className="text-sm font-semibold text-white mb-4">Threat Severity Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500 font-medium mb-1">Critical</div>
            <div className="text-xl font-bold text-red-500">{criticalCount}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500 font-medium mb-1">High</div>
            <div className="text-xl font-bold text-orange-500">{highCount}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500 font-medium mb-1">Medium</div>
            <div className="text-xl font-bold text-amber-500">{mediumCount}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500 font-medium mb-1">Low</div>
            <div className="text-xl font-bold text-emerald-500">{lowCount}</div>
          </div>
        </div>
      </div>

      {/* Quick Search and Threat Explorer */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-md font-semibold text-white">Interactive Threat Explorer</h3>
            <p className="text-xs text-slate-500 mt-0.5">Filter across threat descriptions, scenarios, mitigations, or module names</p>
          </div>
          
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search threats, stride, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 rounded-lg pl-9 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {filteredThreats.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg bg-slate-900/10">
            <FolderOpen className="w-8 h-8 text-slate-700 mx-auto mb-2.5" />
            <p className="text-slate-500 text-sm">No threats match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950">
                  <th className="threat-grid-header w-1/6">Threat Name</th>
                  <th className="threat-grid-header w-1/12">Module</th>
                  <th className="threat-grid-header w-1/12">STRIDE</th>
                  <th className="threat-grid-header w-1/12">Risk</th>
                  <th className="threat-grid-header w-4/12">Attack Scenario</th>
                  <th className="threat-grid-header w-3/12">Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {filteredThreats.map((threat, idx) => {
                  const riskColor = 
                    threat.risk_level.toLowerCase() === "critical" ? "text-red-500 bg-red-950/20 border-red-900/50" :
                    threat.risk_level.toLowerCase() === "high" ? "text-orange-400 bg-orange-950/20 border-orange-900/50" :
                    threat.risk_level.toLowerCase() === "medium" ? "text-amber-400 bg-amber-950/20 border-amber-900/50" :
                    "text-emerald-400 bg-emerald-950/20 border-emerald-900/50";
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="threat-grid-cell font-medium text-white">{threat.threat_name}</td>
                      <td className="threat-grid-cell">
                        <button 
                          onClick={() => onSelectTab(`module-${threat.module_name}`)}
                          className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline flex items-center space-x-1"
                        >
                          <span>{threat.module_name}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="threat-grid-cell">
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-900 border border-slate-800 text-slate-400">
                          {threat.stride_category}
                        </span>
                      </td>
                      <td className="threat-grid-cell">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${riskColor}`}>
                          {threat.risk_level}
                        </span>
                      </td>
                      <td className="threat-grid-cell leading-relaxed">{threat.attack_scenario}</td>
                      <td className="threat-grid-cell text-slate-400 leading-relaxed">{threat.mitigation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
