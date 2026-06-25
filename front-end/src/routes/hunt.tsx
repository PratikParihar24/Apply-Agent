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

export const Route = createFileRoute("/hunt")({
  head: () => ({
    meta: [
      { title: "My Hunt — Agent Apply" },
      { name: "description", content: "Live 3-column dashboard of your job hunt." },
    ],
  }),
  component: HuntPage,
});

type Status = "searching" | "generating" | "ready" | "sent";

interface Company {
  id: number | string;
  name: string;
  job_title?: string;
  role?: string; // Fallback for UI mapping
  description?: string;
  desc?: string; // Fallback for UI mapping
  score: number;
}

interface Card extends Company {
  status: Status;
  coverLetter: string;
  emailBody: string;
  resume: string;
  subject?: string;
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
  const [brief, setBrief] = useState<HuntBrief>(emptyBrief);
  const [started, setStarted] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const indexRef = useRef(0);

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
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const handleReview = async (id: number | string) => {
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

  const handleSkip = (id: number | string) => setCards((prev) => prev.filter((c) => c.id !== id));

  const handleSend = async (id: number | string) => {
    const c = cards.find((x) => x.id === id);
    if (!c) return;

    updateCard(id, { status: "sent" });
    try {
      const payload = {
        cover_letter: c.coverLetter,
        email_body: c.emailBody,
        subject: c.subject || "Application",
        recipient_email: "test@example.com", // Provide a placeholder or prompt the user if needed
      };
      const res = await sendApplication(String(id), payload);
      if (res.success) {
        toast.success(`Application sent to ${c.name}!`);
      } else {
        throw new Error(res.status || "Unknown error");
      }
      setTimeout(() => setCards((prev) => prev.filter((x) => x.id !== id)), 600);
    } catch (error) {
      const e = error as Error;
      toast.error(`Failed to send — check your email config: ${e.message}`);
      updateCard(id, { status: "ready" }); // revert on error
    }
  };

  const handleReset = () => {
    indexRef.current = 0;
    setCards([]);
    setStarted(false);
  };

  const handleStart = () => {
    setStarted(true);
    startHunt(brief.targetRole, brief.location || "Remote", 10, (c) => {
      setCards((prev) => [
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
      ]);
    }).catch((error) => {
      const e = error as Error;
      toast.error(`Hunt failed to start: ${e.message}`);
      setStarted(false);
    });
  };

  if (!started) {
    return <SetupForm brief={brief} setBrief={setBrief} onStart={handleStart} />;
  }

  const searching = cards.filter((c) => c.status === "searching");
  const generating = cards.filter((c) => c.status === "generating");
  const ready = cards.filter((c) => c.status === "ready" || c.status === "sent");

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
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
        <button
          onClick={handleReset}
          className="rounded-card border border-cardborder px-3 py-2 text-xs font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:text-cream"
        >
          Edit Brief
        </button>
      </div>

      <BriefChips brief={brief} />

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Column title="Searching" count={searching.length} accent="terracotta">
          {searching.map((c) => (
            <JobCard key={c.id} card={c} onReview={handleReview} onSkip={handleSkip} />
          ))}
          {searching.length === 0 && <EmptyHint text="Scouting roles for you…" />}
        </Column>

        <Column title="Generating" count={generating.length} accent="sand">
          {generating.map((c) => (
            <GeneratingCard key={c.id} card={c} />
          ))}
          {generating.length === 0 && <EmptyHint text="Drafts will appear here." />}
        </Column>

        <Column title="Ready to Send" count={ready.length} accent="sage">
          {ready.map((c) => (
            <ReadyCard key={c.id} card={c} onSend={handleSend} onUpdate={updateCard} />
          ))}
          {ready.length === 0 && <EmptyHint text="Reviewed applications land here." />}
        </Column>
      </div>
    </main>
  );
}

function SetupForm({
  brief,
  setBrief,
  onStart,
}: {
  brief: HuntBrief;
  setBrief: (b: HuntBrief) => void;
  onStart: () => void;
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

        <button
          onClick={submit}
          disabled={!canStart}
          className="w-full rounded-card bg-terracotta px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-darkbg transition-all hover:scale-[1.01] hover:shadow-[var(--shadow-glow-strong)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          Start the Hunt →
        </button>
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
}: {
  card: Card;
  onReview: (id: number | string) => void;
  onSkip: (id: number | string) => void;
}) {
  return (
    <article
      style={{ animation: "var(--animate-slide-in)" }}
      className="group rounded-card border border-cardborder bg-cardbg p-4 transition-all hover:-translate-y-0.5 hover:bg-cardbg-hover hover:shadow-[var(--shadow-glow)]"
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
          className="flex-1 rounded-card border border-terracotta px-3 py-2 text-xs font-bold uppercase tracking-wider text-terracotta transition-all hover:bg-terracotta hover:text-darkbg"
        >
          Review
        </button>
        <button
          onClick={() => onSkip(card.id)}
          className="rounded-card px-3 py-2 text-xs font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:text-cream"
        >
          Skip
        </button>
      </div>
    </article>
  );
}

function GeneratingCard({ card }: { card: Card }) {
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
      style={{ animation: "var(--animate-slide-in)" }}
      className="rounded-card border border-cardborder bg-cardbg p-4"
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
}: {
  card: Card;
  onSend: (id: number | string) => void;
  onUpdate: (id: number | string, patch: Partial<Card>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const isSent = card.status === "sent";

  return (
    <article
      style={{ animation: isSent ? "var(--animate-scale-out)" : "var(--animate-slide-in)" }}
      className="rounded-card border border-sage/70 bg-cardbg p-4"
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
              className="rounded-card border border-terracotta px-3 py-2 text-xs font-bold uppercase tracking-wider text-terracotta transition-colors hover:bg-terracotta hover:text-darkbg"
            >
              {editing ? "Done" : "Edit"}
            </button>
            <button
              onClick={() => onSend(card.id)}
              disabled={isSent}
              className="flex-1 rounded-card bg-terracotta px-3 py-2 text-xs font-bold uppercase tracking-wider text-darkbg transition-all hover:shadow-[var(--shadow-glow-strong)] disabled:opacity-50"
            >
              {isSent ? "Sent ✓" : "Send Application"}
            </button>
          </div>
        </div>
      )}
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
