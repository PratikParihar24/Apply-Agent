import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
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
  const [email, setEmail] = useState("Loading...");
  const [role, setRole] = useState(localStorage.getItem('profileRole') || "");
  const [location, setLocation] = useState(localStorage.getItem('profileLocation') || "");

  useEffect(() => {
    fetch('http://localhost:8000/api/user/profile')
      .then(r => r.json())
      .then(d => setEmail(d.email || 'No email found in .env'))
      .catch(() => setEmail('Failed to load'));
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem('profileRole', role);
    localStorage.setItem('profileLocation', location);
    toast.success("Profile saved locally");
  };

  const field = "w-full rounded-card border border-cardborder bg-darkbg px-4 py-3 text-sm text-cream placeholder:text-mutedtext focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40";

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-extrabold text-cream">Your Profile</h1>
      <p className="mt-2 text-sm text-mutedtext">A few details so your hunt feels like yours.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-column border border-cardborder bg-cardbg p-6">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-mutedtext">Sending Email (from .env)</label>
          <input className={field} value={email} readOnly />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-mutedtext">Default Role</label>
          <input type="text" className={field} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Software Engineer" />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-mutedtext">Default Location</label>
          <input type="text" className={field} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote" />
        </div>
        <button type="submit" className="w-full rounded-card bg-terracotta px-4 py-3 text-sm font-bold uppercase tracking-wider text-darkbg transition-transform hover:scale-[1.01] hover:shadow-[var(--shadow-glow)]">
          Save Defaults
        </button>
      </form>
    </main>
  );
}
