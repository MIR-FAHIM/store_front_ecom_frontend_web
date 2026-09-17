import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material";
import {
  Alert,
  Avatar,
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
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
} from "@mui/material";
import {
  AdminPanelSettings,
  CalendarToday,
  CheckCircleOutline,
  Close,
  Delete,
  Edit,
  Email,
  FilterList,
  Person,
  Phone,
  Refresh,
  Search,
  Security,
  Visibility,
  WarningAmber,
} from "@mui/icons-material";
import { getAdminList, updateUser } from "../../../api/controller/admin_controller/user_controller.jsx";
import { tokens } from "../../../theme";

const extractAdminList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.admins)) return payload.admins;
  if (Array.isArray(payload?.users)) return payload.users;
  return [];
};

const extractTotal = (payload, fallbackLength = 0) => {
  if (!payload) return fallbackLength;
  if (typeof payload?.data?.total === "number") return payload.data.total;
  if (typeof payload?.total === "number") return payload.total;
  return fallbackLength;
};

const getAdminName = (admin) => {
  if (!admin) return "Admin";
  if (admin.name) return admin.name;
  const combined = [admin.first_name, admin.last_name].filter(Boolean).join(" ");
  if (combined) return combined;
  return admin.user_name || admin.username || "Admin";
};

const getAdminRole = (admin) => {
  if (!admin) return "Admin";
  if (admin.role?.name) return admin.role.name;
  if (typeof admin.role === "string" && admin.role) return admin.role;
  if (admin.role_name) return admin.role_name;
  if (Array.isArray(admin.roles) && admin.roles.length > 0) {
    return admin.roles.map((r) => r?.name || r).join(", ");
  }
  return admin.user_type || "Admin";
};

const getAdminStatus = (admin) => {
  if (!admin) return "active";
  if (admin.banned === 1 || admin.banned === true || String(admin.banned) === "1") return "banned";
  if (admin.status) return String(admin.status).toLowerCase();
  if (admin.is_active === 0 || admin.is_active === false) return "inactive";
  return "active";
};

const formatDate = (val) => {
  if (!val) return "—";
  try {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return String(val);
  }
};

