import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { useNavigate } from "react-router-dom";
import { getAllShops } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";
import { getStoreSubscription } from "../../../api/controller/admin_controller/subscription_package/subscription_package_controller";

const statusColor = (status) => {
  const value = String(status || "").toLowerCase();
  if (["active", "paid"].includes(value)) return "success";
  if (["pending", "unpaid"].includes(value)) return "warning";
  if (["failed"].includes(value)) return "error";
  if (["cancelled", "expired"].includes(value)) return "default";
  return "default";
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatMoney = (subscription) =>
  `${subscription?.currency || subscription?.package?.currency || "BDT"} ${Number(subscription?.price ?? subscription?.package?.price ?? 0).toLocaleString("en-BD")}`;

const isActiveSubscription = (subscription) => {
  const status = String(subscription?.status || "").toLowerCase();
  const paymentStatus = String(subscription?.payment_status || "").toLowerCase();
  return ["active", "trialing"].includes(status) || paymentStatus === "paid";
};

const benefits = [
  "Publish your public storefront",
  "Add products, categories, and brands",
  "Receive and manage store orders",
  "Unlock reports, POS, and growth tools",
];

const SubscriptionWidget = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSubscription = async () => {
      setLoading(true);
      setError("");
      try {
        const localStoreId = localStorage.getItem("storeId") || localStorage.getItem("shopId");
        let nextStoreId = localStoreId;
        if (!nextStoreId) {
          const userId = localStorage.getItem("userId");
          if (userId) {
            const shopRes = await getAllShops({ user_id: userId, page: 1, per_page: 1 });
            const list = Array.isArray(shopRes?.data?.data) ? shopRes.data.data : [];
            nextStoreId = list?.[0]?.id ? String(list[0].id) : "";
          }
        }
        setStoreId(nextStoreId || "");
        if (!nextStoreId) {
          setSubscription(null);
          return;
        }
        const response = await getStoreSubscription(nextStoreId);
        const next = response?.data?.subscription || response?.data || response?.subscription || null;
        setSubscription(next);
      } catch (err) {
        setError(err?.response?.data?.message || "Subscription status unavailable.");
      } finally {
        setLoading(false);
      }
    };
    loadSubscription();

    const handleSubscriptionUpdated = () => loadSubscription();
    window.addEventListener("subscription-updated", handleSubscriptionUpdated);
    return () => window.removeEventListener("subscription-updated", handleSubscriptionUpdated);
  }, []);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        mb: 3,
        overflow: "hidden",
        borderColor: isActiveSubscription(subscription) ? "#bbf7d0" : "#c7d2fe",
        boxShadow: isActiveSubscription(subscription) ? "0 18px 50px rgba(16,185,129,0.08)" : "0 22px 60px rgba(79,70,229,0.14)",
      }}
    >
      <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={3}>
          <Stack direction="row" spacing={1.7} alignItems="flex-start">
            <Box sx={{ width: 50, height: 50, borderRadius: 2, bgcolor: isActiveSubscription(subscription) ? "#ecfdf5" : "#eef2ff", color: isActiveSubscription(subscription) ? "#059669" : "#4f46e5", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
              <WorkspacePremiumOutlinedIcon />
            </Box>
            <Box>
              <Chip
                size="small"
                label={isActiveSubscription(subscription) ? "Package active" : "Package required"}
                color={isActiveSubscription(subscription) ? "success" : "primary"}
                sx={{ mb: 1, fontWeight: 900 }}
              />
              <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                {loading
                  ? "Checking your subscription"
                  : isActiveSubscription(subscription)
                    ? `${subscription?.package?.name || "Your package"} is active`
                    : "Buy a package first to start selling"}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.8, maxWidth: 620, lineHeight: 1.65 }}>
                {isActiveSubscription(subscription)
                  ? "Your store tools are unlocked. Keep your package active to continue selling from your storefront."
                  : "Choose a subscription package to unlock your storefront, product catalog, POS, order management, and reports."}
              </Typography>
            </Box>
          </Stack>

          {loading ? (
            <CircularProgress size={22} />
          ) : (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: "flex-start", md: "flex-end" }} flexWrap="wrap">
              {subscription?.status && <Chip size="small" label={subscription.status} color={statusColor(subscription.status)} variant="outlined" />}
              {subscription?.payment_status && <Chip size="small" label={subscription.payment_status} color={statusColor(subscription.payment_status)} variant="outlined" />}
              <Button
                variant="contained"
                endIcon={<ArrowForwardOutlinedIcon />}
                onClick={() => navigate("/seller/packages")}
                sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 900, px: 2.2, bgcolor: isActiveSubscription(subscription) ? "#059669" : "#4f46e5" }}
              >
                {isActiveSubscription(subscription) ? "Manage Package" : "Choose Package"}
              </Button>
            </Stack>
          )}
        </Stack>

        {!loading && !isActiveSubscription(subscription) && (
          <>
            <Divider sx={{ my: 2.4 }} />
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              {benefits.map((item) => (
                <Stack key={item} direction="row" spacing={0.9} alignItems="center" sx={{ flex: 1 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "#059669" }} />
                  <Typography variant="body2" sx={{ fontWeight: 800, color: "#334155" }}>
                    {item}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </>
        )}

        {!loading && subscription && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 2 }}>
            <Chip label={`Price: ${formatMoney(subscription)}`} />
            <Chip label={`Cycle: ${subscription.billing_cycle || subscription.package?.billing_cycle || "-"}`} />
            <Chip label={`Starts: ${formatDate(subscription.starts_at)}`} />
            <Chip label={`Ends: ${formatDate(subscription.ends_at)}`} />
            {subscription.trial_ends_at && <Chip label={`Trial ends: ${formatDate(subscription.trial_ends_at)}`} />}
          </Stack>
        )}

        {!loading && error && <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
        {!loading && !storeId && <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>Create or select a store to activate a subscription package.</Alert>}
      </CardContent>
    </Card>
  );
};

export default SubscriptionWidget;
