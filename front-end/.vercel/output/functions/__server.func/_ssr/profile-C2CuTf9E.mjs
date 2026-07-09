import { i as __toESM } from "../_runtime.mjs";
import { a as getActiveResume } from "./client-D0aiy5F6.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { n as useAuth } from "./AuthContext-Dlw7MGTB.mjs";
import { t as ProtectedRoute } from "./ProtectedRoute-W1osNBCA.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { E as Layers, S as Calendar, h as FileText, l as RefreshCw, w as Sparkles } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-C2CuTf9E.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProfilePage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Profile, {}) });
}
function Profile() {
	const { user, updateUserPreferences } = useAuth();
	const [activeResume, setActiveResume] = (0, import_react.useState)(null);
	const [resumeLoading, setResumeLoading] = (0, import_react.useState)(true);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [role, setRole] = (0, import_react.useState)(() => {
		const isClient = typeof window !== "undefined";
		return user?.preferences?.role || (isClient ? localStorage.getItem("profileRole") || "" : "");
	});
	const [location, setLocation] = (0, import_react.useState)(() => {
		const isClient = typeof window !== "undefined";
		return user?.preferences?.location || (isClient ? localStorage.getItem("profileLocation") || "" : "");
	});
	const fetchResume = async () => {
		setResumeLoading(true);
		try {
			setActiveResume(await getActiveResume());
		} catch (err) {
			console.log("No active resume found:", err.message || err);
			setActiveResume(null);
		} finally {
			setResumeLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		if (user?.preferences) {
			setRole(user.preferences.role || "");
			setLocation(user.preferences.location || "");
		}
	}, [user]);
	(0, import_react.useEffect)(() => {
		fetchResume();
	}, []);
	const onSubmit = async (e) => {
		e.preventDefault();
		setSaving(true);
		try {
			await updateUserPreferences(role, location);
			localStorage.setItem("profileRole", role);
			localStorage.setItem("profileLocation", location);
			toast.success("Preferences saved successfully!");
		} catch (err) {
			toast.error(err.message || "Failed to save preferences");
		} finally {
			setSaving(false);
		}
	};
	const field = "w-full rounded-card border border-cardborder bg-darkbg px-4 py-3 text-sm text-cream placeholder:text-mutedtext focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40 transition-colors";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-5xl px-6 py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-extrabold text-cream",
				children: "Your Profile"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-mutedtext",
				children: "A few details so your job hunt feels like yours."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 gap-8 mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit,
					className: "space-y-5 rounded-column border border-cardborder bg-cardbg p-6 h-fit shadow-lg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-bold text-cream border-b border-cardborder/40 pb-2 flex items-center gap-2",
							children: "Target Hunt Settings"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "mb-2 block text-xs uppercase tracking-wider text-mutedtext",
							children: "Name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: `${field} opacity-70`,
							value: user?.name || "",
							readOnly: true,
							disabled: true
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "mb-2 block text-xs uppercase tracking-wider text-mutedtext",
							children: "Email Address"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: `${field} opacity-70`,
							value: user?.email || "",
							readOnly: true,
							disabled: true
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "mb-2 block text-xs uppercase tracking-wider text-mutedtext",
							children: "Default Role"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							className: field,
							value: role,
							onChange: (e) => setRole(e.target.value),
							placeholder: "e.g. Software Engineer"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "mb-2 block text-xs uppercase tracking-wider text-mutedtext",
							children: "Default Location"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							className: field,
							value: location,
							onChange: (e) => setLocation(e.target.value),
							placeholder: "e.g. Remote"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: saving,
							className: "w-full flex items-center justify-center gap-2 rounded-card bg-terracotta px-4 py-3 text-sm font-bold uppercase tracking-wider text-darkbg transition-transform hover:scale-[1.01] hover:shadow-[var(--shadow-glow)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed btn-ripple",
							children: saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
								size: 14,
								className: "animate-spin"
							}), "Saving..."] }) : "Save Defaults"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-column border border-cardborder bg-cardbg p-6 h-fit shadow-lg flex flex-col space-y-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center border-b border-cardborder/40 pb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-bold text-cream flex items-center gap-2",
							children: "Parsed Resume Insights"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: fetchResume,
							disabled: resumeLoading,
							className: "text-mutedtext hover:text-cream transition-colors p-1",
							title: "Refresh resume details",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
								size: 16,
								className: resumeLoading ? "animate-spin" : ""
							})
						})]
					}), resumeLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "py-12 flex flex-col items-center justify-center space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
							size: 24,
							className: "text-terracotta animate-spin"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-mutedtext",
							children: "Retrieving resume summary and skills..."
						})]
					}) : activeResume ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-card border border-cardborder/40 bg-darkbg/40 p-4 space-y-3 text-xs text-mutedtext",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-start",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-semibold text-cream text-sm flex items-center gap-1.5 truncate max-w-[200px]",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
													size: 16,
													className: "text-terracotta"
												}),
												" ",
												activeResume.filename
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold",
											children: "Active"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between pt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Uploaded On:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-cream font-medium flex items-center gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { size: 12 }), new Date(activeResume.uploaded_at).toLocaleDateString(void 0, {
												month: "short",
												day: "numeric",
												year: "numeric"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Vector Database Chunks:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-cream font-medium flex items-center gap-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { size: 12 }),
												activeResume.chunks_count,
												" chunks"
											]
										})]
									})
								]
							}),
							activeResume.summary && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-xs uppercase tracking-wider font-bold text-cream flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
										size: 14,
										className: "text-terracotta"
									}), " AI Profile Summary"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "rounded-card border border-cardborder/30 bg-darkbg/25 p-3.5 text-xs text-mutedtext leading-relaxed font-sans select-text",
									children: activeResume.summary
								})]
							}),
							activeResume.sections_found && activeResume.sections_found.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-xs uppercase tracking-wider font-bold text-cream",
									children: "Parsed Sections"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-1.5",
									children: activeResume.sections_found.map((section, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "bg-white/5 border border-cardborder/40 text-cream px-2 py-0.5 rounded text-[10px] uppercase font-mono",
										children: section
									}, idx))
								})]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-card border border-dashed border-cardborder/60 p-8 text-center bg-darkbg/20",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
								size: 32,
								className: "mx-auto text-mutedtext mb-3 opacity-30"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold text-cream mb-1",
								children: "No Active Resume"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-mutedtext max-w-xs mx-auto",
								children: [
									"Upload your resume in the ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Hunt" }),
									" tab. The AI will chunk and parse it for matching roles."
								]
							})
						]
					})]
				})]
			})
		]
	});
}
//#endregion
export { ProfilePage as component };
