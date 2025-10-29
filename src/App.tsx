import { useState } from "react";
import type { FormEvent } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { login, register } from "./authService";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    // Basic validation
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
        // Handle login
        const result = await login({ email, password });
        
        if (result.success) {
          setSuccess("Login successful!");
          console.log("User logged in with ID:", result.userId);
          // Redirect to dashboard or home page here
          // window.location.href = '/dashboard';
        } else {
          setError(result.message || "Login failed");
        }
      } else {
        // Handle registration
        const result = await register({ email, password });
        
        if (result.success) {
          setSuccess("Account created successfully! You can now login.");
          console.log("New user created with ID (Primary Key):", result.userId);
          // Optionally switch to login form
          setTimeout(() => {
            setIsLogin(true);
            setEmail("");
            setPassword("");
            setSuccess("");
          }, 2000);
        } else {
          setError(result.message || "Registration failed");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar navbar-dark" style={{ backgroundColor: "#2d5016" }}>
        <div className="container-fluid justify-content-center">
          <span className="navbar-brand h1 mb-0">Budget Buddy</span>
        </div>
      </nav>

      {/* Centered Card */}
      <div className="content-container">
        <div className="card shadow-sm p-4" style={{ maxWidth: "400px", width: "100%" }}>
          <h3 className="text-center mb-4">{isLogin ? "Login" : "Register"}</h3>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email address</label>
              <input 
                type="email" 
                className="form-control" 
                id="email" 
                placeholder="Enter email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control" 
                id="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn w-100 mb-3" 
              style={{ backgroundColor: "#2d5016", color: "white" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {isLogin ? "Logging in..." : "Creating account..."}
                </>
              ) : (
                isLogin ? "Login" : "Register"
              )}
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

export default App;
