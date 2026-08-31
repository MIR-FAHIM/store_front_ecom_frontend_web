import axiosInstance from "../../axiosInstance.jsx";

const BASE = "/api/customer-preferences-store";

const errorPayload = (error, fallback) => ({
  status: "error",
  message: error?.response?.data?.message || fallback,
  errors: error?.response?.data?.errors || null,
  statusCode: error?.response?.status,
});

export const getCustomersBySeller = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`${BASE}/customers-by-seller`, {
      params,
      redirectOnUnauth: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error loading seller preferred customers:", error);
    return errorPayload(error, "Failed to load customer list");
  }
};

export const addCustomerPreference = async (customerOrPayload) => {
  try {
    const payload =
      customerOrPayload && typeof customerOrPayload === "object"
        ? customerOrPayload
        : { customer_user_id: customerOrPayload };
    const response = await axiosInstance.post(
      `${BASE}/add-customer-preference`,
      payload,
      { redirectOnUnauth: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding preferred customer:", error);
    return errorPayload(error, "Failed to add customer");
  }
};

export const getSellersByCustomer = async (params = {}) => {
  try {
    const response = await axiosInstance.get(`${BASE}/sellers-by-customer`, {
      params,
      redirectOnUnauth: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error loading customer preferred stores:", error);
    return errorPayload(error, "Failed to load preferred stores");
  }
};

export const addSellerPreference = async (sellerId) => {
  try {
    const response = await axiosInstance.post(
      `${BASE}/add-seller-preference`,
      { seller_id: sellerId },
      { redirectOnUnauth: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding preferred store:", error);
    return errorPayload(error, "Failed to add store preference");
  }
};

export const removeCustomerPreference = async ({ customer_user_id, seller_id }) => {
  try {
    const response = await axiosInstance.delete(`${BASE}/remove`, {
      data: { customer_user_id, seller_id },
      redirectOnUnauth: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error removing preference:", error);
    return errorPayload(error, "Failed to remove preference");
  }
};
