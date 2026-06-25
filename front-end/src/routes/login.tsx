import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate({ to: "/hunt" });
    } catch (err: any) {
      toast.error(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-card border border-cardborder bg-cardbg p-8 shadow-[var(--shadow-glow)]">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-cream">Welcome Back</h2>
          <p className="mt-2 text-xs uppercase tracking-widest text-mutedtext">
            Enter the hunting ground
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-mutedtext">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mt-2 w-full rounded-card border border-cardborder bg-darkbg p-3 text-sm text-cream transition-colors placeholder:text-mutedtext/40 focus:border-terracotta focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-mutedtext">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-2 w-full rounded-card border border-cardborder bg-darkbg p-3 text-sm text-cream transition-colors placeholder:text-mutedtext/40 focus:border-terracotta focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-card bg-terracotta py-3.5 text-sm font-bold uppercase tracking-wider text-darkbg shadow-[var(--shadow-glow)] transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-mutedtext">
          New seeker?{" "}
          <Link to="/register" className="font-semibold text-terracotta hover:underline">
            Register your hunt
          </Link>
        </p>
      </div>
    </main>
  );
}
