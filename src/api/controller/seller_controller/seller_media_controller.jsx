import axiosInstance from "../../axiosInstance.jsx";

export const fetchSellerUploads = async (params = {}) => {
  const response = await axiosInstance.get("/api/uploads/list", { params });
  return response.data;
};

export const fetchSellerUploadDetails = async (id) => {
  const response = await axiosInstance.get(`/api/uploads/${id}`);
  return response.data;
};

export const uploadSellerFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post("/api/uploads/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export const deleteSellerUpload = async (id) => {
  const response = await axiosInstance.delete(`/api/uploads/${id}`);
  return response.data;
};
