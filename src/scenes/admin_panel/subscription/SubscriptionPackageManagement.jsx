import React, { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import {
  createSubscriptionPackage,
  deleteSubscriptionPackage,
  getSubscriptionPackageDetails,
  getSubscriptionPackages,
  inactiveSubscriptionPackage,
  updateSubscriptionPackage,
} from "../../../api/controller/admin_controller/subscription_package/subscription_package_controller";

const billingCycles = ["monthly", "yearly", "lifetime"];
const statuses = ["active", "inactive"];

const emptyForm = {
  name: "",
  slug: "",
  short_description: "",
  description: "",
  price: "",
  currency: "BDT",
  billing_cycle: "monthly",
  trial_days: "",
  max_products: "",
  max_orders_per_month: "",
  max_staff: "",
  max_branches: "",
  commission_rate: "",
  is_featured: false,
  is_popular: false,
  status: "active",
  sort_order: 0,
  features: ["Public store page", "Product inventory management", "Order management"],
  metadataRows: [],
};

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const numberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
};

const fieldError = (errors, key) => {
  const value = errors?.[key];
  if (!value) return "";
  return Array.isArray(value) ? value.join(" ") : String(value);
};

const normalizePackage = (pkg = {}) => {
  const metadata = pkg?.metadata && typeof pkg.metadata === "object" && !Array.isArray(pkg.metadata) ? pkg.metadata : {};
  return {
    ...emptyForm,
    ...pkg,
    price: pkg.price ?? "",
    trial_days: pkg.trial_days ?? "",
    max_products: pkg.max_products ?? "",
    max_orders_per_month: pkg.max_orders_per_month ?? "",
    max_staff: pkg.max_staff ?? "",
    max_branches: pkg.max_branches ?? "",
    commission_rate: pkg.commission_rate ?? "",
    is_featured: Boolean(pkg.is_featured),
    is_popular: Boolean(pkg.is_popular),
    features: Array.isArray(pkg.features) && pkg.features.length ? pkg.features : [""],
    metadataRows: Object.entries(metadata).map(([key, value]) => ({ key, value: String(value ?? "") })),
  };
};

const buildPayload = (form) => {
  const metadata = {};
  (form.metadataRows || []).forEach((row) => {
    const key = String(row.key || "").trim();
    if (key) metadata[key] = row.value ?? "";
  });

  return {
    name: form.name,
    slug: form.slug,
    short_description: form.short_description,
    description: form.description,
    price: numberOrNull(form.price) ?? 0,
    currency: form.currency || "BDT",
    billing_cycle: form.billing_cycle || "monthly",
    trial_days: numberOrNull(form.trial_days),
    max_products: numberOrNull(form.max_products),
    max_orders_per_month: numberOrNull(form.max_orders_per_month),
    max_staff: numberOrNull(form.max_staff),
    max_branches: numberOrNull(form.max_branches),
    commission_rate: numberOrNull(form.commission_rate),
    is_featured: form.is_featured ? 1 : 0,
    is_popular: form.is_popular ? 1 : 0,
    status: form.status || "active",
    sort_order: numberOrNull(form.sort_order) ?? 0,
    features: (form.features || []).map((feature) => String(feature || "").trim()).filter(Boolean),
    metadata,
  };
};

const formatMoney = (pkg) =>
  `${pkg?.currency || "BDT"} ${Number(pkg?.price || 0).toLocaleString("en-BD")}`;

