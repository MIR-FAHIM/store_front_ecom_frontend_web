import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import {
  createAdminMediaCategory,
  createAdminMediaResource,
  deleteAdminMediaCategory,
  deleteAdminMediaResource,
  fetchAdminMediaCategories,
  fetchAdminMediaOrders,
  fetchAdminMediaResources,
  updateAdminMediaCategory,
  updateAdminMediaOrderStatus,
  updateAdminMediaResource,
  uploadAdminMediaDeliverable,
  uploadMarketplaceImage,
} from "../../../api/controller/admin_controller/media/media_marketplace_controller.jsx";
import { formatMoney, normalizeListPayload, normalizeSimpleList, resolveMediaImage } from "../../seller_panel/media/mediaMarketplaceUtils";
import AllMedia from "../media/AllMedia";

const categoryBlank = { parent_id: "", name: "", slug: "", description: "", status: "active", sort_order: 0 };
const resourceBlank = {
  category_id: "",
  name: "",
  slug: "",
  description: "",
  preview_image_id: "",
  width: "",
  height: "",
  price: "",
  currency: "BDT",
  resource_type: "banner",
  status: "active",
  sort_order: 0,
  instructions: "",
  fields: [],
};
const fieldBlank = { field_name: "", field_type: "text", label: "", is_required: false, placeholder: "", help_text: "", sort_order: 1 };
const statuses = ["pending_payment", "paid", "pending_design", "in_progress", "draft_delivered", "revision_requested", "final_delivered", "completed", "cancelled", "refunded"];

