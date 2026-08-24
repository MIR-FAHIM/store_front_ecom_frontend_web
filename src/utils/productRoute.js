export const getProductIdentifier = (product) => {
  const slug = product?.slug ?? product?.product?.slug;
  if (slug) return encodeURIComponent(String(slug));

  const id = product?.id ?? product?.product_id ?? product?.product?.id;
  if (id === undefined || id === null || id === "") return "";

  return encodeURIComponent(String(id));
};

export const productDetailPath = (product, storeSlug = "") => {
  const identifier = getProductIdentifier(product);
  if (identifier && storeSlug) return `/store/${encodeURIComponent(String(storeSlug))}/products/${identifier}`;
  return identifier ? `/product/${identifier}` : "/product";
};

export const storeHomePath = (storeSlug = "") =>
  storeSlug ? `/store/${encodeURIComponent(String(storeSlug))}` : "/";

export const storeScopedPath = (path = "", storeSlug = "") => {
  const rawPath = String(path || "").trim();
  if (/^\/store\//.test(rawPath)) return rawPath || storeHomePath(storeSlug);
  if (!storeSlug) return rawPath || "/";

  const suffixIndex = rawPath.search(/[?#]/);
  const pathname = suffixIndex >= 0 ? rawPath.slice(0, suffixIndex) : rawPath;
  const suffix = suffixIndex >= 0 ? rawPath.slice(suffixIndex) : "";
  const cleanPath = pathname.replace(/^\/+/, "");

  if (!cleanPath) return storeHomePath(storeSlug) + suffix;
  return `/store/${encodeURIComponent(String(storeSlug))}/${cleanPath}${suffix}`;
};

export const storeProductsPath = (storeSlug = "") =>
  storeSlug ? `/store/${encodeURIComponent(String(storeSlug))}/products` : "/all-products";

export const categoryPath = (categoryId, storeSlug = "") => {
  const identifier = categoryId === undefined || categoryId === null ? "" : encodeURIComponent(String(categoryId));
  if (!identifier) return storeHomePath(storeSlug);
  return storeSlug ? `/store/${encodeURIComponent(String(storeSlug))}/category/${identifier}` : `/category/${identifier}`;
};

export const categoriesPath = (storeSlug = "") =>
  storeSlug ? `/store/${encodeURIComponent(String(storeSlug))}/categories` : "/categories";

export const cartPath = (storeSlug = "") => storeScopedPath("/cart", storeSlug);
export const checkoutPath = (storeSlug = "") => storeScopedPath("/checkout", storeSlug);
export const ordersPath = (storeSlug = "") => storeScopedPath("/orders", storeSlug);
export const orderDetailPath = (orderId, storeSlug = "") =>
  storeScopedPath(`/order/${encodeURIComponent(String(orderId || ""))}`, storeSlug);
export const orderSuccessPath = (storeSlug = "") => storeScopedPath("/order-success", storeSlug);
export const paymentResultPath = (result = "success", storeSlug = "") =>
  storeScopedPath(`/payment-${result}`, storeSlug);
export const searchPath = (query = "", storeSlug = "") => {
  const qs = query ? `?q=${encodeURIComponent(String(query))}` : "";
  return storeScopedPath(`/search${qs}`, storeSlug);
};
