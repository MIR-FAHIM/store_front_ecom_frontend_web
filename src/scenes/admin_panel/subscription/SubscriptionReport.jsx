import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  AccountBalanceWalletOutlined,
  AutorenewOutlined,
  CalendarMonthOutlined,
  CardMembershipOutlined,
  CheckCircleOutline,
  CheckCircleOutlined,
  ContentCopyOutlined,
  DateRangeOutlined,
  ErrorOutline,
  FilterAltOutlined,
  HourglassEmptyOutlined,
  InfoOutlined,
  PersonOutline,
  ReceiptLongOutlined,
  Refresh,
  SearchOutlined,
  StorefrontOutlined,
  TrendingUpOutlined,
  VerifiedOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { tokens } from "../../../theme";
import {
  getSubscriptionReport,
  verifySubscriptionPayment,
} from "../../../api/controller/admin_controller/subscription_package/subscription_package_controller";
import { Link } from "react-router-dom";

// ─────────────────────────────────────────────────────────────
// Format Helpers
// ─────────────────────────────────────────────────────────────
const fmtNum = (n) => Number(n ?? 0).toLocaleString();

const fmtMoney = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(n ?? 0));

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  } catch {
    return dateStr;
  }
};

const formatDateOnly = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  } catch {
    return dateStr;
  }
};

const PERIOD_OPTIONS = [
  { value: "all",          label: "All Time" },
  { value: "today",        label: "Today" },
  { value: "this_week",    label: "This Week" },
  { value: "this_month",   label: "This Month" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "custom",       label: "Custom Range" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "all",       label: "All Payment Statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending",   label: "Pending Verification" },
  { value: "failed",    label: "Failed" },
];

