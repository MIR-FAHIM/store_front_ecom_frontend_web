import axiosInstance from "../../../axiosInstance.jsx";

export const fetchSellerMarketplaceCategories = async (storeId) => {
  const response = await axiosInstance.get(`/api/seller/stores/${storeId}/categories/marketplace`);
  return response.data;
};

export const syncSellerStoreCategories = async (storeId, categoryIds) => {
  const response = await axiosInstance.post(`/api/seller/stores/${storeId}/categories/sync`, {
    category_ids: categoryIds,
  });
  return response.data;
};

export const toggleSellerStoreCategory = async (storeId, categoryId, isActive) => {
  const response = await axiosInstance.post(`/api/seller/stores/${storeId}/categories/toggle`, {
    category_id: categoryId,
    is_active: isActive,
  });
  return response.data;
};

export const fetchPublicStoreCategories = async (slug) => {
  const response = await axiosInstance.get(`/api/public/stores/${encodeURIComponent(slug)}/categories`, {
    skipAuth: true,
  });
  return response.data;
};
