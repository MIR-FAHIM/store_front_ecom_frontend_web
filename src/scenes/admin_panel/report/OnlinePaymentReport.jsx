import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
} from "@mui/material";
import {
  AccountBalanceWalletOutlined,
  BarChartOutlined,
  CancelOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
  FilterAltOutlined,
  HourglassEmptyOutlined,
  Refresh,
  TrendingUpOutlined,
} from "@mui/icons-material";
import { tokens } from "../../../theme";
import { getOnlinePaymentReport } from "../../../api/controller/admin_controller/report/report_controller";

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────
const fmt = (n, decimals = 0) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(Number(n ?? 0));

const fmtNum = (n) => Number(n ?? 0).toLocaleString();

const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const PAYMENT_TYPES = [
  { value: "", label: "All Types" },
  { value: "store_order",          label: "Store Order" },
  { value: "store_subscription",   label: "Store Subscription" },
  { value: "media_resource_order", label: "Media Resource Order" },
];

const STATUS_COLOR = {
  success:   "success",
  successful:"success",
  failed:    "error",
  pending:   "warning",
  cancelled: "default",
};

const STATUS_LABEL = {
  success:   "Success",
  successful:"Success",
  failed:    "Failed",
  pending:   "Pending",
  cancelled: "Cancelled",
};

