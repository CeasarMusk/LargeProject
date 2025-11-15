import apiClient from "./apiClient";

export async function addSimpleTransaction(data: {
  name: string;
  amount: number;
}) {
  const res = await apiClient.post("/simple-transactions", data);
  return res.data;
}

export async function listSimpleTransactions() {
  const res = await apiClient.get("/simple-transactions");
  return res.data;
}

export async function getSimpleSummary() {
  const res = await apiClient.get("/simple-transactions/summary");
  return res.data;
}

export async function deleteSimpleTransaction(id: string) {
  const res = await apiClient.delete(`/simple-transactions/${id}`);
  return res.data;
}
