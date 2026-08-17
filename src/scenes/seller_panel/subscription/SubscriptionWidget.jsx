import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
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
    <Card variant="outlined" sx={{ borderRadius: 3, mb: 3, overflow: "hidden" }}>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: "#eef2ff", color: "#4f46e5", display: "grid", placeItems: "center" }}>
              <WorkspacePremiumOutlinedIcon />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900 }}>Store Subscription</Typography>
              <Typography variant="body2" color="text.secondary">
                {loading ? "Checking package status..." : subscription?.package?.name || "No active package selected"}
              </Typography>
            </Box>
          </Stack>

          {loading ? (
            <CircularProgress size={22} />
          ) : (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {subscription?.status && <Chip size="small" label={subscription.status} color={statusColor(subscription.status)} variant="outlined" />}
              {subscription?.payment_status && <Chip size="small" label={subscription.payment_status} color={statusColor(subscription.payment_status)} variant="outlined" />}
              <Button variant="contained" size="small" onClick={() => navigate("/seller/packages")} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}>
                View Packages
              </Button>
            </Stack>
          )}
        </Stack>

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
