import React, { useState, useEffect } from "react";
import { 
  fetchModuleData, 
  updateModuleData, 
  generateThreats 
} from "../api";
import { ModuleData, Threat } from "../types";
import { 
  Save, 
  Bot, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  FileText 
} from "lucide-react";

interface ModuleViewProps {
  projectName: string;
  moduleName: string;
}

export default function ModuleView({ projectName, moduleName }: ModuleViewProps) {
  const [data, setData] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Editing threat row state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editThreat, setEditThreat] = useState<Threat | null>(null);

  // Creating manual threat state
  const [isAddingThreat, setIsAddingThreat] = useState(false);
  const [newThreat, setNewThreat] = useState<Threat>({
    threat_name: "",
    stride_category: "Spoofing",
    risk_level: "Medium",
    attack_scenario: "",
    mitigation: ""
  });

  const loadModule = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    setEditingIndex(null);
    setIsAddingThreat(false);
    try {
      const result = await fetchModuleData(projectName, moduleName);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load module data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModule();
  }, [projectName, moduleName]);

  const handleSaveNotes = async () => {
    if (!data) return;
    setSavingNotes(true);
    setError("");
    setSuccessMsg("");
    try {
      await updateModuleData(projectName, moduleName, data.notes, data.threats);
      showSuccess("Notes successfully saved.");
    } catch (err: any) {
      setError(err.message || "Failed to save notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleGenerateThreats = async () => {
    if (!data) return;
    setGenerating(true);
    setError("");
    setSuccessMsg("");
    try {
      const generated = await generateThreats(projectName, moduleName);
      setData({ ...data, threats: generated });
      showSuccess(`Threat model updated with ${generated.length} AI-identified threats.`);
    } catch (err: any) {
      setError(err.message || "Failed to generate threats. Ensure OpenRouter API key is configured.");
    } finally {
      setGenerating(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Threat management
  const handleStartEdit = (idx: number, threat: Threat) => {
    setEditingIndex(idx);
    setEditThreat({ ...threat });
  };

  const handleSaveEdit = async (idx: number) => {
    if (!data || !editThreat) return;
    const updatedThreats = [...data.threats];
    updatedThreats[idx] = editThreat;
    
    try {
      await updateModuleData(projectName, moduleName, data.notes, updatedThreats);
      setData({ ...data, threats: updatedThreats });
      setEditingIndex(null);
      setEditThreat(null);
      showSuccess("Threat entry updated.");
    } catch (err: any) {
      setError(err.message || "Failed to update threat list.");
    }
  };

  const handleDeleteThreat = async (idx: number) => {
    if (!data) return;
    if (confirm("Are you sure you want to delete this threat from the list?")) {
      const updatedThreats = data.threats.filter((_, i) => i !== idx);
      try {
        await updateModuleData(projectName, moduleName, data.notes, updatedThreats);
        setData({ ...data, threats: updatedThreats });
        showSuccess("Threat entry removed.");
      } catch (err: any) {
        setError(err.message || "Failed to delete threat.");
      }
    }
  };

  const handleAddManualThreat = async () => {
    if (!data) return;
    if (!newThreat.threat_name.trim()) {
      alert("Threat Name is required.");
      return;
    }
    const updatedThreats = [...data.threats, newThreat];
    try {
      await updateModuleData(projectName, moduleName, data.notes, updatedThreats);
      setData({ ...data, threats: updatedThreats });
      setIsAddingThreat(false);
      setNewThreat({
        threat_name: "",
        stride_category: "Spoofing",
        risk_level: "Medium",
        attack_scenario: "",
        mitigation: ""
      });
      showSuccess("Manual threat entry added.");
    } catch (err: any) {
      setError(err.message || "Failed to add manual threat.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Reading module file from disk...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 bg-slate-900 p-8 flex items-center justify-center">
        <div className="bg-red-950/20 border border-red-500/20 p-6 rounded-lg text-center max-w-md animate-fade-in">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">Error Loading Module</h3>
          <p className="text-red-400 text-sm">{error}</p>
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
            <span>Module Workspace: {moduleName}</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-mono">Modules/{moduleName}.txt</p>
        </div>
        
        {/* Actions Header */}
        <div className="flex space-x-3 shrink-0">
          <button
            onClick={handleGenerateThreats}
            disabled={generating}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center space-x-2 transition-colors shadow-lg shadow-indigo-600/10"
          >
            <Bot className="w-4 h-4 animate-bounce" />
            <span>{generating ? "Modeling in AI..." : "Generate Threat Model"}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="space-y-8 max-w-7xl">
        {/* Alerts Block */}
        {error && (
          <div className="bg-red-950/30 border border-red-800/50 p-4 rounded-lg flex items-center space-x-3 text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/30 border border-emerald-800/50 p-4 rounded-lg flex items-center space-x-3 text-emerald-400 text-sm">
            <Check className="w-5 h-5 shrink-0 animate-bounce" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Notes Section */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Module Notes</h3>
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingNotes ? "Saving..." : "Save Notes"}</span>
            </button>
          </div>
          <textarea
            value={data?.notes || ""}
            onChange={(e) => data && setData({ ...data, notes: e.target.value })}
            rows={5}
            placeholder="Write module-specific details here. For example: Allow authentication using email and password, check for credentials in database, issue OAuth JWT token..."
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors leading-relaxed"
          />
        </div>

        {/* Threat Modeling Workspace Section */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">STRIDE Threat Modeling Inventory</h3>
              <p className="text-xs text-slate-500 mt-0.5">Edit or add manual mitigations below</p>
            </div>
            
            <button
              onClick={() => setIsAddingThreat(true)}
              className="bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Manual Threat</span>
            </button>
          </div>

          {/* AI Loader block */}
          {generating && (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-900/40 border border-slate-800 rounded-lg space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-indigo-500/20 rounded-full"></div>
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-white">OpenRouter Threat Modeling Engine Active</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm px-4">
                  Evaluating architecture topology and notes via STRIDE framework. Identifying vectors and mitigations...
                </p>
              </div>
            </div>
          )}

          {/* Manual Threat Form */}
          {isAddingThreat && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">New Threat Vector</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 uppercase font-semibold">Threat Name</label>
                  <input
                    type="text"
                    placeholder="e.g. SQL Injection"
                    value={newThreat.threat_name}
                    onChange={(e) => setNewThreat({ ...newThreat, threat_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 uppercase font-semibold">STRIDE Category</label>
                  <select
                    value={newThreat.stride_category}
                    onChange={(e) => setNewThreat({ ...newThreat, stride_category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option>Spoofing</option>
                    <option>Tampering</option>
                    <option>Repudiation</option>
                    <option>Information Disclosure</option>
                    <option>Denial of Service</option>
                    <option>Elevation of Privilege</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 uppercase font-semibold">Risk Level</label>
                  <select
                    value={newThreat.risk_level}
                    onChange={(e) => setNewThreat({ ...newThreat, risk_level: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 uppercase font-semibold">Attack Scenario</label>
                  <textarea
                    rows={3}
                    placeholder="Describe how an attacker could exploit this vulnerability..."
                    value={newThreat.attack_scenario}
                    onChange={(e) => setNewThreat({ ...newThreat, attack_scenario: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 uppercase font-semibold">Mitigation</label>
                  <textarea
                    rows={3}
                    placeholder="Describe defensive remediations..."
                    value={newThreat.mitigation}
                    onChange={(e) => setNewThreat({ ...newThreat, mitigation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleAddManualThreat}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1.5 text-xs font-semibold"
                >
                  Save Entry
                </button>
                <button
                  onClick={() => setIsAddingThreat(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Threat List Table */}
          {!generating && (!data?.threats || data.threats.length === 0) ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg bg-slate-900/10">
              <Bot className="w-10 h-10 text-slate-750 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">No threats identified yet.</p>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Fill in the notes above and click "Generate Threat Model" to invoke STRIDE analysis on this module.
              </p>
            </div>
          ) : (
            !generating && (
              <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950">
                      <th className="threat-grid-header w-1/5">Threat Name</th>
                      <th className="threat-grid-header w-1/8">STRIDE</th>
                      <th className="threat-grid-header w-1/8">Risk</th>
                      <th className="threat-grid-header w-3/10">Attack Scenario</th>
                      <th className="threat-grid-header w-3/10">Mitigation</th>
                      <th className="threat-grid-header w-[80px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.threats.map((threat, idx) => {
                      const isEditing = editingIndex === idx;
                      const riskColor = 
                        threat.risk_level.toLowerCase() === "critical" ? "text-red-500 bg-red-950/20 border-red-900/50" :
                        threat.risk_level.toLowerCase() === "high" ? "text-orange-400 bg-orange-950/20 border-orange-900/50" :
                        threat.risk_level.toLowerCase() === "medium" ? "text-amber-400 bg-amber-950/20 border-amber-900/50" :
                        "text-emerald-400 bg-emerald-950/20 border-emerald-900/50";

                      if (isEditing && editThreat) {
                        return (
                          <tr key={idx} className="bg-slate-900/60">
                            <td className="threat-grid-cell">
                              <input
                                type="text"
                                value={editThreat.threat_name}
                                onChange={(e) => setEditThreat({ ...editThreat, threat_name: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-white w-full"
                              />
                            </td>
                            <td className="threat-grid-cell">
                              <select
                                value={editThreat.stride_category}
                                onChange={(e) => setEditThreat({ ...editThreat, stride_category: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-white w-full"
                              >
                                <option>Spoofing</option>
                                <option>Tampering</option>
                                <option>Repudiation</option>
                                <option>Information Disclosure</option>
                                <option>Denial of Service</option>
                                <option>Elevation of Privilege</option>
                              </select>
                            </td>
                            <td className="threat-grid-cell">
                              <select
                                value={editThreat.risk_level}
                                onChange={(e) => setEditThreat({ ...editThreat, risk_level: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-white w-full"
                              >
                                <option>Critical</option>
                                <option>High</option>
                                <option>Medium</option>
                                <option>Low</option>
                              </select>
                            </td>
                            <td className="threat-grid-cell">
                              <textarea
                                rows={2}
                                value={editThreat.attack_scenario}
                                onChange={(e) => setEditThreat({ ...editThreat, attack_scenario: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-white w-full"
                              />
                            </td>
                            <td className="threat-grid-cell">
                              <textarea
                                rows={2}
                                value={editThreat.mitigation}
                                onChange={(e) => setEditThreat({ ...editThreat, mitigation: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-white w-full"
                              />
                            </td>
                            <td className="threat-grid-cell">
                              <div className="flex space-x-1.5">
                                <button
                                  onClick={() => handleSaveEdit(idx)}
                                  className="text-green-500 hover:text-green-400 p-0.5"
                                  title="Confirm edit"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingIndex(null);
                                    setEditThreat(null);
                                  }}
                                  className="text-red-500 hover:text-red-450 p-0.5"
                                  title="Cancel edit"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
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
                          <td className="threat-grid-cell">
                            <div className="flex space-x-1.5">
                              <button
                                onClick={() => handleStartEdit(idx, threat)}
                                className="text-slate-500 hover:text-indigo-400 p-0.5 transition-colors"
                                title="Edit Threat"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteThreat(idx)}
                                className="text-slate-500 hover:text-red-400 p-0.5 transition-colors"
                                title="Delete Threat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
