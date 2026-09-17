import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  InputAdornment,
  Avatar,
  Paper,
  Grid,
} from "@mui/material";

import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import PhoneAndroidOutlinedIcon from "@mui/icons-material/PhoneAndroidOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import {
  getAllOrder,
  inactiveOrder,
  updateOrderStatus,
  getOrderStatusList,
} from "../../../api/controller/admin_controller/order/order_controller";

// ── Color Configuration Maps ──────────────────────────────────────────
const ORDER_STATUS_STYLE_MAP = {
  pending:            { label: "Pending",           color: "#f59e0b", bg: "#fffbeb", icon: <PendingActionsOutlinedIcon sx={{ fontSize: 13 }} /> },
  confirmed:          { label: "Confirmed",         color: "#3b82f6", bg: "#eff6ff", icon: <CheckCircleOutlineIcon sx={{ fontSize: 13 }} /> },
  processing:         { label: "Processing",        color: "#6366f1", bg: "#eef2ff", icon: <SettingsOutlinedIcon sx={{ fontSize: 13 }} /> },
  packed:             { label: "Packed",            color: "#8b5cf6", bg: "#f5f3ff", icon: <SettingsOutlinedIcon sx={{ fontSize: 13 }} /> },
  shipped:            { label: "Shipped",           color: "#0ea5e9", bg: "#f0f9ff", icon: <LocalShippingOutlinedIcon sx={{ fontSize: 13 }} /> },
  "out for delivery": { label: "Out for Delivery", color: "#f97316", bg: "#fff7ed", icon: <LocalShippingOutlinedIcon sx={{ fontSize: 13 }} /> },
  delivered:          { label: "Delivered",         color: "#10b981", bg: "#ecfdf5", icon: <CheckCircleOutlineIcon sx={{ fontSize: 13 }} /> },
  completed:          { label: "Completed",         color: "#059669", bg: "#d1fae5", icon: <CheckCircleOutlineIcon sx={{ fontSize: 13 }} /> },
  cancelled:          { label: "Cancelled",         color: "#ef4444", bg: "#fef2f2", icon: <CancelOutlinedIcon sx={{ fontSize: 13 }} /> },
  returned:           { label: "Returned",          color: "#f59e0b", bg: "#fffbeb", icon: <CancelOutlinedIcon sx={{ fontSize: 13 }} /> },
  refunded:           { label: "Refunded",          color: "#8b5cf6", bg: "#f5f3ff", icon: <PaymentOutlinedIcon sx={{ fontSize: 13 }} /> },
  failed:             { label: "Failed",            color: "#dc2626", bg: "#fee2e2", icon: <CancelOutlinedIcon sx={{ fontSize: 13 }} /> },
};

const PAYMENT_STATUS_CONFIG = {
  paid:     { label: "Paid",     color: "#10b981", bg: "#ecfdf5" },
  unpaid:   { label: "Unpaid",   color: "#ef4444", bg: "#fef2f2" },
  pending:  { label: "Pending",  color: "#f59e0b", bg: "#fffbeb" },
  refunded: { label: "Refunded", color: "#6366f1", bg: "#eef2ff" },
};

// Helper for formatted money
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(amount || 0);

// Helper for date format
const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-BD", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Platform helper
const getOrderPlatform = (order) =>
  order?.platform_name ||
  order?.platform ||
  order?.order_platform ||
  order?.from_platform ||
  order?.order_source ||
  order?.source ||
  order?.order_from ||
  "";

