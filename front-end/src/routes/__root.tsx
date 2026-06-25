import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

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
      <head><HeadContent /></head>
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
  const linkCls = "text-sm text-mutedtext hover:text-cream transition-colors";
  const activeCls = "text-cream font-semibold";

  const [devMode, setDevMode] = useState(false);
  useEffect(() => {
    setDevMode(localStorage.getItem('devMode') === 'true');
  }, []);

  const handleDevModeToggle = () => {
    const newMode = !devMode;
    localStorage.setItem('devMode', String(newMode));
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-cardborder bg-darkbg/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-extrabold tracking-tight text-terracotta">
          Agent Apply
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className={linkCls} activeOptions={{ exact: true }} activeProps={{ className: activeCls }}>Home</Link>
          <Link to="/hunt" className={linkCls} activeProps={{ className: activeCls }}>My Hunt</Link>
          <Link to="/community" className={linkCls} activeProps={{ className: activeCls }}>Community</Link>
          <Link to="/profile" className={linkCls} activeProps={{ className: activeCls }}>Profile</Link>
          {import.meta.env.DEV && (
            <div className="ml-4 flex items-center gap-2 border-l border-cardborder pl-4">
              <span className="text-xs text-mutedtext">Dev Mode</span>
              <button
                onClick={handleDevModeToggle}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${devMode ? 'bg-terracotta' : 'bg-cardborder'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-cream transition-transform ${devMode ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          )}
          <LLMStatusPill />
        </div>
      </nav>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-darkbg text-cream">
        <Navbar />
        <Outlet />
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#2C1F1A",
              border: "1px solid rgba(224, 122, 95, 0.3)",
              color: "#F4F1DE",
            },
          }}
        />
      </div>
    </QueryClientProvider>
  );
}
