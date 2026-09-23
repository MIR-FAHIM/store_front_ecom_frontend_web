import axiosInstance from "../../../axiosInstance.jsx";

export const getSubscriptionPackages = async (params = {}) => {
  const response = await axiosInstance.get("/api/subscription-packages", { params });
  return response.data;
};

export const getSubscriptionPackageDetails = async (id) => {
  const response = await axiosInstance.get(`/api/subscription-packages/${id}`);
  return response.data;
};

export const getSubscriptionPackageBySlug = async (slug) => {
  const response = await axiosInstance.get(`/api/subscription-packages/slug/${slug}`);
  return response.data;
};

export const createSubscriptionPackage = async (data) => {
  const response = await axiosInstance.post("/api/subscription-packages/create", data);
  return response.data;
};

export const updateSubscriptionPackage = async (id, data) => {
  const response = await axiosInstance.put(`/api/subscription-packages/update/${id}`, data);
  return response.data;
};

export const inactiveSubscriptionPackage = async (id) => {
  const response = await axiosInstance.patch(`/api/subscription-packages/inactive/${id}`);
  return response.data;
};

export const deleteSubscriptionPackage = async (id) => {
  const response = await axiosInstance.delete(`/api/subscription-packages/delete/${id}`);
  return response.data;
};

export const getStoreSubscription = async (storeId) => {
  const response = await axiosInstance.get(`/api/stores/${storeId}/subscription`);
  return response.data;
};

export const subscribeStorePackage = async (storeId, data) => {
  const response = await axiosInstance.post(`/api/stores/${storeId}/subscription/subscribe`, data);
  return response.data;
};

// ── Admin Subscription Report & Purchases List ──────────────────────────
export const getSubscriptionReport = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/api/reports/subscriptions", {
      params,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      try {
        const fallbackRes = await axiosInstance.get("/api/subscription-packages/reports", {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        return fallbackRes.data;
      } catch (fallbackErr) {
        console.error("Fallback getSubscriptionReport failed:", fallbackErr);
        return {
          status: "error",
          message: fallbackErr?.response?.data?.message || fallbackErr.message || "Failed to fetch subscription report",
          data: null,
        };
      }
    }
    console.error("Error fetching subscription report:", error);
    return {
      status: "error",
      message: error?.response?.data?.message || error.message || "Failed to fetch subscription report",
      data: null,
    };
  }
};

// ── Admin Manual Payment Verification & Package Upgrade ──────────────────
export const verifySubscriptionPayment = async (paymentId, data = {}) => {
  try {
    const response = await axiosInstance.post(`/api/reports/subscriptions/${paymentId}/verify-payment`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error verifying subscription payment #${paymentId}:`, error);
    return {
      status: "error",
      message: error?.response?.data?.message || error.message || "Failed to verify payment",
      data: null,
    };
  }
};

