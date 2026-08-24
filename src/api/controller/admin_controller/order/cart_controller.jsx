import axiosInstance from '../../../axiosInstance.jsx'



export const getCartByUser = async (id, params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/carts/active/${id}`,  { params, redirectOnUnauth: false });
    return response.data;
  } catch (error) {
    console.error("Error fetching getCartByUser:", error);
    return { status: 'error', data: [] };
  }
}

export const deleteItem = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/carts/items/delete/${id}`, 
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`, // Add the token in Authorization header
        },
        redirectOnUnauth: true
      }     
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching deleteItem:", error);
    return { status: 'error', data: [] };
  }
}

export const updateQuantity = async (id, qty, params = {}) => {
  try {
    const response = await axiosInstance.put(`/api/carts/items/update/${id}?qty=${qty}`,
      null,
      {
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`, // Add the token in Authorization header
        },
      } 
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching updateQuantity:", error);
    return { status: 'error', data: [] };
  }
}


export const addCart = async (data) => {
  try {
    // productData should contain: shop_id, category_id, brand_id, name, slug, sku, short_description, description
    const response = await axiosInstance.post('/api/carts/items/add', 
      data,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`, // Add the token in Authorization header
          // 'Content-Type': 'multipart/form-data', // If you're sending FormData
        },
        redirectOnUnauth: true
      }  
    );
    return response.data;
  } catch (error) {
    console.error('Error creating addCart:', error);
    return { status: 'error', message: error.message };
  }
};