const formatPlatform = (value) => {
  const platform = String(value || "").trim();
  if (!platform) return "Web Store";
  return platform
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const PlatformBadge = ({ platform }) => {
  const name = formatPlatform(platform);
  const isPos = name.toLowerCase().includes("pos");
  const isApp = name.toLowerCase().includes("app") || name.toLowerCase().includes("mobile");

  return (
    <Chip
      icon={
        isPos ? <PointOfSaleOutlinedIcon sx={{ fontSize: 13 }} /> : isApp ? <PhoneAndroidOutlinedIcon sx={{ fontSize: 13 }} /> : <LanguageOutlinedIcon sx={{ fontSize: 13 }} />
      }
      label={name}
      size="small"
      variant="outlined"
      sx={{
        height: 24,
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 1.5,
        borderColor: "divider",
        bgcolor: isPos ? "#fff7ed" : isApp ? "#fdf2f8" : "#f8fafc",
        color: isPos ? "#c2410c" : isApp ? "#be185d" : "#475569",
        "& .MuiChip-icon": { color: "inherit", ml: 0.5 },
      }}
    />
  );
};

/* ── Status Chip Component ── */
const StatusChip = ({ status, onClick }) => {
  const key = String(status || "").toLowerCase();
  const cfg = ORDER_STATUS_STYLE_MAP[key] || { label: status || "—", color: "#64748b", bg: "#f1f5f9" };

  return (
    <Chip
      icon={cfg.icon || null}
      label={cfg.label}
      size="small"
      onClick={onClick}
      clickable={!!onClick}
      sx={{
        fontWeight: 700,
        fontSize: 11,
        height: 26,
        borderRadius: 1.5,
        bgcolor: cfg.bg,
        color: cfg.color,
        border: "1px solid",
        borderColor: cfg.color + "35",
        cursor: onClick ? "pointer" : "default",
        "& .MuiChip-icon": { color: cfg.color, ml: 0.5 },
        "&:hover": onClick ? { filter: "brightness(0.95)" } : undefined,
      }}
    />
  );
};

/* ── Payment Status Chip ── */
const PaymentStatusChip = ({ status }) => {
  const key = String(status || "").toLowerCase();
  const cfg = PAYMENT_STATUS_CONFIG[key] || { label: status || "—", color: "#64748b", bg: "#f1f5f9" };

  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: 11,
        height: 22,
        borderRadius: 1.5,
        bgcolor: cfg.bg,
        color: cfg.color,
        border: "1px solid",
        borderColor: cfg.color + "30",
      }}
    />
  );
};

