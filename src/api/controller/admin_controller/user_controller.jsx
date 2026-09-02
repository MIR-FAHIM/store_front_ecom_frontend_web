import axiosInstance from '../../axiosInstance.jsx'
import { companyID } from '../../config'

// Fetch posts from API

const withWebPlatform = (data) => {
  if (data instanceof FormData) {
    if (!data.has("platform")) data.append("platform", "web");
    return data;
  }

  return { ...(data || {}), platform: "web" };
};

export const registerEmployee = async (data) => {
  try {
    const response = await axiosInstance.post(`/api/users/create`, data,


    );
    return response.data; // Return the response from the API
  } catch (error) {
    console.error("Error add Department data:", error);
    throw error; // Rethrow the error for further handling in your component
  }

}
export const registerSeller = async (data) => {
  try {
    const response = await axiosInstance.post(`/api/users/create-seller`, data, { skipAuth: true });
    return response.data; // Return the response from the API
  } catch (error) {
    console.error("Error add Seller data:", error);
    throw error; // Rethrow the error for further handling in your component
  }

}
export const checkReferralCode = async (code) => {
  try {
    const response = await axiosInstance.get(`/api/users/check-referral-code`, {
      params: { referral_code: code },
      skipAuth: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error checking referral code:", error);
    throw error;
  }
};

export const uploadProfileImage = async (data) => {
  try {
    const response = await axiosInstance.post(`/api/upload-user-image`, data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
        },
      }
    );
    return response.data; // Return the response from the API
  } catch (error) {
    console.error("Error upload Image data:", error);
    throw error; // Rethrow the error for further handling in your component
  }

}
export const loginController = async (data) => {
  try {
    const response = await axiosInstance.post(`/api/auth/login`, withWebPlatform(data), { skipAuth: true });
    return response.data; // Return the response from the API
  } catch (error) {
    console.error("Error login data:", error);
    throw error; // Rethrow the error for further handling in your component
  }

}
export const loginWithOtpController = async (data) => {
  try {
    const response = await axiosInstance.post(`/api/auth/login-otp`, withWebPlatform(data),

    );
    return response.data; // Return the response from the API
  } catch (error) {
    console.error("Error login with OTP data:", error);
    throw error; // Rethrow the error for further handling in your component
  }

}
export const getAllCustomers = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/users/customers`,
      {
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
        },
      }
    );
    return response.data; // Return the response from the API
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error; // Rethrow the error for further handling in your component
  }
}

export const updateUser = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/api/users/update/${id}`, data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const banUser = async (id) => {
  try {
    const response = await axiosInstance.patch(`/api/users/ban/${id}`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error banning user:", error);
    throw error;
  }
};

export const unbanUser = async (id) => {
  try {
    const response = await axiosInstance.patch(`/api/users/unban/${id}`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error unbanning user:", error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/users/delete/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
export const getDeliveryMen = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/users/delivery-men`, {
      params: params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data; // Return the response from the API
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error; // Rethrow the error for further handling in your component
  }
}

export const getAllVendors = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/users/vendors', { 
      params: params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
     });
    return response.data;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return { status: 'error', data: [] };
  }
};
export const getAllShops = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/shops/list', { 
      params: params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
     });
    return response.data;
  } catch (error) {
    console.error("Error fetching getAllShops:", error);
    return { status: 'error', data: [] };
  }
};
export const deleteSeller = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/users/delete-seller/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting seller:", error);
    return {
      status: 'error',
      message: error?.response?.data?.message || error.message || "Failed to delete seller",
    };
  }
};
export const getUserDetail = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/users/details/${id}`, { 
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
      },
     });
    return response.data;
  } catch (error) {
    console.error("Error fetching getUserDetail:", error);
    return { status: 'error', data: [] };
  }
};
