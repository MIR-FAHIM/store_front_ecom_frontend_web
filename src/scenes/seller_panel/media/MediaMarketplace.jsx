import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import DesignServicesOutlinedIcon from "@mui/icons-material/DesignServicesOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { fetchSellerMediaCategories, fetchSellerMediaResources } from "../../../api/controller/admin_controller/media/media_marketplace_controller.jsx";
import { formatMoney, normalizeListPayload, normalizeSimpleList, resolveMediaImage } from "./mediaMarketplaceUtils";

const resourceTypes = ["banner", "poster", "social", "logo", "other"];
const sortOptions = [
  { value: "default", label: "Default" },
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price low" },
  { value: "price_high", label: "Price high" },
];

export default function MediaMarketplace() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    category_id: "all",
    resource_type: "all",
    min_price: "",
    max_price: "",
    sort: "default",
  });
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadCategories = async () => {
      try {
        const response = await fetchSellerMediaCategories();
        if (mounted) setCategories(normalizeSimpleList(response));
      } catch (e) {
        if (mounted) setCategories([]);
      }
    };
    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        per_page: 12,
        search: filters.search.trim() || undefined,
        category_id: filters.category_id !== "all" ? filters.category_id : undefined,
        resource_type: filters.resource_type !== "all" ? filters.resource_type : undefined,
        min_price: filters.min_price || undefined,
        max_price: filters.max_price || undefined,
        sort: filters.sort,
      };
      const response = await fetchSellerMediaResources(params);
      const payload = normalizeListPayload(response);
      setResources(payload.list);
      setLastPage(payload.lastPage);
      setTotal(payload.total);
    } catch (e) {
      setResources([]);
      setLastPage(1);
      setTotal(0);
      setError(e?.response?.data?.message || e.message || "Failed to load media marketplace.");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const categoryOptions = useMemo(() => categories.map((category) => ({
    id: category?.id,
    name: category?.name || "Category",
  })), [categories]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <DesignServicesOutlinedIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>Creative Marketplace</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Order ready-made promotional banners, social creatives, and store media from MyZoo designers.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate("/seller/media-orders")} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>
          My Media Orders
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 1, mb: 3 }}>
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search creatives"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                InputProps={{ startAdornment: <SearchOutlinedIcon sx={{ mr: 1, color: "text.secondary" }} /> }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField select fullWidth size="small" label="Category" value={filters.category_id} onChange={(e) => updateFilter("category_id", e.target.value)}>
                <MenuItem value="all">All categories</MenuItem>
                {categoryOptions.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField select fullWidth size="small" label="Type" value={filters.resource_type} onChange={(e) => updateFilter("resource_type", e.target.value)}>
                <MenuItem value="all">All types</MenuItem>
                {resourceTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} md={1.5}>
              <TextField fullWidth size="small" label="Min" type="number" value={filters.min_price} onChange={(e) => updateFilter("min_price", e.target.value)} />
            </Grid>
            <Grid item xs={6} md={1.5}>
              <TextField fullWidth size="small" label="Max" type="number" value={filters.max_price} onChange={(e) => updateFilter("max_price", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select fullWidth size="small" label="Sort" value={filters.sort} onChange={(e) => updateFilter("sort", e.target.value)}>
                {sortOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : resources.length === 0 ? (
        <Alert severity="info">No creative resources found.</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {resources.map((resource) => (
              <Grid item xs={12} sm={6} lg={4} xl={3} key={resource.id || resource.slug}>
                <Card sx={{ borderRadius: 1, height: "100%", display: "flex", flexDirection: "column" }}>
                  <Box component="img" src={resolveMediaImage(resource)} alt={resource?.name} sx={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
                  <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Chip label={resource?.resource_type || "creative"} size="small" sx={{ borderRadius: 1, fontWeight: 700 }} />
                      <Typography sx={{ fontWeight: 900 }}>{formatMoney(resource?.price, resource?.currency)}</Typography>
                    </Stack>
                    <Typography sx={{ fontWeight: 900, lineHeight: 1.25 }}>{resource?.name || "Untitled creative"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {resource?.category?.name || "Uncategorized"} {resource?.width && resource?.height ? `- ${resource.width} x ${resource.height}` : ""}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Button variant="contained" onClick={() => navigate(`/seller/media-marketplace/resources/${resource.slug || resource.id}`)} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">{total} resources</Typography>
            <Pagination count={lastPage} page={page} onChange={(_e, value) => setPage(value)} color="primary" />
          </Stack>
        </>
      )}
    </Box>
  );
}
