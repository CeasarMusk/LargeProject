import axios from "axios";
import { getStoredUser } from "../context/AuthContext";

const apiClient = axios.create({
  baseURL: "/api"
});

apiClient.interceptors.request.use((config) => {
  const user = getStoredUser();
  if (user?.id) {
    config.headers["x-user-id"] = user.id;
  }
  return config;
});

export default apiClient;
