import axiosInstance from '../../../axiosInstance.jsx'

// Fetch posts from API




export const getReportText = async () => {
  const token = localStorage.getItem("authToken"); // Retrieve token from localStorage

  if (!token) {
    console.error("No auth token found in localStorage.");
    return []; // Return an empty array or handle as necessary
  }
  try {
    const response = await axiosInstance.get(`/api/report-text`,
      {
        headers: {
          'token': localStorage.getItem("authToken"),// Add the token in Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching report-text:", error);
    return [];
  }
}


export const dashboardReport = async () => {
  const token = localStorage.getItem("authToken"); // Retrieve token from localStorage

  if (!token) {
    console.error("No auth token found in localStorage.");
    return []; // Return an empty array or handle as necessary
  }
  try {
    const response = await axiosInstance.get(`/api/reports/dashboard`,
      {
        headers: {
          'token': localStorage.getItem("authToken"),// Add the token in Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching fetchDepartment:", error);
    return [];
  }
}
export const getShopReport = async (userId) => {
  
  try {
    const response = await axiosInstance.get(`/api/reports/shop/${userId}`,
      {
        headers: {
          'token': localStorage.getItem("authToken"),// Add the token in Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching shop report:", error);
    return [];
  }
}

export const getShopMonthReport = async (shopId) => {
  
  try {
    const response = await axiosInstance.get(`/api/reports/shop/sales/${shopId}`,
      {
        headers: {
          'token': localStorage.getItem("authToken"),// Add the token in Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching shop month report:", error);
    return [];
  }
}
export const getAdminMonthReport = async () => {
  
  try {
    const response = await axiosInstance.get(`/api/reports/orders/monthly`,
      {
        headers: {
          'token': localStorage.getItem("authToken"),// Add the token in Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching admin month report:", error);
    return [];
  }
}
export const getTodayReport = async () => {
  
  try {
    const response = await axiosInstance.get(`/api/reports/today`,
      {
        headers: {
          'token': localStorage.getItem("authToken"),// Add the token in Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching today report:", error);
    return [];
  }
}










export const addNotices = async (data) => {
  const token = localStorage.getItem("authToken"); // Retrieve token from localStorage

  if (!token) {
    console.error("No auth token found in localStorage.");
    return []; // Return an empty array or handle as necessary
  }
  try {
    const response = await axiosInstance.post(`/api/notice/add`, data,
      {
        headers: {
          'token': localStorage.getItem("authToken"),// Add the token in Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching assNotices:", error);
    return [];
  }
}
export const deleteNotice = async (data) => {
  const token = localStorage.getItem("authToken"); // Retrieve token from localStorage

  if (!token) {
    console.error("No auth token found in localStorage.");
    return []; // Return an empty array or handle as necessary
  }
  try {
    const response = await axiosInstance.post(`/api/delete-notice`, data,
      {
        headers: {
          'token': localStorage.getItem("authToken"),// Add the token in Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching deleteNotice:", error);
    return [];
  }
}
export const updateNotice = async (data) => {
  const token = localStorage.getItem("authToken"); // Retrieve token from localStorage

  if (!token) {
    console.error("No auth token found in localStorage.");
    return []; // Return an empty array or handle as necessary
  }
  try {
    const response = await axiosInstance.post(`/api/update-notice`, data,
      {
        headers: {
          'token': localStorage.getItem("authToken"),// Add the token in Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching updateNotice:", error);
    return [];
  }
}
export const fetchNotices = async () => {
  const token = localStorage.getItem("authToken"); // Retrieve token from localStorage

  if (!token) {
    console.error("No auth token found in localStorage.");
    return []; // Return an empty array or handle as necessary
  }
  try {
    const response = await axiosInstance.get(`/api/notice/all`,
      {
        headers: {
          'token': localStorage.getItem("authToken"),// Add the token in Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching fetchNotices:", error);
    return [];
  }
}

export const getLoginSuccessLogs = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/reports/login-success`, {
      params,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching login success logs:", error);
    return {
      status: "error",
      message: error?.response?.data?.message || error.message || "Failed to fetch login success logs",
      data: null,
    };
  }
}

// ── Online Payment Report ──────────────────────────────────────────────────────
export const getOnlinePaymentReport = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/payments/online/report`, {
      params,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching online payment report:", error);
    return {
      status: "error",
      message: error?.response?.data?.message || error.message || "Failed to fetch payment report",
      data: null,
    };
  }
};
