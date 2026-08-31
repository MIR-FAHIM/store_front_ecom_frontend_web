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
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Add, DeleteOutline, PeopleAltOutlined, Refresh } from "@mui/icons-material";
import { tokens } from "../../../theme";
import {
  addCustomerPreference,
  getCustomersBySeller,
  removeCustomerPreference,
} from "../../../api/controller/customer_preference/customer_preference_controller.jsx";

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
  return [];
};

const normalizePagination = (payload, rows, fallbackPage, fallbackPerPage) => {
  const data = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  const nested = data?.data && !Array.isArray(data.data) ? data.data : data;
  return {
    page: Number(nested?.current_page ?? data?.current_page ?? fallbackPage),
    perPage: Number(nested?.per_page ?? data?.per_page ?? fallbackPerPage),
    total: Number(nested?.total ?? data?.total ?? rows.length),
  };
};

const customerFromRow = (row) => row?.customer || row?.customer_user || row?.customerUser || row?.user || row || {};

const fieldErrorsToText = (errors) => {
  if (!errors || typeof errors !== "object") return "";
  return Object.values(errors).flat().filter(Boolean).join(" ");
};

const messageForStatus = (res, fallback) => {
  if (res?.statusCode === 403) return "You do not have permission.";
  if (res?.statusCode === 404) return "Customer or seller not found.";
  if (res?.statusCode === 422) return fieldErrorsToText(res.errors) || res.message || fallback;
  return res?.message || fallback;
};

