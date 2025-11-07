import { useState } from "react";
import type { FormEvent } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { login, register } from "./authService";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const result = await login(email, password);

        if (result.success) {
          localStorage.setItem("email", email);
          navigate("/dashboard");
          return;
        } else {
          setError(result.message || "Login failed");
        }
      } else {
        const result = await register(email, password);

        if (result.success) {
          setSuccess("Account created! You can login now.");
          setTimeout(() => {
            setIsLogin(true);
            setSuccess("");
          }, 1500);
        } else {
          setError(result.message || "Registration failed");
        }
      }
    } catch (err: any) {
      setError(err.message || "Unexpected error — check backend logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar navbar-dark" style={{ backgroundColor: "#2d5016" }}>
        <div className="container-fluid justify-content-center">
          <span className="navbar-brand h1 mb-0">Budget Buddy</span>
        </div>
      </nav>

      <div className="content-container">
        <div className="card shadow-sm p-4" style={{ maxWidth: "400px", width: "100%" }}>
          <h3 className="text-center mb-4">{isLogin ? "Login" : "Register"}</h3>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}

          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn w-100 mb-3"
              style={{ backgroundColor: "#2d5016", color: "white" }}
              disabled={loading}
            >
              {loading ? "Working..." : isLogin ? "Login" : "Register"}
            </button>
          </form>

          <div className="text-center">
            <button className="btn btn-link" onClick={toggleForm} disabled={loading}>
              {isLogin ? "Create an account" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthScreen />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
