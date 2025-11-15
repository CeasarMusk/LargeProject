import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../../api/authApi";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<"success" | "error" | null>(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function run() {
            if (!token) {
                setResult("error");
                setMessage("Invalid verification link");
                setLoading(false);
                return;
            }

            try {
                const data = await verifyEmail(token);
                if (!data.error) {
                    setResult("success");
                    setMessage("Email verified successfully");
                } else {
                    setResult("error");
                    setMessage(data.error);
                }
            } catch (err: any) {
                setResult("error");
                setMessage(err.message || "Verification failed");
            } finally {
                setLoading(false);
            }
        }

        run();
    }, [token]);

    if (loading) {
        return (
            <div style={{ padding: 24 }}>
                Verifying, please wait...
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <h2>Email Verification</h2>
            <p>{message}</p>

            {result === "success" && (
                <button
                    onClick={() => navigate("/")}
                    style={{
                        marginTop: 12,
                        padding: 10,
                        background: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer"
                    }}
                >
                    Continue to Login
                </button>
            )}

            {result === "error" && (
                <button
                    onClick={() => navigate("/resend-verification")}
                    style={{
                        marginTop: 12,
                        padding: 10,
                        background: "#dc3545",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer"
                    }}
                >
                    Resend Verification Email
                </button>
            )}
        </div>
    );
}
