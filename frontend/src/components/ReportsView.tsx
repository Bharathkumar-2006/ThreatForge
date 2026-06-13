import React, { useState, useEffect } from "react";
import { fetchReportData, getExportTxtUrl, getExportPdfUrl } from "../api";
import { Threat } from "../types";
import { FileDown, Search, AlertCircle, FileText, Download } from "lucide-react";

interface ReportsViewProps {
  projectName: string;
}

export default function ReportsView({ projectName }: ReportsViewProps) {
  const [threats, setThreats] = useState<(Threat & { module_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchReportData(projectName);
      setThreats(data.threats);
    } catch (err: any) {
      setError(err.message || "Failed to compile aggregate reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [projectName]);

  const handleExportTxt = () => {
    const url = getExportTxtUrl(projectName);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectName}_Threat_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    const url = getExportPdfUrl(projectName);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectName}_Threat_Report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredThreats = threats.filter(t => 
    t.threat_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.stride_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.risk_level.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.module_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.attack_scenario.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Assembling document threats report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-slate-900 p-8 flex items-center justify-center">
        <div className="bg-red-950/20 border border-red-500/20 p-6 rounded-lg text-center max-w-md animate-fade-in">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">Error Compiling Report</h3>
          <p className="text-red-400 text-sm">{error}</p>
          <button 
            onClick={loadReport} 
            className="mt-4 px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-900 overflow-y-auto p-6 md:p-8 text-slate-100 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>Threat Modeling Report</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Aggregated security model for: <span className="text-indigo-400 font-semibold">{projectName}</span>
          </p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex space-x-3 shrink-0">
          <button
            onClick={handleExportTxt}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg px-4 py-2 text-sm font-semibold flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export TXT</span>
          </button>
          
          <button
            onClick={handleExportPdf}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center space-x-2 transition-colors shadow-lg shadow-indigo-600/10"
          >
            <FileDown className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main Report Table Area */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-6 space-y-4 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-md font-semibold text-white">Consolidated Threats Catalog</h3>
            <p className="text-xs text-slate-500 mt-0.5">Showing compiled checklist of security flaws mapped to modules</p>
          </div>
          
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, stride, risk, or module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 rounded-lg pl-9 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {filteredThreats.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-lg bg-slate-900/10">
            <AlertCircle className="w-10 h-10 text-slate-755 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-semibold">No threats compiled.</p>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
              Verify you have modules created and threats generated inside them. They will compile here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950">
                  <th className="threat-grid-header w-1/12">Module</th>
                  <th className="threat-grid-header w-1/6">Threat Name</th>
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
                      <td className="threat-grid-cell font-semibold text-indigo-400 font-sans">{threat.module_name}</td>
                      <td className="threat-grid-cell font-medium text-white">{threat.threat_name}</td>
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
