// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

import LoginRegister from "./pages/auth/LoginRegister";
import VerifyEmail from "./pages/verification/VerifyEmail";
import ResendVerification from "./pages/verification/ResendVerification";
import ForgotPassword from "./pages/password/ForgotPassword";
import ResetPassword from "./pages/password/ResetPassword";

import Dashboard from "./pages/dashboard/Dashboard";
import Budgets from "./pages/budgets/Budgets";
import Transactions from "./pages/transactions/Transactions";
import Profile from "./pages/profile/Profile";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public routes */}
          <Route path="/" element={<LoginRegister />} />
          <Route path="/verifyemail" element={<VerifyEmail />} />
          <Route path="/resendverification" element={<ResendVerification />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/resetpassword" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/budgets"
            element={
              <PrivateRoute>
                <Budgets />
              </PrivateRoute>
            }
          />

          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <Transactions />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