const slugify = (value) => String(value || "").toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function AdminMediaMarketplace() {
  const [tab, setTab] = useState(0);
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [categoryDialog, setCategoryDialog] = useState(null);
  const [resourceDialog, setResourceDialog] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [orderDialog, setOrderDialog] = useState(null);
  const [deliverableFile, setDeliverableFile] = useState(null);
  const [deliverableType, setDeliverableType] = useState("draft");
  const [deliverableNote, setDeliverableNote] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catRes, resourceRes, orderRes] = await Promise.all([
        fetchAdminMediaCategories({ per_page: 200 }),
        fetchAdminMediaResources({ per_page: 200 }),
        fetchAdminMediaOrders({ per_page: 100 }),
      ]);
      setCategories(normalizeSimpleList(catRes));
      setResources(normalizeListPayload(resourceRes).list);
      setOrders(normalizeListPayload(orderRes).list);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load admin media marketplace.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const categoryOptions = useMemo(() => categories.map((category) => ({ id: category.id, name: category.name || `Category #${category.id}` })), [categories]);

  const saveCategory = async () => {
    setError("");
    try {
      const payload = { ...categoryDialog, slug: categoryDialog.slug || slugify(categoryDialog.name), parent_id: categoryDialog.parent_id || null };
      if (payload.id) await updateAdminMediaCategory(payload.id, payload);
      else await createAdminMediaCategory(payload);
      setCategoryDialog(null);
      setMessage("Media category saved successfully.");
      await loadAll();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to save category.");
    }
  };

  const saveResource = async () => {
    setError("");
    try {
      const payload = { ...resourceDialog, slug: resourceDialog.slug || slugify(resourceDialog.name) };
      if (payload.id) await updateAdminMediaResource(payload.id, payload);
      else await createAdminMediaResource(payload);
      setResourceDialog(null);
      setMessage("Media resource saved successfully.");
      await loadAll();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to save resource.");
    }
  };

  const openResourceDialog = (resource = null) => {
    setPreviewMedia(resource?.preview_image || resource?.image || null);
    setResourceDialog(resource ? { ...resource, fields: resource.fields || [] } : resourceBlank);
  };

  const handlePreviewMediaSelect = (item) => {
    setPreviewMedia(item || null);
    setResourceDialog((prev) => ({
      ...prev,
      preview_image_id: item?.id || "",
    }));
    setMediaPickerOpen(false);
  };

  const updateField = (index, key, value) => {
    setResourceDialog((prev) => {
      const fields = [...(prev.fields || [])];
      fields[index] = { ...fields[index], [key]: value };
      return { ...prev, fields };
    });
  };

  const updateOrderStatus = async () => {
    setError("");
    try {
      await updateAdminMediaOrderStatus(orderDialog.id, {
        status: orderDialog.status,
        admin_note: orderDialog.admin_note || "",
        assigned_to: orderDialog.assigned_to || null,
      });
      setMessage("Media order status updated.");
      setOrderDialog(null);
      await loadAll();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to update order status.");
    }
  };

  const uploadDeliverable = async () => {
    if (!deliverableFile || !orderDialog?.id) return;
    setError("");
    try {
      const uploadResponse = await uploadMarketplaceImage(deliverableFile);
      await uploadAdminMediaDeliverable(orderDialog.id, {
        order_item_id: orderDialog?.items?.[0]?.id || orderDialog?.order_items?.[0]?.id || orderDialog?.order_item_id,
        upload_id: uploadResponse.upload_id,
        file_type: deliverableType,
        note: deliverableNote,
      });
      setDeliverableFile(null);
      setDeliverableNote("");
      setMessage("Deliverable uploaded successfully.");
      await loadAll();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to upload deliverable.");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>Media Marketplace</Typography>
          <Typography variant="body2" color="text.secondary">Manage creative categories, sellable resources, and seller media orders.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {tab === 0 ? <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => setCategoryDialog(categoryBlank)} sx={{ textTransform: "none", fontWeight: 900 }}>Add Category</Button> : null}
          {tab === 1 ? <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => openResourceDialog()} sx={{ textTransform: "none", fontWeight: 900 }}>Add Resource</Button> : null}
        </Stack>
      </Stack>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert> : null}

      <Card sx={{ borderRadius: 1 }}>
        <Tabs value={tab} onChange={(_e, value) => setTab(value)} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
          <Tab label="Categories" />
          <Tab label="Resources" />
          <Tab label="Orders" />
        </Tabs>
        <CardContent>
          {loading ? <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box> : null}

          {!loading && tab === 0 ? (
            <TableContainer>
              <Table>
                <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Status</TableCell><TableCell>Sort</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell><b>{category.name}</b><Typography variant="caption" display="block" color="text.secondary">{category.slug}</Typography></TableCell>
                      <TableCell><Chip label={category.status || "active"} size="small" /></TableCell>
                      <TableCell>{category.sort_order ?? 0}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => setCategoryDialog({ ...category, parent_id: category.parent_id || "" })}><EditOutlinedIcon /></IconButton>
                        <IconButton color="error" onClick={async () => { await deleteAdminMediaCategory(category.id); await loadAll(); }}><DeleteOutlineOutlinedIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}

          {!loading && tab === 1 ? (
            <Grid container spacing={2}>
              {resources.map((resource) => (
                <Grid item xs={12} md={6} xl={4} key={resource.id}>
                  <Card variant="outlined" sx={{ borderRadius: 1 }}>
                    <Box component="img" src={resolveMediaImage(resource)} alt={resource.name} sx={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography sx={{ fontWeight: 900 }}>{resource.name}</Typography>
                        <Typography sx={{ fontWeight: 900 }}>{formatMoney(resource.price, resource.currency)}</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{resource.category?.name || "Uncategorized"} · {resource.resource_type}</Typography>
                      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                        <IconButton onClick={() => openResourceDialog(resource)}><EditOutlinedIcon /></IconButton>
                        <IconButton color="error" onClick={async () => { await deleteAdminMediaResource(resource.id); await loadAll(); }}><DeleteOutlineOutlinedIcon /></IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : null}

          {!loading && tab === 2 ? (
            <TableContainer>
              <Table>
                <TableHead><TableRow><TableCell>Order</TableCell><TableCell>Store</TableCell><TableCell>Resource</TableCell><TableCell>Total</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell><b>{order.order_number || `#${order.id}`}</b><Typography variant="caption" display="block">{order.payment_status}</Typography></TableCell>
                      <TableCell>{order.store?.shop_name || order.store?.name || "-"}</TableCell>
                      <TableCell>{order.resource?.name || order.media_resource?.name || order.resource_name || "-"}</TableCell>
                      <TableCell>{formatMoney(order.total || order.grand_total, order.currency)}</TableCell>
                      <TableCell><Chip label={order.status || "pending"} size="small" /></TableCell>
                      <TableCell align="right"><Button size="small" variant="outlined" onClick={() => setOrderDialog({ ...order, admin_note: "" })}>Manage</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(categoryDialog)} onClose={() => setCategoryDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>{categoryDialog?.id ? "Edit" : "Add"} Media Category</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField fullWidth label="Name" value={categoryDialog?.name || ""} onChange={(e) => setCategoryDialog((p) => ({ ...p, name: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Slug" value={categoryDialog?.slug || ""} onChange={(e) => setCategoryDialog((p) => ({ ...p, slug: e.target.value }))} placeholder="Auto generated if empty" /></Grid>
            <Grid item xs={12}><TextField select fullWidth label="Parent" value={categoryDialog?.parent_id || ""} onChange={(e) => setCategoryDialog((p) => ({ ...p, parent_id: e.target.value }))}><MenuItem value="">No parent</MenuItem>{categoryOptions.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Description" value={categoryDialog?.description || ""} onChange={(e) => setCategoryDialog((p) => ({ ...p, description: e.target.value }))} /></Grid>
            <Grid item xs={6}><TextField select fullWidth label="Status" value={categoryDialog?.status || "active"} onChange={(e) => setCategoryDialog((p) => ({ ...p, status: e.target.value }))}><MenuItem value="active">active</MenuItem><MenuItem value="inactive">inactive</MenuItem></TextField></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Sort" value={categoryDialog?.sort_order ?? 0} onChange={(e) => setCategoryDialog((p) => ({ ...p, sort_order: Number(e.target.value) }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setCategoryDialog(null)}>Cancel</Button><Button variant="contained" onClick={saveCategory}>Save</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(resourceDialog)} onClose={() => setResourceDialog(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>{resourceDialog?.id ? "Edit" : "Add"} Media Resource</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField select fullWidth label="Category" value={resourceDialog?.category_id || ""} onChange={(e) => setResourceDialog((p) => ({ ...p, category_id: e.target.value }))}>{categoryOptions.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Name" value={resourceDialog?.name || ""} onChange={(e) => setResourceDialog((p) => ({ ...p, name: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Slug" value={resourceDialog?.slug || ""} onChange={(e) => setResourceDialog((p) => ({ ...p, slug: e.target.value }))} /></Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <TextField
                  fullWidth
                  label="Preview image ID"
                  value={resourceDialog?.preview_image_id || ""}
                  onChange={(e) => {
                    setPreviewMedia(null);
                    setResourceDialog((p) => ({ ...p, preview_image_id: e.target.value }));
                  }}
                  helperText="Upload the image in Media Gallery, then select it here."
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<CollectionsOutlinedIcon />}
                    onClick={() => setMediaPickerOpen(true)}
                    sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}
                  >
                    Select from Gallery
                  </Button>
                  {resourceDialog?.preview_image_id ? (
                    <Button
                      color="inherit"
                      onClick={() => {
                        setPreviewMedia(null);
                        setResourceDialog((p) => ({ ...p, preview_image_id: "" }));
                      }}
                      sx={{ textTransform: "none", fontWeight: 800 }}
                    >
                      Clear
                    </Button>
                  ) : null}
                </Stack>
                {previewMedia ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                    <Box component="img" src={resolveMediaImage({ preview_image: previewMedia })} alt="Selected media" sx={{ width: 64, height: 44, objectFit: "cover", borderRadius: 1 }} />
                    <Typography variant="caption" color="text.secondary">Selected media #{previewMedia.id}</Typography>
                  </Box>
                ) : null}
              </Stack>
            </Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Description" value={resourceDialog?.description || ""} onChange={(e) => setResourceDialog((p) => ({ ...p, description: e.target.value }))} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Width" value={resourceDialog?.width || ""} onChange={(e) => setResourceDialog((p) => ({ ...p, width: e.target.value }))} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Height" value={resourceDialog?.height || ""} onChange={(e) => setResourceDialog((p) => ({ ...p, height: e.target.value }))} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Price" value={resourceDialog?.price || ""} onChange={(e) => setResourceDialog((p) => ({ ...p, price: e.target.value }))} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Currency" value={resourceDialog?.currency || "BDT"} onChange={(e) => setResourceDialog((p) => ({ ...p, currency: e.target.value }))} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Resource type" value={resourceDialog?.resource_type || ""} onChange={(e) => setResourceDialog((p) => ({ ...p, resource_type: e.target.value }))} /></Grid>
            <Grid item xs={6}><TextField select fullWidth label="Status" value={resourceDialog?.status || "active"} onChange={(e) => setResourceDialog((p) => ({ ...p, status: e.target.value }))}><MenuItem value="active">active</MenuItem><MenuItem value="inactive">inactive</MenuItem></TextField></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Instructions" value={resourceDialog?.instructions || ""} onChange={(e) => setResourceDialog((p) => ({ ...p, instructions: e.target.value }))} /></Grid>
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}><Typography sx={{ fontWeight: 900 }}>Dynamic Fields</Typography><Button size="small" onClick={() => setResourceDialog((p) => ({ ...p, fields: [...(p.fields || []), { ...fieldBlank, sort_order: (p.fields || []).length + 1 }] }))}>Add field</Button></Stack>
              {(resourceDialog?.fields || []).map((field, index) => (
                <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                  <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Name" value={field.field_name || ""} onChange={(e) => updateField(index, "field_name", e.target.value)} /></Grid>
                  <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Label" value={field.label || ""} onChange={(e) => updateField(index, "label", e.target.value)} /></Grid>
                  <Grid item xs={6} md={2}><TextField select fullWidth size="small" label="Type" value={field.field_type || "text"} onChange={(e) => updateField(index, "field_type", e.target.value)}>{["text", "textarea", "image", "multiple_images", "file", "number", "color", "url"].map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField></Grid>
                  <Grid item xs={6} md={2}><TextField select fullWidth size="small" label="Required" value={field.is_required ? "1" : "0"} onChange={(e) => updateField(index, "is_required", e.target.value === "1")}><MenuItem value="0">No</MenuItem><MenuItem value="1">Yes</MenuItem></TextField></Grid>
                  <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Placeholder/help" value={field.placeholder || ""} onChange={(e) => updateField(index, "placeholder", e.target.value)} /></Grid>
                  <Grid item xs={12} md={1}><IconButton color="error" onClick={() => setResourceDialog((p) => ({ ...p, fields: (p.fields || []).filter((_, i) => i !== index) }))}><DeleteOutlineOutlinedIcon /></IconButton></Grid>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setResourceDialog(null)}>Cancel</Button><Button variant="contained" onClick={saveResource}>Save</Button></DialogActions>
      </Dialog>

      <Dialog open={mediaPickerOpen} onClose={() => setMediaPickerOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: 900 }}>Select Preview Image from Media Gallery</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <AllMedia endpoint="/api/files/list" onSelect={handlePreviewMediaSelect} single />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMediaPickerOpen(false)} sx={{ textTransform: "none", fontWeight: 800 }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(orderDialog)} onClose={() => setOrderDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Manage Media Order</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField select fullWidth label="Status" value={orderDialog?.status || "pending_design"} onChange={(e) => setOrderDialog((p) => ({ ...p, status: e.target.value }))}>{statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</TextField>
            <TextField fullWidth label="Assigned to user ID" value={orderDialog?.assigned_to || ""} onChange={(e) => setOrderDialog((p) => ({ ...p, assigned_to: e.target.value }))} />
            <TextField fullWidth multiline minRows={3} label="Admin note" value={orderDialog?.admin_note || ""} onChange={(e) => setOrderDialog((p) => ({ ...p, admin_note: e.target.value }))} />
            <Button variant="contained" onClick={updateOrderStatus}>Update Status</Button>
            <Box>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>Upload Deliverable</Typography>
              <Stack spacing={1}>
                <TextField select label="File type" value={deliverableType} onChange={(e) => setDeliverableType(e.target.value)}>{["draft", "final", "source", "other"].map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField>
                <TextField label="Note" value={deliverableNote} onChange={(e) => setDeliverableNote(e.target.value)} />
                <Button component="label" variant="outlined">Select deliverable<input hidden type="file" onChange={(e) => setDeliverableFile(e.target.files?.[0] || null)} /></Button>
                {deliverableFile ? <Typography variant="caption">{deliverableFile.name}</Typography> : null}
                <Button variant="contained" disabled={!deliverableFile} onClick={uploadDeliverable}>Upload Deliverable</Button>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setOrderDialog(null)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
