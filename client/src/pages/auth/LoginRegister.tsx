// src/pages/auth/LoginRegister.tsx
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerUser, resendVerification } from "../../api/authApi";

import bg from "../../assets/background.png";

type Mode = "login" | "register";

export default function LoginRegister() {
    const [mode, setMode] = useState<Mode>("login");

    const [loginValue, setLoginValue] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showResend, setShowResend] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setShowResend(false);
        setLoading(true);

        try {
            if (mode === "login") {
                await login(loginValue, password);
                navigate("/dashboard");
            } else {
                await registerUser({
                    firstName,
                    lastName,
                    login: loginValue,
                    password
                });

                await login(loginValue, password);
                navigate("/dashboard");
            }
        } catch (err: any) {
            setError(err.message || "Unexpected error");

            if (err.message === "Email not verified") {
                setShowResend(true);
            } else {
                setShowResend(false);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundImage: `url(${bg})`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                padding: 40
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 420,
                    padding: 24,
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.9)"
                }}
            >
                <h1
                    style={{
                        textAlign: "center",
                        marginBottom: 20,
                        fontSize: 28,
                        fontWeight: 700
                    }}
                >
                    Budget Buddy
                </h1>

                <div style={{ display: "flex", marginBottom: 16, gap: 8 }}>
                    <button
                        type="button"
                        onClick={() => {
                            setMode("login");
                            setError(null);
                            setShowResend(false);
                        }}
                        style={{
                            flex: 1,
                            padding: 8,
                            fontWeight: mode === "login" ? "bold" : "normal",
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            background: mode === "login" ? "#eee" : "#fff",
                            cursor: "pointer"
                        }}
                    >
                        Login
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setMode("register");
                            setError(null);
                            setShowResend(false);
                        }}
                        style={{
                            flex: 1,
                            padding: 8,
                            fontWeight: mode === "register" ? "bold" : "normal",
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            background: mode === "register" ? "#eee" : "#fff",
                            cursor: "pointer"
                        }}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {mode === "register" && (
                        <>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", marginBottom: 4 }}>
                                    First name
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", marginBottom: 4 }}>
                                    Last name
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
                                />
                            </div>
                        </>
                    )}

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: "block", marginBottom: 4 }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={loginValue}
                            onChange={(e) => setLoginValue(e.target.value)}
                            required
                            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
                        />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: "block", marginBottom: 4 }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
                        />
                    </div>

                    {error && (
                        <div style={{ color: "red", marginBottom: 12 }}>
                            {error}
                        </div>
                    )}

                    {showResend && (
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    setLoading(true);
                                    await resendVerification(loginValue);
                                    alert("Verification email sent");
                                } catch (e: any) {
                                    alert(e.message || "Failed to resend verification email");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            style={{
                                width: "100%",
                                padding: 10,
                                borderRadius: 4,
                                border: "1px solid #007bff",
                                background: "white",
                                color: "#007bff",
                                fontWeight: "bold",
                                cursor: "pointer",
                                marginBottom: 12
                            }}
                        >
                            Resend verification email
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: 10,
                            borderRadius: 4,
                            border: "none",
                            background: "#007bff",
                            color: "#fff",
                            fontWeight: "bold",
                            cursor: loading ? "default" : "pointer"
                        }}
                    >
                        {loading
                            ? "Please wait"
                            : mode === "login"
                            ? "Login"
                            : "Create account"}
                    </button>
                </form>

                <div style={{ marginTop: 12, textAlign: "center" }}>
                    <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        style={{
                            border: "none",
                            background: "none",
                            color: "#007bff",
                            cursor: "pointer",
                            padding: 0
                        }}
                    >
                        Forgot password
                    </button>
                </div>
            </div>
        </div>
    );
}












