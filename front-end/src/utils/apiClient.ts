const BASE_URL = "http://localhost:8000";

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // Only set content type if not sending file/multipart data
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errData = await response.json();
      errorMsg = errData.detail || errData.message || errorMsg;
    } catch (e) {
      // ignore
    }
    throw new Error(`Error ${response.status}: ${errorMsg}`);
  }

  return response.json();
};
