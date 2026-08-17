import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Link,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  Rating,
  useTheme,
} from "@mui/material";
import {
  FavoriteBorder,
  Favorite,
  ShoppingCartOutlined,
  ShoppingCart,
  LocalOffer,
  VisibilityOutlined,
  EditOutlined,
} from "@mui/icons-material";

import { image_file_url } from "../../../../api/config/index.jsx";
import { tokens } from "../../../../theme.js";
import { addCart, getCartByUser } from "../../../../api/controller/admin_controller/order/cart_controller.jsx";
import { getUserWish, addWish, deleteWish } from "../../../../api/controller/admin_controller/wishlist/wish_controller.jsx";
import { useNavigate } from "react-router-dom";
import { productDetailPath } from "../../../../utils/productRoute";

const safeArray = (x) => (Array.isArray(x) ? x : []);

let lastWishSync = 0;
let lastCartSync = 0;
let wishSyncPromise = null;
let cartSyncPromise = null;
const SYNC_TTL = 30 * 1000;

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : fallback;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

const syncWishlist = async (userId) => {
  if (!userId) return;
  const now = Date.now();
  if (now - lastWishSync < SYNC_TTL) return;
  if (wishSyncPromise) return wishSyncPromise;

  lastWishSync = now;
  wishSyncPromise = (async () => {
    const res = await getUserWish(userId);
    const list = res?.data?.data ?? res?.data ?? res ?? [];
    const arr = safeArray(list);

    const ids = [];
    const map = {};

    arr.forEach((item) => {
      const pid = item?.product_id ?? item?.product?.id;
      const wid = item?.id;
      if (pid) ids.push(Number(pid));
      if (pid && wid) map[String(pid)] = wid;
    });

    const unique = Array.from(new Set(ids));
    writeJson("wishlist", unique);
    writeJson("wishlistMap", map);
    window.dispatchEvent(new Event("wishlist-updated"));
  })().finally(() => {
    wishSyncPromise = null;
  });

  return wishSyncPromise;
};

const syncCart = async (userId, force = false) => {
  if (!userId) return;
  const now = Date.now();
  if (!force && now - lastCartSync < SYNC_TTL) return;
  if (cartSyncPromise) return cartSyncPromise;

  lastCartSync = now;
  cartSyncPromise = (async () => {
    const res = await getCartByUser(userId);
    const items = res?.data?.items ?? res?.data?.data?.items ?? res?.data?.data ?? res?.data ?? [];
    const arr = safeArray(items);
    const ids = arr
      .map((x) => x?.product_id ?? x?.product?.id)
      .filter((v) => v !== undefined && v !== null)
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v));

    writeJson("cartItems", ids);
    const total = res?.data?.total_items ?? arr.length;
    writeJson("cart", Number(total || 0));
    window.dispatchEvent(new Event("cart-updated"));
  })().finally(() => {
    cartSyncPromise = null;
  });

  return cartSyncPromise;
};

