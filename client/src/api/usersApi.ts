import { request } from "./httpClient";

export function getCurrentUser() {
    return request("/users", {
        method: "GET"
    });
}

export function updateUserProfile(data: {
    firstName?: string;
    lastName?: string;
}) {
    return request("/users", {
        method: "PATCH",
        body: data
    });
}
