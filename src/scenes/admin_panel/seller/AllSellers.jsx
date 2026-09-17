import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
} from "@mui/material";
import { ContentCopy as ContentCopyIcon, Delete, Edit, QrCode2Outlined, Refresh, Search, Visibility } from "@mui/icons-material";
import { deleteSeller, getAllShops } from "../../../api/controller/admin_controller/user_controller.jsx";
import { tokens } from "../../../theme";

const AllSellers = () => {
  const theme  = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  // ── Server-pagination state ─────────────
  const [rows,        setRows]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(0);      // MUI 0-based
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading,     setLoading]     = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingId,  setDeletingId]  = useState(null);
  const [snack,       setSnack]       = useState({ open: false, msg: "", severity: "success" });

  // ── Server-side search ──────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ── Fetch ───────────────────────────────
  const fetchSellers = useCallback(async (pageZeroBased = 0, perPage = 20, keyword = "") => {
    setLoading(true);
    setErrorMessage("");
    try {
      const apiPage  = pageZeroBased + 1;
      const search = String(keyword || "").trim();
      const response = await getAllShops({
        page: apiPage,
        per_page: perPage,
        ...(search ? { search } : {}),
      });

      if (response?.status === "success") {
        const paginator = response?.data;
        const list      = Array.isArray(paginator?.data) ? paginator.data : [];

        setRows(list);
        setTotal(Number(paginator?.total ?? list.length));
        setRowsPerPage(Number(paginator?.per_page ?? perPage));
        setPage(Number(paginator?.current_page ?? apiPage) - 1);
      } else {
        setRows([]);
        setTotal(0);
        setErrorMessage(response?.message || "Failed to load sellers.");
      }
    } catch (err) {
      console.error("Error fetching sellers:", err);
      setRows([]);
      setTotal(0);
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to load sellers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const keyword = searchQuery.trim();
    const timer = window.setTimeout(() => {
      fetchSellers(0, rowsPerPage, keyword);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [fetchSellers, rowsPerPage, searchQuery]);

  // ── Pagination handlers ─────────────────
  const handleChangePage = (_, newPage) => {
    setPage(newPage);
    fetchSellers(newPage, rowsPerPage, searchQuery.trim());
  };

  const handleChangeRowsPerPage = (event) => {
    const next = parseInt(event.target.value, 10);
    setRowsPerPage(next);
    setPage(0);
    fetchSellers(0, next, searchQuery.trim());
  };

  // ── Navigation handlers ─────────────────
  const handleViewProfile = (id) => navigate(`/ecom/admin/seller/${id}`);
  const handleEdit        = (id) => navigate(`/ecom/admin/seller/edit/${id}`);
  const handleStoreQr     = (id) => navigate(`/ecom/admin/store-qr/${id}`);

  const handleCopyCode = async (code) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(String(code));
      setSnack({ open: true, msg: "Store code copied.", severity: "success" });
    } catch {
      setSnack({ open: true, msg: "Could not copy store code.", severity: "error" });
    }
  };

  // ── Delete ──────────────────────────────
  const handleDelete = async (seller) => {
    const sellerId = seller?.user?.id;
    if (!sellerId) return;

    const label = seller?.name ? `"${seller.name}"` : `seller #${sellerId}`;
    if (!window.confirm(`Are you sure you want to delete ${label}?`)) return;

    setDeletingId(sellerId);
    try {
      const response = await deleteSeller(sellerId);
      const ok = response?.status === "success" || response?.success === true || response?.status === 200;

      if (ok) {
        setSnack({ open: true, msg: response?.message || "Seller deleted successfully.", severity: "success" });
        await fetchSellers(page, rowsPerPage, searchQuery.trim());
      } else {
        setSnack({ open: true, msg: response?.message || "Failed to delete seller.", severity: "error" });
      }
    } catch (err) {
      setSnack({
        open: true,
        msg: err?.response?.data?.message || err?.message || "Failed to delete seller.",
        severity: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Chip: shop status ───────────────────
  const renderStatusChip = (statusRaw, isBanned) => {
    if (isBanned === true)
      return <Chip label="Banned" size="small" variant="outlined" color="error" />;

    const status = String(statusRaw ?? "").toLowerCase();
    if (status === "active")   return <Chip label="Active"   size="small" variant="outlined" color="success" />;
    if (status === "inactive") return <Chip label="Inactive" size="small" variant="outlined" color="warning" />;
    if (!status)               return <Chip label="N/A"      size="small" variant="outlined" />;
    return <Chip label={status} size="small" variant="outlined" />;
  };

  // ── Helper: address ─────────────────────
  const renderLocation = (s) => {
    const parts = [s?.address, s?.area, s?.district, s?.zone].filter(Boolean);
    return parts.length ? parts.join(", ") : "N/A";
  };

  // ── Chip: subscription package ──────────
  const renderPackageChip = (seller) => {
    const sub = seller?.current_subscription ?? seller?.latest_subscription ?? seller?.last_subscription ?? null;

    // No subscription at all
    if (!sub) {
      return (
        <Chip
          label="No Package"
          size="small"
          variant="outlined"
          sx={{ fontSize: 11, color: "text.disabled", borderColor: "divider" }}
        />
      );
    }

    const pkg       = sub?.package;
    const pkgName   = pkg?.name ?? "Package";
    const subStatus = String(sub?.status ?? "").toLowerCase();
    const endsAt    = sub?.ends_at    ? new Date(sub.ends_at)    : null;
    const trialEnd  = sub?.trial_ends_at ? new Date(sub.trial_ends_at) : null;
    const now       = new Date();

    const isExpired = endsAt && endsAt < now;
    const inTrial   = trialEnd && trialEnd > now && !isExpired;

    let chipColor = "default";
    let badge     = null;

    if (isExpired || subStatus === "expired") {
      chipColor = "error";
      badge     = "Expired";
    } else if (subStatus === "inactive" || subStatus === "cancelled") {
      chipColor = "warning";
      badge     = "Inactive";
    } else if (subStatus === "active") {
      chipColor = "success";
      if (inTrial) badge = "Trial";
    }

    return (
      <Stack spacing={0.3} alignItems="flex-start">
        <Chip
          label={pkgName}
          size="small"
          color={chipColor}
          variant="outlined"
          sx={{ fontSize: 11, fontWeight: 600, maxWidth: 150 }}
        />
        {badge && (
          <Typography
            variant="caption"
            sx={{
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1,
              color:
                chipColor === "success" ? "#10b981"
                : chipColor === "error"   ? "#ef4444"
                : "#f59e0b",
            }}
          >
            {badge}
          </Typography>
        )}
        {endsAt && !isExpired && (
          <Typography variant="caption" sx={{ fontSize: 10, color: "text.disabled", lineHeight: 1 }}>
            Exp: {endsAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </Typography>
        )}
      </Stack>
    );
  };

  // ────────────────────────────────────────
  // Render
  // ────────────────────────────────────────
  const COL_SPAN = 10; // ID + Shop + Code + Slug + User + Email + Phone + Address + Status + Actions

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight={800}>All Sellers</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Shops list with backend search and pagination.
        </Typography>
      </Box>

      <Card sx={{ background: colors.primary[400], borderRadius: 2 }}>
        <CardContent>
          {/* Toolbar */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={800}>Shops (Total: {total})</Typography>
              <Typography variant="caption" color="text.secondary">API: /api/shops/list</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", gap: 1, justifyContent: { xs: "flex-start", md: "flex-end" }, flexWrap: "wrap" }}>
                <TextField
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by shop name, owner name, phone, slug, code, or email"
                  sx={{
                    width: { xs: "100%", md: 420 },
                    "& .MuiOutlinedInput-root": { backgroundColor: colors.primary[500], borderRadius: 2 },
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
                      onClick={() => fetchSellers(page, rowsPerPage, searchQuery.trim())}
                      disabled={loading}
                      sx={{ backgroundColor: colors.primary[500], borderRadius: 2 }}
                    >
                      <Refresh fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Button
                  variant="contained"
                  onClick={() => {
                    setSearchQuery("");
                    setPage(0);
                  }}
                  sx={{ background: colors.blueAccent[500], borderRadius: 2, px: 2, whiteSpace: "nowrap" }}
                >
                  Reset
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, opacity: 0.2 }} />

          {errorMessage ? (
            <Alert
              severity="error"
              sx={{ mb: 2, borderRadius: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => fetchSellers(page, rowsPerPage, searchQuery.trim())}>
                  Retry
                </Button>
              }
            >
              {errorMessage}
            </Alert>
          ) : null}

          {/* Table */}
          <TableContainer
            component={Paper}
            sx={{
              background: colors.primary[400],
              borderRadius: 2,
              overflow: "hidden",
              border: `1px solid ${colors.primary[500]}`,
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {["ID", "Shop", "Code", "Slug", "User", "Email", "Phone", "Address", "Status", "Actions"].map((h) => (
                    <TableCell
                      key={h}
                      align={h === "Actions" ? "center" : "left"}
                      sx={{
                        fontWeight: 800,
                        backgroundColor: colors.primary[500],
                        borderBottom: `1px solid ${colors.primary[300]}`,
                        whiteSpace: "nowrap",
                        minWidth: h === "Shop" ? 250 : undefined,
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {/* Loading */}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={COL_SPAN} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={28} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading shops...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {/* Empty */}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={COL_SPAN} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">No sellers found</Typography>
                    </TableCell>
                  </TableRow>
                )}

                {/* Rows */}
                {!loading &&
                  rows.map((seller, idx) => (
                    <TableRow
                      key={seller?.id ?? idx}
                      hover
                      sx={{
                        "& td": { borderBottom: `1px solid ${colors.primary[300]}` },
                        backgroundColor: idx % 2 === 0 ? "transparent" : colors.primary[300],
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700 }}>{seller?.id ?? "N/A"}</TableCell>

                      <TableCell sx={{ fontWeight: 600, minWidth: 250 }}>
                        <Stack spacing={0.6} alignItems="flex-start">
                          <Typography variant="body2" fontWeight={700} sx={{ wordBreak: "break-word" }}>
                            {seller?.shop_name || seller?.name || "N/A"}
                          </Typography>
                          <Tooltip
                            title={
                              seller?.current_subscription?.package
                                ? `${seller.current_subscription.package.name} · ${seller.current_subscription.billing_cycle ?? ""} · ${seller.current_subscription.currency ?? ""} ${seller.current_subscription.price ?? ""}`
                                : "No active subscription"
                            }
                            placement="top"
                            arrow
                          >
                            <span>{renderPackageChip(seller)}</span>
                          </Tooltip>
                        </Stack>
                      </TableCell>

                      <TableCell sx={{ minWidth: 110 }}>
                        {seller?.code ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="body2" fontWeight={700}>{seller.code}</Typography>
                            <Tooltip title="Copy code">
                              <IconButton size="small" onClick={() => handleCopyCode(seller.code)} sx={{ p: 0.35 }}>
                                <ContentCopyIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : "N/A"}
                      </TableCell>

                      <TableCell sx={{ maxWidth: 150 }}>
                        <Typography variant="body2" noWrap title={seller?.slug || ""}>
                          {seller?.slug || "N/A"}
                        </Typography>
                      </TableCell>

                      <TableCell>{seller?.user?.name ?? seller?.name ?? "N/A"}</TableCell>
                      <TableCell>{seller?.email ?? "N/A"}</TableCell>
                      <TableCell>{seller?.phone ?? "N/A"}</TableCell>
                      <TableCell sx={{ maxWidth: 160 }}>
                        <Typography variant="body2" noWrap title={renderLocation(seller)}>
                          {renderLocation(seller)}
                        </Typography>
                      </TableCell>

                      {/* Shop Status */}
                      <TableCell>{renderStatusChip(seller?.status, seller?.user?.banned === 1)}</TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.25} justifyContent="center">
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => handleViewProfile(seller.id)} sx={{ color: colors.blueAccent[500] }}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEdit(seller.id)} sx={{ color: colors.blueAccent[400] }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(seller)}
                              disabled={deletingId === seller?.user?.id}
                              sx={{ color: theme.palette.error.main }}
                            >
                              {deletingId === seller?.user?.id ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <Delete fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Store QR">
                            <IconButton
                              size="small"
                              onClick={() => handleStoreQr(seller?.id)}
                              disabled={!seller?.id}
                              sx={{ color: colors.tealAccent?.[500] || "#0f766e" }}
                            >
                              <QrCode2Outlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
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
              ".MuiTablePagination-toolbar": { px: 0 },
              ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                color: "text.secondary",
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Snackbar */}
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

export default AllSellers;
