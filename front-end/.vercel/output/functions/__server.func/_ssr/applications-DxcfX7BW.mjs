import { i as __toESM } from "../_runtime.mjs";
import { n as deleteApplication, p as updateApplicationStatus, s as getApplications, t as checkReplies } from "./client-D0aiy5F6.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { t as ProtectedRoute } from "./ProtectedRoute-W1osNBCA.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as CircleCheckBig, O as CircleAlert, S as Calendar, T as OctagonX, d as Mail, g as Eye, h as FileText, i as Trash2, l as RefreshCw, t as X, v as ExternalLink, w as Sparkles, y as Cpu } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/applications-DxcfX7BW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ApplicationsPageWrapper() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApplicationsPage, {}) });
}
var statusBadges = {
	applied: {
		bg: "bg-mutedtext/10 text-mutedtext border-mutedtext/20 dark:bg-white/10 dark:text-white/80 dark:border-white/10",
		label: "Applied",
		icon: Mail
	},
	viewed: {
		bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
		label: "Viewed",
		icon: Eye
	},
	replied: {
		bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
		label: "Replied",
		icon: CircleAlert
	},
	interview: {
		bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
		label: "Interviewing",
		icon: CircleCheckBig
	},
	rejected: {
		bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
		label: "Rejected",
		icon: OctagonX
	},
	failed: {
		bg: "bg-red-500/15 text-red-600 dark:text-red-500 border-red-500/20",
		label: "Failed",
		icon: OctagonX
	}
};
function ApplicationsPage() {
	const [applications, setApplications] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [polling, setPolling] = (0, import_react.useState)(false);
	const [deletingId, setDeletingId] = (0, import_react.useState)(null);
	const [selectedApp, setSelectedApp] = (0, import_react.useState)(null);
	const fetchApps = async (silent = false) => {
		if (!silent) setLoading(true);
		try {
			const data = await getApplications();
			setApplications(data);
			if (selectedApp) {
				const updated = data.find((a) => a._id === selectedApp._id);
				if (updated) setSelectedApp(updated);
			}
		} catch (e) {
			toast.error(`Failed to fetch applications: ${e.message || e}`);
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		fetchApps();
	}, []);
	const handleStatusChange = async (appId, companyId, newStatus) => {
		try {
			await updateApplicationStatus(companyId || appId, newStatus);
			toast.success("Status updated successfully");
			const nowIso = (/* @__PURE__ */ new Date()).toISOString();
			setApplications((prev) => prev.map((app) => app._id === appId ? {
				...app,
				status: newStatus,
				last_updated: nowIso,
				status_history: app.status_history ? [...app.status_history, {
					status: newStatus,
					timestamp: nowIso,
					source: "manual"
				}] : [{
					status: newStatus,
					timestamp: nowIso,
					source: "manual"
				}]
			} : app));
			setSelectedApp((prev) => prev && prev._id === appId ? {
				...prev,
				status: newStatus,
				last_updated: nowIso,
				status_history: prev.status_history ? [...prev.status_history, {
					status: newStatus,
					timestamp: nowIso,
					source: "manual"
				}] : [{
					status: newStatus,
					timestamp: nowIso,
					source: "manual"
				}]
			} : prev);
		} catch (e) {
			toast.error(`Failed to update status: ${e.message || e}`);
		}
	};
	const handleDelete = async (appId) => {
		const originalApplications = [...applications];
		setApplications((prev) => prev.filter((app) => app._id !== appId));
		setDeletingId(null);
		if (selectedApp?._id === appId) setSelectedApp(null);
		try {
			await deleteApplication(appId);
			toast.success("Application deleted");
		} catch (e) {
			setApplications(originalApplications);
			toast.error(`Failed to delete application: ${e.message || e}`);
		}
	};
	const handleCheckReplies = async () => {
		setPolling(true);
		const promise = checkReplies();
		toast.promise(promise, {
			loading: "Connecting to Gmail and scanning replies...",
			success: () => {
				setPolling(false);
				fetchApps(true);
				return "IMAP reply check completed!";
			},
			error: (err) => {
				setPolling(false);
				return `IMAP check failed: ${err.message || err}`;
			}
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-7xl px-4 py-10 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-4 mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-extrabold text-cream",
					children: "Application History"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-mutedtext",
					children: "Track and manage your sent job applications in real-time."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleCheckReplies,
					disabled: polling || loading,
					className: "flex items-center gap-2 rounded-card bg-terracotta px-4 py-2 text-xs font-bold uppercase tracking-wider text-darkbg hover:opacity-90 disabled:opacity-50 transition-opacity btn-ripple",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
						size: 14,
						className: polling ? "animate-spin" : ""
					}), "Check for Replies"]
				})]
			}),
			loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4",
				children: [
					1,
					2,
					3
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "animate-pulse rounded-card border border-cardborder bg-cardbg p-5 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 w-1/3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 bg-white/10 rounded w-3/4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 bg-white/10 rounded w-1/2" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 bg-white/10 rounded w-24" })]
				}, i))
			}) : applications.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-column border border-dashed border-cardborder p-12 text-center max-w-md mx-auto mt-12 bg-cardbg/40 backdrop-blur-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, {
						size: 40,
						className: "mx-auto text-mutedtext mb-4 opacity-40"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-lg font-bold text-cream mb-1",
						children: "No Applications Yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-mutedtext mb-6",
						children: "Send your first application from your active hunt to see history and track pipeline updates."
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-hidden rounded-column border border-cardborder bg-cardbg/40 backdrop-blur-sm shadow-xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden md:block overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left border-collapse",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-cardborder bg-darkbg/40 text-[10px] font-bold uppercase tracking-wider text-mutedtext",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-4",
									children: "Company"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-4",
									children: "Role"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-4",
									children: "Applied"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-4",
									children: "AI Model"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-4",
									children: "Status"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-4 text-right",
									children: "Actions"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "divide-y divide-cardborder/40 text-sm text-mutedtext",
							children: applications.map((app) => {
								const badge = statusBadges[app.status] || statusBadges.applied;
								const Icon = badge.icon;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "hover:bg-white/[0.02] transition-colors",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-6 py-4 font-bold text-cream",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => setSelectedApp(app),
												className: "hover:underline text-left font-bold text-cream focus:outline-none transition-all hover:text-terracotta",
												children: app.company_name
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-6 py-4",
											children: app.job_title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-6 py-4 text-xs",
											children: new Date(app.applied_at).toLocaleDateString(void 0, {
												month: "short",
												day: "numeric",
												year: "numeric"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-6 py-4 text-xs font-semibold capitalize text-sand",
											children: app.llm_provider || "N/A"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-6 py-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.bg}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 12 }), badge.label]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-6 py-4 text-right",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-end gap-3",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => setSelectedApp(app),
														className: "text-mutedtext hover:text-cream transition-colors p-1",
														title: "View details",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 16 })
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
														value: app.status,
														onChange: (e) => handleStatusChange(app._id, app.company_id, e.target.value),
														className: "rounded-card border border-cardborder bg-darkbg text-xs text-cream px-2.5 py-1 focus:border-terracotta focus:outline-none transition-colors",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "applied",
																children: "Applied"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "viewed",
																children: "Viewed"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "replied",
																children: "Replied"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "interview",
																children: "Interviewing"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "rejected",
																children: "Rejected"
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => setDeletingId(app._id),
														className: "text-mutedtext hover:text-red-500 transition-colors p-1",
														title: "Delete record",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 16 })
													})
												]
											})
										})
									]
								}, app._id);
							})
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "md:hidden divide-y divide-cardborder/40",
					children: applications.map((app) => {
						const badge = statusBadges[app.status] || statusBadges.applied;
						const Icon = badge.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-5 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-cream text-base",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => setSelectedApp(app),
											className: "hover:underline text-left font-bold text-cream focus:outline-none transition-all hover:text-terracotta",
											children: app.company_name
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-mutedtext",
										children: app.job_title
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.bg}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 12 }), badge.label]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-xs text-mutedtext",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Applied: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-cream",
										children: new Date(app.applied_at).toLocaleDateString()
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Model: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sand capitalize",
										children: app.llm_provider || "N/A"
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-3 pt-2 border-t border-cardborder/20",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => setSelectedApp(app),
										className: "flex items-center gap-1 text-xs text-mutedtext hover:text-cream transition-colors border border-cardborder px-3 py-1.5 rounded-card bg-darkbg",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 14 }), " View Details"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: app.status,
											onChange: (e) => handleStatusChange(app._id, app.company_id, e.target.value),
											className: "rounded-card border border-cardborder bg-darkbg text-xs text-cream px-3 py-1.5 focus:border-terracotta focus:outline-none transition-colors",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "applied",
													children: "Applied"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "viewed",
													children: "Viewed"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "replied",
													children: "Replied"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "interview",
													children: "Interviewing"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "rejected",
													children: "Rejected"
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => setDeletingId(app._id),
											className: "flex items-center gap-1 text-xs text-mutedtext hover:text-red-500 transition-colors border border-cardborder p-1.5 rounded-card bg-darkbg",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
										})]
									})]
								})
							]
						}, app._id);
					})
				})]
			}),
			selectedApp && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApplicationDetailsModal, {
				app: selectedApp,
				onClose: () => setSelectedApp(null),
				onStatusChange: (newStatus) => handleStatusChange(selectedApp._id, selectedApp.company_id, newStatus)
			}),
			deletingId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-darkbg/85 p-4 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-sm rounded-card border border-terracotta bg-cardbg p-6 shadow-[var(--shadow-glow)] text-center",
					style: { animation: "var(--animate-slide-in)" },
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-bold text-cream mb-2",
							children: "Delete Record?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-mutedtext mb-6",
							children: "This will permanently delete this application history record. This action cannot be undone."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setDeletingId(null),
								className: "flex-1 rounded-card border border-cardborder px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:border-terracotta hover:text-cream btn-ripple",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => handleDelete(deletingId),
								className: "flex-1 rounded-card bg-terracotta px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-darkbg transition-colors hover:bg-opacity-90 btn-ripple",
								children: "Delete"
							})]
						})
					]
				})
			})
		]
	});
}
function ApplicationDetailsModal({ app, onClose, onStatusChange }) {
	const [activeTab, setActiveTab] = (0, import_react.useState)("email");
	const getScoreColor = (score) => {
		if (!score) return "text-mutedtext border-cardborder bg-white/5";
		if (score >= 8.5) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
		if (score >= 7) return "text-amber-400 border-amber-500/30 bg-amber-500/5";
		return "text-rose-400 border-rose-500/30 bg-rose-500/5";
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-darkbg/90 p-4 backdrop-blur-md overflow-y-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full max-w-4xl rounded-column border border-cardborder bg-cardbg/95 shadow-2xl flex flex-col my-8 max-h-[85vh]",
			style: { animation: "var(--animate-slide-in)" },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between border-b border-cardborder/40 p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl font-extrabold text-cream leading-tight",
							children: app.company_name
						}), app.score && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: `inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${getScoreColor(app.score)}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 12 }),
								" Match Score: ",
								app.score,
								"/10"
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-base text-mutedtext flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-cream",
								children: app.job_title
							}),
							app.website && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: app.website,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "inline-flex items-center gap-1 text-xs text-terracotta hover:underline",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 12 }), " Website"]
							}),
							app.apply_url && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: app.apply_url,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "inline-flex items-center gap-1 text-xs text-terracotta hover:underline",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 12 }), " Apply Link"]
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "rounded-full p-1.5 text-mutedtext hover:bg-white/5 hover:text-cream transition-colors",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20 })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-1 space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-card border border-cardborder/40 bg-darkbg/40 p-4 space-y-3.5 text-xs text-mutedtext",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-center pb-2 border-b border-cardborder/20",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold uppercase tracking-wider text-mutedtext/70",
										children: "Application Details"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-semibold text-sand flex items-center gap-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { size: 12 }),
											" ",
											app.llm_provider || "Unknown"
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Applied On:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-cream font-medium flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { size: 12 }), new Date(app.applied_at).toLocaleDateString(void 0, {
											month: "short",
											day: "numeric",
											year: "numeric"
										})]
									})]
								}),
								app.hr_email && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Recipient:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-cream font-medium truncate max-w-[150px]",
										children: app.hr_email
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-1.5 pt-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold uppercase tracking-wider text-mutedtext/70",
										children: "Change Pipeline Status"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: app.status,
										onChange: (e) => onStatusChange(e.target.value),
										className: "w-full rounded-card border border-cardborder bg-darkbg text-xs text-cream px-3 py-2 focus:border-terracotta focus:outline-none transition-colors",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "applied",
												children: "Applied"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "viewed",
												children: "Viewed"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "replied",
												children: "Replied"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "interview",
												children: "Interviewing"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "rejected",
												children: "Rejected"
											})
										]
									})]
								})
							]
						}),
						app.fit_explanation && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-card border border-cardborder/40 bg-cardbg p-4 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
								className: "text-xs uppercase tracking-wider font-bold text-cream flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
									size: 14,
									className: "text-terracotta"
								}), " Why You Fit"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-mutedtext leading-relaxed",
								children: app.fit_explanation
							})]
						}),
						app.status === "failed" && app.message && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-card border border-red-500/20 bg-red-500/5 p-4 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
								className: "text-xs uppercase tracking-wider font-bold text-red-400 flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 14 }), " Send Failure Details"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-red-200/80 font-mono break-words",
								children: app.message
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "text-xs uppercase tracking-wider font-bold text-cream",
								children: "Activity History"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative border-l border-cardborder/40 pl-4 ml-2 space-y-4",
								children: [(app.status_history || []).map((h, i) => {
									const badge = statusBadges[h.status] || statusBadges.applied;
									const Icon = badge.icon;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `absolute -left-[23px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-cardborder bg-darkbg text-[8px] p-0.5 ${badge.bg}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 8 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1.5 font-bold text-cream",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "capitalize",
													children: h.status
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-[10px] text-mutedtext font-normal uppercase tracking-wider",
													children: ["via ", h.source === "auto_resend" ? "resend tracking" : h.source]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-mutedtext mt-0.5",
												children: new Date(h.timestamp).toLocaleString(void 0, {
													month: "short",
													day: "numeric",
													hour: "2-digit",
													minute: "2-digit"
												})
											})]
										})]
									}, i);
								}), (!app.status_history || app.status_history.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-mutedtext italic pl-2",
									children: "No historic events recorded."
								})]
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-2 flex flex-col h-[50vh] lg:h-auto min-h-[350px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex border-b border-cardborder/40 mb-4 overflow-x-auto",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveTab("email"),
							className: `px-4 py-2 text-xs uppercase tracking-wider font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "email" ? "border-terracotta text-cream bg-white/5" : "border-transparent text-mutedtext hover:text-cream"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { size: 14 }), " Email Message"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveTab("cover"),
							className: `px-4 py-2 text-xs uppercase tracking-wider font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "cover" ? "border-terracotta text-cream bg-white/5" : "border-transparent text-mutedtext hover:text-cream"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { size: 14 }), " Cover Letter"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 rounded-card border border-cardborder/40 bg-darkbg/60 p-4 overflow-y-auto text-xs text-mutedtext font-mono leading-relaxed select-text whitespace-pre-wrap",
						children: [activeTab === "email" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [app.subject && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pb-3 border-b border-cardborder/20",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] uppercase font-bold text-mutedtext/70 block mb-1",
									children: "Subject:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-cream font-bold text-sm",
									children: app.subject
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] uppercase font-bold text-mutedtext/70 block mb-2",
								children: "Message Body:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-sans text-cream text-sm leading-relaxed",
								children: app.email_body || "No email body archived."
							})] })]
						}), activeTab === "cover" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-sans text-cream text-sm leading-relaxed whitespace-pre-line",
							children: app.cover_letter || "No tailored cover letter was generated/archived for this application."
						})]
					})]
				})]
			})]
		})
	});
}
//#endregion
export { ApplicationsPageWrapper as component };
