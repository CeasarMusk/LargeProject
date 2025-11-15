import { useState, FormEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../api/authApi";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!token) {
            setError("Invalid or missing reset token");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const res = await resetPassword(token, password);

            if (res.error) {
                setError(res.error);
            } else {
                setMessage("Password has been reset successfully");
            }
        } catch (err: any) {
            setError(err.message || "Unexpected error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 420, margin: "50px auto", padding: 20 }}>
            <h2>Reset Password</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>
                        New Password
                    </label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
                {message && <div style={{ color: "green", marginBottom: 12 }}>{message}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: 10,
                        background: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer"
                    }}
                >
                    {loading ? "Please wait..." : "Reset Password"}
                </button>
            </form>

            {message && (
                <button
                    onClick={() => navigate("/")}
                    style={{
                        marginTop: 12,
                        width: "100%",
                        padding: 10,
                        background: "#28a745",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer"
                    }}
                >
                    Return to Login
                </button>
            )}
        </div>
    );
}
