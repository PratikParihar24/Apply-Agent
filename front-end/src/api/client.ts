import * as mockClient from "./mockClient";

const USE_MOCK = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('devMode') === 'true' : false; // flip to true for UI-only testing

const BASE_URL = "http://localhost:8000";

const handleResponse = async (response: Response): Promise<any> => {
    if (!response.ok) {
        let errorMsg = response.statusText;
        try {
            const errData = await response.json();
            errorMsg = errData.detail || errData.message || errorMsg;
        } catch (e) {
            // ignore JSON parse error
        }
        throw new Error(`Error ${response.status}: ${errorMsg}`);
    }
    return response.json();
};

export const uploadResume = async (file: File): Promise<any> => {
    if (USE_MOCK) return mockClient.uploadResume(file);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/api/resume/upload`, {
        method: "POST",
        body: formData,
        // Note: Do not set Content-Type header for FormData, browser sets it automatically with the correct boundary
    });
    return handleResponse(response);
};

export const startHunt = async (role: string, location: string, maxResults: number, onCompany?: (company: any) => void, onDone?: () => void): Promise<any> => {
    if (USE_MOCK) return mockClient.startHunt(role, location, maxResults, onCompany);

    const response = await fetch(`${BASE_URL}/api/hunt/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, location, max_results: maxResults })
    });
    
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const { job_id } = await response.json();
    
    const eventSource = new EventSource(`${BASE_URL}/api/hunt/stream/${job_id}`);
    
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
    
    return { success: true, job_id };
};

export const generateForCompany = async (companyId: string): Promise<any> => {
    if (USE_MOCK) return mockClient.generateForCompany(companyId);

    const response = await fetch(`${BASE_URL}/api/generate/${companyId}`, {
        method: "POST"
    });
    return handleResponse(response);
};

export const sendApplication = async (companyId: string, payload: any): Promise<any> => {
    if (USE_MOCK) return mockClient.sendApplication(companyId, payload);

    const response = await fetch(`${BASE_URL}/api/send/${companyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
};

export const getStatus = async (): Promise<any> => {
    if (USE_MOCK) return mockClient.getStatus();

    const response = await fetch(`${BASE_URL}/api/status`, {
        method: "GET"
    });
    return handleResponse(response);
};