export default function SmartProductCard({
  product,
  inCart: inCartProp,
  inWish: inWishProp,
  onView,
  onEdit,
  onAddToCart,
  addToCartLabel,
  showWishlist = true,
  syncUserState = true,
  fromSeller = false,
  alwaysShowCartBar = false,
}) {
  const theme = useTheme();
  const navigate = useNavigate();

  const [userId, setUserId] = useState(() => {
    if (!syncUserState) return null;
    const id = localStorage.getItem("userId");
    return id ? String(id) : null;
  });
  const [inCart, setInCart] = useState(Boolean(inCartProp));
  const [inWish, setInWish] = useState(Boolean(inWishProp));

  const colors = tokens(theme.palette.mode);
  const divider = theme.palette.divider || colors.primary[200];

  const surface = colors.primary[400];
  const surface2 = colors.primary[300];
  const ink = colors.gray[100];
  const subInk = colors.gray[300];

  const accent = theme.palette.mode === "dark" ? colors.blueAccent[400] : colors.blueAccent[100];
  const detailHref = useMemo(() => productDetailPath(product), [product]);

  const money = (n) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(Number(n || 0));

  // Your API uses unit_price + discount info; keep fallbacks for older shapes
  const price = useMemo(() => Number(product?.unit_price ?? product?.price ?? 0), [product?.unit_price, product?.price]);

  // Compute discount from product_discount relation OR direct product fields, ignoring start/end date
  const discountInfo = useMemo(() => {
    // 1. Try product_discount relation
    const pd = product?.product_discount;
    if (pd) {
      const d = Number(pd.discount ?? 0);
      if (d > 0) {
        return { amount: d, type: String(pd.discount_type ?? "").toLowerCase() };
      }
    }

    // 2. Fallback: direct product fields (discount, discount_type)
    const d = Number(product?.discount ?? 0);
    if (d <= 0) return null;
    const type = String(product?.discount_type ?? "").toLowerCase();
    return { amount: d, type };
  }, [product?.product_discount, product?.discount, product?.discount_type]);

  const salePrice = useMemo(() => {
    // 1. Explicit sale_price from API
    const s = Number(product?.sale_price ?? 0);
    if (s > 0) return s;

    // 2. Compute from product_discount relation
    if (discountInfo && price > 0) {
      if (discountInfo.type === "percent") {
        return Math.round(price - (price * discountInfo.amount) / 100);
      }
      // flat / amount discount
      const flat = price - discountInfo.amount;
      return flat > 0 ? flat : 0;
    }

    return 0;
  }, [product?.sale_price, discountInfo, price]);

  const hasSale = useMemo(() => salePrice > 0 && salePrice < price, [salePrice, price]);

  const displayPrice = useMemo(() => (hasSale ? money(salePrice) : money(price)), [hasSale, salePrice, price]);

  const discountLabel = useMemo(() => {
    if (discountInfo) {
      if (discountInfo.type === "percent") return `${discountInfo.amount}% OFF`;
      if (discountInfo.type === "flat" || discountInfo.type === "amount") return `${money(discountInfo.amount)} OFF`;
    }

    if (hasSale && price > 0) {
      const pct = Math.round(((price - salePrice) / price) * 100);
      return pct > 0 ? `${pct}% OFF` : null;
    }

    return null;
  }, [discountInfo, hasSale, price, salePrice]);

  const ratingValue = useMemo(() => {
    const r = Number(product?.average_review?.average_rating);
    if (Number.isFinite(r) && r >= 0) return Math.min(5, r);
    return 4.5;
  }, [product?.average_review?.average_rating]);

  const reviewsCount = useMemo(() => {
    const n = Number(product?.average_review?.review_count);
    if (Number.isFinite(n) && n >= 0) return n;
    return 0;
  }, [product?.average_review?.review_count]);

  // IMPORTANT: your API image is product.primary_image.file_name = "all/....png"
  const imageUrl = useMemo(() => {
    const primary = product?.primary_image ?? product?.primaryImage ?? null;

    // Prefer url if you add it later
    const direct = primary?.url;
    if (direct && /^https?:\/\//i.test(String(direct))) return String(direct);

    const file = primary?.file_name;
    if (file) {
      const safeFile = String(file).replaceAll("\\/", "/").replace(/^\/+/, "");
      const base = String(image_file_url || "").replace(/\/+$/, "");
      return `${base}/${safeFile}`;
    }

    // If someday you change API to provide full URL in other fields
    const maybeUrl = product?.image || product?.file_name;
    if (maybeUrl && /^https?:\/\//i.test(String(maybeUrl))) return String(maybeUrl);

    return "https://via.placeholder.com/600x400?text=No+Image";
  }, [product?.primary_image, product?.primaryImage, product?.image, product?.file_name]);

  // Your API uses current_stock
  const outOfStock = useMemo(() => {
    if (typeof product?.current_stock === "number") return product.current_stock <= 0;
    if (typeof product?.stock_qty === "number") return product.stock_qty <= 0;
    if (typeof product?.stock === "number") return product.stock <= 0;
    return false;
  }, [product?.current_stock, product?.stock_qty, product?.stock]);

  const categoryLabel = useMemo(() => {
    // Your list response often has category = null, so keep it safe
    const name = product?.category?.name ?? product?.category?.title ?? null;
    if (name) return String(name);
    if (product?.sku) return `SKU: ${product.sku}`;
    return " ";
  }, [product?.category, product?.sku]);

  const refreshLocalStates = useCallback(() => {
    const ids = readJson("wishlist", []);
    setInWish(Array.isArray(ids) && ids.map(String).includes(String(product?.id)));

    const cartIds = readJson("cartItems", []);
    setInCart(Array.isArray(cartIds) && cartIds.map(String).includes(String(product?.id)));
  }, [product?.id]);

  useEffect(() => {
    if (!syncUserState) return;
    refreshLocalStates();
  }, [refreshLocalStates, syncUserState]);

  useEffect(() => {
    if (typeof inWishProp === "boolean") setInWish(inWishProp);
  }, [inWishProp]);

  useEffect(() => {
    if (typeof inCartProp === "boolean") setInCart(inCartProp);
  }, [inCartProp]);

  useEffect(() => {
    if (!syncUserState) return undefined;
    const onAuth = () => {
      const id = localStorage.getItem("userId");
      setUserId(id ? String(id) : null);
    };
    const onWish = () => refreshLocalStates();
    const onCart = () => refreshLocalStates();

    window.addEventListener("auth-changed", onAuth);
    window.addEventListener("wishlist-updated", onWish);
    window.addEventListener("cart-updated", onCart);

    return () => {
      window.removeEventListener("auth-changed", onAuth);
      window.removeEventListener("wishlist-updated", onWish);
      window.removeEventListener("cart-updated", onCart);
    };
  }, [refreshLocalStates, syncUserState]);

  useEffect(() => {
    if (!syncUserState) return;
    if (!userId) return;
    syncWishlist(userId).catch(() => null);
    syncCart(userId).catch(() => null);
  }, [syncUserState, userId]);

  const handleToggleWish = useCallback(async (e) => {
    e.stopPropagation();
    const pid = product?.id;
    if (!pid) return;

    const currentIds = readJson("wishlist", []);
    const has = currentIds.map(String).includes(String(pid));
    const next = has ? currentIds.filter((x) => String(x) !== String(pid)) : [...currentIds, pid];
    const unique = Array.from(new Set(next));
    writeJson("wishlist", unique);
    setInWish(!has);
    window.dispatchEvent(new Event("wishlist-updated"));

    if (!userId) return;

    try {
      if (has) {
        const map = readJson("wishlistMap", {});
        const wid = map?.[String(pid)] ?? pid;
        await deleteWish(wid);
        const nextMap = { ...map };
        delete nextMap[String(pid)];
        writeJson("wishlistMap", nextMap);
      } else {
        const res = await addWish({ user_id: userId, product_id: pid });
        const wid = res?.data?.id ?? res?.id ?? null;
        if (wid) {
          const map = readJson("wishlistMap", {});
          writeJson("wishlistMap", { ...map, [String(pid)]: wid });
        }
      }
      syncWishlist(userId).catch(() => null);
    } catch (err) {
      console.error("toggle wishlist error:", err);
      refreshLocalStates();
    }
  }, [product?.id, refreshLocalStates, userId]);

  const iconBtnSx = {
    width: 34,
    height: 34,
    borderRadius: 1.5,
    bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)",
    backdropFilter: "blur(8px)",
    border: `1px solid ${divider}`,
    color: ink,
    transition: "background 150ms ease, transform 150ms ease",
    "&:hover": { bgcolor: surface, transform: "scale(1.1)" },
  };

  const handleAddToCart = useCallback(async (e) => {
    e.stopPropagation();
    const pid = product?.id;
    if (!pid) return;
    if (onAddToCart) {
      try {
        await onAddToCart(product);
      } catch (err) {
        console.error("custom add to cart error:", err);
      }
      return;
    }
    if (!userId) {
      alert("Please login to add to cart.");
      return;
    }

    try {
      const res = await addCart({ user_id: userId, product_id: pid, qty: 1 });
      if (res?.status === "success") {
        const current = readJson("cartItems", []);
        const next = Array.isArray(current) ? [...current, pid] : [pid];
        const unique = Array.from(new Set(next.map(String))).map((v) => (Number.isFinite(Number(v)) ? Number(v) : v));
        writeJson("cartItems", unique);
        writeJson("cart", unique.length);
        setInCart(true);
        window.dispatchEvent(new Event("cart-updated"));
        await syncCart(userId, true);
      } else {
        alert(res?.message || "Failed to add to cart");
      }
    } catch (err) {
      console.error("add to cart error:", err);
      alert("Error adding to cart");
    }
  }, [onAddToCart, product, product?.id, userId]);

  const handleCardLinkClick = useCallback((e) => {
    if (!detailHref) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (onView) onView(product);
    else navigate(detailHref);
  }, [detailHref, navigate, onView, product]);

  return (
    <Card
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        border: `1px solid ${divider}`,
        background: surface,
        cursor: onView ? "pointer" : "default",
        transition: "transform 220ms ease, box-shadow 260ms ease, border-color 260ms ease",
        position: "relative",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 16px 40px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.11)"}`,
          borderColor: "#6366f1",
          "& .pc-actions": { opacity: 1, transform: "translateX(0)" },
          "& .pc-cart-bar": { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {/* â”€â”€ Image section â”€â”€ */}
      {detailHref && (
        <Box
          component="a"
          href={detailHref}
          aria-label={`View ${product?.name || "product"}`}
          onClick={handleCardLinkClick}
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            textDecoration: "none",
            color: "inherit",
          }}
        />
      )}
      <Box sx={{ position: "relative", overflow: "hidden" }}>
        <Box
          sx={{
            height: { xs: 220, sm: 210, md: 200 },
            background: surface2,
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={imageUrl}
            alt={product?.name || "product"}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://via.placeholder.com/600x400?text=No+Image";
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              transition: "transform 300ms ease",
              ".MuiCard-root:hover &": { transform: "scale(1.06)" },
            }}
          />
        </Box>

        {/* Top-left badge */}
        <Box sx={{ position: "absolute", left: 8, top: 8, pointerEvents: "none" }}>
          {outOfStock ? (
            <Chip
              label="Out of stock"
              size="small"
              sx={{ borderRadius: 1, fontWeight: 700, fontSize: 10, bgcolor: "#dc2626", color: "#fff" }}
            />
          ) : discountLabel ? (
            <Chip
              label={discountLabel}
              size="small"
              sx={{ borderRadius: 1, fontWeight: 700, fontSize: 10, bgcolor: "#dc2626", color: "#fff" }}
            />
          ) : null}
        </Box>

        {/* Action icons â€” hidden, slide in from right on hover */}
        <Stack
          className="pc-actions"
          spacing={0.8}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            zIndex: 3,
            opacity: 0,
            transform: "translateX(12px)",
            transition: "opacity 200ms ease, transform 200ms ease",
          }}
        >
          {fromSeller ? (
            <>
              <Tooltip title="Edit product">
                <IconButton onClick={(e) => { e.stopPropagation(); onEdit?.(product); }} sx={iconBtnSx}>
                  <EditOutlined sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Quick view">
                <IconButton onClick={(e) => { e.stopPropagation(); onView?.(product); }} sx={iconBtnSx}>
                  <VisibilityOutlined sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              {showWishlist ? (
                <Tooltip title={inWish ? "Remove from wishlist" : "Add to wishlist"}>
                  <IconButton onClick={handleToggleWish} sx={iconBtnSx}>
                    {inWish
                      ? <Favorite sx={{ fontSize: 17, color: "#ef4444" }} />
                      : <FavoriteBorder sx={{ fontSize: 17 }} />}
                  </IconButton>
                </Tooltip>
              ) : null}
              {onView ? (
                <Tooltip title="Quick view">
                  <IconButton onClick={(e) => { e.stopPropagation(); onView?.(product); }} sx={iconBtnSx}>
                    <VisibilityOutlined sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              ) : null}
            </>
          )}
        </Stack>

        {/* Add to cart bar â€” slides up from bottom on hover */}
        {!fromSeller && (
          <Box
            className="pc-cart-bar"
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 3,
              opacity: alwaysShowCartBar ? 1 : 0,
              transform: alwaysShowCartBar ? "translateY(0)" : "translateY(100%)",
              transition: "opacity 220ms ease, transform 220ms ease",
            }}
          >
            <Button
              fullWidth
              disabled={outOfStock}
              onClick={(e) => { e.stopPropagation(); handleAddToCart(e); }}
              startIcon={
                inCart
                  ? <ShoppingCart sx={{ fontSize: 16 }} />
                  : <ShoppingCartOutlined sx={{ fontSize: 16 }} />
              }
              sx={{
                borderRadius: 0,
                py: 1,
                textTransform: "none",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 0,
                bgcolor: !addToCartLabel && inCart ? "#16a34a" : "#6366f1",
                color: "#fff",
                boxShadow: "none",
                "&:hover": { bgcolor: !addToCartLabel && inCart ? "#15803d" : "#4f46e5", boxShadow: "none" },
                "&.Mui-disabled": { bgcolor: surface2, color: subInk, opacity: 1 },
              }}
            >
              {outOfStock ? "Out of Stock" : addToCartLabel || (inCart ? "Added to Cart" : "Add to Cart")}
            </Button>
          </Box>
        )}
      </Box>

      {/* â”€â”€ Info section â”€â”€ */}
      <CardContent sx={{ p: 1.5, pt: 1.2, pb: "12px !important" }}>
        <Stack spacing={0.7}>
          <Typography
            fontWeight={700}
            sx={{
              color: ink,
              fontSize: 13,
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product?.name || "Untitled product"}
          </Typography>

          {/* Price */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
            <Typography fontWeight={800} sx={{ fontSize: 15, color: "#6366f1", letterSpacing: "-0.01em" }}>
              {displayPrice}
            </Typography>
            {hasSale && (
              <Typography variant="caption" sx={{ fontWeight: 500, color: subInk, textDecoration: "line-through", fontSize: 11 }}>
                {money(price)}
              </Typography>
            )}
          </Box>

          {/* Shop */}
          {product?.shop && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: subInk, fontSize: 11, fontWeight: 600 }}>Shop:</Typography>
              {product?.shop?.id ? (
                <Link
                  component="button"
                  type="button"
                  onClick={(e) => { e.stopPropagation(); navigate(`/shop/${product.shop.id}`); }}
                  sx={{ position: "relative", zIndex: 3, fontSize: 11, fontWeight: 700, color: accent, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                  {product.shop?.shop_name || product.shop?.name || "View shop"}
                </Link>
              ) : (
                <Typography variant="caption" sx={{ fontWeight: 600, color: subInk, fontSize: 11 }}>
                  {product.shop?.shop_name || product.shop?.name || " "}
                </Typography>
              )}
            </Box>
          )}

          {/* Rating + Sales */}
          <Stack direction="row" spacing={0.8} alignItems="center">
            <Rating value={ratingValue} precision={0.5} size="small" readOnly sx={{ fontSize: 13 }} />
            <Typography variant="caption" sx={{ fontWeight: 500, color: subInk, fontSize: 11 }}>
              ({reviewsCount})
            </Typography>
            <Chip
              size="small"
              label={`Sold: ${product?.num_of_sale ??  0}`}
              sx={{
                ml: "auto",
                borderRadius: 1,
                fontWeight: 600,
                fontSize: 10,
                height: 20,
                bgcolor: surface2,
                border: `1px solid ${divider}`,
                color: subInk,
                "& .MuiChip-label": { px: 0.8 },
              }}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
