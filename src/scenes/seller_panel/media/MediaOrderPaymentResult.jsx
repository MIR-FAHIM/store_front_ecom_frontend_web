import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import axiosInstance from "../../../api/axiosInstance.jsx";
import { fetchSellerMediaOrderDetails } from "../../../api/controller/admin_controller/media/media_marketplace_controller.jsx";
import { formatMoney, unwrapData } from "./mediaMarketplaceUtils";

const resultConfig = {
  success: {
    endpoint: "/api/payments/aamarpay/media-order/verify",
    title: "Verifying Payment",
    doneTitle: "Payment Verified",
    icon: <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 46 }} />,
    color: "success",
  },
  failed: {
    endpoint: "/api/payments/aamarpay/media-order/fail",
    title: "Payment Failed",
    doneTitle: "Payment Failed",
    icon: <ErrorOutlineOutlinedIcon sx={{ fontSize: 46 }} />,
    color: "error",
  },
  cancelled: {
    endpoint: "/api/payments/aamarpay/media-order/cancel",
    title: "Payment Cancelled",
    doneTitle: "Payment Cancelled",
    icon: <HighlightOffOutlinedIcon sx={{ fontSize: 46 }} />,
    color: "warning",
  },
};

const readQueryPayload = (search) => {
  const params = new URLSearchParams(search);
  const payload = {};
  params.forEach((value, key) => {
    if (payload[key] === undefined) {
      payload[key] = value;
      return;
    }
    payload[key] = Array.isArray(payload[key]) ? [...payload[key], value] : [payload[key], value];
  });
  return payload;
};

export default function MediaOrderPaymentResult({ result = "success" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { storeId, orderId } = useParams();
  const config = resultConfig[result] || resultConfig.success;
  const queryPayload = useMemo(() => readQueryPayload(location.search), [location.search]);

  const [verifying, setVerifying] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let active = true;

    const runPaymentCallback = async () => {
      setVerifying(true);
      setError("");
      try {
        const response = await axiosInstance.post(config.endpoint, queryPayload, {
          skipAuth: true,
        });
        if (!active) return;
        setMessage(response?.data?.message || "Payment response processed successfully.");
      } catch (e) {
        if (!active) return;
        setError(e?.response?.data?.message || e.message || "Could not process the payment response.");
      } finally {
        if (active) setVerifying(false);
      }

      setLoadingOrder(true);
      try {
        const orderResponse = await fetchSellerMediaOrderDetails(storeId, orderId);
        if (active) setOrder(unwrapData(orderResponse));
      } catch (e) {
        if (active) {
          setError((prev) => prev || "Payment response processed, but order details could not be loaded. Please log in and open the order.");
        }
      } finally {
        if (active) setLoadingOrder(false);
      }
    };

    runPaymentCallback();
    return () => {
      active = false;
    };
  }, [config.endpoint, orderId, queryPayload, storeId]);

  const orderUrl = `/seller/stores/${storeId}/media-orders/${orderId}`;
  const mediaOrdersUrl = `/seller/stores/${storeId}/media-orders`;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Card sx={{ width: "100%", maxWidth: 680, borderRadius: 1 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2.2} alignItems="center" textAlign="center">
            <Box sx={{ color: `${config.color}.main` }}>{config.icon}</Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                {verifying ? config.title : config.doneTitle}
              </Typography>
              <Typography color="text.secondary">
                Media order #{order?.order_number || orderId}
              </Typography>
            </Box>

            {verifying ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">Sending gateway response to backend...</Typography>
              </Stack>
            ) : null}

            {message ? <Alert severity={config.color === "success" ? "success" : "info"} sx={{ width: "100%" }}>{message}</Alert> : null}
            {error ? <Alert severity="warning" sx={{ width: "100%" }}>{error}</Alert> : null}

            {loadingOrder ? (
              <Typography variant="body2" color="text.secondary">Refreshing order details...</Typography>
            ) : order ? (
              <Box sx={{ width: "100%", p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1, textAlign: "left" }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{order.order_number || `Order #${order.id}`}</Typography>
                    <Typography variant="body2" color="text.secondary">Total: {formatMoney(order.total || order.grand_total, order.currency)}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Chip label={order.payment_status || "payment"} size="small" sx={{ borderRadius: 1 }} />
                    <Chip label={order.status || "status"} size="small" sx={{ borderRadius: 1 }} />
                  </Stack>
                </Stack>
              </Box>
            ) : null}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ width: "100%" }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ReceiptLongOutlinedIcon />}
                onClick={() => navigate(orderUrl)}
                sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900 }}
              >
                View Media Order
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<StorefrontOutlinedIcon />}
                onClick={() => navigate(mediaOrdersUrl)}
                sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900 }}
              >
                My Media Orders
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
