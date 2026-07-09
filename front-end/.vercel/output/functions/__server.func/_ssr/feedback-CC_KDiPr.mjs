import { i as __toESM } from "../_runtime.mjs";
import { t as apiCall } from "./apiClient-D7buwDVF.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { N as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/feedback-CC_KDiPr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Feedback() {
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [message, setMessage] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const navigate = useNavigate();
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!message.trim()) {
			toast.error("Please enter a message");
			return;
		}
		setLoading(true);
		try {
			await apiCall("/api/feedback", {
				method: "POST",
				body: JSON.stringify({
					name,
					email,
					message
				})
			});
			toast.success("Thank you! Your feedback has been received.");
			setName("");
			setEmail("");
			setMessage("");
			navigate({ to: "/" });
		} catch (err) {
			console.log("Feedback submitted locally:", {
				name,
				email,
				message
			});
			toast.success("Thank you! Your feedback has been received.");
			navigate({ to: "/" });
		} finally {
			setLoading(false);
		}
	};
	const field = "mt-2 w-full rounded-card border border-cardborder bg-darkbg p-3 text-sm text-cream placeholder:text-mutedtext/40 transition-colors focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col justify-center px-6 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-card border border-cardborder bg-cardbg p-8 shadow-[var(--shadow-glow)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-extrabold text-cream",
					children: "Share Feedback"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs uppercase tracking-widest text-mutedtext",
					children: "Help us refine the hunt"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleSubmit,
				className: "mt-8 space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-xs uppercase tracking-wider text-mutedtext",
						children: "Name"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: name,
						onChange: (e) => setName(e.target.value),
						placeholder: "Your name",
						className: field
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-xs uppercase tracking-wider text-mutedtext",
						children: "Email Address"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "email",
						value: email,
						onChange: (e) => setEmail(e.target.value),
						placeholder: "you@example.com",
						className: field
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-xs uppercase tracking-wider text-mutedtext",
						children: ["Message ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-terracotta",
							children: "*"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: message,
						onChange: (e) => setMessage(e.target.value),
						placeholder: "What can we improve?",
						required: true,
						rows: 4,
						className: field
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						disabled: loading,
						className: "w-full rounded-card bg-terracotta py-3.5 text-sm font-bold uppercase tracking-wider text-darkbg shadow-[var(--shadow-glow)] transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 btn-ripple",
						children: loading ? "Sending..." : "Submit Feedback"
					})
				]
			})]
		})
	});
}
//#endregion
export { Feedback as component };
