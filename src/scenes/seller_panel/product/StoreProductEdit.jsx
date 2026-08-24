import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { fetchSellerStoreProducts, updateSellerStoreProduct } from "../../../api/controller/admin_controller/product/store_product_controller.jsx";
import {
  formatMoney,
  normalizeListPayload,
  productDisplayName,
  productImageUrl,
  productPrice,
} from "./storeProductUtils";

const toBool = (value) => value === true || value === 1 || value === "1";

const buildForm = (product = {}) => ({
  price: product?.price ?? product?.unit_price ?? "",
  discount: product?.discount ?? "",
  discount_type: product?.discount_type || "percent",
  stock: product?.stock ?? product?.current_stock ?? "",
  sku: product?.sku || "",
  title_override: product?.title_override || product?.name || "",
  description_override: product?.description_override || product?.description || "",
  is_active: toBool(product?.is_active ?? true),
  is_featured: toBool(product?.is_featured ?? product?.featured),
  todays_deal: toBool(product?.todays_deal),
});

const StoreProductEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { storeId, storeProductId } = useParams();
  const [product, setProduct] = useState(location.state?.product || null);
  const [form, setForm] = useState(buildForm(location.state?.product || {}));
  const [loading, setLoading] = useState(!location.state?.product);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const imageUrl = useMemo(() => productImageUrl(product), [product]);
  const masterProduct = product?.product || {};

  const loadProduct = useCallback(async () => {
    if (!storeId || !storeProductId || product) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetchSellerStoreProducts(storeId, { per_page: 200 });
      const payload = normalizeListPayload(response);
      const found = payload.list.find((item) => String(item?.store_product_id ?? item?.id) === String(storeProductId));
      if (!found) {
        setErrorMessage("Store product not found.");
        return;
      }
      setProduct(found);
      setForm(buildForm(found));
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || error.message || "Failed to load store product.");
    } finally {
      setLoading(false);
    }
  }, [product, storeId, storeProductId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setErrorMessage("");
    try {
      await updateSellerStoreProduct(storeId, storeProductId, {
        price: form.price === "" ? null : Number(form.price),
        discount: form.discount === "" ? null : Number(form.discount),
        discount_type: form.discount_type,
        stock: form.stock === "" ? null : Number(form.stock),
        sku: form.sku,
        title_override: form.title_override,
        description_override: form.description_override,
        is_active: form.is_active,
        is_featured: form.is_featured,
        todays_deal: form.todays_deal,
      });
      setMessage("Store product updated successfully");
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || error.message || "Failed to update store product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ p: 3, display: "grid", placeItems: "center", minHeight: 360 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={2} sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>Edit Store Product</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Store product mode: edit store-specific selling fields only. Master catalog data is read-only.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate(`/seller/stores/${storeId}/products`)} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>
          Back to Products
        </Button>
      </Stack>

      {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}
      {errorMessage ? <Alert severity="warning" sx={{ mb: 2 }}>{errorMessage}</Alert> : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Typography fontWeight={900} sx={{ mb: 1.5 }}>Master Product</Typography>
              <Box sx={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 1, bgcolor: "action.hover", overflow: "hidden", mb: 2 }}>
                {imageUrl ? <Box component="img" src={imageUrl} alt={productDisplayName(product)} sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
              </Box>
              <Stack spacing={1}>
                <TextField size="small" label="Master name" value={masterProduct?.name || product?.master_name || productDisplayName(product)} InputProps={{ readOnly: true }} />
                <TextField size="small" label="Category" value={product?.category?.name || product?.category_id || ""} InputProps={{ readOnly: true }} />
                <TextField size="small" label="Brand" value={product?.brand?.name || product?.brand_id || ""} InputProps={{ readOnly: true }} />
                <TextField size="small" label="Master price" value={formatMoney(productPrice(masterProduct?.id ? masterProduct : product))} InputProps={{ readOnly: true }} />
                <TextField size="small" label="Master description" value={product?.master_description || masterProduct?.description || ""} multiline minRows={4} InputProps={{ readOnly: true }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography fontWeight={900} sx={{ mb: 1.5 }}>Store Selling Fields</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth size="small" label="Store product title" value={form.title_override} onChange={(e) => updateField("title_override", e.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth size="small" label="SKU" value={form.sku} onChange={(e) => updateField("sku", e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth size="small" type="number" label="Price" value={form.price} onChange={(e) => updateField("price", e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth size="small" type="number" label="Discount" value={form.discount} onChange={(e) => updateField("discount", e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth size="small" label="Discount type" value={form.discount_type} onChange={(e) => updateField("discount_type", e.target.value)}>
                    <MenuItem value="percent">Percent</MenuItem>
                    <MenuItem value="amount">Amount</MenuItem>
                    <MenuItem value="flat">Flat</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth size="small" type="number" label="Stock" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Store description" value={form.description_override} onChange={(e) => updateField("description_override", e.target.value)} multiline minRows={5} />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 0.5 }} />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => updateField("is_active", e.target.checked)} />} label="Active in store" />
                    <FormControlLabel control={<Switch checked={form.is_featured} onChange={(e) => updateField("is_featured", e.target.checked)} />} label="Featured" />
                    <FormControlLabel control={<Switch checked={form.todays_deal} onChange={(e) => updateField("todays_deal", e.target.checked)} />} label="Today deal" />
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<SaveOutlinedIcon />} disabled={saving} onClick={handleSave} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900 }}>
                    {saving ? "Saving..." : "Save Store Product"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StoreProductEdit;
