const API = "http://64.225.25.63:5000/api";

async function safeRequest(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);
  let data: any = null;

  // Try to parse JSON—but don't crash if the server ever sends HTML
  try {
    data = await res.json();
  } catch {
    data = { success: false, message: "Invalid response from server" };
  }

  if (!res.ok || data?.success === false) {
    const msg =
      data?.message ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export async function register(email: string, password: string) {
  return safeRequest(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  return safeRequest(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function getTransactions(email: string) {
  return safeRequest(`${API}/transactions?email=${encodeURIComponent(email)}`, {
    method: "GET",
  });
}

export async function addTransaction(email: string, title: string, amount: number, date: string) {
  return safeRequest(`${API}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userEmail: email, title, amount, date }),
  });
}
