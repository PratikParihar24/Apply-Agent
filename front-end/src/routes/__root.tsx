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

function LLMStatusPill() {
  const [status, setStatus] = useState<any>(null);
  
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/llm/status");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        } else {
          setStatus({ type: 'error' });
        }
      } catch (e) {
        setStatus({ type: 'error' });
      }
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return <div className="ml-4 h-7 w-24 animate-pulse rounded-full border border-cardborder bg-cardbg" />;

  let dotColor = "bg-gray-500";
  let label = "No LLM";

  if (status.type === "local") {
    dotColor = "bg-sage";
    label = `Local: ${status.model}`;
  } else if (status.type === "cloud") {
    dotColor = "bg-[#4285F4]"; // blue
    label = `Cloud: Gemini`;
  }

  return (
    <div className="ml-4 flex items-center gap-2 rounded-full border border-cardborder bg-cardbg px-3 py-1.5 shadow-sm transition-all hover:border-terracotta/50">
      <span className={`h-2 w-2 rounded-full ${dotColor} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
      <span className="text-xs font-bold tracking-wide text-cream">{label}</span>
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
            <LLMStatusPill />
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
            <LLMStatusPill />
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