/* ── Stat Card Component ── */
const StatMini = ({ icon, label, value, color, bg }) => (
  <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "divider", flex: 1, minWidth: 140 }}>
    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, display: "flex", alignItems: "center", gap: 1.5 }}>
      <Avatar sx={{ width: 40, height: 40, bgcolor: bg, color, borderRadius: 2 }}>{icon}</Avatar>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{value}</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>{label}</Typography>
      </Box>
    </CardContent>
  </Card>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const AllOrders = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Status dialog state
  const [statusDialog, setStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderStatusList, setOrderStatusList] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch orders from API
  const fetchOrders = async (pageZeroBased = 0, perPage = 10) => {
    try {
      setLoading(true);
      const params = {
        page: pageZeroBased + 1,
        per_page: perPage,
      };

      const response = await getAllOrder(params);
      if (response.status === "success" && response.data) {
        setOrders(response.data.data || []);
        setTotalOrders(response.data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page, rowsPerPage);
  }, [page, rowsPerPage]);

  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const res = await getOrderStatusList();
        if (res?.status === "success" && Array.isArray(res?.data)) {
          setOrderStatusList(res.data.filter((s) => s.is_active !== false));
        }
      } catch (e) {
        console.error("Failed to load order statuses", e);
      }
    };
    loadStatuses();
  }, []);

  // Filter orders by search & status tab
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((o) => (o.status || "").toLowerCase() === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          String(order.order_number || "").toLowerCase().includes(term) ||
          String(order.customer_name || "").toLowerCase().includes(term) ||
          String(order.customer_phone || "").toLowerCase().includes(term) ||
          String(order.shop_name || "").toLowerCase().includes(term) ||
          formatPlatform(getOrderPlatform(order)).toLowerCase().includes(term)
      );
    }
    return result;
  }, [searchTerm, orders, statusFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const s = { total: totalOrders, pending: 0, processing: 0, completed: 0, cancelled: 0, revenue: 0 };
    orders.forEach((o) => {
      const st = String(o.status || "").toLowerCase();
      if (st === "pending") s.pending++;
      else if (st === "processing" || st === "confirmed" || st === "packed" || st === "shipped") s.processing++;
      else if (st === "completed" || st === "delivered") { s.completed++; s.revenue += Number(o.total || 0); }
      else if (st === "cancelled" || st === "failed") s.cancelled++;
    });
    return s;
  }, [orders, totalOrders]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    fetchOrders(page, rowsPerPage);
  };

  const handleResetSearch = () => {
    setSearchTerm("");
  };

  const handleViewDetails = (orderId) => {
    navigate(`/admin/order/${orderId}`);
  };

  const handleOpenStatusDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus((order.status || "").toLowerCase());
    setStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setStatusDialog(false);
    setSelectedOrder(null);
    setNewStatus("");
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || newStatus === (selectedOrder.status || "").toLowerCase()) {
      handleCloseStatusDialog();
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await updateOrderStatus(selectedOrder.id, newStatus);
      if (response.status === "success") {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === selectedOrder.id ? { ...order, status: newStatus } : order
          )
        );
        handleCloseStatusDialog();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        setDeletingId(orderId);
        const res = await inactiveOrder(orderId);
        if (res?.status === "success") {
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
          setTotalOrders((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error("Error deleting order:", err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const cellSx = { borderBottom: "1px solid", borderColor: "divider", py: 1.6 };
  const headCellSx = {
    ...cellSx,
    fontWeight: 700,
    fontSize: 11,
    color: "text.secondary",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    py: 1.5,
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: { xs: 2, md: 3 } }}>
      {/* ── Page Header ── */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "#eef2ff", color: "#6366f1", display: "grid", placeItems: "center" }}>
            <ShoppingBagOutlinedIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Orders Management</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
              Track customer purchases, update statuses, and inspect details
            </Typography>
          </Box>
        </Stack>

        <Tooltip title="Refresh Order List">
          <span>
            <IconButton
              onClick={handleRefresh}
              disabled={loading}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, width: 40, height: 40 }}
            >
              <RefreshIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* ── KPI Summary Cards ── */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, overflowX: "auto", pb: 0.5 }}>
        <StatMini icon={<ReceiptLongOutlinedIcon sx={{ fontSize: 20 }} />} label="Total Orders" value={stats.total} color="#6366f1" bg="#eef2ff" />
        <StatMini icon={<PendingActionsOutlinedIcon sx={{ fontSize: 20 }} />} label="Pending" value={stats.pending} color="#f59e0b" bg="#fffbeb" />
        <StatMini icon={<SettingsOutlinedIcon sx={{ fontSize: 20 }} />} label="Processing" value={stats.processing} color="#3b82f6" bg="#eff6ff" />
        <StatMini icon={<CheckCircleOutlineIcon sx={{ fontSize: 20 }} />} label="Delivered" value={stats.completed} color="#10b981" bg="#ecfdf5" />
        <StatMini icon={<PaymentOutlinedIcon sx={{ fontSize: 20 }} />} label="Delivered Revenue" value={formatCurrency(stats.revenue)} color="#8b5cf6" bg="#f5f3ff" />
      </Stack>

      {/* ── Search & Filter Controls ── */}
      <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "divider", mb: 3 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} justifyContent="space-between">
            <TextField
              size="small"
              placeholder="Search by order #, customer, phone, or shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 20, color: "text.disabled" }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleResetSearch}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                flex: 1,
                maxWidth: 420,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6366f1" },
                },
              }}
            />

            {/* Status Filter Chips / Tabs */}
            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ rowGap: 0.8 }}>
              {[{ key: "all", label: "All" }, ...orderStatusList.map((s) => ({ key: s.name.toLowerCase(), label: s.name }))].map(({ key, label }) => {
                const active = statusFilter === key;
                return (
                  <Chip
                    key={key}
                    label={label}
                    size="small"
                    onClick={() => setStatusFilter(key)}
                    variant={active ? "filled" : "outlined"}
                    sx={{
                      fontWeight: active ? 700 : 600,
                      fontSize: 12,
                      borderRadius: 2,
                      cursor: "pointer",
                      px: 0.5,
                      bgcolor: active ? "#6366f1" : "transparent",
                      color: active ? "#fff" : "text.primary",
                      borderColor: active ? "#6366f1" : "divider",
                      "&:hover": {
                        bgcolor: active ? "#4f46e5" : "action.hover",
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Orders Table ── */}
      <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "divider", overflow: "hidden" }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
              <CircularProgress size={32} sx={{ color: "#6366f1" }} />
            </Box>
          ) : filteredOrders.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <ShoppingBagOutlinedIcon sx={{ fontSize: 52, color: "text.disabled", mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "text.secondary" }}>
                {searchTerm || statusFilter !== "all" ? "No orders found" : "No orders created yet"}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.disabled", mt: 0.5 }}>
                {searchTerm || statusFilter !== "all" ? "Try clearing search filters" : "Customer orders will appear here"}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: "none" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "rgba(99,102,241,0.08)" : "#f8fafc" }}>
                    <TableCell sx={headCellSx}>Order No.</TableCell>
                    <TableCell sx={headCellSx}>Shop / Store</TableCell>
                    <TableCell sx={headCellSx}>Platform</TableCell>
                    <TableCell sx={headCellSx}>Customer</TableCell>
                    <TableCell sx={headCellSx} align="right">Amount</TableCell>
                    <TableCell sx={headCellSx}>Status</TableCell>
                    <TableCell sx={headCellSx}>Payment</TableCell>
                    <TableCell sx={headCellSx}>Date & Time</TableCell>
                    <TableCell sx={{ ...headCellSx, textAlign: "center" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredOrders.map((order) => {
                    const custName = order.customer_name || "Guest Customer";
                    const custPhone = order.customer_phone || "";
                    const initial = custName.charAt(0).toUpperCase();

                    return (
                      <TableRow
                        key={order.id}
                        hover
                        onClick={() => handleViewDetails(order.id)}
                        sx={{
                          transition: "background 180ms",
                          cursor: "pointer",
                          "&:hover": { bgcolor: theme.palette.mode === "dark" ? "rgba(99,102,241,0.04)" : "rgba(99,102,241,0.02)" },
                        }}
                      >
                        {/* Order No */}
                        <TableCell sx={cellSx}>
                          <Stack spacing={0.3}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: "#6366f1" }}>
                              #{order.order_number || order.id}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10 }}>
                              ID: {order.id}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* Shop */}
                        <TableCell sx={cellSx}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <StorefrontOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                {order.shop_name || "Main Store"}
                              </Typography>
                              {order.shop_id && (
                                <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10 }}>
                                  Shop #{order.shop_id}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Platform */}
                        <TableCell sx={cellSx}>
                          <PlatformBadge platform={getOrderPlatform(order)} />
                        </TableCell>

                        {/* Customer */}
                        <TableCell sx={cellSx}>
                          <Stack direction="row" alignItems="center" spacing={1.2}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 700, bgcolor: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                              {initial}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                                {custName}
                              </Typography>
                              {custPhone && (
                                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11, display: "block" }}>
                                  {custPhone}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Total Amount */}
                        <TableCell sx={cellSx} align="right">
                          <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary" }}>
                            {formatCurrency(order.total)}
                          </Typography>
                        </TableCell>

                        {/* Status (Clickable for fast status edit) */}
                        <TableCell sx={cellSx}>
                          <Tooltip title="Click to change status">
                            <Box component="span">
                              <StatusChip
                                status={order.status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenStatusDialog(order);
                                }}
                              />
                            </Box>
                          </Tooltip>
                        </TableCell>

                        {/* Payment Status */}
                        <TableCell sx={cellSx}>
                          <PaymentStatusChip status={order.payment_status} />
                        </TableCell>

                        {/* Date */}
                        <TableCell sx={cellSx}>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: 12 }}>
                            {formatDate(order.created_at)}
                          </Typography>
                        </TableCell>

                        {/* Actions */}
                        <TableCell sx={{ ...cellSx, textAlign: "center" }}>
                          <Stack direction="row" spacing={0.8} justifyContent="center" onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(order.id)}
                                sx={{
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 1.5,
                                  width: 32,
                                  height: 32,
                                  "&:hover": { bgcolor: "#eef2ff", borderColor: "#6366f1" },
                                }}
                              >
                                <VisibilityOutlinedIcon sx={{ fontSize: 16, color: "#6366f1" }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Quick Change Status">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenStatusDialog(order)}
                                sx={{
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 1.5,
                                  width: 32,
                                  height: 32,
                                  "&:hover": { bgcolor: "#fffbeb", borderColor: "#f59e0b" },
                                }}
                              >
                                <EditOutlinedIcon sx={{ fontSize: 16, color: "#f59e0b" }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete Order">
                              <IconButton
                                size="small"
                                disabled={deletingId === order.id}
                                onClick={() => handleDelete(order.id)}
                                sx={{
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 1.5,
                                  width: 32,
                                  height: 32,
                                  "&:hover": { bgcolor: "#fef2f2", borderColor: "#ef4444" },
                                }}
                              >
                                {deletingId === order.id ? (
                                  <CircularProgress size={16} sx={{ color: "#ef4444" }} />
                                ) : (
                                  <DeleteOutlineIcon sx={{ fontSize: 16, color: "#ef4444" }} />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {!loading && filteredOrders.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 20, 50, 100]}
              component="div"
              count={totalOrders}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ borderTop: "1px solid", borderColor: "divider" }}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Quick Update Status Dialog ── */}
      <Dialog open={statusDialog} onClose={handleCloseStatusDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Update Order Status</Typography>
          <IconButton size="small" onClick={handleCloseStatusDialog}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Updating order status for <Typography component="span" sx={{ fontWeight: 800, color: "#6366f1" }}>#{selectedOrder?.order_number || selectedOrder?.id}</Typography>
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Select New Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Select New Status"
              sx={{ borderRadius: 2 }}
            >
              {orderStatusList.map((s) => (
                <MenuItem key={s.id} value={s.name.toLowerCase()}>
                  <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseStatusDialog} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, color: "text.secondary" }}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            variant="contained"
            disabled={updatingStatus || newStatus === (selectedOrder?.status || "").toLowerCase()}
            startIcon={updatingStatus ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#6366f1",
              boxShadow: "0 4px 14px rgba(99,102,241,0.25)",
              "&:hover": { bgcolor: "#4f46e5" },
            }}
          >
            {updatingStatus ? "Saving..." : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllOrders;
