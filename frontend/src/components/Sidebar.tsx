import React, { useState } from "react";
import { 
  Shield, 
  LayoutDashboard, 
  Info, 
  Network, 
  FolderPlus, 
  FileText, 
  Plus, 
  Folder, 
  ChevronDown, 
  ChevronRight,
  Trash2,
  Edit,
  Check,
  X
} from "lucide-react";

interface SidebarProps {
  projects: string[];
  currentProject: string;
  onSelectProject: (name: string) => void;
  onCreateProject: (name: string) => Promise<void>;
  onRenameProject: (oldName: string, newName: string) => Promise<void>;
  onDeleteProject: (name: string) => Promise<void>;
  
  modules: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onCreateModule: (name: string) => Promise<void>;
  onDeleteModule: (name: string) => Promise<void>;
}

export default function Sidebar({
  projects,
  currentProject,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  modules,
  activeTab,
  onSelectTab,
  onCreateModule,
  onDeleteModule,
}: SidebarProps) {
  const [isModulesExpanded, setIsModulesExpanded] = useState(true);
  const [showNewProjInput, setShowNewProjInput] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  
  const [isEditingProj, setIsEditingProj] = useState(false);
  const [editProjName, setEditProjName] = useState("");
  
  const [showNewModInput, setShowNewModInput] = useState(false);
  const [newModName, setNewModName] = useState("");

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    try {
      await onCreateProject(newProjName.trim());
      setNewProjName("");
      setShowNewProjInput(false);
    } catch (err: any) {
      alert(err.message || "Failed to create project");
    }
  };

  const handleRenameProject = async () => {
    if (!editProjName.trim() || editProjName.trim() === currentProject) {
      setIsEditingProj(false);
      return;
    }
    try {
      await onRenameProject(currentProject, editProjName.trim());
      setIsEditingProj(false);
    } catch (err: any) {
      alert(err.message || "Failed to rename project");
    }
  };

  const handleDeleteProject = async () => {
    if (confirm(`Are you sure you want to delete project "${currentProject}"? This will erase all text documents on disk.`)) {
      try {
        await onDeleteProject(currentProject);
      } catch (err: any) {
        alert(err.message || "Failed to delete project");
      }
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModName.trim()) return;
    try {
      await onCreateModule(newModName.trim());
      setNewModName("");
      setShowNewModInput(false);
    } catch (err: any) {
      alert(err.message || "Failed to create module");
    }
  };

  const handleDeleteModule = async (e: React.MouseEvent, modName: string) => {
    e.stopPropagation();
    if (confirm(`Delete module "${modName}"? This will delete the note and its threat model.`)) {
      try {
        await onDeleteModule(modName);
      } catch (err: any) {
        alert(err.message || "Failed to delete module");
      }
    }
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col h-screen select-none shrink-0 text-slate-300">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-900 flex items-center space-x-2.5">
        <div className="bg-indigo-600/10 p-2 rounded-lg border border-indigo-500/20 text-indigo-400">
          <Shield className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="font-semibold text-white tracking-wide text-md">ThreatForge</h1>
          <span className="text-xs text-slate-500 font-mono">v1.0.0 (MVP)</span>
        </div>
      </div>

      {/* Project Selector Section */}
      <div className="p-4 border-b border-slate-900 bg-slate-950/50">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          📁 Active Workspace
        </label>
        
        {projects.length === 0 ? (
          <div className="text-sm text-slate-500 italic mb-2">No projects found.</div>
        ) : isEditingProj ? (
          <div className="flex items-center space-x-1">
            <input
              type="text"
              value={editProjName}
              onChange={(e) => setEditProjName(e.target.value)}
              className="bg-slate-900 border border-indigo-500/50 rounded px-2 py-1 text-sm text-white w-full focus:outline-none"
              autoFocus
            />
            <button onClick={handleRenameProject} className="p-1 text-green-500 hover:bg-slate-900 rounded">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setIsEditingProj(false)} className="p-1 text-red-500 hover:bg-slate-900 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between space-x-1">
            <select
              value={currentProject}
              onChange={(e) => onSelectProject(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer w-full"
            >
              {projects.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>
            
            {currentProject && (
              <div className="flex shrink-0">
                <button
                  onClick={() => {
                    setEditProjName(currentProject);
                    setIsEditingProj(true);
                  }}
                  title="Rename Project"
                  className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDeleteProject}
                  title="Delete Project"
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Project Button */}
        {!showNewProjInput ? (
          <button
            onClick={() => setShowNewProjInput(true)}
            className="mt-3 flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors w-full px-1"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Create New Project</span>
          </button>
        ) : (
          <form onSubmit={handleCreateProject} className="mt-3 space-y-1.5">
            <input
              type="text"
              placeholder="Project Name..."
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <div className="flex justify-end space-x-1">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-2 py-0.5 text-[10px] font-medium"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewProjInput(false);
                  setNewProjName("");
                }}
                className="bg-slate-900 border border-slate-800 text-slate-400 rounded px-2 py-0.5 text-[10px]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {currentProject ? (
          <>
            {/* Core Tabs */}
            <div className="space-y-0.5">
              <button
                onClick={() => onSelectTab("dashboard")}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                  activeTab === "dashboard"
                    ? "bg-slate-900 text-white font-medium border-l-2 border-indigo-500"
                    : "hover:bg-slate-900/50 text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              
              <button
                onClick={() => onSelectTab("info")}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                  activeTab === "info"
                    ? "bg-slate-900 text-white font-medium border-l-2 border-indigo-500"
                    : "hover:bg-slate-900/50 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Info className="w-4 h-4" />
                <span>Project Info</span>
              </button>

              <button
                onClick={() => onSelectTab("architecture")}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                  activeTab === "architecture"
                    ? "bg-slate-900 text-white font-medium border-l-2 border-indigo-500"
                    : "hover:bg-slate-900/50 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Network className="w-4 h-4" />
                <span>Architecture</span>
              </button>
            </div>

            {/* Folder: Modules */}
            <div>
              <div className="flex items-center justify-between px-3 mb-1.5 group">
                <button
                  onClick={() => setIsModulesExpanded(!isModulesExpanded)}
                  className="flex items-center space-x-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  {isModulesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>📂 Modules</span>
                </button>
                <button
                  onClick={() => {
                    setIsModulesExpanded(true);
                    setShowNewModInput(true);
                  }}
                  title="Add Module"
                  className="text-slate-500 hover:text-indigo-400 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {isModulesExpanded && (
                <div className="pl-3.5 pr-1 space-y-0.5">
                  {showNewModInput && (
                    <form onSubmit={handleCreateModule} className="px-2 py-1 space-y-1 bg-slate-900/40 rounded border border-slate-900">
                      <input
                        type="text"
                        placeholder="e.g. Sign In"
                        value={newModName}
                        onChange={(e) => setNewModName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                      <div className="flex justify-end space-x-1">
                        <button
                          type="submit"
                          className="bg-indigo-600 text-white rounded px-2 py-0.5 text-[9px]"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewModInput(false);
                            setNewModName("");
                          }}
                          className="bg-slate-900 border border-slate-800 text-slate-400 rounded px-2 py-0.5 text-[9px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {modules.length === 0 && !showNewModInput ? (
                    <div className="text-xs text-slate-600 italic px-2.5 py-1">
                      No modules. Hover folder to create one.
                    </div>
                  ) : (
                    modules.map((mod) => {
                      const tabId = `module-${mod}`;
                      const isActive = activeTab === tabId;
                      return (
                        <div
                          key={mod}
                          onClick={() => onSelectTab(tabId)}
                          className={`group/item w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-all duration-150 cursor-pointer ${
                            isActive
                              ? "bg-slate-900 text-white font-medium border-l-2 border-indigo-500"
                              : "hover:bg-slate-900/30 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Folder className="w-3.5 h-3.5 text-slate-500 group-hover/item:text-slate-400 shrink-0" />
                            <span className="truncate">{mod}</span>
                          </div>
                          <button
                            onClick={(e) => handleDeleteModule(e, mod)}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover/item:opacity-100 p-0.5 transition-opacity"
                            title="Delete module"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Reports Tab */}
            <div className="space-y-0.5">
              <button
                onClick={() => onSelectTab("reports")}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                  activeTab === "reports"
                    ? "bg-slate-900 text-white font-medium border-l-2 border-indigo-500"
                    : "hover:bg-slate-900/50 text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Threat Report</span>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-xs text-slate-600 px-4 py-8">
            Create or select a project to open the security workspace.
          </div>
        )}
      </div>
    </aside>
  );
}
