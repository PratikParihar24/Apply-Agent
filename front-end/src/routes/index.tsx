import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAnalytics } from "../api/client";
import StatCard from "../components/StatCard";
import { 
  Mail, 
  CheckCircle, 
  Percent, 
  Calendar, 
  Eye, 
  AlertCircle, 
  XOctagon, 
  TrendingUp, 
  Sparkles,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agent Apply — Where your story meets its stage" },
      { name: "description", content: "A design-forward, human-centred career board for creative opportunities." },
      { property: "og:title", content: "Agent Apply" },
      { property: "og:description", content: "Finding creative opportunities, humanised." },
    ],
  }),
  component: Home,
});

const features = [
  { title: "Smart Matching", desc: "We surface roles that fit your story, not just your keywords." },
  { title: "Live Dashboard", desc: "Watch your hunt unfold in three columns — searching, generating, ready." },
  { title: "Human‑Centred", desc: "Every application is tailored, editable, and unmistakably yours." },
];

interface AnalyticsData {
  total_applications: number;
  by_status: {
    applied: number;
    viewed: number;
    replied: number;
    interview: number;
    rejected: number;
    failed: number;
  };
  reply_rate: number;
  interview_rate: number;
  most_recent_application: string | null;
  applications_this_month: number;
  top_roles: string[];
  llm_usage: Record<string, number>;
}

const statusConfig = {
  applied: { bg: "bg-mutedtext/30", text: "text-mutedtext", label: "Applied" },
  viewed: { bg: "bg-blue-500", text: "text-blue-400", label: "Viewed" },
  replied: { bg: "bg-amber-500", text: "text-amber-400", label: "Replied" },
  interview: { bg: "bg-emerald-500", text: "text-emerald-400", label: "Interview" },
  rejected: { bg: "bg-rose-500", text: "text-rose-400", label: "Rejected" },
  failed: { bg: "bg-red-500", text: "text-red-500", label: "Failed" }
};

