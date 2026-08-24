import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { storeScopedPath } from "../utils/productRoute";

const StorefrontContext = createContext(null);

export const getStoreSlugFromPathname = (pathname = "") => {
  const match = String(pathname).match(/^\/store\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : "";
};

export const StorefrontProvider = ({ children }) => {
  const location = useLocation();
  const currentStoreSlug = useMemo(() => getStoreSlugFromPathname(location.pathname), [location.pathname]);

  useEffect(() => {
    if (!currentStoreSlug) return;
    sessionStorage.setItem("active_store_slug", currentStoreSlug);
  }, [currentStoreSlug]);

  const value = useMemo(() => {
    const storeParams = currentStoreSlug ? { store_slug: currentStoreSlug } : {};
    const storePath = (path = "") => storeScopedPath(path, currentStoreSlug);
    const withStoreParams = (params = {}) => ({ ...params, ...storeParams });

    return {
      currentStoreSlug,
      storeSlug: currentStoreSlug,
      isStorefront: Boolean(currentStoreSlug),
      storeParams,
      storePath,
      withStoreParams,
    };
  }, [currentStoreSlug]);

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
};

export const useStorefront = () => {
  const context = useContext(StorefrontContext);
  if (context) return context;

  return {
    currentStoreSlug: "",
    storeSlug: "",
    isStorefront: false,
    storeParams: {},
    storePath: (path = "") => storeScopedPath(path, ""),
    withStoreParams: (params = {}) => params,
  };
};

