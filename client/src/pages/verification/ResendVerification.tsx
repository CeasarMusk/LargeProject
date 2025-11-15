import { useState, FormEvent } from "react";
import { resendVerification } from "../../api/authApi";

export default function ResendVerification() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setMessage(null);
        setError(null);
        setLoading(true);

        try {
            const res = await resendVerification(email);

            if (res.error) {
                setError(res.error);
            } else {
                setMessage("Verification email sent");
            }
        } catch (err: any) {
            setError(err.message || "Unexpected error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 420, margin: "50px auto", padding: 20 }}>
            <h2>Resend Verification</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>
                        Email
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
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
                    {loading ? "Sending..." : "Resend Email"}
                </button>
            </form>
        </div>
    );
}
