import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import HomeIcon from "@mui/icons-material/Home";

const readStoredPayment = () => {
  try {
    return JSON.parse(sessionStorage.getItem("aamarpay_pending_payment") || "{}");
  } catch {
    return {};
  }
};

const readStoredSubscription = () => {
  try {
    return JSON.parse(sessionStorage.getItem("aamarpay_pending_subscription") || "{}");
  } catch {
    return {};
  }
};

const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

const PaymentCancelledPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const storedPayment = useMemo(readStoredPayment, []);
  const storedSubscription = useMemo(readStoredSubscription, []);
  const payment = location.state?.payment || {};

  const paymentGroupId = firstValue(params.get("payment_group_id"), payment.payment_group_id, storedPayment.paymentGroupId);
  const orderId = firstValue(params.get("order_id"), payment.order_id, storedPayment.orderId);
  const orderIds = firstValue(params.get("order_ids"), storedPayment.orderIds);
  const amount = firstValue(params.get("amount"), payment.amount, storedSubscription.amount, storedPayment.amount);
  const transactionId = firstValue(
    params.get("tran_id"),
    params.get("mer_txnid"),
    params.get("merchant_transaction_id"),
    payment.merchant_transaction_id,
    storedSubscription.merchantTransactionId,
    storedPayment.transactionId
  );
  const paymentType = firstValue(params.get("payment_type"), payment.payment_type, storedSubscription.paymentType);
  const storeId = firstValue(params.get("store_id"), payment.store_id, storedSubscription.storeId);
  const paymentId = firstValue(params.get("payment_id"), payment.payment_id, storedSubscription.paymentId);
  const isSubscriptionPayment =
    String(paymentType || "").toLowerCase() === "store_subscription" ||
    String(transactionId || "").toUpperCase().startsWith("SUB-");
  const gatewayTransactionId = firstValue(params.get("pg_txnid"), params.get("gateway_transaction_id"));
  const reason = firstValue(params.get("reason"), params.get("message"), "Payment was cancelled before completion.");
  const status = firstValue(params.get("status"), params.get("pay_status"), payment.status, "cancelled");

  useEffect(() => {
    if (isSubscriptionPayment) sessionStorage.removeItem("aamarpay_pending_subscription");
    else sessionStorage.removeItem("aamarpay_pending_payment");
  }, [isSubscriptionPayment]);

  const detailRows = [
    isSubscriptionPayment ? { label: "Store ID", value: storeId } : { label: "Payment group", value: paymentGroupId },
    isSubscriptionPayment ? { label: "Payment ID", value: paymentId } : { label: "Order ID", value: orderIds || orderId },
    { label: "Transaction ID", value: transactionId },
    { label: "Gateway transaction", value: gatewayTransactionId },
    { label: "Status", value: status },
    { label: "Reason", value: reason },
  ].filter((row) => row?.value);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 4,
        background:
          "radial-gradient(700px 420px at 12% 8%, rgba(245, 158, 11, 0.16), transparent 60%)," +
          "radial-gradient(620px 360px at 88% 18%, rgba(100, 116, 139, 0.12), transparent 65%)," +
          "linear-gradient(180deg, #fffaf0 0%, #f7f8fb 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 3,
            background: "rgba(255,255,255,0.96)",
            border: "1px solid rgba(245, 158, 11, 0.22)",
          }}
        >
          <Stack spacing={2.4} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 82,
                height: 82,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.28)",
              }}
            >
              <HighlightOffIcon sx={{ fontSize: 46, color: "#d97706" }} />
            </Box>

            <Box>
              <Chip
                icon={<HighlightOffIcon />}
                label={isSubscriptionPayment ? "Subscription payment cancelled" : "Payment cancelled"}
                sx={{
                  mb: 1.2,
                  borderRadius: 1,
                  fontWeight: 800,
                  bgcolor: "rgba(245, 158, 11, 0.12)",
                  color: "#92400e",
                }}
              />
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#102033", lineHeight: 1.1 }}>
                {isSubscriptionPayment ? "Subscription payment was cancelled" : "Payment was cancelled"}
              </Typography>
              <Typography variant="body1" sx={{ color: "#516070", mt: 1 }}>
                {isSubscriptionPayment
                  ? "No subscription payment was completed. You can choose the package again when ready."
                  : "No online payment was completed. You can return to checkout whenever you are ready."}
              </Typography>
            </Box>

            {amount && (
              <Box
                sx={{
                  width: "100%",
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.18)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#92400e", fontWeight: 800 }}>
                  Cancelled amount
                </Typography>
                <Typography variant="h4" sx={{ color: "#102033", fontWeight: 800 }}>
                  BDT {Number(amount).toLocaleString("en-BD")}
                </Typography>
              </Box>
            )}

            {detailRows.length > 0 && (
              <Stack
                spacing={1}
                sx={{
                  width: "100%",
                  textAlign: "left",
                  bgcolor: "rgba(15, 23, 42, 0.035)",
                  borderRadius: 2,
                  p: 2,
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <ReceiptLongIcon fontSize="small" sx={{ color: "#334155" }} />
                  <Typography variant="subtitle2" sx={{ color: "#102033", fontWeight: 800 }}>
                    {isSubscriptionPayment ? "Subscription payment details" : "Payment details"}
                  </Typography>
                </Stack>
                <Divider />
                {detailRows.map((row) => (
                  <Stack key={row.label} direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 700 }}>
                      {row.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#102033", fontWeight: 800, textAlign: "right", wordBreak: "break-word" }}
                    >
                      {row.value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4} sx={{ width: "100%" }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(isSubscriptionPayment ? "/seller/packages" : "/checkout")}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  borderRadius: 2,
                  py: 1.2,
                  bgcolor: "#d97706",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#b45309", boxShadow: "none" },
                }}
              >
                {isSubscriptionPayment ? "Try Again" : "Back to checkout"}
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<ShoppingBagIcon />}
                onClick={() => navigate(isSubscriptionPayment ? "/seller/packages" : "/orders")}
                sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, py: 1.2 }}
              >
                {isSubscriptionPayment ? "Back to Packages" : "View orders"}
              </Button>
            </Stack>

            {!isSubscriptionPayment && (
              <Button
                variant="text"
                startIcon={<HomeIcon />}
                onClick={() => navigate("/")}
                sx={{ textTransform: "none", fontWeight: 800 }}
              >
                Continue shopping
              </Button>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default PaymentCancelledPage;
