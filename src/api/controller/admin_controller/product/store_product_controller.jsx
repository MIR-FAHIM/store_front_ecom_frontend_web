import axiosInstance from "../../../axiosInstance.jsx";

export const fetchProductCatalog = async (storeId, params = {}) => {
  const response = await axiosInstance.get(`/api/seller/stores/${storeId}/product-catalog`, { params });
  return response.data;
};

export const addCatalogProductToStore = async (storeId, productId) => {
  const response = await axiosInstance.post(`/api/seller/stores/${storeId}/products/add-from-catalog`, {
    product_id: productId,
  });
  return response.data;
};

export const fetchSellerStoreProducts = async (storeId, params = {}) => {
  const response = await axiosInstance.get(`/api/seller/stores/${storeId}/products`, { params });
  return response.data;
};

export const updateSellerStoreProduct = async (storeId, storeProductId, payload) => {
  const response = await axiosInstance.put(`/api/seller/stores/${storeId}/products/${storeProductId}`, payload);
  return response.data;
};

export const removeSellerStoreProduct = async (storeId, storeProductId) => {
  const response = await axiosInstance.delete(`/api/seller/stores/${storeId}/products/${storeProductId}`);
  return response.data;
};
