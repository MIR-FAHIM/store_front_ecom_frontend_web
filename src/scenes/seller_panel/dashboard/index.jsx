import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Chip,
  Button,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ShoppingCartOutlined,
  Inventory2Outlined,
  PaymentsOutlined,
  LocalShippingOutlined,
  AddOutlined,
  StorefrontOutlined,
  TrendingUpOutlined,
  ArrowForwardOutlined,
  ReceiptLongOutlined,
  PointOfSaleOutlined,
  WorkspacePremiumOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getShopReport, getShopMonthReport } from "../../../api/controller/admin_controller/report/report_controller";
import { getShopOrder } from "../../../api/controller/admin_controller/order/order_controller";
import { getAllShops } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";
import SubscriptionWidget from "../subscription/SubscriptionWidget";

const safeArray = (x) => (Array.isArray(x) ? x : []);

/* ── Design tokens ── */
const ACCENT = "#6366f1";
const GREEN = "#10b981";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const BLUE = "#3b82f6";
const PURPLE = "#8b5cf6";

const cardSx = (isDark) => ({
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: isDark ? "#161822" : "#fff",
  transition: "box-shadow .2s",
  "&:hover": { boxShadow: isDark ? "0 8px 32px rgba(0,0,0,.3)" : "0 8px 32px rgba(99,102,241,.08)" },
});

const ORDER_CHIP_COLORS = {
  pending:    { bg: "#fffbeb", color: AMBER },
  processing: { bg: "#eff6ff", color: BLUE },
  completed:  { bg: "#ecfdf5", color: GREEN },
  cancelled:  { bg: "#fef2f2", color: RED },
  delivered:  { bg: "#ecfdf5", color: GREEN },
  "new order": { bg: "#eff6ff", color: BLUE },
  "order received": { bg: "#fffbeb", color: AMBER },
  "on the way": { bg: "#f0f9ff", color: "#0ea5e9" },
};

