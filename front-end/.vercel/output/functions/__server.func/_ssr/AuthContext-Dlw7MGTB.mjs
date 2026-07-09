import { i as __toESM } from "../_runtime.mjs";
import { t as apiCall } from "./apiClient-D7buwDVF.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AuthContext-Dlw7MGTB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AuthContext = (0, import_react.createContext)(void 0);
var AuthProvider = ({ children }) => {
	const [user, setUser] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined" && window.localStorage) {
			const stored = window.localStorage.getItem("user");
			if (stored) try {
				return JSON.parse(stored);
			} catch (e) {}
		}
		return null;
	});
	const [token, setToken] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined" && window.localStorage) return window.localStorage.getItem("access_token");
		return null;
	});
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const initializeAuth = async () => {
			const storedToken = localStorage.getItem("access_token");
			const storedUser = localStorage.getItem("user");
			if (storedToken) {
				setToken(storedToken);
				if (storedUser) try {
					setUser(JSON.parse(storedUser));
				} catch (e) {}
				try {
					const userData = await apiCall("/api/auth/me", { method: "GET" });
					const localPrefs = localStorage.getItem("user_preferences");
					if (localPrefs) try {
						userData.preferences = JSON.parse(localPrefs);
					} catch (e) {}
					setUser(userData);
					localStorage.setItem("user", JSON.stringify(userData));
				} catch (error) {
					console.error("Auth initialization failed, clearing token", error);
					logout();
				}
			}
			setLoading(false);
		};
		initializeAuth();
	}, []);
	const login = async (email, password) => {
		const { token: accessToken, user: userData } = await apiCall("/api/auth/login", {
			method: "POST",
			body: JSON.stringify({
				email,
				password
			})
		});
		const localPrefs = localStorage.getItem("user_preferences");
		if (localPrefs) try {
			userData.preferences = JSON.parse(localPrefs);
		} catch (e) {}
		setToken(accessToken);
		setUser(userData);
		localStorage.setItem("access_token", accessToken);
		localStorage.setItem("user", JSON.stringify(userData));
	};
	const register = async (name, email, password) => {
		const { token: accessToken, user: userData } = await apiCall("/api/auth/register", {
			method: "POST",
			body: JSON.stringify({
				name,
				email,
				password
			})
		});
		setToken(accessToken);
		setUser(userData);
		localStorage.setItem("access_token", accessToken);
		localStorage.setItem("user", JSON.stringify(userData));
	};
	const logout = () => {
		setToken(null);
		setUser(null);
		localStorage.removeItem("access_token");
		localStorage.removeItem("user");
	};
	const updateUserPreferences = async (role, location) => {
		const updatedUser = user ? { ...user } : {};
		updatedUser.preferences = {
			role,
			location
		};
		setUser(updatedUser);
		localStorage.setItem("user", JSON.stringify(updatedUser));
		localStorage.setItem("user_preferences", JSON.stringify({
			role,
			location
		}));
		try {
			await apiCall("/api/auth/update", {
				method: "PUT",
				body: JSON.stringify({
					role,
					location
				})
			});
		} catch (e) {
			console.warn("Backend update preferences endpoint not found or failed, saved locally:", e);
			throw e;
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthContext.Provider, {
		value: {
			user,
			token,
			loading,
			login,
			register,
			logout,
			updateUserPreferences
		},
		children
	});
};
var useAuth = () => {
	const context = (0, import_react.useContext)(AuthContext);
	if (context === void 0) return {
		user: null,
		token: null,
		loading: typeof window === "undefined",
		login: async () => {},
		register: async () => {},
		logout: () => {},
		updateUserPreferences: async () => {}
	};
	return context;
};
//#endregion
export { useAuth as n, AuthProvider as t };
