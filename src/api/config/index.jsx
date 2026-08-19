const env = import.meta.env;

const boolFromEnv = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
};

export const appClient = env.VITE_CLIENT_KEY || "myzoo";
export const base_url = env.VITE_API_BASE_URL || "https://myzooapi.myzoo.asia/public";
export const image_file_url =
  env.VITE_IMAGE_FILE_URL || "https://myzooapi.myzoo.asia/storage/app/public";
export const appname = env.VITE_APP_NAME || "MyZoo";
export const siteName = env.VITE_SITE_NAME || appname;
export const appLogo = env.VITE_APP_LOGO_URL || "";
export const initialRoute = env.VITE_INITIAL_ROUTE || "";
export const companyID = env.VITE_COMPANY_ID || "3";
export const google_map_key =
  env.VITE_GOOGLE_MAP_KEY || "AIzaSyBgU4tHGpYmeb5KYEB9Ml4qoz1w-JJmKb8";

export const isAdminOnly = boolFromEnv(env.VITE_ADMIN_ONLY);
export const hasCustomerSite = !isAdminOnly;
export const hasSellerPanel = boolFromEnv(env.VITE_SELLER_PANEL, !isAdminOnly);

export const projectConfig = {
  client: appClient,
  appName: appname,
  siteName,
  appLogo,
  initialRoute,
  baseUrl: base_url,
  imageFileUrl: image_file_url,
  companyId: companyID,
  adminOnly: isAdminOnly,
  hasCustomerSite,
  hasSellerPanel,
};
