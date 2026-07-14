import { apiCall, BASE_URL } from "../utils/apiClient";
import * as mockClient from "./mockClient";

const USE_MOCK = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('devMode') === 'true' : false;

export const uploadResume = async (file: File): Promise<any> => {
    if (USE_MOCK) return mockClient.uploadResume(file);

    const formData = new FormData();
    formData.append("file", file);

    return apiCall("/api/resume/upload", {
        method: "POST",
        body: formData,
    });
};

export const getHuntPreferences = async (): Promise<any> => {
    if (USE_MOCK) return {};
    return apiCall("/api/hunt/preferences", {
        method: "GET"
    });
};

export const startHunt = async (
    role: string, 
    location: string, 
    maxResults: number, 
    options?: {
        mode?: string;
        company_size?: string;
        company_type?: string;
        writing_style?: string;
    },
    onCompany?: (company: any) => void, 
    onDone?: () => void
): Promise<any> => {
    if (USE_MOCK) return mockClient.startHunt(role, location, maxResults, onCompany);

    const { job_id, hunt_id } = await apiCall("/api/hunt/start", {
        method: "POST",
        body: JSON.stringify({ 
            role, 
            location, 
            max_results: maxResults, 
            ...options 
        })
    });
    
    // For EventSource, pass token in query parameter since custom headers are not supported natively
    const token = localStorage.getItem("access_token");
    const streamUrl = `${BASE_URL}/api/hunt/stream/${job_id}${token ? `?token=${token}` : ''}`;
    const eventSource = new EventSource(streamUrl);
    
    eventSource.onmessage = (event) => {
        const dataStr = event.data;
        if (!dataStr) return;
        try {
            const company = JSON.parse(dataStr);
            if (company.status === "done") {
                eventSource.close();
                if (onDone) onDone();
            } else {
                if (onCompany) onCompany(company);
            }
        } catch (e) {
            console.error("Failed to parse SSE JSON", e, dataStr);
        }
    };
    
    eventSource.onerror = (err) => {
        console.error("EventSource failed:", err);
        eventSource.close();
        if (onDone) onDone();
    };
    
    return { success: true, job_id, hunt_id };
};

export const generateForCompany = async (companyId: string, custom_instructions?: string): Promise<any> => {
    if (USE_MOCK) return mockClient.generateForCompany(companyId);

    return apiCall(`/api/generate/${companyId}`, {
        method: "POST",
        body: custom_instructions ? JSON.stringify({ custom_instructions }) : undefined
    });
};

export const sendApplication = async (companyId: string, payload: any): Promise<any> => {
    if (USE_MOCK) return mockClient.sendApplication(companyId, payload);

    return apiCall(`/api/send/${companyId}`, {
        method: "POST",
        body: JSON.stringify(payload)
    });
};

export const getStatus = async (): Promise<any> => {
    if (USE_MOCK) return mockClient.getStatus();

    return apiCall("/api/status", {
        method: "GET"
    });
};

export const getSettings = async(): Promise<any> => {
    return apiCall("/api/settings", {
        method: "GET"
    });
};
export const updateSettings = async (payload: any): Promise<any> => {
    return apiCall("/api/settings", {
        method: "PUT",
        body: JSON.stringify(payload)
    });
};
export const deleteSettingsField = async (fieldName: string): Promise<any> => {
    return apiCall(`/api/settings/field/${fieldName}`, {
        method: "DELETE"
    });
};

export const getApplications = async (): Promise<any> => {
    if (USE_MOCK) return mockClient.getApplications();
    return apiCall("/api/applications", {
        method: "GET"
    });
};

export const updateApplicationStatus = async (companyId: string, status: string): Promise<any> => {
    if (USE_MOCK) return { success: true, status };
    return apiCall(`/api/applications/${companyId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
    });
};

export const deleteApplication = async (applicationId: string): Promise<any> => {
    if (USE_MOCK) return { success: true };
    return apiCall(`/api/applications/${applicationId}`, {
        method: "DELETE"
    });
};

export const checkReplies = async (): Promise<any> => {
    if (USE_MOCK) return { success: true, message: "IMAP replies checked" };
    return apiCall("/api/applications/check-replies", {
        method: "POST"
    });
};

export const getActiveResume = async (): Promise<any> => {
    if (USE_MOCK) return mockClient.getActiveResume();
    return apiCall("/api/resume/active", {
        method: "GET"
    });
};

export const getAnalytics = async (): Promise<any> => {
    if (USE_MOCK) return mockClient.getAnalytics();
    return apiCall("/api/analytics", {
        method: "GET"
    });
};