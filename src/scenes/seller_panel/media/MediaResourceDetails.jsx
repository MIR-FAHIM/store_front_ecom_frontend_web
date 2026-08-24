import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import { getAllShops } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";
import {
  createSellerMediaOrder,
  fetchSellerMediaResourceDetails,
  paySellerMediaOrder,
} from "../../../api/controller/admin_controller/media/media_marketplace_controller.jsx";
import { uploadSellerFile } from "../../../api/controller/seller_controller/seller_media_controller.jsx";
import {
  fieldInputTypes,
  formatMoney,
  getOrderId,
  getStoreIdFromShops,
  normalizeSimpleList,
  resolveMediaImage,
  safeArray,
  unwrapData,
} from "./mediaMarketplaceUtils";
import SellerMediaLibrary from "./SellerMediaLibrary";

const fileTypes = new Set(["image", "multiple_images", "file"]);

export default function MediaResourceDetails() {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState(localStorage.getItem("storeId") || localStorage.getItem("shopId") || "");
  const [loading, setLoading] = useState(true);
  const [orderOpen, setOrderOpen] = useState(false);
  const [fieldValues, setFieldValues] = useState({});
  const [fileValues, setFileValues] = useState({});
  const [libraryField, setLibraryField] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fields = useMemo(() => safeArray(resource?.fields).sort((a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0)), [resource?.fields]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [resourceResponse, storesResponse] = await Promise.all([
          fetchSellerMediaResourceDetails(idOrSlug),
          getAllShops({ user_id: localStorage.getItem("userId"), page: 1, per_page: 100 }),
        ]);
        const nextStores = normalizeSimpleList(storesResponse);
        if (!mounted) return;
        setResource(unwrapData(resourceResponse));
        setStores(nextStores);
        const nextStoreId = getStoreIdFromShops(nextStores, storeId);
        if (nextStoreId) {
          setStoreId(nextStoreId);
          localStorage.setItem("storeId", nextStoreId);
        }
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || e.message || "Failed to load creative resource.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [idOrSlug, storeId]);

  const handleFieldValue = (fieldName, value) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleFileValue = (fieldId, files) => {
    setFileValues((prev) => ({
      ...prev,
      [fieldId]: [...safeArray(prev[fieldId]), ...Array.from(files || [])],
    }));
  };

  const handleLibrarySelect = (items) => {
    if (!libraryField) return;
    const selectedItems = Array.isArray(items) ? items : items ? [items] : [];
    setFileValues((prev) => ({
      ...prev,
      [libraryField.id]: [
        ...safeArray(prev[libraryField.id]),
        ...selectedItems.map((item) => ({
          upload_id: item.id,
          file_original_name: item.file_original_name,
          file_name: item.file_name,
          url: item.url,
          fromLibrary: true,
        })),
      ],
    }));
    setLibraryField(null);
  };

  const clearFieldFiles = (fieldId) => {
    setFileValues((prev) => ({ ...prev, [fieldId]: [] }));
  };

  const validateOrder = () => {
    if (!storeId) return "Select a store first.";
    for (const field of fields) {
      if (!field?.is_required) continue;
      const type = field?.field_type;
      if (fileTypes.has(type)) {
        if (!safeArray(fileValues[field.id]).length) return `${field.label || field.field_name} is required.`;
      } else if (!String(fieldValues[field.field_name] ?? "").trim()) {
        return `${field.label || field.field_name} is required.`;
      }
    }
    return "";
  };

  const handleCreateOrder = useCallback(async () => {
    const validation = validateOrder();
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const files = [];
      for (const field of fields) {
        if (!fileTypes.has(field?.field_type)) continue;
        for (const fileOrUpload of safeArray(fileValues[field.id])) {
          const uploadId = fileOrUpload?.upload_id || fileOrUpload?.id;
          const uploadResponse = uploadId ? null : await uploadSellerFile(fileOrUpload);
          const nextUploadId = uploadId || uploadResponse?.data?.id || uploadResponse?.data?.upload_id || uploadResponse?.id || uploadResponse?.upload_id;
          if (!nextUploadId) throw new Error("Upload succeeded but no upload id was returned.");
          files.push({
            field_id: field.id,
            upload_id: nextUploadId,
            file_type: field.field_name || field.field_type,
            note: field.label || "",
          });
        }
      }

      const response = await createSellerMediaOrder(storeId, {
        media_resource_id: resource?.id,
        quantity: Number(quantity || 1),
        customer_note: customerNote,
        field_values: fieldValues,
        files,
      });
      const orderId = getOrderId(response);
      setMessage("Media order created successfully.");
      setOrderOpen(false);

      const total = Number(response?.data?.total ?? response?.data?.grand_total ?? response?.total ?? resource?.price ?? 0);
      if (total > 0 && orderId) {
        const payResponse = await paySellerMediaOrder(storeId, orderId);
        const paymentUrl = payResponse?.data?.payment_url ?? payResponse?.payment_url;
        if (paymentUrl) {
          window.location.href = paymentUrl;
          return;
        }
      }

      navigate(`/seller/stores/${storeId}/media-orders${orderId ? `/${orderId}` : ""}`);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to create media order.");
    } finally {
      setSubmitting(false);
    }
  }, [customerNote, fieldValues, fields, fileValues, navigate, quantity, resource?.id, resource?.price, storeId]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  if (!resource) {
    return <Box sx={{ p: 3 }}><Alert severity="error">{error || "Creative resource not found."}</Alert></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate("/seller/media-marketplace")} sx={{ mb: 2, textTransform: "none", fontWeight: 800 }}>
        Back to marketplace
      </Button>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 1 }}>
            <Box component="img" src={resolveMediaImage(resource)} alt={resource?.name} sx={{ width: "100%", maxHeight: 520, objectFit: "cover" }} />
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 1 }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>{resource?.name}</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>{resource?.description}</Typography>
              <Stack spacing={1.1} sx={{ mb: 2 }}>
                <Typography><b>Category:</b> {resource?.category?.name || "Uncategorized"}</Typography>
                <Typography><b>Dimensions:</b> {resource?.width && resource?.height ? `${resource.width} x ${resource.height}` : "Flexible"}</Typography>
                <Typography><b>Type:</b> {resource?.resource_type || "creative"}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>{formatMoney(resource?.price, resource?.currency)}</Typography>
              </Stack>
              {resource?.instructions ? (
                <Alert severity="info" sx={{ mb: 2 }}>{resource.instructions}</Alert>
              ) : null}
              <Button fullWidth variant="contained" startIcon={<PaymentOutlinedIcon />} onClick={() => setOrderOpen(true)} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900 }}>
                Order This Design
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={orderOpen} onClose={() => setOrderOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Order This Design</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="Store" value={storeId} onChange={(e) => { setStoreId(e.target.value); localStorage.setItem("storeId", e.target.value); }}>
                {stores.map((store) => <MenuItem key={store.id} value={store.id}>{store.shop_name || store.name || `Store #${store.id}`}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} inputProps={{ min: 1 }} />
            </Grid>
            {fields.map((field) => {
              const type = field?.field_type || "text";
              const label = field?.label || field?.field_name || "Field";
              if (fileTypes.has(type)) {
                const selectedFiles = safeArray(fileValues[field.id]);
                return (
                  <Grid item xs={12} key={field.id || field.field_name}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button component="label" variant="outlined" fullWidth sx={{ borderRadius: 1, textTransform: "none", justifyContent: "flex-start" }}>
                        Upload {label}{field?.is_required ? " *" : ""} {selectedFiles.length ? `- ${selectedFiles.length} selected` : ""}
                        <input hidden type="file" multiple={type === "multiple_images"} accept={type === "image" || type === "multiple_images" ? "image/*" : undefined} onChange={(e) => handleFileValue(field.id, e.target.files)} />
                      </Button>
                      <Button variant="contained" onClick={() => setLibraryField(field)} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800, minWidth: 190 }}>
                        Choose from Library
                      </Button>
                      {selectedFiles.length ? (
                        <Button color="inherit" onClick={() => clearFieldFiles(field.id)} sx={{ textTransform: "none", fontWeight: 800 }}>
                          Clear
                        </Button>
                      ) : null}
                    </Stack>
                    {selectedFiles.length ? (
                      <Typography variant="caption" color="text.secondary">
                        {selectedFiles.map((file) => file.file_original_name || file.name || file.file_name || `Upload #${file.upload_id}`).join(", ")}
                      </Typography>
                    ) : null}
                    {field?.help_text ? <Typography variant="caption" color="text.secondary">{field.help_text}</Typography> : null}
                  </Grid>
                );
              }

              return (
                <Grid item xs={12} md={type === "textarea" ? 12 : 6} key={field.id || field.field_name}>
                  <TextField
                    fullWidth
                    required={Boolean(field?.is_required)}
                    type={type === "color" ? "color" : type === "number" ? "number" : type === "url" ? "url" : "text"}
                    multiline={type === "textarea"}
                    minRows={type === "textarea" ? 3 : undefined}
                    label={label}
                    placeholder={field?.placeholder || ""}
                    helperText={field?.help_text || ""}
                    value={fieldValues[field.field_name] || ""}
                    onChange={(e) => handleFieldValue(field.field_name, e.target.value)}
                    disabled={!fieldInputTypes.has(type)}
                  />
                </Grid>
              );
            })}
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={3} label="Customer note" value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} placeholder="Please match my brand colors" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderOpen(false)} sx={{ textTransform: "none", fontWeight: 800 }}>Cancel</Button>
          <Button variant="contained" disabled={submitting} onClick={handleCreateOrder} sx={{ textTransform: "none", fontWeight: 900 }}>
            {submitting ? "Submitting..." : "Create Order"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(libraryField)} onClose={() => setLibraryField(null)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: 900 }}>Select {libraryField?.label || libraryField?.field_name || "file"} from My Media Library</DialogTitle>
        <DialogContent dividers>
          <SellerMediaLibrary
            picker
            single={libraryField?.field_type !== "multiple_images"}
            accept={libraryField?.field_type === "image" || libraryField?.field_type === "multiple_images" ? "image/*" : ""}
            title="My Media Library"
            onSelect={handleLibrarySelect}
            onClose={() => setLibraryField(null)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
