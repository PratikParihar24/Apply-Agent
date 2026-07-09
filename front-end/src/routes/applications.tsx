import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  getApplications, 
  updateApplicationStatus, 
  deleteApplication, 
  checkReplies 
} from "../api/client";
import ProtectedRoute from "../components/ProtectedRoute";
import { Trash2, RefreshCw, Mail, CheckCircle, Eye, AlertCircle, XOctagon, User, X, ExternalLink, Calendar, Cpu, Sparkles, FileText, Send } from "lucide-react";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Applications — Agent Apply" },
      { name: "description", content: "Track your job application pipeline." },
    ],
  }),
  component: ApplicationsPageWrapper,
});

function ApplicationsPageWrapper() {
  return (
    <ProtectedRoute>
      <ApplicationsPage />
    </ProtectedRoute>
  );
}

interface Application {
  _id: string;
  company_id: string;
  company_name: string;
  job_title: string;
  applied_at: string;
  last_updated: string;
  status: "applied" | "viewed" | "replied" | "interview" | "rejected" | "failed";
  llm_provider?: string;
  message?: string;
  cover_letter?: string;
  email_body?: string;
  subject?: string;
  tailored_resume?: string;
  website?: string;
  hr_email?: string;
  apply_url?: string;
  fit_explanation?: string;
  score?: number;
  status_history?: Array<{
    status: string;
    timestamp: string;
    source: string;
  }>;
}

