import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster, toast } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import MobileMenu from "../components/MobileMenu";
import { Settings, ChevronDown, Check, Server, User as UserIcon } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-darkbg px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-cream">404</h1>
        <p className="mt-2 text-sm text-mutedtext">This page wandered off the path.</p>
        <Link to="/" className="mt-6 inline-flex rounded-card bg-terracotta px-4 py-2 text-sm font-semibold text-darkbg hover:opacity-90">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-darkbg px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-cream">This page didn't load</h1>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-card bg-terracotta px-4 py-2 text-sm font-semibold text-darkbg">
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Agent Apply — Terracotta Twilight" },
      { name: "description", content: "A design-forward, human-centred career board." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}<Scripts /></body>
    </html>
  );
}

function LLMDropdown() {
  const [status, setStatus] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const fetchStatus = async () => {
    try {
      const { apiCall } = await import("../utils/apiClient");
      const data = await apiCall("/api/llm/status");
      setStatus(data);
    } catch (e) {
      setStatus({ type: 'error' });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const changeProvider = async (provider: string) => {
    // 1. Optimistic UI Update: instantly change the UI state
    const previousStatus = { ...status };
    setStatus((prev: any) => ({
      ...prev,
      active_provider: provider,
      // If switching to ollama, assume the first available model. Otherwise, set a generic placeholder.
      active_model: provider === "ollama" ? (prev?.providers?.ollama?.models?.[0] || "llama3.2:1b") : "..."
    }));
    setIsOpen(false); // Close dropdown instantly

    try {
      const { apiCall } = await import("../utils/apiClient");
      // 2. Perform backend update in the background
      await apiCall("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ preferred_llm: provider }),
      });
      toast.success(`Switched to ${provider}`);
      
      // 3. Re-sync with actual backend state
      fetchStatus();
    } catch (e) {
      // Rollback on failure
      setStatus(previousStatus);
      toast.error("Failed to switch provider");
    }
  };

  if (!status || !status.providers) return <div className="ml-4 h-7 w-24 animate-pulse rounded-full border border-cardborder bg-cardbg" />;

  let dotColor = "bg-gray-500";
  let label = "No LLM";

  if (status.active_provider === "ollama") {
    dotColor = "bg-sage";
    label = `Local: ${status.active_model}`;
  } else if (status.active_provider === "gemini") {
    dotColor = "bg-[#4285F4]";
    label = `Cloud: Gemini`;
  } else if (status.active_provider === "groq") {
    dotColor = "bg-[#F55036]";
    label = `Cloud: Groq`;
  } else if (status.active_provider === "openrouter") {
    dotColor = "bg-purple-500";
    label = `Cloud: OpenRouter`;
  }

  const KeyIcon = ({ isUser }: { isUser: boolean }) => (
    <div title={isUser ? "Using your personal API Key" : "Using server default API Key"} className="ml-auto">
      {isUser ? <UserIcon size={12} className="text-sage" /> : <Server size={12} className="text-mutedtext/60" />}
    </div>
  );

  return (
    <div className="relative ml-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-cardborder bg-cardbg px-3 py-1.5 shadow-sm transition-all hover:border-terracotta/50 focus-visible:outline-none"
      >
        <span className={`h-2 w-2 rounded-full ${dotColor} shadow-[0_0_8px_rgba(0,0,0,0.3)]`} />
        <span className="text-xs font-bold tracking-wide text-cream">{label}</span>
        <ChevronDown size={14} className="text-mutedtext" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-cardborder bg-cardbg shadow-xl z-50 overflow-hidden text-sm">
            <div className="p-2">
              <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-mutedtext">Local Models</div>
              {status.providers.ollama.available ? (
                status.providers.ollama.models.map((model: string) => (
                  <button 
                    key={model}
                    onClick={() => changeProvider("ollama")}
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cardbg-hover text-cream transition-colors"
                  >
                    {status.active_provider === "ollama" && status.active_model === model ? <Check size={14} className="text-terracotta" /> : <div className="w-[14px]" />}
                    {model}
                  </button>
                ))
              ) : (
                <div className="px-2 py-1.5 text-xs text-mutedtext/50 italic">Ollama offline (port 11434)</div>
              )}

              <div className="mt-2 mb-1 border-t border-cardborder/40" />
              <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-mutedtext">Cloud Providers</div>
              
              <button 
                onClick={() => changeProvider("gemini")}
                disabled={!status.providers.gemini.available}
                className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cardbg-hover text-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status.active_provider === "gemini" ? <Check size={14} className="text-terracotta" /> : <div className="w-[14px]" />}
                Gemini
                {status.providers.gemini.available && <KeyIcon isUser={status.providers.gemini.using_own_key} />}
              </button>
              
              <button 
                onClick={() => changeProvider("groq")}
                disabled={!status.providers.groq.available}
                className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cardbg-hover text-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status.active_provider === "groq" ? <Check size={14} className="text-terracotta" /> : <div className="w-[14px]" />}
                Groq
                {status.providers.groq.available && <KeyIcon isUser={status.providers.groq.using_own_key} />}
              </button>
              
              <button 
                onClick={() => changeProvider("openrouter")}
                disabled={!status.providers.openrouter.available}
                className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cardbg-hover text-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status.active_provider === "openrouter" ? <Check size={14} className="text-terracotta" /> : <div className="w-[14px]" />}
                OpenRouter
                {status.providers.openrouter.available && <KeyIcon isUser={status.providers.openrouter.using_own_key} />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Navbar() {
  const linkCls = "text-sm text-mutedtext hover:text-cream transition-colors focus-visible:outline-none";
  const activeCls = "text-cream font-semibold";

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [devMode, setDevMode] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem('devMode') === 'true';
    }
    return false;
  });
  const [huntActive, setHuntActive] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem('agentapply_hunt_started') === 'true';
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  useEffect(() => {
    const checkHunt = () => {
      if (typeof window !== "undefined" && window.localStorage) {
        setHuntActive(localStorage.getItem('agentapply_hunt_started') === 'true');
      }
    };
    checkHunt();
    const interval = setInterval(checkHunt, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "X" || e.key === "x")) {
        e.preventDefault();
        const newMode = !devMode;
        localStorage.setItem("devMode", String(newMode));
        toast(newMode ? "Dev Mode Enabled (Mock API active)" : "Dev Mode Disabled (Live API active)", {
          duration: 1500,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [devMode]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-cardborder bg-darkbg/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-extrabold tracking-tight text-terracotta focus-visible:outline-none">
            Agent Apply
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6">
            <Link to="/" className={linkCls} activeOptions={{ exact: true }} activeProps={{ className: activeCls }}>Home</Link>
            
            {user && (
              <>
                <Link to="/hunt" className={`relative ${linkCls}`} activeProps={{ className: activeCls }}>
                  My Hunt
                  {huntActive && (
                    <span className="absolute -right-2.5 -top-1 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-terracotta"></span>
                    </span>
                  )}
                </Link>
                <Link to="/community" className={linkCls} activeProps={{ className: activeCls }}>Community</Link>
                <Link to="/profile" className={linkCls} activeProps={{ className: activeCls }}>Profile</Link>
                <Link to="/applications" className={linkCls} activeProps={{ className: activeCls }}>Applications</Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
                  activeProps={{ className: "bg-white/10 font-medium text-white" }}>
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>

              </>
            )}



            <div className="flex items-center gap-4 border-l border-cardborder pl-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-cream max-w-[120px] truncate">{user.name || user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="rounded-card border border-cardborder bg-cardbg px-3 py-1.5 text-xs font-semibold text-terracotta hover:bg-cardbg-hover transition-colors btn-ripple focus-visible:outline-none"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/login" className={linkCls} activeProps={{ className: activeCls }}>Login</Link>
                  <Link
                    to="/register"
                    className="rounded-card bg-terracotta px-3 py-1.5 text-xs font-semibold text-darkbg hover:opacity-90 transition-opacity btn-ripple focus-visible:outline-none"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
            
            <ThemeToggle />
            <LLMDropdown />
          </div>

          {/* Mobile Hamburger Trigger Button */}
          <div className="flex lg:hidden items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
              className="rounded-card border border-cardborder bg-cardbg p-2 text-cream hover:bg-cardbg-hover focus-visible:outline-none"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <LLMDropdown />
          </div>
        </nav>
      </header>

      {/* Slide-in Mobile Menu Panel (Rendered outside header to avoid backdrop blur inheritance) */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onRequestLogout={() => {
          setIsMobileMenuOpen(false);
          setShowLogoutModal(true);
        }}
        huntActive={huntActive}
      />

      {/* Custom Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-darkbg/85 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-card border border-terracotta bg-cardbg p-6 shadow-[var(--shadow-glow)] text-center" style={{ animation: "var(--animate-slide-in)" }}>
            <h2 className="text-xl font-bold text-cream mb-2">Log Out?</h2>
            <p className="text-sm text-mutedtext mb-6">
              Are you sure you want to end your current hunt session?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-card border border-cardborder px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:border-terracotta hover:text-cream btn-ripple"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                  setShowLogoutModal(false);
                }}
                className="flex-1 rounded-card bg-terracotta px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-darkbg transition-colors hover:bg-opacity-90 btn-ripple"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <div className="flex min-h-screen flex-col bg-darkbg text-cream transition-colors duration-300">
            <Navbar />
            <div className="flex-1">
              <Outlet />
            </div>
            
            {/* Global Sticky Footer */}
            <footer className="mt-auto border-t border-cardborder bg-darkbg/50 py-8 text-center text-xs uppercase tracking-[0.2em] text-mutedtext">
              <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <span>© {new Date().getFullYear()} Agent Apply · Made with warmth</span>
                <div className="flex items-center gap-6">
                  <Link to="/feedback" className="hover:text-cream transition-colors focus-visible:outline-none">Feedback</Link>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert("Dummy privacy policy details."); }} className="hover:text-cream transition-colors focus-visible:outline-none">Privacy</a>
                </div>
              </div>
            </footer>
            
            <Toaster
              theme="dark"
              position="top-right"
              expand={true}
              visibleToasts={6}
              toastOptions={{
                style: {
                  background: "var(--color-cardbg)",
                  border: "1px solid var(--color-cardborder)",
                  color: "var(--color-cream)",
                },
              }}
            />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