const PackageForm = ({ form, errors, onChange, onNameChange, onSlugChange, onSubmit, submitting, submitLabel }) => {
  const updateFeature = (index, value) => {
    const next = [...(form.features || [])];
    next[index] = value;
    onChange("features", next);
  };
  const updateMetadata = (index, key, value) => {
    const next = [...(form.metadataRows || [])];
    next[index] = { ...next[index], [key]: value };
    onChange("metadataRows", next);
  };

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Package Name" value={form.name} onChange={onNameChange} error={Boolean(errors.name)} helperText={fieldError(errors, "name")} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Slug" value={form.slug} onChange={onSlugChange} error={Boolean(errors.slug)} helperText={fieldError(errors, "slug")} />
        </Grid>
        <Grid item xs={12} md={8}>
          <TextField fullWidth label="Short Description" value={form.short_description} onChange={(e) => onChange("short_description", e.target.value)} error={Boolean(errors.short_description)} helperText={fieldError(errors, "short_description")} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField select fullWidth label="Status" value={form.status} onChange={(e) => onChange("status", e.target.value)}>
            {statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline minRows={2} label="Description" value={form.description} onChange={(e) => onChange("description", e.target.value)} error={Boolean(errors.description)} helperText={fieldError(errors, "description")} />
        </Grid>

        <Grid item xs={6} md={3}>
          <TextField fullWidth type="number" label="Price" value={form.price} onChange={(e) => onChange("price", e.target.value)} error={Boolean(errors.price)} helperText={fieldError(errors, "price")} />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField fullWidth label="Currency" value={form.currency} onChange={(e) => onChange("currency", e.target.value.toUpperCase())} />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField select fullWidth label="Billing Cycle" value={form.billing_cycle} onChange={(e) => onChange("billing_cycle", e.target.value)}>
            {billingCycles.map((cycle) => <MenuItem key={cycle} value={cycle}>{cycle}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField fullWidth type="number" label="Trial Days" value={form.trial_days} onChange={(e) => onChange("trial_days", e.target.value)} />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField fullWidth type="number" label="Max Products" value={form.max_products} onChange={(e) => onChange("max_products", e.target.value)} />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField fullWidth type="number" label="Max Orders / Month" value={form.max_orders_per_month} onChange={(e) => onChange("max_orders_per_month", e.target.value)} />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField fullWidth type="number" label="Max Staff" value={form.max_staff} onChange={(e) => onChange("max_staff", e.target.value)} />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField fullWidth type="number" label="Max Branches" value={form.max_branches} onChange={(e) => onChange("max_branches", e.target.value)} />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField fullWidth type="number" label="Commission %" value={form.commission_rate} onChange={(e) => onChange("commission_rate", e.target.value)} />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField fullWidth type="number" label="Sort Order" value={form.sort_order} onChange={(e) => onChange("sort_order", e.target.value)} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack direction="row" spacing={1}>
            <FormControlLabel control={<Checkbox checked={Boolean(form.is_featured)} onChange={(e) => onChange("is_featured", e.target.checked)} />} label="Featured" />
            <FormControlLabel control={<Checkbox checked={Boolean(form.is_popular)} onChange={(e) => onChange("is_popular", e.target.checked)} />} label="Popular" />
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography sx={{ fontWeight: 800 }}>Features</Typography>
              <Button size="small" startIcon={<AddOutlinedIcon />} onClick={() => onChange("features", [...(form.features || []), ""])} sx={{ textTransform: "none", fontWeight: 700 }}>
                Add Feature
              </Button>
            </Stack>
            {(form.features || []).map((feature, index) => (
              <Stack key={index} direction="row" spacing={1}>
                <TextField fullWidth size="small" value={feature} onChange={(e) => updateFeature(index, e.target.value)} placeholder="Package feature" />
                <IconButton onClick={() => onChange("features", form.features.filter((_, i) => i !== index))} disabled={(form.features || []).length <= 1}>
                  <RemoveCircleOutlineIcon />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 800 }}>Advanced Metadata</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                {(form.metadataRows || []).map((row, index) => (
                  <Grid container spacing={1} key={index}>
                    <Grid item xs={5}><TextField fullWidth size="small" label="Key" value={row.key} onChange={(e) => updateMetadata(index, "key", e.target.value)} /></Grid>
                    <Grid item xs={6}><TextField fullWidth size="small" label="Value" value={row.value} onChange={(e) => updateMetadata(index, "value", e.target.value)} /></Grid>
                    <Grid item xs={1}><IconButton onClick={() => onChange("metadataRows", form.metadataRows.filter((_, i) => i !== index))}><DeleteOutlineOutlinedIcon /></IconButton></Grid>
                  </Grid>
                ))}
                <Button size="small" startIcon={<AddOutlinedIcon />} onClick={() => onChange("metadataRows", [...(form.metadataRows || []), { key: "", value: "" }])} sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}>
                  Add Metadata
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button type="submit" variant="contained" startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />} disabled={submitting} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2 }}>
          {submitLabel}
        </Button>
      </Stack>
    </Box>
  );
};

const SubscriptionPackageManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [form, setForm] = useState(emptyForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [errors, setErrors] = useState({});
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
  const [statusFilter, setStatusFilter] = useState("active");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editErrors, setEditErrors] = useState({});
  const [editSlugEdited, setEditSlugEdited] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const loadPackages = async (targetPage = page) => {
    setLoading(true);
    try {
      const params = { page: targetPage, per_page: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (cycleFilter !== "all") params.billing_cycle = cycleFilter;
      const response = await getSubscriptionPackages(params);
      const payload = response?.data || {};
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(response?.data) ? response.data : [];
      setPackages(list);
      setPagination({
        current_page: Number(payload?.current_page || targetPage),
        last_page: Number(payload?.last_page || 1),
        per_page: Number(payload?.per_page || 20),
        total: Number(payload?.total || list.length),
      });
    } catch (error) {
      setPackages([]);
      setSnack({ open: true, message: error?.response?.data?.message || "Package list fetch failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, cycleFilter]);

  useEffect(() => {
    loadPackages(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };
  const setEditField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setEditErrors((prev) => ({ ...prev, [field]: undefined }));
  };
  const handleNameChange = (event) => {
    const name = event.target.value;
    setForm((prev) => ({ ...prev, name, slug: slugEdited ? prev.slug : slugify(name) }));
  };
  const handleEditNameChange = (event) => {
    const name = event.target.value;
    setEditForm((prev) => ({ ...prev, name, slug: editSlugEdited ? prev.slug : slugify(name) }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const response = await createSubscriptionPackage(buildPayload(form));
      if (response?.status === "success") {
        setSnack({ open: true, message: response?.message || "Package created successfully", severity: "success" });
        setForm(emptyForm);
        setSlugEdited(false);
        await loadPackages(1);
        setPage(1);
      } else {
        setErrors(response?.errors || {});
        setSnack({ open: true, message: response?.message || "Package create failed", severity: "error" });
      }
    } catch (error) {
      setErrors(error?.response?.data?.errors || {});
      setSnack({ open: true, message: error?.response?.data?.message || "Package create failed", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = async (pkg) => {
    setEditingPackage(pkg);
    setEditForm(normalizePackage(pkg));
    setEditErrors({});
    setEditSlugEdited(true);
    setEditOpen(true);
    try {
      const response = await getSubscriptionPackageDetails(pkg.id);
      const latest = response?.data?.package || response?.data || response;
      if (latest && typeof latest === "object") setEditForm(normalizePackage(latest));
    } catch {
      // Row data is enough for editing if details endpoint is unavailable.
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingPackage?.id) return;
    setEditSubmitting(true);
    setEditErrors({});
    try {
      const response = await updateSubscriptionPackage(editingPackage.id, buildPayload(editForm));
      if (response?.status === "success") {
        setSnack({ open: true, message: response?.message || "Package updated successfully", severity: "success" });
        setEditOpen(false);
        setEditingPackage(null);
        await loadPackages(page);
      } else {
        setEditErrors(response?.errors || {});
        setSnack({ open: true, message: response?.message || "Package update failed", severity: "error" });
      }
    } catch (error) {
      setEditErrors(error?.response?.data?.errors || {});
      setSnack({ open: true, message: error?.response?.data?.message || "Package update failed", severity: "error" });
    } finally {
      setEditSubmitting(false);
    }
  };

  const markInactive = async (pkg) => {
    setActionLoadingId(pkg.id);
    try {
      const response = await inactiveSubscriptionPackage(pkg.id);
      setSnack({ open: true, message: response?.message || "Package marked inactive", severity: response?.status === "success" ? "success" : "error" });
      await loadPackages(page);
    } catch (error) {
      setSnack({ open: true, message: error?.response?.data?.message || "Package inactive failed", severity: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setActionLoadingId(deleteTarget.id);
    try {
      const response = await deleteSubscriptionPackage(deleteTarget.id);
      setSnack({ open: true, message: response?.message || "Package deleted successfully", severity: response?.status === "success" ? "success" : "error" });
      setDeleteTarget(null);
      await loadPackages(page);
    } catch (error) {
      setSnack({ open: true, message: error?.response?.data?.message || "Package delete failed", severity: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const packageCards = useMemo(() => packages, [packages]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1280, mx: "auto" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Subscription Packages</Typography>
          <Typography color="text.secondary">Create SaaS plans for store subscriptions.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="all">All</MenuItem>
            {statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Cycle" value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="all">All</MenuItem>
            {billingCycles.map((cycle) => <MenuItem key={cycle} value={cycle}>{cycle}</MenuItem>)}
          </TextField>
        </Stack>
      </Stack>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Create Package</Typography>
          <PackageForm form={form} errors={errors} onChange={setField} onNameChange={handleNameChange} onSlugChange={(e) => { setSlugEdited(true); setField("slug", slugify(e.target.value)); }} onSubmit={handleCreate} submitting={submitting} submitLabel="Create Package" />
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Package List</Typography>
            <Chip label={`${pagination.total} total`} size="small" />
          </Stack>
          {loading ? (
            <Box sx={{ py: 7, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
          ) : isMobile ? (
            <Stack spacing={2}>
              {packageCards.map((pkg) => (
                <Paper key={pkg.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ fontWeight: 900 }}>{pkg.name}</Typography>
                      <Chip label={pkg.status || "-"} size="small" color={pkg.status === "active" ? "success" : "default"} />
                    </Stack>
                    <Typography color="text.secondary">{formatMoney(pkg)} / {pkg.billing_cycle}</Typography>
                    <Typography variant="body2">Products: {pkg.max_products ?? "Unlimited"} | Orders: {pkg.max_orders_per_month ?? "Unlimited"}</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => openEdit(pkg)}>Edit</Button>
                      <Button size="small" color="warning" startIcon={<VisibilityOffOutlinedIcon />} onClick={() => markInactive(pkg)}>Inactive</Button>
                      <Button size="small" color="error" startIcon={<DeleteOutlineOutlinedIcon />} onClick={() => setDeleteTarget(pkg)}>Delete</Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {["Name", "Price", "Billing Cycle", "Trial Days", "Product Limit", "Order Limit", "Featured", "Popular", "Status", "Sort", "Actions"].map((header) => (
                      <TableCell key={header} sx={{ fontWeight: 800 }}>{header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800 }}>{pkg.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{pkg.slug}</Typography>
                      </TableCell>
                      <TableCell>{formatMoney(pkg)}</TableCell>
                      <TableCell>{pkg.billing_cycle}</TableCell>
                      <TableCell>{pkg.trial_days ?? "-"}</TableCell>
                      <TableCell>{pkg.max_products ?? "Unlimited"}</TableCell>
                      <TableCell>{pkg.max_orders_per_month ?? "Unlimited"}</TableCell>
                      <TableCell>{pkg.is_featured ? "Yes" : "No"}</TableCell>
                      <TableCell>{pkg.is_popular ? "Yes" : "No"}</TableCell>
                      <TableCell><Chip size="small" label={pkg.status || "-"} color={pkg.status === "active" ? "success" : "default"} variant="outlined" /></TableCell>
                      <TableCell>{pkg.sort_order ?? 0}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(pkg)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Mark inactive"><span><IconButton size="small" color="warning" disabled={actionLoadingId === pkg.id} onClick={() => markInactive(pkg)}><VisibilityOffOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                          <Tooltip title="Delete"><span><IconButton size="small" color="error" disabled={actionLoadingId === pkg.id} onClick={() => setDeleteTarget(pkg)}><DeleteOutlineOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!packages.length && (
                    <TableRow><TableCell colSpan={11} align="center" sx={{ py: 5 }}>No packages found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Stack alignItems="center" sx={{ pt: 2 }}>
            <Pagination count={pagination.last_page} page={page} onChange={(_, value) => setPage(value)} color="primary" />
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 900 }}>Edit Package</DialogTitle>
        <DialogContent dividers>
          <PackageForm form={editForm} errors={editErrors} onChange={setEditField} onNameChange={handleEditNameChange} onSlugChange={(e) => { setEditSlugEdited(true); setEditField("slug", slugify(e.target.value)); }} onSubmit={handleUpdate} submitting={editSubmitting} submitLabel="Update Package" />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 900 }}>Delete package?</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete {deleteTarget?.name || "this package"}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} disabled={Boolean(actionLoadingId)}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((prev) => ({ ...prev, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SubscriptionPackageManagement;
