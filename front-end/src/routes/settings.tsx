import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings, deleteSettingsField } from "../api/client";
import { toast } from "sonner";
import { Eye, EyeOff, Save, Trash2, ShieldAlert, Info, X } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();

  // Local state for our form inputs
  const [preferredLlm, setPreferredLlm] = useState("auto");
  const [ollamaUrl, setOllamaUrl] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [resendKey, setResendKey] = useState("");
  const [gmailAddress, setGmailAddress] = useState("");
  const [gmailPassword, setGmailPassword] = useState("");

  // Toggles for showing/hiding password fields
  const [showGemini, setShowGemini] = useState(false);
  const [showGroq, setShowGroq] = useState(false);
  const [showOpenRouter, setShowOpenRouter] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [showGmail, setShowGmail] = useState(false);

  // Info modal states
  const [showLlmInfo, setShowLlmInfo] = useState(false);
  const [showEmailInfo, setShowEmailInfo] = useState(false);

  // 1. Fetch current settings from the backend
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  // 2. Pre-fill our local state once the data loads
  useEffect(() => {
    if (settings) {
      setPreferredLlm(settings.preferred_llm || "auto");
      setOllamaUrl(settings.ollama_url || "");
      setGeminiKey(settings.gemini_api_key || "");
      setGroqKey(settings.groq_api_key || "");
      setOpenRouterKey(settings.openrouter_api_key || "");
      setResendKey(settings.resend_api_key || "");
      setGmailAddress(settings.gmail_address || "");
      setGmailPassword(settings.gmail_app_password || "");
    }
  }, [settings]);

  // 3. Setup our save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { apiCall } = await import("../utils/apiClient");
      return apiCall("/api/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      // Force React Query to re-fetch settings so we see the newly masked values
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  // 4. Setup our clear mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      // Clear specific sensitive fields from backend
      const fields = ["gemini_api_key", "groq_api_key", "openrouter_api_key", "resend_api_key", "gmail_app_password", "ollama_url", "gmail_address"];
      for (const field of fields) {
        await deleteSettingsField(field);
      }
    },
    onSuccess: () => {
      toast.success("All settings cleared!");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const handleSaveLlm = () => {
    saveMutation.mutate({
      preferred_llm: preferredLlm,
      ollama_url: ollamaUrl,
      gemini_api_key: geminiKey && !geminiKey.includes("****") ? geminiKey : undefined,
      groq_api_key: groqKey && !groqKey.includes("****") ? groqKey : undefined,
      openrouter_api_key: openRouterKey && !openRouterKey.includes("****") ? openRouterKey : undefined,
    });
  };

  const handleSaveEmail = () => {
    saveMutation.mutate({
      resend_api_key: resendKey && !resendKey.includes("****") ? resendKey : undefined,
      gmail_address: gmailAddress,
      gmail_app_password: gmailPassword && !gmailPassword.includes("****") ? gmailPassword : undefined,
    });
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all your API keys and settings? This cannot be undone.")) {
      clearMutation.mutate();
    }
  };

  if (isLoading) return <div className="p-8 text-center text-white/50">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-light text-white mb-2">Settings</h1>
        <p className="text-white/60">Configure your personal API keys and AI preferences.</p>
      </div>

      {/* LLM Configuration Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-white flex items-center gap-2">
            LLM Configuration
          </h2>
          <button 
            onClick={() => setShowLlmInfo(true)}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            <Info size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Preferred AI Provider</label>
            <select
              value={preferredLlm}
              onChange={(e) => setPreferredLlm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30"
            >
              <option value="auto">Auto (Default fallback chain)</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="gemini">Gemini</option>
              <option value="groq">Groq</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>

          {(preferredLlm === "ollama" || preferredLlm === "auto") && (
            <div>
              <label className="block text-sm text-white/70 mb-1">Ollama URL (Optional)</label>
              <input
                type="text"
                placeholder="http://localhost:11434"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
              />
            </div>
          )}

          {(preferredLlm === "gemini" || preferredLlm === "auto") && (
            <div>
              <label className="block text-sm text-white/70 mb-1">Gemini API Key</label>
              <div className="relative">
                <input
                  type={showGemini ? "text" : "password"}
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 pr-10 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-3 top-2.5 text-white/40 hover:text-white/80"
                >
                  {showGemini ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {(preferredLlm === "groq" || preferredLlm === "auto") && (
            <div>
              <label className="block text-sm text-white/70 mb-1">Groq API Key</label>
              <div className="relative">
                <input
                  type={showGroq ? "text" : "password"}
                  placeholder="gsk_..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 pr-10 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={() => setShowGroq(!showGroq)}
                  className="absolute right-3 top-2.5 text-white/40 hover:text-white/80"
                >
                  {showGroq ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {(preferredLlm === "openrouter" || preferredLlm === "auto") && (
            <div>
              <label className="block text-sm text-white/70 mb-1">OpenRouter API Key</label>
              <div className="relative">
                <input
                  type={showOpenRouter ? "text" : "password"}
                  placeholder="sk-or-v1-..."
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 pr-10 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={() => setShowOpenRouter(!showOpenRouter)}
                  className="absolute right-3 top-2.5 text-white/40 hover:text-white/80"
                >
                  {showOpenRouter ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleSaveLlm}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Save size={16} /> Save LLM Settings
          </button>
        </div>
      </div>

      {/* Email Configuration Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-white flex items-center gap-2">
            📧 Email Configuration
          </h2>
          <button 
            onClick={() => setShowEmailInfo(true)}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            <Info size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Resend API Key</label>
            <div className="relative">
              <input
                type={showResend ? "text" : "password"}
                placeholder="re_..."
                value={resendKey}
                onChange={(e) => setResendKey(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 pr-10 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
              />
              <button
                onClick={() => setShowResend(!showResend)}
                className="absolute right-3 top-2.5 text-white/40 hover:text-white/80"
              >
                {showResend ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Gmail Address (For IMAP Reply Tracking)</label>
            <input
              type="email"
              placeholder="you@gmail.com"
              value={gmailAddress}
              onChange={(e) => setGmailAddress(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Gmail App Password</label>
            <div className="relative">
              <input
                type={showGmail ? "text" : "password"}
                placeholder="xxxx xxxx xxxx xxxx"
                value={gmailPassword}
                onChange={(e) => setGmailPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 pr-10 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
              />
              <button
                onClick={() => setShowGmail(!showGmail)}
                className="absolute right-3 top-2.5 text-white/40 hover:text-white/80"
              >
                {showGmail ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveEmail}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Save size={16} /> Save Email Settings
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-6">
        <h2 className="text-xl font-medium text-red-400 flex items-center gap-2 mb-4">
          <ShieldAlert size={20} /> Danger Zone
        </h2>
        <p className="text-sm text-white/60 mb-4">
          This will wipe all your personal API keys and settings from the database.
        </p>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Trash2 size={16} /> Clear all settings
        </button>
      </div>

      {showLlmInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <button onClick={() => setShowLlmInfo(false)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={20}/></button>
              <h3 className="text-xl font-semibold text-white mb-4">How to Setup AI Providers</h3>
              <div className="space-y-4 text-sm text-white/70">
                <div>
                  <strong className="text-white">Ollama (Local)</strong>
                  <p>1. Download Ollama from ollama.com and run it.</p>
                  <p>2. Open a terminal and run <code className="bg-white/10 px-1 rounded">ollama run llama3.2:1b</code></p>
                  <p>3. The default port is already configured (localhost:11434).</p>
                </div>
                <div>
                  <strong className="text-white">Gemini</strong>
                  <p>Get a free API key from Google AI Studio.</p>
                </div>
                <div>
                  <strong className="text-white">Groq</strong>
                  <p>Get an incredibly fast inference key from console.groq.com.</p>
                </div>
                <div>
                  <strong className="text-white">OpenRouter</strong>
                  <p>Get access to hundreds of models from openrouter.ai/keys.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEmailInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <button onClick={() => setShowEmailInfo(false)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={20}/></button>
              <h3 className="text-xl font-semibold text-white mb-4">How to Setup Email Delivery</h3>
              <div className="space-y-4 text-sm text-white/70">
                <div>
                  <strong className="text-white">Resend API Key</strong>
                  <p>Get a free key from resend.com. Excellent for sending to verified emails.</p>
                </div>
                <div>
                  <strong className="text-white">Gmail App Password</strong>
                  <p>1. Go to your Google Account Settings &gt; Security.</p>
                  <p>2. Enable 2-Step Verification if you haven't.</p>
                  <p>3. Search for "App Passwords" and create a new one for this app.</p>
                  <p>4. Enter your full Gmail address and the 16-character password here.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
