import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
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
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
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
  useMediaQuery,
} from "@mui/material";
import {
  Block,
  CheckCircleOutline,
  Delete,
  Edit,
  Refresh,
  Search,
} from "@mui/icons-material";
import {
  banUser,
  deleteUser,
  getAllCustomers,
  getUserDetail,
  unbanUser,
  updateUser,
} from "../../../api/controller/admin_controller/user_controller.jsx";
import { tokens } from "../../../theme";

const emptyEditForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  confirm_password: "",
};

const unwrapUser = (payload) => {
  const data = payload?.data ?? payload;
  return data?.data ?? data?.user ?? data ?? null;
};

const isSuccess = (response) =>
  response?.status === "success" || response?.status === 200 || response?.success === true;

const getApiMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const getApiErrors = (errorOrResponse) =>
  errorOrResponse?.response?.data?.errors || errorOrResponse?.errors || {};

const normalizeErrors = (errors) => {
  if (!errors || typeof errors !== "object") return {};
  return Object.entries(errors).reduce((acc, [key, value]) => {
    acc[key] = Array.isArray(value) ? value.join(" ") : String(value);
    return acc;
  }, {});
};

const getCustomerEmail = (customer) => customer?.email || customer?.user?.email || "";
const getCustomerMobile = (customer) =>
  customer?.mobile || customer?.phone || customer?.user?.mobile || customer?.user?.phone || "";
const getCustomerPhone = (customer) =>
  customer?.phone || customer?.mobile || customer?.user?.phone || customer?.user?.mobile || "";

const getCustomerId = (customer) => customer?.id || customer?.user_id || customer?.user?.id;

const isCustomerBanned = (customer) => {
  const banned = customer?.banned ?? customer?.is_banned ?? customer?.user?.banned ?? customer?.user?.is_banned;
  const status = String(customer?.status ?? customer?.user?.status ?? "").toLowerCase();
  return banned === 1 || banned === true || String(banned) === "1" || status === "banned";
};

const formatRegisteredAt = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fieldValue = (value) => value ?? "";

const nullableValue = (value) => {
  const next = String(value ?? "").trim();
  return next ? next : null;
};

