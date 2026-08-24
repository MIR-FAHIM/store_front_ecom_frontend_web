
import axiosInstance from '../../../axiosInstance.jsx'


export const addAttribute = async (data) => {
    try {
      const response = await axiosInstance.post(`/api/attributes/create`, data,
        { headers: {
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`, // Add the token in Authorization header
        },
      }
      );
      return response; // Return the response from the API
    } catch (error) {
      console.error("Error posting data:", error);
      throw error; // Rethrow the error for further handling in your component
    }
  
  }

export const getBrand = async (params = {}) => {
  try {
    const isStoreScopedRequest = Boolean(params?.store_slug || params?.store_id);
    const response = await axiosInstance.get(`/api/brands/list`, {
      params,
      skipAuth: isStoreScopedRequest,
      headers: isStoreScopedRequest ? {} : {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`, // Add the token in Authorization header
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching getBrand:", error);
    return [];
  }
}
export const getCategory = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/categories/list`,
        {
            params,
            skipAuth: Boolean(params?.store_slug || params?.store_id),
            headers: {  
              'Authorization': `Bearer ${localStorage.getItem("authToken")}`, // Add the token in Authorization header
            },
        }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching getCategory:", error);
    return [];
  }
}
// Fetch posts from API
export const getAttributes = async () => {
    try {
        const response = await axiosInstance.get(`/api/attributes/list`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem("authToken")}`, // Add the token in Authorization header
            },
          }
        ); // Assuming your API endpoint to fetch posts
        return response;
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }}
export const getAttributeDetails = async (id) => {
    try {
        const response = await axiosInstance.get(`/api/attributes/details/${id}`); // Assuming your API endpoint to fetch posts
        return response;
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }}
export const addAttributeValue = async (data) => {
    try {
      const response = await axiosInstance.post(`/api/attributes/values/create`, data);
      return response; // Return the response from the API
    } catch (error) {
      console.error("Error posting data:", error);
      throw error; // Rethrow the error for further handling in your component
    }
  
  }


// Fetch posts from API
export const getAttributesValues = async (id) => {
    try {
        const response = await axiosInstance.get(`/api/get-attribute-value/${id}`); // Assuming your API endpoint to fetch posts
        return response;
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
};
