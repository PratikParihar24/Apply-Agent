import { i as __toESM } from "../_runtime.mjs";
import { a as getActiveResume, c as getHuntPreferences, d as sendApplication, f as startHunt, i as generateForCompany, m as uploadResume, u as getStatus } from "./client-D0aiy5F6.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { n as useAuth } from "./AuthContext-Dlw7MGTB.mjs";
import { t as ProtectedRoute } from "./ProtectedRoute-W1osNBCA.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as Bold, f as List, p as Italic, t as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hunt-eibONViJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RichTextEditor({ value, onChange, placeholder, className = "", minHeight = "150px" }) {
	const editorRef = (0, import_react.useRef)(null);
	const [isFocused, setIsFocused] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (editorRef.current && document.activeElement !== editorRef.current) {
			if (editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value;
		}
	}, [value]);
	const handleInput = () => {
		if (editorRef.current) onChange(editorRef.current.innerHTML);
	};
	const execCommand = (command, arg) => {
		document.execCommand(command, false, arg);
		editorRef.current?.focus();
		handleInput();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `relative flex flex-col rounded-card border ${isFocused ? "border-sage ring-1 ring-sage" : "border-cardborder"} bg-darkbg overflow-hidden transition-all ${className}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1 border-b border-cardborder bg-cardbg px-2 py-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onMouseDown: (e) => {
							e.preventDefault();
							execCommand("bold");
						},
						className: "p-1.5 rounded hover:bg-white/10 text-mutedtext hover:text-cream transition-colors",
						title: "Bold",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bold, { size: 14 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onMouseDown: (e) => {
							e.preventDefault();
							execCommand("italic");
						},
						className: "p-1.5 rounded hover:bg-white/10 text-mutedtext hover:text-cream transition-colors",
						title: "Italic",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Italic, { size: 14 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-px h-4 bg-cardborder mx-1" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onMouseDown: (e) => {
							e.preventDefault();
							execCommand("insertUnorderedList");
						},
						className: "p-1.5 rounded hover:bg-white/10 text-mutedtext hover:text-cream transition-colors",
						title: "Bullet List",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { size: 14 })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: editorRef,
				contentEditable: true,
				onInput: handleInput,
				onFocus: () => setIsFocused(true),
				onBlur: () => setIsFocused(false),
				className: "p-3 text-sm text-cream/90 focus:outline-none prose prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-sm max-w-none",
				style: { minHeight },
				dangerouslySetInnerHTML: { __html: value }
			}),
			!value && !isFocused && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute top-[42px] left-3 pointer-events-none text-mutedtext text-sm italic",
				children: placeholder
			})
		]
	});
}
function HuntPageWrapper() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HuntPage, {}) });
}
function ShimmerCard({ index }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			animation: "var(--animate-slide-in)",
			animationDelay: `${index * 150}ms`
		},
		className: "rounded-card border border-cardborder bg-cardbg p-4 space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "shimmer-bg h-4 w-1/2 rounded" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "shimmer-bg h-4 w-1/4 rounded" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "shimmer-bg h-3 w-full rounded" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "shimmer-bg h-3 w-5/6 rounded" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 pt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "shimmer-bg h-8 flex-1 rounded" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "shimmer-bg h-8 w-12 rounded" })]
			})
		]
	});
}
var emptyBrief = {
	resumeName: "",
	targetRole: "",
	seniority: "Senior",
	location: "",
	workMode: "Remote",
	salaryMin: "",
	keywords: "",
	notes: "",
	mode: "job_listings",
	companySize: "any",
	companyType: "any",
	writingStyle: "casual"
};
function HuntPage() {
	const { user } = useAuth();
	const [brief, setBrief] = (0, import_react.useState)(() => {
		const isClient = typeof window !== "undefined";
		return {
			...emptyBrief,
			targetRole: isClient ? localStorage.getItem("agentapply_hunt_role") || "" : "",
			location: isClient ? localStorage.getItem("agentapply_hunt_location") || "" : ""
		};
	});
	(0, import_react.useEffect)(() => {
		getActiveResume().then((res) => {
			if (res && res.filename) setBrief((prev) => ({
				...prev,
				resumeName: res.filename
			}));
		}).catch((e) => console.error("Failed to load active resume:", e));
		getHuntPreferences().then((prefs) => {
			if (prefs && Object.keys(prefs).length > 0) setBrief((prev) => ({
				...prev,
				targetRole: prefs.role || prev.targetRole,
				location: prefs.location || prev.location,
				mode: prefs.mode || prev.mode,
				companySize: prefs.company_size || prev.companySize,
				companyType: prefs.company_type || prev.companyType,
				writingStyle: prefs.writing_style || prev.writingStyle
			}));
		}).catch((e) => console.error("Failed to load preferences:", e));
	}, []);
	(0, import_react.useEffect)(() => {
		if (user?.preferences) setBrief((prev) => ({
			...prev,
			targetRole: prev.targetRole || user.preferences?.role || "",
			location: prev.location || user.preferences?.location || ""
		}));
	}, [user]);
	const [isStarting, setIsStarting] = (0, import_react.useState)(false);
	const [started, setStarted] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem("agentapply_hunt_started") === "true";
	});
	const [cards, setCards] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return [];
		const saved = localStorage.getItem("agentapply_hunt_state");
		if (saved) try {
			return JSON.parse(saved);
		} catch (e) {
			return [];
		}
		return [];
	});
	const [popupCardId, setPopupCardId] = (0, import_react.useState)(null);
	const [showResetModal, setShowResetModal] = (0, import_react.useState)(false);
	const indexRef = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		localStorage.setItem("agentapply_hunt_state", JSON.stringify(cards));
	}, [cards]);
	(0, import_react.useEffect)(() => {
		localStorage.setItem("agentapply_hunt_role", brief.targetRole);
		localStorage.setItem("agentapply_hunt_location", brief.location);
	}, [brief.targetRole, brief.location]);
	(0, import_react.useEffect)(() => {
		localStorage.setItem("agentapply_hunt_started", String(started));
	}, [started]);
	(0, import_react.useEffect)(() => {
		if (started) getStatus().then((res) => {
			if (!res.resume_ready) {
				setStarted(false);
				toast.error("Resume not ready, please complete setup.");
			}
		}).catch((e) => {
			toast.error(`Status check failed: ${e.message}`);
		});
	}, [started]);
	const updateCard = (id, patch) => setCards((prev) => prev.map((c) => String(c.id) === String(id) ? {
		...c,
		...patch
	} : c));
	const handleOpenPopup = (id) => {
		setPopupCardId(id);
	};
	const [preGenModal, setPreGenModal] = (0, import_react.useState)({
		id: "",
		open: false,
		instructions: ""
	});
	const handleOpenPreGenModal = (id) => {
		setPreGenModal({
			id,
			open: true,
			instructions: ""
		});
	};
	const handleGenerate = async () => {
		const { id, instructions } = preGenModal;
		setPreGenModal({
			id: "",
			open: false,
			instructions: ""
		});
		setPopupCardId(null);
		updateCard(id, { status: "generating" });
		try {
			const result = await generateForCompany(String(id), instructions || void 0);
			updateCard(id, {
				status: "ready",
				coverLetter: result.cover_letter || "",
				emailBody: result.email_body || "",
				resume: result.tailored_resume || "",
				subject: result.subject || "",
				llm_provider: result.llm_provider || "unknown"
			});
		} catch (error) {
			const e = error;
			toast.error(`Generation failed: ${e.message}`);
			updateCard(id, { status: "searching" });
		}
	};
	const handleSkip = (id) => setCards((prev) => prev.filter((c) => String(c.id) !== String(id)));
	const handleSend = async (id) => {
		const c = cards.find((x) => String(x.id) === String(id));
		if (!c) return;
		updateCard(id, { status: "sending" });
		try {
			const payload = {
				cover_letter: c.coverLetter,
				email_body: c.emailBody,
				subject: c.subject || "Application",
				tailored_resume: c.resume,
				recipient_email: "test@example.com"
			};
			const res = await sendApplication(String(id), payload);
			if (res.success) {
				updateCard(id, {
					status: "sent",
					sentAt: (/* @__PURE__ */ new Date()).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit"
					})
				});
				toast.success(`Application sent to ${c.name}!`);
			} else throw new Error(res.status || "Unknown error");
		} catch (error) {
			const e = error;
			toast.error(`Failed to send — check your email config: ${e.message}`);
			updateCard(id, { status: "ready" });
		}
	};
	const handleReset = () => {
		localStorage.removeItem("agentapply_hunt_state");
		localStorage.removeItem("agentapply_hunt_role");
		localStorage.removeItem("agentapply_hunt_location");
		localStorage.removeItem("agentapply_hunt_started");
		indexRef.current = 0;
		setCards([]);
		setStarted(false);
		setBrief(emptyBrief);
		setShowResetModal(false);
	};
	const handleStart = async () => {
		if (isStarting) return;
		setIsStarting(true);
		try {
			const res = await startHunt(brief.targetRole, brief.location || "Remote", 10, {
				mode: brief.mode,
				company_size: brief.companySize,
				company_type: brief.companyType,
				writing_style: brief.writingStyle
			}, (c) => {
				if (c.event === "company_enriched") {
					setCards((prev) => prev.map((card) => String(card.id) === String(c.company_id) ? {
						...card,
						website: c.website || card.website,
						hr_email: c.hr_email || card.hr_email,
						career_page: c.career_page || card.career_page,
						description: c.company_description || card.description,
						desc: c.company_description || card.desc
					} : card));
					return;
				}
				setCards((prev) => {
					if (prev.some((existing) => String(existing.id) === String(c.id))) return prev;
					return [...prev, {
						...c,
						status: "searching",
						coverLetter: "",
						emailBody: "",
						resume: "",
						role: c.job_title || c.role || "",
						desc: c.description || c.desc || ""
					}];
				});
			});
			setStarted(true);
			toast.success(`Hunt started! Job ID: ${res.job_id}`);
			setTimeout(() => {
				toast.success("Preferences saved", { duration: 2e3 });
			}, 200);
		} catch (error) {
			const e = error;
			toast.error(`Hunt failed to start: ${e.message}`);
			setStarted(false);
		} finally {
			setIsStarting(false);
		}
	};
	if (!started) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SetupForm, {
		brief,
		setBrief,
		onStart: handleStart,
		isStarting,
		onCancel: cards.length > 0 ? () => setStarted(true) : void 0
	});
	const searching = cards.filter((c) => c.status === "searching").sort((a, b) => b.score - a.score);
	const generating = cards.filter((c) => c.status === "generating");
	const ready = cards.filter((c) => c.status === "ready" || c.status === "sending");
	const sent = cards.filter((c) => c.status === "sent");
	const popupCard = popupCardId ? cards.find((c) => String(c.id) === String(popupCardId)) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-7xl px-4 py-10 sm:px-6 relative",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6 flex flex-wrap items-start justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-3xl font-extrabold text-cream",
							children: "My Hunt"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-mutedtext",
							children: [
								"Agents are hunting for",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-cream",
									children: brief.targetRole || "your role"
								}),
								brief.location && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									" ",
									"in ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-cream",
										children: brief.location
									})
								] }),
								" ",
								"· ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sand",
									children: brief.workMode
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-3",
						children: [started && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowResetModal(true),
							className: "rounded-card border border-cardborder px-3 py-2 text-xs font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:text-terracotta hover:border-terracotta btn-ripple",
							children: "New Hunt"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setStarted(false),
							className: "rounded-card border border-cardborder px-3 py-2 text-xs font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:text-cream btn-ripple",
							children: "Edit Brief"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefChips, { brief }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid grid-cols-1 gap-5 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Column, {
							title: "Searching",
							count: searching.length,
							accent: "terracotta",
							children: [
								searching.map((c, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobCard, {
									card: c,
									onReview: handleOpenPopup,
									onSkip: handleSkip,
									index
								}, c.id)),
								started && cards.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShimmerCard, { index: 0 }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShimmerCard, { index: 1 }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShimmerCard, { index: 2 })
								] }),
								searching.length === 0 && (!started || cards.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyHint, { text: "Scouting roles for you…" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Column, {
							title: "Generating",
							count: generating.length,
							accent: "sand",
							children: [generating.map((c, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GeneratingCard, {
								card: c,
								onSkip: handleSkip,
								index
							}, c.id)), generating.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyHint, { text: "Drafts will appear here." })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Column, {
							title: "Ready to Send",
							count: ready.length,
							accent: "sage",
							children: [ready.map((c, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadyCard, {
								card: c,
								onSend: handleSend,
								onUpdate: updateCard,
								onSkip: handleSkip,
								onOpenPopup: handleOpenPopup,
								index
							}, c.id)), ready.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyHint, { text: "Reviewed applications land here." })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Column, {
							title: "Sent",
							count: sent.length,
							accent: "sage",
							children: [sent.map((c, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SentCard, {
								card: c,
								index
							}, c.id)), sent.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyHint, { text: "Sent applications land here." })]
						})
					]
				})
			]
		}),
		popupCard && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanyDetailPopup, {
			card: popupCard,
			onClose: () => setPopupCardId(null),
			onGenerate: () => handleOpenPreGenModal(popupCard.id),
			onSkip: () => {
				setPopupCardId(null);
				handleSkip(popupCard.id);
			}
		}),
		preGenModal.open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-[60] flex items-center justify-center bg-darkbg/80 p-4 backdrop-blur-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative w-full max-w-lg rounded-card border border-sage bg-cardbg p-6 shadow-[var(--shadow-glow-strong)]",
				style: { animation: "var(--animate-scale-in)" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-xl font-medium text-cream",
						children: "Custom AI Instructions"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-4 text-sm text-mutedtext",
						children: "(Optional) Tell the AI what specific experiences, skills, or tone you want it to highlight in this cover letter and email."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						autoFocus: true,
						rows: 4,
						placeholder: "e.g. Highlight my 5 years of Python experience, and mention my passion for their new AI product.",
						value: preGenModal.instructions,
						onChange: (e) => setPreGenModal({
							...preGenModal,
							instructions: e.target.value
						}),
						className: "mb-4 w-full rounded-card border border-cardborder bg-darkbg p-3 text-sm text-cream focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-end gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setPreGenModal({
								id: "",
								open: false,
								instructions: ""
							}),
							className: "rounded-card px-4 py-2 text-sm font-semibold text-mutedtext transition-colors hover:text-cream btn-ripple",
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: handleGenerate,
							className: "rounded-card bg-sage px-6 py-2 text-sm font-bold text-darkbg transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md btn-ripple",
							children: "Start Generation"
						})]
					})
				]
			})
		}),
		showResetModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-50 flex items-center justify-center bg-darkbg/80 p-4 backdrop-blur-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative w-full max-w-sm rounded-card border border-terracotta bg-cardbg p-6 shadow-[var(--shadow-glow)] text-center",
				style: { animation: "var(--animate-slide-in)" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold text-cream mb-2",
						children: "Start a New Hunt?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-mutedtext mb-6",
						children: "This will clear your current search and all generated drafts. Do you want to continue?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowResetModal(false),
							className: "flex-1 rounded-card border border-cardborder px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:border-terracotta hover:text-cream btn-ripple",
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: handleReset,
							className: "flex-1 rounded-card bg-terracotta px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-darkbg transition-colors hover:bg-opacity-90 btn-ripple",
							children: "Yes, Clear It"
						})]
					})
				]
			})
		})
	] });
}
function SetupForm({ brief, setBrief, onStart, onCancel, isStarting = false }) {
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const set = (k, v) => setBrief({
		...brief,
		[k]: v
	});
	const onFile = async (e) => {
		const f = e.target.files?.[0];
		if (!f) return;
		if (f.size > 5 * 1024 * 1024) {
			toast.error("Resume must be under 5MB");
			return;
		}
		setUploading(true);
		try {
			await uploadResume(f);
			set("resumeName", f.name);
			toast.success(`Resume uploaded: ${f.name}`);
		} catch (err) {
			const error = err;
			toast.error(error.message);
		} finally {
			setUploading(false);
		}
	};
	const canStart = brief.resumeName && brief.targetRole.trim() && !uploading;
	const submit = async () => {
		if (!canStart) {
			toast.error("Upload a resume and add a target role to start");
			return;
		}
		onStart();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-3xl px-4 py-12 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full border border-cardborder bg-cardbg px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-sand",
					children: "Step 1 · Brief"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 text-3xl font-extrabold text-cream sm:text-4xl",
					children: "Tell the agents what you're hunting for."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-mutedtext",
					children: "The more honest the brief, the warmer the match. Nothing here leaves your browser."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5 rounded-column border border-cardborder bg-cardbg p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Resume" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "group flex cursor-pointer items-center justify-between gap-3 rounded-card border border-dashed border-cardborder bg-darkbg px-4 py-5 transition-colors hover:border-terracotta hover:bg-cardbg-hover",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-semibold text-cream",
								children: brief.resumeName || "Upload your resume"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 text-xs text-mutedtext",
								children: "PDF, DOC, or DOCX · up to 5MB"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0 rounded-card border border-terracotta px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-terracotta group-hover:bg-terracotta group-hover:text-darkbg",
							children: uploading ? "Uploading..." : brief.resumeName ? "Replace" : "Choose file"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: ".pdf,.doc,.docx",
							className: "hidden",
							onChange: onFile,
							disabled: uploading
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Hunt Mode" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => set("mode", "job_listings"),
						className: `rounded-card py-4 px-6 text-sm font-bold flex flex-col items-center justify-center border transition-all duration-200 btn-ripple ${brief.mode === "job_listings" ? "bg-terracotta/10 border-terracotta text-terracotta shadow-[var(--shadow-glow)]" : "bg-darkbg border-cardborder text-mutedtext hover:text-cream hover:border-cream/40"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xl mb-1",
							children: "🔍"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Find Job Listings" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => set("mode", "cold_outreach"),
						className: `rounded-card py-4 px-6 text-sm font-bold flex flex-col items-center justify-center border transition-all duration-200 btn-ripple ${brief.mode === "cold_outreach" ? "bg-terracotta/10 border-terracotta text-terracotta shadow-[var(--shadow-glow)]" : "bg-darkbg border-cardborder text-mutedtext hover:text-cream hover:border-cream/40"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xl mb-1",
							children: "🏢"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Cold Outreach" })]
					})]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-5 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Target role" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: brief.targetRole,
							onChange: (v) => set("targetRole", v),
							placeholder: "Full Stack Developer"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Seniority" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: brief.seniority,
							onChange: (v) => set("seniority", v),
							options: [
								"Junior",
								"Mid",
								"Senior",
								"Staff",
								"Principal",
								"Director"
							]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Location" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: brief.location,
							onChange: (v) => set("location", v),
							placeholder: "Bangalore, Mumbai, or Remote"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Work mode" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: brief.workMode,
							onChange: (v) => set("workMode", v),
							options: [
								"Remote",
								"Hybrid",
								"Onsite",
								"Any"
							]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Minimum salary (optional)" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: brief.salaryMin,
								onChange: (v) => set("salaryMin", v),
								placeholder: "₹6,00,000"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-mutedtext",
								children: "Salary in INR (e.g. ₹6,00,000 per annum)"
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Keywords / skills" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: brief.keywords,
							onChange: (v) => set("keywords", v),
							placeholder: "design systems, Figma, React"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Company Size (optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: brief.companySize,
							onChange: (e) => set("companySize", e.target.value),
							className: "w-full appearance-none rounded-card border border-cardborder bg-darkbg px-4 py-3 text-sm text-cream focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "any",
									children: "Any"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "startup",
									children: "Startup (1-50)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "mid",
									children: "Mid-size (50-500)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "enterprise",
									children: "Enterprise (500+)"
								})
							]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Company Type (optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: brief.companyType,
							onChange: (e) => set("companyType", e.target.value),
							className: "w-full appearance-none rounded-card border border-cardborder bg-darkbg px-4 py-3 text-sm text-cream focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "any",
									children: "Any"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "product",
									children: "Product"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "service",
									children: "Service"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "startup",
									children: "Startup"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "mnc",
									children: "MNC"
								})
							]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sm:col-span-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Writing Style" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: brief.writingStyle,
									onChange: (e) => set("writingStyle", e.target.value),
									className: "w-full appearance-none rounded-card border border-cardborder bg-darkbg px-4 py-3 text-sm text-cream focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "casual",
											children: "Casual"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "formal",
											children: "Formal"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "assertive",
											children: "Assertive"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1.5 text-xs text-mutedtext italic",
									children: [
										brief.writingStyle === "casual" && "Casual: Friendly and direct — reads like a human wrote it",
										brief.writingStyle === "formal" && "Formal: Professional and structured — suits corporate roles",
										brief.writingStyle === "assertive" && "Assertive: Confident and bold — leads with achievements"
									]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "What makes a role a yes for you?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					rows: 3,
					value: brief.notes,
					onChange: (e) => set("notes", e.target.value),
					placeholder: "Small team, climate-positive, mentor I can learn from…",
					className: "w-full resize-none rounded-card border border-cardborder bg-darkbg px-4 py-3 text-sm text-cream placeholder:text-mutedtext focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-4",
					children: [onCancel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onCancel,
						className: "w-1/3 rounded-card border border-cardborder px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-mutedtext transition-all hover:text-cream hover:border-terracotta btn-ripple",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: submit,
						disabled: !canStart || isStarting,
						className: `${onCancel ? "w-2/3" : "w-full"} rounded-card bg-terracotta px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-darkbg transition-all hover:scale-[1.01] hover:shadow-[var(--shadow-glow-strong)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none btn-ripple`,
						children: isStarting ? "Starting..." : onCancel ? "Add to Hunt →" : "Start the Hunt →"
					})]
				})
			]
		})]
	});
}
function Label({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: "mb-2 block text-xs font-bold uppercase tracking-wider text-mutedtext",
		children
	});
}
function Input({ value, onChange, placeholder }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		value,
		onChange: (e) => onChange(e.target.value),
		placeholder,
		className: "w-full rounded-card border border-cardborder bg-darkbg px-4 py-3 text-sm text-cream placeholder:text-mutedtext focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40"
	});
}
function Select({ value, onChange, options }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		value,
		onChange: (e) => onChange(e.target.value),
		className: "w-full appearance-none rounded-card border border-cardborder bg-darkbg px-4 py-3 text-sm text-cream focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40",
		children: options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: o,
			children: o
		}, o))
	});
}
function BriefChips({ brief }) {
	const chips = [
		brief.resumeName && `📄 ${brief.resumeName}`,
		brief.seniority,
		brief.salaryMin && `min ${brief.salaryMin}`,
		brief.keywords
	].filter(Boolean);
	if (chips.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-2",
		children: chips.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "rounded-full border border-cardborder bg-cardbg px-3 py-1 text-xs text-mutedtext",
			children: c
		}, c))
	});
}
function Column({ title, count, accent, children }) {
	const dot = {
		terracotta: "bg-terracotta",
		sand: "bg-sand",
		sage: "bg-sage"
	}[accent];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-column border border-cardborder bg-cardbg/40 p-4 backdrop-blur-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mb-4 flex items-center justify-between px-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2 w-2 rounded-full ${dot}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-bold uppercase tracking-[0.2em] text-cream",
					children: title
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded-full border border-cardborder bg-darkbg px-2.5 py-0.5 text-xs font-semibold text-mutedtext",
				children: count
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-3",
			children
		})]
	});
}
function EmptyHint({ text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-card border border-dashed border-cardborder p-6 text-center text-xs text-mutedtext",
		children: text
	});
}
function ScoreBadge({ score }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: `rounded-full px-2.5 py-0.5 text-xs font-semibold ${score >= 85 ? "text-sage bg-sage/10" : score >= 75 ? "text-sand bg-sand/10" : "text-terracotta bg-terracotta/10"}`,
		children: [score, "% match"]
	});
}
function JobCard({ card, onReview, onSkip, index }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		style: {
			animation: "var(--animate-slide-in)",
			animationDelay: `${index * 100}ms`
		},
		className: "group relative rounded-card border border-cardborder bg-cardbg p-4 hover-card-trigger hover:bg-cardbg-hover",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => onSkip(card.id),
				className: "absolute top-4 right-4 text-mutedtext hover:text-cream opacity-0 group-hover:opacity-100 transition-opacity",
				title: "Skip role",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-start justify-between gap-2 pr-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "truncate font-bold text-cream",
						children: card.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-xs text-mutedtext",
						children: card.role
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreBadge, { score: card.score })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "line-clamp-2 text-sm text-mutedtext",
				children: card.desc
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onReview(card.id),
					className: "flex-1 rounded-card border border-terracotta px-3 py-2 text-xs font-bold uppercase tracking-wider text-terracotta transition-all hover:bg-terracotta hover:text-darkbg btn-ripple",
					children: "Review"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onSkip(card.id),
					className: "rounded-card px-3 py-2 text-xs font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:text-cream btn-ripple",
					children: "Skip"
				})]
			})
		]
	});
}
function GeneratingCard({ card, onSkip, index }) {
	const [progress, setProgress] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const start = Date.now();
		const id = setInterval(() => {
			const pct = Math.min(100, (Date.now() - start) / 5e3 * 100);
			setProgress(pct);
			if (pct >= 100) clearInterval(id);
		}, 80);
		return () => clearInterval(id);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		style: {
			animation: "var(--animate-slide-in)",
			animationDelay: `${index * 100}ms`
		},
		className: "group relative rounded-card border border-cardborder bg-cardbg p-4 hover-card-trigger hover:bg-cardbg-hover",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => onSkip(card.id),
				className: "absolute top-4 right-4 text-mutedtext hover:text-cream opacity-0 group-hover:opacity-100 transition-opacity",
				title: "Abort generation",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-start justify-between gap-2 pr-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "truncate font-bold text-cream",
						children: card.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-xs text-mutedtext",
						children: card.role
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreBadge, { score: card.score })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "shimmer-bg mb-2 h-3 w-3/4 rounded" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "shimmer-bg mb-2 h-3 w-full rounded" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "shimmer-bg mb-4 h-3 w-2/3 rounded" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-xs uppercase tracking-wider text-mutedtext",
				children: "Generating your content…"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-1.5 w-full overflow-hidden rounded-full bg-darkbg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full rounded-full bg-terracotta transition-[width] duration-150 ease-linear",
					style: { width: `${progress}%` }
				})
			})
		]
	});
}
function ReadyCard({ card, onSend, onUpdate, onSkip, onOpenPopup, index }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [showResume, setShowResume] = (0, import_react.useState)(false);
	const [showBanner, setShowBanner] = (0, import_react.useState)(true);
	const isSent = card.status === "sent";
	const isSending = card.status === "sending";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		style: {
			animation: isSent ? "var(--animate-scale-out)" : "var(--animate-slide-in)",
			animationDelay: isSent ? "0ms" : `${index * 100}ms`
		},
		className: "rounded-card border border-sage/70 bg-cardbg p-4 hover-card-trigger hover:bg-cardbg-hover",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => setOpen((o) => !o),
			className: "flex w-full items-start justify-between gap-2 text-left",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1 flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-sage/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sage",
								children: "Ready"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreBadge, { score: card.score }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: (e) => {
									e.stopPropagation();
									onOpenPopup(card.id);
								},
								className: "p-1 rounded hover:bg-darkbg text-mutedtext hover:text-cream transition-colors",
								title: "Review Company",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
									className: "w-3.5 h-3.5",
									fill: "none",
									stroke: "currentColor",
									viewBox: "0 0 24 24",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										strokeLinecap: "round",
										strokeLinejoin: "round",
										strokeWidth: 2,
										d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										strokeLinecap: "round",
										strokeLinejoin: "round",
										strokeWidth: 2,
										d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									})]
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "truncate font-bold text-cream",
						children: card.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-xs text-mutedtext",
						children: card.role
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-mutedtext",
				children: open ? "−" : "+"
			})]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 space-y-4 border-t border-cardborder pt-4",
			children: [
				showBanner && card.llm_provider && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LLMBanner, {
					provider: card.llm_provider,
					onDismiss: () => {
						setShowBanner(false);
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-xs font-bold uppercase tracking-wider text-mutedtext px-1",
						children: "Cover Letter"
					}), editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichTextEditor, {
						value: card.coverLetter,
						onChange: (v) => onUpdate(card.id, { coverLetter: v }),
						minHeight: "200px"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-card border border-cardborder bg-darkbg p-3 text-sm text-cream/90 prose prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-sm max-w-none",
						dangerouslySetInnerHTML: { __html: card.coverLetter }
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-xs font-bold uppercase tracking-wider text-mutedtext px-1",
						children: "Email Body"
					}), editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichTextEditor, {
						value: card.emailBody,
						onChange: (v) => onUpdate(card.id, { emailBody: v }),
						minHeight: "100px"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-card border border-cardborder bg-darkbg p-3 text-sm text-cream/90 prose prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-sm max-w-none",
						dangerouslySetInnerHTML: { __html: card.emailBody }
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-card border border-cardborder",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setShowResume((s) => !s),
						className: "flex w-full items-center justify-between px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-mutedtext",
						children: ["Tailored Resume Preview", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: showResume ? "−" : "+" })]
					}), showResume && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "whitespace-pre-wrap border-t border-cardborder px-3 py-3 text-xs text-cream/90",
						children: card.resume
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setEditing((e) => !e),
							className: "rounded-card border border-terracotta px-3 py-2 text-xs font-bold uppercase tracking-wider text-terracotta transition-colors hover:bg-terracotta hover:text-darkbg btn-ripple",
							children: editing ? "Done" : "Edit"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onSkip(card.id),
							className: "rounded-card px-3 py-2 text-xs font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:text-cream btn-ripple",
							children: "Discard"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onSend(card.id),
							disabled: isSent || isSending,
							className: "flex-1 rounded-card bg-terracotta px-3 py-2 text-xs font-bold uppercase tracking-wider text-darkbg transition-all hover:shadow-[var(--shadow-glow-strong)] disabled:opacity-50 btn-ripple",
							children: isSent ? "Sent ✓" : isSending ? "Sending..." : "Send"
						})
					]
				})
			]
		})]
	});
}
function SentCard({ card, index }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		style: {
			animation: "var(--animate-slide-in)",
			animationDelay: `${index * 100}ms`
		},
		className: "rounded-card border border-sage/40 bg-cardbg p-4 opacity-80",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "truncate font-bold text-cream",
					children: card.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-xs text-mutedtext",
					children: card.role
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded-full bg-sage/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sage",
				children: "Sent ✓"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-xs text-mutedtext",
			children: ["Sent at ", card.sentAt]
		})]
	});
}
function LLMBanner({ provider, onDismiss }) {
	if (!provider || provider === "unknown") return null;
	const colors = {
		gemini: "bg-blue-500/10 border-blue-500/30 text-blue-400",
		groq: "bg-orange-500/10 border-orange-500/30 text-orange-400",
		openrouter: "bg-purple-500/10 border-purple-500/30 text-purple-400",
		ollama: "bg-gray-500/10 border-gray-500/30 text-gray-400",
		none: "bg-red-500/10 border-red-500/30 text-red-400"
	};
	const colorClass = colors[provider] || colors.none;
	const displayName = provider.charAt(0).toUpperCase() + provider.slice(1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `flex items-center justify-between px-3 py-2 rounded mb-3 border ${colorClass} text-xs font-medium`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["✨ Written by ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: displayName })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: onDismiss,
			className: "hover:opacity-70",
			children: "✕"
		})]
	});
}
function CompanyDetailPopup({ card, onClose, onGenerate, onSkip }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-darkbg/80 p-4 backdrop-blur-sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-card border border-terracotta bg-cardbg p-6 shadow-[var(--shadow-glow)]",
			style: { animation: "var(--animate-slide-in)" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-mutedtext transition-colors hover:bg-cardbg-hover hover:text-cream",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
						className: "w-5 h-5",
						fill: "none",
						stroke: "currentColor",
						viewBox: "0 0 24 24",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							strokeLinecap: "round",
							strokeLinejoin: "round",
							strokeWidth: 2,
							d: "M10 19l-7-7m0 0l7-7m-7 7h18"
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 mb-4 flex items-start justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl font-bold text-cream",
							children: card.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-terracotta mt-1",
							children: card.role
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreBadge, { score: card.score })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-6 rounded-column bg-darkbg p-4 text-sm text-mutedtext leading-relaxed whitespace-pre-wrap",
					children: card.desc || "No description provided."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6 grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-column border border-cardborder p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "mb-2 text-xs font-bold uppercase tracking-wider text-sand",
							children: "HR Contact"
						}), card.hr_email ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: `mailto:${card.hr_email}`,
								className: "text-sm text-terracotta hover:underline font-semibold break-all",
								children: card.hr_email
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									navigator.clipboard.writeText(card.hr_email);
									toast.success("Email copied!");
								},
								className: "p-1 rounded bg-darkbg text-mutedtext hover:text-cream transition-colors",
								title: "Copy email",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
									className: "w-4 h-4",
									fill: "none",
									stroke: "currentColor",
									viewBox: "0 0 24 24",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										strokeLinecap: "round",
										strokeLinejoin: "round",
										strokeWidth: 2,
										d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									})
								})
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-mutedtext italic",
							children: "Not found in search results"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-column border border-cardborder p-4 flex flex-col gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "mb-1 text-xs font-bold uppercase tracking-wider text-sand",
								children: "Ways to Apply"
							}),
							card.website && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: card.website,
								target: "_blank",
								rel: "noreferrer",
								className: "text-sm text-cream hover:text-terracotta transition-colors flex items-center gap-1 w-fit",
								children: "Visit Company Website ↗"
							}),
							(card.apply_url || card.url) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: card.apply_url || card.url,
								target: "_blank",
								rel: "noreferrer",
								className: "text-sm text-mutedtext hover:text-cream transition-colors flex items-center gap-1 w-fit",
								children: "View Job Posting ↗"
							}),
							!card.website && !card.apply_url && !card.url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-mutedtext",
								children: "No source URL provided."
							})
						]
					})]
				}),
				!card.hr_email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-mutedtext text-center italic mb-4",
					children: "No direct email found — you can still generate content and apply via the posting."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-end gap-3 mt-4 pt-4 border-t border-cardborder",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onSkip,
						className: "rounded-card border border-cardborder px-4 py-2 text-sm font-semibold uppercase tracking-wider text-mutedtext transition-colors hover:border-terracotta hover:text-terracotta btn-ripple",
						children: "Discard"
					}), card.status !== "ready" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onGenerate,
						className: "rounded-card bg-terracotta px-6 py-2 text-sm font-bold uppercase tracking-wider text-darkbg transition-colors hover:bg-opacity-90 btn-ripple",
						children: card.hr_email ? "Generate Email & Apply" : "Generate & Apply"
					})]
				})
			]
		})
	});
}
//#endregion
export { HuntPageWrapper as component };