const AllCustomers = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const showSnack = (msg, severity = "success") => {
    setSnack({ open: true, msg, severity });
  };

  const fetchCustomers = async (
    pageZeroBased = page,
    perPage = rowsPerPage,
    search = searchQuery
  ) => {
    setLoading(true);
    try {
      const apiPage = pageZeroBased + 1;
      const params = {
        page: apiPage,
        per_page: perPage,
      };
      if (search.trim()) params.search = search.trim();

      const response = await getAllCustomers(params);

      if (isSuccess(response)) {
        const paginator = response?.data;
        const list = Array.isArray(paginator?.data) ? paginator.data : [];

        setRows(list);
        setTotal(Number(paginator?.total ?? list.length));
        setRowsPerPage(Number(paginator?.per_page ?? perPage));
        setPage(Number(paginator?.current_page ?? apiPage) - 1);
      } else {
        setRows([]);
        setTotal(0);
        if (response?.message) showSnack(response.message, "error");
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setRows([]);
      setTotal(0);
      showSnack(getApiMessage(err, "Failed to load customers."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchCustomers(0, rowsPerPage, searchQuery);
    }, 350);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
    fetchCustomers(newPage, rowsPerPage, searchQuery);
  };

  const handleChangeRowsPerPage = (event) => {
    const next = parseInt(event.target.value, 10);
    setRowsPerPage(next);
    setPage(0);
    fetchCustomers(0, next, searchQuery);
  };

  const setEditField = (key) => (event) => {
    setEditForm((prev) => ({ ...prev, [key]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const fillEditForm = (customer) => {
    setEditForm({
      name: fieldValue(customer?.name || customer?.user?.name),
      email: fieldValue(getCustomerEmail(customer)),
      phone: fieldValue(customer?.phone || customer?.user?.phone),
      address: fieldValue(customer?.address || customer?.user?.address),
      password: "",
      confirm_password: "",
    });
  };

  const handleEdit = async (customer) => {
    const customerId = getCustomerId(customer);
    if (!customerId) return;

    setEditId(customerId);
    setFieldErrors({});
    fillEditForm(customer);
    setEditOpen(true);
    setEditLoading(true);

    try {
      const response = await getUserDetail(customerId);
      const latest = unwrapUser(response);
      if (latest && typeof latest === "object" && !Array.isArray(latest)) {
        fillEditForm(latest);
      }
    } catch (err) {
      showSnack(getApiMessage(err, "Failed to load latest customer details."), "error");
    } finally {
      setEditLoading(false);
    }
  };

  const closeEdit = () => {
    if (saving) return;
    setEditOpen(false);
    setEditId(null);
    setEditForm(emptyEditForm);
    setFieldErrors({});
  };

  const handleSubmitEdit = async (event) => {
    event.preventDefault();
    if (!editId) return;

    setSaving(true);
    setFieldErrors({});

    try {
      const nextPassword = String(editForm.password || "");
      const confirmPassword = String(editForm.confirm_password || "");

      if (nextPassword || confirmPassword) {
        if (nextPassword.length < 6) {
          setFieldErrors({ password: "Password must be at least 6 characters." });
          setSaving(false);
          return;
        }
        if (nextPassword !== confirmPassword) {
          setFieldErrors({ confirm_password: "Password and confirm password do not match." });
          setSaving(false);
          return;
        }
      }

      const payload = {
        name: nullableValue(editForm.name),
        email: nullableValue(editForm.email),
        phone: nullableValue(editForm.phone),
        address: nullableValue(editForm.address),
      };
      if (nextPassword) payload.password = nextPassword;

      const response = await updateUser(editId, payload);
      if (isSuccess(response)) {
        showSnack("Customer updated successfully", "success");
        setEditOpen(false);
        setEditId(null);
        setEditForm(emptyEditForm);
        setFieldErrors({});
        await fetchCustomers(page, rowsPerPage, searchQuery);
      } else {
        const errors = normalizeErrors(getApiErrors(response));
        setFieldErrors(errors);
        showSnack(response?.message || "Failed to update customer.", "error");
      }
    } catch (err) {
      const errors = normalizeErrors(getApiErrors(err));
      setFieldErrors(errors);
      showSnack(getApiMessage(err, "Failed to update customer."), "error");
    } finally {
      setSaving(false);
    }
  };

  const openConfirm = (type, customer) => {
    setConfirmTarget({ type, customer });
  };

  const closeConfirm = () => {
    if (!actionLoading) setConfirmTarget(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget?.customer) return;

    const customerId = getCustomerId(confirmTarget.customer);
    if (!customerId) return;

    setActionLoading(true);
    try {
      let response;
      if (confirmTarget.type === "ban") response = await banUser(customerId);
      if (confirmTarget.type === "unban") response = await unbanUser(customerId);
      if (confirmTarget.type === "delete") response = await deleteUser(customerId);

      if (isSuccess(response)) {
        const message =
          confirmTarget.type === "delete"
            ? "Customer deleted successfully"
            : response?.message || `Customer ${confirmTarget.type === "ban" ? "banned" : "unbanned"} successfully`;
        showSnack(message, "success");
        setConfirmTarget(null);
        await fetchCustomers(page, rowsPerPage, searchQuery);
      } else {
        showSnack(response?.message || "Action failed.", "error");
      }
    } catch (err) {
      showSnack(getApiMessage(err, "Action failed."), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchQuery("");
    setPage(0);
    fetchCustomers(0, rowsPerPage, "");
  };

  const renderStatusChip = (customer) => {
    if (isCustomerBanned(customer)) {
      return <Chip label="Banned" size="small" variant="outlined" color="error" />;
    }

    const status = String(customer?.status ?? customer?.user?.status ?? "").toLowerCase();

    if (status === "active") {
      return <Chip label="Active" size="small" variant="outlined" color="success" />;
    }
    if (status === "inactive") {
      return <Chip label="Inactive" size="small" variant="outlined" color="warning" />;
    }
    if (!status) return <Chip label="Active" size="small" variant="outlined" color="success" />;
    return <Chip label={status} size="small" variant="outlined" />;
  };

  const renderActionButtons = (customer, compact = false) => {
    const customerId = getCustomerId(customer);
    const banned = isCustomerBanned(customer);
    const banType = banned ? "unban" : "ban";
    const banLabel = banned ? "Unban" : "Ban";
    const banIcon = banned ? <CheckCircleOutline fontSize="small" /> : <Block fontSize="small" />;

    if (compact) {
      return (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit fontSize="small" />}
            onClick={() => handleEdit(customer)}
            disabled={!customerId}
            sx={{ borderRadius: 2, minWidth: 78, flex: "1 1 auto" }}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color={banned ? "success" : "warning"}
            startIcon={banIcon}
            onClick={() => openConfirm(banType, customer)}
            disabled={!customerId}
            sx={{ borderRadius: 2, minWidth: 88, flex: "1 1 auto" }}
          >
            {banLabel}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Delete fontSize="small" />}
            onClick={() => openConfirm("delete", customer)}
            disabled={!customerId}
            sx={{ borderRadius: 2, minWidth: 88, flex: "1 1 auto" }}
          >
            Delete
          </Button>
        </Stack>
      );
    }

    return (
      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
        <Tooltip title="Edit">
          <span>
            <IconButton
              size="small"
              onClick={() => handleEdit(customer)}
              disabled={!customerId}
              sx={{ color: colors.blueAccent[400] }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={banLabel}>
          <span>
            <IconButton
              size="small"
              onClick={() => openConfirm(banType, customer)}
              disabled={!customerId}
              sx={{ color: banned ? theme.palette.success.main : theme.palette.warning.main }}
            >
              {banIcon}
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Delete">
          <span>
            <IconButton
              size="small"
              onClick={() => openConfirm("delete", customer)}
              disabled={!customerId}
              sx={{ color: theme.palette.error.main }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    );
  };

  const confirmTitle = (() => {
    if (confirmTarget?.type === "delete") return "Delete Customer";
    if (confirmTarget?.type === "unban") return "Unban Customer";
    return "Ban Customer";
  })();

  const confirmMessage = (() => {
    if (confirmTarget?.type === "delete") {
      return "Are you sure you want to delete this customer? This action cannot be undone.";
    }
    if (confirmTarget?.type === "unban") {
      return "Are you sure you want to unban this customer?";
    }
    return "Are you sure you want to ban this customer?";
  })();

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight={800}>
          All Customers
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage customer accounts, status, and profile details.
        </Typography>
      </Box>

      <Card sx={{ background: colors.primary[400], borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={800}>
                Customers (Total: {total})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                API: /api/users/customers?page=1
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: { xs: "flex-start", md: "flex-end" },
                  flexWrap: "wrap",
                }}
              >
                <TextField
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers..."
                  sx={{
                    width: { xs: "100%", md: 320 },
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: colors.primary[500],
                      borderRadius: 2,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Tooltip title="Refresh">
                  <span>
                    <IconButton
                      onClick={() => fetchCustomers(page, rowsPerPage, searchQuery)}
                      disabled={loading}
                      sx={{
                        backgroundColor: colors.primary[500],
                        borderRadius: 2,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {loading ? <CircularProgress size={18} color="inherit" /> : <Refresh fontSize="small" />}
                    </IconButton>
                  </span>
                </Tooltip>

                <Button
                  variant="contained"
                  onClick={resetSearch}
                  sx={{
                    background: colors.blueAccent[500],
                    borderRadius: 2,
                    px: 2,
                    whiteSpace: "nowrap",
                  }}
                >
                  Reset Search
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, opacity: 0.2 }} />

          <TableContainer
            component={Paper}
            sx={{
              display: { xs: "none", sm: "block" },
              background: colors.primary[400],
              borderRadius: 2,
              overflow: "hidden",
              border: `1px solid ${colors.primary[500]}`,
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {["Name", "Email", "Mobile / Phone", "Status", "Created At", "Actions"].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 800,
                        backgroundColor: colors.primary[500],
                        borderBottom: `1px solid ${colors.primary[300]}`,
                      }}
                      align={h === "Actions" ? "center" : "left"}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">Loading customers...</Typography>
                    </TableCell>
                  </TableRow>
                )}

                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No customers found</Typography>
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  rows.map((customer, idx) => (
                    <TableRow
                      key={getCustomerId(customer) ?? idx}
                      hover
                      sx={{
                        "& td": { borderBottom: `1px solid ${colors.primary[300]}` },
                        backgroundColor: idx % 2 === 0 ? "transparent" : colors.primary[300],
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700 }}>{customer?.name ?? customer?.user?.name ?? "N/A"}</TableCell>
                      <TableCell>{getCustomerEmail(customer) || "N/A"}</TableCell>
                      <TableCell>{getCustomerPhone(customer) || "N/A"}</TableCell>
                      <TableCell>{renderStatusChip(customer)}</TableCell>
                      <TableCell>{formatRegisteredAt(customer?.created_at || customer?.user?.created_at)}</TableCell>
                      <TableCell align="center">{renderActionButtons(customer)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              display: { xs: "grid", sm: "none" },
              gap: 1.5,
            }}
          >
            {loading && (
              <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
                <CircularProgress size={24} />
                <Typography sx={{ mt: 1 }} color="text.secondary">
                  Loading customers...
                </Typography>
              </Box>
            )}

            {!loading && rows.length === 0 && (
              <Paper
                sx={{
                  p: 3,
                  textAlign: "center",
                  background: colors.primary[500],
                  borderRadius: 2,
                }}
              >
                <Typography color="text.secondary">No customers found</Typography>
              </Paper>
            )}

            {!loading &&
              rows.map((customer, idx) => (
                <Paper
                  key={getCustomerId(customer) ?? idx}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: colors.primary[500],
                    border: `1px solid ${colors.primary[300]}`,
                  }}
                >
                  <Stack spacing={1.2}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                      <Typography fontWeight={800} sx={{ fontSize: 16, lineHeight: 1.25, minWidth: 0 }}>
                        {customer?.name ?? customer?.user?.name ?? "N/A"}
                      </Typography>
                      {renderStatusChip(customer)}
                    </Box>

                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Email: <Box component="span" sx={{ color: "text.primary" }}>{getCustomerEmail(customer) || "N/A"}</Box>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Mobile / Phone: <Box component="span" sx={{ color: "text.primary" }}>{getCustomerMobile(customer) || "N/A"}</Box>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created: <Box component="span" sx={{ color: "text.primary" }}>{formatRegisteredAt(customer?.created_at || customer?.user?.created_at)}</Box>
                      </Typography>
                    </Stack>

                    <Divider sx={{ opacity: 0.2 }} />
                    {renderActionButtons(customer, true)}
                  </Stack>
                </Paper>
              ))}
          </Box>

          <TablePagination
            rowsPerPageOptions={[10, 20, 50, 100]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              mt: 1,
              ".MuiTablePagination-toolbar": {
                px: 0,
                flexWrap: { xs: "wrap", sm: "nowrap" },
                justifyContent: { xs: "center", sm: "flex-end" },
              },
              ".MuiTablePagination-spacer": { display: { xs: "none", sm: "block" } },
              ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                color: "text.secondary",
              },
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <Box component="form" onSubmit={handleSubmitEdit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Edit Customer</DialogTitle>
          <DialogContent dividers>
            {editLoading ? (
              <Box sx={{ py: 5, display: "grid", placeItems: "center" }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Grid container spacing={2} sx={{ pt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={editForm.name}
                    onChange={setEditField("name")}
                    error={Boolean(fieldErrors.name)}
                    helperText={fieldErrors.name}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={editForm.email}
                    onChange={setEditField("email")}
                    error={Boolean(fieldErrors.email)}
                    helperText={fieldErrors.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={editForm.phone}
                    onChange={setEditField("phone")}
                    error={Boolean(fieldErrors.phone)}
                    helperText={fieldErrors.phone}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={editForm.password}
                    onChange={setEditField("password")}
                    error={Boolean(fieldErrors.password)}
                    helperText={fieldErrors.password || "Leave blank to keep current password"}
                    autoComplete="new-password"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    value={editForm.confirm_password}
                    onChange={setEditField("confirm_password")}
                    error={Boolean(fieldErrors.confirm_password)}
                    helperText={fieldErrors.confirm_password}
                    autoComplete="new-password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={editForm.address}
                    onChange={setEditField("address")}
                    error={Boolean(fieldErrors.address)}
                    helperText={fieldErrors.address}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeEdit} disabled={saving} sx={{ textTransform: "none", fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving || editLoading}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              {saving ? <CircularProgress size={18} color="inherit" /> : "Save Changes"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(confirmTarget)} onClose={closeConfirm} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{confirmTitle}</DialogTitle>
        <DialogContent dividers>
          <Typography color={confirmTarget?.type === "delete" ? "error" : "text.primary"}>
            {confirmMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeConfirm} disabled={actionLoading} sx={{ textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmTarget?.type === "delete" ? "error" : "primary"}
            onClick={handleConfirmAction}
            disabled={actionLoading}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            {actionLoading ? <CircularProgress size={18} color="inherit" /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AllCustomers;
