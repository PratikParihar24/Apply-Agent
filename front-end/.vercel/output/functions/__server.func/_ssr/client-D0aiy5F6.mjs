import { t as apiCall } from "./apiClient-D7buwDVF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-D0aiy5F6.js
var uploadResume$1 = async (file) => {
	console.log("Mock uploadResume called with file:", file);
	return new Promise((resolve) => setTimeout(() => resolve({
		success: true,
		chunks_count: 10,
		sections_found: [
			"OBJECTIVE",
			"TECHNICAL SKILLS",
			"PROJECTS"
		]
	}), 800));
};
var startHunt$1 = async (role, location, maxResults, onCompany, onDone) => {
	console.log("Mock startHunt called with:", {
		role,
		location,
		maxResults
	});
	const mockCompanies = Array.from({ length: 8 }, (_, i) => ({
		id: `mock_company_${i + 1}`,
		name: `Mock Company ${i + 1}`,
		job_title: [
			"Software Engineer",
			"Backend Developer",
			"Full Stack Engineer"
		][i % 3],
		description: "A fast-growing tech company looking for great talent.",
		score: parseFloat((6 + Math.random() * 3).toFixed(1)),
		url: `https://company${i + 1}.example.com/jobs/1`
	}));
	setTimeout(async () => {
		for (let i = 0; i < mockCompanies.length; i++) {
			await new Promise((r) => setTimeout(r, 600));
			if (onCompany) onCompany(mockCompanies[i]);
		}
		if (onDone) onDone();
	}, 100);
	return {
		success: true,
		job_id: "mock-job-123",
		status: "started"
	};
};
var generateForCompany$1 = async (companyId) => {
	console.log("Mock generateForCompany called with:", companyId);
	return new Promise((resolve) => setTimeout(() => resolve({
		cover_letter: "Dear Hiring Manager,\n\nI am thrilled to apply for the position. I have the necessary skills...",
		email_body: "Hi Team,\n\nPlease find my application attached for the open position.",
		subject: "Application for Software Engineer Role - John Doe",
		tailored_resume: "John Doe\n\nEXPERIENCE\n- Built awesome things..."
	}), 1500));
};
var sendApplication$1 = async (companyId, payload) => {
	console.log("Mock sendApplication called with:", companyId, payload);
	return new Promise((resolve) => setTimeout(() => resolve({
		success: true,
		status: "sent"
	}), 500));
};
var getStatus$1 = async () => {
	console.log("Mock getStatus called");
	return new Promise((resolve) => resolve({
		resume_ready: true,
		sections_found: [
			"OBJECTIVE",
			"TECHNICAL SKILLS",
			"PROJECTS",
			"EDUCATION"
		],
		summary_preview: "CS undergrad with Python, FastAPI, Node.js experience..."
	}));
};
var getApplications$1 = async () => {
	return new Promise((resolve) => resolve([{
		_id: "mock_app_1",
		company_name: "Mock Corp",
		job_title: "React Developer",
		applied_at: (/* @__PURE__ */ new Date()).toISOString(),
		status: "viewed",
		llm_provider: "gemini"
	}, {
		_id: "mock_app_2",
		company_name: "Local LLC",
		job_title: "Python Engineer",
		applied_at: (/* @__PURE__ */ new Date(Date.now() - 864e5)).toISOString(),
		status: "applied",
		llm_provider: "ollama"
	}]));
};
var getActiveResume$1 = async () => {
	return new Promise((resolve) => resolve({
		id: "mock_resume_123",
		filename: "Resume_John_Doe.pdf",
		summary: "An experienced full-stack developer with 5+ years specializing in Node.js, React, and Python. Proven track record of optimizing application performance and scaling distributed systems.",
		sections_found: [
			"Experience",
			"Skills",
			"Education",
			"Projects"
		],
		chunks_count: 12,
		uploaded_at: (/* @__PURE__ */ new Date()).toISOString()
	}));
};
var getAnalytics$1 = async () => {
	return new Promise((resolve) => resolve({
		total_applications: 12,
		by_status: {
			applied: 5,
			viewed: 3,
			replied: 2,
			interview: 1,
			rejected: 1,
			failed: 0
		},
		reply_rate: .333,
		interview_rate: .083,
		most_recent_application: (/* @__PURE__ */ new Date()).toISOString(),
		applications_this_month: 8,
		top_roles: [
			"React Developer",
			"Python Engineer",
			"Backend Developer"
		],
		llm_usage: {
			gemini: 8,
			groq: 3,
			ollama: 1
		}
	}));
};
var USE_MOCK = typeof window !== "undefined" && window.localStorage ? localStorage.getItem("devMode") === "true" : false;
var uploadResume = async (file) => {
	if (USE_MOCK) return uploadResume$1(file);
	const formData = new FormData();
	formData.append("file", file);
	return apiCall("/api/resume/upload", {
		method: "POST",
		body: formData
	});
};
var getHuntPreferences = async () => {
	if (USE_MOCK) return {};
	return apiCall("/api/hunt/preferences", { method: "GET" });
};
var startHunt = async (role, location, maxResults, options, onCompany, onDone) => {
	if (USE_MOCK) return startHunt$1(role, location, maxResults, onCompany);
	const { job_id, hunt_id } = await apiCall("/api/hunt/start", {
		method: "POST",
		body: JSON.stringify({
			role,
			location,
			max_results: maxResults,
			...options
		})
	});
	const token = localStorage.getItem("access_token");
	const streamUrl = `http://localhost:8000/api/hunt/stream/${job_id}${token ? `?token=${token}` : ""}`;
	const eventSource = new EventSource(streamUrl);
	eventSource.onmessage = (event) => {
		const dataStr = event.data;
		if (!dataStr) return;
		try {
			const company = JSON.parse(dataStr);
			if (company.status === "done") {
				eventSource.close();
				if (onDone) onDone();
			} else if (onCompany) onCompany(company);
		} catch (e) {
			console.error("Failed to parse SSE JSON", e, dataStr);
		}
	};
	eventSource.onerror = (err) => {
		console.error("EventSource failed:", err);
		eventSource.close();
		if (onDone) onDone();
	};
	return {
		success: true,
		job_id,
		hunt_id
	};
};
var generateForCompany = async (companyId, custom_instructions) => {
	if (USE_MOCK) return generateForCompany$1(companyId);
	return apiCall(`/api/generate/${companyId}`, {
		method: "POST",
		body: custom_instructions ? JSON.stringify({ custom_instructions }) : void 0
	});
};
var sendApplication = async (companyId, payload) => {
	if (USE_MOCK) return sendApplication$1(companyId, payload);
	return apiCall(`/api/send/${companyId}`, {
		method: "POST",
		body: JSON.stringify(payload)
	});
};
var getStatus = async () => {
	if (USE_MOCK) return getStatus$1();
	return apiCall("/api/status", { method: "GET" });
};
var getSettings = async () => {
	return apiCall("/api/settings", { method: "GET" });
};
var deleteSettingsField = async (fieldName) => {
	return apiCall(`/api/settings/field/${fieldName}`, { method: "DELETE" });
};
var getApplications = async () => {
	if (USE_MOCK) return getApplications$1();
	return apiCall("/api/applications", { method: "GET" });
};
var updateApplicationStatus = async (companyId, status) => {
	if (USE_MOCK) return {
		success: true,
		status
	};
	return apiCall(`/api/applications/${companyId}/status`, {
		method: "PUT",
		body: JSON.stringify({ status })
	});
};
var deleteApplication = async (applicationId) => {
	if (USE_MOCK) return { success: true };
	return apiCall(`/api/applications/${applicationId}`, { method: "DELETE" });
};
var checkReplies = async () => {
	if (USE_MOCK) return {
		success: true,
		message: "IMAP replies checked"
	};
	return apiCall("/api/applications/check-replies", { method: "POST" });
};
var getActiveResume = async () => {
	if (USE_MOCK) return getActiveResume$1();
	return apiCall("/api/resume/active", { method: "GET" });
};
var getAnalytics = async () => {
	if (USE_MOCK) return getAnalytics$1();
	return apiCall("/api/analytics", { method: "GET" });
};
//#endregion
export { getActiveResume as a, getHuntPreferences as c, sendApplication as d, startHunt as f, generateForCompany as i, getSettings as l, uploadResume as m, deleteApplication as n, getAnalytics as o, updateApplicationStatus as p, deleteSettingsField as r, getApplications as s, checkReplies as t, getStatus as u };
