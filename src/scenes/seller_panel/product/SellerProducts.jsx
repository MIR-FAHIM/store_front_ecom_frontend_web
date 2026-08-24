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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Pagination,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { getAllShops } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";
import { fetchSellerStoreProducts, removeSellerStoreProduct } from "../../../api/controller/admin_controller/product/store_product_controller.jsx";
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

const SellerPanelProducts = () => {
  const navigate = useNavigate();
  const { storeId: routeStoreId } = useParams();
  const [storeId, setStoreId] = useState(routeStoreId || "");
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const categoryOptions = useMemo(
    () =>
      flattenCategoryTree(categories).map((category) => ({
        ...category,
        label: `${"  ".repeat(category.depth || 0)}${category.name || "Category"}`,
      })),
    [categories]
  );

  const selectedStore = useMemo(
    () => stores.find((store) => String(store?.id) === String(storeId)) || null,
    [stores, storeId]
  );
  const storeSlug = selectedStore?.slug || selectedStore?.shop_slug || selectedStore?.store_slug || "";

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

  const loadCategories = useCallback(async (nextStoreId) => {
    if (!nextStoreId) return;
    const response = await fetchSellerMarketplaceCategories(nextStoreId);
    setCategories(filterActiveCategoryTree(normalizeCategoryList(response)));
  }, []);

  const loadProducts = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetchSellerStoreProducts(storeId, {
        page,
        per_page: 12,
        search: search.trim() || undefined,
        category_id: categoryId !== "all" ? categoryId : undefined,
        is_active: activeFilter !== "all" ? activeFilter : undefined,
      });
      const payload = normalizeListPayload(response);
      setProducts(payload.list);
      setLastPage(payload.lastPage);
      setTotal(payload.total);
    } catch (error) {
      setProducts([]);
      setErrorMessage(error?.response?.data?.message || error.message || "Failed to load store products.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, categoryId, page, search, storeId]);

  useEffect(() => {
    loadStores().catch((error) => setErrorMessage(error?.response?.data?.message || "Failed to load seller stores."));
  }, [loadStores]);

  useEffect(() => {
    if (storeId) loadCategories(storeId).catch((error) => setErrorMessage(error?.response?.data?.message || "Failed to load categories."));
  }, [loadCategories, storeId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryId, activeFilter, storeId]);

  const handleStoreChange = (nextStoreId) => {
    setStoreId(nextStoreId);
    localStorage.setItem("storeId", String(nextStoreId));
    navigate(`/seller/stores/${nextStoreId}/products`, { replace: true });
  };

  const handleRemove = async () => {
    if (!storeId || !removeTarget) return;
    const storeProductId = removeTarget?.store_product_id ?? removeTarget?.id;
    setRemoving(true);
    setMessage("");
    setErrorMessage("");
    try {
      await removeSellerStoreProduct(storeId, storeProductId);
      setMessage("Product removed from store successfully");
      setRemoveTarget(null);
      await loadProducts();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || error.message || "Failed to remove product from store.");
    } finally {
      setRemoving(false);
    }
  };

  const handleViewStorefront = (product) => {
    if (!storeSlug) return;
    const productSlug = product?.slug || product?.product?.slug || product?.id || product?.product_id;
    window.open(`/store/${encodeURIComponent(String(storeSlug))}/products/${encodeURIComponent(String(productSlug))}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={2} sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>Store Products</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage products currently connected to this store.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" startIcon={<LibraryBooksOutlinedIcon />} onClick={() => navigate(`/seller/stores/${storeId}/catalog`)} disabled={!storeId} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>
            Product Catalog
          </Button>
          <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => navigate(`/seller/add/product?shop_id=${storeId}`)} disabled={!storeId} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900 }}>
            Create Product
          </Button>
        </Stack>
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
              <TextField fullWidth size="small" label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ startAdornment: <SearchOutlinedIcon sx={{ mr: 1, color: "text.secondary" }} /> }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <MenuItem value="all">All active categories</MenuItem>
                {categoryOptions.map((category) => (
                  <MenuItem key={category.id} value={String(category.id)}>{category.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Status" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
                <MenuItem value="all">All products</MenuItem>
                <MenuItem value="1">Active</MenuItem>
                <MenuItem value="0">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      ) : products.length === 0 ? (
        <Alert severity="info">No store products found. Add products from the catalog or create a new product.</Alert>
      ) : (
        <Card sx={{ borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Featured</TableCell>
                  <TableCell>Today Deal</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => {
                  const storeProductId = product?.store_product_id ?? product?.id;
                  const imageUrl = productImageUrl(product);
                  return (
                    <TableRow key={storeProductId} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Box sx={{ width: 52, height: 52, borderRadius: 1, overflow: "hidden", bgcolor: "action.hover", flex: "0 0 auto" }}>
                            {imageUrl ? <Box component="img" src={imageUrl} alt={productDisplayName(product)} sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={900} noWrap>{productDisplayName(product)}</Typography>
                            <Typography variant="caption" color="text.secondary">{product?.sku || product?.product?.sku || "-"}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{product?.category?.name || product?.category_id || "-"}</TableCell>
                      <TableCell>{formatMoney(productPrice(product))}</TableCell>
                      <TableCell>{product?.stock ?? product?.current_stock ?? 0}</TableCell>
                      <TableCell>
                        <Chip size="small" color={product?.is_active ? "success" : "default"} label={product?.is_active ? "Active" : "Inactive"} sx={{ fontWeight: 800 }} />
                      </TableCell>
                      <TableCell><Switch size="small" checked={Boolean(product?.is_featured ?? product?.featured)} disabled /></TableCell>
                      <TableCell><Switch size="small" checked={Boolean(product?.todays_deal)} disabled /></TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit store product">
                          <IconButton onClick={() => navigate(`/seller/stores/${storeId}/products/${storeProductId}/edit`, { state: { product } })}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View storefront product">
                          <span>
                            <IconButton onClick={() => handleViewStorefront(product)} disabled={!storeSlug}>
                              <LaunchOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Remove from store">
                          <IconButton onClick={() => setRemoveTarget(product)}>
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {products.length > 0 ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">{total} store products</Typography>
          <Pagination count={lastPage} page={page} onChange={(_e, value) => setPage(value)} color="primary" shape="rounded" />
        </Stack>
      ) : null}

      <Dialog open={Boolean(removeTarget)} onClose={() => setRemoveTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove product</DialogTitle>
        <DialogContent>
          <Typography>Remove this product from your store? The master product will not be deleted.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveTarget(null)} disabled={removing}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleRemove} disabled={removing}>
            {removing ? "Removing..." : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerPanelProducts;
