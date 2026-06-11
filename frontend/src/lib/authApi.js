



const AUTH_STORAGE_KEY = "apiarena_auth";





function getBaseUrl() {


    const url = import.meta.env.VITE_AUTH_API_URL;


    if (!url) {


        console.warn("VITE_AUTH_API_URL is not defined, using http://localhost:8081");


        return "http://localhost:8081";


    }


    return url.replace(/\/$/, "");


}

/**
 * Do not attach a stored Bearer token — avoids 403 on login/register when an old JWT is expired or invalid.
 */
function isPublicAuthPath(path) {
    const p = (path.split("?")[0] || "").replace(/\/$/, "") || "/";
    return (
        p === "/api/auth/register" ||
        p === "/api/auth/login" ||
        p === "/api/auth/refresh" ||
        p === "/api/auth/verify-email" ||
        p === "/api/auth/resend-verification" ||
        p === "/api/auth/forgot-password" ||
        p === "/api/auth/reset-password"
    );
}





function getStoredTokens() {


    try {


        const raw = localStorage.getItem(AUTH_STORAGE_KEY);


        if (!raw) return null;


        const data = JSON.parse(raw);


        if (data?.accessToken) return { accessToken: data.accessToken, refreshToken: data.refreshToken ?? null };


        return null;


    } catch {


        return null;


    }


}





function setStoredTokens(accessToken, refreshToken = null) {


    try {


        localStorage.setItem(


            AUTH_STORAGE_KEY,


            JSON.stringify({ accessToken, refreshToken })


        );


    } catch (e) {


        console.error("Error saving tokens:", e);


    }


}





function clearStoredTokens() {


    try {


        localStorage.removeItem(AUTH_STORAGE_KEY);


    } catch { }


}





/**


 * Extract backend error message from response body.


 * - ErrorResponse: { status, message, timestamp }


 * - Validation: { fieldName: "message", ... }


 */


async function getErrorMessage(res, body) {


    if (body?.detail) return body.detail;


    if (body?.message) return body.message;


    if (typeof body === "object" && body !== null && !Array.isArray(body)) {


        const first = Object.values(body)[0];


        if (typeof first === "string") return first;


        const parts = Object.entries(body).map(([k, v]) => `${k}: ${v}`);


        if (parts.length) return parts.join(". ");


    }


    return res.statusText || "Request error";


}





async function request(path, options = {}) {


    const base = getBaseUrl();


    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;


    const tokens = getStoredTokens();


    const headers = {


        "Content-Type": "application/json",


        ...options.headers,


    };


    if (isPublicAuthPath(path)) {


        delete headers.Authorization;


    } else if (tokens?.accessToken && !headers.Authorization) {


        headers.Authorization = `Bearer ${tokens.accessToken}`;


    }


    const res = await fetch(url, { ...options, headers });


    let body = null;


    const ct = res.headers.get("Content-Type") || "";


    if (ct.includes("application/json")) {


        try {


            body = await res.json();


        } catch { }


    }


    if (!res.ok) {


        const message = await getErrorMessage(res, body);


        const err = new Error(message);


        err.status = res.status;


        err.body = body;


        throw err;


    }


    return body;


}





/**


 * Login. Body: { email, password }.


 * Devuelve { user, accessToken, refreshToken }.


 */


export async function login(credentials) {


    const data = await request("/api/auth/login", {


        method: "POST",


        body: JSON.stringify({


            email: credentials.email?.trim(),


            password: credentials.password,


        }),


    });


    if (data?.accessToken) {


        setStoredTokens(data.accessToken, data.refreshToken ?? null);


    }


    return data;


}





/**


 * Register. Body: { username, email, password, role? }.


 * Devuelve { user, accessToken, refreshToken }.


 */


export async function register(payload) {


    const data = await request("/api/auth/register", {


        method: "POST",


        body: JSON.stringify({


            username: payload.username?.trim(),


            email: payload.email?.trim(),


            password: payload.password,


            role: payload.role ?? null,


            dateOfBirth: payload.dateOfBirth ?? null,


            acceptTerms: payload.acceptTerms ?? false,


        }),


    });


    if (data?.accessToken) {


        setStoredTokens(data.accessToken, data.refreshToken ?? null);


    }


    return data;


}





/**


 * Confirm email using token from the verification link (no auth).


 */


export async function verifyEmailWithToken(token) {


    const q = encodeURIComponent(token);


    return request(`/api/auth/verify-email?token=${q}`, { method: "GET" });


}





/**


 * Request a new verification email (no auth).


 */


export async function resendVerificationEmail(email) {


    return request("/api/auth/resend-verification", {


        method: "POST",


        body: JSON.stringify({ email: email?.trim() }),


    });


}

/**
 * Request a password reset link. Always resolves the same way for privacy.
 */
export async function forgotPassword(email) {
    return request("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email?.trim() }),
    });
}

/**
 * Set a new password using the token from the reset email.
 */
export async function resetPassword(token, newPassword) {
    return request("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
    });
}

/**
 * GDPR portability: fetch the current user's data as a JSON object.
 */
export async function exportMyData() {
    return request("/api/auth/me/export", { method: "GET" });
}

/**
 * GDPR right to erasure: permanently delete the current account.
 */
export async function deleteMyAccount() {
    return request("/api/auth/me", { method: "DELETE" });
}





/**


 * Refresh access token using stored refresh token.


 */


export async function refreshToken() {


    const tokens = getStoredTokens();


    if (!tokens?.refreshToken) {


        clearStoredTokens();


        return null;


    }


    try {


        const data = await request("/api/auth/refresh", {


            method: "POST",


            body: JSON.stringify({ refreshToken: tokens.refreshToken }),


        });


        if (data?.accessToken) {


            setStoredTokens(data.accessToken, data.refreshToken ?? tokens.refreshToken);


            return data;


        }


    } catch {


        clearStoredTokens();


    }


    return null;


}





/**


 * Logout. Revoke refresh token in backend and clear local tokens.


 */


export async function logout() {


    const tokens = getStoredTokens();


    if (tokens?.refreshToken) {


        try {


            await request("/api/auth/logout", {


                method: "POST",


                body: JSON.stringify({ refreshToken: tokens.refreshToken }),


            });


        } catch (_) {


            // Ignore network error; still clear local session.


        }


    }


    clearStoredTokens();


}





/**


 * Get current user (requires a valid access token).


 */


export async function getMe() {


    return request("/api/auth/me", { method: "GET" });


}


/** Achievements for current user (unlocked + locked definitions). */
export async function getMyAchievements() {
    return request("/api/auth/me/achievements", { method: "GET" });
}


/** Report active browsing seconds (visible tab, not idle). Server caps per request (120s). */
export async function postBrowsingUsage(browsingSecondsDelta) {
    const n = Math.min(120, Math.max(0, Math.floor(Number(browsingSecondsDelta))));
    if (!n) return null;
    return request("/api/auth/me/usage", {
        method: "POST",
        body: JSON.stringify({ browsingSecondsDelta: n }),
    });
}





/**


 * Update current user profile. Body follows backend UpdateProfileRequest.


 */


export async function updateProfile(profileData) {


    return request("/api/auth/me", {


        method: "PUT",


        body: JSON.stringify(profileData),


    });


}





/**


 * Check whether there are stored tokens (without server validation).


 */


export function hasStoredSession() {


    return !!getStoredTokens()?.accessToken;


}





export async function getUserPublicProfile(userId) {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/auth/users/${userId}/profile`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export {
    getStoredTokens,
    setStoredTokens,
    clearStoredTokens,
    getBaseUrl,
};