const statusBadges = {
  applied: { bg: "bg-mutedtext/10 text-mutedtext border-mutedtext/20 dark:bg-white/10 dark:text-white/80 dark:border-white/10", label: "Applied", icon: Mail },
  viewed: { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", label: "Viewed", icon: Eye },
  replied: { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", label: "Replied", icon: AlertCircle },
  interview: { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", label: "Interviewing", icon: CheckCircle },
  rejected: { bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", label: "Rejected", icon: XOctagon },
  failed: { bg: "bg-red-500/15 text-red-600 dark:text-red-500 border-red-500/20", label: "Failed", icon: XOctagon },
};

function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const fetchApps = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getApplications();
      setApplications(data);
      // Keep selected app in sync if it is open
      if (selectedApp) {
        const updated = data.find((a: Application) => a._id === selectedApp._id);
        if (updated) setSelectedApp(updated);
      }
    } catch (e: any) {
      toast.error(`Failed to fetch applications: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleStatusChange = async (appId: string, companyId: string, newStatus: any) => {
    try {
      // Use companyId as defined in routing, falling back to appId
      await updateApplicationStatus(companyId || appId, newStatus);
      toast.success("Status updated successfully");
      
      const nowIso = new Date().toISOString();
      // Update local state optimistic UI
      setApplications(prev => prev.map(app => 
        app._id === appId ? { 
          ...app, 
          status: newStatus, 
          last_updated: nowIso,
          status_history: app.status_history ? [
            ...app.status_history,
            { status: newStatus, timestamp: nowIso, source: "manual" }
          ] : [{ status: newStatus, timestamp: nowIso, source: "manual" }]
        } : app
      ));

      // Sync selected modal state
      setSelectedApp(prev => prev && prev._id === appId ? { 
        ...prev, 
        status: newStatus, 
        last_updated: nowIso,
        status_history: prev.status_history ? [
          ...prev.status_history,
          { status: newStatus, timestamp: nowIso, source: "manual" }
        ] : [{ status: newStatus, timestamp: nowIso, source: "manual" }]
      } : prev);
    } catch (e: any) {
      toast.error(`Failed to update status: ${e.message || e}`);
    }
  };

  const handleDelete = async (appId: string) => {
    const originalApplications = [...applications];
    
    // Optimistic UI: update list and close modal immediately
    setApplications(prev => prev.filter(app => app._id !== appId));
    setDeletingId(null);
    if (selectedApp?._id === appId) {
      setSelectedApp(null);
    }
    
    try {
      await deleteApplication(appId);
      toast.success("Application deleted");
    } catch (e: any) {
      // Revert state on failure
      setApplications(originalApplications);
      toast.error(`Failed to delete application: ${e.message || e}`);
    }
  };

  const handleCheckReplies = async () => {
    setPolling(true);
    const promise = checkReplies();
    toast.promise(promise, {
      loading: "Connecting to Gmail and scanning replies...",
      success: () => {
        setPolling(false);
        fetchApps(true);
        return "IMAP reply check completed!";
      },
      error: (err) => {
        setPolling(false);
        return `IMAP check failed: ${err.message || err}`;
      }
    });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-cream">Application History</h1>
          <p className="mt-1 text-sm text-mutedtext">
            Track and manage your sent job applications in real-time.
          </p>
        </div>
        
        <button
          onClick={handleCheckReplies}
          disabled={polling || loading}
          className="flex items-center gap-2 rounded-card bg-terracotta px-4 py-2 text-xs font-bold uppercase tracking-wider text-darkbg hover:opacity-90 disabled:opacity-50 transition-opacity btn-ripple"
        >
          <RefreshCw size={14} className={polling ? "animate-spin" : ""} />
          Check for Replies
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-card border border-cardborder bg-cardbg p-5 flex items-center justify-between">
              <div className="space-y-2 w-1/3">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
              <div className="h-8 bg-white/10 rounded w-24" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-column border border-dashed border-cardborder p-12 text-center max-w-md mx-auto mt-12 bg-cardbg/40 backdrop-blur-sm">
          <Mail size={40} className="mx-auto text-mutedtext mb-4 opacity-40" />
          <h3 className="text-lg font-bold text-cream mb-1">No Applications Yet</h3>
          <p className="text-sm text-mutedtext mb-6">
            Send your first application from your active hunt to see history and track pipeline updates.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-column border border-cardborder bg-cardbg/40 backdrop-blur-sm shadow-xl">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cardborder bg-darkbg/40 text-[10px] font-bold uppercase tracking-wider text-mutedtext">
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Applied</th>
                  <th className="px-6 py-4">AI Model</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cardborder/40 text-sm text-mutedtext">
                {applications.map(app => {
                  const badge = statusBadges[app.status] || statusBadges.applied;
                  const Icon = badge.icon;
                  return (
                    <tr key={app._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold text-cream">
                        <button 
                          onClick={() => setSelectedApp(app)} 
                          className="hover:underline text-left font-bold text-cream focus:outline-none transition-all hover:text-terracotta"
                        >
                          {app.company_name}
                        </button>
                      </td>
                      <td className="px-6 py-4">{app.job_title}</td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(app.applied_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold capitalize text-sand">
                        {app.llm_provider || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.bg}`}>
                          <Icon size={12} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="text-mutedtext hover:text-cream transition-colors p-1"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app._id, app.company_id, e.target.value)}
                            className="rounded-card border border-cardborder bg-darkbg text-xs text-cream px-2.5 py-1 focus:border-terracotta focus:outline-none transition-colors"
                          >
                            <option value="applied">Applied</option>
                            <option value="viewed">Viewed</option>
                            <option value="replied">Replied</option>
                            <option value="interview">Interviewing</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          
                          <button
                            onClick={() => setDeletingId(app._id)}
                            className="text-mutedtext hover:text-red-500 transition-colors p-1"
                            title="Delete record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-cardborder/40">
            {applications.map(app => {
              const badge = statusBadges[app.status] || statusBadges.applied;
              const Icon = badge.icon;
              return (
                <div key={app._id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-cream text-base">
                        <button 
                          onClick={() => setSelectedApp(app)} 
                          className="hover:underline text-left font-bold text-cream focus:outline-none transition-all hover:text-terracotta"
                        >
                          {app.company_name}
                        </button>
                      </h3>
                      <p className="text-sm text-mutedtext">{app.job_title}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.bg}`}>
                      <Icon size={12} />
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-mutedtext">
                    <div>
                      Applied: <span className="text-cream">{new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      Model: <span className="text-sand capitalize">{app.llm_provider || "N/A"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-cardborder/20">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="flex items-center gap-1 text-xs text-mutedtext hover:text-cream transition-colors border border-cardborder px-3 py-1.5 rounded-card bg-darkbg"
                    >
                      <Eye size={14} /> View Details
                    </button>

                    <div className="flex items-center gap-2">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app._id, app.company_id, e.target.value)}
                        className="rounded-card border border-cardborder bg-darkbg text-xs text-cream px-3 py-1.5 focus:border-terracotta focus:outline-none transition-colors"
                      >
                        <option value="applied">Applied</option>
                        <option value="viewed">Viewed</option>
                        <option value="replied">Replied</option>
                        <option value="interview">Interviewing</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      <button
                        onClick={() => setDeletingId(app._id)}
                        className="flex items-center gap-1 text-xs text-mutedtext hover:text-red-500 transition-colors border border-cardborder p-1.5 rounded-card bg-darkbg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApp && (
        <ApplicationDetailsModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={(newStatus) => handleStatusChange(selectedApp._id, selectedApp.company_id, newStatus)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-darkbg/85 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-card border border-terracotta bg-cardbg p-6 shadow-[var(--shadow-glow)] text-center" style={{ animation: "var(--animate-slide-in)" }}>
            <h2 className="text-xl font-bold text-cream mb-2">Delete Record?</h2>
            <p className="text-sm text-mutedtext mb-6">
              This will permanently delete this application history record. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 rounded-card border border-cardborder px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:border-terracotta hover:text-cream btn-ripple"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 rounded-card bg-terracotta px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-darkbg transition-colors hover:bg-opacity-90 btn-ripple"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

interface ApplicationDetailsModalProps {
  app: Application;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}

function ApplicationDetailsModal({ app, onClose, onStatusChange }: ApplicationDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"email" | "cover">("email");

  // Determine score color
  const getScoreColor = (score?: number) => {
    if (!score) return "text-mutedtext border-cardborder bg-white/5";
    if (score >= 8.5) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
    if (score >= 7.0) return "text-amber-400 border-amber-500/30 bg-amber-500/5";
    return "text-rose-400 border-rose-500/30 bg-rose-500/5";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-darkbg/90 p-4 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl rounded-column border border-cardborder bg-cardbg/95 shadow-2xl flex flex-col my-8 max-h-[85vh]"
        style={{ animation: "var(--animate-slide-in)" }}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-cardborder/40 p-6">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-extrabold text-cream leading-tight">{app.company_name}</h2>
              {app.score && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${getScoreColor(app.score)}`}>
                  <Sparkles size={12} /> Match Score: {app.score}/10
                </span>
              )}
            </div>
            <p className="text-base text-mutedtext flex flex-wrap items-center gap-2">
              <span className="font-semibold text-cream">{app.job_title}</span>
              {app.website && (
                <a 
                  href={app.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1 text-xs text-terracotta hover:underline"
                >
                  <ExternalLink size={12} /> Website
                </a>
              )}
              {app.apply_url && (
                <a 
                  href={app.apply_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1 text-xs text-terracotta hover:underline"
                >
                  <ExternalLink size={12} /> Apply Link
                </a>
              )}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-full p-1.5 text-mutedtext hover:bg-white/5 hover:text-cream transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Meta & Timeline */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Quick Info Card */}
            <div className="rounded-card border border-cardborder/40 bg-darkbg/40 p-4 space-y-3.5 text-xs text-mutedtext">
              <div className="flex justify-between items-center pb-2 border-b border-cardborder/20">
                <span className="font-semibold uppercase tracking-wider text-mutedtext/70">Application Details</span>
                <span className="font-semibold text-sand flex items-center gap-1">
                  <Cpu size={12} /> {app.llm_provider || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Applied On:</span>
                <span className="text-cream font-medium flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(app.applied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {app.hr_email && (
                <div className="flex justify-between">
                  <span>Recipient:</span>
                  <span className="text-cream font-medium truncate max-w-[150px]">{app.hr_email}</span>
                </div>
              )}
              <div className="flex flex-col gap-1.5 pt-2">
                <span className="font-semibold uppercase tracking-wider text-mutedtext/70">Change Pipeline Status</span>
                <select
                  value={app.status}
                  onChange={(e) => onStatusChange(e.target.value)}
                  className="w-full rounded-card border border-cardborder bg-darkbg text-xs text-cream px-3 py-2 focus:border-terracotta focus:outline-none transition-colors"
                >
                  <option value="applied">Applied</option>
                  <option value="viewed">Viewed</option>
                  <option value="replied">Replied</option>
                  <option value="interview">Interviewing</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Match Fit Explanation */}
            {app.fit_explanation && (
              <div className="rounded-card border border-cardborder/40 bg-cardbg p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-cream flex items-center gap-1.5">
                  <Sparkles size={14} className="text-terracotta" /> Why You Fit
                </h4>
                <p className="text-xs text-mutedtext leading-relaxed">
                  {app.fit_explanation}
                </p>
              </div>
            )}

            {/* Error Message if Send Failed */}
            {app.status === "failed" && app.message && (
              <div className="rounded-card border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-red-400 flex items-center gap-1.5">
                  <AlertCircle size={14} /> Send Failure Details
                </h4>
                <p className="text-xs text-red-200/80 font-mono break-words">
                  {app.message}
                </p>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider font-bold text-cream">Activity History</h4>
              <div className="relative border-l border-cardborder/40 pl-4 ml-2 space-y-4">
                {(app.status_history || []).map((h, i) => {
                  const badge = statusBadges[h.status as keyof typeof statusBadges] || statusBadges.applied;
                  const Icon = badge.icon;
                  return (
                    <div key={i} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[23px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-cardborder bg-darkbg text-[8px] p-0.5 ${badge.bg}`}>
                        <Icon size={8} />
                      </span>
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-cream">
                          <span className="capitalize">{h.status}</span>
                          <span className="text-[10px] text-mutedtext font-normal uppercase tracking-wider">
                            via {h.source === "auto_resend" ? "resend tracking" : h.source}
                          </span>
                        </div>
                        <p className="text-[10px] text-mutedtext mt-0.5">
                          {new Date(h.timestamp).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(!app.status_history || app.status_history.length === 0) && (
                  <div className="text-xs text-mutedtext italic pl-2">
                    No historic events recorded.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Panel: Content tabs */}
          <div className="lg:col-span-2 flex flex-col h-[50vh] lg:h-auto min-h-[350px]">
            
            {/* Tabs Selector */}
            <div className="flex border-b border-cardborder/40 mb-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab("email")}
                className={`px-4 py-2 text-xs uppercase tracking-wider font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === "email"
                    ? "border-terracotta text-cream bg-white/5"
                    : "border-transparent text-mutedtext hover:text-cream"
                }`}
              >
                <Mail size={14} /> Email Message
              </button>
              <button
                onClick={() => setActiveTab("cover")}
                className={`px-4 py-2 text-xs uppercase tracking-wider font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === "cover"
                    ? "border-terracotta text-cream bg-white/5"
                    : "border-transparent text-mutedtext hover:text-cream"
                }`}
              >
                <FileText size={14} /> Cover Letter
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 rounded-card border border-cardborder/40 bg-darkbg/60 p-4 overflow-y-auto text-xs text-mutedtext font-mono leading-relaxed select-text whitespace-pre-wrap">
              {activeTab === "email" && (
                <div className="space-y-4">
                  {app.subject && (
                    <div className="pb-3 border-b border-cardborder/20">
                      <span className="text-[10px] uppercase font-bold text-mutedtext/70 block mb-1">Subject:</span>
                      <span className="text-cream font-bold text-sm">{app.subject}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-mutedtext/70 block mb-2">Message Body:</span>
                    <div className="font-sans text-cream text-sm leading-relaxed">{app.email_body || "No email body archived."}</div>
                  </div>
                </div>
              )}

              {activeTab === "cover" && (
                <div className="font-sans text-cream text-sm leading-relaxed whitespace-pre-line">
                  {app.cover_letter || "No tailored cover letter was generated/archived for this application."}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
