import { apiCall } from "../utils/apiClient";
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

export const startHunt = async (role: string, location: string, maxResults: number, onCompany?: (company: any) => void, onDone?: () => void): Promise<any> => {
    if (USE_MOCK) return mockClient.startHunt(role, location, maxResults, onCompany);

    const { job_id, hunt_id } = await apiCall("/api/hunt/start", {
        method: "POST",
        body: JSON.stringify({ role, location, max_results: maxResults })
    });
    
    // For EventSource, pass token in query parameter since custom headers are not supported natively
    const token = localStorage.getItem("access_token");
    const streamUrl = `http://localhost:8000/api/hunt/stream/${job_id}${token ? `?token=${token}` : ''}`;
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

export const generateForCompany = async (companyId: string): Promise<any> => {
    if (USE_MOCK) return mockClient.generateForCompany(companyId);

    return apiCall(`/api/generate/${companyId}`, {
        method: "POST"
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
