import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import DesignServicesOutlinedIcon from "@mui/icons-material/DesignServicesOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { addBanner, getBanner } from "../../../api/controller/admin_controller/media/banner_controller";
import { getAllShops } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";
import { image_file_url } from "../../../api/config";
import SellerMediaLibrary from "../media/SellerMediaLibrary";

const initialForm = {
  banner_name: "",
  title: "",
  related_product_id: "",
  note: "",
  image: null,
  image_id: null,
};

const getBannerImage = (banner) => {
  const imgObj = banner?.image ?? null;
  const imgPath = banner?.image_path || (imgObj?.file_name ? `${image_file_url}/${imgObj.file_name}` : null) || imgObj?.url || null;
  if (!imgPath) return "";
  return imgPath.startsWith("http") ? imgPath : imgPath;
};

const normalizeList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

export default function SellerBannerManager() {
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [banners, setBanners] = useState([]);
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState(localStorage.getItem("storeId") || localStorage.getItem("shopId") || "");

  const selectedShop = useMemo(() => shops.find((shop) => String(shop?.id) === String(shopId)), [shops, shopId]);

  const bannerParams = useMemo(() => {
    const params = {};
    if (shopId) params.store_id = shopId;
    if (selectedShop?.slug) params.store_slug = selectedShop.slug;
    return params;
  }, [selectedShop?.slug, shopId]);

  const loadBanners = async (params = bannerParams) => {
    setLoading(true);
    setError("");
    try {
      const res = await getBanner(params);
      setBanners(normalizeList(res));
    } catch (e) {
      setBanners([]);
      setError(e?.response?.data?.message || "Failed to load store banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadShops = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        const res = await getAllShops({ user_id: userId, page: 1, per_page: 200 });
        const list = normalizeList(res);
        setShops(list);
        if (!shopId && list.length) setShopId(String(list[0].id));
      } catch (e) {
        setShops([]);
      }
    };

    loadShops();
  }, []);

  useEffect(() => {
    loadBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerParams]);

  const handleSelectMedia = (item) => {
    if (!item) return;
    setForm((prev) => ({ ...prev, image_id: item.id, image: null }));
    setPreview(item.url || (item.file_name ? `${image_file_url}/${item.file_name}` : null));
    setMediaOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!shopId) return setError("Please select a store first.");
    if (!form.banner_name.trim()) return setError("Banner name is required.");
    if (!form.image_id && !form.image) return setError("Please choose a banner image from the library.");

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("banner_name", form.banner_name);
      fd.append("title", form.title);
      fd.append("related_product_id", form.related_product_id);
      fd.append("note", form.note);
      fd.append("shop_id", shopId);
      fd.append("store_id", shopId);
      if (selectedShop?.slug) fd.append("store_slug", selectedShop.slug);
      if (form.image) fd.append("image", form.image);
      if (form.image_id) fd.append("image_id", form.image_id);

      const resp = await addBanner(fd);
      setSuccess(resp?.data?.message || "Store banner added successfully.");
      setForm(initialForm);
      setPreview(null);
      await loadBanners();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to add banner.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1280, mx: "auto" }}>
      <Stack spacing={0.7} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 950 }}>
          Store Banners
        </Typography>
        <Typography color="text.secondary">
          Add storefront banners that appear on your public store page and promotional sections.
        </Typography>
      </Stack>

      <Card sx={{ borderRadius: 3, mb: 3, overflow: "hidden", background: "linear-gradient(135deg, #07145f 0%, #0f766e 100%)", color: "#fff" }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Chip label="Banner design offer" sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "#fff", fontWeight: 900 }} />
                <Chip icon={<LocalOfferOutlinedIcon />} label="Promotional price" sx={{ bgcolor: "#facc15", color: "#07145f", fontWeight: 950 }} />
              </Stack>
              <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1.15 }}>
                Get 10 marketplace-style banners from MyZoo designer experts
              </Typography>
              <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.78)", maxWidth: 680 }}>
                Make your storefront look ready for campaigns, offers, category promotions, and seasonal sales.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2.2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)" }}>
                <Stack direction="row" spacing={1.4} alignItems="center">
                  <DesignServicesOutlinedIcon sx={{ fontSize: 34, color: "#facc15" }} />
                  <Box>
                    <Typography sx={{ textDecoration: "line-through", color: "rgba(255,255,255,0.62)", fontWeight: 800 }}>
                      BDT 120
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 950, lineHeight: 1 }}>
                      BDT 50
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.76)", fontWeight: 800 }}>
                      Now for promotional price
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert> : null}
      {success ? <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert> : null}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
                <StorefrontOutlinedIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Add Store Banner
                </Typography>
              </Stack>

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField
                    select
                    label="Store"
                    size="small"
                    value={shopId}
                    onChange={(e) => {
                      const next = e.target.value;
                      setShopId(next);
                      localStorage.setItem("storeId", String(next));
                    }}
                    fullWidth
                  >
                    {shops.map((shop) => (
                      <MenuItem key={shop.id} value={String(shop.id)}>
                        {shop.name || shop.shop_name || `Store ${shop.id}`}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField label="Banner Name" size="small" value={form.banner_name} onChange={(e) => setForm((prev) => ({ ...prev, banner_name: e.target.value }))} fullWidth />
                  <TextField label="Title" size="small" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} fullWidth />
                  <TextField label="Related Product ID" size="small" value={form.related_product_id} onChange={(e) => setForm((prev) => ({ ...prev, related_product_id: e.target.value }))} fullWidth />
                  <TextField label="Note" size="small" multiline minRows={2} value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} fullWidth />

                  <Button variant="outlined" startIcon={<CollectionsOutlinedIcon />} onClick={() => setMediaOpen(true)} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}>
                    Choose From Library
                  </Button>

                  {preview ? (
                    <Box component="img" src={preview} alt="Selected banner preview" sx={{ width: "100%", aspectRatio: "16 / 6", objectFit: "cover", borderRadius: 2, border: "1px solid #e2e8f0" }} />
                  ) : null}

                  <Divider />

                  <Stack direction="row" spacing={1.5}>
                    <Button type="submit" variant="contained" disabled={saving} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}>
                      {saving ? <CircularProgress size={20} color="inherit" /> : "Add Banner"}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setForm(initialForm);
                        setPreview(null);
                      }}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}
                    >
                      Reset
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                Active Store Banners
              </Typography>

              {loading ? (
                <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Image</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {banners.length ? (
                        banners.map((banner) => {
                          const image = getBannerImage(banner);
                          return (
                            <TableRow key={banner.id}>
                              <TableCell>{banner.banner_name || "-"}</TableCell>
                              <TableCell>{banner.title || "-"}</TableCell>
                              <TableCell>
                                {image ? <Box component="img" src={image} alt={banner.banner_name || "Banner"} sx={{ width: 120, height: 54, objectFit: "cover", borderRadius: 1 }} /> : "-"}
                              </TableCell>
                              <TableCell>
                                <Chip size="small" label={banner.is_active ? "Active" : "Inactive"} color={banner.is_active ? "success" : "default"} variant="outlined" />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                              No banners added for this store yet.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={mediaOpen} onClose={() => setMediaOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>Select banner image</DialogTitle>
        <DialogContent>
          <SellerMediaLibrary
            picker
            single
            accept="image/*"
            title="Select banner image"
            onSelect={handleSelectMedia}
            onClose={() => setMediaOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
