import { i as __toESM } from "../_runtime.mjs";
import { l as getSettings, r as deleteSettingsField } from "./client-D0aiy5F6.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { _ as EyeOff, a as ShieldAlert, c as Save, g as Eye, i as Trash2, m as Info, t as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-CPDySHrX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const queryClient = useQueryClient();
	const [preferredLlm, setPreferredLlm] = (0, import_react.useState)("auto");
	const [ollamaUrl, setOllamaUrl] = (0, import_react.useState)("");
	const [geminiKey, setGeminiKey] = (0, import_react.useState)("");
	const [groqKey, setGroqKey] = (0, import_react.useState)("");
	const [openRouterKey, setOpenRouterKey] = (0, import_react.useState)("");
	const [resendKey, setResendKey] = (0, import_react.useState)("");
	const [gmailAddress, setGmailAddress] = (0, import_react.useState)("");
	const [gmailPassword, setGmailPassword] = (0, import_react.useState)("");
	const [showGemini, setShowGemini] = (0, import_react.useState)(false);
	const [showGroq, setShowGroq] = (0, import_react.useState)(false);
	const [showOpenRouter, setShowOpenRouter] = (0, import_react.useState)(false);
	const [showResend, setShowResend] = (0, import_react.useState)(false);
	const [showGmail, setShowGmail] = (0, import_react.useState)(false);
	const [showLlmInfo, setShowLlmInfo] = (0, import_react.useState)(false);
	const [showEmailInfo, setShowEmailInfo] = (0, import_react.useState)(false);
	const { data: settings, isLoading } = useQuery({
		queryKey: ["settings"],
		queryFn: getSettings
	});
	(0, import_react.useEffect)(() => {
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
	const saveMutation = useMutation({
		mutationFn: async (data) => {
			const { apiCall } = await import("./apiClient-D7buwDVF.mjs").then((n) => n.n).then((n) => n.n);
			return apiCall("/api/settings", {
				method: "PUT",
				body: JSON.stringify(data)
			});
		},
		onSuccess: () => {
			toast.success("Settings saved successfully!");
			queryClient.invalidateQueries({ queryKey: ["settings"] });
		},
		onError: () => {
			toast.error("Failed to save settings");
		}
	});
	const clearMutation = useMutation({
		mutationFn: async () => {
			for (const field of [
				"gemini_api_key",
				"groq_api_key",
				"openrouter_api_key",
				"resend_api_key",
				"gmail_app_password",
				"ollama_url",
				"gmail_address"
			]) await deleteSettingsField(field);
		},
		onSuccess: () => {
			toast.success("All settings cleared!");
			queryClient.invalidateQueries({ queryKey: ["settings"] });
		}
	});
	const handleSaveLlm = () => {
		saveMutation.mutate({
			preferred_llm: preferredLlm,
			ollama_url: ollamaUrl,
			gemini_api_key: geminiKey && !geminiKey.includes("****") ? geminiKey : void 0,
			groq_api_key: groqKey && !groqKey.includes("****") ? groqKey : void 0,
			openrouter_api_key: openRouterKey && !openRouterKey.includes("****") ? openRouterKey : void 0
		});
	};
	const handleSaveEmail = () => {
		saveMutation.mutate({
			resend_api_key: resendKey && !resendKey.includes("****") ? resendKey : void 0,
			gmail_address: gmailAddress,
			gmail_app_password: gmailPassword && !gmailPassword.includes("****") ? gmailPassword : void 0
		});
	};
	const handleClearAll = () => {
		if (window.confirm("Are you sure you want to clear all your API keys and settings? This cannot be undone.")) clearMutation.mutate();
	};
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 text-center text-mutedtext",
		children: "Loading settings..."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-3xl mx-auto p-6 space-y-8 pb-20",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-light text-cream mb-2",
				children: "Settings"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-mutedtext",
				children: "Configure your personal API keys and AI preferences."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-cardbg border border-cardborder rounded-xl p-6 space-y-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-medium text-cream flex items-center gap-2",
						children: "LLM Configuration"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setShowLlmInfo(true),
						className: "text-mutedtext/60 hover:text-cream transition-colors p-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { size: 20 })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-sm text-mutedtext mb-1",
							children: "Preferred AI Provider"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: preferredLlm,
							onChange: (e) => setPreferredLlm(e.target.value),
							className: "w-full bg-darkbg border border-cardborder rounded-lg px-4 py-2 text-cream focus:outline-none focus:border-terracotta",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "auto",
									children: "Auto (Default fallback chain)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "ollama",
									children: "Ollama (Local)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "gemini",
									children: "Gemini"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "groq",
									children: "Groq"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "openrouter",
									children: "OpenRouter"
								})
							]
						})] }),
						(preferredLlm === "ollama" || preferredLlm === "auto") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-sm text-mutedtext mb-1",
							children: "Ollama URL (Optional)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							placeholder: "http://localhost:11434",
							value: ollamaUrl,
							onChange: (e) => setOllamaUrl(e.target.value),
							className: "w-full bg-darkbg border border-cardborder rounded-lg px-4 py-2 text-cream placeholder-mutedtext/40 focus:outline-none focus:border-terracotta"
						})] }),
						(preferredLlm === "gemini" || preferredLlm === "auto") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-sm text-mutedtext mb-1",
							children: "Gemini API Key"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: showGemini ? "text" : "password",
								placeholder: "AIzaSy...",
								value: geminiKey,
								onChange: (e) => setGeminiKey(e.target.value),
								className: "w-full bg-darkbg border border-cardborder rounded-lg px-4 py-2 pr-10 text-cream placeholder-mutedtext/40 focus:outline-none focus:border-terracotta"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowGemini(!showGemini),
								className: "absolute right-3 top-2.5 text-mutedtext/60 hover:text-cream",
								children: showGemini ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 18 })
							})]
						})] }),
						(preferredLlm === "groq" || preferredLlm === "auto") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-sm text-mutedtext mb-1",
							children: "Groq API Key"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: showGroq ? "text" : "password",
								placeholder: "gsk_...",
								value: groqKey,
								onChange: (e) => setGroqKey(e.target.value),
								className: "w-full bg-darkbg border border-cardborder rounded-lg px-4 py-2 pr-10 text-cream placeholder-mutedtext/40 focus:outline-none focus:border-terracotta"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowGroq(!showGroq),
								className: "absolute right-3 top-2.5 text-mutedtext/60 hover:text-cream",
								children: showGroq ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 18 })
							})]
						})] }),
						(preferredLlm === "openrouter" || preferredLlm === "auto") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-sm text-mutedtext mb-1",
							children: "OpenRouter API Key"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: showOpenRouter ? "text" : "password",
								placeholder: "sk-or-v1-...",
								value: openRouterKey,
								onChange: (e) => setOpenRouterKey(e.target.value),
								className: "w-full bg-darkbg border border-cardborder rounded-lg px-4 py-2 pr-10 text-cream placeholder-mutedtext/40 focus:outline-none focus:border-terracotta"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowOpenRouter(!showOpenRouter),
								className: "absolute right-3 top-2.5 text-mutedtext/60 hover:text-cream",
								children: showOpenRouter ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 18 })
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: handleSaveLlm,
							disabled: saveMutation.isPending,
							className: "flex items-center gap-2 bg-terracotta/20 hover:bg-terracotta/35 border border-terracotta/40 text-cream px-4 py-2 rounded-lg transition-colors text-sm font-medium",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 16 }), " Save LLM Settings"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-cardbg border border-cardborder rounded-xl p-6 space-y-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-medium text-cream flex items-center gap-2",
						children: "📧 Email Configuration"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setShowEmailInfo(true),
						className: "text-mutedtext/60 hover:text-cream transition-colors p-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { size: 20 })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-sm text-mutedtext mb-1",
							children: "Resend API Key"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: showResend ? "text" : "password",
								placeholder: "re_...",
								value: resendKey,
								onChange: (e) => setResendKey(e.target.value),
								className: "w-full bg-darkbg border border-cardborder rounded-lg px-4 py-2 pr-10 text-cream placeholder-mutedtext/40 focus:outline-none focus:border-terracotta"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowResend(!showResend),
								className: "absolute right-3 top-2.5 text-mutedtext/60 hover:text-cream",
								children: showResend ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 18 })
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-sm text-mutedtext mb-1",
							children: "Gmail Address (For IMAP Reply Tracking)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "email",
							placeholder: "you@gmail.com",
							value: gmailAddress,
							onChange: (e) => setGmailAddress(e.target.value),
							className: "w-full bg-darkbg border border-cardborder rounded-lg px-4 py-2 text-cream placeholder-mutedtext/40 focus:outline-none focus:border-terracotta"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-sm text-mutedtext mb-1",
							children: "Gmail App Password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: showGmail ? "text" : "password",
								placeholder: "xxxx xxxx xxxx xxxx",
								value: gmailPassword,
								onChange: (e) => setGmailPassword(e.target.value),
								className: "w-full bg-darkbg border border-cardborder rounded-lg px-4 py-2 pr-10 text-cream placeholder-mutedtext/40 focus:outline-none focus:border-terracotta"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowGmail(!showGmail),
								className: "absolute right-3 top-2.5 text-mutedtext/60 hover:text-cream",
								children: showGmail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 18 })
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: handleSaveEmail,
							disabled: saveMutation.isPending,
							className: "flex items-center gap-2 bg-terracotta/20 hover:bg-terracotta/35 border border-terracotta/40 text-cream px-4 py-2 rounded-lg transition-colors text-sm font-medium",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 16 }), " Save Email Settings"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-red-500/20 bg-red-500/5 rounded-xl p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-xl font-medium text-red-500 flex items-center gap-2 mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { size: 20 }), " Danger Zone"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-mutedtext mb-4",
						children: "This will wipe all your personal API keys and settings from the database."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: handleClearAll,
						className: "flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 px-4 py-2 rounded-lg transition-colors text-sm font-medium",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 16 }), " Clear all settings"]
					})
				]
			}),
			showLlmInfo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-darkbg/80 backdrop-blur-sm p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-lg bg-cardbg border border-cardborder rounded-2xl p-6 shadow-2xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowLlmInfo(false),
							className: "absolute top-4 right-4 text-mutedtext hover:text-cream",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xl font-semibold text-cream mb-4",
							children: "How to Setup AI Providers"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4 text-sm text-mutedtext",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
										className: "text-cream",
										children: "Ollama (Local)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "1. Download Ollama from ollama.com and run it." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["2. Open a terminal and run ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
										className: "bg-darkbg px-1 rounded border border-cardborder",
										children: "ollama run llama3.2:1b"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "3. The default port is already configured (localhost:11434)." })
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-cream",
									children: "Gemini"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Get a free API key from Google AI Studio." })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-cream",
									children: "Groq"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Get an incredibly fast inference key from console.groq.com." })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-cream",
									children: "OpenRouter"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Get access to hundreds of models from openrouter.ai/keys." })] })
							]
						})
					]
				})
			}),
			showEmailInfo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-darkbg/80 backdrop-blur-sm p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-lg bg-cardbg border border-cardborder rounded-2xl p-6 shadow-2xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowEmailInfo(false),
							className: "absolute top-4 right-4 text-mutedtext hover:text-cream",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xl font-semibold text-cream mb-4",
							children: "How to Setup Email Delivery"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4 text-sm text-mutedtext",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "text-cream",
								children: "Resend API Key"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Get a free key from resend.com. Excellent for sending to verified emails." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-cream",
									children: "Gmail App Password"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "1. Go to your Google Account Settings > Security." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "2. Enable 2-Step Verification if you haven't." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "3. Search for \"App Passwords\" and create a new one for this app." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "4. Enter your full Gmail address and the 16-character password here." })
							] })]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { SettingsPage as component };
