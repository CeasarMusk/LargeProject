// src/api/transactionsApi.ts
import { request } from "./httpClient";

export interface TransactionFilters {
    type?: "income" | "expense";
    category?: string;
    period?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
}

export function listTransactions(filters: TransactionFilters = {}) {
    const params = new URLSearchParams();

    if (filters.type) params.set("type", filters.type);
    if (filters.category) params.set("category", filters.category);
    if (filters.period) params.set("period", filters.period);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.limit != null) params.set("limit", String(filters.limit));
    if (filters.offset != null) params.set("offset", String(filters.offset));

    const qs = params.toString();
    const path = qs ? `/transactions?${qs}` : "/transactions";

    return request(path, { method: "GET" });
}

export function createTransaction(data: any) {
    return request("/transactions", {
        method: "POST",
        body: data
    });
}

export function deleteTransaction(id: string) {
    return request(`/transactions/${id}`, {
        method: "DELETE"
    });
}

export function getTransaction(id: string) {
    return request(`/transactions/${id}`, {
        method: "GET"
    });
}

export function updateTransaction(id: string, data: any) {
    return request(`/transactions/${id}`, {
        method: "PUT",
        body: data
    });
}
