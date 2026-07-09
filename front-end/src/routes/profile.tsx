import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import { getActiveResume } from "../api/client";
import { FileText, Calendar, Sparkles, Layers, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Agent Apply" },
      { name: "description", content: "Manage your profile and parsed resume." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}

interface ActiveResume {
  id: string;
  filename: string;
  summary: string;
  sections_found: string[];
  chunks_count: number;
  uploaded_at: string;
}

function Profile() {
  const { user, updateUserPreferences } = useAuth();
  const [activeResume, setActiveResume] = useState<ActiveResume | null>(null);
  const [resumeLoading, setResumeLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [role, setRole] = useState(() => {
    const isClient = typeof window !== "undefined";
    return user?.preferences?.role || (isClient ? localStorage.getItem('profileRole') || "" : "");
  });
  const [location, setLocation] = useState(() => {
    const isClient = typeof window !== "undefined";
    return user?.preferences?.location || (isClient ? localStorage.getItem('profileLocation') || "" : "");
  });

  const fetchResume = async () => {
    setResumeLoading(true);
    try {
      const data = await getActiveResume();
      setActiveResume(data);
    } catch (err: any) {
      // It might 404 if no resume uploaded yet, which is fine
      console.log("No active resume found:", err.message || err);
      setActiveResume(null);
    } finally {
      setResumeLoading(false);
    }
  };

  useEffect(() => {
    if (user?.preferences) {
      setRole(user.preferences.role || "");
      setLocation(user.preferences.location || "");
    }
  }, [user]);

  useEffect(() => {
    fetchResume();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserPreferences(role, location);
      localStorage.setItem('profileRole', role);
      localStorage.setItem('profileLocation', location);
      toast.success("Preferences saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const field = "w-full rounded-card border border-cardborder bg-darkbg px-4 py-3 text-sm text-cream placeholder:text-mutedtext focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40 transition-colors";

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-extrabold text-cream">Your Profile</h1>
      <p className="mt-2 text-sm text-mutedtext">A few details so your job hunt feels like yours.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        
        {/* Left Column: Profile Preferences Form */}
        <form onSubmit={onSubmit} className="space-y-5 rounded-column border border-cardborder bg-cardbg p-6 h-fit shadow-lg">
          <h2 className="text-lg font-bold text-cream border-b border-cardborder/40 pb-2 flex items-center gap-2">
            Target Hunt Settings
          </h2>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-mutedtext">Name</label>
            <input className={`${field} opacity-70`} value={user?.name || ""} readOnly disabled />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-mutedtext">Email Address</label>
            <input className={`${field} opacity-70`} value={user?.email || ""} readOnly disabled />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-mutedtext">Default Role</label>
            <input
              type="text"
              className={field}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-mutedtext">Default Location</label>
            <input
              type="text"
              className={field}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Remote"
            />
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-card bg-terracotta px-4 py-3 text-sm font-bold uppercase tracking-wider text-darkbg transition-transform hover:scale-[1.01] hover:shadow-[var(--shadow-glow)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed btn-ripple"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Defaults"
            )}
          </button>
        </form>

        {/* Right Column: Parsed Active Resume Detail */}
        <div className="rounded-column border border-cardborder bg-cardbg p-6 h-fit shadow-lg flex flex-col space-y-5">
          <div className="flex justify-between items-center border-b border-cardborder/40 pb-2">
            <h2 className="text-lg font-bold text-cream flex items-center gap-2">
              Parsed Resume Insights
            </h2>
            <button 
              onClick={fetchResume}
              disabled={resumeLoading}
              className="text-mutedtext hover:text-cream transition-colors p-1"
              title="Refresh resume details"
            >
              <RefreshCw size={16} className={resumeLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {resumeLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw size={24} className="text-terracotta animate-spin" />
              <p className="text-xs text-mutedtext">Retrieving resume summary and skills...</p>
            </div>
          ) : activeResume ? (
            <div className="space-y-4">
              
              {/* Document Header Info */}
              <div className="rounded-card border border-cardborder/40 bg-darkbg/40 p-4 space-y-3 text-xs text-mutedtext">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-cream text-sm flex items-center gap-1.5 truncate max-w-[200px]">
                    <FileText size={16} className="text-terracotta" /> {activeResume.filename}
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Active
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Uploaded On:</span>
                  <span className="text-cream font-medium flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(activeResume.uploaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Vector Database Chunks:</span>
                  <span className="text-cream font-medium flex items-center gap-1">
                    <Layers size={12} />
                    {activeResume.chunks_count} chunks
                  </span>
                </div>
              </div>

              {/* Parsed Summary Preview */}
              {activeResume.summary && (
                <div className="space-y-1.5">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-cream flex items-center gap-1">
                    <Sparkles size={14} className="text-terracotta" /> AI Profile Summary
                  </h3>
                  <div className="rounded-card border border-cardborder/30 bg-darkbg/25 p-3.5 text-xs text-mutedtext leading-relaxed font-sans select-text">
                    {activeResume.summary}
                  </div>
                </div>
              )}

              {/* Detected Sections / Skills */}
              {activeResume.sections_found && activeResume.sections_found.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-cream">Parsed Sections</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {activeResume.sections_found.map((section, idx) => (
                      <span key={idx} className="bg-white/5 border border-cardborder/40 text-cream px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="rounded-card border border-dashed border-cardborder/60 p-8 text-center bg-darkbg/20">
              <FileText size={32} className="mx-auto text-mutedtext mb-3 opacity-30" />
              <h3 className="text-sm font-bold text-cream mb-1">No Active Resume</h3>
              <p className="text-xs text-mutedtext max-w-xs mx-auto">
                Upload your resume in the <strong>Hunt</strong> tab. The AI will chunk and parse it for matching roles.
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