const AdminList = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals & Notifications
  const [viewAdmin, setViewAdmin] = useState(null);
  const [editAdmin, setEditAdmin] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const fetchAdmins = async (pageIndex = page, perPage = rowsPerPage) => {
    setLoading(true);
    try {
      const apiPage = pageIndex + 1;
      const res = await getAdminList({ page: apiPage, per_page: perPage });
      const list = extractAdminList(res);
      setAdmins(list);
      setTotalCount(extractTotal(res, list.length));
    } catch (err) {
      console.error("Failed to fetch admin list:", err);
      setSnack({
        open: true,
        message: err?.response?.data?.message || err?.message || "Failed to load admin list.",
        severity: "error",
      });
      setAdmins([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins(page, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  // Unique roles from data for filter dropdown
  const uniqueRoles = useMemo(() => {
    const rolesSet = new Set();
    admins.forEach((admin) => {
      const role = getAdminRole(admin);
      if (role) rolesSet.add(role);
    });
    return Array.from(rolesSet);
  }, [admins]);

  // Filtered rows for client-side search & filtering
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const name = getAdminName(admin).toLowerCase();
      const email = String(admin?.email || "").toLowerCase();
      const phone = String(admin?.phone || admin?.mobile || "").toLowerCase();
      const role = getAdminRole(admin).toLowerCase();
      const status = getAdminStatus(admin).toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || name.includes(q) || email.includes(q) || phone.includes(q) || role.includes(q);
      const matchesRole = roleFilter === "all" || role === roleFilter.toLowerCase();
      const matchesStatus = statusFilter === "all" || status === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [admins, searchQuery, roleFilter, statusFilter]);

  // KPI counts
  const kpiStats = useMemo(() => {
    const total = admins.length;
    const active = admins.filter((a) => getAdminStatus(a) === "active").length;
    const bannedOrInactive = total - active;
    return { total, active, bannedOrInactive };
  }, [admins]);

  // Handle Edit Save
  const handleEditSave = async () => {
    if (!editAdmin?.id) return;
    setEditSaving(true);
    try {
      await updateUser(editAdmin.id, editForm);
      setSnack({ open: true, message: "Admin updated successfully!", severity: "success" });
      setEditAdmin(null);
      fetchAdmins(page, rowsPerPage);
    } catch (err) {
      setSnack({
        open: true,
        message: err?.response?.data?.message || err?.message || "Failed to update admin.",
        severity: "error",
      });
    } finally {
      setEditSaving(false);
    }
  };

  const openEditModal = (admin) => {
    setEditAdmin(admin);
    setEditForm({
      name: getAdminName(admin),
      email: admin?.email || "",
      phone: admin?.phone || admin?.mobile || "",
      role: getAdminRole(admin),
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <AdminPanelSettings sx={{ fontSize: 32, color: colors.blueAccent?.[500] || "#6366f1" }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Admin List
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage system administrators, permissions, and roles.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchAdmins(page, rowsPerPage)}
            disabled={loading}
            sx={{ textTransform: "none", borderRadius: "8px" }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Total Administrators
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                {totalCount || admins.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Active Admins
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "#10b981" }}>
                {kpiStats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Inactive / Suspended
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "#ef4444" }}>
                {kpiStats.bannedOrInactive}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter / Search Bar */}
      <Card sx={{ mb: 3, borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, email, phone, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="role-filter-label">Role</InputLabel>
                <Select
                  labelId="role-filter-label"
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  {uniqueRoles.map((r) => (
                    <MenuItem key={r} value={r.toLowerCase()}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="banned">Banned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Admin Table */}
      <Card sx={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <TableContainer component={Paper} sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
          <Table>
            <TableHead sx={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Administrator</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Joined Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      Loading admin list...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <AdminPanelSettings sx={{ fontSize: 48, color: "text.secondary", opacity: 0.4 }} />
                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
                      No administrators found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                        ? "Try adjusting your search query or filters."
                        : "No admin records returned from the API."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmins.map((admin, idx) => {
                  const name = getAdminName(admin);
                  const role = getAdminRole(admin);
                  const status = getAdminStatus(admin);
                  const email = admin?.email || "—";
                  const phone = admin?.phone || admin?.mobile || "—";
                  const joined = formatDate(admin?.created_at || admin?.createdDate);

                  return (
                    <TableRow
                      key={admin?.id ?? idx}
                      hover
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            src={admin?.image || admin?.profile_image || admin?.avatar}
                            sx={{
                              width: 38,
                              height: 38,
                              bgcolor: colors.blueAccent?.[700] || "#4f46e5",
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: #{admin?.id ?? idx + 1}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{email}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {phone}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={<Security sx={{ fontSize: "14px !important" }} />}
                          label={role}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: 11,
                            backgroundColor: "rgba(99,102,241,0.15)",
                            color: "#818cf8",
                            border: "1px solid rgba(99,102,241,0.3)",
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={status.toUpperCase()}
                          size="small"
                          color={status === "active" ? "success" : status === "banned" ? "error" : "default"}
                          sx={{ fontWeight: 600, fontSize: 10, height: 22 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {joined}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => setViewAdmin(admin)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Admin">
                            <IconButton size="small" onClick={() => openEditModal(admin)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount || filteredAdmins.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Card>

      {/* View Admin Details Dialog */}
      <Dialog
        open={Boolean(viewAdmin)}
        onClose={() => setViewAdmin(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AdminPanelSettings color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Admin Details
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setViewAdmin(null)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          {viewAdmin && (
            <Stack spacing={2.5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={viewAdmin?.image || viewAdmin?.profile_image || viewAdmin?.avatar}
                  sx={{ width: 64, height: 64, fontSize: 24, fontWeight: 700 }}
                >
                  {getAdminName(viewAdmin).charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {getAdminName(viewAdmin)}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip label={getAdminRole(viewAdmin)} size="small" color="primary" />
                    <Chip
                      label={getAdminStatus(viewAdmin).toUpperCase()}
                      size="small"
                      color={getAdminStatus(viewAdmin) === "active" ? "success" : "error"}
                    />
                  </Stack>
                </Box>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Admin ID
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    #{viewAdmin?.id || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Email Address
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {viewAdmin?.email || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Phone / Mobile
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {viewAdmin?.phone || viewAdmin?.mobile || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Joined Date
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatDate(viewAdmin?.created_at)}
                  </Typography>
                </Grid>
                {viewAdmin?.department && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {viewAdmin.department?.name || viewAdmin.department}
                    </Typography>
                  </Grid>
                )}
                {viewAdmin?.designation && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Designation
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {viewAdmin.designation?.name || viewAdmin.designation}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewAdmin(null)} variant="outlined">
            Close
          </Button>
          <Button
            onClick={() => {
              const target = viewAdmin;
              setViewAdmin(null);
              openEditModal(target);
            }}
            variant="contained"
            startIcon={<Edit />}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog
        open={Boolean(editAdmin)}
        onClose={() => !editSaving && setEditAdmin(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight={700}>
            Edit Administrator
          </Typography>
          <IconButton size="small" onClick={() => setEditAdmin(null)} disabled={editSaving}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              fullWidth
              size="small"
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              label="Email Address"
              fullWidth
              size="small"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <TextField
              label="Phone Number"
              fullWidth
              size="small"
              value={editForm.phone}
              onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditAdmin(null)} disabled={editSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={editSaving}
            startIcon={editSaving ? <CircularProgress size={16} /> : null}
          >
            {editSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
          severity={snack.severity}
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminList;
