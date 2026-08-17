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
