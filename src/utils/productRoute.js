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

export const categoryPath = (categoryId, storeSlug = "") => {
  const identifier = categoryId === undefined || categoryId === null ? "" : encodeURIComponent(String(categoryId));
  if (!identifier) return storeHomePath(storeSlug);
  return storeSlug ? `/store/${encodeURIComponent(String(storeSlug))}/category/${identifier}` : `/category/${identifier}`;
};

export const categoriesPath = (storeSlug = "") =>
  storeSlug ? `/store/${encodeURIComponent(String(storeSlug))}/categories` : "/categories";
