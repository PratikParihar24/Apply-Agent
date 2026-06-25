import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  component: Register,
});

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created successfully!");
      navigate({ to: "/hunt" });
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-card border border-cardborder bg-cardbg p-8 shadow-[var(--shadow-glow)]">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-cream">Create Account</h2>
          <p className="mt-2 text-xs uppercase tracking-widest text-mutedtext">
            Start your automated search
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-mutedtext">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Seeker"
              required
              className="mt-2 w-full rounded-card border border-cardborder bg-darkbg p-3 text-sm text-cream transition-colors placeholder:text-mutedtext/40 focus:border-terracotta focus:outline-none"
            />
          </div>

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

          <div>
            <label className="block text-xs uppercase tracking-wider text-mutedtext">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-2 w-full rounded-card border border-cardborder bg-darkbg p-3 text-sm text-cream transition-colors placeholder:text-mutedtext/40 focus:border-terracotta focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-card bg-terracotta py-3.5 text-sm font-bold uppercase tracking-wider text-darkbg shadow-[var(--shadow-glow)] transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-mutedtext">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-terracotta hover:underline">
            Log in to hunt
          </Link>
        </p>
      </div>
    </main>
  );
}
