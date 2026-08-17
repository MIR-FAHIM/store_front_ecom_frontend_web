import React, { useEffect, useMemo, useState } from "react";
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
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import { getAllShops } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";
import {
  getStoreSubscription,
  getSubscriptionPackages,
  subscribeStorePackage,
} from "../../../api/controller/admin_controller/subscription_package/subscription_package_controller";

const statusColor = (status) => {
  const value = String(status || "").toLowerCase();
  if (["active", "paid"].includes(value)) return "success";
  if (["pending", "unpaid"].includes(value)) return "warning";
  if (["failed"].includes(value)) return "error";
  if (["cancelled", "expired"].includes(value)) return "default";
  return "default";
};

const formatMoney = (pkg) =>
  `${pkg?.currency || "BDT"} ${Number(pkg?.price || 0).toLocaleString("en-BD")}`;

const formatLimit = (value, suffix) => {
  if (value === null || value === undefined || value === "") return `Unlimited ${suffix}`;
  return `${Number(value).toLocaleString("en-BD")} ${suffix}`;
};

const MerchantPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [storeId, setStoreId] = useState(localStorage.getItem("storeId") || localStorage.getItem("shopId") || "");
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subscribingId, setSubscribingId] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const selectedStore = useMemo(() => shops.find((shop) => String(shop?.id) === String(storeId)), [shops, storeId]);

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      try {
        const [packageRes, shopRes] = await Promise.all([
          getSubscriptionPackages({ status: "active", all: 1 }),
          localStorage.getItem("userId")
            ? getAllShops({ user_id: localStorage.getItem("userId"), page: 1, per_page: 200 })
            : Promise.resolve({ data: { data: [] } }),
        ]);
        const packagePayload = packageRes?.data || {};
        const packageList = Array.isArray(packagePayload?.data)
          ? packagePayload.data
          : Array.isArray(packageRes?.data)
            ? packageRes.data
            : [];
        const shopList = Array.isArray(shopRes?.data?.data) ? shopRes.data.data : [];
        setPackages(packageList);
        setShops(shopList);
        if (!storeId && shopList.length) setStoreId(String(shopList[0].id));
      } catch (error) {
        setSnack({ open: true, message: error?.response?.data?.message || "Package list fetch failed", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!storeId) {
        setSubscription(null);
        return;
      }
      localStorage.setItem("storeId", String(storeId));
      setSubLoading(true);
      try {
        const response = await getStoreSubscription(storeId);
        setSubscription(response?.data?.subscription || response?.data || response?.subscription || null);
      } catch {
        setSubscription(null);
      } finally {
        setSubLoading(false);
      }
    };
    loadSubscription();
  }, [storeId]);

  const handleSubscribe = async (pkg) => {
    if (!storeId) {
      setSnack({ open: true, message: "Please create or select a store first.", severity: "warning" });
      return;
    }
    setSubscribingId(pkg.id);
    try {
      const response = await subscribeStorePackage(storeId, {
        subscription_package_id: pkg.id,
        billing_cycle: pkg.billing_cycle || "monthly",
      });
      const data = response?.data || response;
      if (data?.payment_required) {
        if (data?.payment_url) {
          sessionStorage.setItem(
            "aamarpay_pending_subscription",
            JSON.stringify({
              storeId,
              packageId: pkg.id,
              billingCycle: pkg.billing_cycle || "monthly",
              paymentId: data.payment_id,
              merchantTransactionId: data.merchant_transaction_id,
              amount: data.amount,
            })
          );
          window.location.href = data.payment_url;
          return;
        }
        setSnack({ open: true, message: response?.message || "Payment URL missing. Please try again.", severity: "warning" });
      } else {
        setSnack({ open: true, message: response?.message || "Subscription activated successfully.", severity: "success" });
      }
      const subRes = await getStoreSubscription(storeId);
      setSubscription(subRes?.data?.subscription || subRes?.data || subRes?.subscription || null);
      window.dispatchEvent(new Event("subscription-updated"));
    } catch (error) {
      setSnack({ open: true, message: error?.response?.data?.message || "Subscription failed", severity: "error" });
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1280, mx: "auto" }}>
      <Card sx={{ borderRadius: 4, mb: 3, overflow: "hidden", background: "linear-gradient(135deg, #312e81 0%, #4f46e5 52%, #0f766e 100%)" }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Chip label="Store SaaS Packages" sx={{ bgcolor: "rgba(255,255,255,.16)", color: "#fff", fontWeight: 800, mb: 1.5 }} />
              <Typography variant="h4" sx={{ color: "#fff", fontWeight: 950, letterSpacing: -0.5 }}>Choose a package for your store</Typography>
              <Typography sx={{ color: "rgba(255,255,255,.75)", maxWidth: 620, mt: 1 }}>
                Activate storefront tools, product management, order handling, pickup settings, reports, and growth features from one package.
              </Typography>
            </Box>
            <TextField
              select
              size="small"
              label="Store"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              sx={{
                minWidth: { xs: "100%", md: 260 },
                "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 2 },
                "& .MuiInputLabel-root": { color: "#334155" },
              }}
            >
              {shops.map((shop) => <MenuItem key={shop.id} value={String(shop.id)}>{shop.name || shop.shop_name || `Store ${shop.id}`}</MenuItem>)}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: "#eef2ff", color: "#4f46e5", display: "grid", placeItems: "center" }}>
                <StorefrontOutlinedIcon />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 900 }}>{selectedStore?.name || selectedStore?.shop_name || "Selected Store"}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Current package: {subLoading ? "Loading..." : subscription?.package?.name || "No package selected"}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {subscription?.status && <Chip label={subscription.status} color={statusColor(subscription.status)} variant="outlined" />}
              {subscription?.payment_status && <Chip label={subscription.payment_status} color={statusColor(subscription.payment_status)} variant="outlined" />}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      ) : packages.length ? (
        <Grid container spacing={2.5} alignItems="stretch">
          {packages.map((pkg) => {
            const popular = Boolean(pkg.is_popular);
            const featured = Boolean(pkg.is_featured);
            const features = Array.isArray(pkg.features) ? pkg.features : [];
            return (
              <Grid item xs={12} md={4} key={pkg.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderRadius: 4,
                    position: "relative",
                    borderColor: popular ? "#4f46e5" : "divider",
                    boxShadow: popular ? "0 20px 45px rgba(79,70,229,.16)" : "none",
                    overflow: "hidden",
                  }}
                >
                  {popular && (
                    <Box sx={{ bgcolor: "#4f46e5", color: "#fff", py: 0.8, textAlign: "center", fontWeight: 900, fontSize: 12 }}>
                      Most Popular
                    </Box>
                  )}
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: featured ? "#ecfdf5" : "#eef2ff", color: featured ? "#059669" : "#4f46e5", display: "grid", placeItems: "center" }}>
                          {featured ? <RocketLaunchOutlinedIcon /> : <WorkspacePremiumOutlinedIcon />}
                        </Box>
                        {featured && <Chip size="small" label="Featured" color="success" variant="outlined" />}
                      </Stack>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 950 }}>{pkg.name}</Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>{pkg.short_description || "Store growth package"}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 950, letterSpacing: -1 }}>{formatMoney(pkg)}</Typography>
                        <Typography variant="body2" color="text.secondary">/{pkg.billing_cycle || "monthly"}</Typography>
                      </Box>
                      <Divider />
                      <Grid container spacing={1}>
                        <Grid item xs={6}><Chip label={`${pkg.trial_days || 0} trial days`} sx={{ width: "100%" }} /></Grid>
                        <Grid item xs={6}><Chip label={formatLimit(pkg.max_products, "products")} sx={{ width: "100%" }} /></Grid>
                        <Grid item xs={6}><Chip label={formatLimit(pkg.max_orders_per_month, "orders")} sx={{ width: "100%" }} /></Grid>
                        <Grid item xs={6}><Chip label={formatLimit(pkg.max_staff, "staff")} sx={{ width: "100%" }} /></Grid>
                        <Grid item xs={6}><Chip label={formatLimit(pkg.max_branches, "branches")} sx={{ width: "100%" }} /></Grid>
                        <Grid item xs={6}><Chip label={`${pkg.commission_rate ?? 0}% commission`} sx={{ width: "100%" }} /></Grid>
                      </Grid>
                      <Stack spacing={1}>
                        {features.map((feature, index) => (
                          <Stack direction="row" spacing={1} alignItems="flex-start" key={`${pkg.id}-${index}`}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "#059669", mt: 0.1 }} />
                            <Typography variant="body2">{feature}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                      <Button
                        variant={popular ? "contained" : "outlined"}
                        fullWidth
                        disabled={subscribingId === pkg.id || !storeId}
                        onClick={() => handleSubscribe(pkg)}
                        sx={{ borderRadius: 2.5, py: 1.2, textTransform: "none", fontWeight: 900 }}
                      >
                        {subscribingId === pkg.id ? <CircularProgress size={20} color="inherit" /> : "Subscribe"}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Alert severity="info" sx={{ borderRadius: 2 }}>No active packages found.</Alert>
      )}

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((prev) => ({ ...prev, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default MerchantPackages;
