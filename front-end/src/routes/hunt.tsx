import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  getStatus,
  uploadResume,
  startHunt,
  generateForCompany,
  sendApplication,
} from "../api/client";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";

export const Route = createFileRoute("/hunt")({
  head: () => ({
    meta: [
      { title: "My Hunt — Agent Apply" },
      { name: "description", content: "Live 3-column dashboard of your job hunt." },
    ],
  }),
  component: HuntPageWrapper,
});

function HuntPageWrapper() {
  return (
    <ProtectedRoute>
      <HuntPage />
    </ProtectedRoute>
  );
}

function ShimmerCard({ index }: { index: number }) {
  return (
    <div
      style={{ animation: "var(--animate-slide-in)", animationDelay: `${index * 150}ms` }}
      className="rounded-card border border-cardborder bg-cardbg p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="shimmer-bg h-4 w-1/2 rounded" />
        <div className="shimmer-bg h-4 w-1/4 rounded" />
      </div>
      <div className="shimmer-bg h-3 w-full rounded" />
      <div className="shimmer-bg h-3 w-5/6 rounded" />
      <div className="flex gap-2 pt-2">
        <div className="shimmer-bg h-8 flex-1 rounded" />
        <div className="shimmer-bg h-8 w-12 rounded" />
      </div>
    </div>
  );
}


type Status = "searching" | "generating" | "ready" | "sending" | "sent";

interface Company {
  id: number | string;
  name: string;
  job_title?: string;
  role?: string; // Fallback for UI mapping
  description?: string;
  desc?: string; // Fallback for UI mapping
  score: number;
  website?: string | null;
  hr_email?: string | null;
  apply_url?: string;
  source?: string;
}

interface Card extends Company {
  status: Status;
  coverLetter: string;
  emailBody: string;
  resume: string;
  subject?: string;
  sentAt?: string;
}

interface HuntBrief {
  resumeName: string;
  targetRole: string;
  seniority: string;
  location: string;
  workMode: "Remote" | "Hybrid" | "Onsite" | "Any";
  salaryMin: string;
  keywords: string;
  notes: string;
}

const emptyBrief: HuntBrief = {
  resumeName: "",
  targetRole: "",
  seniority: "Senior",
  location: "",
  workMode: "Remote",
  salaryMin: "",
  keywords: "",
  notes: "",
};

