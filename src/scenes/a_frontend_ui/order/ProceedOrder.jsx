import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Checkbox,
  TextField,
  CircularProgress,
  Snackbar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Tooltip,
  useTheme,
  MenuItem,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LockCheckoutIcon from "@mui/icons-material/Lock";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import NotesIcon from "@mui/icons-material/Notes";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import PaymentsIcon from "@mui/icons-material/Payments";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { useNavigate } from "react-router-dom";

import { getUserAddresses, addUserAddress, deleteUserAddress } from "../../../api/controller/admin_controller/order/user_address_controller";
import { checkOutOrder, initiateAamarPayPayment } from "../../../api/controller/admin_controller/order/order_controller";
import { getShippingCosts , getDivisions, getDistricts} from "../../../api/controller/admin_controller/delivery/delivery_controller";
import { getCartByUser, updateQuantity, deleteItem } from "../../../api/controller/admin_controller/order/cart_controller";
import { tokens } from "../../../theme";
import UserAddress from "./UserAddress";
import { useStorefront } from "../../../context/StorefrontContext";

const ProceedOrder = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentStoreSlug, storePath, storeParams } = useStorefront();

  const colors = tokens(theme.palette.mode);
  const divider = theme.palette.divider || colors.primary[200];
  const surface = colors.primary[400];
  const surface2 = colors.primary[300];
  const ink = colors.gray[100];
  const subInk = colors.gray[300];

  const userId = useMemo(() => {
    const id = localStorage.getItem("userId");
    return id ? String(id) : null;
  }, []);

  const money = (n) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(Number(n || 0));

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");

  const [cart, setCart] = useState(null);
  const [note, setNote] = useState("");
  const [isOutsideDhaka, setIsOutsideDhaka] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [processing, setProcessing] = useState({});
  const [openAddressModal, setOpenAddressModal] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [addressDeleting, setAddressDeleting] = useState({});

  const selectedShippingCost = isOutsideDhaka === 1 ? 120 : 60;

  // IMPORTANT: this fixes your popup bug
  const [addrLoading, setAddrLoading] = useState(true);
  const [addrLoadedOnce, setAddrLoadedOnce] = useState(false);

  // New address form
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newDivision, setNewDivision] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const getPaymentRedirectUrl = (payload) => {
    const data = payload?.data ?? payload;

    return (
      data?.payment_url ||
      data?.redirect_url ||
      data?.gateway_url ||
      data?.url ||
      data?.data?.payment_url ||
      data?.data?.redirect_url ||
      data?.data?.gateway_url ||
      data?.data?.url ||
      null
    );
  };

  const getOrderPaymentReference = (payload) => {
    const data = payload?.data ?? payload;
    const body = data?.data ?? data;
    const order = body?.order ?? body;

    return {
      orderId: body?.order_id || order?.order_id || order?.id || data?.order_id || null,
      paymentGroupId:
        body?.payment_group_id ||
        body?.paymentGroupId ||
        order?.payment_group_id ||
        order?.paymentGroupId ||
        data?.payment_group_id ||
        null,
    };
  };

  const resetNewAddress = () => {
    setNewName("");
    setNewMobile("");
    setNewDivision("");
    setNewDistrict("");
    setNewArea("");
    setNewAddress("");
  };

  const loadAddresses = async () => {
    if (!userId) {
      setAddresses([]);
      setSelectedAddress(null);
      setAddrLoading(false);
      setAddrLoadedOnce(true);
      return;
    }

    setAddrLoading(true);
    try {
      const res = await getUserAddresses(userId);
      if (res?.status === "success") {
        const list = Array.isArray(res.data) ? res.data : [];
        setAddresses(list);

        if (list.length > 0) {
          setSelectedAddress((prev) => {
            const exists = prev && list.some((a) => String(a.id) === String(prev));
            return exists ? prev : String(list[0].id);
          });
        } else {
          setSelectedAddress(null);
        }
      } else {
        setAddresses([]);
        setSelectedAddress(null);
      }
    } catch (e) {
      console.error("Error loading addresses", e);
      setAddresses([]);
      setSelectedAddress(null);
    } finally {
      setAddrLoading(false);
      setAddrLoadedOnce(true);
    }
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

    try {
      const res = await getCartByUser(userId, storeParams);
      if (res?.status === "success") {
        setCart(res.data);
        syncCartBadge(res.data);
      } else {
        setCart(null);
      }
    } catch (e) {
      console.error("Error loading cart", e);
      setCart(null);
    }
  };

  useEffect(() => {
    loadAddresses();
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadShipping = async () => {
      try {
        const res = await getShippingCosts();
        const list = res?.data ?? res ?? [];
        const first = Array.isArray(list) ? list[0] : null;
        setShippingCost(Number(first?.shipping_cost || 0));
      } catch (e) {
        console.error("Error loading shipping cost", e);
        setShippingCost(0);
      }
    };
    loadShipping();
  }, []);

  useEffect(() => {
    const loadDivisions = async () => {
      setLoadingDivisions(true);
      try {
        const res = await getDivisions();
        const list = res?.data ?? res ?? [];
        setDivisions(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Error loading divisions", e);
        setDivisions([]);
      } finally {
        setLoadingDivisions(false);
      }
    };
    loadDivisions();
  }, []);

  useEffect(() => {
    if (!newDivision) {
      setDistricts([]);
      setNewDistrict("");
      return;
    }

    const loadDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await getDistricts(newDivision);
        const list = res?.data ?? res ?? [];
        setDistricts(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Error loading districts", e);
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };

    loadDistricts();
  }, [newDivision]);

  // AUTO-OPEN only AFTER addresses loaded, only if user logged in, only if still empty
  useEffect(() => {
    if (!userId) return;
    if (!addrLoadedOnce) return;
    if (addrLoading) return;

    if (addresses.length === 0) {
      setOpenAddressModal(true);
    }
  }, [userId, addrLoadedOnce, addrLoading, addresses.length]);

  const handleAddAddress = async () => {
    if (!userId) {
      setMsg("Please login to add an address.");
      return;
    }
    if (!newName || !newMobile || !newAddress || !newDivision || !newDistrict) {
      setMsg("Please fill name, mobile, division, district and address");
      return;
    }

    setAdding(true);
    try {
      const form = new FormData();
      form.append("user_id", userId);
      form.append("name", newName);
      form.append("mobile", newMobile);
      form.append("division", newDivision);
      form.append("district", newDistrict);
      form.append("area", newArea);
      form.append("address", newAddress);

      const res = await addUserAddress(form);
      const ok = res?.data?.status === "success" || res?.status === 200 || res?.status === "success";

      if (ok) {
        setMsg("Address added");
        resetNewAddress();
        await loadAddresses();
        setOpenAddressModal(false);
      } else {
        setMsg(res?.data?.message || res?.message || "Failed to add address");
      }
    } catch (e) {
      console.error("Add address error", e);
      setMsg("Error adding address");
    } finally {
      setAdding(false);
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

  const handleDeleteAddress = async (address) => {
    if (!userId) {
      setMsg("Please login to delete an address.");
      return;
    }
    if (!window.confirm("Delete this address?")) return;

    setAddressDeleting((prev) => ({ ...prev, [address.id]: true }));
    try {
      const res = await deleteUserAddress(address.id);
      const ok = res?.data?.status === "success" || res?.status === 200 || res?.status === "success";
      if (ok) {
        setMsg(res?.data?.message || res?.message || "Address deleted");
        await loadAddresses();
      } else {
        setMsg(res?.data?.message || res?.message || "Failed to delete address");
      }
    } catch (e) {
      console.error("Delete address error", e);
      setMsg("Error deleting address");
    } finally {
      setAddressDeleting((prev) => ({ ...prev, [address.id]: false }));
    }
  };

  const handleCheckout = async () => {
    if (!userId) {
      sessionStorage.setItem("auth_redirect", `${window.location.pathname}${window.location.search}`);
      navigate("/login");
      setMsg("Please login to place an order.");
      return;
    }
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      setMsg("Cart is empty");
      return;
    }

    const addrObj = selectedAddress
      ? addresses.find((a) => String(a.id) === String(selectedAddress))
      : null;

    if (!addrObj) {
      setMsg("Select or add a shipping address");
      return;
    }

    setLoadingCheckout(true);
    try {
      const checkoutTotal = Number(cart.subtotal || 0) + Number(selectedShippingCost || 0);
      const firstItem = Array.isArray(cart.items) ? cart.items[0] : null;
      const storeId = cart?.store_id || firstItem?.store_id || firstItem?.product?.store_id || firstItem?.store?.id || firstItem?.product?.store?.id;
      const form = new FormData();
      form.append("user_id", userId);
      form.append("user_address_id", String(addrObj.id || selectedAddress));
      form.append("customer_name", addrObj.name || "");
      form.append("customer_phone", addrObj.mobile || "");
      form.append(
        "shipping_address",
        `${addrObj.address}${addrObj.area ? `, ${addrObj.area}` : ""}${addrObj.district ? `, ${addrObj.district}` : ""}`
      );
      form.append("zone", addrObj.district || "");
      form.append("is_outside_dhaka", String(isOutsideDhaka));
      form.append("shipping_cost", String(selectedShippingCost));
      form.append("amount", String(checkoutTotal));
      form.append("total_amount", String(checkoutTotal));
      form.append("payment_method", paymentMethod === "online" ? "online" : "cod");
      form.append("note", note || "");
      form.append("platform", "web");
      if (currentStoreSlug) {
        form.append("store_slug", currentStoreSlug);
        if (storeId) form.append("store_id", String(storeId));
      }

      if (paymentMethod === "online") {
        const orderRes = await checkOutOrder(form);
        const orderOk = orderRes?.data?.status === "success" || orderRes?.status === 200 || orderRes?.data?.success === true;
        const { orderId, paymentGroupId } = getOrderPaymentReference(orderRes);

        if (!orderOk) {
          setMsg(orderRes?.data?.message || "Failed to create order for online payment");
          return;
        }

        if (!orderId && !paymentGroupId) {
          setMsg("Order created, but payment reference was missing.");
          return;
        }

        const paymentForm = new FormData();
        if (orderId) paymentForm.append("order_id", String(orderId));
        if (paymentGroupId) paymentForm.append("payment_group_id", String(paymentGroupId));
        if (currentStoreSlug) paymentForm.append("store_slug", currentStoreSlug);
        if (currentStoreSlug && storeId) paymentForm.append("store_id", String(storeId));

        const paymentRes = await initiateAamarPayPayment(paymentForm);
        const paymentOk =
          paymentRes?.data?.status === "success" ||
          paymentRes?.status === 200 ||
          paymentRes?.data?.success === true;
        const redirectUrl = getPaymentRedirectUrl(paymentRes);

        if (paymentOk && redirectUrl) {
          sessionStorage.setItem(
            "aamarpay_pending_payment",
            JSON.stringify({
              orderId,
              paymentGroupId,
              amount: checkoutTotal,
              storeSlug: currentStoreSlug || "",
              storeId: storeId || "",
              transactionId:
                paymentRes?.data?.merchant_transaction_id ||
                paymentRes?.data?.data?.merchant_transaction_id ||
                paymentRes?.data?.tran_id ||
                "",
            })
          );
          setMsg(paymentRes?.data?.message || "Redirecting to online payment...");
          window.location.href = redirectUrl;
          return;
        }

        setMsg(paymentRes?.data?.message || "Failed to start online payment");
        return;
      }

      const res = await checkOutOrder(form);
      const ok = res?.data?.status === "success" || res?.status === 200;

      if (ok) {
        setMsg(res?.data?.message || "Order placed");
        localStorage.setItem("cart", JSON.stringify(0));
        window.dispatchEvent(new Event("cart-updated"));
        setTimeout(() => navigate(storePath("/order-success")), 900);
      } else {
        setMsg(res?.data?.message || "Failed to place order");
      }
    } catch (e) {
      console.error("Checkout error", e);
      setMsg(paymentMethod === "online" ? "Error starting online payment" : "Error placing order");
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
          background: theme.palette.background?.default || colors.primary[500],
        p: { xs: 1.5, md: 2 },
      }}
    >
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
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
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
                lineHeight: 1.05,
              }}
            >
              Checkout
            </Typography>
            <Typography variant="body2" sx={{ color: subInk, fontWeight: 700, mt: 0.5 }}>
              Select address and confirm order.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={<LocalShippingIcon />}
            label={
              addrLoading
                ? "Loading addresses..."
                : addresses.length
                ? `${addresses.length} address${addresses.length > 1 ? "es" : ""}`
                : "No address"
            }
            sx={{
              borderRadius: 1,
              fontWeight: 600,
              background: surface2,
              border: `1px solid ${divider}`,
              color: ink,
            }}
          />

          <Button
            onClick={() => setOpenAddressModal(true)}
            startIcon={<AddIcon />}
            variant="contained"
            sx={{
              borderRadius: 1,
              textTransform: "none",
              fontWeight: 700,
              px: 2,
              background: theme.palette.secondary.main,
              color: colors.gray[900],
              boxShadow: "none",
              "&:hover": { opacity: 0.92, boxShadow: "none" },
            }}
          >
            Add new address
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        {/* Left */}
        <Grid item xs={12} md={7}>
          <UserAddress
            addresses={addresses}
            selectedAddress={selectedAddress}
            onSelectAddress={setSelectedAddress}
            onDeleteAddress={handleDeleteAddress}
            addressDeleting={addressDeleting}
            addrLoading={addrLoading}
            divider={divider}
            surface={surface}
            surface2={surface2}
            ink={ink}
            subInk={subInk}
            theme={theme}
            colors={colors}
          />
        </Grid>

        {/* Right */}
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 1,
              border: `1px solid ${divider}`,
              background: surface,
              backdropFilter: "blur(12px)",
              position: { md: "sticky" },
              top: { md: 86 },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 1,
                  display: "grid",
                  placeItems: "center",
                  background: surface2,
                  border: `1px solid ${divider}`,
                }}
              >
                <LockCheckoutIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: ink }}>
                  Order Summary
                </Typography>
                <Typography variant="body2" sx={{ color: subInk, fontWeight: 700 }}>
                  Review items and place order.
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 1.5, opacity: 0.12 }} />

            {!userId ? (
              <Typography sx={{ mt: 1, fontWeight: 600, color: subInk }}>
                Please login to checkout.
              </Typography>
            ) : !cart ? (
              <Typography sx={{ mt: 1, fontWeight: 600, color: subInk }}>
                Loading cart...
              </Typography>
            ) : cart.items && cart.items.length === 0 ? (
              <Typography sx={{ mt: 1, fontWeight: 600, color: subInk }}>
                Your cart is empty.
              </Typography>
            ) : (
              <Box>
                <Stack spacing={1.2}>
                  {cart.items.map((it) => (
                    <Box
                      key={it.id}
                      sx={{
                        p: 1.2,
                        borderRadius: 1,
                        border: `1px solid ${divider}`,
                        background: surface2,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, color: ink, lineHeight: 1.2 }}>
                            {it.product?.name || "Item"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: subInk, fontWeight: 600 }}>
                            Line: {money(it.line_total)}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Tooltip title="Decrease">
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
                            label={it.qty}
                            sx={{
                              borderRadius: 1,
                              fontWeight: 700,
                              background: surface,
                              border: `1px solid ${divider}`,
                              color: ink,
                              minWidth: 44,
                            }}
                          />

                          <Tooltip title="Increase">
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

                          <Tooltip title="Remove item">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteItem(it)}
                                disabled={processing[it.id]}
                                sx={{
                                  borderRadius: 1,
                                  border: `1px solid ${divider}`,
                                  background:
                                    theme.palette.mode === "dark" ? "rgba(250,92,92,0.12)" : "rgba(250,92,92,0.10)",
                                  "&:hover": {
                                    background:
                                      theme.palette.mode === "dark" ? "rgba(250,92,92,0.16)" : "rgba(250,92,92,0.14)",
                                  },
                                }}
                              >
                                <DeleteOutlineIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 1.5, opacity: 0.12 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: subInk }}>
                    Subtotal
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.secondary.main,
                    }}
                  >
                    {money(cart.subtotal)}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.8 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: subInk }}>
                    Shipping Cost
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ink }}>
                    {money(selectedShippingCost)}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.8 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: subInk }}>
                    Total
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: theme.palette.secondary.main }}
                  >
                    {money(Number(cart.subtotal || 0) + Number(selectedShippingCost || 0))}
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    mt: 2,
                    p: 1.2,
                    borderRadius: 1,
                    border: `1px solid ${divider}`,
                    background: surface2,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: ink, mb: 1 }}>
                    Delivery Zone
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      variant={isOutsideDhaka === 0 ? "contained" : "outlined"}
                      onClick={() => setIsOutsideDhaka(0)}
                      startIcon={isOutsideDhaka === 0 ? <CheckIcon /> : null}
                      sx={{
                        flex: 1,
                        borderRadius: 1,
                        textTransform: "none",
                        fontWeight: 700,
                        borderColor: divider,
                        background: isOutsideDhaka === 0 ? theme.palette.secondary.main : surface,
                        color: isOutsideDhaka === 0 ? colors.gray[900] : ink,
                        "&:hover": {
                          background: isOutsideDhaka === 0 ? theme.palette.secondary.main : surface2,
                          borderColor: divider,
                          opacity: 0.92,
                        },
                      }}
                    >
                      Inside Dhaka
                    </Button>

                    <Button
                      variant={isOutsideDhaka === 1 ? "contained" : "outlined"}
                      onClick={() => setIsOutsideDhaka(1)}
                      startIcon={isOutsideDhaka === 1 ? <CheckIcon /> : null}
                      sx={{
                        flex: 1,
                        borderRadius: 1,
                        textTransform: "none",
                        fontWeight: 700,
                        borderColor: divider,
                        background: isOutsideDhaka === 1 ? theme.palette.secondary.main : surface,
                        color: isOutsideDhaka === 1 ? colors.gray[900] : ink,
                        "&:hover": {
                          background: isOutsideDhaka === 1 ? theme.palette.secondary.main : surface2,
                          borderColor: divider,
                          opacity: 0.92,
                        },
                      }}
                    >
                      Outside Dhaka
                    </Button>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    p: 1.2,
                    borderRadius: 1,
                    border: `1px solid ${divider}`,
                    background: surface2,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: ink, mb: 1 }}>
                    Payment Method
                  </Typography>
                  <Stack spacing={1}>
                    {[
                      { value: "cod", label: "Cash on Delivery", icon: <PaymentsIcon fontSize="small" /> },
                      { value: "online", label: "Online Payment", icon: <CreditCardIcon fontSize="small" /> },
                    ].map((method) => {
                      const selected = paymentMethod === method.value;

                      return (
                        <Box
                          key={method.value}
                          onClick={() => setPaymentMethod(method.value)}
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            border: `1px solid ${selected ? theme.palette.secondary.main : divider}`,
                            background: selected ? theme.palette.secondary.main : surface,
                            color: selected ? colors.gray[900] : ink,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            transition: "all 160ms ease",
                            "&:hover": {
                              background: selected ? theme.palette.secondary.main : surface2,
                              borderColor: selected ? theme.palette.secondary.main : divider,
                              opacity: 0.94,
                            },
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                            <Box sx={{ display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                              {method.icon}
                            </Box>
                            <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                              {method.label}
                            </Typography>
                          </Stack>

                          <Checkbox
                            checked={selected}
                            onChange={() => setPaymentMethod(method.value)}
                            sx={{
                              p: 0,
                              color: selected ? colors.gray[900] : subInk,
                              "&.Mui-checked": { color: colors.gray[900] },
                            }}
                            inputProps={{ "aria-label": method.label }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>

                <TextField
                  label="Note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{
                    mt: 2,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                      background: surface,
                      border: `1px solid ${divider}`,
                      "& fieldset": { borderColor: "transparent" },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: "grid", placeItems: "center", color: subInk }}>
                        <NotesIcon fontSize="small" />
                      </Box>
                    ),
                  }}
                />

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(-1)}
                    startIcon={<ArrowBackIcon />}
                    sx={{
                      borderRadius: 1,
                      textTransform: "none",
                      fontWeight: 600,
                       color: colors.primary[900],
                      borderColor: divider,
                      background: surface,
                      "&:hover": { background: surface2, borderColor: theme.palette.primary.main },
                    }}
                  >
                    Back
                  </Button>

                  <Button
                    variant="contained"
                    onClick={handleCheckout}
                    disabled={loadingCheckout}
                    startIcon={loadingCheckout ? null : paymentMethod === "online" ? <CreditCardIcon /> : <LockCheckoutIcon />}
                    sx={{
                      ml: "auto",
                      borderRadius: 1,
                      textTransform: "none",
                      fontWeight: 700,
                      px: 2.6,
                      background: theme.palette.secondary.main,
                      color: colors.bg[100],
                      boxShadow: "none",
                      "&:hover": { opacity: 0.92, boxShadow: "none" },
                      "&.Mui-disabled": { opacity: 0.55 },
                    }}
                  >
                    {loadingCheckout ? <CircularProgress size={18} /> : paymentMethod === "online" ? "Continue to Payment" : "Place Order"}
                  </Button>
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Address modal */}
      <Dialog
        open={openAddressModal}
        onClose={() => {
          if (adding) return;
          // If there are zero addresses, keep it open so user must add one
          if (addresses.length === 0) return;
          setOpenAddressModal(false);
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 1,
            border: `1px solid ${divider}`,
            background: surface,
            backdropFilter: "blur(14px)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box
            sx={{
              color: theme.palette.secondary.main,
            }}
          >
            You must add at least one address to place an order.
          </Box>

          <Tooltip title={addresses.length === 0 ? "Add an address to continue" : "Close"}>
            <span>
              <IconButton
                disabled={addresses.length === 0}
                onClick={() => setOpenAddressModal(false)}
                sx={{ borderRadius: 1, border: `1px solid ${divider}`, background: surface }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "grid", gap: 1.2, mt: 1 }}>
            <TextField
              label="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
                  background: surface,
                  border: `1px solid ${divider}`,
                  "& fieldset": { borderColor: "transparent" },
                },
              }}
            />
            <TextField
              label="Mobile"
              value={newMobile}
              onChange={(e) => setNewMobile(e.target.value)}
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
                  background: surface,
                  border: `1px solid ${divider}`,
                  "& fieldset": { borderColor: "transparent" },
                },
              }}
            />

            <Grid container spacing={1.2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Division"
                  value={newDivision}
                  onChange={(e) => setNewDivision(e.target.value)}
                  size="small"
                  fullWidth
                  select
                  disabled={loadingDivisions}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                      background: surface,
                      border: `1px solid ${divider}`,
                      "& fieldset": { borderColor: "transparent" },
                    },
                  }}
                >
                  {divisions.map((d) => (
                    <MenuItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="District"
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  size="small"
                  fullWidth
                  select
                  disabled={!newDivision || loadingDistricts}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                      background: surface,
                      border: `1px solid ${divider}`,
                      "& fieldset": { borderColor: "transparent" },
                    },
                  }}
                >
                  {districts.map((d) => (
                    <MenuItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Area"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              size="small"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
                  background: surface,
                  border: `1px solid ${divider}`,
                  "& fieldset": { borderColor: "transparent" },
                },
              }}
            />

            <TextField
              label="Address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              size="small"
              multiline
              minRows={3}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
                  background: surface,
                  border: `1px solid ${divider}`,
                  "& fieldset": { borderColor: "transparent" },
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={resetNewAddress}
            disabled={adding}
            sx={{
              borderRadius: 1,
              textTransform: "none",
              fontWeight: 600,
               color: colors.gray[100],
              borderColor: divider,
              background: surface,
              "&:hover": { background: surface2 },
            }}
          >
            Clear
          </Button>

          <Button
            variant="contained"
            onClick={handleAddAddress}
            disabled={adding}
            startIcon={adding ? null : <AddIcon />}
            sx={{
              ml: "auto",
              borderRadius: 1,
              textTransform: "none",
              fontWeight: 700,
              px: 2.4,
              background: theme.palette.secondary.main,
              color: colors.gray[900],
              boxShadow: "none",
              "&:hover": { opacity: 0.92, boxShadow: "none" },
              "&.Mui-disabled": { opacity: 0.55 },
            }}
          >
            {adding ? <CircularProgress size={18} /> : "Save address"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!msg} autoHideDuration={3000} onClose={() => setMsg("")} message={msg} />
    </Box>
  );
};

export default ProceedOrder;
