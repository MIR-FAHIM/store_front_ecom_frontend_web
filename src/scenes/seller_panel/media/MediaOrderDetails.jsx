import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import { approveSellerMediaOrder, fetchSellerMediaOrderDetails, paySellerMediaOrder, requestSellerMediaRevision } from "../../../api/controller/admin_controller/media/media_marketplace_controller.jsx";
import { formatMoney, resolveMediaImage, safeArray, unwrapData } from "./mediaMarketplaceUtils";

const deliveredStatuses = new Set(["draft_delivered", "final_delivered"]);
const unpaidStatuses = new Set(["unpaid", "pending", "failed"]);

export default function MediaOrderDetails() {
  const navigate = useNavigate();
  const { storeId, orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchSellerMediaOrderDetails(storeId, orderId);
      setOrder(unwrapData(response));
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load media order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, orderId]);

  const orderItems = safeArray(order?.items || order?.order_items);
  const firstOrderItem = orderItems[0] || order?.item || {};
  const resource =
    order?.resource ||
    order?.media_resource ||
    firstOrderItem?.resource ||
    firstOrderItem?.media_resource ||
    firstOrderItem?.resource_snapshot ||
    {};
  const fieldValues =
    order?.field_values ||
    order?.submitted_fields ||
    firstOrderItem?.field_values ||
    firstOrderItem?.submitted_fields ||
    {};
  const files = safeArray(order?.files || order?.uploaded_files || firstOrderItem?.files);
  const deliverables = safeArray(order?.deliverables || firstOrderItem?.deliverables);
  const revisions = safeArray(order?.revisions || firstOrderItem?.revisions);
  const firstOrderItemId = useMemo(() => orderItems[0]?.id || order?.order_item_id || order?.item?.id, [order?.item?.id, order?.order_item_id, orderItems]);
  const canPay = unpaidStatuses.has(String(order?.payment_status || "").toLowerCase()) || order?.status === "pending_payment";

  const existingPaymentUrl = useMemo(() => {
    const payments = safeArray(order?.payments);
    const latestPayment = payments[0] || {};
    return (
      order?.payment_url ||
      latestPayment?.payment_url ||
      latestPayment?.gateway_response?.payment_url ||
      latestPayment?.gateway_response?.response?.payment_url ||
      ""
    );
  }, [order?.payment_url, order?.payments]);

  const handlePayNow = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await paySellerMediaOrder(storeId, orderId);
      const paymentUrl =
        response?.data?.payment_url ||
        response?.payment_url ||
        response?.data?.gateway_response?.response?.payment_url ||
        existingPaymentUrl;

      if (!paymentUrl) {
        setError("Payment URL was not returned. Please try again.");
        return;
      }

      window.location.href = paymentUrl;
    } catch (e) {
      if (existingPaymentUrl) {
        window.location.href = existingPaymentUrl;
        return;
      }
      setError(e?.response?.data?.message || e.message || "Failed to start payment.");
    } finally {
      setBusy(false);
    }
  };

  const handleRevision = async () => {
    if (!revisionNote.trim()) {
      setError("Write a revision note first.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await requestSellerMediaRevision(storeId, orderId, {
        order_item_id: firstOrderItemId,
        request_note: revisionNote,
      });
      setMessage("Revision request sent successfully.");
      setRevisionNote("");
      await loadOrder();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to request revision.");
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await approveSellerMediaOrder(storeId, orderId);
      setMessage("Final design approved successfully.");
      await loadOrder();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to approve final design.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  if (!order) {
    return <Box sx={{ p: 3 }}><Alert severity="error">{error || "Media order not found."}</Alert></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate(`/seller/stores/${storeId}/media-orders`)} sx={{ mb: 2, textTransform: "none", fontWeight: 800 }}>
        Back to media orders
      </Button>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 1 }}>
            <Box component="img" src={resolveMediaImage(resource)} alt={resource?.name} sx={{ width: "100%", aspectRatio: "16/10", objectFit: "cover" }} />
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>{order.order_number || `Order #${order.id}`}</Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>{resource?.name || order?.resource_name || "Creative order"}</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Chip label={order.status || "pending"} sx={{ borderRadius: 1 }} />
                <Chip label={order.payment_status || "unpaid"} sx={{ borderRadius: 1 }} />
              </Stack>
              <Typography sx={{ fontWeight: 900 }}>{formatMoney(order.total || order.grand_total, order.currency)}</Typography>
              <Typography variant="body2" color="text.secondary">Created: {order.created_at ? new Date(order.created_at).toLocaleString() : "-"}</Typography>
              {canPay ? (
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PaymentOutlinedIcon />}
                  disabled={busy}
                  onClick={handlePayNow}
                  sx={{ mt: 2, borderRadius: 1, textTransform: "none", fontWeight: 900 }}
                >
                  Pay Now
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            <Card sx={{ borderRadius: 1 }}>
              <CardContent>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Submitted Information</Typography>
                {Object.keys(fieldValues || {}).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No dynamic field values submitted.</Typography>
                ) : (
                  <Grid container spacing={1}>
                    {Object.entries(fieldValues).map(([key, value]) => (
                      <Grid item xs={12} md={6} key={key}>
                        <Box sx={{ p: 1.2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">{key}</Typography>
                          <Typography sx={{ fontWeight: 700, whiteSpace: "pre-wrap" }}>{String(value || "-")}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
                {order.customer_note ? (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" color="text.secondary">Customer note</Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>{order.customer_note}</Typography>
                  </>
                ) : null}
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 1 }}>
              <CardContent>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Uploaded Files</Typography>
                {files.length === 0 ? <Typography variant="body2" color="text.secondary">No files uploaded.</Typography> : files.map((file) => {
                  const upload = file.upload || file;
                  return (
                    <Stack key={file.id || upload.id || upload.url} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                      <Typography>{file.file_type || file.field_name || "File"}</Typography>
                      <Link href={upload.url || upload.file_url} target="_blank" rel="noreferrer">Open</Link>
                    </Stack>
                  );
                })}
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 1 }}>
              <CardContent>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Deliverables</Typography>
                {deliverables.length === 0 ? <Typography variant="body2" color="text.secondary">No deliverables yet.</Typography> : deliverables.map((item) => {
                  const upload = item.upload || item;
                  return (
                    <Stack key={item.id || upload.id || upload.url} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                      <Box>
                        <Typography sx={{ fontWeight: 800 }}>{item.file_type || "Deliverable"}</Typography>
                        {item.note ? <Typography variant="body2" color="text.secondary">{item.note}</Typography> : null}
                      </Box>
                      <Link href={upload.url || upload.file_url} target="_blank" rel="noreferrer">Preview / Download</Link>
                    </Stack>
                  );
                })}

                {deliveredStatuses.has(order.status) ? (
                  <Box sx={{ mt: 2 }}>
                    <TextField fullWidth multiline minRows={3} label="Revision note" value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} placeholder="Please change discount from 20% to 30%" sx={{ mb: 1.5 }} />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button variant="outlined" startIcon={<ReplayOutlinedIcon />} disabled={busy || !firstOrderItemId} onClick={handleRevision} sx={{ textTransform: "none", fontWeight: 800 }}>
                        Request Revision
                      </Button>
                      <Button variant="contained" color="success" startIcon={<CheckCircleOutlineOutlinedIcon />} disabled={busy} onClick={handleApprove} sx={{ textTransform: "none", fontWeight: 900 }}>
                        Accept Final
                      </Button>
                    </Stack>
                  </Box>
                ) : null}
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 1 }}>
              <CardContent>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Revisions</Typography>
                {revisions.length === 0 ? <Typography variant="body2" color="text.secondary">No revision requests yet.</Typography> : revisions.map((revision) => (
                  <Box key={revision.id} sx={{ py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>{revision.request_note || revision.note}</Typography>
                    <Typography variant="caption" color="text.secondary">{revision.created_at ? new Date(revision.created_at).toLocaleString() : ""}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
