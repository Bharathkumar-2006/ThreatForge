import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ProjectInfoView from "./components/ProjectInfoView";
import ArchitectureView from "./components/ArchitectureView";
import ModuleView from "./components/ModuleView";
import ReportsView from "./components/ReportsView";
import { 
  fetchProjects, 
  createProject, 
  renameProject, 
  deleteProject, 
  fetchModules, 
  createModule, 
  deleteModule 
} from "./api";
import { Shield, Plus, AlertCircle } from "lucide-react";
import "./App.css";

export default function App() {
  const [projects, setProjects] = useState<string[]>([]);
  const [currentProject, setCurrentProject] = useState<string>("");
  const [modules, setModules] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Project state for the empty workspace view
  const [newProjName, setNewProjName] = useState("");
  const [creatingProj, setCreatingProj] = useState(false);

  // Initialize and load project list
  const loadProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const projs = await fetchProjects();
      setProjects(projs);
      if (projs.length > 0) {
        // Default to first project if none is selected
        if (!currentProject || !projs.includes(currentProject)) {
          setCurrentProject(projs[0]);
          setActiveTab("dashboard");
        }
      } else {
        setCurrentProject("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load projects from the local filesystem.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Load modules whenever active project changes
  const loadModules = async () => {
    if (!currentProject) {
      setModules([]);
      return;
    }
    try {
      const mods = await fetchModules(currentProject);
      setModules(mods);
    } catch (err: any) {
      console.error("Failed to load modules", err);
    }
  };

  useEffect(() => {
    loadModules();
  }, [currentProject]);

  // Project Actions
  const handleSelectProject = (name: string) => {
    setCurrentProject(name);
    setActiveTab("dashboard");
  };

  const handleCreateProject = async (name: string) => {
    const result = await createProject(name);
    await loadProjects();
    setCurrentProject(result.name);
    setActiveTab("info"); // Go directly to documentation view for new projects
  };

  const handleRenameProject = async (oldName: string, newName: string) => {
    await renameProject(oldName, newName);
    await loadProjects();
    setCurrentProject(newName);
  };

  const handleDeleteProject = async (name: string) => {
    await deleteProject(name);
    const updated = projects.filter((p) => p !== name);
    setProjects(updated);
    if (currentProject === name) {
      if (updated.length > 0) {
        setCurrentProject(updated[0]);
        setActiveTab("dashboard");
      } else {
        setCurrentProject("");
        setActiveTab("dashboard");
      }
    }
  };

  // Module Actions
  const handleCreateModule = async (name: string) => {
    if (!currentProject) return;
    await createModule(currentProject, name);
    await loadModules();
    setActiveTab(`module-${name}`); // Switch directly to the new module view
  };

  const handleDeleteModule = async (name: string) => {
    if (!currentProject) return;
    await deleteModule(currentProject, name);
    await loadModules();
    if (activeTab === `module-${name}`) {
      setActiveTab("dashboard");
    }
  };

  // Trigger from the empty workspace UI
  const handleWorkspaceCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    setCreatingProj(true);
    setError("");
    try {
      await handleCreateProject(newProjName.trim());
      setNewProjName("");
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setCreatingProj(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-indigo-600/10 p-4 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Shield className="w-10 h-10 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold tracking-wider">ThreatForge</h1>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-mono">Initializing offline workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render main layout
  return (
    <div className="h-screen w-screen flex bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar: Show project selector and document list */}
      <Sidebar
        projects={projects}
        currentProject={currentProject}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        modules={modules}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onCreateModule={handleCreateModule}
        onDeleteModule={handleDeleteModule}
      />

      {/* Main workspace container */}
      <main className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden relative">
        {currentProject ? (
          <>
            {activeTab === "dashboard" && (
              <Dashboard
                projectName={currentProject}
                onSelectTab={setActiveTab}
                modules={modules}
              />
            )}
            
            {activeTab === "info" && (
              <ProjectInfoView projectName={currentProject} />
            )}
            
            {activeTab === "architecture" && (
              <ArchitectureView projectName={currentProject} />
            )}
            
            {activeTab === "reports" && (
              <ReportsView projectName={currentProject} />
            )}
            
            {activeTab.startsWith("module-") && (
              <ModuleView
                projectName={currentProject}
                moduleName={activeTab.substring(7)}
              />
            )}
          </>
        ) : (
          /* Empty Workspace UI */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-slate-950/40 border border-slate-800 rounded-2xl p-8 text-center space-y-6">
              <div className="bg-indigo-600/10 p-4 rounded-full w-16 h-16 flex items-center justify-center border border-indigo-500/15 mx-auto text-indigo-400">
                <Shield className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Welcome to ThreatForge</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  A document-oriented STRIDE threat modeling workspace. Create your first project workspace to begin drafting modules and evaluating threats.
                </p>
              </div>

              {error && (
                <div className="bg-red-950/30 border border-red-800/50 p-4 rounded-lg flex items-center space-x-3 text-red-400 text-xs text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleWorkspaceCreateProject} className="space-y-3">
                <input
                  type="text"
                  placeholder="Project Name (e.g. Identity Management)"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
                
                <button
                  type="submit"
                  disabled={creatingProj}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-indigo-600/15"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creatingProj ? "Creating Project..." : "Create New Project"}</span>
                </button>
              </form>

              <div className="pt-2 text-[10px] text-slate-500 font-mono">
                Threat models and text files are saved to the local file system.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
