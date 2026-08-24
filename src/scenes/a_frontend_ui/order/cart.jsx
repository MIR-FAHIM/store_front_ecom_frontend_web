import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Button,
  Paper,
  IconButton,
  Snackbar,
  useTheme,
  Chip,
  Stack,
  Tooltip,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockCheckoutIcon from "@mui/icons-material/Lock";
import { getCartByUser, updateQuantity, deleteItem } from "../../../api/controller/admin_controller/order/cart_controller";
import { image_file_url } from "../../../api/config";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../../theme";
import { productDetailPath } from "../../../utils/productRoute";
import { useStorefront } from "../../../context/StorefrontContext";

const Cart = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentStoreSlug, storePath, storeParams } = useStorefront();

  const colors = tokens(theme.palette.mode);
  const divider = theme.palette.divider || colors.primary[200];
  const surface = colors.primary[400];
  const surface2 = colors.primary[300];
  const ink = colors.gray[100];
  const subInk = colors.gray[300];

  const money = (n) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(Number(n || 0));

  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState(null);
  const [processing, setProcessing] = useState({});
  const [msg, setMsg] = useState("");

  const userId = useMemo(() => {
    const id = localStorage.getItem("userId");
    return id ? String(id) : null;
  }, []);

  const getPrimaryImage = (product) => {
    const imgPath =
      product?.primary_image?.file_name ||
      (product?.images?.length ? (product.images.find((i) => i.is_primary) || product.images[0])?.file_name : null);

    if (imgPath) return `${image_file_url}/${imgPath}`;
    return "/assets/images/placeholder.png";
  };

  const syncCartBadge = (data) => {
    const total = data?.total_items ?? (Array.isArray(data?.items) ? data.items.length : 0);
    localStorage.setItem("cart", JSON.stringify(total));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const loadCart = async () => {
    if (!userId) {
      sessionStorage.setItem("auth_redirect", `${window.location.pathname}${window.location.search}`);
      navigate("/login");
      setCart(null);
      localStorage.setItem("cart", JSON.stringify(0));
      window.dispatchEvent(new Event("cart-updated"));
      return;
    }

    setLoading(true);
    try {
      const res = await getCartByUser(userId, storeParams);
      if (res?.status === "success") {
        setCart(res.data);
        syncCartBadge(res.data);
      } else {
        setCart(null);
        localStorage.setItem("cart", JSON.stringify(0));
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (e) {
      console.error("Error loading cart:", e);
      setCart(null);
      localStorage.setItem("cart", JSON.stringify(0));
      window.dispatchEvent(new Event("cart-updated"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (item, newQty) => {
    if (newQty < 1) return;

    setProcessing((prev) => ({ ...prev, [item.id]: true }));
    try {
      const res = await updateQuantity(item.id, newQty, storeParams);
      if (res?.status === "success") {
        setMsg(res.message || "Updated quantity");
        await loadCart();
      } else {
        setMsg(res?.message || "Failed to update quantity");
      }
    } catch (e) {
      console.error("Update qty error", e);
      setMsg("Error updating quantity");
    } finally {
      setProcessing((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm("Remove this item from cart?")) return;

    setProcessing((prev) => ({ ...prev, [item.id]: true }));
    try {
      const res = await deleteItem(item.id);
      if (res?.status === "success") {
        setMsg(res.message || "Item removed");
        await loadCart();
      } else {
        setMsg(res?.message || "Failed to remove item");
      }
    } catch (e) {
      console.error("Delete item error", e);
      setMsg("Error removing item");
    } finally {
      setProcessing((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const empty = !cart || (Array.isArray(cart.items) && cart.items.length === 0);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: theme.palette.background?.default || colors.primary[500],
      }}
    >
      <Container sx={{ py: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 1,
            border: `1px solid ${divider}`,
            background: surface,
            backdropFilter: "blur(12px)",
            display: "flex",
            gap: 2,
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                borderRadius: 1,
                border: `1px solid ${divider}`,
                background: surface,
                "&:hover": { background: surface2 },
              }}
            >
              <ArrowBackIcon />
            </IconButton>

            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: theme.palette.secondary.main,
                  lineHeight: 1.1,
                }}
              >
                Your Cart
              </Typography>

              <Typography variant="body2" sx={{ fontWeight: 500, color: subInk, mt: 0.5, fontSize: 13 }}>
                Review items, adjust quantities, then checkout.
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<ShoppingCartIcon />}
              label={cart?.total_items ? `${cart.total_items} items` : "0 items"}
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                fontSize: 12,
                background: surface2,
                border: `1px solid ${divider}`,
                color: ink,
              }}
            />
            <Tooltip title="Refresh cart">
              <IconButton
                onClick={loadCart}
                sx={{
                  borderRadius: 1,
                  border: `1px solid ${divider}`,
                  background: surface,
                  "&:hover": { background: surface2 },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Body */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : empty ? (
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 1,
              border: `1px solid ${divider}`,
              background: surface,
              backdropFilter: "blur(12px)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: ink }}>
              Your cart is empty.
            </Typography>
            <Typography variant="body2" sx={{ color: subInk, mt: 0.5, fontWeight: 500, fontSize: 13 }}>
              Add something fun. Your future self will thank you.
            </Typography>

            <Button
              sx={{
                mt: 2,
                borderRadius: 1,
                textTransform: "none",
                fontWeight: 600,
                px: 2.5,
                background: theme.palette.secondary.main,
                color: colors.gray[900],
                boxShadow: "none",
                "&:hover": { opacity: 0.92, boxShadow: "none" },
              }}
              variant="contained"
              onClick={() => navigate(storePath("/"))}
            >
              Continue Shopping
            </Button>
          </Paper>
        ) : (
          <Box>
            {/* Items */}
            <Paper
              sx={{
                borderRadius: 1,
                border: `1px solid ${divider}`,
                background: surface,
                backdropFilter: "blur(12px)",
                overflow: "hidden",
              }}
            >
              <List sx={{ p: 0 }}>
                {cart.items.map((it, idx) => (
                  <React.Fragment key={it.id}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        py: 2,
                        px: 2,
                        background: idx % 2 === 0 ? "transparent" : surface2,
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 96 }}>
                        <Box
                          sx={{
                            width: 84,
                            height: 84,
                            borderRadius: 1,
                            overflow: "hidden",
                            border: `1px solid ${divider}`,
                            background: surface2,
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <Avatar
                          
                            variant="square"
                            src={getPrimaryImage(it.product)}
                            sx={{ width: "100%", height: "100%" }}
                            onClick={() => navigate(productDetailPath(it.product, currentStoreSlug))}
                          />
                        </Box>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Typography sx={{ fontWeight: 700, color: ink, lineHeight: 1.3, fontSize: 14 }}>
                            {it.product?.name || "Unnamed product"}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" sx={{ color: subInk, fontWeight: 500, fontSize: 12 }}>
                              Shop: {it.shop?.name || "N/A"}
                            </Typography>

                            {it.product_attribute ? (
                              <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mt: 0.6, rowGap: 0.6 }}>
                                <Chip
                                  size="small"
                                  label={`${it.product_attribute?.attribute?.name || "N/A"}`}
                                  sx={{
                                    borderRadius: 1,
                                    fontWeight: 600,
                                    background: "transparent",
                                    border: `1px solid ${divider}`,
                                    color: subInk,
                                  }}
                                />
                                <Chip
                                  size="small"
                                  label={`Value: ${it.product_attribute?.value?.value || "N/A"}`}
                                  sx={{
                                    borderRadius: 1,
                                    fontWeight: 600,
                                    background: surface2,
                                    border: `1px solid ${divider}`,
                                    color: ink,
                                  }}
                                />
                              </Stack>
                            ) : null}

                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                              sx={{ mt: 1, alignItems: { sm: "center" } }}
                            >
                              {/* Qty controls */}
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Tooltip title="Decrease quantity">
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleUpdateQty(it, it.qty - 1)}
                                      disabled={processing[it.id] || it.qty <= 1}
                                      sx={{
                                        borderRadius: 1,
                                        border: `1px solid ${divider}`,
                                        background: surface,
                                        "&:hover": { background: surface2 },
                                      }}
                                    >
                                      <RemoveCircleOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>

                                <Chip
                                  label={`Qty: ${it.qty}`}
                                  sx={{
                                    borderRadius: 1,
                                    fontWeight: 600,
                                    background: surface2,
                                    border: `1px solid ${divider}`,
                                    color: ink,
                                  }}
                                />

                                <Tooltip title="Increase quantity">
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleUpdateQty(it, it.qty + 1)}
                                      disabled={processing[it.id]}
                                      sx={{
                                        borderRadius: 1,
                                        border: `1px solid ${divider}`,
                                        background: surface,
                                        "&:hover": { background: surface2 },
                                      }}
                                    >
                                      <AddCircleOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>

                              {/* Prices */}
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                                <Chip
                                  label={`Unit: ${money(it.unit_price)}`}
                                  sx={{
                                    borderRadius: 1,
                                    fontWeight: 600,
                                    background: "transparent",
                                    border: `1px solid ${divider}`,
                                    color: subInk,
                                  }}
                                />
                                <Chip
                                  label={`Line: ${money(it.line_total)}`}
                                  sx={{
                                    borderRadius: 1,
                                    fontWeight: 600,
                                    background: "transparent",
                                    border: `1px solid ${divider}`,
                                    color: ink,
                                  }}
                                />
                              </Stack>

                              {/* Delete */}
                              <Box sx={{ flex: 1 }} />
                              <Tooltip title="Remove item">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteItem(it)}
                                    disabled={processing[it.id]}
                                    sx={{
                                      borderRadius: 1,
                                      border: `1px solid ${divider}`,
                                      background: theme.palette.mode === "dark" ? "rgba(250,92,92,0.12)" : "rgba(250,92,92,0.10)",
                                      "&:hover": {
                                        background: theme.palette.mode === "dark" ? "rgba(250,92,92,0.16)" : "rgba(250,92,92,0.14)",
                                      },
                                    }}
                                  >
                                    <DeleteOutlineIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </Box>
                        }
                      />
                    </ListItem>
                    {idx !== cart.items.length - 1 ? <Divider sx={{ opacity: 0.12 }} /> : null}
                  </React.Fragment>
                ))}
              </List>
            </Paper>

            {/* Summary */}
            <Paper
              sx={{
                p: 2,
                mt: 2,
                borderRadius: 1,
                border: `1px solid ${divider}`,
                background: surface,
                backdropFilter: "blur(12px)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", md: "center" },
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Stack spacing={0.6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: ink, fontSize: 13 }}>
                  Total items: {cart.total_items}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: ink }}>
                  Subtotal:{" "}
                  <Box
                    component="span"
                    sx={{
                      ml: 0.5,
                      color: theme.palette.secondary.main,
                    }}
                  >
                    {money(cart.subtotal)}
                  </Box>
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  onClick={loadCart}
                  startIcon={<RefreshIcon />}
                  sx={{
                    borderRadius: 1,
                    textTransform: "none",
                    fontWeight: 600,
                     color: colors.gray[100],
                    borderColor: divider,
                    background: surface,
                    "&:hover": { background: surface2, borderColor: theme.palette.primary.main },
                  }}
                >
                  Refresh
                </Button>

                <Button
                  variant="contained"
                  onClick={() => navigate(storePath("/checkout"))}
                  startIcon={<LockCheckoutIcon />}
                  sx={{
                    borderRadius: 1,
                    textTransform: "none",
                    fontWeight: 700,
                    px: 2.6,
                    background: theme.palette.secondary.main,
                    color: colors.gray[900],
                    boxShadow: "none",
                    "&:hover": { opacity: 0.92, boxShadow: "none" },
                  }}
                >
                  Checkout
                </Button>
              </Stack>
            </Paper>
          </Box>
        )}

        <Snackbar open={!!msg} autoHideDuration={3000} onClose={() => setMsg("")} message={msg} />
      </Container>
    </Box>
  );
};

export default Cart;
