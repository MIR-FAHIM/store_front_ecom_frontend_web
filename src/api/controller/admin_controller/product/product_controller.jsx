import axiosInstance from '../../../axiosInstance.jsx'

const isStoreScopedRequest = (params = {}) => Boolean(params?.store_slug || params?.store_id);

// Fetch posts from API
export const getProduct = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/products/list`, {
      params,
      skipAuth: isStoreScopedRequest(params),
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    // Return API payload (status/message/data) so callers can inspect response.status and response.data
    return response.data;
  } catch (error) {
    console.error("Error fetching getProduct:", error);
    return { status: 'error', message: error.message, data: null };
  }
};

export const getProductsByBrand = async (brandId, params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/products/brand/${brandId}`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching getProductsByBrand:", error);
    return {
      status: 'error',
      message: error?.response?.data?.message || error.message,
      data: null,
    };
  }
};


export const getAdminProduct = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/products/admin/list`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    // Return API payload (status/message/data) so callers can inspect response.status and response.data
    return response.data;
  } catch (error) {
    console.error("Error fetching getAdminProduct:", error);
    return { status: 'error', message: error.message, data: null };
  }
};



export const getStockOutProduct = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/products/list/stock-out`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    // Return API payload (status/message/data) so callers can inspect response.status and response.data
    return response.data;
  } catch (error) {
    console.error("Error fetching getStockOutProduct:", error);
    return { status: 'error', message: error.message, data: null };
  }
};

export const getInactiveProduct = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/products/list/inactive`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching getInactiveProduct:", error);
    return { status: 'error', message: error.message, data: null };
  }
};

export const getCategoryWiseProduct = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/products/category/wise`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    // Return API payload (status/message/data) so callers can inspect response.status and response.data
    return response.data;
  } catch (error) {
    console.error("Error fetching getProduct:", error);
    return { status: 'error', message: error.message, data: null };
  }
};


export const getFeaturedProduct = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/products/list/featured?featured=1`, {
      params,
      skipAuth: isStoreScopedRequest(params),
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    // Return API payload (status/message/data) so callers can inspect response.status and response.data
    return response.data;
  } catch (error) {
    console.error("Error fetching getProduct:", error);
    return { status: 'error', message: error.message, data: null };
  }
};

export const getTodayDealProduct = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/products/list/today-deal?todays_deal=1`, {
      params,
      skipAuth: isStoreScopedRequest(params),
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    // Return API payload (status/message/data) so callers can inspect response.status and response.data
    return response.data;
  } catch (error) {
    console.error("Error fetching getProduct:", error);
    return { status: 'error', message: error.message, data: null };
  }
};



export const getProductDetails = async (identifier, params = {}) => {

  try {
    const response = await axiosInstance.get(`/api/products/details/${encodeURIComponent(identifier)}`, {
      params,
      skipAuth: isStoreScopedRequest(params),
    });


    return response.data;


  } catch (error) {


    console.error("Error fetching getProductDetails:", error);



  }
}
export const getProductReviews = async (id) => {

  try {
    const response = await axiosInstance.get(`/api/reviews/product/${id}`,
      // {
      //   headers: {
      //     // 'token': localStorage.getItem("authToken"), // Add the token in Authorization header
      //     'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      //   },
      // }
    );


    return response.data;


  } catch (error) {


    console.error("Error fetching getProductReviews:", error);



  }
}


export const getStock = async () => {
  try {
    const response = await axiosInstance.get(`/api/stock/list`,
      {
        headers: {
          // 'token': localStorage.getItem("authToken"), // Add the token in Authorization header   
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching getStock:", error);
    return [];
  }
}

export const getProductWithVariants = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/product-variant/all/${id}`,
      {
        headers: {
          // 'token': localStorage.getItem("authToken"), // Add the token in Authorization header
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`, // Add the token in Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching getProductWithVariants:", error);
    return [];
  }
}
export const uploadProductImages = async (productId, images) => {
  try {
    const formData = new FormData();

    images.forEach((img, index) => {
      if (img.file) {
        formData.append(`images[${index}][image]`, img.file);
      }
      const uploadId = img.upload_id ?? img.media_id ?? img.id ?? null;
      if (uploadId) {
        formData.append(`images[${index}][upload_id]`, uploadId);
        formData.append(`images[${index}][media_id]`, uploadId);
      }
      formData.append(`images[${index}][is_primary]`, img.is_primary ? '1' : '0');
    });

    const response = await axiosInstance.post(
      `/api/products/images/upload/${productId}`,
      formData,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading product images:', error);
    return error?.response?.data || { status: 'error', message: error.message };
  }
};
export const getAllVarients = async () => {
  try {
    const response = await axiosInstance.get(`/api/product-variant/get-all-varients`,
      {
        headers: {
          // 'token': localStorage.getItem("authToken"), // Add the token in Authorization header
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`, // Add the token in Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching product-variant/get-all-varients:", error);
    return [];
  }
}
export const createProduct = async (productData) => {
  try {
    // productData should contain: shop_id, category_id, brand_id, name, slug, sku, short_description, description
    const response = await axiosInstance.post('/api/products/create', productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    return { status: 'error', message: error.message };
  }
};

export const updateProduct = async (id,productData) => {
  try {
    // productData should contain: shop_id, category_id, brand_id, name, slug, sku, short_description, description
    const response = await axiosInstance.post(`/api/products/update/${id}`, productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    return error?.response?.data || { status: 'error', message: error.message };
  }
};

export const duplicateProduct = async (id, data = {}) => {
  try {
    const response = await axiosInstance.post(`/api/products/duplicate/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error duplicating product:', error);
    throw error;
  }
};


export const addProdductDiscount = async (data) => {
  try {
    const response = await axiosInstance.post('/api/product-discounts/create', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating addProdductDiscount:', error);
    return { status: 'error', message: error.message };
  }
};

export const getProductDiscount = async (productId) => {
  try {
    const response = await axiosInstance.get(`/api/product-discounts/list?product_id=${productId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching product discount:', error);
    return null;
  }
};

export const updateProductDiscount = async (discountId, data) => {
  try {
    const response = await axiosInstance.put(`/api/product-discounts/update/${discountId}`, data, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating product discount:', error);
    return { status: 'error', message: error.message };
  }
};


export const addProductAttribute = async (data) => {
  try {
    const response = await axiosInstance.post(`/api/product-attributes/create`, data,
      {
        headers: {
          // 'token': localStorage.getItem("authToken"), // Add the token in Authorization header
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`, // Add the token in Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching addAttribute:", error);
    return [];
  }
}

export const deleteProduct = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/products/delete/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    return { status: 'error', message: error.message };
  }
};
