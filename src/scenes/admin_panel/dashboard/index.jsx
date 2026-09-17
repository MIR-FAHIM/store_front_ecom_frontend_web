import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Stack,
  CircularProgress,
  useTheme,
  IconButton,
  Tooltip,
} from "@mui/material";

import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import RefreshIcon from "@mui/icons-material/Refresh";
import LanguageIcon from "@mui/icons-material/Language";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TouchAppIcon from "@mui/icons-material/TouchApp";

import { dashboardReport, getAdminMonthReport, getTodayReport } from "../../../api/controller/admin_controller/report/report_controller";
import { getOrder } from "../../../api/controller/admin_controller/order/order_controller";

import KpiCard from "./components/KpiCard";
import SalesChart from "./components/SalesChart";
import SalesDonut from "./components/SalesDonut";
import OrderStatusBoard from "./components/OrderStatusBoard";
import RecentOrdersTable from "./components/RecentOrdersTable";
import MiniBarChart from "./components/MiniBarChart";
import OnlinePaymentMiniRow from "./components/OnlinePaymentMiniRow";

const moneyBDT = (n) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number(n || 0));

function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [todayData, setTodayData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dashRes, monthRes, todayRes, orderRes] = await Promise.allSettled([
        dashboardReport(),
        getAdminMonthReport(),
        getTodayReport(),
        getOrder({ page: 1, per_page: 8 }),
      ]);

      if (dashRes.status === "fulfilled") {
        const d = dashRes.value;
        if (d?.status === "success" && d.data) setMetrics(d.data);
        else if (d?.data) setMetrics(d.data);
      }
      if (monthRes.status === "fulfilled") {
        const m = monthRes.value;
        const list = m?.data ?? m ?? [];
        setMonthlyData(Array.isArray(list) ? list : []);
      }
      if (todayRes.status === "fulfilled") {
        const t = todayRes.value;
        setTodayData(t?.data ?? t ?? null);
      }
      if (orderRes.status === "fulfilled") {
        const o = orderRes.value;
        const list = o?.data?.data ?? o?.data ?? o ?? [];
        setRecentOrders(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const topBrands = useMemo(
    () => (metrics?.top_brands ?? []).map((b) => ({ name: b.name, total: Number(b.total || 0) })),
    [metrics]
  );
  const topCategories = useMemo(
    () => (metrics?.top_categories ?? []).map((c) => ({ name: c.name, total: Number(c.total || 0) })),
    [metrics]
  );

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {greeting}, Admin
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600, mt: 0.3 }}>
              Here's what's happening with your store today.
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchAll} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={22} />
              <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>Loading dashboard...</Typography>
            </Stack>
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* ───── Row 1: Today Snapshot ───── */}
            {todayData && (
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={3} lg={1.71}>
                  <KpiCard
                    title="Today Orders"
                    value={todayData?.total_orders ?? 0}
                    icon={<ReceiptLongIcon />}
                    color="#6366f1"
                    bgColor="#eef2ff"
                    subtitle="today"
                  />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={1.71}>
                  <KpiCard
                    title="Today Revenue"
                    value={moneyBDT(todayData?.total_earn ?? todayData?.today_sales ?? todayData?.total_sell ?? 0)}
                    icon={<AttachMoneyIcon />}
                    color="#10b981"
                    bgColor="#ecfdf5"
                    subtitle="today"
                  />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={1.71}>
                  <KpiCard
                    title="Site Visitors"
                    value={todayData?.website_visitors ?? 0}
                    icon={<LanguageIcon />}
                    color="#0ea5e9"
                    bgColor="#e0f2fe"
                    subtitle="today"
                  />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={1.71}>
                  <KpiCard
                    title="Product Clicks"
                    value={todayData?.product_clicked ?? 0}
                    icon={<TouchAppIcon />}
                    color="#8b5cf6"
                    bgColor="#f3e8ff"
                    subtitle="today"
                  />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={1.71}>
                  <KpiCard
                    title="Cart Clicks"
                    value={todayData?.cart_clicked ?? 0}
                    icon={<ShoppingCartIcon />}
                    color="#f59e0b"
                    bgColor="#fffbeb"
                    subtitle="today"
                  />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={1.71}>
                  <KpiCard
                    title="New Customers"
                    value={todayData?.customer_onboard ?? 0}
                    icon={<PeopleAltIcon />}
                    color="#ec4899"
                    bgColor="#fdf2f8"
                    subtitle="today"
                  />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={1.71}>
                  <KpiCard
                    title="New Sellers"
                    value={todayData?.seller_onboard ?? 0}
                    icon={<StorefrontIcon />}
                    color="#14b8a6"
                    bgColor="#ccfbf1"
                    subtitle="today"
                  />
                </Grid>
              </Grid>
            )}

            {/* ───── Row 2: Main KPI Cards ───── */}
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} lg={2}>
                <KpiCard
                  title="Customers"
                  value={metrics?.customers_count ?? 0}
                  icon={<PeopleAltIcon />}
                  color="#3b82f6"
                  bgColor="#dbeafe"
                  onClick={() => navigate("/ecom/customer/all")}
                />
              </Grid>
              <Grid item xs={6} sm={4} lg={2}>
                <KpiCard
                  title="Products"
                  value={metrics?.products_count ?? 0}
                  icon={<Inventory2Icon />}
                  color="#10b981"
                  bgColor="#d1fae5"
                  subtitle={`${metrics?.inhouse_products_count ?? 0} inhouse · ${metrics?.seller_products_count ?? 0} seller`}
                  onClick={() => navigate("/ecom/product/all")}
                />
              </Grid>
              <Grid item xs={8} sm={6} lg={4}>
                <KpiCard
                  title="Total Sales"
                  value={moneyBDT(metrics?.total_sell ?? 0)}
                  icon={<AttachMoneyIcon />}
                  color="#8b5cf6"
                  bgColor="#ede9fe"
                />
              </Grid>
              <Grid item xs={6} sm={4} lg={2}>
                <KpiCard
                  title="Orders"
                  value={metrics?.orders_count ?? 0}
                  icon={<ReceiptLongIcon />}
                  color="#f59e0b"
                  bgColor="#fef3c7"
                  onClick={() => navigate("/ecom/order/all")}
                />
              </Grid>
            
              <Grid item xs={6} sm={4} lg={2}>
                <KpiCard
                  title="Sellers"
                  value={metrics?.shops_count ?? 0}
                  icon={<StorefrontIcon />}
                  color="#ef4444"
                  bgColor="#fee2e2"
                  subtitle={`${metrics?.approved_sellers_count ?? 0} approved · ${metrics?.pending_sellers_count ?? 0} pending`}
                  onClick={() => navigate("/ecom/seller/all")}
                />
              </Grid>
            </Grid>

            {/* ───── Online Payment Mini Full Row Section ───── */}
            <OnlinePaymentMiniRow />

            {/* ───── Row 3: Charts ───── */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <SalesChart monthlyData={monthlyData} />
              </Grid>
              <Grid item xs={12} md={4}>
                <SalesDonut
                  inhouse={Number(metrics?.inhouse_sell ?? 0)}
                  seller={Number(metrics?.seller_sell ?? 0)}
                />
              </Grid>
            </Grid>

            {/* ───── Row 4: Orders & Status ───── */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <RecentOrdersTable orders={recentOrders} />
              </Grid>
              <Grid item xs={12} md={4}>
                <OrderStatusBoard metrics={metrics} />
              </Grid>
            </Grid>

            {/* ───── Row 5: Top Categories & Brands ───── */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <MiniBarChart title="Top Categories" data={topCategories} valueKey="total" labelKey="name" />
              </Grid>
              <Grid item xs={12} md={4}>
                <MiniBarChart title="Top Brands" data={topBrands} valueKey="total" labelKey="name" />
              </Grid>
              <Grid item xs={12} md={4}>
                <KpiCard
                  title="Total Brands"
                  value={metrics?.brands_count ?? 0}
                  icon={<LocalOfferIcon />}
                  color="#14b8a6"
                  bgColor="#ccfbf1"
                />
              </Grid>
            </Grid>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

export default Dashboard;
