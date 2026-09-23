import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
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
  ChatOutlined,
  ForumOutlined,
  QuestionAnswerOutlined,
  StorefrontOutlined,
  PeopleAltOutlined,
  TrendingUpOutlined,
  TodayOutlined,
  DateRangeOutlined,
  FilterAltOutlined,
  Refresh,
  ContentCopyOutlined,
  MarkChatUnreadOutlined,
  PersonOutline,
  StoreOutlined,
} from "@mui/icons-material";
import { ResponsiveBar } from "@nivo/bar";
import { tokens } from "../../../theme";
import { getChatAdminReport } from "../../../api/controller/admin_controller/report/report_controller";
import { getAllShops } from "../../../api/controller/admin_controller/shop/shop_controller";

// ─────────────────────────────────────────────────────────────
// Format Helpers
// ─────────────────────────────────────────────────────────────
const fmtNum = (n) => Number(n ?? 0).toLocaleString();

const PERIOD_OPTIONS = [
  { value: "last_7_days",  label: "Last 7 Days (Default)" },
  { value: "today",        label: "Today" },
  { value: "yesterday",    label: "Yesterday" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_month",   label: "This Month" },
  { value: "custom",       label: "Custom Range" },
];

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
};

// ─────────────────────────────────────────────────────────────
// KPI Metric Card
// ─────────────────────────────────────────────────────────────
const MetricCard = ({ title, value, subtitle, icon: Icon, color = "#6366f1", progressVal = null, progressColor = "#6366f1" }) => {
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
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: isDark ? "#f8fafc" : "#0f172a" }}>
              {fmtNum(value)}
            </Typography>
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
            <Icon sx={{ fontSize: 24 }} />
          </Box>
        </Box>

        {progressVal !== null && (
          <Box sx={{ mt: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Distribution
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: progressColor }}>
                {progressVal}%
              </Typography>
            </Box>
            <Box sx={{ width: "100%", height: 6, borderRadius: 3, bgcolor: `${color}22`, overflow: "hidden" }}>
              <Box sx={{ width: `${Math.min(Math.max(progressVal, 0), 100)}%`, height: "100%", bgcolor: progressColor, borderRadius: 3, transition: "width 0.4s ease" }} />
            </Box>
          </Box>
        )}

        {subtitle && (
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 1, display: "block" }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────
// Main ChatReport Component
// ─────────────────────────────────────────────────────────────
const ChatReport = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";

  // Filters State
  const [period, setPeriod] = useState("last_7_days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [shopId, setShopId] = useState("");

  // Data & Control State
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [chartMode, setChartMode] = useState("breakdown"); // 'breakdown' | 'total' | 'inboxes'

  // Shops list for filtering
  const [shopsList, setShopsList] = useState([]);
  const [loadingShops, setLoadingShops] = useState(false);

  // Load shops list for selector
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoadingShops(true);
        const res = await getAllShops();
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setShopsList(data);
      } catch (err) {
        console.error("Failed to load shops for filter:", err);
      } finally {
        setLoadingShops(false);
      }
    };
    fetchShops();
  }, []);

  // Fetch Chat Report
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const params = {};
      if (period) params.period = period;
      if (period === "custom") {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }
      if (shopId) params.shop_id = shopId;

      const res = await getChatAdminReport(params);

      if (res?.status === "success" && res?.data) {
        setReportData(res.data);
      } else if (res?.data) {
        setReportData(res.data);
      } else {
        setErrorMessage(res?.message || "Failed to load chat report data");
      }
    } catch (err) {
      console.error("Chat report error:", err);
      setErrorMessage(err?.message || "An error occurred while fetching chat report");
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate, shopId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Extract nested objects safely
  const overviewTotals = reportData?.overview_totals || {};
  const todaySummary   = reportData?.today_summary || {};
  const periodSummary  = reportData?.period_summary || {};
  const dailyBreakdown = Array.isArray(reportData?.daily_breakdown) ? reportData.daily_breakdown : [];
  const topActiveShops = Array.isArray(reportData?.top_active_shops) ? reportData.top_active_shops : [];

  // Selected shop object if filtered
  const selectedShopObj = useMemo(() => {
    if (!shopId) return null;
    return shopsList.find((s) => String(s.id) === String(shopId) || String(s.shop_id) === String(shopId));
  }, [shopId, shopsList]);

  // Calculated Percentages for Period
  const totalPeriodMsgs = Number(periodSummary?.total_messages_in_period || 0);
  const custPeriodMsgs  = Number(periodSummary?.customer_messages_in_period || 0);
  const shopPeriodMsgs  = Number(periodSummary?.shop_messages_in_period || 0);
  const custPct = totalPeriodMsgs > 0 ? Math.round((custPeriodMsgs / totalPeriodMsgs) * 100) : 50;
  const shopPct = totalPeriodMsgs > 0 ? Math.round((shopPeriodMsgs / totalPeriodMsgs) * 100) : 50;

  // Chart Data Preparation
  const chartData = useMemo(() => {
    return dailyBreakdown.map((day) => {
      const shortDate = day.date ? day.date.slice(5) : ""; // MM-DD
      return {
        date: shortDate,
        fullDate: day.date,
        "Customer Messages": Number(day.customer_messages || 0),
        "Shop Messages": Number(day.shop_messages || 0),
        "Total Messages": Number(day.total_messages || 0),
        "Inboxes Opened": Number(day.inboxes_opened || 0),
      };
    });
  }, [dailyBreakdown]);

  // Chart Keys & Colors based on mode
  const chartConfig = useMemo(() => {
    if (chartMode === "breakdown") {
      return {
        keys: ["Customer Messages", "Shop Messages"],
        colors: ["#3b82f6", "#10b981"],
      };
    }
    if (chartMode === "total") {
      return {
        keys: ["Total Messages"],
        colors: ["#6366f1"],
      };
    }
    return {
      keys: ["Inboxes Opened"],
      colors: ["#f59e0b"],
    };
  }, [chartMode]);

  // Copy Summary or Payload
  const handleCopyPayload = () => {
    if (!reportData) return;
    navigator.clipboard.writeText(JSON.stringify(reportData, null, 2));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
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
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              }}
            >
              <ForumOutlined />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Chat Volume & Activity Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Admin overview of customer–seller messaging activity, inboxes opened, and shop engagement.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Action Controls */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyOutlined />}
            onClick={handleCopyPayload}
            disabled={!reportData}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: "8px" }}
          >
            {copyFeedback ? "Copied JSON!" : "Copy Payload"}
          </Button>

          <Tooltip title="Refresh report">
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

      {/* ── Filters Card ────────────────────────────────────────────── */}
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
          {/* Period Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="chat-period-label">Time Period</InputLabel>
              <Select
                labelId="chat-period-label"
                value={period}
                label="Time Period"
                onChange={(e) => setPeriod(e.target.value)}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Custom Date Ranges */}
          {period === "custom" && (
            <>
              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}

          {/* Shop Filter */}
          <Grid item xs={12} sm={6} md={period === "custom" ? 4 : 4}>
            <FormControl fullWidth size="small">
              <InputLabel id="chat-shop-label">Shop Filter</InputLabel>
              <Select
                labelId="chat-shop-label"
                value={shopId}
                label="Shop Filter"
                onChange={(e) => setShopId(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Shops (Global Platform)</em>
                </MenuItem>
                {shopsList.map((shop) => (
                  <MenuItem key={shop.id || shop.shop_id} value={shop.id || shop.shop_id}>
                    {shop.name || shop.shop_name} {shop.code || shop.shop_code ? `(#${shop.code || shop.shop_code})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filter Status Badge / Reset */}
          <Grid item xs={12} sm={6} md={period === "custom" ? 12 : 5}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {reportData?.from && reportData?.to && (
                <Chip
                  icon={<DateRangeOutlined fontSize="small" />}
                  label={`Range: ${formatDateDisplay(reportData.from)} – ${formatDateDisplay(reportData.to)}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
              {selectedShopObj && (
                <Chip
                  icon={<StorefrontOutlined fontSize="small" />}
                  label={`Filtered: ${selectedShopObj.name || selectedShopObj.shop_name}`}
                  size="small"
                  color="secondary"
                  onDelete={() => setShopId("")}
                />
              )}
              {(period !== "last_7_days" || shopId) && (
                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  onClick={() => {
                    setPeriod("last_7_days");
                    setShopId("");
                    setStartDate("");
                    setEndDate("");
                  }}
                  sx={{ textTransform: "none", fontSize: "0.78rem" }}
                >
                  Reset Filters
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      {/* Loading State */}
      {loading && !reportData ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
          <CircularProgress size={44} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 600 }}>
            Fetching chat activity metrics...
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {/* ── SECTION 1: TODAY'S LIVE PULSE & REALTIME SUMMARY ── */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "16px",
              background: isDark
                ? "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)"
                : "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
              border: `1px solid ${isDark ? "rgba(99, 102, 241, 0.25)" : "#bbf7d0"}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: "#22c55e",
                    boxShadow: "0 0 10px #22c55e",
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Today's Live Snapshot
                </Typography>
              </Stack>
              <Chip
                label="Real-Time Pulse"
                size="small"
                sx={{
                  bgcolor: isDark ? "rgba(34, 197, 94, 0.15)" : "#dcfce7",
                  color: isDark ? "#4ade80" : "#166534",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} md={2.4}>
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.7)" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Today Messages
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "#3b82f6" }}>
                    {fmtNum(todaySummary?.today_total_messages)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={4} md={2.4}>
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.7)" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Inboxes Opened Today
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "#10b981" }}>
                    {fmtNum(todaySummary?.today_inboxes_opened)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={4} md={2.4}>
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.7)" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Customer Messages
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "#0ea5e9" }}>
                    {fmtNum(todaySummary?.today_customer_messages)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={4} md={2.4}>
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.7)" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Shop Messages
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "#8b5cf6" }}>
                    {fmtNum(todaySummary?.today_shop_messages)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={4} md={2.4}>
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.7)" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Active Conversations
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: "#f59e0b" }}>
                    {fmtNum(todaySummary?.today_active_conversations)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* ── SECTION 2: SELECTED PERIOD SUMMARY (KPIs) ── */}
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
                SELECTED PERIOD METRICS ({period.toUpperCase().replace(/_/g, " ")})
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Period Messages"
                  value={periodSummary?.total_messages_in_period}
                  subtitle="Total messages exchanged in this period"
                  icon={MarkChatUnreadOutlined}
                  color="#6366f1"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Customer Messages"
                  value={periodSummary?.customer_messages_in_period}
                  subtitle={`${custPct}% of period messages`}
                  icon={PersonOutline}
                  color="#3b82f6"
                  progressVal={custPct}
                  progressColor="#3b82f6"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Shop Messages"
                  value={periodSummary?.shop_messages_in_period}
                  subtitle={`${shopPct}% of period messages`}
                  icon={StoreOutlined}
                  color="#10b981"
                  progressVal={shopPct}
                  progressColor="#10b981"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Inboxes Opened"
                  value={periodSummary?.inboxes_opened_in_period}
                  subtitle={`Active: ${fmtNum(periodSummary?.active_conversations_in_period)} conversations`}
                  icon={QuestionAnswerOutlined}
                  color="#f59e0b"
                />
              </Grid>
            </Grid>
          </Box>

          {/* ── SECTION 3: ALL-TIME OVERVIEW TOTALS ── */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
              background: isDark ? colors.primary[400] : "#ffffff",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", mb: 2, textTransform: "uppercase" }}>
              All-Time Platform Chat Totals
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ borderLeft: "3px solid #6366f1", pl: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total All-Time Messages
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {fmtNum(overviewTotals?.total_messages_all_time)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ borderLeft: "3px solid #f59e0b", pl: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Inboxes Created
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {fmtNum(overviewTotals?.total_inboxes_all_time)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ borderLeft: "3px solid #10b981", pl: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Shops with Chats
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {fmtNum(overviewTotals?.total_shops_with_chats)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ borderLeft: "3px solid #3b82f6", pl: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Customers with Chats
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {fmtNum(overviewTotals?.total_customers_with_chats)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* ── SECTION 4: INTERACTIVE DAILY VOLUME CHART ── */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
              background: isDark ? colors.primary[400] : "#ffffff",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Daily Chat Timeline Breakdown
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Volume progression across the selected date range
                </Typography>
              </Box>

              <ButtonGroup size="small" variant="outlined" sx={{ borderRadius: "8px" }}>
                <Button
                  variant={chartMode === "breakdown" ? "contained" : "outlined"}
                  onClick={() => setChartMode("breakdown")}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Customer vs Shop
                </Button>
                <Button
                  variant={chartMode === "total" ? "contained" : "outlined"}
                  onClick={() => setChartMode("total")}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Total Volume
                </Button>
                <Button
                  variant={chartMode === "inboxes" ? "contained" : "outlined"}
                  onClick={() => setChartMode("inboxes")}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Inboxes Opened
                </Button>
              </ButtonGroup>
            </Box>

            {chartData.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No daily chat activity records found for this period.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ height: 340, width: "100%", mt: 1 }}>
                <ResponsiveBar
                  data={chartData}
                  keys={chartConfig.keys}
                  indexBy="date"
                  margin={{ top: 20, right: 20, bottom: 45, left: 50 }}
                  padding={0.35}
                  valueScale={{ type: "linear" }}
                  indexScale={{ type: "band", round: true }}
                  colors={chartConfig.colors}
                  borderRadius={4}
                  borderColor={{ from: "color", modifiers: [["darker", 1.2]] }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 6,
                    tickRotation: chartData.length > 14 ? -45 : 0,
                    legend: "Date",
                    legendPosition: "middle",
                    legendOffset: 36,
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Count",
                    legendPosition: "middle",
                    legendOffset: -40,
                  }}
                  enableLabel={chartData.length <= 14}
                  labelTextColor="#ffffff"
                  labelSkipHeight={12}
                  theme={{
                    axis: {
                      ticks: {
                        text: {
                          fill: isDark ? colors.gray[200] : colors.gray[800],
                          fontSize: 11,
                        },
                      },
                      legend: {
                        text: {
                          fill: isDark ? colors.gray[200] : colors.gray[800],
                          fontWeight: 700,
                          fontSize: 12,
                        },
                      },
                    },
                    grid: {
                      line: {
                        stroke: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                      },
                    },
                    tooltip: {
                      container: {
                        background: isDark ? "#1e293b" : "#ffffff",
                        color: isDark ? "#f8fafc" : "#0f172a",
                        fontSize: 12,
                        borderRadius: "8px",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                      },
                    },
                  }}
                  legends={[
                    {
                      dataFrom: "keys",
                      anchor: "top-right",
                      direction: "row",
                      justify: false,
                      translateX: 0,
                      translateY: -18,
                      itemsSpacing: 8,
                      itemWidth: 140,
                      itemHeight: 20,
                      itemDirection: "left-to-right",
                      itemOpacity: 0.85,
                      symbolSize: 12,
                      symbolShape: "circle",
                      itemTextColor: isDark ? colors.gray[100] : colors.gray[900],
                    },
                  ]}
                />
              </Box>
            )}
          </Paper>

          {/* ── SECTION 5: TOP ACTIVE SHOPS & DAILY TABLE ── */}
          <Grid container spacing={3}>
            {/* Top Active Shops Leaderboard */}
            <Grid item xs={12} lg={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                  background: isDark ? colors.primary[400] : "#ffffff",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Top Active Shops in Chat
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ranked by total messages exchanged in this period
                    </Typography>
                  </Box>
                  <Chip label={`${topActiveShops.length} Active Shops`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                </Box>

                <TableContainer sx={{ flex: 1, maxHeight: 420 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Shop</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Inboxes</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Messages</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Cust vs Shop</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topActiveShops.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                            No active shop chats recorded in this period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        topActiveShops.map((shop, idx) => {
                          const sTotal = Number(shop.total_messages || 0);
                          const sCust  = Number(shop.customer_messages || 0);
                          const sShop  = Number(shop.shop_messages || 0);
                          const sCustPct = sTotal > 0 ? Math.round((sCust / sTotal) * 100) : 50;

                          return (
                            <TableRow key={shop.shop_id || idx} hover>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Chip
                                    label={`#${idx + 1}`}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: "0.7rem",
                                      fontWeight: 800,
                                      bgcolor: idx === 0 ? "#fbbf24" : idx === 1 ? "#94a3b8" : idx === 2 ? "#d97706" : "transparent",
                                      color: idx < 3 ? "#000000" : "inherit",
                                    }}
                                  />
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                      {shop.shop_name}
                                    </Typography>
                                    {shop.shop_code && (
                                      <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                                        Code: {shop.shop_code}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label={fmtNum(shop.inboxes_count)} size="small" sx={{ fontWeight: 700, height: 22 }} />
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2" sx={{ fontWeight: 800, color: "#6366f1" }}>
                                  {fmtNum(sTotal)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title={`Customer: ${sCust} (${sCustPct}%) | Shop: ${sShop} (${100 - sCustPct}%)`}>
                                  <Box sx={{ width: 80, mx: "auto" }}>
                                    <Box sx={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden" }}>
                                      <Box sx={{ width: `${sCustPct}%`, bgcolor: "#3b82f6" }} />
                                      <Box sx={{ width: `${100 - sCustPct}%`, bgcolor: "#10b981" }} />
                                    </Box>
                                    <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "text.secondary" }}>
                                      {sCust} / {sShop}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setShopId(String(shop.shop_id))}
                                  sx={{ textTransform: "none", fontSize: "0.72rem", py: 0.2, px: 1 }}
                                >
                                  Filter
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Daily Breakdown Table */}
            <Grid item xs={12} lg={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                  background: isDark ? colors.primary[400] : "#ffffff",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Daily Activity Log
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Day-by-day inboxes and message count distribution
                    </Typography>
                  </Box>
                  <Chip label={`${dailyBreakdown.length} Days`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                </Box>

                <TableContainer sx={{ flex: 1, maxHeight: 420 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Inboxes</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Customer Msgs</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Shop Msgs</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total Msgs</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dailyBreakdown.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                            No daily breakdown data available.
                          </TableCell>
                        </TableRow>
                      ) : (
                        dailyBreakdown.map((row, idx) => (
                          <TableRow key={row.date || idx} hover>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {row.date}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={fmtNum(row.inboxes_opened)}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontWeight: 700,
                                  bgcolor: Number(row.inboxes_opened) > 0 ? (isDark ? "rgba(245, 158, 11, 0.2)" : "#fef3c7") : "transparent",
                                  color: Number(row.inboxes_opened) > 0 ? "#f59e0b" : "text.secondary",
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "#3b82f6" }}>
                                {fmtNum(row.customer_messages)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "#10b981" }}>
                                {fmtNum(row.shop_messages)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                {fmtNum(row.total_messages)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  );
};

export default ChatReport;
