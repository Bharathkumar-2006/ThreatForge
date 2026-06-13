import React, { useState, useEffect } from "react";
import { fetchArchitecture, updateArchitecture } from "../api";
import { Save, AlertCircle, Network, CheckCircle2 } from "lucide-react";

interface ArchitectureViewProps {
  projectName: string;
}

export default function ArchitectureView({ projectName }: ArchitectureViewProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setError("");
      setSuccess(false);
      try {
        const data = await fetchArchitecture(projectName);
        setContent(data);
      } catch (err: any) {
        setError(err.message || "Failed to load architecture text.");
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [projectName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await updateArchitecture(projectName, content);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save architecture changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Loading architecture documentation...</p>
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
            <Network className="w-6 h-6 text-indigo-400" />
            <span>Architecture Design</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-mono">Architecture.txt</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Help Banner */}
        <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-lg text-slate-400 text-xs leading-relaxed">
          <span className="font-semibold text-white block mb-1">💡 Tips for AI Threat Modeling:</span>
          Describe how components communicate. Specify if protocols are HTTP, HTTPS, WebSockets, or gRPC. Identify data flow directions, trust zones, security protocols, gateways, database engines, external integrations, and how user credentials or sessions are stored.
        </div>

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
            <span>Architecture changes successfully committed to Architecture.txt.</span>
          </div>
        )}

        {/* Notes Editor */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Architecture Details (Plain English)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            placeholder="Users access a React frontend.&#10;Frontend communicates with API Gateway.&#10;API Gateway communicates with Authentication Service and Product Service.&#10;Authentication Service uses PostgreSQL.&#10;JWT is used for authentication."
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors leading-relaxed"
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
            <span>{saving ? "Saving Changes..." : "Save Architecture"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
