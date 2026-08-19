export const normalizeCategoryList = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.data?.data)) return response.data.data.data;
  if (Array.isArray(response?.categories)) return response.categories;
  if (Array.isArray(response?.data?.categories)) return response.data.categories;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data?.items)) return response.data.items;

  const inner = response?.data ?? response;
  if (inner && typeof inner === "object") {
    for (const key of Object.keys(inner)) {
      if (Array.isArray(inner[key])) return inner[key];
    }
  }

  return [];
};

export const flattenCategoryTree = (categories = []) => {
  const flat = [];
  const walk = (nodes = [], depth = 0, parent = null) => {
    nodes.forEach((node) => {
      if (!node) return;
      flat.push({ ...node, depth, parent });
      if (Array.isArray(node.children) && node.children.length > 0) {
        walk(node.children, depth + 1, node);
      }
    });
  };

  walk(Array.isArray(categories) ? categories : []);
  return flat;
};

export const filterActiveCategoryTree = (categories = []) =>
  (Array.isArray(categories) ? categories : [])
    .map((category) => {
      const children = filterActiveCategoryTree(category?.children || []);
      if (category?.is_active_for_store === true || children.length > 0) {
        return { ...category, children };
      }
      return null;
    })
    .filter(Boolean);

export const getActiveCategoryIds = (categories = []) =>
  flattenCategoryTree(categories)
    .filter((category) => category?.is_active_for_store === true)
    .map((category) => category.id ?? category._id)
    .filter((id) => id !== undefined && id !== null);

export const findCategoryInTree = (categories = [], categoryId = "") => {
  const targetId = String(categoryId);
  let match = null;

  const walk = (nodes = []) => {
    for (const node of nodes) {
      if (!node) continue;
      if (String(node.id ?? node._id) === targetId) {
        match = node;
        return true;
      }
      if (Array.isArray(node.children) && walk(node.children)) return true;
    }
    return false;
  };

  walk(Array.isArray(categories) ? categories : []);
  return match;
};
