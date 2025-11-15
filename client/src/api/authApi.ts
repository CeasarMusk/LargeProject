import { request } from "./httpClient";

// REGISTER
export function registerUser(data: {
    firstName: string;
    lastName: string;
    login: string;
    password: string;
}) {
    return request("/register", {
        method: "POST",
        body: data
    });
}

// LOGIN
export function loginUser(data: {
    login: string;
    password: string;
}) {
    return request("/login", {
        method: "POST",
        body: data
    });
}

// RESEND VERIFICATION
export function resendVerification(login: string) {
    return request("/email-verification", {
        method: "POST",
        body: { login }
    });
}

// VERIFY EMAIL
export function verifyEmail(token: string) {
    return request(`/email-verification?token=${encodeURIComponent(token)}`, {
        method: "GET"
    });
}

// FORGOT PASSWORD
export function forgotPassword(login: string) {
    return request("/password/request", {
        method: "POST",
        body: { login }
    });
}

// RESET PASSWORD USING TOKEN
export function resetPassword(token: string, newPassword: string) {
    return request("/password/reset", {
        method: "POST",
        body: { token, newPassword }
    });
}

// CHANGE PASSWORD (LOGGED IN)
export function changePassword(data: {
    oldPassword: string;
    newPassword: string;
}) {
    return request("/password/change", {
        method: "POST",
        body: data
    });
}