const SUB_STATUS_OPTIONS = [
  { value: "all",     label: "All Subscription Statuses" },
  { value: "active",  label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
];

const GATEWAY_COLORS = {
  bkash:    { bg: "#e2136e18", color: "#e2136e", border: "#e2136e44" },
  nagad:    { bg: "#f7941d18", color: "#f7941d", border: "#f7941d44" },
  rocket:   { bg: "#8c349418", color: "#8c3494", border: "#8c349444" },
  aamarpay: { bg: "#0284c718", color: "#0284c7", border: "#0284c744" },
  ssl:      { bg: "#10b98118", color: "#10b981", border: "#10b98144" },
  manual:   { bg: "#6366f118", color: "#6366f1", border: "#6366f144" },
};

// ─────────────────────────────────────────────────────────────
// Metric Card
// ─────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, isMoney = false, subtitle, icon: Icon, color = "#6366f1" }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      sx={{
        borderRadius: "14px",
        border: `1px solid ${color}${isDark ? "33" : "22"}`,
        background: isDark
          ? `linear-gradient(135deg, ${color}14 0%, rgba(30, 41, 59, 0.4) 100%)`
          : `linear-gradient(135deg, ${color}0d 0%, #ffffff 100%)`,
        height: "100%",
        boxShadow: isDark ? "0 4px 14px rgba(0,0,0,0.25)" : "0 2px 10px rgba(0,0,0,0.04)",
      }}
    >
      <CardContent sx={{ p: 2.2, "&:last-child": { pb: 2.2 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: isDark ? "#f8fafc" : "#0f172a" }}>
              {isMoney ? fmtMoney(value) : fmtNum(value)}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.2,
              borderRadius: "12px",
              background: `${color}20`,
              color: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon sx={{ fontSize: 22 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────
// Main SubscriptionReport Component
// ─────────────────────────────────────────────────────────────
const SubscriptionReport = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";

  // Filter States
  const [period, setPeriod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [subscriptionStatus, setSubscriptionStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(20);

  // Data & Loading States
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Verification Dialog State
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Details Dialog State
  const [detailsTarget, setDetailsTarget] = useState(null);

  // Toast / Snackbar
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch Report Data
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const params = {
        page: page + 1,
        per_page: perPage,
      };

      if (period && period !== "all") params.period = period;
      if (period === "custom") {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }
      if (paymentStatus && paymentStatus !== "all") params.payment_status = paymentStatus;
      if (subscriptionStatus && subscriptionStatus !== "all") params.subscription_status = subscriptionStatus;
      if (search) params.search = search;

      const res = await getSubscriptionReport(params);

      if (res?.status === "success" && res?.data) {
        setReportData(res.data);
      } else if (res?.data) {
        setReportData(res.data);
      } else {
        setErrorMessage(res?.message || "Failed to load subscription report");
      }
    } catch (err) {
      console.error("Subscription report fetch error:", err);
      setErrorMessage(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, period, startDate, endDate, paymentStatus, subscriptionStatus, search]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Data extraction
  const summary = reportData?.summary || {};
  const subscriptionsObj = reportData?.subscriptions || {};
  const purchaseList = Array.isArray(subscriptionsObj?.data) ? subscriptionsObj.data : [];
  const totalRecords = Number(subscriptionsObj?.total || purchaseList.length || 0);

  // Reset Filters
  const handleResetFilters = () => {
    setPeriod("all");
    setStartDate("");
    setEndDate("");
    setPaymentStatus("all");
    setSubscriptionStatus("all");
    setSearchInput("");
    setSearch("");
    setPage(0);
  };

  // Manual Verify Payment Approval
  const handleConfirmVerify = async () => {
    if (!verifyTarget?.online_payment_id) return;
    try {
      setVerifying(true);
      const res = await verifySubscriptionPayment(verifyTarget.online_payment_id);

      if (res?.status === "success" || res?.message?.toLowerCase().includes("success") || res?.data) {
        setToast({
          open: true,
          message: res?.message || `Payment #${verifyTarget.online_payment_id} verified and package limits activated!`,
          severity: "success",
        });
        setVerifyTarget(null);
        // Refresh list
        fetchReport();
      } else {
        setToast({
          open: true,
          message: res?.message || "Failed to verify payment approval.",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Payment verification error:", err);
      setToast({
        open: true,
        message: err?.response?.data?.message || err.message || "Failed to verify payment.",
        severity: "error",
      });
    } finally {
      setVerifying(false);
    }
  };

  // Copy text helper
  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setToast({ open: true, message: `Copied ${label || "text"} to clipboard!`, severity: "info" });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              <CardMembershipOutlined />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Subscription Report & Purchases
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Financial summaries, package purchase history, and manual payment approvals.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Action Controls */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            component={Link}
            to="/admin/subscription-packages"
            variant="outlined"
            size="small"
            startIcon={<CardMembershipOutlined />}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: "8px" }}
          >
            Manage Packages
          </Button>

          <Tooltip title="Refresh data">
            <span>
              <IconButton
                onClick={fetchReport}
                disabled={loading}
                sx={{
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                  "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0" },
                }}
              >
                {loading ? <CircularProgress size={20} /> : <Refresh fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Summary KPI Cards ───────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Revenue"
            value={summary.total_revenue}
            isMoney={true}
            subtitle={`${fmtNum(summary.total_completed_payments)} completed payments`}
            icon={TrendingUpOutlined}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={2.25}>
          <KpiCard
            title="Subscriptions Bought"
            value={summary.total_subscriptions_bought}
            subtitle={`Active: ${fmtNum(summary.total_active_subscriptions)}`}
            icon={CardMembershipOutlined}
            color="#6366f1"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.25}>
          <KpiCard
            title="Active Subscriptions"
            value={summary.total_active_subscriptions}
            subtitle={`Expired: ${fmtNum(summary.total_expired_subscriptions)}`}
            icon={CheckCircleOutlined}
            color="#0ea5e9"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.25}>
          <KpiCard
            title="Pending Payments"
            value={summary.total_pending_payments}
            subtitle="Requires admin verification"
            icon={HourglassEmptyOutlined}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.25}>
          <KpiCard
            title="Failed / Expired"
            value={Number(summary.total_failed_payments || 0) + Number(summary.total_expired_subscriptions || 0)}
            subtitle={`Failed: ${fmtNum(summary.total_failed_payments)} | Exp: ${fmtNum(summary.total_expired_subscriptions)}`}
            icon={ErrorOutline}
            color="#ef4444"
          />
        </Grid>
      </Grid>

      {/* ── Filter & Search Bar ─────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "14px",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
          background: isDark ? colors.primary[400] : "#ffffff",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Search Box */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search shop, code, merchant/gateway TXN, owner..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchInput("")}>
                      ×
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Grid>

          {/* Period Filter */}
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="sub-period-label">Period</InputLabel>
              <Select
                labelId="sub-period-label"
                value={period}
                label="Period"
                onChange={(e) => {
                  setPeriod(e.target.value);
                  setPage(0);
                }}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Payment Status Filter */}
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="sub-pay-status-label">Payment</InputLabel>
              <Select
                labelId="sub-pay-status-label"
                value={paymentStatus}
                label="Payment"
                onChange={(e) => {
                  setPaymentStatus(e.target.value);
                  setPage(0);
                }}
              >
                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Subscription Status Filter */}
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="sub-sub-status-label">Subscription</InputLabel>
              <Select
                labelId="sub-sub-status-label"
                value={subscriptionStatus}
                label="Subscription"
                onChange={(e) => {
                  setSubscriptionStatus(e.target.value);
                  setPage(0);
                }}
              >
                {SUB_STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Reset Action */}
          <Grid item xs={6} sm={3} md={2}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              color="inherit"
              onClick={handleResetFilters}
              sx={{ textTransform: "none", height: 40, borderRadius: "8px" }}
            >
              Reset Filters
            </Button>
          </Grid>

          {/* Custom Date Inputs if selected */}
          {period === "custom" && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {/* Error Alert */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      {/* ── Subscriptions Purchases Table ───────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "14px",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
          background: isDark ? colors.primary[400] : "#ffffff",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Subscription Purchases & Payments
            </Typography>
            <Chip
              label={`${totalRecords} Records`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#dcfce7", color: "#10b981" }}
            />
          </Box>
          {loading && <CircularProgress size={20} />}
        </Box>

        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>Transaction</TableCell>
                <TableCell sx={{ fontWeight: 800, minWidth: 200 }}>Shop & Owner</TableCell>
                <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>Package</TableCell>
                <TableCell sx={{ fontWeight: 800, minWidth: 110 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 800, minWidth: 150 }}>Period & Validity</TableCell>
                <TableCell sx={{ fontWeight: 800, minWidth: 120 }}>Payment Status</TableCell>
                <TableCell sx={{ fontWeight: 800, minWidth: 120 }}>Sub Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, minWidth: 140 }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && purchaseList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontWeight: 600 }}>
                      Loading subscription purchase records...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : purchaseList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <ReceiptLongOutlined sx={{ fontSize: 44, color: "text.secondary", opacity: 0.5, mb: 1 }} />
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      No subscription purchase records found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Try adjusting your search query, status filters, or date range.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                purchaseList.map((item, idx) => {
                  const paymentId   = item.online_payment_id || item.id;
                  const merchantTxn = item.merchant_transaction_id;
                  const gatewayTxn  = item.gateway_transaction_id;
                  const gatewayKey  = String(item.gateway || "manual").toLowerCase();
                  const gwStyle     = GATEWAY_COLORS[gatewayKey] || GATEWAY_COLORS.manual;

                  const shopName    = item.shop?.shop_name || item.shop?.name || "Shop #" + (item.shop?.id || "—");
                  const shopCode    = item.shop?.code || item.shop?.shop_code;
                  const ownerName   = item.shop?.owner?.name;
                  const ownerPhone  = item.shop?.owner?.phone || item.shop?.phone;
                  const ownerEmail  = item.shop?.owner?.email || item.shop?.email;

                  const pkgName     = item.package?.name || "Package #" + (item.package?.id || "—");
                  const pkgCycle    = item.package?.billing_cycle;
                  const pkgLimit    = item.package?.max_products;

                  const payStatus   = String(item.payment_status || "pending").toLowerCase();
                  const subStatus   = String(item.subscription?.status || item.status || "pending").toLowerCase();

                  const startsAt    = item.subscription?.starts_at;
                  const endsAt      = item.subscription?.ends_at;

                  const isPendingPay = payStatus === "pending" || payStatus === "unpaid";

                  return (
                    <TableRow key={paymentId || idx} hover sx={{ transition: "background-color 0.15s ease" }}>
                      {/* 1. Transaction & Gateway */}
                      <TableCell>
                        <Box>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: "monospace", color: "#6366f1" }}>
                              {merchantTxn || `#${paymentId}`}
                            </Typography>
                            {merchantTxn && (
                              <Tooltip title="Copy Transaction ID">
                                <IconButton
                                  size="small"
                                  onClick={() => copyToClipboard(merchantTxn, "Transaction ID")}
                                  sx={{ p: 0.3 }}
                                >
                                  <ContentCopyOutlined sx={{ fontSize: 13 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>

                          <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                            <Chip
                              label={item.gateway ? item.gateway.toUpperCase() : "MANUAL"}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 800,
                                bgcolor: gwStyle.bg,
                                color: gwStyle.color,
                                border: `1px solid ${gwStyle.border}`,
                              }}
                            />
                            {gatewayTxn && (
                              <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", fontSize: "0.72rem" }}>
                                {gatewayTxn}
                              </Typography>
                            )}
                          </Box>

                          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.4, fontSize: "0.7rem" }}>
                            {formatDateTime(item.initiated_at || item.created_at)}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* 2. Shop & Owner */}
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                            {shopName}
                          </Typography>

                          {shopCode && (
                            <Chip
                              label={`Code: ${shopCode}`}
                              size="small"
                              onClick={() => copyToClipboard(shopCode, "Store Code")}
                              sx={{
                                height: 18,
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                mt: 0.4,
                                cursor: "pointer",
                                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                              }}
                            />
                          )}

                          {ownerName && (
                            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.4 }}>
                              Owner: {ownerName}
                            </Typography>
                          )}
                          {ownerPhone && (
                            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", fontSize: "0.7rem" }}>
                              {ownerPhone}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* 3. Package Details */}
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#10b981" }}>
                            {pkgName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Cycle: {pkgCycle ? pkgCycle.toUpperCase() : "MONTHLY"}
                          </Typography>
                          {pkgLimit !== undefined && (
                            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                              Limit: {fmtNum(pkgLimit)} Products
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* 4. Amount */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a" }}>
                          {fmtMoney(item.amount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.currency || "BDT"}
                        </Typography>
                      </TableCell>

                      {/* 5. Period & Validity */}
                      <TableCell>
                        <Box>
                          <Typography variant="caption" sx={{ display: "block", fontWeight: 600 }}>
                            From: {formatDateOnly(startsAt)}
                          </Typography>
                          <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                            To: {formatDateOnly(endsAt)}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* 6. Payment Status */}
                      <TableCell>
                        <Chip
                          label={payStatus.toUpperCase()}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            bgcolor:
                              payStatus === "completed" || payStatus === "paid" || payStatus === "success"
                                ? isDark ? "rgba(16, 185, 129, 0.15)" : "#dcfce7"
                                : payStatus === "pending" || payStatus === "unpaid"
                                ? isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7"
                                : isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
                            color:
                              payStatus === "completed" || payStatus === "paid" || payStatus === "success"
                                ? "#10b981"
                                : payStatus === "pending" || payStatus === "unpaid"
                                ? "#f59e0b"
                                : "#ef4444",
                          }}
                        />
                      </TableCell>

                      {/* 7. Subscription Status */}
                      <TableCell>
                        <Chip
                          label={subStatus.toUpperCase()}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            borderColor:
                              subStatus === "active"
                                ? "#10b981"
                                : subStatus === "pending"
                                ? "#f59e0b"
                                : "#94a3b8",
                            color:
                              subStatus === "active"
                                ? "#10b981"
                                : subStatus === "pending"
                                ? "#f59e0b"
                                : "text.secondary",
                          }}
                        />
                      </TableCell>

                      {/* 8. Actions */}
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.8} justifyContent="flex-end" alignItems="center">
                          {isPendingPay && (
                            <Tooltip title="Approve & Upgrade Package Limit">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<VerifiedOutlined sx={{ fontSize: 16 }} />}
                                onClick={() => setVerifyTarget(item)}
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  py: 0.4,
                                  px: 1.2,
                                  borderRadius: "8px",
                                  bgcolor: "#10b981",
                                  "&:hover": { bgcolor: "#059669" },
                                }}
                              >
                                Approve
                              </Button>
                            </Tooltip>
                          )}

                          <Tooltip title="View full details">
                            <IconButton
                              size="small"
                              onClick={() => setDetailsTarget(item)}
                              sx={{
                                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                                "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0" },
                              }}
                            >
                              <VisibilityOutlined fontSize="small" />
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

        {/* Pagination */}
        <TablePagination
          component="div"
          count={totalRecords}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={perPage}
          onRowsPerPageChange={(e) => {
            setPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          sx={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}` }}
        />
      </Paper>

      {/* ── Dialog: Manual Payment Verification Approval ────────────── */}
      <Dialog
        open={Boolean(verifyTarget)}
        onClose={() => !verifying && setVerifyTarget(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            p: 1,
            background: isDark ? colors.primary[400] : "#ffffff",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: "10px",
              bgcolor: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              display: "flex",
            }}
          >
            <VerifiedOutlined />
          </Box>
          Approve Subscription Payment
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" }}>
          {verifyTarget && (
            <Stack spacing={2}>
              <Alert severity="info" sx={{ borderRadius: "10px" }}>
                Approving this payment will mark the payment as <strong>Completed</strong>, activate the merchant's <strong>Subscription</strong>, and automatically upgrade their <strong>Shop Product Limit</strong> to match the package specifications.
              </Alert>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  bgcolor: isDark ? "rgba(0,0,0,0.2)" : "#f8fafc",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"}`,
                }}
              >
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Shop Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {verifyTarget.shop?.shop_name || verifyTarget.shop?.name || "Shop #" + verifyTarget.shop?.id}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Package
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#10b981" }}>
                      {verifyTarget.package?.name}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Amount
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {fmtMoney(verifyTarget.amount)}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      New Product Limit
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "#6366f1" }}>
                      {fmtNum(verifyTarget.package?.max_products)} Products
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Merchant TXN
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {verifyTarget.merchant_transaction_id || "—"}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Gateway TXN ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {verifyTarget.gateway_transaction_id || "—"}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setVerifyTarget(null)}
            disabled={verifying}
            sx={{ textTransform: "none", borderRadius: "8px" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmVerify}
            disabled={verifying}
            startIcon={verifying ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutline />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "8px",
              bgcolor: "#10b981",
              "&:hover": { bgcolor: "#059669" },
            }}
          >
            {verifying ? "Approving..." : "Confirm Approval"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Full Purchase Details ───────────────────────────── */}
      <Dialog
        open={Boolean(detailsTarget)}
        onClose={() => setDetailsTarget(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            p: 1,
            background: isDark ? colors.primary[400] : "#ffffff",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ReceiptLongOutlined color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Subscription Purchase Details
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setDetailsTarget(null)}>
            ×
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" }}>
          {detailsTarget && (
            <Stack spacing={2.5}>
              {/* Payment & Package Header Bar */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Package Name
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#10b981" }}>
                    {detailsTarget.package?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {fmtMoney(detailsTarget.amount)} • {detailsTarget.package?.billing_cycle?.toUpperCase()}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" color="text.secondary">
                    Payment Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={String(detailsTarget.payment_status).toUpperCase()}
                      size="small"
                      color={detailsTarget.payment_status === "completed" ? "success" : "warning"}
                      sx={{ fontWeight: 800 }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Shop & Merchant Info */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", color: "text.secondary" }}>
                Merchant & Store Profile
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Shop Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {detailsTarget.shop?.shop_name || detailsTarget.shop?.name}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Shop Code
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                      {detailsTarget.shop?.code || "—"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Owner Name
                    </Typography>
                    <Typography variant="body2">
                      {detailsTarget.shop?.owner?.name || "—"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Owner Contact
                    </Typography>
                    <Typography variant="body2">
                      {detailsTarget.shop?.owner?.phone || detailsTarget.shop?.phone || "—"} (
                      {detailsTarget.shop?.owner?.email || detailsTarget.shop?.email || "—"})
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Transaction & Timestamps */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", color: "text.secondary" }}>
                Transaction Identifiers & Validity
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Merchant Transaction ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#6366f1" }}>
                      {detailsTarget.merchant_transaction_id || "—"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Gateway Transaction ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                      {detailsTarget.gateway_transaction_id || "—"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Payment Gateway
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {detailsTarget.gateway ? detailsTarget.gateway.toUpperCase() : "MANUAL"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Max Products Limit
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {fmtNum(detailsTarget.package?.max_products)} Products
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Initiated At
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(detailsTarget.initiated_at || detailsTarget.created_at)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Paid At
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(detailsTarget.paid_at)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Subscription Start
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(detailsTarget.subscription?.starts_at)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Subscription End
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(detailsTarget.subscription?.ends_at)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setDetailsTarget(null)}
            sx={{ textTransform: "none", borderRadius: "8px" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar Feedback ───────────────────────────────────────── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "10px", fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SubscriptionReport;