function Home() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (e: any) {
      toast.error(`Failed to load analytics: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  if (user) {
    const activePipeline = analytics 
      ? analytics.total_applications - (analytics.by_status.rejected + analytics.by_status.failed)
      : 0;

    const cloudPercentage = analytics && analytics.total_applications > 0
      ? Math.round(
          ((analytics.llm_usage.gemini || 0) + 
           (analytics.llm_usage.groq || 0) + 
           (analytics.llm_usage.openrouter || 0)) / 
          analytics.total_applications * 100
        )
      : 0;

    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-cream">Dashboard</h1>
            <p className="mt-1 text-sm text-mutedtext">
              Welcome back, <span className="text-cream font-semibold">{user.name || user.email}</span>. Here is your application health at a glance.
            </p>
          </div>
          
          <button 
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 rounded-card border border-cardborder bg-cardbg px-4 py-2 text-xs font-bold uppercase tracking-wider text-cream hover:bg-cardbg-hover transition-colors btn-ripple"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Sync Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard 
            label="Applications Sent" 
            value={analytics?.total_applications ?? 0} 
            subtext={`${analytics?.applications_this_month ?? 0} in the last 30 days`}
            icon={Mail}
            iconColorClass="text-blue-400"
            loading={loading}
          />
          <StatCard 
            label="Reply Rate" 
            value={analytics ? `${Math.round(analytics.reply_rate * 100)}%` : "0%"} 
            subtext={`${(analytics?.by_status.replied ?? 0) + (analytics?.by_status.interview ?? 0) + (analytics?.by_status.rejected ?? 0)} companies replied`}
            icon={Percent}
            iconColorClass="text-amber-400"
            loading={loading}
          />
          <StatCard 
            label="Interview Rate" 
            value={analytics ? `${Math.round(analytics.interview_rate * 100)}%` : "0%"} 
            subtext={`${analytics?.by_status.interview ?? 0} interviewing processes`}
            icon={CheckCircle}
            iconColorClass="text-emerald-400"
            loading={loading}
          />
          <StatCard 
            label="Active Pipeline" 
            value={activePipeline} 
            subtext={`${analytics?.by_status.applied ?? 0} awaiting first response`}
            icon={TrendingUp}
            iconColorClass="text-terracotta"
            loading={loading}
          />
        </div>

        {/* Breakdown and Details section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Status Breakdown Bar */}
          <div className="lg:col-span-2 rounded-column border border-cardborder bg-cardbg/40 p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-cream mb-4">Pipeline Distribution</h3>
              
              {loading ? (
                <div className="space-y-4">
                  <div className="h-6 bg-white/10 rounded-full w-full" />
                  <div className="grid grid-cols-5 gap-2">
                    <div className="h-3 bg-white/10 rounded" />
                    <div className="h-3 bg-white/10 rounded" />
                    <div className="h-3 bg-white/10 rounded" />
                  </div>
                </div>
              ) : analytics && analytics.total_applications > 0 ? (
                <div className="space-y-8">
                  {/* Progress Bar */}
                  <div className="h-6 w-full flex overflow-hidden rounded-full bg-darkbg border border-cardborder/40">
                    {Object.entries(statusConfig).map(([statusKey, config]) => {
                      const count = analytics.by_status[statusKey as keyof typeof analytics.by_status] || 0;
                      const percentage = (count / analytics.total_applications) * 100;
                      if (count === 0) return null;
                      return (
                        <div 
                          key={statusKey}
                          style={{ width: `${percentage}%` }}
                          className={`${config.bg} h-full transition-all duration-500`}
                          title={`${config.label}: ${count} (${Math.round(percentage)}%)`}
                        />
                      );
                    })}
                  </div>

                  {/* Legends */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(statusConfig).map(([statusKey, config]) => {
                      const count = analytics.by_status[statusKey as keyof typeof analytics.by_status] || 0;
                      const percentage = analytics.total_applications > 0 ? Math.round((count / analytics.total_applications) * 100) : 0;
                      return (
                        <div key={statusKey} className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${config.bg}`} />
                          <div className="text-xs">
                            <span className="text-cream font-bold block">{config.label}</span>
                            <span className="text-mutedtext">{count} ({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-mutedtext italic">
                  No pipeline stats to display yet.
                </div>
              )}
            </div>
            
            {analytics && analytics.total_applications > 0 && (
              <div className="mt-8 pt-4 border-t border-cardborder/20 flex items-center gap-2 text-xs text-mutedtext">
                <Sparkles size={14} className="text-terracotta" />
                <span><strong>{cloudPercentage}%</strong> of your applications were tailormade using cloud AI models.</span>
              </div>
            )}
          </div>

          {/* Right sidebar: LLM Usage & Top Roles */}
          <div className="rounded-column border border-cardborder bg-cardbg/40 p-6 backdrop-blur-sm shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-cream mb-4">Top Targets</h3>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse" />
                </div>
              ) : analytics && analytics.top_roles.length > 0 ? (
                <ul className="space-y-2.5">
                  {analytics.top_roles.map((role, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-mutedtext bg-darkbg/40 border border-cardborder/20 px-3 py-2 rounded-card">
                      <span className="font-bold text-terracotta">#{idx + 1}</span>
                      <span className="text-cream font-medium truncate">{role}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-mutedtext italic">No targets recorded yet.</div>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-cream mb-4">Model Distribution</h3>
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-full" />
                </div>
              ) : analytics && Object.keys(analytics.llm_usage).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(analytics.llm_usage).map(([model, count]) => {
                    const percentage = analytics.total_applications > 0 ? Math.round((count / analytics.total_applications) * 100) : 0;
                    return (
                      <div key={model} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold capitalize text-cream">
                          <span>{model}</span>
                          <span>{count} ({percentage}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-darkbg rounded-full overflow-hidden">
                          <div style={{ width: `${percentage}%` }} className="h-full bg-sand rounded-full" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-mutedtext italic">No LLM metrics logged.</div>
              )}
            </div>

          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6">
      <section className="flex flex-col items-center pt-24 pb-16 text-center">
        <span className="mb-6 rounded-full border border-cardborder bg-cardbg px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-sand">
          Terracotta Twilight · v1
        </span>
        <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight text-cream sm:text-6xl md:text-7xl">
          FINDING CREATIVE<br />
          OPPORTUNITIES,<br />
          <span className="text-terracotta">HUMANISED</span>
        </h1>
        <p className="mt-8 max-w-2xl text-sm uppercase tracking-[0.25em] text-mutedtext">
          Where your story meets its stage <span className="mx-2 text-terracotta">|</span> A design‑forward career board
        </p>
        <Link
          to="/hunt"
          className="mt-12 inline-flex items-center gap-2 rounded-card bg-terracotta px-8 py-4 text-sm font-bold uppercase tracking-wider text-darkbg shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02] hover:shadow-[var(--shadow-glow-strong)]"
        >
          Start Your Hunt →
        </Link>
      </section>

      <section className="grid gap-6 pb-24 md:grid-cols-3">
        {features.map((f) => (
          <article
            key={f.title}
            className="rounded-card border border-cardborder bg-cardbg p-6 transition-all hover:-translate-y-1 hover:bg-cardbg-hover hover:shadow-[var(--shadow-glow)]"
          >
            <div className="mb-4 h-1 w-10 rounded-full bg-terracotta" />
            <h3 className="text-lg font-bold text-cream">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mutedtext">{f.desc}</p>
          </article>
        ))}
      </section>

      <footer className="border-t border-cardborder py-8 text-center text-xs uppercase tracking-[0.2em] text-mutedtext">
        © {new Date().getFullYear()} Agent Apply · Made with warmth
      </footer>
    </main>
  );
}

export default Home;
