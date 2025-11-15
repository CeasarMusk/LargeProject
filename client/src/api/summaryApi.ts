import { request } from "./httpClient";
import { getStoredUser } from "../context/AuthContext";

export interface SummaryParams {
  period?: "monthly" | "weekly" | "yearly" | "custom";
  from?: string;
  to?: string;
  budgetId?: string;
}

export function getSummary(params: SummaryParams = {}) {
  const user = getStoredUser();

  if (!user || !user.id) {
    throw new Error("not logged in");
  }

  const qp = new URLSearchParams();

  if (params.period) qp.set("period", params.period);
  if (params.from) qp.set("from", params.from);
  if (params.to) qp.set("to", params.to);
  if (params.budgetId) qp.set("budgetId", params.budgetId);

  const qs = qp.toString();
  const path = qs ? `/summary?${qs}` : "/summary";

  return request(path, {
    method: "GET",
    headers: {
      "x-user-id": user.id
    }
  });
}