// ──────────────────────────────────────────────────────
// KPI Card
// ──────────────────────────────────────────────────────
const KpiCard = ({ icon, label, count, amount, color }) => (
  <Card
    sx={{
      borderRadius: "14px",
      border: `1px solid ${color}22`,
      background: `${color}0d`,
      height: "100%",
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
        <Box
          sx={{
            width: 42, height: 42, borderRadius: "10px",
            background: `${color}22`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
        </Box>
        <Typography variant="h5" fontWeight={800} sx={{ color }}>
          {fmtNum(count)}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" fontWeight={600}>{label}</Typography>
      <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{fmt(amount)}</Typography>
    </CardContent>
  </Card>
);

// ──────────────────────────────────────────────────────
// Breakdown type → display label
// ──────────────────────────────────────────────────────
const typeLabel = (t) =>
  t === "store_order"          ? "Store Order"
  : t === "store_subscription"   ? "Store Subscription"
  : t === "media_resource_order" ? "Media Resource"
  : (t ?? "—");

// ──────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────
const OnlinePaymentReport = () => {
  const theme  = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";

  // ── State ──
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Filters
  const [filters, setFilters] = useState({
    start_date:   firstOfMonth(),
    end_date:     today(),
    payment_type: "",
    store_id:     "",
    user_id:      "",
  });

  const setFilter = (key) => (e) =>
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));

  // ── Fetch ──
  const loadReport = useCallback(async (f = filters) => {
    setLoading(true);
    setError("");
    try {
      // Strip empty params
      const params = Object.fromEntries(
        Object.entries(f).filter(([, v]) => v !== "" && v != null)
      );
      const res = await getOnlinePaymentReport(params);
      if (res?.status === "success") {
        setReport(res.data ?? null);
      } else {
        setError(res?.message || "Failed to load payment report.");
        setReport(null);
      }
    } catch (err) {
      setError(err?.message || "Unexpected error.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReport(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived data ──
  const summary   = report?.summary   ?? {};
  const tod       = report?.today     ?? {};
  const month     = report?.this_month ?? {};
  const breakdown = report?.breakdown_by_type ?? [];

  const kpiCards = useMemo(() => [
    {
      icon: <AccountBalanceWalletOutlined />,
      label: "Total Payments",
      count:  summary.total_payments ?? 0,
      amount: summary.total_amount   ?? 0,
      color:  "#6366f1",
    },
    {
      icon: <CheckCircleOutlined />,
      label: "Successful",
      count:  summary.successful?.count  ?? 0,
      amount: summary.successful?.amount ?? 0,
      color:  "#10b981",
    },
    {
      icon: <HourglassEmptyOutlined />,
      label: "Pending",
      count:  summary.pending?.count  ?? 0,
      amount: summary.pending?.amount ?? 0,
      color:  "#f59e0b",
    },
    {
      icon: <ErrorOutlined />,
      label: "Failed",
      count:  summary.failed?.count  ?? 0,
      amount: summary.failed?.amount ?? 0,
      color:  "#ef4444",
    },
    {
      icon: <CancelOutlined />,
      label: "Cancelled",
      count:  summary.cancelled?.count  ?? 0,
      amount: summary.cancelled?.amount ?? 0,
      color:  "#94a3b8",
    },
    {
      icon: <TrendingUpOutlined />,
      label: "Today (Successful)",
      count:  tod.successful_count  ?? 0,
      amount: tod.successful_amount ?? 0,
      color:  "#0ea5e9",
    },
  ], [summary, tod]);

  // ──────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <AccountBalanceWalletOutlined sx={{ fontSize: 30, color: "primary.main" }} />
            <Typography variant="h4" fontWeight={800}>Online Payment Report</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gateway transaction summary with status breakdown by type.
          </Typography>
        </Box>
        <Tooltip title="Reload">
          <span>
            <IconButton onClick={() => loadReport(filters)} disabled={loading}>
              <Refresh />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* ── Filter Bar ── */}
      <Card sx={{ borderRadius: "14px", mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <FilterAltOutlined fontSize="small" color="action" />
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
              FILTERS
            </Typography>
          </Box>
          <Grid container spacing={2} alignItems="flex-end">
            {/* Start date */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Start Date"
                type="date"
                size="small"
                fullWidth
                value={filters.start_date}
                onChange={setFilter("start_date")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* End date */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="End Date"
                type="date"
                size="small"
                fullWidth
                value={filters.end_date}
                onChange={setFilter("end_date")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Payment type */}
            <Grid item xs={12} sm={6} md={2.5}>
              <FormControl size="small" fullWidth>
                <InputLabel>Payment Type</InputLabel>
                <Select
                  label="Payment Type"
                  value={filters.payment_type}
                  onChange={setFilter("payment_type")}
                >
                  {PAYMENT_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Store ID */}
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField
                label="Store ID"
                type="number"
                size="small"
                fullWidth
                value={filters.store_id}
                onChange={setFilter("store_id")}
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* User ID */}
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField
                label="User ID"
                type="number"
                size="small"
                fullWidth
                value={filters.user_id}
                onChange={setFilter("user_id")}
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* Buttons */}
            <Grid item xs={12} sm={6} md={2.5}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Box
                  component="button"
                  onClick={() => loadReport(filters)}
                  disabled={loading}
                  sx={{
                    flex: 1, height: 37, px: 2, borderRadius: "8px",
                    background: "primary.main",
                    backgroundColor: "#6366f1",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    "&:hover": { backgroundColor: "#4f46e5" },
                    transition: "background-color 0.2s",
                  }}
                >
                  {loading ? "Loading…" : "Apply"}
                </Box>
                <Box
                  component="button"
                  onClick={() => {
                    const reset = { start_date: firstOfMonth(), end_date: today(), payment_type: "", store_id: "", user_id: "" };
                    setFilters(reset);
                    loadReport(reset);
                  }}
                  sx={{
                    height: 37, px: 2, borderRadius: "8px",
                    background: "transparent",
                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                    color: "inherit",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    "&:hover": { borderColor: "#6366f1" },
                    transition: "border-color 0.2s",
                  }}
                >
                  Reset
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Loading ── */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: "10px", mb: 3 }}>{error}</Alert>
      )}

      {/* ── Content ── */}
      {!loading && !error && report && (
        <Stack spacing={3}>
          {/* ── KPI Cards ── */}
          <Grid container spacing={2}>
            {kpiCards.map((card) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={card.label}>
                <KpiCard {...card} />
              </Grid>
            ))}
          </Grid>

          {/* ── This-Month Banner ── */}
          <Card
            sx={{
              borderRadius: "14px",
              background: isDark
                ? "linear-gradient(135deg,#1e293b 0%,#0f172a 100%)"
                : "linear-gradient(135deg,#eef2ff 0%,#f0fdf4 100%)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <BarChartOutlined sx={{ color: "#6366f1" }} />
                <Typography variant="h6" fontWeight={800}>This Month</Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    SUCCESSFUL TRANSACTIONS
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color: "#10b981", mt: 0.5 }}>
                    {fmtNum(month.successful_count ?? 0)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    SUCCESSFUL AMOUNT
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color: "#6366f1", mt: 0.5 }}>
                    {fmt(month.successful_amount ?? 0, 2)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ── Breakdown by Type ── */}
          {breakdown.length > 0 && (
            <Card sx={{ borderRadius: "14px" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                  Breakdown by Payment Type
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <TableContainer
                  component={Paper}
                  sx={{
                    background: colors.primary[400],
                    borderRadius: "10px",
                    border: `1px solid ${colors.primary[500]}`,
                    overflow: "hidden",
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {["Payment Type", "Status", "Count", "Total Amount"].map((h) => (
                          <TableCell
                            key={h}
                            align={h === "Count" || h === "Total Amount" ? "right" : "left"}
                            sx={{
                              fontWeight: 800,
                              fontSize: 12,
                              backgroundColor: colors.primary[500],
                              borderBottom: `1px solid ${colors.primary[300]}`,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {breakdown.map((row, idx) => {
                        const statusKey = String(row.status ?? "").toLowerCase();
                        return (
                          <TableRow
                            key={idx}
                            sx={{
                              "& td": { borderBottom: `1px solid ${colors.primary[300]}` },
                              backgroundColor: idx % 2 === 0 ? "transparent" : colors.primary[300],
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>
                              {typeLabel(row.payment_type)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={STATUS_LABEL[statusKey] ?? row.status}
                                size="small"
                                color={STATUS_COLOR[statusKey] ?? "default"}
                                variant="outlined"
                                sx={{ fontSize: 11, fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {fmtNum(row.count)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {fmt(row.total_amount, 2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Totals row */}
                      <TableRow sx={{ backgroundColor: colors.primary[300] }}>
                        <TableCell colSpan={2} sx={{ fontWeight: 800, fontSize: 13 }}>
                          TOTAL
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          {fmtNum(breakdown.reduce((s, r) => s + Number(r.count ?? 0), 0))}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#6366f1" }}>
                          {fmt(breakdown.reduce((s, r) => s + Number(r.total_amount ?? 0), 0), 2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* ── Status Summary Table ── */}
          <Card sx={{ borderRadius: "14px" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Status Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                {[
                  { key: "successful", label: "Successful", color: "#10b981" },
                  { key: "pending",    label: "Pending",    color: "#f59e0b" },
                  { key: "failed",     label: "Failed",     color: "#ef4444" },
                  { key: "cancelled",  label: "Cancelled",  color: "#94a3b8" },
                ].map(({ key, label, color }) => {
                  const d    = summary[key] ?? {};
                  const cnt  = Number(d.count ?? 0);
                  const amt  = Number(d.amount ?? 0);
                  const tot  = Number(summary.total_payments ?? 1);
                  const pct  = tot ? ((cnt / tot) * 100).toFixed(1) : "0.0";

                  return (
                    <Grid item xs={12} sm={6} md={3} key={key}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: "10px",
                          border: `1px solid ${color}33`,
                          background: `${color}0a`,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>{label}</Typography>
                        <Typography variant="h5" fontWeight={800} sx={{ color, my: 0.5 }}>
                          {fmtNum(cnt)}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>{fmt(amt, 2)}</Typography>
                        <Typography variant="caption" color="text.disabled">{pct}% of total</Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && !report && (
        <Box
          sx={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", py: 12, gap: 2,
          }}
        >
          <AccountBalanceWalletOutlined sx={{ fontSize: 64, color: "text.disabled" }} />
          <Typography variant="h6" color="text.secondary">No payment data found</Typography>
          <Typography variant="body2" color="text.disabled">
            Try adjusting the date range or removing filters.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default OnlinePaymentReport;
