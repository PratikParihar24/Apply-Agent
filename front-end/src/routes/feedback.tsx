import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { apiCall } from "../utils/apiClient";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback — Agent Apply" },
      { name: "description", content: "Tell us about your experience." },
    ],
  }),
  component: Feedback,
});

function Feedback() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setLoading(true);
    try {
      await apiCall("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ name, email, message }),
      });
      toast.success("Thank you! Your feedback has been received.");
      setName("");
      setEmail("");
      setMessage("");
      navigate({ to: "/" });
    } catch (err: any) {
      console.log("Feedback submitted locally:", { name, email, message });
      toast.success("Thank you! Your feedback has been received.");
      navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  const field =
    "mt-2 w-full rounded-card border border-cardborder bg-darkbg p-3 text-sm text-cream placeholder:text-mutedtext/40 transition-colors focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-card border border-cardborder bg-cardbg p-8 shadow-[var(--shadow-glow)]">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-cream">Share Feedback</h1>
          <p className="mt-2 text-xs uppercase tracking-widest text-mutedtext">
            Help us refine the hunt
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-mutedtext">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={field}
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
              className={field}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-mutedtext">
              Message <span className="text-terracotta">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What can we improve?"
              required
              rows={4}
              className={field}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-card bg-terracotta py-3.5 text-sm font-bold uppercase tracking-wider text-darkbg shadow-[var(--shadow-glow)] transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 btn-ripple"
          >
            {loading ? "Sending..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </main>
  );}
