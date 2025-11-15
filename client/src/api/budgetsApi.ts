import { request } from "./httpClient";

export interface BudgetFilters {
    period?: string;
    q?: string;
    limit?: number;
    offset?: number;
}

export function listBudgets(filters: BudgetFilters = {}) {
    const params = new URLSearchParams();

    if (filters.period) params.set("period", filters.period);
    if (filters.q) params.set("q", filters.q);
    if (filters.limit != null) params.set("limit", String(filters.limit));
    if (filters.offset != null) params.set("offset", String(filters.offset));

    const qs = params.toString();
    const path = qs ? `/budgets?${qs}` : "/budgets";

    return request(path, { method: "GET" });
}

export function getBudget(id: string) {
    return request(`/budgets/${id}`, {
        method: "GET"
    });
}

export function createBudget(data: {
    name: string;
    period: "monthly" | "weekly" | "yearly" | "custom";
    total?: number;
    limit?: number;
    categories: { name: string; allocation: number }[];
    startDate?: string | null;
    endDate?: string | null;
}) {
    return request("/budgets", {
        method: "POST",
        body: data
    });
}

export function updateBudget(
    id: string,
    data: {
        name?: string;
        period?: "monthly" | "weekly" | "yearly" | "custom";
        total?: number;
        limit?: number;
        categories?: { name: string; allocation: number }[];
        startDate?: string | null;
        endDate?: string | null;
    }
) {
    return request(`/budgets/${id}`, {
        method: "PATCH",
        body: data
    });
}

export function deleteBudget(id: string) {
    return request(`/budgets/${id}`, {
        method: "DELETE"
    });
}
