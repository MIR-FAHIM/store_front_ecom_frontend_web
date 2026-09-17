import axiosInstance from '../../../axiosInstance.jsx';

export const addShop = async (data) => {
  try {
    // productData should contain: shop_id, category_id, brand_id, name, slug, sku, short_description, description
    const response = await axiosInstance.post('/api/shops/create', 
      data,
     
    );
    return response.data;
  } catch (error) {
    console.error('Error creating addShop:', error);
    return { status: 'error', message: error.message };
  }
};
export const getShopProduct = async (id, params = {}) => {
  try {
    // productData should contain: shop_id, category_id, brand_id, name, slug, sku, short_description, description
    const response = await axiosInstance.get(`/api/shops/products/${id}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting shop products:', error);
    return { status: 'error', message: error.message };
  }
};
export const getShopDetails = async (id, params = {}) => {
  try {
    // productData should contain: shop_id, category_id, brand_id, name, slug, sku, short_description, description
    const response = await axiosInstance.get(`/api/shops/details/${id}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting shop details:', error);
    return { status: 'error', message: error.message };
  }
};
export const getAllShops = async (params = {}) => {
  try {
    // productData should contain: shop_id, category_id, brand_id, name, slug, sku, short_description, description
    const response = await axiosInstance.get(`/api/shops/list`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting shop getAllShops:', error);
    return { status: 'error', message: error.message };
  }
};
export const updateShop = async (id, data) => {
  try {
    // productData should contain: shop_id, category_id, brand_id, name, slug, sku, short_description, description
    const response = await axiosInstance.post(`/api/shops/update/${id}`, data,); 
    return response.data;
  } catch (error) {
    console.error('Error updating shop updateShop:', error);
    return { status: 'error', message: error.message };
  }
};
export const updateShopStatus = async (id, data) => {
  try {
    // productData should contain: shop_id, category_id, brand_id, name, slug, sku, short_description, description
    const response = await axiosInstance.patch(`/api/shops/status/${id}`, data,); 
    return response.data;
  } catch (error) {
    console.error('Error updating shop updateShopStatus:', error);
    return { status: 'error', message: error.message };
  }
};

export const getStoreQrAppBlob = async (storeId) => {
  try {
    const response = await axiosInstance.get(`/api/stores/${storeId}/qr/app`, {
      responseType: 'blob',
      headers: {
        Accept: 'image/png',
      },
    });
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      try {
        const fallbackRes = await axiosInstance.get(`/api/shops/${storeId}/qr/app`, {
          responseType: 'blob',
          headers: {
            Accept: 'image/png',
          },
        });
        return fallbackRes.data;
      } catch (e) {
        throw error;
      }
    }
    console.error('Error fetching store QR image blob:', error);
    throw error;
  }
};

export const getStoreQrPayloadData = async (storeId) => {
  try {
    const response = await axiosInstance.get(`/api/stores/${storeId}/qr/payload`, {
      headers: {
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      try {
        const fallbackRes = await axiosInstance.get(`/api/shops/${storeId}/qr/payload`, {
          headers: {
            Accept: 'application/json',
          },
        });
        return fallbackRes.data;
      } catch (e) {
        throw error;
      }
    }
    console.error('Error fetching store QR payload:', error);
    throw error;
  }
};