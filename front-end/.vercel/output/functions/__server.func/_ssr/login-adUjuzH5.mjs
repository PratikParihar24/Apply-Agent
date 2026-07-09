import { i as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { n as useAuth } from "./AuthContext-Dlw7MGTB.mjs";
import { N as useNavigate, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-adUjuzH5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!email || !password) {
			toast.error("Please fill in all fields");
			return;
		}
		setLoading(true);
		try {
			await login(email, password);
			toast.success("Welcome back!");
			navigate({ to: "/hunt" });
		} catch (err) {
			toast.error(err.message || "Failed to log in");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto flex min-h-[calc(100vh-80px)] max-w-md flex-col justify-center px-6 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-card border border-cardborder bg-cardbg p-8 shadow-[var(--shadow-glow)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-3xl font-extrabold text-cream",
						children: "Welcome Back"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs uppercase tracking-widest text-mutedtext",
						children: "Enter the hunting ground"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSubmit,
					className: "mt-8 space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs uppercase tracking-wider text-mutedtext",
							children: "Email Address"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "email",
							value: email,
							onChange: (e) => setEmail(e.target.value),
							placeholder: "you@example.com",
							required: true,
							className: "mt-2 w-full rounded-card border border-cardborder bg-darkbg p-3 text-sm text-cream transition-colors placeholder:text-mutedtext/40 focus:border-terracotta focus:outline-none"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs uppercase tracking-wider text-mutedtext",
							children: "Password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "password",
							value: password,
							onChange: (e) => setPassword(e.target.value),
							placeholder: "••••••••",
							required: true,
							className: "mt-2 w-full rounded-card border border-cardborder bg-darkbg p-3 text-sm text-cream transition-colors placeholder:text-mutedtext/40 focus:border-terracotta focus:outline-none"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: loading,
							className: "w-full rounded-card bg-terracotta py-3.5 text-sm font-bold uppercase tracking-wider text-darkbg shadow-[var(--shadow-glow)] transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50",
							children: loading ? "Logging in..." : "Log In"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 text-center text-xs text-mutedtext",
					children: [
						"New seeker?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/register",
							className: "font-semibold text-terracotta hover:underline",
							children: "Register your hunt"
						})
					]
				})
			]
		})
	});
}
//#endregion
export { Login as component };
