import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "@mui/material";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  MenuItem,
  Stack,
  Snackbar,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import LinkIcon from "@mui/icons-material/Link";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import BoltIcon from "@mui/icons-material/Bolt";
import { tokens } from "../../../theme";
import { image_file_url } from "../../../api/config/index.jsx";
import {
  getAdminProduct,
  deleteProduct,
  duplicateProduct,
} from "../../../api/controller/admin_controller/product/product_controller.jsx";
import {
  getCategory,
  getBrand,
} from "../../../api/controller/admin_controller/product/setting_controller";
import { getAllShops } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";

/* â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const CURRENCY = "";

const fmtPrice = (val) => {
  const n = parseFloat(val);
  if (isNaN(n) || n === 0) return "â€”";
  return `${CURRENCY}${n.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const normalizeList = (x) => {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.data)) return x.data;
  if (Array.isArray(x?.data?.data)) return x.data.data;
  if (Array.isArray(x?.data?.data?.data)) return x.data.data.data;
  return [];
};

const DUPLICATE_PRODUCT_PAYLOAD = {
  published: false,
  approved: false,
  copy_images: true,
  copy_attributes: true,
  copy_discount: true,
};

/* â”€â”€ ProductImage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ProductImage({ product }) {
  const [imgError, setImgError] = useState(false);
  const url = (() => {
  
    if (product?.primary_image?.file_name) return `${image_file_url}/${product.primary_image.file_name}`;
    if (product?.images?.length) {
      const pImg = product.images.find((i) => i.is_primary) || product.images[0];
      if (pImg?.upload?.url) return pImg.upload.url;
      if (pImg?.url) return pImg.url;
      if (pImg?.file_name) return `${image_file_url}/${pImg.file_name}`;
    }
    return null;
  })();

  if (!url || imgError) {
    return (
      <Box sx={{ width: 52, height: 52, borderRadius: 1.5, bgcolor: "action.hover", display: "grid", placeItems: "center", border: "1px dashed", borderColor: "divider" }}>
        <ImageNotSupportedOutlinedIcon sx={{ fontSize: 20, color: "text.disabled" }} />
      </Box>
    );
  }
  return (
    <Box
      component="img"
      src={url}
      alt={product?.name}
      onError={() => setImgError(true)}
      sx={{ width: 52, height: 52, objectFit: "cover", borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}
    />
  );
}

/* â”€â”€ StockBadge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StockBadge({ stock }) {
  const n = parseInt(stock, 10);
  if (isNaN(n)) return <Typography variant="caption" color="text.disabled">â€”</Typography>;
  if (n === 0)
    return <Chip label="Out of Stock" size="small" icon={<WarningAmberIcon sx={{ fontSize: "14px !important" }} />} sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: 11, height: 22 }} />;
  if (n <= 5)
    return <Chip label={`Low: ${n}`} size="small" icon={<WarningAmberIcon sx={{ fontSize: "14px !important" }} />} sx={{ bgcolor: "#fff7ed", color: "#ea580c", fontWeight: 700, fontSize: 11, height: 22 }} />;
  return <Typography variant="body2" fontWeight={700} sx={{ color: "#16a34a" }}>{n.toLocaleString()}</Typography>;
}

/* â”€â”€ StatusStack â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StatusStack({ product }) {
  const published = !!product?.published;
  const approved  = !!product?.approved;
  const featured  = !!product?.featured;
  const todaysDeal = !!product?.todays_deal;
  return (
    <Stack spacing={0.5} alignItems="flex-start">
      {published && approved
        ? <Chip label="Published" size="small" sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 700, height: 20, fontSize: 11, borderRadius: 1 }} />
        : approved
        ? <Chip label="Approved"  size="small" sx={{ bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 700, height: 20, fontSize: 11, borderRadius: 1 }} />
        : <Chip label="Draft"     size="small" sx={{ bgcolor: "#fef3c7", color: "#b45309", fontWeight: 700, height: 20, fontSize: 11, borderRadius: 1 }} />
      }
      {featured    && <Chip icon={<StarBorderIcon sx={{ fontSize: "12px !important" }} />} label="Featured"      size="small" sx={{ bgcolor: "#ede9fe", color: "#7c3aed", fontWeight: 700, height: 20, fontSize: 11, borderRadius: 1 }} />}
      {todaysDeal  && <Chip icon={<BoltIcon       sx={{ fontSize: "12px !important" }} />} label="Today's Deal" size="small" sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 700, height: 20, fontSize: 11, borderRadius: 1 }} />}
    </Stack>
  );
}

/* â”€â”€ AllProducts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const AllProducts = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [shops, setShops] = useState([]);
  const [categoryId, setCategoryId] = useState("all");
  const [brandId, setBrandId] = useState("all");
  const [shopId, setShopId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const urlShopId = searchParams.get("shop_id");
    if (urlShopId) {
      setShopId(urlShopId);
    }
  }, [searchParams]);

  /* debounce search input */
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(0);
    }, 420);
    return () => clearTimeout(searchTimer.current);
  }, [searchTerm]);

  /* â”€â”€ fetch products â”€â”€ */
  const fetchProducts = useCallback(
    async (pg = 0, perPage = 10) => {
      try {
        setLoading(true);
        const params = { page: pg + 1, per_page: perPage };
        if (debouncedSearch) params.search = debouncedSearch;
        if (categoryId !== "all") params.category_id = categoryId;
        if (brandId !== "all") params.brand_id = brandId;
        if (shopId !== "all") params.shop_id = shopId;
        if (statusFilter === "published")  { params.published = 1; params.approved = 1; }
        else if (statusFilter === "draft")       params.published    = 0;
        else if (statusFilter === "featured")    params.featured     = 1;
        else if (statusFilter === "todays_deal") params.todays_deal  = 1;
        else if (statusFilter === "stock_out")   params.stock_out    = 1;

        const res = await getAdminProduct(params);
        const payload = res?.data ?? res;
        setProducts(Array.isArray(payload?.data) ? payload.data : []);
        setTotalProducts(payload?.total ?? payload?.meta?.total ?? payload?.pagination?.total ?? 0);
      } catch (err) {
        console.error("Error fetching products:", err);
        setSnack({ open: true, msg: "Failed to load products", severity: "error" });
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, categoryId, brandId, shopId, statusFilter]
  );

  /* â”€â”€ load filter dropdowns â”€â”€ */
  const loadFilters = async () => {
    try {
      const [cRes, bRes, sRes] = await Promise.all([
        getCategory(),
        getBrand(),
        getAllShops({ page: 1, per_page: 200 }),
      ]);
      setCategories(normalizeList(cRes));
      setBrands(normalizeList(bRes));
      setShops(normalizeList(sRes?.data ?? sRes));
    } catch (e) {
      console.error("Error loading filters:", e);
    }
  };

  useEffect(() => { loadFilters(); }, []);
  useEffect(() => { fetchProducts(page, rowsPerPage); }, [page, rowsPerPage, fetchProducts]);
  useEffect(() => { setPage(0); }, [debouncedSearch, categoryId, brandId, shopId, statusFilter]);

  /* â”€â”€ delete handler â”€â”€ */
  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?\nThis action cannot be undone.`)) return;
    try {
      setDeletingId(product.id);
      const res = await deleteProduct(product.id);
      if (res?.status === "error") throw new Error(res.message || "Delete failed");
      setSnack({ open: true, msg: `"${product.name}" deleted successfully`, severity: "success" });
      fetchProducts(page, rowsPerPage);
    } catch (err) {
      setSnack({ open: true, msg: err.message || "Failed to delete product", severity: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmDuplicate = async () => {
    if (!duplicateTarget?.id || duplicatingId) return;
    try {
      setDuplicatingId(duplicateTarget.id);
      const res = await duplicateProduct(duplicateTarget.id, DUPLICATE_PRODUCT_PAYLOAD);
      if (res?.status && res.status !== "success") {
        throw new Error(res.message || "Product duplicate failed");
      }
      setSnack({ open: true, msg: "Product duplicated successfully", severity: "success" });
      setDuplicateTarget(null);
      await fetchProducts(page, rowsPerPage);
    } catch (err) {
      setSnack({
        open: true,
        msg: err?.response?.data?.message || err?.message || "Product duplicate failed",
        severity: "error",
      });
    } finally {
      setDuplicatingId(null);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryId("all");
    setBrandId("all");
    setShopId("all");
    setStatusFilter("all");
  };

  const hasFilters =
    debouncedSearch || categoryId !== "all" || brandId !== "all" ||
    shopId !== "all" || statusFilter !== "all";

  /* â”€â”€ shared cell styles â”€â”€ */
  const headSx = {
    fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5,
    color: "text.secondary", borderBottom: "2px solid", borderColor: "divider",
    py: 1.5, bgcolor: "background.paper", whiteSpace: "nowrap",
  };
  const cellSx = { borderBottom: "1px solid", borderColor: "divider", py: 1.25, verticalAlign: "middle" };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1.5} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 46, height: 46, borderRadius: 2, bgcolor: "#eef2ff", display: "grid", placeItems: "center", color: "#6366f1", flexShrink: 0 }}>
            <InventoryOutlinedIcon />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>All Products</Typography>
            <Typography variant="body2" color="text.secondary">
              {loading ? "Loadingâ€¦" : totalProducts > 0 ? `${totalProducts.toLocaleString()} product${totalProducts !== 1 ? "s" : ""} total` : "Manage your product catalog"}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Refresh list">
            <IconButton onClick={() => fetchProducts(page, rowsPerPage)} disabled={loading} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
              {loading ? <CircularProgress size={18} /> : <RefreshIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate("/ecom/product/add")}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, bgcolor: "#6366f1", px: 2.5, "&:hover": { bgcolor: "#4f46e5" } }}>
            Add Product
          </Button>
        </Stack>
      </Stack>

      {/* â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Card sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider", mb: 2 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
            {/* Search */}
            <TextField size="small" placeholder="Search by name, SKU or slugâ€¦" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment> }}
              sx={{ flex: "1 1 220px", minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
            {/* Category */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Category</InputLabel>
              <Select value={categoryId} label="Category" onChange={(e) => setCategoryId(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name || c.title || "Category"}</MenuItem>)}
              </Select>
            </FormControl>
            {/* Brand */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Brand</InputLabel>
              <Select value={brandId} label="Brand" onChange={(e) => setBrandId(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="all">All Brands</MenuItem>
                {brands.map((b) => <MenuItem key={b.id} value={String(b.id)}>{b.name || b.title || "Brand"}</MenuItem>)}
              </Select>
            </FormControl>
            {/* Shop */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Shop</InputLabel>
              <Select value={shopId} label="Shop" onChange={(e) => setShopId(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="all">All Shops</MenuItem>
                {shops.map((s) => <MenuItem key={s.id} value={String(s.id)}>{s.name || `Shop #${s.id}`}</MenuItem>)}
              </Select>
            </FormControl>
            {/* Status */}
            <FormControl size="small" sx={{ minWidth: 155 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="published"><Stack direction="row" alignItems="center" spacing={1}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#16a34a" }} /><span>Published</span></Stack></MenuItem>
                <MenuItem value="draft"><Stack direction="row" alignItems="center" spacing={1}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#b45309" }} /><span>Draft / Pending</span></Stack></MenuItem>
                <MenuItem value="featured"><Stack direction="row" alignItems="center" spacing={1}><StarBorderIcon sx={{ fontSize: 14, color: "#7c3aed" }} /><span>Featured</span></Stack></MenuItem>
                <MenuItem value="todays_deal"><Stack direction="row" alignItems="center" spacing={1}><BoltIcon sx={{ fontSize: 14, color: "#dc2626" }} /><span>Today's Deal</span></Stack></MenuItem>
                <MenuItem value="stock_out"><Stack direction="row" alignItems="center" spacing={1}><WarningAmberIcon sx={{ fontSize: 14, color: "#ea580c" }} /><span>Out of Stock</span></Stack></MenuItem>
              </Select>
            </FormControl>
            {/* Reset */}
            {hasFilters && (
              <Button variant="outlined" size="small" startIcon={<FilterListOffIcon />} onClick={resetFilters}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, borderColor: "divider", color: "text.secondary", height: 40, flexShrink: 0 }}>
                Reset
              </Button>
            )}
          </Stack>

          {/* Active filter chips */}
          {hasFilters && (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              {debouncedSearch   && <Chip label={`Search: "${debouncedSearch}"`}                                                                                size="small" onDelete={() => setSearchTerm("")}       sx={{ fontWeight: 600, fontSize: 12 }} />}
              {categoryId !== "all" && <Chip label={`Category: ${categories.find((c) => String(c.id) === categoryId)?.name || categoryId}`}                   size="small" onDelete={() => setCategoryId("all")}   sx={{ fontWeight: 600, fontSize: 12 }} />}
              {brandId    !== "all" && <Chip label={`Brand: ${brands.find((b) => String(b.id) === brandId)?.name || brandId}`}                               size="small" onDelete={() => setBrandId("all")}      sx={{ fontWeight: 600, fontSize: 12 }} />}
              {shopId     !== "all" && <Chip label={`Shop: ${shops.find((s) => String(s.id) === shopId)?.name || shopId}`}                                   size="small" onDelete={() => setShopId("all")}       sx={{ fontWeight: 600, fontSize: 12 }} />}
              {statusFilter !== "all" && <Chip label={`Status: ${statusFilter.replace("_", " ")}`}                                                            size="small" onDelete={() => setStatusFilter("all")} sx={{ fontWeight: 600, fontSize: 12 }} />}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* â”€â”€ Table Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Card sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#6366f1" }} />
          </Box>
        ) : products.length === 0 ? (
          <Box sx={{ py: 7, textAlign: "center" }}>
            <InventoryOutlinedIcon sx={{ fontSize: 52, color: "text.disabled", mb: 1.5 }} />
            <Typography variant="h6" fontWeight={600} color="text.secondary">
              {hasFilters ? "No products match the current filters" : "No products yet"}
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5, mb: 2 }}>
              {hasFilters ? "Try adjusting or clearing the filters" : 'Click "Add Product" to create your first product'}
            </Typography>
            {hasFilters ? (
              <Button variant="outlined" size="small" startIcon={<FilterListOffIcon />} onClick={resetFilters} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}>Clear Filters</Button>
            ) : (
              <Button variant="contained" size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate("/ecom/product/add")} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, bgcolor: "#6366f1" }}>Add Product</Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headSx, pl: 2, width: 48 }}>#</TableCell>
                    <TableCell sx={{ ...headSx, width: 60 }}>Image</TableCell>
                    <TableCell sx={headSx}>Product</TableCell>
                    <TableCell sx={headSx}>Category / Brand</TableCell>
                    <TableCell sx={headSx}>Shop</TableCell>
                    <TableCell sx={{ ...headSx, textAlign: "right" }}>Price</TableCell>
                    <TableCell sx={{ ...headSx, textAlign: "center" }}>Stock</TableCell>
                    <TableCell sx={headSx}>Status</TableCell>
                    <TableCell sx={{ ...headSx, textAlign: "center", pr: 2 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} sx={{ "&:hover": { bgcolor: "action.hover" }, transition: "background-color 140ms", opacity: deletingId === product.id || duplicatingId === product.id ? 0.45 : 1 }}>

                      {/* # */}
                      <TableCell sx={{ ...cellSx, pl: 2 }}>
                        <Typography variant="caption" color="text.disabled" fontWeight={700}>#{product.id}</Typography>
                      </TableCell>

                      {/* Image */}
                      <TableCell sx={cellSx}><ProductImage product={product} /></TableCell>

                      {/* Name + slug */}
                      <TableCell sx={{ ...cellSx, maxWidth: 240 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3, mb: 0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 230 }} title={product.name}>
                          {product.name}
                        </Typography>
                        {(product.slug || product.sku) && (
                          <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace", fontSize: 11 }}>
                            {product.slug || product.sku}
                          </Typography>
                        )}
                        {product.unit && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 11 }}>
                            Unit: {product.unit}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Category / Brand */}
                      <TableCell sx={cellSx}>
                        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.4 }}>{product.category?.name || "â€”"}</Typography>
                        {product.brand?.name && <Typography variant="caption" color="text.secondary">{product.brand.name}</Typography>}
                      </TableCell>
                      {/* Category / Brand */}
                      <TableCell sx={cellSx}>
                       
                        {product.shop?.shop_name && <Typography variant="caption" color="text.secondary">{product.shop.shop_name}</Typography>}
                      </TableCell>

                      {/* Price */}
                      <TableCell sx={{ ...cellSx, textAlign: "right" }}>
                        <Typography variant="body2" fontWeight={800} sx={{ color: "#6366f1", lineHeight: 1.4 }}>{fmtPrice(product.unit_price)}</Typography>
                        {product.purchase_price && parseFloat(product.purchase_price) > 0 && (
                          <Typography variant="caption" color="text.secondary">Cost: {fmtPrice(product.purchase_price)}</Typography>
                        )}
                      </TableCell>

                      {/* Stock */}
                      <TableCell sx={{ ...cellSx, textAlign: "center" }}><StockBadge stock={product.current_stock} /></TableCell>

                      {/* Status */}
                      <TableCell sx={{ ...cellSx, minWidth: 120 }}><StatusStack product={product} /></TableCell>

                      {/* Actions */}
                      <TableCell sx={{ ...cellSx, textAlign: "center", pr: 2 }}>
                        <Stack direction="row" spacing={0.25} justifyContent="center">
                          <Tooltip title="Edit product">
                            <IconButton size="small" onClick={() => navigate(`/ecom/product/edit/${product.id}`)} sx={{ color: "#6366f1", "&:hover": { bgcolor: "#eef2ff" }, borderRadius: 1.5 }}>
                              <EditOutlinedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Related products">
                            <IconButton size="small" onClick={() => navigate(`/related-product-add?product_id=${product.id}`)} sx={{ color: "#0284c7", "&:hover": { bgcolor: "#f0f9ff" }, borderRadius: 1.5 }}>
                              <LinkIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Duplicate product">
                            <IconButton size="small" disabled={duplicatingId === product.id} onClick={() => setDuplicateTarget(product)} sx={{ color: "#7c3aed", "&:hover": { bgcolor: "#f5f3ff" }, borderRadius: 1.5 }}>
                              {duplicatingId === product.id
                                ? <CircularProgress size={16} sx={{ color: "#7c3aed" }} />
                                : <ContentCopyOutlinedIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete product">
                            <IconButton size="small" disabled={deletingId === product.id} onClick={() => handleDelete(product)} sx={{ color: "#dc2626", "&:hover": { bgcolor: "#fef2f2" }, borderRadius: 1.5 }}>
                              {deletingId === product.id
                                ? <CircularProgress size={16} sx={{ color: "#dc2626" }} />
                                : <DeleteOutlineIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 20, 50, 100]}
              component="div"
              count={totalProducts}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              sx={{ borderTop: "1px solid", borderColor: "divider" }}
            />
          </>
        )}
      </Card>

      <Dialog
        open={!!duplicateTarget}
        onClose={() => {
          if (!duplicatingId) setDuplicateTarget(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Duplicate this product?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            A draft copy of {duplicateTarget?.name ? `"${duplicateTarget.name}"` : "this product"} will be created with images, attributes, and discount copied.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDuplicateTarget(null)} disabled={!!duplicatingId} sx={{ textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDuplicate}
            disabled={!!duplicatingId}
            startIcon={duplicatingId ? <CircularProgress size={16} color="inherit" /> : <ContentCopyOutlinedIcon />}
            sx={{ textTransform: "none", fontWeight: 800, bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
          >
            Duplicate
          </Button>
        </DialogActions>
      </Dialog>

      {/* â”€â”€ Snackbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AllProducts;
