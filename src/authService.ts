
const API_BASE_URL = "http://www.somethingsimple.site/API";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  userId?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
  };
}

// Login function
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/Login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: credentials.email,  // PHP expects "login"
        password: credentials.password,
      }),
    });

    const data = await response.json();

    if (data.error && data.error !== "") {
      return { success: false, message: data.error };
    }

    return {
      success: true,
      userId: data.id,
      user: { id: data.id, email: credentials.email },
    };
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, message: "Login failed" };
  }
};

// Register function
export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  try {
    // PHP Register.php expects firstName, lastName, login, password
    const nameParts = credentials.email.split("@")[0].split(".");
    const firstName = nameParts[0] || "User";
    const lastName = nameParts[1] || "Account";

    const response = await fetch(`${API_BASE_URL}/Register.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        login: credentials.email,
        password: credentials.password,
      }),
    });

    const data = await response.json();

    if (data.error && data.error !== "") {
      return { success: false, message: data.error };
    }

    return {
      success: true,
      userId: data.id,
      user: { id: data.id, email: credentials.email },
      message: "Account created successfully",
    };
  } catch (err) {
    console.error("Registration error:", err);
    return { success: false, message: "Registration failed" };
  }
};

// Logout and Auth check
export const logout = (): void => {
  localStorage.removeItem("authToken");
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("authToken");
};