const SellerDashboard = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [report, setReport] = useState({ shops_count: 0, orders_count: 0, orders_amount: 0, products_count: 0 });
  const [loadingReport, setLoadingReport] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingRecentOrders, setLoadingRecentOrders] = useState(false);
  const [monthReport, setMonthReport] = useState({ months: [] });
  const [loadingMonthReport, setLoadingMonthReport] = useState(false);
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState("");

  /* ── Data fetching ── */
  useEffect(() => {
    const loadShops = async () => {
      const uid = localStorage.getItem("userId");
      if (!uid) return;
      setLoadingShops(true);
      try {
        const res = await getAllShops({ user_id: uid, page: 1, per_page: 200 });
        const payload = res?.data ?? res;
        const list = safeArray(payload?.data ?? payload);
        setShops(list);
        if (list.length > 0 && !selectedShopId) setSelectedShopId(String(list[0]?.id ?? ""));
      } catch (error) { console.error("Failed to load shops", error); setShops([]); }
      finally { setLoadingShops(false); }
    };
    loadShops();
  }, []);

  useEffect(() => {
    const loadReport = async () => {
      setLoadingReport(true);
      try {
        const res = await getShopReport(userId);
        const data = res?.data ?? res?.data?.data ?? res ?? null;
        if (data && typeof data === "object") {
          setReport({ shops_count: Number(data?.shops_count ?? 0), orders_count: Number(data?.orders_count ?? 0), orders_amount: Number(data?.orders_amount ?? 0), products_count: Number(data?.products_count ?? 0) });
        }
      } catch (error) { console.error("Failed to load shop report", error); }
      finally { setLoadingReport(false); }
    };
    loadReport();
  }, [selectedShopId]);

  useEffect(() => {
    const loadRecentOrders = async () => {
      if (!userId) return;
      setLoadingRecentOrders(true);
      try {
        const res = await getShopOrder(userId, { page: 1, per_page: 5 });
        const pageData = res?.data ?? {};
        setRecentOrders(safeArray(pageData?.data));
      } catch (error) { console.error("Failed to load recent orders", error); setRecentOrders([]); }
      finally { setLoadingRecentOrders(false); }
    };
    loadRecentOrders();
  }, [selectedShopId]);

  useEffect(() => {
    const loadMonthReport = async () => {
      if (!selectedShopId) return;
      setLoadingMonthReport(true);
      try {
        const res = await getShopMonthReport(selectedShopId);
        const data = res?.data?.data ?? res?.data ?? res ?? null;
        setMonthReport({ months: safeArray(data?.months) });
      } catch (error) { console.error("Failed to load month report", error); setMonthReport({ months: [] }); }
      finally { setLoadingMonthReport(false); }
    };
    loadMonthReport();
  }, [selectedShopId]);

  /* ── Formatters ── */
  const formatCurrency = (amount) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(amount || 0);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" });
  const formatMonthLabel = (value) => {
    if (!value) return "-";
    const parts = String(value).split("-");
    if (parts.length < 2) return String(value);
    const monthIndex = Math.max(0, Math.min(11, Number(parts[1]) - 1));
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][monthIndex];
  };

  const stats = useMemo(() => [
    { label: "Revenue", value: formatCurrency(report.orders_amount), icon: <PaymentsOutlined />, color: ACCENT, bg: isDark ? "rgba(99,102,241,.1)" : "#eef2ff" },
    { label: "Orders", value: String(report.orders_count ?? 0), icon: <ShoppingCartOutlined />, color: BLUE, bg: isDark ? "rgba(59,130,246,.1)" : "#eff6ff" },
    { label: "Products", value: String(report.products_count ?? 0), icon: <Inventory2Outlined />, color: GREEN, bg: isDark ? "rgba(16,185,129,.1)" : "#ecfdf5" },
    { label: "Active Shops", value: String(report.shops_count ?? 0), icon: <StorefrontOutlined />, color: AMBER, bg: isDark ? "rgba(245,158,11,.1)" : "#fffbeb" },
  ], [report, isDark]);

  const maxMonthAmount = Math.max(1, ...monthReport.months.map((m) => Number(m?.amount ?? 0)));

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1280, mx: "auto" }}>

      {/* ─── Store onboarding header ─── */}
      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3, overflow: "hidden", border: "none", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 52%, #0f766e 100%)" }}>
        <CardContent sx={{ py: { xs: 3, md: 4 }, px: { xs: 2.5, md: 4 } }}>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: "#fff", letterSpacing: -0.5, mb: 0.5 }}>
                Start with your store package
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,.75)", maxWidth: 420 }}>
                Activate a subscription first, then publish products, take orders, use POS, and share your public storefront.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 170, "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "rgba(255,255,255,.15)", color: "#fff", "& fieldset": { borderColor: "rgba(255,255,255,.25)" } }, "& .MuiInputLabel-root": { color: "rgba(255,255,255,.7)" }, "& .MuiSelect-icon": { color: "#fff" } }}>
                <InputLabel>Shop</InputLabel>
                <Select label="Shop" value={selectedShopId} onChange={(e) => setSelectedShopId(String(e.target.value))} disabled={loadingShops || shops.length === 0}>
                  {shops.map((shop) => <MenuItem key={shop?.id} value={String(shop?.id ?? "")}>{shop?.name || `Shop ${shop?.id}`}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" startIcon={<AddOutlined />} onClick={() => navigate("/seller/add/product")}
                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700, bgcolor: "#fff", color: ACCENT, "&:hover": { bgcolor: "#f0f0ff" }, boxShadow: "0 4px 16px rgba(0,0,0,.15)" }}>
                New Product
              </Button>
              <Button variant="contained" startIcon={<WorkspacePremiumOutlined />} onClick={() => navigate("/seller/packages")}
                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 800, bgcolor: "#22c55e", color: "#fff", "&:hover": { bgcolor: "#16a34a" }, boxShadow: "0 4px 16px rgba(0,0,0,.15)" }}>
                Buy Package
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* ─── Subscription first ─── */}
      <SubscriptionWidget />

      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
        Store readiness after package activation
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card sx={cardSx(isDark)}>
              <CardContent sx={{ py: 2.5, px: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: s.bg, display: "grid", placeItems: "center", color: s.color }}>
                    {s.icon}
                  </Box>
                  {loadingReport && <LinearProgress sx={{ width: 40, borderRadius: 4, "& .MuiLinearProgress-bar": { bgcolor: s.color } }} />}
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5, mb: 0.2 }}>
                  {s.value}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, fontSize: 11 }}>
                  {s.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ─── Chart + Recent Orders row ─── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Monthly Sales Chart */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ ...cardSx(isDark), height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: isDark ? "rgba(99,102,241,.1)" : "#eef2ff", display: "grid", placeItems: "center", color: ACCENT }}>
                    <TrendingUpOutlined sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800}>Monthly Sales</Typography>
                    <Typography variant="caption" color="text.disabled">Revenue over the past months</Typography>
                  </Box>
                </Stack>
              </Stack>

              {loadingMonthReport ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <LinearProgress sx={{ maxWidth: 200, mx: "auto", borderRadius: 4 }} />
                </Box>
              ) : monthReport.months.length === 0 ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Typography variant="body2" color="text.disabled">No sales data yet</Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", gap: 0.8, alignItems: "end", height: 200, pt: 1 }}>
                  {monthReport.months.map((entry, i) => {
                    const amount = Number(entry?.amount ?? 0);
                    const pct = Math.max(5, (amount / maxMonthAmount) * 100);
                    return (
                      <Tooltip key={i} title={formatCurrency(amount)} arrow placement="top">
                        <Box sx={{ flex: 1, textAlign: "center", cursor: "pointer" }}>
                          <Box sx={{
                            height: `${pct}%`,
                            minHeight: 12,
                            borderRadius: "8px 8px 4px 4px",
                            background: `linear-gradient(180deg, ${ACCENT}, ${PURPLE})`,
                            opacity: 0.85,
                            transition: "opacity .2s, transform .2s",
                            "&:hover": { opacity: 1, transform: "scaleY(1.05)" },
                            transformOrigin: "bottom",
                          }} />
                          <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10, mt: 0.5, display: "block" }}>
                            {formatMonthLabel(entry?.month)}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ ...cardSx(isDark), height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: isDark ? "rgba(59,130,246,.1)" : "#eff6ff", display: "grid", placeItems: "center", color: BLUE }}>
                    <ReceiptLongOutlined sx={{ fontSize: 18 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={800}>Recent Orders</Typography>
                </Stack>
                <Button size="small" endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />} onClick={() => navigate("/seller/orders")}
                  sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, color: ACCENT }}>
                  View All
                </Button>
              </Stack>

              <Stack spacing={1}>
                {loadingRecentOrders ? (
                  <Box sx={{ py: 4, textAlign: "center" }}><LinearProgress sx={{ maxWidth: 160, mx: "auto", borderRadius: 4 }} /></Box>
                ) : recentOrders.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: "center" }}><Typography variant="body2" color="text.disabled">No orders yet</Typography></Box>
                ) : (
                  recentOrders.map((order) => {
                    const status = String(order?.status || "pending").toLowerCase();
                    const chipCfg = ORDER_CHIP_COLORS[status] || { bg: "#f1f5f9", color: "#64748b" };
                    return (
                      <Box
                        key={order?.id}
                        onClick={() => navigate(`/seller/orders/${order?.order?.id || order?.id}`)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          border: "1px solid",
                          borderColor: "divider",
                          cursor: "pointer",
                          transition: "all .15s",
                          "&:hover": { borderColor: ACCENT, bgcolor: isDark ? "rgba(99,102,241,.04)" : "#fafafe" },
                        }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {order?.order?.order_number || `#${order?.id ?? ""}`}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {order?.created_at ? formatDate(order.created_at) : "-"}
                            </Typography>
                          </Box>
                          <Stack alignItems="flex-end" spacing={0.3}>
                            <Typography variant="body2" fontWeight={800}>{formatCurrency(order?.line_total)}</Typography>
                            <Chip label={status} size="small" sx={{ height: 22, fontWeight: 700, fontSize: 10, bgcolor: isDark ? `${chipCfg.color}18` : chipCfg.bg, color: chipCfg.color, border: "1px solid", borderColor: `${chipCfg.color}30` }} />
                          </Stack>
                        </Stack>
                      </Box>
                    );
                  })
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ─── Quick Actions ─── */}
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>Quick Actions</Typography>
      <Grid container spacing={2}>
        {[
          { label: "Add Product", desc: "List a new product", icon: <AddOutlined />, color: ACCENT, bg: "#eef2ff", path: "/seller/add/product" },
          { label: "View Orders", desc: "Manage all orders", icon: <ShoppingCartOutlined />, color: BLUE, bg: "#eff6ff", path: "/seller/orders" },
          { label: "My Shops", desc: "Shop management", icon: <StorefrontOutlined />, color: GREEN, bg: "#ecfdf5", path: "/seller/shops" },
          { label: "POS Terminal", desc: "Point of sale", icon: <PointOfSaleOutlined />, color: PURPLE, bg: "#f5f3ff", path: "/seller/pos" },
          { label: "Bank Account", desc: "Payment setup", icon: <PaymentsOutlined />, color: AMBER, bg: "#fffbeb", path: "/seller/accounting" },
          { label: "Transactions", desc: "Settlement history", icon: <ReceiptLongOutlined />, color: RED, bg: "#fef2f2", path: "/seller/accounting/settled-amount-history" },
        ].map((a) => (
          <Grid item xs={6} sm={4} md={2} key={a.label}>
            <Card
              onClick={() => navigate(a.path)}
              sx={{
                ...cardSx(isDark),
                cursor: "pointer",
                textAlign: "center",
                "&:hover": { borderColor: a.color, boxShadow: `0 4px 20px ${a.color}18` },
              }}
            >
              <CardContent sx={{ py: 2.5, px: 1.5, "&:last-child": { pb: 2.5 } }}>
                <Avatar sx={{ width: 44, height: 44, bgcolor: isDark ? `${a.color}18` : a.bg, color: a.color, mx: "auto", mb: 1.5, borderRadius: 2.5 }}>
                  {a.icon}
                </Avatar>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.2 }}>{a.label}</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>{a.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SellerDashboard;
