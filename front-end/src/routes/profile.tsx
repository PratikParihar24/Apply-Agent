import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Agent Apply" },
      { name: "description", content: "Manage your profile." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const [name, setName] = useState("Alex Rivera");
  const [email, setEmail] = useState("alex@example.com");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast.success("Profile saved");
  };

  const field = "w-full rounded-card border border-cardborder bg-darkbg px-4 py-3 text-sm text-cream placeholder:text-mutedtext focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40";

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-extrabold text-cream">Your Profile</h1>
      <p className="mt-2 text-sm text-mutedtext">A few details so your hunt feels like yours.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-column border border-cardborder bg-cardbg p-6">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-mutedtext">Name</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-mutedtext">Email</label>
          <input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button type="submit" className="w-full rounded-card bg-terracotta px-4 py-3 text-sm font-bold uppercase tracking-wider text-darkbg transition-transform hover:scale-[1.01] hover:shadow-[var(--shadow-glow)]">
          Save
        </button>
      </form>
    </main>
  );
}
