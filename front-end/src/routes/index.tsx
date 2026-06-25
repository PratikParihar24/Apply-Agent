import { createFileRoute, Link } from "@tanstack/react-router";

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

function Home() {
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