function HuntPage() {
  const { user } = useAuth();
  const [brief, setBrief] = useState<HuntBrief>(() => {
    const isClient = typeof window !== "undefined";
    return {
      ...emptyBrief,
      targetRole: isClient ? localStorage.getItem('agentapply_hunt_role') || "" : "",
      location: isClient ? localStorage.getItem('agentapply_hunt_location') || "" : "",
    };
  });

  useEffect(() => {
    if (user?.preferences) {
      setBrief((prev) => ({
        ...prev,
        targetRole: prev.targetRole || user.preferences?.role || "",
        location: prev.location || user.preferences?.location || "",
      }));
    }
  }, [user]);

  const [started, setStarted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem('agentapply_hunt_started') === 'true';
  });
  const [cards, setCards] = useState<Card[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem('agentapply_hunt_state');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });
  const [popupCardId, setPopupCardId] = useState<string | number | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    localStorage.setItem('agentapply_hunt_state', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem('agentapply_hunt_role', brief.targetRole);
    localStorage.setItem('agentapply_hunt_location', brief.location);
  }, [brief.targetRole, brief.location]);

  useEffect(() => {
    localStorage.setItem('agentapply_hunt_started', String(started));
  }, [started]);

  useEffect(() => {
    if (started) {
      getStatus()
        .then((res) => {
          if (!res.resume_ready) {
            setStarted(false);
            toast.error("Resume not ready, please complete setup.");
          }
        })
        .catch((e) => {
          toast.error(`Status check failed: ${e.message}`);
        });
    }
  }, [started]);

  const updateCard = (id: number | string, patch: Partial<Card>) =>
    setCards((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, ...patch } : c)));

  const handleOpenPopup = (id: number | string) => {
    setPopupCardId(id);
  };

  const handleGenerate = async (id: number | string) => {
    setPopupCardId(null);
    updateCard(id, { status: "generating" });
    try {
      const result = await generateForCompany(String(id));
      updateCard(id, {
        status: "ready",
        coverLetter: result.cover_letter || "",
        emailBody: result.email_body || "",
        resume: result.tailored_resume || "",
        subject: result.subject || "",
      });
    } catch (error) {
      const e = error as Error;
      toast.error(`Generation failed: ${e.message}`);
      updateCard(id, { status: "searching" }); // revert on error
    }
  };

  const handleSkip = (id: number | string) => setCards((prev) => prev.filter((c) => String(c.id) !== String(id)));

  const handleSend = async (id: number | string) => {
    const c = cards.find((x) => String(x.id) === String(id));
    if (!c) return;

    updateCard(id, { status: "sending" });
    try {
      const payload = {
        cover_letter: c.coverLetter,
        email_body: c.emailBody,
        subject: c.subject || "Application",
        tailored_resume: c.resume,
        recipient_email: "test@example.com", // Provide a placeholder or prompt the user if needed
      };
      const res = await sendApplication(String(id), payload);
      if (res.success) {
        updateCard(id, { status: "sent", sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        toast.success(`Application sent to ${c.name}!`);
      } else {
        throw new Error(res.status || "Unknown error");
      }
    } catch (error) {
      const e = error as Error;
      toast.error(`Failed to send — check your email config: ${e.message}`);
      updateCard(id, { status: "ready" }); // revert on error
    }
  };

  const handleReset = () => {
    localStorage.removeItem('agentapply_hunt_state');
    localStorage.removeItem('agentapply_hunt_role');
    localStorage.removeItem('agentapply_hunt_location');
    localStorage.removeItem('agentapply_hunt_started');
    indexRef.current = 0;
    setCards([]);
    setStarted(false);
    setBrief(emptyBrief);
    setShowResetModal(false);
  };

  const handleStart = async () => {
    try {
      const res = await startHunt(brief.targetRole, brief.location || "Remote", 10, (c) => {
        setCards((prev) => {
          if (prev.some((existing) => String(existing.id) === String(c.id))) return prev;
          return [
            ...prev,
            {
              ...c,
              status: "searching",
              coverLetter: "",
              emailBody: "",
              resume: "",
              role: c.job_title || c.role || "",
              desc: c.description || c.desc || "",
            },
          ];
        });
      });
      
      // Page navigates/transitions to hunt dashboard immediately after getting job_id
      setStarted(true);
      toast.success(`Hunt started! Job ID: ${res.job_id}`);
    } catch (error) {
      const e = error as Error;
      toast.error(`Hunt failed to start: ${e.message}`);
      setStarted(false);
    }
  };

  if (!started) {
    return <SetupForm brief={brief} setBrief={setBrief} onStart={handleStart} onCancel={cards.length > 0 ? () => setStarted(true) : undefined} />;
  }

  const searching = cards
    .filter((c) => c.status === "searching")
    .sort((a, b) => b.score - a.score);
  const generating = cards.filter((c) => c.status === "generating");
  const ready = cards.filter((c) => c.status === "ready" || c.status === "sending");
  const sent = cards.filter((c) => c.status === "sent");

  const popupCard = popupCardId ? cards.find(c => String(c.id) === String(popupCardId)) : null;

  return (
    <>
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 relative">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold text-cream">My Hunt</h1>
          <p className="mt-1 text-sm text-mutedtext">
            Agents are hunting for{" "}
            <span className="text-cream">{brief.targetRole || "your role"}</span>
            {brief.location && (
              <>
                {" "}
                in <span className="text-cream">{brief.location}</span>
              </>
            )}{" "}
            · <span className="text-sand">{brief.workMode}</span>
          </p>
        </div>
        <div className="flex gap-3">
          {started && (
            <button
              onClick={() => setShowResetModal(true)}
              className="rounded-card border border-cardborder px-3 py-2 text-xs font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:text-terracotta hover:border-terracotta btn-ripple"
            >
              New Hunt
            </button>
          )}
          <button
            onClick={() => setStarted(false)}
            className="rounded-card border border-cardborder px-3 py-2 text-xs font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:text-cream btn-ripple"
          >
            Edit Brief
          </button>
        </div>
      </div>

      <BriefChips brief={brief} />

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-4">
        <Column title="Searching" count={searching.length} accent="terracotta">
          {searching.map((c, index) => (
            <JobCard key={c.id} card={c} onReview={handleOpenPopup} onSkip={handleSkip} index={index} />
          ))}
          {started && cards.length === 0 && (
            <>
              <ShimmerCard index={0} />
              <ShimmerCard index={1} />
              <ShimmerCard index={2} />
            </>
          )}
          {searching.length === 0 && (!started || cards.length > 0) && <EmptyHint text="Scouting roles for you…" />}
        </Column>

        <Column title="Generating" count={generating.length} accent="sand">
          {generating.map((c, index) => (
            <GeneratingCard key={c.id} card={c} index={index} />
          ))}
          {generating.length === 0 && <EmptyHint text="Drafts will appear here." />}
        </Column>

        <Column title="Ready to Send" count={ready.length} accent="sage">
          {ready.map((c, index) => (
            <ReadyCard key={c.id} card={c} onSend={handleSend} onUpdate={updateCard} onSkip={handleSkip} onOpenPopup={handleOpenPopup} index={index} />
          ))}
          {ready.length === 0 && <EmptyHint text="Reviewed applications land here." />}
        </Column>

        <Column title="Sent" count={sent.length} accent="sage">
          {sent.map((c, index) => (
            <SentCard key={c.id} card={c} index={index} />
          ))}
          {sent.length === 0 && <EmptyHint text="Sent applications land here." />}
        </Column>
      </div>
    </main>
    {popupCard && (
      <CompanyDetailPopup 
        card={popupCard as Card} 
        onClose={() => setPopupCardId(null)} 
        onGenerate={() => handleGenerate(popupCard.id)} 
        onSkip={() => { setPopupCardId(null); handleSkip(popupCard.id); }} 
      />
    )}
    {showResetModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-darkbg/80 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-sm rounded-card border border-terracotta bg-cardbg p-6 shadow-[var(--shadow-glow)] text-center" style={{ animation: "var(--animate-slide-in)" }}>
          <h2 className="text-xl font-bold text-cream mb-2">Start a New Hunt?</h2>
          <p className="text-sm text-mutedtext mb-6">
            This will clear your current search and all generated drafts. Do you want to continue?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowResetModal(false)}
              className="flex-1 rounded-card border border-cardborder px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:border-terracotta hover:text-cream btn-ripple"
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              className="flex-1 rounded-card bg-terracotta px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-darkbg transition-colors hover:bg-opacity-90 btn-ripple"
            >
              Yes, Clear It
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function SetupForm({
  brief,
  setBrief,
  onStart,
  onCancel,
}: {
  brief: HuntBrief;
  setBrief: (b: HuntBrief) => void;
  onStart: () => void;
  onCancel?: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof HuntBrief>(k: K, v: HuntBrief[K]) => setBrief({ ...brief, [k]: v });

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Resume must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      await uploadResume(f);
      set("resumeName", f.name);
      toast.success(`Resume uploaded: ${f.name}`);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const canStart = brief.resumeName && brief.targetRole.trim() && !uploading;

  const submit = async () => {
    if (!canStart) {
      toast.error("Upload a resume and add a target role to start");
      return;
    }
    onStart();
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <span className="rounded-full border border-cardborder bg-cardbg px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-sand">
          Step 1 · Brief
        </span>
        <h1 className="mt-4 text-3xl font-extrabold text-cream sm:text-4xl">
          Tell the agents what you're hunting for.
        </h1>
        <p className="mt-2 text-sm text-mutedtext">
          The more honest the brief, the warmer the match. Nothing here leaves your browser.
        </p>
      </div>

      <div className="space-y-5 rounded-column border border-cardborder bg-cardbg p-6">
        {/* Resume upload */}
        <div>
          <Label>Resume</Label>
          <label className="group flex cursor-pointer items-center justify-between gap-3 rounded-card border border-dashed border-cardborder bg-darkbg px-4 py-5 transition-colors hover:border-terracotta hover:bg-cardbg-hover">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-cream">
                {brief.resumeName || "Upload your resume"}
              </p>
              <p className="mt-0.5 text-xs text-mutedtext">PDF, DOC, or DOCX · up to 5MB</p>
            </div>
            <span className="shrink-0 rounded-card border border-terracotta px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-terracotta group-hover:bg-terracotta group-hover:text-darkbg">
              {uploading ? "Uploading..." : brief.resumeName ? "Replace" : "Choose file"}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={onFile}
              disabled={uploading}
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Target role</Label>
            <Input
              value={brief.targetRole}
              onChange={(v) => set("targetRole", v)}
              placeholder="Senior Product Designer"
            />
          </div>
          <div>
            <Label>Seniority</Label>
            <Select
              value={brief.seniority}
              onChange={(v) => set("seniority", v)}
              options={["Junior", "Mid", "Senior", "Staff", "Principal", "Director"]}
            />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={brief.location}
              onChange={(v) => set("location", v)}
              placeholder="Berlin, EU, or Remote"
            />
          </div>
          <div>
            <Label>Work mode</Label>
            <Select
              value={brief.workMode}
              onChange={(v) => set("workMode", v as HuntBrief["workMode"])}
              options={["Remote", "Hybrid", "Onsite", "Any"]}
            />
          </div>
          <div>
            <Label>Minimum salary (optional)</Label>
            <Input
              value={brief.salaryMin}
              onChange={(v) => set("salaryMin", v)}
              placeholder="€80,000"
            />
          </div>
          <div>
            <Label>Keywords / skills</Label>
            <Input
              value={brief.keywords}
              onChange={(v) => set("keywords", v)}
              placeholder="design systems, Figma, React"
            />
          </div>
        </div>

        <div>
          <Label>What makes a role a yes for you?</Label>
          <textarea
            rows={3}
            value={brief.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Small team, climate-positive, mentor I can learn from…"
            className="w-full resize-none rounded-card border border-cardborder bg-darkbg px-4 py-3 text-sm text-cream placeholder:text-mutedtext focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          />
        </div>

        <div className="flex gap-4">
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-1/3 rounded-card border border-cardborder px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-mutedtext transition-all hover:text-cream hover:border-terracotta btn-ripple"
            >
              Cancel
            </button>
          )}
          <button
            onClick={submit}
            disabled={!canStart}
            className={`${onCancel ? 'w-2/3' : 'w-full'} rounded-card bg-terracotta px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-darkbg transition-all hover:scale-[1.01] hover:shadow-[var(--shadow-glow-strong)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none btn-ripple`}
          >
            {onCancel ? 'Add to Hunt →' : 'Start the Hunt →'}
          </button>
        </div>
      </div>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-mutedtext">
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-card border border-cardborder bg-darkbg px-4 py-3 text-sm text-cream placeholder:text-mutedtext focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-card border border-cardborder bg-darkbg px-4 py-3 text-sm text-cream focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function BriefChips({ brief }: { brief: HuntBrief }) {
  const chips = [
    brief.resumeName && `📄 ${brief.resumeName}`,
    brief.seniority,
    brief.salaryMin && `min ${brief.salaryMin}`,
    brief.keywords,
  ].filter(Boolean) as string[];
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <span
          key={c}
          className="rounded-full border border-cardborder bg-cardbg px-3 py-1 text-xs text-mutedtext"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function Column({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent: "terracotta" | "sand" | "sage";
  children: React.ReactNode;
}) {
  const dot = { terracotta: "bg-terracotta", sand: "bg-sand", sage: "bg-sage" }[accent];
  return (
    <section className="rounded-column border border-cardborder bg-cardbg/40 p-4 backdrop-blur-sm">
      <header className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-cream">{title}</h2>
        </div>
        <span className="rounded-full border border-cardborder bg-darkbg px-2.5 py-0.5 text-xs font-semibold text-mutedtext">
          {count}
        </span>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-card border border-dashed border-cardborder p-6 text-center text-xs text-mutedtext">
      {text}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 85
      ? "text-sage bg-sage/10"
      : score >= 75
        ? "text-sand bg-sand/10"
        : "text-terracotta bg-terracotta/10";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {score}% match
    </span>
  );
}

function JobCard({
  card,
  onReview,
  onSkip,
  index,
}: {
  card: Card;
  onReview: (id: number | string) => void;
  onSkip: (id: number | string) => void;
  index: number;
}) {
  return (
    <article
      style={{ animation: "var(--animate-slide-in)", animationDelay: `${index * 100}ms` }}
      className="group rounded-card border border-cardborder bg-cardbg p-4 hover-card-trigger hover:bg-cardbg-hover"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-cream">{card.name}</h3>
          <p className="truncate text-xs text-mutedtext">{card.role}</p>
        </div>
        <ScoreBadge score={card.score} />
      </div>
      <p className="line-clamp-2 text-sm text-mutedtext">{card.desc}</p>
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onReview(card.id)}
          className="flex-1 rounded-card border border-terracotta px-3 py-2 text-xs font-bold uppercase tracking-wider text-terracotta transition-all hover:bg-terracotta hover:text-darkbg btn-ripple"
        >
          Review
        </button>
        <button
          onClick={() => onSkip(card.id)}
          className="rounded-card px-3 py-2 text-xs font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:text-cream btn-ripple"
        >
          Skip
        </button>
      </div>
    </article>
  );
}

function GeneratingCard({ card, index }: { card: Card; index: number }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / 5000) * 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(id);
    }, 80);
    return () => clearInterval(id);
  }, []);

  return (
    <article
      style={{ animation: "var(--animate-slide-in)", animationDelay: `${index * 100}ms` }}
      className="rounded-card border border-cardborder bg-cardbg p-4 hover-card-trigger hover:bg-cardbg-hover"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-cream">{card.name}</h3>
          <p className="truncate text-xs text-mutedtext">{card.role}</p>
        </div>
        <ScoreBadge score={card.score} />
      </div>
      <div className="shimmer-bg mb-2 h-3 w-3/4 rounded" />
      <div className="shimmer-bg mb-2 h-3 w-full rounded" />
      <div className="shimmer-bg mb-4 h-3 w-2/3 rounded" />
      <p className="mb-2 text-xs uppercase tracking-wider text-mutedtext">
        Generating your content…
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-darkbg">
        <div
          className="h-full rounded-full bg-terracotta transition-[width] duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </article>
  );
}

