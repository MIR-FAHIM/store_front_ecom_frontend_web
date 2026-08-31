import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
  Autocomplete,
  Button,
  Pagination,
  Alert,
} from "@mui/material";
import {
  Add,
  Remove,
  Refresh,
  Search,
  ShoppingCartOutlined,
  Close,
  Check,
  Inventory2Outlined,
  LocationOnOutlined,
} from "@mui/icons-material";
import { tokens } from "../../../theme";
import { getProduct } from "../../../api/controller/admin_controller/product/product_controller.jsx";
import { getCategory } from "../../../api/controller/admin_controller/product/setting_controller.jsx";
import { getBrand } from "../../../api/controller/admin_controller/brand/brand_controller.jsx";
import { getAllCustomers } from "../../../api/controller/admin_controller/user_controller.jsx";
import { addCart, deleteItem, getCartByUser, updateQuantity } from "../../../api/controller/admin_controller/order/cart_controller.jsx";
import { checkOutOrder, getOrderDetails } from "../../../api/controller/admin_controller/order/order_controller.jsx";
import { getUserAddresses, addUserAddress } from "../../../api/controller/admin_controller/order/user_address_controller.jsx";
import { getDivisions, getDistricts } from "../../../api/controller/admin_controller/delivery/delivery_controller.jsx";
import { addCustomerPreference } from "../../../api/controller/customer_preference/customer_preference_controller.jsx";
import SmartProductCard from "../../a_frontend_ui/home/components/ProductCard.jsx";

const moneyBDT = (n) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(Number(n || 0));

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
  return [];
};

const mergeById = (current, incoming) => {
  const map = new Map();
  [...current, ...incoming].forEach((item) => {
    const key = item?.id ?? item?.user_id ?? item?.email ?? item?.phone ?? item?.mobile;
    if (key != null) map.set(String(key), item);
  });
  return Array.from(map.values());
};

const cleanText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value.name || value.bn_name || fallback;
  const text = String(value)
    .replace(/\[object Object\]/g, "")
    .replace(/\s*,\s*,/g, ", ")
    .replace(/,\s*$/g, "")
    .trim();
  return text || fallback;
};

const formatAddressLine = (address) => {
  if (!address) return "";
  return [
    cleanText(address.address),
    cleanText(address.area),
    cleanText(address.district?.name || address.district),
  ].filter(Boolean).join(", ");
};

