import { i as __toESM } from "../_runtime.mjs";
import { o as getAnalytics } from "./client-D0aiy5F6.mjs";
import { a as require_jsx_runtime, o as require_react, r as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { n as useAuth, t as AuthProvider } from "./AuthContext-Dlw7MGTB.mjs";
import { N as useNavigate, P as useRouter, c as HeadContent, d as Outlet, f as lazyRouteComponent, h as Link, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { D as CircleCheckBig, b as ChevronDown, d as Mail, l as RefreshCw, n as User, o as Settings, r as TrendingUp, s as Server, u as Percent, w as Sparkles, x as Check } from "../_libs/lucide-react.mjs";
import { n as QueryClient } from "../_libs/tanstack__query-core.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-D-AoteRf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-Bh11ceEQ.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
var ThemeContext = (0, import_react.createContext)(void 0);
var ThemeProvider = ({ children }) => {
	const [theme, setTheme] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined" && window.localStorage) {
			const stored = window.localStorage.getItem("theme");
			if (stored === "light" || stored === "dark") return stored;
		}
		return "dark";
	});
	(0, import_react.useEffect)(() => {
		const root = window.document.documentElement;
		if (theme === "dark") {
			root.classList.add("dark");
			root.classList.remove("light");
		} else {
			root.classList.add("light");
			root.classList.remove("dark");
		}
		localStorage.setItem("theme", theme);
	}, [theme]);
	const toggleTheme = () => {
		setTheme((prev) => prev === "dark" ? "light" : "dark");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeContext.Provider, {
		value: {
			theme,
			toggleTheme
		},
		children
	});
};
var useTheme = () => {
	const context = (0, import_react.useContext)(ThemeContext);
	if (context === void 0) throw new Error("useTheme must be used within a ThemeProvider");
	return context;
};
var ThemeToggle = () => {
	const { theme, toggleTheme } = useTheme();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: toggleTheme,
		"aria-label": "Toggle Theme",
		className: "btn-ripple relative flex h-9 w-9 items-center justify-center rounded-card border border-cardborder bg-cardbg text-terracotta transition-all hover:bg-cardbg-hover hover:border-terracotta/50 focus-visible:outline-none",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			className: `h-5 w-5 transition-transform duration-500 ${theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"}`,
			fill: "none",
			stroke: "currentColor",
			viewBox: "0 0 24 24",
			strokeWidth: 2,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "12",
				cy: "12",
				r: "5"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			className: `absolute h-5 w-5 transition-transform duration-500 ${theme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`,
			fill: "none",
			stroke: "currentColor",
			viewBox: "0 0 24 24",
			strokeWidth: 2,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" })
		})]
	});
};
var MobileMenu = ({ isOpen, onClose, user, onRequestLogout, huntActive }) => {
	const linkCls = "block w-full py-3 px-4 rounded-card text-base font-semibold text-mutedtext hover:text-cream hover:bg-cardbg-hover transition-colors";
	const activeCls = "text-cream bg-cardbg font-bold border-l-4 border-terracotta pl-3";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		onClick: onClose,
		className: `fixed inset-0 z-45 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
		className: `fixed right-0 top-0 bottom-0 z-50 w-[280px] mobile-menu-aside bg-cardbg border-l border-cardborder p-6 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-full flex-col justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-cardborder pb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-lg font-extrabold tracking-tight text-terracotta",
						children: "Navigation"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						"aria-label": "Close menu",
						className: "rounded-card border border-cardborder bg-cardbg p-2 text-cream hover:bg-cardbg-hover focus-visible:outline-none",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
							className: "h-4 w-4",
							fill: "none",
							stroke: "currentColor",
							viewBox: "0 0 24 24",
							strokeWidth: 2,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								strokeLinecap: "round",
								strokeLinejoin: "round",
								d: "M6 18L18 6M6 6l12 12"
							})
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							onClick: onClose,
							className: linkCls,
							activeProps: { className: activeCls },
							activeOptions: { exact: true },
							children: "Home"
						}),
						user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/hunt",
								onClick: onClose,
								className: `relative ${linkCls}`,
								activeProps: { className: activeCls },
								children: ["My Hunt", huntActive && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "absolute right-4 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex h-2.5 w-2.5 rounded-full bg-terracotta" })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/community",
								onClick: onClose,
								className: linkCls,
								activeProps: { className: activeCls },
								children: "Community"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/profile",
								onClick: onClose,
								className: linkCls,
								activeProps: { className: activeCls },
								children: "Profile"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/applications",
								onClick: onClose,
								className: linkCls,
								activeProps: { className: activeCls },
								children: "Applications"
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/feedback",
							onClick: onClose,
							className: linkCls,
							activeProps: { className: activeCls },
							children: "Feedback"
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-cardborder pt-6 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between px-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs uppercase tracking-wider text-mutedtext",
						children: "Theme"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {})]
				}), user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-card border border-cardborder bg-cardbg p-4 space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xs text-mutedtext truncate",
						children: ["Signed in as ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-cream block truncate",
							children: user.name || user.email
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							onRequestLogout();
						},
						className: "w-full rounded-card border border-terracotta/40 py-2.5 text-sm font-bold uppercase tracking-wider text-terracotta hover:bg-terracotta hover:text-darkbg transition-all",
						children: "Logout"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						onClick: onClose,
						className: "rounded-card border border-cardborder py-2.5 text-center text-xs font-semibold text-cream hover:bg-cardbg-hover transition-colors",
						children: "Login"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/register",
						onClick: onClose,
						className: "rounded-card bg-terracotta py-2.5 text-center text-xs font-semibold text-darkbg hover:opacity-90 transition-opacity",
						children: "Register"
					})]
				})]
			})]
		})
	})] });
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-darkbg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-cream",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-mutedtext",
					children: "This page wandered off the path."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "mt-6 inline-flex rounded-card bg-terracotta px-4 py-2 text-sm font-semibold text-darkbg hover:opacity-90",
					children: "Go home"
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-darkbg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-semibold text-cream",
				children: "This page didn't load"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => {
					router.invalidate();
					reset();
				},
				className: "mt-6 rounded-card bg-terracotta px-4 py-2 text-sm font-semibold text-darkbg",
				children: "Try again"
			})]
		})
	});
}
var Route$9 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Agent Apply — Terracotta Twilight" },
			{
				name: "description",
				content: "A design-forward, human-centred career board."
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            ` } })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			suppressHydrationWarning: true,
			children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})]
		})]
	});
}
function LLMDropdown() {
	const [status, setStatus] = (0, import_react.useState)(null);
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const fetchStatus = async () => {
		try {
			const { apiCall } = await import("./apiClient-D7buwDVF.mjs").then((n) => n.n).then((n) => n.n);
			setStatus(await apiCall("/api/llm/status"));
		} catch (e) {
			setStatus({ type: "error" });
		}
	};
	(0, import_react.useEffect)(() => {
		fetchStatus();
		const interval = setInterval(fetchStatus, 3e4);
		return () => clearInterval(interval);
	}, []);
	const changeProvider = async (provider) => {
		const previousStatus = { ...status };
		setStatus((prev) => ({
			...prev,
			active_provider: provider,
			active_model: provider === "ollama" ? prev?.providers?.ollama?.models?.[0] || "llama3.2:1b" : "..."
		}));
		setIsOpen(false);
		try {
			const { apiCall } = await import("./apiClient-D7buwDVF.mjs").then((n) => n.n).then((n) => n.n);
			await apiCall("/api/settings", {
				method: "PUT",
				body: JSON.stringify({ preferred_llm: provider })
			});
			toast.success(`Switched to ${provider}`);
			fetchStatus();
		} catch (e) {
			setStatus(previousStatus);
			toast.error("Failed to switch provider");
		}
	};
	if (!status || !status.providers) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "ml-4 h-7 w-24 animate-pulse rounded-full border border-cardborder bg-cardbg" });
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
	const KeyIcon = ({ isUser }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		title: isUser ? "Using your personal API Key" : "Using server default API Key",
		className: "ml-auto",
		children: isUser ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, {
			size: 12,
			className: "text-sage"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, {
			size: 12,
			className: "text-mutedtext/60"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative ml-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => setIsOpen(!isOpen),
			className: "flex items-center gap-2 rounded-full border border-cardborder bg-cardbg px-3 py-1.5 shadow-sm transition-all hover:border-terracotta/50 focus-visible:outline-none",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2 w-2 rounded-full ${dotColor} shadow-[0_0_8px_rgba(0,0,0,0.3)]` }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold tracking-wide text-cream",
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
					size: 14,
					className: "text-mutedtext"
				})
			]
		}), isOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-40",
			onClick: () => setIsOpen(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute right-0 top-full mt-2 w-56 rounded-xl border border-cardborder bg-cardbg shadow-xl z-50 overflow-hidden text-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-2 py-1 text-xs font-bold uppercase tracking-wider text-mutedtext",
						children: "Local Models"
					}),
					status.providers.ollama.available ? status.providers.ollama.models.map((model) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => changeProvider("ollama"),
						className: "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cardbg-hover text-cream transition-colors",
						children: [status.active_provider === "ollama" && status.active_model === model ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							size: 14,
							className: "text-terracotta"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-[14px]" }), model]
					}, model)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-2 py-1.5 text-xs text-mutedtext/50 italic",
						children: "Ollama offline (port 11434)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-2 mb-1 border-t border-cardborder/40" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-2 py-1 text-xs font-bold uppercase tracking-wider text-mutedtext",
						children: "Cloud Providers"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => changeProvider("gemini"),
						disabled: !status.providers.gemini.available,
						className: "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cardbg-hover text-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
						children: [
							status.active_provider === "gemini" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
								size: 14,
								className: "text-terracotta"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-[14px]" }),
							"Gemini",
							status.providers.gemini.available && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyIcon, { isUser: status.providers.gemini.using_own_key })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => changeProvider("groq"),
						disabled: !status.providers.groq.available,
						className: "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cardbg-hover text-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
						children: [
							status.active_provider === "groq" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
								size: 14,
								className: "text-terracotta"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-[14px]" }),
							"Groq",
							status.providers.groq.available && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyIcon, { isUser: status.providers.groq.using_own_key })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => changeProvider("openrouter"),
						disabled: !status.providers.openrouter.available,
						className: "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cardbg-hover text-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
						children: [
							status.active_provider === "openrouter" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
								size: 14,
								className: "text-terracotta"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-[14px]" }),
							"OpenRouter",
							status.providers.openrouter.available && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyIcon, { isUser: status.providers.openrouter.using_own_key })
						]
					})
				]
			})
		})] })]
	});
}
function Navbar() {
	const linkCls = "text-sm text-mutedtext hover:text-cream transition-colors focus-visible:outline-none";
	const activeCls = "text-cream font-semibold";
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [devMode, setDevMode] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined" && window.localStorage) return localStorage.getItem("devMode") === "true";
		return false;
	});
	const [huntActive, setHuntActive] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined" && window.localStorage) return localStorage.getItem("agentapply_hunt_started") === "true";
		return false;
	});
	const [isMobileMenuOpen, setIsMobileMenuOpen] = (0, import_react.useState)(false);
	const [showLogoutModal, setShowLogoutModal] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const checkHunt = () => {
			if (typeof window !== "undefined" && window.localStorage) setHuntActive(localStorage.getItem("agentapply_hunt_started") === "true");
		};
		checkHunt();
		const interval = setInterval(checkHunt, 1e3);
		return () => clearInterval(interval);
	}, []);
	(0, import_react.useEffect)(() => {
		const handleKeyDown = (e) => {
			if (e.ctrlKey && e.shiftKey && (e.key === "X" || e.key === "x")) {
				e.preventDefault();
				const newMode = !devMode;
				localStorage.setItem("devMode", String(newMode));
				toast(newMode ? "Dev Mode Enabled (Mock API active)" : "Dev Mode Disabled (Live API active)", { duration: 1500 });
				setTimeout(() => {
					window.location.reload();
				}, 1e3);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [devMode]);
	const handleLogout = () => {
		setShowLogoutModal(true);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "sticky top-0 z-40 border-b border-cardborder bg-darkbg/80 backdrop-blur-md",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "mx-auto flex max-w-7xl items-center justify-between px-6 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "text-lg font-extrabold tracking-tight text-terracotta focus-visible:outline-none",
						children: "Agent Apply"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hidden lg:flex items-center gap-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								className: linkCls,
								activeOptions: { exact: true },
								activeProps: { className: activeCls },
								children: "Home"
							}),
							user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/hunt",
									className: `relative ${linkCls}`,
									activeProps: { className: activeCls },
									children: ["My Hunt", huntActive && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "absolute -right-2.5 -top-1 flex h-2 w-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex h-2 w-2 rounded-full bg-terracotta" })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/community",
									className: linkCls,
									activeProps: { className: activeCls },
									children: "Community"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/applications",
									className: linkCls,
									activeProps: { className: activeCls },
									children: "Applications"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/settings",
									className: "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5",
									activeProps: { className: "bg-white/10 font-medium text-white" },
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "w-4 h-4" }), "Settings"]
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center gap-4 border-l border-cardborder pl-4",
								children: user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/profile",
										className: "flex items-center gap-2 text-xs font-medium text-cream max-w-[150px] truncate hover:text-terracotta transition-colors focus-visible:outline-none",
										activeProps: { className: "text-terracotta font-semibold" },
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex h-6 w-6 items-center justify-center rounded-full bg-terracotta/20 text-terracotta",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { size: 12 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: user.name || user.email })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: handleLogout,
										className: "rounded-card border border-cardborder bg-cardbg px-3 py-1.5 text-xs font-semibold text-terracotta hover:bg-cardbg-hover transition-colors btn-ripple focus-visible:outline-none",
										children: "Logout"
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/login",
										className: linkCls,
										activeProps: { className: activeCls },
										children: "Login"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/register",
										className: "rounded-card bg-terracotta px-3 py-1.5 text-xs font-semibold text-darkbg hover:opacity-90 transition-opacity btn-ripple focus-visible:outline-none",
										children: "Register"
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LLMDropdown, {})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex lg:hidden items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setIsMobileMenuOpen(true),
							"aria-label": "Open menu",
							className: "rounded-card border border-cardborder bg-cardbg p-2 text-cream hover:bg-cardbg-hover focus-visible:outline-none",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
								className: "h-5 w-5",
								fill: "none",
								stroke: "currentColor",
								viewBox: "0 0 24 24",
								strokeWidth: 2,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									strokeLinecap: "round",
									strokeLinejoin: "round",
									d: "M4 6h16M4 12h16M4 18h16"
								})
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LLMDropdown, {})]
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileMenu, {
			isOpen: isMobileMenuOpen,
			onClose: () => setIsMobileMenuOpen(false),
			user,
			onRequestLogout: () => {
				setIsMobileMenuOpen(false);
				setShowLogoutModal(true);
			},
			huntActive
		}),
		showLogoutModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-50 flex items-center justify-center bg-darkbg/85 p-4 backdrop-blur-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative w-full max-w-sm rounded-card border border-terracotta bg-cardbg p-6 shadow-[var(--shadow-glow)] text-center",
				style: { animation: "var(--animate-slide-in)" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold text-cream mb-2",
						children: "Log Out?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-mutedtext mb-6",
						children: "Are you sure you want to end your current hunt session?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowLogoutModal(false),
							className: "flex-1 rounded-card border border-cardborder px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:border-terracotta hover:text-cream btn-ripple",
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								logout();
								navigate({ to: "/" });
								setShowLogoutModal(false);
							},
							className: "flex-1 rounded-card bg-terracotta px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-darkbg transition-colors hover:bg-opacity-90 btn-ripple",
							children: "Yes, Log Out"
						})]
					})
				]
			})
		})
	] });
}
function RootComponent() {
	const { queryClient } = Route$9.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-screen flex-col bg-darkbg text-cream transition-colors duration-300",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
					className: "mt-auto border-t border-cardborder bg-darkbg/50 py-8 text-center text-xs uppercase tracking-[0.2em] text-mutedtext",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"© ",
							(/* @__PURE__ */ new Date()).getFullYear(),
							" Agent Apply · Made with warmth"
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/feedback",
								className: "hover:text-cream transition-colors focus-visible:outline-none",
								children: "Feedback"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#",
								onClick: (e) => {
									e.preventDefault();
									alert("Dummy privacy policy details.");
								},
								className: "hover:text-cream transition-colors focus-visible:outline-none",
								children: "Privacy"
							})]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					theme: "dark",
					position: "top-right",
					expand: true,
					visibleToasts: 6,
					toastOptions: { style: {
						background: "var(--color-cardbg)",
						border: "1px solid var(--color-cardborder)",
						color: "var(--color-cream)"
					} }
				})
			]
		}) }) })
	});
}
var $$splitComponentImporter$7 = () => import("./settings-CPDySHrX.mjs");
var Route$8 = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./register-BgPWEvTD.mjs");
var Route$7 = createFileRoute("/register")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./profile-C2CuTf9E.mjs");
var Route$6 = createFileRoute("/profile")({
	head: () => ({ meta: [{ title: "Profile — Agent Apply" }, {
		name: "description",
		content: "Manage your profile and parsed resume."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./login-adUjuzH5.mjs");
var Route$5 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./hunt-eibONViJ.mjs");
var Route$4 = createFileRoute("/hunt")({
	head: () => ({ meta: [{ title: "My Hunt — Agent Apply" }, {
		name: "description",
		content: "Live 3-column dashboard of your job hunt."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./feedback-CC_KDiPr.mjs");
var Route$3 = createFileRoute("/feedback")({
	head: () => ({ meta: [{ title: "Feedback — Agent Apply" }, {
		name: "description",
		content: "Tell us about your experience."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./community-CFs1KgMW.mjs");
var Route$2 = createFileRoute("/community")({
	head: () => ({ meta: [{ title: "Community — Agent Apply" }, {
		name: "description",
		content: "Connect with other creatives on their hunt."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./applications-DxcfX7BW.mjs");
var Route$1 = createFileRoute("/applications")({
	head: () => ({ meta: [{ title: "Applications — Agent Apply" }, {
		name: "description",
		content: "Track your job application pipeline."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var StatCard = ({ label, value, subtext, icon: Icon, iconColorClass = "text-terracotta", loading = false }) => {
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "animate-pulse rounded-card border border-cardborder bg-cardbg p-5 space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-1/3 rounded bg-white/10" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-6 w-6 rounded-full bg-white/10" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-1/2 rounded bg-white/10" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-2/3 rounded bg-white/10" })
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "group rounded-card border border-cardborder bg-cardbg p-5 shadow-sm hover:shadow-[var(--shadow-glow)] hover:bg-cardbg-hover transition-all duration-300",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold uppercase tracking-wider text-mutedtext",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `p-1.5 rounded-lg bg-darkbg/50 border border-cardborder/40 ${iconColorClass}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 16 })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 text-3xl font-extrabold text-cream leading-tight",
				children: value
			}),
			subtext && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-mutedtext font-medium truncate",
				children: subtext
			})
		]
	});
};
var Route = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Agent Apply — Where your story meets its stage" },
		{
			name: "description",
			content: "A design-forward, human-centred career board for creative opportunities."
		},
		{
			property: "og:title",
			content: "Agent Apply"
		},
		{
			property: "og:description",
			content: "Finding creative opportunities, humanised."
		}
	] }),
	component: Home
});
var features = [
	{
		title: "Smart Matching",
		desc: "We surface roles that fit your story, not just your keywords."
	},
	{
		title: "Live Dashboard",
		desc: "Watch your hunt unfold in three columns — searching, generating, ready."
	},
	{
		title: "Human‑Centred",
		desc: "Every application is tailored, editable, and unmistakably yours."
	}
];
var statusConfig = {
	applied: {
		bg: "bg-mutedtext/30",
		text: "text-mutedtext",
		label: "Applied"
	},
	viewed: {
		bg: "bg-blue-500",
		text: "text-blue-400",
		label: "Viewed"
	},
	replied: {
		bg: "bg-amber-500",
		text: "text-amber-400",
		label: "Replied"
	},
	interview: {
		bg: "bg-emerald-500",
		text: "text-emerald-400",
		label: "Interview"
	},
	rejected: {
		bg: "bg-rose-500",
		text: "text-rose-400",
		label: "Rejected"
	},
	failed: {
		bg: "bg-red-500",
		text: "text-red-500",
		label: "Failed"
	}
};
function Home() {
	const { user } = useAuth();
	const [analytics, setAnalytics] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const fetchAnalytics = async () => {
		if (!user) return;
		setLoading(true);
		try {
			setAnalytics(await getAnalytics());
		} catch (e) {
			toast.error(`Failed to load analytics: ${e.message || e}`);
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		if (user) fetchAnalytics();
	}, [user]);
	if (user) {
		const activePipeline = analytics ? analytics.total_applications - (analytics.by_status.rejected + analytics.by_status.failed) : 0;
		const cloudPercentage = analytics && analytics.total_applications > 0 ? Math.round(((analytics.llm_usage.gemini || 0) + (analytics.llm_usage.groq || 0) + (analytics.llm_usage.openrouter || 0)) / analytics.total_applications * 100) : 0;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-7xl px-4 py-10 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-4 mb-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-3xl font-extrabold text-cream",
						children: "Dashboard"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-mutedtext",
						children: [
							"Welcome back, ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-cream font-semibold",
								children: user.name || user.email
							}),
							". Here is your application health at a glance."
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: fetchAnalytics,
						disabled: loading,
						className: "flex items-center gap-2 rounded-card border border-cardborder bg-cardbg px-4 py-2 text-xs font-bold uppercase tracking-wider text-cream hover:bg-cardbg-hover transition-colors btn-ripple",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
							size: 12,
							className: loading ? "animate-spin" : ""
						}), "Sync Data"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							label: "Applications Sent",
							value: analytics?.total_applications ?? 0,
							subtext: `${analytics?.applications_this_month ?? 0} in the last 30 days`,
							icon: Mail,
							iconColorClass: "text-blue-400",
							loading
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							label: "Reply Rate",
							value: analytics ? `${Math.round(analytics.reply_rate * 100)}%` : "0%",
							subtext: `${(analytics?.by_status.replied ?? 0) + (analytics?.by_status.interview ?? 0) + (analytics?.by_status.rejected ?? 0)} companies replied`,
							icon: Percent,
							iconColorClass: "text-amber-400",
							loading
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							label: "Interview Rate",
							value: analytics ? `${Math.round(analytics.interview_rate * 100)}%` : "0%",
							subtext: `${analytics?.by_status.interview ?? 0} interviewing processes`,
							icon: CircleCheckBig,
							iconColorClass: "text-emerald-400",
							loading
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							label: "Active Pipeline",
							value: activePipeline,
							subtext: `${analytics?.by_status.applied ?? 0} awaiting first response`,
							icon: TrendingUp,
							iconColorClass: "text-terracotta",
							loading
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 gap-6 lg:grid-cols-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "lg:col-span-2 rounded-column border border-cardborder bg-cardbg/40 p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-bold text-cream mb-4",
							children: "Pipeline Distribution"
						}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-6 bg-white/10 rounded-full w-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-5 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 bg-white/10 rounded" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 bg-white/10 rounded" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 bg-white/10 rounded" })
								]
							})]
						}) : analytics && analytics.total_applications > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-6 w-full flex overflow-hidden rounded-full bg-darkbg border border-cardborder/40",
								children: Object.entries(statusConfig).map(([statusKey, config]) => {
									const count = analytics.by_status[statusKey] || 0;
									const percentage = count / analytics.total_applications * 100;
									if (count === 0) return null;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										style: { width: `${percentage}%` },
										className: `${config.bg} h-full transition-all duration-500`,
										title: `${config.label}: ${count} (${Math.round(percentage)}%)`
									}, statusKey);
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 sm:grid-cols-3 gap-4",
								children: Object.entries(statusConfig).map(([statusKey, config]) => {
									const count = analytics.by_status[statusKey] || 0;
									const percentage = analytics.total_applications > 0 ? Math.round(count / analytics.total_applications * 100) : 0;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2.5 w-2.5 rounded-full ${config.bg}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-cream font-bold block",
												children: config.label
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-mutedtext",
												children: [
													count,
													" (",
													percentage,
													"%)"
												]
											})]
										})]
									}, statusKey);
								})
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-center py-6 text-xs text-mutedtext italic",
							children: "No pipeline stats to display yet."
						})] }), analytics && analytics.total_applications > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 pt-4 border-t border-cardborder/20 flex items-center gap-2 text-xs text-mutedtext",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
								size: 14,
								className: "text-terracotta"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [cloudPercentage, "%"] }), " of your applications were tailormade using cloud AI models."] })]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-column border border-cardborder bg-cardbg/40 p-6 backdrop-blur-sm shadow-xl space-y-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-bold text-cream mb-4",
							children: "Top Targets"
						}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 bg-white/10 rounded w-3/4 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 bg-white/10 rounded w-1/2 animate-pulse" })]
						}) : analytics && analytics.top_roles.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-2.5",
							children: analytics.top_roles.map((role, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-2 text-xs text-mutedtext bg-darkbg/40 border border-cardborder/20 px-3 py-2 rounded-card",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-bold text-terracotta",
									children: ["#", idx + 1]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-cream font-medium truncate",
									children: role
								})]
							}, idx))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-mutedtext italic",
							children: "No targets recorded yet."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-bold text-cream mb-4",
							children: "Model Distribution"
						}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 animate-pulse",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 bg-white/10 rounded w-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 bg-white/10 rounded w-full" })]
						}) : analytics && Object.keys(analytics.llm_usage).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: Object.entries(analytics.llm_usage).map(([model, count]) => {
								const percentage = analytics.total_applications > 0 ? Math.round(count / analytics.total_applications * 100) : 0;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-xs font-semibold capitalize text-cream",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: model }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											count,
											" (",
											percentage,
											"%)"
										] })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-1.5 w-full bg-darkbg rounded-full overflow-hidden",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: { width: `${percentage}%` },
											className: "h-full bg-sand rounded-full"
										})
									})]
								}, model);
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-mutedtext italic",
							children: "No LLM metrics logged."
						})] })]
					})]
				})
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-7xl px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col items-center pt-24 pb-16 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-6 rounded-full border border-cardborder bg-cardbg px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-sand",
						children: "Terracotta Twilight · v1"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight text-cream sm:text-6xl md:text-7xl",
						children: [
							"FINDING CREATIVE",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"OPPORTUNITIES,",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-terracotta",
								children: "HUMANISED"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-8 max-w-2xl text-sm uppercase tracking-[0.25em] text-mutedtext",
						children: [
							"Where your story meets its stage ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mx-2 text-terracotta",
								children: "|"
							}),
							" A design‑forward career board"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/hunt",
						className: "mt-12 inline-flex items-center gap-2 rounded-card bg-terracotta px-8 py-4 text-sm font-bold uppercase tracking-wider text-darkbg shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02] hover:shadow-[var(--shadow-glow-strong)]",
						children: "Start Your Hunt →"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid gap-6 pb-24 md:grid-cols-3",
				children: features.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-card border border-cardborder bg-cardbg p-6 transition-all hover:-translate-y-1 hover:bg-cardbg-hover hover:shadow-[var(--shadow-glow)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mb-4 h-1 w-10 rounded-full bg-terracotta" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-lg font-bold text-cream",
							children: f.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-mutedtext",
							children: f.desc
						})
					]
				}, f.title))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "border-t border-cardborder py-8 text-center text-xs uppercase tracking-[0.2em] text-mutedtext",
				children: [
					"© ",
					(/* @__PURE__ */ new Date()).getFullYear(),
					" Agent Apply · Made with warmth"
				]
			})
		]
	});
}
var SettingsRoute = Route$8.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$9
});
var RegisterRoute = Route$7.update({
	id: "/register",
	path: "/register",
	getParentRoute: () => Route$9
});
var ProfileRoute = Route$6.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => Route$9
});
var LoginRoute = Route$5.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$9
});
var HuntRoute = Route$4.update({
	id: "/hunt",
	path: "/hunt",
	getParentRoute: () => Route$9
});
var FeedbackRoute = Route$3.update({
	id: "/feedback",
	path: "/feedback",
	getParentRoute: () => Route$9
});
var CommunityRoute = Route$2.update({
	id: "/community",
	path: "/community",
	getParentRoute: () => Route$9
});
var ApplicationsRoute = Route$1.update({
	id: "/applications",
	path: "/applications",
	getParentRoute: () => Route$9
});
var rootRouteChildren = {
	IndexRoute: Route.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$9
	}),
	ApplicationsRoute,
	CommunityRoute,
	FeedbackRoute,
	HuntRoute,
	LoginRoute,
	ProfileRoute,
	RegisterRoute,
	SettingsRoute
};
var routeTree = Route$9._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
