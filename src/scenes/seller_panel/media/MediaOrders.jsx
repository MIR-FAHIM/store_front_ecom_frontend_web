import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import { getAllShops } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";
import { fetchSellerMediaOrders } from "../../../api/controller/admin_controller/media/media_marketplace_controller.jsx";
import { formatMoney, getStoreIdFromShops, normalizeListPayload, normalizeSimpleList, resolveMediaImage } from "./mediaMarketplaceUtils";

const statuses = ["all", "pending_payment", "paid", "pending_design", "in_progress", "draft_delivered", "revision_requested", "final_delivered", "completed", "cancelled", "refunded"];

export default function MediaOrders() {
  const navigate = useNavigate();
  const { storeId: routeStoreId } = useParams();
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState(routeStoreId || localStorage.getItem("storeId") || localStorage.getItem("shopId") || "");
  const [status, setStatus] = useState("all");
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedStore = useMemo(() => stores.find((store) => String(store.id) === String(storeId)), [stores, storeId]);

  useEffect(() => {
    let mounted = true;
    const loadStores = async () => {
      try {
        const response = await getAllShops({ user_id: localStorage.getItem("userId"), page: 1, per_page: 100 });
        const list = normalizeSimpleList(response);
        if (!mounted) return;
        setStores(list);
        const nextStoreId = getStoreIdFromShops(list, storeId);
        if (nextStoreId) {
          setStoreId(nextStoreId);
          localStorage.setItem("storeId", nextStoreId);
        }
      } catch (e) {
        if (mounted) setStores([]);
      }
    };
    loadStores();
    return () => {
      mounted = false;
    };
  }, [storeId]);

  const loadOrders = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetchSellerMediaOrders(storeId, {
        page,
        per_page: 12,
        status: status !== "all" ? status : undefined,
      });
      const payload = normalizeListPayload(response);
      setOrders(payload.list);
      setLastPage(payload.lastPage);
      setTotal(payload.total);
    } catch (e) {
      setOrders([]);
      setError(e?.response?.data?.message || e.message || "Failed to load media orders.");
    } finally {
      setLoading(false);
    }
  }, [page, status, storeId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <CollectionsOutlinedIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>My Media Orders</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Track creative design orders, delivery files, payment status, and revisions.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate("/seller/media-marketplace")} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900 }}>
          Browse Marketplace
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 1, mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField select size="small" label="Store" value={storeId} onChange={(e) => { setStoreId(e.target.value); localStorage.setItem("storeId", e.target.value); setPage(1); }} sx={{ minWidth: 240 }}>
              {stores.map((store) => <MenuItem key={store.id} value={store.id}>{store.shop_name || store.name || `Store #${store.id}`}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} sx={{ minWidth: 220 }}>
              {statuses.map((item) => <MenuItem key={item} value={item}>{item.replaceAll("_", " ")}</MenuItem>)}
            </TextField>
          </Stack>
          {selectedStore ? <Typography variant="caption" color="text.secondary">Showing orders for {selectedStore.shop_name || selectedStore.name}</Typography> : null}
        </CardContent>
      </Card>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : orders.length === 0 ? (
        <Alert severity="info">No media orders found.</Alert>
      ) : (
        <>
          <TableContainer component={Card} sx={{ borderRadius: 1 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Creative</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => {
                  const resource = order?.resource || order?.media_resource || order?.item?.resource || {};
                  return (
                    <TableRow key={order.id}>
                      <TableCell sx={{ fontWeight: 800 }}>{order.order_number || `#${order.id}`}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Box component="img" src={resolveMediaImage(resource)} alt={resource?.name} sx={{ width: 52, height: 36, borderRadius: 1, objectFit: "cover" }} />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{resource?.name || order?.resource_name || "Creative order"}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{formatMoney(order.total || order.grand_total, order.currency)}</TableCell>
                      <TableCell><Chip label={order.payment_status || "unpaid"} size="small" sx={{ borderRadius: 1 }} /></TableCell>
                      <TableCell><Chip label={order.status || "pending"} color={order.status === "completed" ? "success" : "default"} size="small" sx={{ borderRadius: 1 }} /></TableCell>
                      <TableCell>{order.created_at ? new Date(order.created_at).toLocaleString() : "-"}</TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined" onClick={() => navigate(`/seller/stores/${storeId}/media-orders/${order.id}`)} sx={{ textTransform: "none", fontWeight: 800 }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">{total} orders</Typography>
            <Pagination count={lastPage} page={page} onChange={(_e, value) => setPage(value)} />
          </Stack>
        </>
      )}
    </Box>
  );
}
