import { image_file_url } from "../../../api/config";

export const normalizeListPayload = (response) => {
  const payload = response?.data ?? response;
  const page = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  const list = Array.isArray(page?.data)
    ? page.data
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

  return {
    list,
    currentPage: Number(page?.current_page || 1),
    lastPage: Number(page?.last_page || 1),
    perPage: Number(page?.per_page || 12),
    total: Number(page?.total || list.length),
  };
};

export const normalizeSimpleList = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.data?.data)) return response.data.data.data;
  return [];
};

export const getStoreIdFromShops = (shops = [], preferredId = "") => {
  if (preferredId) return String(preferredId);
  const storedId = localStorage.getItem("storeId") || localStorage.getItem("shopId");
  if (storedId) return String(storedId);
  const first = shops[0]?.id ?? shops[0]?.store_id ?? shops[0]?.shop_id;
  return first ? String(first) : "";
};

export const productImageUrl = (product) => {
  const image = product?.primary_image || product?.product?.primary_image;
  if (image?.url) return image.url;
  if (image?.file_name) return `${String(image_file_url || "").replace(/\/+$/, "")}/${String(image.file_name).replace(/^\/+/, "")}`;
  if (product?.image) return product.image;
  return "";
};

export const productDisplayName = (product) =>
  product?.name || product?.master_name || product?.title_override || product?.product?.name || "Product";

export const productPrice = (product) =>
  Number(product?.final_sale_price ?? product?.sale_price ?? product?.price ?? product?.unit_price ?? 0);

export const formatMoney = (value) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number(value || 0));
