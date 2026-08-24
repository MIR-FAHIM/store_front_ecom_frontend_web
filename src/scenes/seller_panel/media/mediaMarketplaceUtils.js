import { image_file_url } from "../../../api/config";

export const safeArray = (value) => (Array.isArray(value) ? value : []);

export const unwrapData = (response) => response?.data?.data ?? response?.data ?? response ?? null;

export const normalizeListPayload = (response) => {
  const payload = unwrapData(response) ?? {};
  const list = Array.isArray(payload?.data) ? payload.data : safeArray(payload);

  return {
    list,
    currentPage: Number(payload?.current_page || 1),
    lastPage: Number(payload?.last_page || 1),
    total: Number(payload?.total || list.length),
  };
};

export const normalizeSimpleList = (response) => {
  const payload = unwrapData(response);
  return Array.isArray(payload?.data) ? payload.data : safeArray(payload);
};

export const resolveMediaImage = (resource) => {
  const image =
    resource?.preview_image?.url ||
    resource?.preview_image?.file_url ||
    resource?.preview_image?.file_name ||
    resource?.upload?.url ||
    resource?.image?.url ||
    resource?.image_url ||
    resource?.thumbnail;

  if (!image) return "https://via.placeholder.com/640x360?text=Creative+Preview";
  if (/^https?:\/\//i.test(String(image))) return String(image);

  const base = String(image_file_url || "").replace(/\/+$/, "");
  return `${base}/${String(image).replace(/^\/+/, "")}`;
};

export const formatMoney = (amount, currency = "BDT") =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: currency || "BDT",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export const getStoreIdFromShops = (shops, preferredId = "") => {
  const selected =
    shops.find((shop) => String(shop?.id) === String(preferredId)) ||
    shops.find((shop) => String(shop?.id) === String(localStorage.getItem("storeId") || localStorage.getItem("shopId"))) ||
    shops[0];

  return selected?.id ? String(selected.id) : "";
};

export const fieldInputTypes = new Set(["text", "textarea", "number", "color", "url"]);

export const getOrderId = (response) =>
  response?.data?.id ?? response?.data?.order_id ?? response?.id ?? response?.order_id ?? response?.data?.data?.id;