export default function PosManagementSeller() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerLastPage, setCustomerLastPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [brandId, setBrandId] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const [tab, setTab] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    mobile: "",
    division: "",
    district: "",
    area: "",
    address: "",
  });
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [serverCart, setServerCart] = useState(null);
  const [localCart, setLocalCart] = useState([]);
  const [msg, setMsg] = useState("");
  const [customerPreferenceMsg, setCustomerPreferenceMsg] = useState("");
  const [customerPreferenceSaving, setCustomerPreferenceSaving] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [isOutsideDhaka, setIsOutsideDhaka] = useState(0);

  const [walkIn, setWalkIn] = useState({ name: "", phone: "", email: "", address: "", note: "" });
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [createCustomerSaving, setCreateCustomerSaving] = useState(false);
  const [createCustomerErrors, setCreateCustomerErrors] = useState({});
  const [newPosCustomer, setNewPosCustomer] = useState({ name: "", phone: "", email: "", address: "", password: "" });
  const [shipping, setShipping] = useState({ address: "", zone: "" });

  const loadMeta = async () => {
    setLoading(true);
    try {
      const [catRes, brandRes] = await Promise.all([
        getCategory(),
        getBrand(),
      ]);

      setCategories(normalizeList(catRes?.data?.data ?? catRes));
      setBrands(normalizeList(brandRes?.data?.data ?? brandRes));
    } catch (e) {
      console.error("POS load error:", e);
      setMsg("Failed to load POS data");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async ({ page: nextPage = 1, searchTerm = customerSearch, append = false } = {}) => {
    setCustomersLoading(true);
    try {
      const res = await getAllCustomers({
        page: nextPage,
        per_page: 20,
        search: searchTerm ? searchTerm.trim() : undefined,
      });
      const payload = res?.data ?? res;
      const paginator = payload?.data && !Array.isArray(payload?.data) ? payload.data : payload;
      const list = normalizeList(payload);
      const current = Number(paginator?.current_page ?? nextPage);
      const last = Number(paginator?.last_page ?? Math.max(1, current));

      setCustomers((prev) => (append ? mergeById(prev, list) : list));
      setCustomerPage(current);
      setCustomerLastPage(last);
    } catch (e) {
      console.error("POS customers error:", e);
      if (!append) setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  };

  const loadProducts = async (opts = {}) => {
    const nextSearch = typeof opts.search === "string" ? opts.search : search;
    const nextCategory = opts.categoryId ?? categoryId;
    const nextBrand = opts.brandId ?? brandId;
    const nextPage = opts.page ?? page;
    const nextPerPage = opts.perPage ?? perPage;

    setLoadingProducts(true);
    try {
      const params = {
        page: nextPage,
        per_page: nextPerPage,
        category_id: nextCategory !== "all" ? nextCategory : undefined,
        brand_id: nextBrand !== "all" ? nextBrand : undefined,
        shop_id: opts.shopId ?? undefined,
        user_id: localStorage.getItem("userId") ?? undefined,
        search: nextSearch ? nextSearch.trim() : undefined,
      };

      const res = await getProduct(params);
      const payload = res?.data ?? res;
      const list = normalizeList(payload);
      const paginator = payload?.data && !Array.isArray(payload?.data) ? payload.data : payload;
      const total = Number(paginator?.total ?? list.length);
      const per = Number(paginator?.per_page ?? nextPerPage);
      const last = Number(paginator?.last_page ?? Math.max(1, Math.ceil(total / Math.max(1, per))));
      const current = Number(paginator?.current_page ?? nextPage);

      setProducts(list);
      setTotalProducts(total);
      setPerPage(per);
      setLastPage(last);
      setPage(current);
    } catch (e) {
      console.error("POS products error:", e);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadMeta();
    loadCustomers({ page: 1, searchTerm: customerSearch, append: false });
    loadProducts({ search, categoryId, brandId, page: 1, perPage });
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      loadCustomers({ page: 1, searchTerm: customerSearch, append: false });
    }, 300);
    return () => clearTimeout(handle);
  }, [customerSearch]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      loadProducts({ search, categoryId, brandId, page: 1, perPage });
    }, 300);
    return () => clearTimeout(handle);
  }, [search, categoryId, brandId]);

  const handlePageChange = (_event, value) => {
    setPage(value);
    loadProducts({ search, categoryId, brandId, page: value, perPage });
  };

  const loadServerCart = async (customerId) => {
    if (!customerId) {
      setServerCart(null);
      return;
    }
    try {
      const res = await getCartByUser(customerId);
      if (res?.status === "success") setServerCart(res.data);
      else setServerCart(res?.data ?? null);
    } catch (e) {
      console.error("POS cart error:", e);
      setServerCart(null);
    }
  };

  useEffect(() => {
    if (tab === 0 && selectedCustomer?.id) {
      loadServerCart(selectedCustomer.id);
    }
  }, [selectedCustomer, tab]);

  useEffect(() => {
    if (tab !== 0) return;
    const customerId = selectedCustomer?.id;
    setCustomerPreferenceMsg("");
    setNewAddress((prev) => ({
      ...prev,
      name: selectedCustomer?.name || "",
      mobile: selectedCustomer?.mobile || selectedCustomer?.phone || "",
    }));
    loadCustomerAddresses(customerId);
  }, [selectedCustomer?.id, tab]);

  const handleAddSelectedCustomerPreference = async () => {
    if (!selectedCustomer?.id || customerPreferenceSaving) return;
    setCustomerPreferenceSaving(true);
    setCustomerPreferenceMsg("");
    const res = await addCustomerPreference(selectedCustomer.id);
    setCustomerPreferenceSaving(false);

    if (res?.status === "error") {
      const message =
        res?.statusCode === 403
          ? "You do not have permission."
          : res?.statusCode === 404
            ? "Customer or seller not found."
            : res?.message || "Could not add customer to your list.";
      setCustomerPreferenceMsg(message);
      setMsg(message);
      return;
    }

    setCustomerPreferenceMsg("Added to customer list");
  };

  const createSellerCustomer = async (input) => {
    const payload = {
      name: (input.name || "").trim(),
      phone: (input.phone || "").trim(),
      email: (input.email || "").trim(),
      address: (input.address || "").trim(),
      password: input.password || "",
    };

    if (!payload.name && !payload.phone && !payload.email) {
      return {
        ok: false,
        errors: { form: ["Add at least a name, phone, or email."] },
        message: "Add at least a name, phone, or email.",
      };
    }

    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") delete payload[key];
    });

    const res = await addCustomerPreference(payload);
    if (res?.status === "error") {
      const message =
        res?.statusCode === 403
          ? "You cannot add customer for another seller"
          : res?.statusCode === 404
            ? "Seller or customer not found"
            : res?.statusCode === 500
              ? "Something went wrong. Please try again."
              : res?.message || "Failed to create customer";
      return { ok: false, errors: res?.errors || { form: [message] }, message };
    }

    const customer = res?.data?.customer || res?.customer || res?.data?.user || res?.data;
    if (!customer?.id) {
      return { ok: false, errors: { form: ["Customer created, but the response did not include customer id."] }, message: "Customer id missing from response" };
    }

    setCustomers((prev) => mergeById(prev, [customer]));
    setSelectedCustomer(customer);
    setTab(0);
    setCustomerPreferenceMsg("Added to customer list");
    return { ok: true, customer, message: res?.message || "Customer added successfully" };
  };

  const handleCreatePosCustomer = async () => {
    setCreateCustomerErrors({});
    setCreateCustomerSaving(true);
    const result = await createSellerCustomer(newPosCustomer);
    setCreateCustomerSaving(false);

    if (!result.ok) {
      setCreateCustomerErrors(result.errors || {});
      setMsg(result.message || "Failed to create customer");
      return;
    }

    setCreateCustomerOpen(false);
    setNewPosCustomer({ name: "", phone: "", email: "", address: "", password: "" });
    setMsg("Customer added successfully");
  };

  useEffect(() => {
    const loadDivisions = async () => {
      setLoadingDivisions(true);
      try {
        const res = await getDivisions();
        setDivisions(normalizeList(res?.data ?? res));
      } catch (e) {
        console.error("POS divisions error:", e);
        setDivisions([]);
      } finally {
        setLoadingDivisions(false);
      }
    };
    loadDivisions();
  }, []);

  useEffect(() => {
    if (!newAddress.division) {
      setDistricts([]);
      return;
    }
    const loadDistrictList = async () => {
      setLoadingDistricts(true);
      try {
        const res = await getDistricts(newAddress.division);
        setDistricts(normalizeList(res?.data ?? res));
      } catch (e) {
        console.error("POS districts error:", e);
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };
    loadDistrictList();
  }, [newAddress.division]);

  const handleAddProduct = async (product) => {
    if (tab === 0) {
      if (!selectedCustomer?.id) {
        setMsg("Select a customer first");
        return;
      }
      const res = await addCart({ user_id: selectedCustomer.id, product_id: product.id, qty: 1 });
      if (res?.status === "success") {
        loadServerCart(selectedCustomer.id);
      } else {
        setMsg(res?.message || "Failed to add item");
      }
      return;
    }

    setLocalCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateLocalQty = (productId, nextQty) => {
    if (nextQty < 1) return;
    setLocalCart((prev) => prev.map((i) => (i.product.id === productId ? { ...i, qty: nextQty } : i)));
  };

  const removeLocalItem = (productId) => {
    setLocalCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleServerQty = async (item, nextQty) => {
    if (nextQty < 1) return;
    const res = await updateQuantity(item.id, nextQty);
    if (res?.status === "success") {
      loadServerCart(selectedCustomer?.id);
    } else {
      setMsg(res?.message || "Failed to update quantity");
    }
  };

  const handleServerRemove = async (item) => {
    const res = await deleteItem(item.id);
    if (res?.status === "success") {
      loadServerCart(selectedCustomer?.id);
    } else {
      setMsg(res?.message || "Failed to remove item");
    }
  };

  const localSubtotal = useMemo(() => {
    return localCart.reduce((sum, i) => sum + Number(i.product?.unit_price || i.product?.price || 0) * i.qty, 0);
  }, [localCart]);

  const serverSubtotal = Number(serverCart?.subtotal || 0);
  const total = tab === 0 ? serverSubtotal : localSubtotal;
  const selectedShippingCost = isOutsideDhaka === 1 ? 120 : 60;
  const checkoutTotal = Number(total || 0) + Number(selectedShippingCost || 0);
  const selectedAddress = useMemo(
    () => customerAddresses.find((address) => String(address.id) === String(selectedAddressId)) || null,
    [customerAddresses, selectedAddressId]
  );
  const cartItemsCount = useMemo(() => {
    if (tab === 0) {
      return (serverCart?.items || []).reduce((sum, item) => sum + Number(item?.qty || 0), 0);
    }
    return localCart.reduce((sum, item) => sum + Number(item?.qty || 0), 0);
  }, [localCart, serverCart?.items, tab]);

  const resetNewAddress = () => {
    setNewAddress({
      name: selectedCustomer?.name || "",
      mobile: selectedCustomer?.mobile || selectedCustomer?.phone || "",
      division: "",
      district: "",
      area: "",
      address: "",
    });
  };

  const loadCustomerAddresses = async (customerId) => {
    if (!customerId) {
      setCustomerAddresses([]);
      setSelectedAddressId("");
      setShowAddressForm(false);
      return;
    }

    setAddressLoading(true);
    try {
      const res = await getUserAddresses(customerId);
      const list = normalizeList(res?.data ?? res);
      setCustomerAddresses(list);
      setSelectedAddressId((prev) => {
        if (prev && list.some((address) => String(address.id) === String(prev))) return prev;
        return list[0]?.id ? String(list[0].id) : "";
      });
      setShowAddressForm(list.length === 0);
    } catch (e) {
      console.error("POS customer addresses error:", e);
      setCustomerAddresses([]);
      setSelectedAddressId("");
      setShowAddressForm(true);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddCustomerAddress = async () => {
    if (!selectedCustomer?.id) {
      setMsg("Select a customer first");
      return;
    }

    if (!newAddress.name || !newAddress.mobile || !newAddress.address || !newAddress.division || !newAddress.district) {
      setMsg("Please fill name, mobile, division, district and address");
      return;
    }

    setAddressSaving(true);
    try {
      const form = new FormData();
      form.append("user_id", selectedCustomer.id);
      form.append("name", newAddress.name);
      form.append("mobile", newAddress.mobile);
      form.append("division", newAddress.division);
      form.append("district", newAddress.district);
      form.append("area", newAddress.area);
      form.append("address", newAddress.address);

      const res = await addUserAddress(form);
      const ok = res?.data?.status === "success" || res?.status === 200 || res?.status === "success";
      if (!ok) {
        setMsg(res?.data?.message || res?.message || "Failed to add address");
        return;
      }

      setMsg(res?.data?.message || "Address added");
      setShowAddressForm(false);
      resetNewAddress();
      await loadCustomerAddresses(selectedCustomer.id);
    } catch (e) {
      console.error("POS add address error:", e);
      setMsg(e?.response?.data?.message || "Failed to add address");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleCreateWalkInCustomer = async () => {
    if (!walkIn.name || !walkIn.phone) {
      setMsg("Walk-in name and phone are required");
      return null;
    }

    const result = await createSellerCustomer({
      name: walkIn.name,
      phone: walkIn.phone,
      email: walkIn.email,
      address: walkIn.address,
    });

    if (!result.ok) {
      setMsg(result.message || "Failed to create walk-in customer");
      return null;
    }

    return result.customer.id;
  };

  const handleCheckout = async () => {
    if (placing) return;
    setPlacing(true);

    try {
      if (tab === 0 && (!serverCart || !Array.isArray(serverCart.items) || serverCart.items.length === 0)) {
        setMsg("Cart is empty");
        setPlacing(false);
        return;
      }
      if (tab === 1 && localCart.length === 0) {
        setMsg("Cart is empty");
        setPlacing(false);
        return;
      }

      let customerId = selectedCustomer?.id || null;
      let customerName = selectedCustomer?.name || walkIn.name;
      let customerPhone = selectedCustomer?.mobile || selectedCustomer?.phone || walkIn.phone;

      if (tab === 1) {
        customerId = await handleCreateWalkInCustomer();
        if (!customerId) {
          setPlacing(false);
          return;
        }

        for (const item of localCart) {
          await addCart({ user_id: customerId, product_id: item.product.id, qty: item.qty });
        }
        await loadServerCart(customerId);
      }

      if (!customerId) {
        setMsg("Select a customer to place order");
        setPlacing(false);
        return;
      }

      if (tab === 0 && !selectedAddress) {
        setShowAddressForm(true);
        setMsg("Select or add a customer address first");
        setPlacing(false);
        return;
      }

      if (tab === 0 && selectedAddress) {
        customerName = selectedAddress.name || customerName;
        customerPhone = selectedAddress.mobile || customerPhone;
      }

      const shippingAddress = tab === 0 && selectedAddress
        ? formatAddressLine(selectedAddress)
        : shipping.address || walkIn.address || "POS Counter";
      const shippingZone = tab === 0 && selectedAddress
        ? cleanText(selectedAddress.district?.name || selectedAddress.district)
        : shipping.zone || "";

      const form = new FormData();
      form.append("user_id", customerId);
      if (tab === 0 && selectedAddress?.id) {
        form.append("user_address_id", String(selectedAddress.id));
      }
      form.append("customer_name", customerName || "Walk-in");
      form.append("customer_phone", customerPhone || "");
      form.append("shipping_address", shippingAddress);
      form.append("zone", shippingZone);
      form.append("is_outside_dhaka", String(isOutsideDhaka));
      form.append("shipping_cost", String(selectedShippingCost));
      form.append("amount", String(checkoutTotal));
      form.append("total_amount", String(checkoutTotal));
      form.append("payment_method", "cod");
      form.append("note", walkIn.note || "POS order");
      form.append("platform", "web");

      const res = await checkOutOrder(form);
      const ok = res?.data?.status === "success" || res?.status === 200;

      if (ok) {
        const orderId =
          res?.data?.data?.order_id ??
          res?.data?.data?.id ??
          res?.data?.order?.id ??
          res?.data?.data?.order?.id ??
          res?.data?.order_id ??
          res?.data?.id ??
          res?.order_id ??
          res?.id ??
          null;

        setMsg(res?.data?.message || "Order placed");
        setLocalCart([]);
        setServerCart(null);

        if (orderId) {
          try {
            await getOrderDetails(orderId);
          } catch (e) {
            console.error("POS order details error:", e);
          }
          navigate(`/seller/orders/${orderId}`);
        }
      } else {
        setMsg(res?.data?.message || "Failed to place order");
      }
    } catch (e) {
      console.error("POS checkout error:", e);
      setMsg("Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2.5 },
        minHeight: "100vh",
        background: theme.palette.mode === "dark" ? colors.primary[500] : "#f6f7fb",
        "& .MuiButton-root": { color: "#000" },
        "& .MuiButton-contained": { color: "#000" },
        "& .MuiButton-outlined": { color: "#000" },
        "& .pc-cart-bar .MuiButton-root": { color: "#fff" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "#eef2ff",
              color: "#4f46e5",
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <ShoppingCartOutlined />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
              Seller POS
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Fast product selling for selected customers or walk-in orders
            </Typography>
          </Box>
        </Stack>
        <IconButton
          onClick={() => {
            loadMeta();
            loadCustomers({ page: 1, searchTerm: customerSearch, append: false });
            loadProducts({ search, categoryId, brandId, page, perPage });
          }}
          disabled={loading || loadingProducts}
          sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: colors.primary[400], borderRadius: 2 }}
        >
          <Refresh />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: 1.5,
          mb: 2,
        }}
      >
        {[
          { label: "Products Found", value: totalProducts, tone: "#4f46e5" },
          { label: "Cart Items", value: cartItemsCount, tone: "#059669" },
          { label: "Order Total", value: moneyBDT(checkoutTotal), tone: "#ea580c" },
        ].map((item) => (
          <Card
            key={item.label}
            sx={{
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.palette.mode === "dark" ? "none" : "0 10px 26px rgba(15,23,42,0.05)",
            }}
          >
            <CardContent sx={{ p: 1.6, "&:last-child": { pb: 1.6 } }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800, textTransform: "uppercase" }}>
                {item.label}
              </Typography>
              <Typography sx={{ mt: 0.4, color: item.tone, fontSize: 22, fontWeight: 900, lineHeight: 1.15 }}>
                {item.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2.2fr 1fr" }, gap: 2 }}>
        {/* Left panel: Products */}
        <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.palette.mode === "dark" ? "none" : "0 12px 30px rgba(15,23,42,0.06)" }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 900 }}>Product Catalog</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  {totalProducts} item{totalProducts === 1 ? "" : "s"} ready to sell
                </Typography>
              </Box>
              <Chip
                size="small"
                label={`Page ${page} of ${lastPage}`}
                variant="outlined"
                sx={{ alignSelf: { xs: "flex-start", sm: "center" }, fontWeight: 800 }}
              />
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" },
                gap: 1.5,
                alignItems: "center",
                mb: 2,
              }}
            >
              <TextField
                size="small"
                placeholder="Search by Product Name/Barcode"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
              />
              <TextField
                size="small"
                select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <MenuItem value="all">All categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.name || c.title || "Category"}
                  </MenuItem>
                ))}
              </TextField>
              <TextField size="small" select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                <MenuItem value="all">All Brands</MenuItem>
                {brands.map((b) => (
                  <MenuItem key={b.id} value={String(b.id)}>
                    {b.name || b.title || "Brand"}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {loadingProducts ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: "repeat(3, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                    lg: "repeat(5, minmax(0, 1fr))",
                  },
                }}
              >
                {products.length === 0 ? (
                  <Box
                    sx={{
                      gridColumn: "1 / -1",
                      py: 7,
                      textAlign: "center",
                      border: `1px dashed ${theme.palette.divider}`,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === "dark" ? colors.primary[500] : "#f8fafc",
                    }}
                  >
                    <Inventory2Outlined sx={{ fontSize: 42, color: "text.disabled", mb: 1 }} />
                    <Typography sx={{ fontWeight: 900 }}>No products found</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Try changing search, category, or brand filters.
                    </Typography>
                  </Box>
                ) : (
                  products.map((p) => (
                    <SmartProductCard
                      key={p.id}
                      product={p}
                      inCart={false}
                      showWishlist={false}
                      syncUserState={false}
                      addToCartLabel="Add"
                      alwaysShowCartBar
                      onAddToCart={handleAddProduct}
                    />
                  ))
                )}
              </Box>
            )}

            {lastPage > 1 ? (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Pagination
                  count={lastPage}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                />
              </Box>
            ) : null}
          </CardContent>
        </Card>

        {/* Right panel: Customer + Cart */}
        <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.palette.mode === "dark" ? "none" : "0 12px 30px rgba(15,23,42,0.06)" }}>
          <CardContent sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <Tabs
              value={tab}
              onChange={(_e, v) => setTab(v)}
              sx={{
                "& .MuiTab-root": { color: "#000" },
                "& .Mui-selected": { color: "#000" },
                "& .MuiTabs-indicator": { backgroundColor: "#000" },
              }}
            >
              <Tab label="Customer" />
              <Tab label="Walk In" />
            </Tabs>

            {tab === 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Autocomplete
                  options={customers}
                  value={selectedCustomer}
                  onChange={(_e, v) => setSelectedCustomer(v)}
                  openOnFocus
                  onInputChange={(_event, value, reason) => {
                    if (reason === "input" || reason === "clear") {
                      setCustomerSearch(value);
                    }
                  }}
                  loading={customersLoading}
                  filterOptions={(options) => options}
                  getOptionLabel={(o) => {
                    if (typeof o === "string") return o;
                    return `${o?.name || "Customer"} (${o?.mobile || o?.phone || ""})`;
                  }}
                  isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
                  ListboxProps={{
                    onScroll: (event) => {
                      const listbox = event.currentTarget;
                      const nearBottom = listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 24;
                      if (nearBottom && !customersLoading && customerPage < customerLastPage) {
                        loadCustomers({ page: customerPage + 1, searchTerm: customerSearch, append: true });
                      }
                    },
                  }}
                  loadingText="Loading customers..."
                  noOptionsText={customerSearch ? "No customers match this search" : "No customers found"}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <Box component="li" {...optionProps} key={key || option?.id}>
                        <Stack sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                            {option?.name || "Customer"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                            {option?.mobile || option?.phone || "No phone"} {option?.email ? `- ${option.email}` : ""}
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Search / Select customer"
                      placeholder="Search by name or mobile"
                      helperText={`Loaded ${customers.length} customer${customers.length === 1 ? "" : "s"}${customerPage < customerLastPage ? " - scroll for more" : ""}`}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <Search sx={{ mr: 1, color: "text.secondary", fontSize: 18 }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {customersLoading ? <CircularProgress color="inherit" size={16} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setCreateCustomerOpen(true)}
                  sx={{ alignSelf: "flex-start", borderRadius: 1, textTransform: "none", fontWeight: 800 }}
                >
                  Create New Customer
                </Button>
                {selectedCustomer ? (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      {selectedCustomer?.email || "No email"}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {customerPreferenceMsg ? (
                        <Typography
                          variant="caption"
                          sx={{
                            color: customerPreferenceMsg === "Added to customer list" ? "success.main" : "warning.main",
                            fontWeight: 800,
                          }}
                        >
                          {customerPreferenceMsg}
                        </Typography>
                      ) : null}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleAddSelectedCustomerPreference}
                        disabled={customerPreferenceSaving}
                        sx={{ borderRadius: 1, textTransform: "none", fontWeight: 800 }}
                      >
                        {customerPreferenceSaving ? "Adding..." : "Add to My Customer List"}
                      </Button>
                    </Stack>
                  </Stack>
                ) : null}
              </Box>
            ) : (
              <Box sx={{ display: "grid", gap: 1.2 }}>
                <TextField
                  size="small"
                  label="Walk in customer"
                  value={walkIn.name}
                  onChange={(e) => setWalkIn((prev) => ({ ...prev, name: e.target.value }))}
                />
                <TextField
                  size="small"
                  label="Phone"
                  value={walkIn.phone}
                  onChange={(e) => setWalkIn((prev) => ({ ...prev, phone: e.target.value }))}
                />
                <TextField
                  size="small"
                  label="Email (optional)"
                  value={walkIn.email}
                  onChange={(e) => setWalkIn((prev) => ({ ...prev, email: e.target.value }))}
                />
                <TextField
                  size="small"
                  label="Address"
                  value={walkIn.address}
                  onChange={(e) => setWalkIn((prev) => ({ ...prev, address: e.target.value }))}
                />
                <TextField
                  size="small"
                  label="Note"
                  value={walkIn.note}
                  onChange={(e) => setWalkIn((prev) => ({ ...prev, note: e.target.value }))}
                />
              </Box>
            )}

            <Divider />

            {tab === 0 ? (
              <Box sx={{ display: "grid", gap: 1.2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocationOnOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                      Customer Address
                    </Typography>
                  </Stack>
                  {selectedCustomer ? (
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => {
                        resetNewAddress();
                        setShowAddressForm((prev) => !prev);
                      }}
                      sx={{ textTransform: "none", fontWeight: 800 }}
                    >
                      {showAddressForm ? "Close" : "Add Address"}
                    </Button>
                  ) : null}
                </Stack>

                {!selectedCustomer ? (
                  <Box sx={{ p: 1.5, borderRadius: 2, border: `1px dashed ${theme.palette.divider}`, color: "text.secondary" }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Select a customer to see saved addresses.
                    </Typography>
                  </Box>
                ) : addressLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 700 }}>
                      Loading addresses...
                    </Typography>
                  </Stack>
                ) : customerAddresses.length > 0 ? (
                  <Stack spacing={1}>
                    {customerAddresses.map((address) => {
                      const selected = String(selectedAddressId) === String(address.id);
                      return (
                        <Box
                          key={address.id}
                          onClick={() => setSelectedAddressId(String(address.id))}
                          sx={{
                            p: 1.2,
                            borderRadius: 2,
                            cursor: "pointer",
                            border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
                            bgcolor: selected ? "rgba(99,102,241,0.08)" : colors.primary[400],
                            transition: "border-color 150ms ease, background 150ms ease",
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <LocationOnOutlined sx={{ fontSize: 18, color: selected ? theme.palette.primary.main : "text.secondary", mt: 0.2 }} />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>
                                {address.name || selectedCustomer?.name || "Customer"} {address.mobile ? `- ${address.mobile}` : ""}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                                {formatAddressLine(address) || "Address not available"}
                              </Typography>
                            </Box>
                            <Chip
                              size="small"
                              label={selected ? "Selected" : "Use"}
                              color={selected ? "primary" : "default"}
                              variant={selected ? "filled" : "outlined"}
                              sx={{ fontWeight: 800 }}
                            />
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Box sx={{ p: 1.5, borderRadius: 2, border: `1px dashed ${theme.palette.divider}`, bgcolor: colors.primary[400] }}>
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                      No saved address found
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                      Add an address for this customer before checkout.
                    </Typography>
                  </Box>
                )}

                {selectedCustomer && showAddressForm ? (
                  <Box sx={{ display: "grid", gap: 1.1, p: 1.3, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === "dark" ? colors.primary[500] : "#f8fafc" }}>
                    <TextField
                      size="small"
                      label="Name"
                      value={newAddress.name}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <TextField
                      size="small"
                      label="Mobile"
                      value={newAddress.mobile}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, mobile: e.target.value }))}
                    />
                    <TextField
                      size="small"
                      select
                      label="Division"
                      value={newAddress.division}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, division: e.target.value, district: "" }))}
                      disabled={loadingDivisions}
                    >
                      <MenuItem value="">{loadingDivisions ? "Loading..." : "Select division"}</MenuItem>
                      {divisions.map((division) => (
                        <MenuItem key={division.id} value={String(division.id)}>
                          {division.name || division.bn_name || `Division #${division.id}`}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      select
                      label="District"
                      value={newAddress.district}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, district: e.target.value }))}
                      disabled={!newAddress.division || loadingDistricts}
                    >
                      <MenuItem value="">
                        {loadingDistricts ? "Loading..." : newAddress.division ? "Select district" : "Select division first"}
                      </MenuItem>
                      {districts.map((district) => (
                        <MenuItem key={district.id} value={String(district.id)}>
                          {district.name || district.bn_name || `District #${district.id}`}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      label="Area"
                      value={newAddress.area}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, area: e.target.value }))}
                    />
                    <TextField
                      size="small"
                      label="Address"
                      multiline
                      minRows={2}
                      value={newAddress.address}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, address: e.target.value }))}
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" variant="outlined" onClick={resetNewAddress} disabled={addressSaving}>
                        Reset
                      </Button>
                      <Button size="small" variant="contained" onClick={handleAddCustomerAddress} disabled={addressSaving}>
                        {addressSaving ? <CircularProgress size={16} color="inherit" /> : "Save Address"}
                      </Button>
                    </Stack>
                  </Box>
                ) : null}
              </Box>
            ) : (
              <Box sx={{ display: "grid", gap: 1.2 }}>
                <TextField
                  size="small"
                  label="Shipping address"
                  value={shipping.address}
                  onChange={(e) => setShipping((prev) => ({ ...prev, address: e.target.value }))}
                />
                <TextField
                  size="small"
                  label="Zone"
                  value={shipping.zone}
                  onChange={(e) => setShipping((prev) => ({ ...prev, zone: e.target.value }))}
                />
              </Box>
            )}

            <Divider />

            <Box sx={{ display: "grid", gap: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  Delivery Zone
                </Typography>
                <Chip
                  size="small"
                  label={moneyBDT(selectedShippingCost)}
                  sx={{ fontWeight: 900 }}
                  color={isOutsideDhaka === 1 ? "warning" : "success"}
                  variant="outlined"
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  fullWidth
                  variant={isOutsideDhaka === 0 ? "contained" : "outlined"}
                  startIcon={isOutsideDhaka === 0 ? <Check /> : null}
                  onClick={() => setIsOutsideDhaka(0)}
                  sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
                >
                  Inside Dhaka
                </Button>
                <Button
                  fullWidth
                  variant={isOutsideDhaka === 1 ? "contained" : "outlined"}
                  startIcon={isOutsideDhaka === 1 ? <Check /> : null}
                  onClick={() => setIsOutsideDhaka(1)}
                  sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
                >
                  Outside Dhaka
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                Cart
              </Typography>

              {tab === 0 ? (
                !serverCart?.items?.length ? (
                  <Box sx={{ py: 6, textAlign: "center", color: colors.gray[300] }}>
                    No Product Added
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {serverCart.items.map((item) => (
                      <Box key={item.id} sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1, alignItems: "center" }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                            {item.product?.name || "Product"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {moneyBDT(item.unit_price)} x {item.qty}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <IconButton size="small" onClick={() => handleServerQty(item, item.qty - 1)}>
                            <Remove fontSize="small" />
                          </IconButton>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {item.qty}
                          </Typography>
                          <IconButton size="small" onClick={() => handleServerQty(item, item.qty + 1)}>
                            <Add fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleServerRemove(item)}>
                            <Close fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )
              ) : !localCart.length ? (
                <Box sx={{ py: 6, textAlign: "center", color: colors.gray[300] }}>
                  No Product Added
                </Box>
              ) : (
                <Stack spacing={1}>
                  {localCart.map((item) => (
                    <Box key={item.product.id} sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1, alignItems: "center" }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                          {item.product?.name || "Product"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {moneyBDT(item.product?.unit_price || item.product?.price || 0)} x {item.qty}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <IconButton size="small" onClick={() => updateLocalQty(item.product.id, item.qty - 1)}>
                          <Remove fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {item.qty}
                        </Typography>
                        <IconButton size="small" onClick={() => updateLocalQty(item.product.id, item.qty + 1)}>
                          <Add fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => removeLocalItem(item.product.id)}>
                          <Close fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            <Divider />

            <Box sx={{ display: "grid", gap: 0.6 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Sub Total</Typography>
                <Typography variant="body2" color="text.secondary">{moneyBDT(total)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Tax</Typography>
                <Typography variant="body2" color="text.secondary">{moneyBDT(0)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Shipping</Typography>
                <Typography variant="body2" color="text.secondary">{moneyBDT(selectedShippingCost)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Discount</Typography>
                <Typography variant="body2" color="text.secondary">{moneyBDT(0)}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Total</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{moneyBDT(checkoutTotal)}</Typography>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" size="small" disabled={placing}>
                Shipping
              </Button>
              <Button variant="outlined" size="small" disabled={placing}>
                Discount
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleCheckout}
                disabled={placing}
              >
                {placing ? <CircularProgress size={16} color="inherit" /> : "Place Order"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={createCustomerOpen} onClose={() => setCreateCustomerOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Customer</DialogTitle>
        <DialogContent>
          <Stack spacing={1.4} sx={{ mt: 1 }}>
            {createCustomerErrors?.form ? <Alert severity="warning">{createCustomerErrors.form[0]}</Alert> : null}
            <TextField
              autoFocus
              size="small"
              label="Name"
              value={newPosCustomer.name}
              onChange={(e) => setNewPosCustomer((prev) => ({ ...prev, name: e.target.value }))}
              error={Boolean(createCustomerErrors?.name)}
              helperText={createCustomerErrors?.name?.[0] || "Recommended"}
            />
            <TextField
              size="small"
              label="Phone"
              value={newPosCustomer.phone}
              onChange={(e) => setNewPosCustomer((prev) => ({ ...prev, phone: e.target.value }))}
              error={Boolean(createCustomerErrors?.phone)}
              helperText={createCustomerErrors?.phone?.[0] || "Primary field for POS"}
            />
            <TextField
              size="small"
              label="Email"
              value={newPosCustomer.email}
              onChange={(e) => setNewPosCustomer((prev) => ({ ...prev, email: e.target.value }))}
              error={Boolean(createCustomerErrors?.email)}
              helperText={createCustomerErrors?.email?.[0] || "Optional"}
            />
            <TextField
              size="small"
              label="Address"
              value={newPosCustomer.address}
              onChange={(e) => setNewPosCustomer((prev) => ({ ...prev, address: e.target.value }))}
              error={Boolean(createCustomerErrors?.address)}
              helperText={createCustomerErrors?.address?.[0] || "Optional"}
            />
            <TextField
              size="small"
              type="password"
              label="Password"
              value={newPosCustomer.password}
              onChange={(e) => setNewPosCustomer((prev) => ({ ...prev, password: e.target.value }))}
              error={Boolean(createCustomerErrors?.password)}
              helperText={createCustomerErrors?.password?.[0] || "Optional. Backend can create one if empty."}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateCustomerOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreatePosCustomer} disabled={createCustomerSaving} sx={{ textTransform: "none", fontWeight: 800 }}>
            {createCustomerSaving ? "Creating..." : "Create Customer"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!msg} autoHideDuration={3000} onClose={() => setMsg("")} message={msg} />
    </Box>
  );
}
