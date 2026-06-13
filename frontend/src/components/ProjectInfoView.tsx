import React, { useState, useEffect } from "react";
import { fetchProjectInfo, updateProjectInfo } from "../api";
import { ProjectInfo } from "../types";
import { Save, AlertCircle, FileEdit, CheckCircle2 } from "lucide-react";

interface ProjectInfoViewProps {
  projectName: string;
}

export default function ProjectInfoView({ projectName }: ProjectInfoViewProps) {
  const [info, setInfo] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadInfo = async () => {
      setLoading(true);
      setError("");
      setSuccess(false);
      try {
        const data = await fetchProjectInfo(projectName);
        setInfo(data);
      } catch (err: any) {
        setError(err.message || "Failed to load project metadata.");
      } finally {
        setLoading(false);
      }
    };
    loadInfo();
  }, [projectName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await updateProjectInfo(projectName, info);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Clear success indicator after 3 seconds
    } catch (err: any) {
      setError(err.message || "Failed to save project metadata.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Retrieving project configuration...</p>
        </div>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="flex-1 bg-slate-900 p-8 flex items-center justify-center">
        <div className="bg-red-950/20 border border-red-500/20 p-6 rounded-lg text-center max-w-md animate-fade-in">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">Error Loading Project Metadata</h3>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-900 overflow-y-auto p-6 md:p-8 text-slate-100 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FileEdit className="w-6 h-6 text-indigo-400" />
            <span>Project Info</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-mono">Project Info.txt</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-950/30 border border-red-800/50 p-4 rounded-lg flex items-center space-x-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="bg-emerald-950/30 border border-emerald-800/50 p-4 rounded-lg flex items-center space-x-3 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Configuration changes successfully written to disk.</span>
          </div>
        )}

        {/* Project Name Field */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Project Name
          </label>
          <input
            type="text"
            value={info?.name || ""}
            disabled
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed focus:outline-none"
          />
          <span className="text-[10px] text-slate-500 italic block">
            To rename the project, please use the rename button next to the project dropdown in the sidebar.
          </span>
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Project Description
          </label>
          <textarea
            value={info?.description || ""}
            onChange={(e) => info && setInfo({ ...info, description: e.target.value })}
            rows={4}
            placeholder="What is this application? Describe the context, business logic, users, and overall security boundaries..."
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Tech Stack Field */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tech Stack
          </label>
          <input
            type="text"
            value={info?.tech_stack || ""}
            onChange={(e) => info && setInfo({ ...info, tech_stack: e.target.value })}
            placeholder="e.g. React, Fastify, PostgreSQL, Docker, AWS S3"
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Notes Field */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Scope & Security Notes
          </label>
          <textarea
            value={info?.notes || ""}
            onChange={(e) => info && setInfo({ ...info, notes: e.target.value })}
            rows={5}
            placeholder="Identify authentication mechanisms (e.g. JWT in Cookies, OAuth), roles, data classifications, external network connections..."
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Save Actions */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg px-5 py-2.5 text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-600/10 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Project Configuration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
