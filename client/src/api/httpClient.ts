// src/api/httpClient.ts

// Load backend URL from vite env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Core request wrapper
export async function request(path: string, options: RequestInit = {}) {
    // Ensure headers object exists
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {})
    };

    // Add user id header if logged in
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
        try {
            const user = JSON.parse(rawUser);
            if (user?.id) {
                headers["x-user-id"] = user.id;
            }
        } catch (err) {
            // If JSON parsing fails, ignore
        }
    }

    // Build final options
    const finalOptions: RequestInit = {
        ...options,
        headers
    };

    // Body must be string for fetch
    if (options.body && typeof options.body !== "string") {
        finalOptions.body = JSON.stringify(options.body);
    }

    // Full URL
    const url = `${API_BASE_URL}${path}`;

    // Make request
    let response;
    try {
        response = await fetch(url, finalOptions);
    } catch {
        throw new Error("Network error: could not reach server");
    }

    // Try reading json
    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error("Invalid JSON response from server");
    }

    // Check HTTP errors
    if (!response.ok) {
        const message = data.error || "Server error";
        throw new Error(message);
    }

    // Check backend error field
    if (data.error && data.error !== "") {
        throw new Error(data.error);
    }

    return data; // Success
}