const SellerCustomers = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [existingOpen, setExistingOpen] = useState(false);
  const [customerUserId, setCustomerUserId] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState({ open: false, severity: "success", message: "" });

  const sellerUserId = useMemo(() => localStorage.getItem("userId") || "", []);

  const loadCustomers = async ({ nextPage = page, nextPerPage = perPage } = {}) => {
    setLoading(true);
    const res = await getCustomersBySeller({ page: nextPage + 1, per_page: nextPerPage });
    if (res?.status === "error") {
      setRows([]);
      setTotal(0);
      setNotice({ open: true, severity: "error", message: messageForStatus(res, "Failed to load customer list") });
      setLoading(false);
      return;
    }

    const list = normalizeRows(res);
    const pagination = normalizePagination(res, list, nextPage + 1, nextPerPage);
    setRows(list);
    setPage(Math.max(0, pagination.page - 1));
    setPerPage(pagination.perPage);
    setTotal(pagination.total);
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers({ nextPage: 0, nextPerPage: perPage });
  }, []);

  const handleAdd = async () => {
    setFieldErrors({});
    if (!customerUserId.trim()) {
      setFieldErrors({ customer_user_id: ["Customer user ID is required."] });
      return;
    }

    setSaving(true);
    const res = await addCustomerPreference(customerUserId.trim());
    setSaving(false);
    if (res?.status === "error") {
      if (res.statusCode === 422) setFieldErrors(res.errors || {});
      setNotice({ open: true, severity: "error", message: messageForStatus(res, "Failed to add customer") });
      return;
    }

    setExistingOpen(false);
    setCustomerUserId("");
    setNotice({ open: true, severity: "success", message: res?.message || "Customer added successfully" });
    loadCustomers({ nextPage: page, nextPerPage: perPage });
  };

  const handleCreateCustomer = async () => {
    setFieldErrors({});
    const payload = {
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim(),
      email: newCustomer.email.trim(),
      address: newCustomer.address.trim(),
      password: newCustomer.password,
    };

    if (!payload.name && !payload.phone && !payload.email) {
      setFieldErrors({ form: ["Add at least a name, phone, or email."] });
      return;
    }

    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") delete payload[key];
    });

    setSaving(true);
    const res = await addCustomerPreference(payload);
    setSaving(false);
    if (res?.status === "error") {
      if (res.statusCode === 422) setFieldErrors(res.errors || { form: [res.message] });
      const message =
        res?.statusCode === 403
          ? "You cannot add customer for another seller"
          : res?.statusCode === 404
            ? "Seller or customer not found"
            : res?.statusCode === 500
              ? "Something went wrong. Please try again."
              : messageForStatus(res, "Failed to add customer");
      setNotice({ open: true, severity: "error", message });
      return;
    }

    setOpen(false);
    setNewCustomer({ name: "", phone: "", email: "", address: "", password: "" });
    setNotice({ open: true, severity: "success", message: "Customer added successfully" });
    loadCustomers({ nextPage: page, nextPerPage: perPage });
  };

  const handleRemove = async (row) => {
    const customer = customerFromRow(row);
    const customerId = row?.customer_user_id || row?.customer_id || customer?.id;
    if (!customerId || !sellerUserId) {
      setNotice({ open: true, severity: "error", message: "Missing customer or seller id." });
      return;
    }

    const res = await removeCustomerPreference({ customer_user_id: customerId, seller_id: sellerUserId });
    if (res?.status === "error") {
      setNotice({ open: true, severity: "error", message: messageForStatus(res, "Failed to remove preference") });
      return;
    }
    setNotice({ open: true, severity: "success", message: res?.message || "Preference removed" });
    loadCustomers({ nextPage: page, nextPerPage: perPage });
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, minHeight: "100vh", background: theme.palette.mode === "dark" ? colors.primary[500] : "#f6f7fb" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" spacing={2} sx={{ mb: 2.5 }}>
        <Box>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <PeopleAltOutlined color="primary" />
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 0 }}>
              My Customers
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Keep a seller-owned customer list for faster POS and repeat selling.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => loadCustomers()} disabled={loading} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}>
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => {
              setFieldErrors({});
              setExistingOpen(true);
            }}
            sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}
          >
            Add Existing by ID
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setFieldErrors({});
              setOpen(true);
            }}
            sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900 }}
          >
            Add New Customer
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ borderRadius: 1, border: `1px solid ${theme.palette.divider}`, boxShadow: "none" }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Added Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row, index) => {
                    const customer = customerFromRow(row);
                    const rowKey = row?.id || `${customer?.id || "customer"}-${index}`;
                    const status = customer?.status || row?.status || "active";
                    return (
                      <TableRow key={rowKey} hover>
                        <TableCell sx={{ fontWeight: 800 }}>{customer?.name || customer?.full_name || "Customer"}</TableCell>
                        <TableCell>{customer?.mobile || customer?.phone || row?.phone || "-"}</TableCell>
                        <TableCell>{customer?.email || row?.email || "-"}</TableCell>
                        <TableCell>
                          <Chip size="small" label={String(status).toUpperCase()} color={String(status).toLowerCase() === "active" ? "success" : "default"} />
                        </TableCell>
                        <TableCell>{row?.created_at ? new Date(row.created_at).toLocaleDateString() : row?.added_at ? new Date(row.added_at).toLocaleDateString() : "-"}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Remove preference">
                            <IconButton size="small" color="error" onClick={() => handleRemove(row)}>
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <Typography variant="body2" color="text.secondary">
                        No preferred customers yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={perPage}
            rowsPerPageOptions={[10, 20, 50]}
            onPageChange={(_event, nextPage) => loadCustomers({ nextPage, nextPerPage: perPage })}
            onRowsPerPageChange={(event) => {
              const nextPerPage = Number(event.target.value);
              setPerPage(nextPerPage);
              loadCustomers({ nextPage: 0, nextPerPage });
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {fieldErrors?.form ? <Alert severity="warning">{fieldErrors.form[0]}</Alert> : null}
            <TextField
              autoFocus
              fullWidth
              label="Name"
              value={newCustomer.name}
              onChange={(event) => setNewCustomer((prev) => ({ ...prev, name: event.target.value }))}
              error={Boolean(fieldErrors?.name)}
              helperText={fieldErrors?.name?.[0] || "Recommended"}
            />
            <TextField
              fullWidth
              label="Phone"
              value={newCustomer.phone}
              onChange={(event) => setNewCustomer((prev) => ({ ...prev, phone: event.target.value }))}
              error={Boolean(fieldErrors?.phone)}
              helperText={fieldErrors?.phone?.[0] || "Primary field for POS customers"}
            />
            <TextField
              fullWidth
              label="Email"
              value={newCustomer.email}
              onChange={(event) => setNewCustomer((prev) => ({ ...prev, email: event.target.value }))}
              error={Boolean(fieldErrors?.email)}
              helperText={fieldErrors?.email?.[0] || "Optional"}
            />
            <TextField
              fullWidth
              label="Address"
              value={newCustomer.address}
              onChange={(event) => setNewCustomer((prev) => ({ ...prev, address: event.target.value }))}
              error={Boolean(fieldErrors?.address)}
              helperText={fieldErrors?.address?.[0] || "Optional"}
            />
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={newCustomer.password}
              onChange={(event) => setNewCustomer((prev) => ({ ...prev, password: event.target.value }))}
              error={Boolean(fieldErrors?.password)}
              helperText={fieldErrors?.password?.[0] || "Optional. Leave empty to let backend create one."}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateCustomer} disabled={saving} sx={{ textTransform: "none", fontWeight: 800 }}>
            {saving ? "Adding..." : "Add New Customer"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={existingOpen} onClose={() => setExistingOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Existing Customer</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Customer user ID"
            value={customerUserId}
            onChange={(event) => setCustomerUserId(event.target.value)}
            error={Boolean(fieldErrors?.customer_user_id)}
            helperText={fieldErrors?.customer_user_id?.[0] || "Search API is not available yet, so enter the customer user id."}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setExistingOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={saving} sx={{ textTransform: "none", fontWeight: 800 }}>
            {saving ? "Adding..." : "Add Customer"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notice.open} autoHideDuration={3500} onClose={() => setNotice((prev) => ({ ...prev, open: false }))}>
        <Alert severity={notice.severity} variant="filled" onClose={() => setNotice((prev) => ({ ...prev, open: false }))}>
          {notice.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SellerCustomers;
