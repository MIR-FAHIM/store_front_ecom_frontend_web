import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { tokens } from "../../../theme";
import { getAllShops } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";
import {
  fetchSellerMarketplaceCategories,
  syncSellerStoreCategories,
} from "../../../api/controller/admin_controller/category/store_category_controller.jsx";
import {
  flattenCategoryTree,
  getActiveCategoryIds,
  normalizeCategoryList,
} from "../../../utils/categoryTree";

const normalizeValidationErrors = (error) => {
  const errors = error?.response?.data?.errors;
  if (!errors || typeof errors !== "object") return [];

  return Object.entries(errors).flatMap(([field, value]) => {
    const messages = Array.isArray(value) ? value : [value];
    return messages.map((message) => `${field}: ${message}`);
  });
};

const normalizeShops = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

function CategoryTreeItem({ category, selectedIds, onToggle, depth = 0 }) {
  const id = category?.id ?? category?._id;
  const checked = selectedIds.has(String(id));
  const children = Array.isArray(category?.children) ? category.children : [];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          py: 0.8,
          pl: depth * 3,
          borderRadius: 1,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Checkbox
          size="small"
          checked={checked}
          onChange={(event) => onToggle(id, event.target.checked)}
          disabled={id === undefined || id === null}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: depth === 0 ? 800 : 600, fontSize: depth === 0 ? 14 : 13 }}>
            {category?.name || "Category"}
          </Typography>
          {category?.slug ? (
            <Typography variant="caption" color="text.secondary">
              {category.slug}
            </Typography>
          ) : null}
        </Box>
        {children.length > 0 ? (
          <Chip size="small" label={`${children.length} sub`} sx={{ height: 22, fontSize: 11 }} />
        ) : null}
      </Box>
      {children.map((child) => (
        <CategoryTreeItem
          key={child?.id ?? child?._id ?? child?.slug}
          category={child}
          selectedIds={selectedIds}
          onToggle={onToggle}
          depth={depth + 1}
        />
      ))}
    </Box>
  );
}

export default function SellerCategoryManagement() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { storeId: routeStoreId } = useParams();

  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState(routeStoreId || localStorage.getItem("storeId") || localStorage.getItem("shopId") || "");
  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [validationMessages, setValidationMessages] = useState([]);

  const activeCount = selectedIds.size;
  const totalCount = useMemo(() => flattenCategoryTree(categories).length, [categories]);
  const currentStore = useMemo(
    () => stores.find((store) => String(store?.id) === String(storeId)) || null,
    [stores, storeId]
  );

  const loadStores = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      const res = await getAllShops({ user_id: userId, page: 1, per_page: 100 });
      const list = normalizeShops(res);
      setStores(list);

      if (!storeId && list.length > 0) {
        const firstId = list[0]?.id;
        if (firstId) setStoreId(String(firstId));
      }
    } catch (error) {
      console.error("Failed to load seller stores", error);
      setStores([]);
    }
  }, [storeId]);

  const loadCategories = useCallback(async () => {
    if (!storeId) return;

    setLoading(true);
    setErrorMessage("");
    setValidationMessages([]);
    try {
      const res = await fetchSellerMarketplaceCategories(storeId);
      const list = normalizeCategoryList(res);
      setCategories(list);
      setSelectedIds(new Set(getActiveCategoryIds(list).map(String)));
    } catch (error) {
      console.error("Failed to load seller marketplace categories", error);
      setCategories([]);
      setSelectedIds(new Set());
      if (error?.response?.status === 404) {
        setErrorMessage("Store not found or access denied");
      } else if (error?.response?.status === 422) {
        setValidationMessages(normalizeValidationErrors(error));
        setErrorMessage(error?.response?.data?.message || "Validation failed.");
      } else {
        setErrorMessage(error?.response?.data?.message || error.message || "Failed to load categories.");
      }
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    if (routeStoreId && String(routeStoreId) !== String(storeId)) {
      setStoreId(String(routeStoreId));
    }
  }, [routeStoreId, storeId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleStoreChange = (nextId) => {
    setStoreId(nextId);
    localStorage.setItem("storeId", String(nextId));
    navigate(`/seller/stores/${nextId}/categories`, { replace: true });
  };

  const handleToggle = (id, checked) => {
    if (id === undefined || id === null) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleSave = async () => {
    if (!storeId) return;

    setSaving(true);
    setMessage("");
    setErrorMessage("");
    setValidationMessages([]);
    try {
      await syncSellerStoreCategories(
        storeId,
        Array.from(selectedIds)
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id))
      );
      setMessage("Store categories synced successfully");
      await loadCategories();
    } catch (error) {
      console.error("Failed to sync seller categories", error);
      if (error?.response?.status === 404) {
        setErrorMessage("Store not found or access denied");
      } else if (error?.response?.status === 422) {
        setValidationMessages(normalizeValidationErrors(error));
        setErrorMessage(error?.response?.data?.message || "Validation failed.");
      } else {
        setErrorMessage(error?.response?.data?.message || error.message || "Failed to sync categories.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={2} sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>
            Store Categories
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Choose which marketplace categories are active for your public storefront and product forms.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
          disabled={!storeId || saving || loading}
          onClick={handleSave}
          sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 800 }}
        >
          Save Categories
        </Button>
      </Stack>

      {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}
      {errorMessage ? <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert> : null}
      {validationMessages.length > 0 ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {validationMessages.map((item) => (
            <Typography key={item} variant="body2">{item}</Typography>
          ))}
        </Alert>
      ) : null}

      <Card sx={{ borderRadius: 2, bgcolor: colors.primary[400] }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 280 } }}>
              <InputLabel>Store</InputLabel>
              <Select value={storeId} label="Store" onChange={(event) => handleStoreChange(event.target.value)}>
                {stores.map((store) => (
                  <MenuItem key={store?.id} value={String(store?.id)}>
                    {store?.name || store?.shop_name || `Store #${store?.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Chip icon={<StorefrontOutlinedIcon />} label={currentStore?.name || currentStore?.shop_name || "Seller store"} />
            <Chip icon={<CategoryOutlinedIcon />} label={`${activeCount} active of ${totalCount}`} color="primary" variant="outlined" />
          </Stack>

          <Divider sx={{ mb: 1.5 }} />

          {!storeId ? (
            <Alert severity="info">Create or select a store first, then activate its storefront categories.</Alert>
          ) : loading ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                Loading marketplace categories...
              </Typography>
            </Box>
          ) : categories.length === 0 ? (
            <Alert severity="info">No marketplace categories found for this store.</Alert>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              {categories.map((category) => (
                <CategoryTreeItem
                  key={category?.id ?? category?._id ?? category?.slug}
                  category={category}
                  selectedIds={selectedIds}
                  onToggle={handleToggle}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
