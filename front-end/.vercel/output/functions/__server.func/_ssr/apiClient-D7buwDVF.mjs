import { n as __exportAll$1 } from "../_runtime.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/apiClient-D7buwDVF.js
var apiClient_D7buwDVF_exports = /* @__PURE__ */ __exportAll$1({
	n: () => apiClient_exports,
	t: () => apiCall
});
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var apiClient_exports = /* @__PURE__ */ __exportAll({ apiCall: () => apiCall });
var BASE_URL = "http://localhost:8000";
var apiCall = async (endpoint, options = {}) => {
	const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
	const headers = new Headers(options.headers || {});
	if (token) headers.set("Authorization", `Bearer ${token}`);
	if (options.body && !(options.body instanceof FormData)) {
		if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
	}
	const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
	const response = await fetch(url, {
		...options,
		headers
	});
	if (!response.ok) {
		let errorMsg = response.statusText;
		try {
			const errData = await response.json();
			errorMsg = errData.detail || errData.message || errorMsg;
		} catch (e) {}
		throw new Error(`Error ${response.status}: ${errorMsg}`);
	}
	return response.json();
};
//#endregion
export { apiClient_D7buwDVF_exports as n, apiCall as t };
