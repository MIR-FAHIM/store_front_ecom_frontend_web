import axiosInstance from '../../../axiosInstance.jsx'

// Fetch posts from API
export const getProductVa = async () => {
  try {
    const response = await axiosInstance.get(`/api/products/list`,
       
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching getProduct:", error);
    return [];
  }
}
export const getRelatedProducts = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/related-products/list/${id}`,
       
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching getRelatedProducts:", error);
    return [];
  }
}
export const getSellerFeaturedByProduct = async (id, params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/products/seller-featured-by-product`, {
      params: { product_id: id, ...params },
      skipAuth: Boolean(params?.store_slug || params?.store_id),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching getSellerFeaturedByProduct:", error);
    return [];
  }
}
export const addRelatedProducts = async (data) => {
  try {
    const response = await axiosInstance.post(`/api/related-products/add`, data);
    return response.data;
  } catch (error) {
    console.error("Error fetching addRelatedProducts:", error);
    return [];
  }
}
export const getProductAttributes = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/product-attributes/list?product_id=${id}`,
       
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching getProductAttributes:", error);
    return [];
  }
}
