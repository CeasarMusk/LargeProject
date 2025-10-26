// authService.ts
// API base URL - replace with your actual API URL
const API_BASE_URL = 'YOUR_API_BASE_URL_HERE'; // e.g., 'https://api.yourapp.com'

// Types for request/response data
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
  userId?: string; // Primary key returned from API
  token?: string; // JWT token if your API uses it
  user?: {
    id: string;
    email: string;
  };
}

// Login function
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/YOUR_LOGIN_ENDPOINT`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store token if your API returns one
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    return {
      success: true,
      userId: data.userId || data.id, // Adjust based on your API response
      token: data.token,
      user: data.user,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Login failed',
    };
  }
};

// Register function
export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/YOUR_REGISTER_ENDPOINT`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        // Add any other fields your API needs for registration
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // The API should return the newly created user with primary key
    return {
      success: true,
      userId: data.userId || data.id, // Primary key from database
      token: data.token,
      user: data.user,
      message: 'Account created successfully',
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed',
    };
  }
};

// Logout function
export const logout = (): void => {
  localStorage.removeItem('authToken');
  // Add any other cleanup needed
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};