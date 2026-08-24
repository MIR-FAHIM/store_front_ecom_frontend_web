import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddShoppingCartOutlinedIcon from "@mui/icons-material/AddShoppingCartOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { getAllShops } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";
import { getBrand } from "../../../api/controller/admin_controller/product/setting_controller";
import { fetchProductCatalog, addCatalogProductToStore } from "../../../api/controller/admin_controller/product/store_product_controller.jsx";
import { fetchSellerMarketplaceCategories } from "../../../api/controller/admin_controller/category/store_category_controller.jsx";
import { filterActiveCategoryTree, flattenCategoryTree, normalizeCategoryList } from "../../../utils/categoryTree";
import {
  formatMoney,
  getStoreIdFromShops,
  normalizeListPayload,
  normalizeSimpleList,
  productDisplayName,
  productImageUrl,
  productPrice,
} from "./storeProductUtils";

const SellerProductCatalog = () => {
  const navigate = useNavigate();
  const { storeId: routeStoreId } = useParams();
  const [storeId, setStoreId] = useState(routeStoreId || "");
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [brandId, setBrandId] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const categoryOptions = useMemo(
    () =>
      flattenCategoryTree(categories).map((category) => ({
        ...category,
        label: `${"  ".repeat(category.depth || 0)}${category.name || "Category"}`,
      })),
    [categories]
  );

  const loadStores = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    const response = await getAllShops({ user_id: userId, page: 1, per_page: 100 });
    const list = normalizeSimpleList(response);
    setStores(list);
    const nextStoreId = getStoreIdFromShops(list, routeStoreId || storeId);
    if (nextStoreId && nextStoreId !== storeId) {
      setStoreId(nextStoreId);
      localStorage.setItem("storeId", nextStoreId);
    }
  }, [routeStoreId, storeId]);

  const loadFilters = useCallback(async (nextStoreId) => {
    if (!nextStoreId) return;
    const [categoryResponse, brandResponse] = await Promise.all([
      fetchSellerMarketplaceCategories(nextStoreId),
      getBrand(),
    ]);
    setCategories(filterActiveCategoryTree(normalizeCategoryList(categoryResponse)));
    setBrands(normalizeSimpleList(brandResponse));
  }, []);

  const loadCatalog = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetchProductCatalog(storeId, {
        page,
        per_page: 12,
        search: search.trim() || undefined,
        category_id: categoryId !== "all" ? categoryId : undefined,
        brand_id: brandId !== "all" ? brandId : undefined,
      });
      const payload = normalizeListPayload(response);
      setProducts(payload.list);
      setLastPage(payload.lastPage);
      setTotal(payload.total);
    } catch (error) {
      setProducts([]);
      setErrorMessage(error?.response?.data?.message || error.message || "Failed to load product catalog.");
    } finally {
      setLoading(false);
    }
  }, [brandId, categoryId, page, search, storeId]);

  useEffect(() => {
    loadStores().catch((error) => setErrorMessage(error?.response?.data?.message || "Failed to load seller stores."));
  }, [loadStores]);

  useEffect(() => {
    if (storeId) loadFilters(storeId).catch((error) => setErrorMessage(error?.response?.data?.message || "Failed to load filters."));
  }, [loadFilters, storeId]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryId, brandId, storeId]);

  const handleStoreChange = (nextStoreId) => {
    setStoreId(nextStoreId);
    localStorage.setItem("storeId", String(nextStoreId));
    navigate(`/seller/stores/${nextStoreId}/catalog`, { replace: true });
  };

  const handleAdd = async (product) => {
    const productId = product?.id ?? product?.product_id;
    if (!storeId || !productId) return;
    setAddingId(String(productId));
    setMessage("");
    setErrorMessage("");
    try {
      await addCatalogProductToStore(storeId, productId);
      setMessage("Product added to store successfully");
      setProducts((prev) =>
        prev.map((item) =>
          String(item?.id ?? item?.product_id) === String(productId)
            ? { ...item, already_added_to_store: true }
            : item
        )
      );
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error.message || "Failed to add product to store.";
      setErrorMessage(
        backendMessage === "This category is not active for your store."
          ? `${backendMessage} Please activate this category first.`
          : backendMessage
      );
    } finally {
      setAddingId("");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={2} sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>Product Catalog</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Search MyZoo products and add selected items to your store.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<StorefrontOutlinedIcon />} onClick={() => navigate(`/seller/stores/${storeId}/products`)} disabled={!storeId} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>
          Store Products
        </Button>
      </Stack>

      {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}
      {errorMessage ? <Alert severity="warning" sx={{ mb: 2 }}>{errorMessage}</Alert> : null}

      <Card sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Store" value={storeId} onChange={(e) => handleStoreChange(e.target.value)}>
                {stores.map((store) => (
                  <MenuItem key={store.id} value={String(store.id)}>{store.name || store.shop_name || `Store #${store.id}`}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth size="small" label="Search catalog" value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ startAdornment: <ManageSearchOutlinedIcon sx={{ mr: 1, color: "text.secondary" }} /> }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Active category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <MenuItem value="all">All active categories</MenuItem>
                {categoryOptions.map((category) => (
                  <MenuItem key={category.id} value={String(category.id)}>{category.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Brand" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                <MenuItem value="all">All brands</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand.id} value={String(brand.id)}>{brand.name || brand.title || "Brand"}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      ) : products.length === 0 ? (
        <Alert severity="info">No catalog products found.</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {products.map((product) => {
              const id = product?.id ?? product?.product_id;
              const alreadyAdded = Boolean(product?.already_added_to_store);
              const imageUrl = productImageUrl(product);
              return (
                <Grid item xs={12} sm={6} lg={4} key={id}>
                  <Card sx={{ height: "100%", borderRadius: 2 }}>
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Box sx={{ width: 74, height: 74, borderRadius: 1, bgcolor: "action.hover", overflow: "hidden", flex: "0 0 auto" }}>
                          {imageUrl ? <Box component="img" src={imageUrl} alt={productDisplayName(product)} sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography fontWeight={900} sx={{ lineHeight: 1.25 }}>{productDisplayName(product)}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{product?.category?.name || "No category"} · {product?.brand?.name || "No brand"}</Typography>
                          <Typography fontWeight={900} sx={{ mt: 0.8 }}>{formatMoney(productPrice(product))}</Typography>
                          {alreadyAdded ? <Chip size="small" color="success" icon={<CheckCircleOutlineIcon />} label="Already Added" sx={{ mt: 1, fontWeight: 800 }} /> : null}
                        </Box>
                      </Stack>
                      <Button
                        fullWidth
                        variant={alreadyAdded ? "outlined" : "contained"}
                        disabled={String(addingId) === String(id)}
                        startIcon={alreadyAdded ? <CheckCircleOutlineIcon /> : <AddShoppingCartOutlinedIcon />}
                        onClick={() => alreadyAdded ? navigate(`/seller/stores/${storeId}/products`) : handleAdd(product)}
                        sx={{ mt: 2, borderRadius: 1, textTransform: "none", fontWeight: 900 }}
                      >
                        {alreadyAdded ? "Manage" : String(addingId) === String(id) ? "Adding..." : "Add to Store"}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">{total} catalog products</Typography>
            <Pagination count={lastPage} page={page} onChange={(_e, value) => setPage(value)} color="primary" shape="rounded" />
          </Stack>
        </>
      )}
    </Box>
  );
};

export default SellerProductCatalog;