function ReadyCard({
  card,
  onSend,
  onUpdate,
  onSkip,
  onOpenPopup,
  index,
}: {
  card: Card;
  onSend: (id: number | string) => void;
  onUpdate: (id: number | string, patch: Partial<Card>) => void;
  onSkip: (id: number | string) => void;
  onOpenPopup: (id: number | string) => void;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const isSent = card.status === "sent";
  const isSending = card.status === "sending";

  return (
    <article
      style={{ 
        animation: isSent ? "var(--animate-scale-out)" : "var(--animate-slide-in)",
        animationDelay: isSent ? "0ms" : `${index * 100}ms`
      }}
      className="rounded-card border border-sage/70 bg-cardbg p-4 hover-card-trigger hover:bg-cardbg-hover"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-sage/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sage">
              Ready
            </span>
            <ScoreBadge score={card.score} />
            <button
              onClick={(e) => { e.stopPropagation(); onOpenPopup(card.id); }}
              className="p-1 rounded hover:bg-darkbg text-mutedtext hover:text-cream transition-colors"
              title="Review Company"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
          </div>
          <h3 className="truncate font-bold text-cream">{card.name}</h3>
          <p className="truncate text-xs text-mutedtext">{card.role}</p>
        </div>
        <span className="text-mutedtext">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-cardborder pt-4">
          <Field
            label="Cover Letter"
            value={card.coverLetter}
            editing={editing}
            onChange={(v) => onUpdate(card.id, { coverLetter: v })}
            rows={5}
          />
          <Field
            label="Email Body"
            value={card.emailBody}
            editing={editing}
            onChange={(v) => onUpdate(card.id, { emailBody: v })}
            rows={3}
          />

          <div className="rounded-card border border-cardborder">
            <button
              onClick={() => setShowResume((s) => !s)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-mutedtext"
            >
              Tailored Resume Preview
              <span>{showResume ? "−" : "+"}</span>
            </button>
            {showResume && (
              <pre className="whitespace-pre-wrap border-t border-cardborder px-3 py-3 text-xs text-cream/90">
                {card.resume}
              </pre>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing((e) => !e)}
              className="rounded-card border border-terracotta px-3 py-2 text-xs font-bold uppercase tracking-wider text-terracotta transition-colors hover:bg-terracotta hover:text-darkbg btn-ripple"
            >
              {editing ? "Done" : "Edit"}
            </button>
            <button
              onClick={() => onSkip(card.id)}
              className="rounded-card px-3 py-2 text-xs font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:text-cream btn-ripple"
            >
              Discard
            </button>
            <button
              onClick={() => onSend(card.id)}
              disabled={isSent || isSending}
              className="flex-1 rounded-card bg-terracotta px-3 py-2 text-xs font-bold uppercase tracking-wider text-darkbg transition-all hover:shadow-[var(--shadow-glow-strong)] disabled:opacity-50 btn-ripple"
            >
              {isSent ? "Sent ✓" : isSending ? "Sending..." : "Send"}
            </button>

          </div>
        </div>
      )}
    </article>
  );
}

function SentCard({ card, index }: { card: Card; index: number }) {
  return (
    <article
      style={{ animation: "var(--animate-slide-in)", animationDelay: `${index * 100}ms` }}
      className="rounded-card border border-sage/40 bg-cardbg p-4 opacity-80"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-cream">{card.name}</h3>
          <p className="truncate text-xs text-mutedtext">{card.role}</p>
        </div>
        <span className="rounded-full bg-sage/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sage">
          Sent ✓
        </span>
      </div>
      <p className="mt-3 text-xs text-mutedtext">Sent at {card.sentAt}</p>
    </article>
  );
}

function Field({
  label,
  value,
  editing,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-mutedtext">
        {label}
      </label>
      <textarea
        readOnly={!editing}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full resize-none rounded-card border bg-darkbg px-3 py-2 text-sm text-cream focus:outline-none ${
          editing ? "border-terracotta focus:ring-2 focus:ring-terracotta/40" : "border-cardborder"
        }`}
      />
    </div>
  );
}

function CompanyDetailPopup({
  card,
  onClose,
  onGenerate,
  onSkip,
}: {
  card: Card;
  onClose: () => void;
  onGenerate: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-darkbg/80 p-4 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-card border border-terracotta bg-cardbg p-6 shadow-[var(--shadow-glow)]"
        style={{ animation: "var(--animate-slide-in)" }}
      >
        <button 
          onClick={onClose}
          className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-mutedtext transition-colors hover:bg-cardbg-hover hover:text-cream"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div className="mt-8 mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-cream">{card.name}</h2>
            <p className="text-sm font-semibold text-terracotta mt-1">{card.role}</p>
          </div>
          <ScoreBadge score={card.score} />
        </div>

        <div className="mb-6 rounded-column bg-darkbg p-4 text-sm text-mutedtext leading-relaxed whitespace-pre-wrap">
          {card.desc || "No description provided."}
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-column border border-cardborder p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-sand">HR Contact</h4>
            {card.hr_email ? (
              <div className="flex items-center gap-2">
                <a href={`mailto:${card.hr_email}`} className="text-sm text-terracotta hover:underline font-semibold break-all">
                  {card.hr_email}
                </a>
                <button 
                  onClick={() => { navigator.clipboard.writeText(card.hr_email!); toast.success("Email copied!"); }}
                  className="p-1 rounded bg-darkbg text-mutedtext hover:text-cream transition-colors"
                  title="Copy email"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            ) : (
              <p className="text-sm text-mutedtext italic">Not found in search results</p>
            )}
          </div>
          <div className="rounded-column border border-cardborder p-4 flex flex-col gap-2">
            <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-sand">Ways to Apply</h4>
            {card.website && (
              <a href={card.website} target="_blank" rel="noreferrer" className="text-sm text-cream hover:text-terracotta transition-colors flex items-center gap-1 w-fit">
                Visit Company Website ↗
              </a>
            )}
            {(card.apply_url || (card as any).url) && (
              <a href={card.apply_url || (card as any).url} target="_blank" rel="noreferrer" className="text-sm text-mutedtext hover:text-cream transition-colors flex items-center gap-1 w-fit">
                View Job Posting ↗
              </a>
            )}
            {!card.website && !card.apply_url && !(card as any).url && (
              <p className="text-sm text-mutedtext">No source URL provided.</p>
            )}
          </div>
        </div>

        {!card.hr_email && (
          <p className="text-xs text-mutedtext text-center italic mb-4">
            No direct email found — you can still generate content and apply via the posting.
          </p>
        )}

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-cardborder">
          <button
            onClick={onSkip}
            className="rounded-card border border-cardborder px-4 py-2 text-sm font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:border-terracotta hover:text-terracotta btn-ripple"
          >
            Discard
          </button>
          {card.status !== "ready" && (
            <button
              onClick={onGenerate}
              className="rounded-card bg-terracotta px-6 py-2 text-sm font-bold uppercase tracking-wider text-darkbg transition-colors hover:bg-opacity-90 btn-ripple"
            >
              {card.hr_email ? "Generate Email & Apply" : "Generate & Apply"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
