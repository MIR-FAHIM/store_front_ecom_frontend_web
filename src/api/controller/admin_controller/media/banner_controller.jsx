import axiosInstance from '../../../axiosInstance.jsx'


export const addBanner = async (data) => {
    try {
      // expect FormData for file upload
      const response = await axiosInstance.post(`/api/banners/add`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response; // Return the response from the API
    } catch (error) {
      console.error("Error posting data:", error);
      throw error; // Rethrow the error for further handling in your component
    }
  
  }

export const getBanner = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/banners/active`,
      { params }
        
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching getBanner:", error);
    return [];
  }
}
export const removeBanner = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/banners/remove/${id}`,
        
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching removeBanner:", error);
    return [];
  }
}
