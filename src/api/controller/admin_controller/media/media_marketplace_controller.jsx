import axiosInstance from "../../../axiosInstance.jsx";

const normalizeUploadId = (payload) =>
  payload?.data?.id ??
  payload?.data?.upload_id ??
  payload?.id ??
  payload?.upload_id ??
  payload?.data?.data?.id ??
  payload?.data?.data?.upload_id;

export const uploadMarketplaceImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("file", file);

  const response = await axiosInstance.post("/api/uploads/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return {
    ...response.data,
    upload_id: normalizeUploadId(response.data),
  };
};

export const fetchSellerMediaCategories = async () => {
  const response = await axiosInstance.get("/api/seller/media-marketplace/categories");
  return response.data;
};

export const fetchSellerMediaResources = async (params = {}) => {
  const response = await axiosInstance.get("/api/seller/media-marketplace/resources", { params });
  return response.data;
};

export const fetchSellerMediaResourceDetails = async (idOrSlug) => {
  const response = await axiosInstance.get(`/api/seller/media-marketplace/resources/${encodeURIComponent(idOrSlug)}`);
  return response.data;
};

export const createSellerMediaOrder = async (storeId, payload) => {
  const response = await axiosInstance.post(`/api/seller/stores/${storeId}/media-orders`, payload);
  return response.data;
};

export const paySellerMediaOrder = async (storeId, orderId) => {
  const response = await axiosInstance.post(`/api/seller/stores/${storeId}/media-orders/${orderId}/pay`);
  return response.data;
};

export const fetchSellerMediaOrders = async (storeId, params = {}) => {
  const response = await axiosInstance.get(`/api/seller/stores/${storeId}/media-orders`, { params });
  return response.data;
};

export const fetchSellerMediaOrderDetails = async (storeId, orderId) => {
  const response = await axiosInstance.get(`/api/seller/stores/${storeId}/media-orders/${orderId}`);
  return response.data;
};

export const requestSellerMediaRevision = async (storeId, orderId, payload) => {
  const response = await axiosInstance.post(`/api/seller/stores/${storeId}/media-orders/${orderId}/revisions`, payload);
  return response.data;
};

export const approveSellerMediaOrder = async (storeId, orderId) => {
  const response = await axiosInstance.post(`/api/seller/stores/${storeId}/media-orders/${orderId}/approve`);
  return response.data;
};

export const fetchAdminMediaCategories = async (params = {}) => {
  const response = await axiosInstance.get("/api/admin/media-marketplace/categories", { params });
  return response.data;
};

export const createAdminMediaCategory = async (payload) => {
  const response = await axiosInstance.post("/api/admin/media-marketplace/categories", payload);
  return response.data;
};

export const updateAdminMediaCategory = async (id, payload) => {
  const response = await axiosInstance.put(`/api/admin/media-marketplace/categories/${id}`, payload);
  return response.data;
};

export const deleteAdminMediaCategory = async (id) => {
  const response = await axiosInstance.delete(`/api/admin/media-marketplace/categories/${id}`);
  return response.data;
};

export const fetchAdminMediaResources = async (params = {}) => {
  const response = await axiosInstance.get("/api/admin/media-marketplace/resources", { params });
  return response.data;
};

export const createAdminMediaResource = async (payload) => {
  const response = await axiosInstance.post("/api/admin/media-marketplace/resources", payload);
  return response.data;
};

export const updateAdminMediaResource = async (id, payload) => {
  const response = await axiosInstance.put(`/api/admin/media-marketplace/resources/${id}`, payload);
  return response.data;
};

export const deleteAdminMediaResource = async (id) => {
  const response = await axiosInstance.delete(`/api/admin/media-marketplace/resources/${id}`);
  return response.data;
};

export const fetchAdminMediaOrders = async (params = {}) => {
  const response = await axiosInstance.get("/api/admin/media-marketplace/orders", { params });
  return response.data;
};

export const fetchAdminMediaOrderDetails = async (id) => {
  const response = await axiosInstance.get(`/api/admin/media-marketplace/orders/${id}`);
  return response.data;
};

export const updateAdminMediaOrderStatus = async (id, payload) => {
  const response = await axiosInstance.put(`/api/admin/media-marketplace/orders/${id}/status`, payload);
  return response.data;
};

export const uploadAdminMediaDeliverable = async (id, payload) => {
  const response = await axiosInstance.post(`/api/admin/media-marketplace/orders/${id}/deliverables`, payload);
  return response.data;
};
