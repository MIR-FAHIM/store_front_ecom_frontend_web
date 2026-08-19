import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  IconButton,
  TextField,
  Typography,
  Stack,
  Rating,
  Divider,
  Chip,
  Snackbar,
  Tooltip,
  CircularProgress,
  Avatar,
  useTheme,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

import { image_file_url } from "../../../api/config";
import { useParams, useNavigate } from "react-router-dom";
import { addCart, getCartByUser } from "../../../api/controller/admin_controller/order/cart_controller";
import { addWish, getUserWish, deleteWish } from "../../../api/controller/admin_controller/wishlist/wish_controller";
import { getProductDetails } from "../../../api/controller/admin_controller/product/product_controller";
import ProductDescription from "./components/ProductDescription";
import ProductDetailImage from "./components/ProductDetailImage";
import RelatedProduct from "./related_product/RelatedProduct";
import ProductReview from "./review_product/ProductReview";
import { tokens } from "../../../theme";
import { storeHomePath } from "../../../utils/productRoute";

const safeJsonParse = (value, fallback) => {
  try {
    if (value == null) return fallback;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      const s = value.trim();
      if (!s) return fallback;
      return JSON.parse(s);
    }
    return fallback;
  } catch {
    return fallback;
  }
};


const buildImageUrl = (fileOrUrl) => {
  if (!fileOrUrl) return null;
  const raw = String(fileOrUrl);

  // If backend sends escaped slashes like all\/file.png, normalize
  const cleaned = raw.replaceAll("\\/", "/");

  if (/^https?:\/\//i.test(cleaned)) return cleaned;

  const base = String(image_file_url || "").replace(/\/+$/, "");
  const path = cleaned.replace(/^\/+/, "");
  return `${base}/${path}`;
};

const stripHtml = (value) => {
  if (value == null) return "";
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const ProductDetail = () => {
  const theme = useTheme();
  const { idOrSlug: productIdentifier, slug } = useParams();
  const navigate = useNavigate();

  const colors = tokens(theme.palette.mode);
  const divider = theme.palette.divider || colors.primary[200];
  const surface = colors.primary[400];
  const surface2 = colors.primary[300];
  const ink = colors.gray[100];
  const subInk = colors.gray[300];

  const userId = useMemo(() => {
    const u = localStorage.getItem("userId");
    return u ? String(u) : null;
  }, []);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoom, setZoom] = useState(1);

  const [busyCart, setBusyCart] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedAttributeId, setSelectedAttributeId] = useState(null);

  const [wishIds, setWishIds] = useState(() => {
    return [];
  });

  const inWish = useMemo(() => {
    const pid = product?.id;
    return pid ? wishIds.includes(pid) : false;
  }, [wishIds, product?.id]);

  const money = useCallback(
    (n) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(Number(n || 0)),
    []
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getProductDetails(productIdentifier, slug ? { store_slug: slug } : {});

        // Your API: { status, message, data: {...product} }
        const p = res?.data?.data ?? res?.data ?? res;
        setProduct(p || null);

        // Your API: primary_image.file_name = "all/xxx.png"
        const main = p?.primary_image?.file_name || null;
        setSelectedImage(main);
        setZoom(1);
        setQty(Math.max(1, Number(p?.min_qty || 1)));
      } catch (e) {
        console.error(e);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productIdentifier, slug]);

  // Images for thumbnails:
  // Your details response currently: images: [] and primary_image has file_name
  // If you later add images[] with same shape, this will work.
  const images = useMemo(() => {
    const list = Array.isArray(product?.images) ? product.images : [];

    // Ensure primary first
    return list;
  }, [product?.images]);

  const mainImagePath = useMemo(() => {
    return (
      selectedImage ||
      product?.primary_image?.file_name ||
      (images.length ? images[0]?.file_name : null) ||
      null
    );
  }, [selectedImage, product?.primary_image?.file_name, images]);

  const mainImage = useMemo(() => buildImageUrl(mainImagePath) || "/assets/images/placeholder.png", [mainImagePath]);
  const seo = product?.seo || {};
  const seoTitle = seo.title || product?.name || "Product";
  const seoDescription = stripHtml(seo.description || product?.description || product?.short_description || "");
  const seoImage = seo.image || product?.thumbnail_url || product?.meta_img || mainImage;
  const seoUrl = seo.url || (typeof window !== "undefined" ? window.location.href : "");
  const seoCanonical = seo.canonical || seo.url || seoUrl;
  const seoKeywords = Array.isArray(seo.keywords) ? seo.keywords.filter(Boolean).join(", ") : "";
  const seoSchema = seo.schema && typeof seo.schema === "object" ? seo.schema : null;

  // Pricing: use final_sale_price for main price
  const unitPrice = useMemo(() => Number(product?.unit_price ?? 0), [product?.unit_price]);
  const finalSalePrice = useMemo(() => Number(product?.final_sale_price ?? 0), [product?.final_sale_price]);
  const discountInfo = useMemo(() => {
    const pd = product?.product_discount;
    if (pd) {
      const d = Number(pd.discount ?? 0);
      if (d > 0) {
        return { amount: d, type: String(pd.discount_type ?? "").toLowerCase() };
      }
    }
    const d = Number(product?.discount ?? 0);
    if (d <= 0) return null;
    const type = String(product?.discount_type ?? "").toLowerCase();
    return { amount: d, type };
  }, [product?.product_discount, product?.discount, product?.discount_type]);

  // Discount percent for badge
  const discountPct = useMemo(() => {
    if (unitPrice > 0 && finalSalePrice > 0 && finalSalePrice < unitPrice) {
      return Math.round(((unitPrice - finalSalePrice) / unitPrice) * 100);
    }
    if (discountInfo && discountInfo.type === "percent") return Math.round(discountInfo.amount);
    return 0;
  }, [unitPrice, finalSalePrice, discountInfo]);

  const discountLabel = useMemo(() => {
    if (discountPct > 0) return `-${discountPct}%`;
    if (discountInfo && (discountInfo.type === "flat" || discountInfo.type === "amount")) {
      return `-${money(discountInfo.amount)}`;
    }
    return null;
  }, [discountPct, discountInfo, money]);

  // Main price to display
  const mainPrice = useMemo(() => (finalSalePrice > 0 ? finalSalePrice : unitPrice), [finalSalePrice, unitPrice]);
  const hasDiscount = useMemo(() => finalSalePrice > 0 && finalSalePrice < unitPrice, [finalSalePrice, unitPrice]);

  const calculatedDiscountAmount = useMemo(() => {
    if (hasDiscount) return Math.max(unitPrice - finalSalePrice, 0);

    if (!discountInfo) return 0;

    if (discountInfo.type === "percent") {
      return Math.max((unitPrice * discountInfo.amount) / 100, 0);
    }

    return Math.max(discountInfo.amount, 0);
  }, [discountInfo, hasDiscount, unitPrice, finalSalePrice]);

  const inStock = useMemo(() => {
    // Your API: current_stock
    if (typeof product?.current_stock === "number") return product.current_stock > 0;
    // fallback
    if (product?.in_stock === false) return false;
    if (typeof product?.stock_qty === "number") return product.stock_qty > 0;
    return true;
  }, [product?.current_stock, product?.in_stock, product?.stock_qty]);

  const productAttributeOptions = useMemo(() => {
    const list = Array.isArray(product?.product_attributes) ? product.product_attributes : [];
    const map = new Map();

    list.forEach((item) => {
      const attrName =
        item?.attribute?.name ||
        item?.attribute_name ||
        item?.attribute?.title ||
        item?.attribute?.label ||
        "Attribute";
      const attrId = item?.attribute?.id ?? attrName;
      const rawValue = item?.value?.value ?? item?.value?.name ?? item?.attribute_value;
      const optionId = item?.id ?? item?.attribute_value_id ?? item?.value?.id;

      if (rawValue == null || rawValue === "" || optionId == null) return;

      const key = String(attrId);
      if (!map.has(key)) {
        map.set(key, { name: attrName, options: [] });
      }

      const group = map.get(key);
      if (!group.options.some((opt) => String(opt.id) === String(optionId))) {
        group.options.push({ id: optionId, label: String(rawValue) });
      }
    });

    return Array.from(map.values());
  }, [product?.product_attributes]);

  useEffect(() => {
    setSelectedAttributeId(null);
  }, [product?.id]);



  const toggleWishlist = () => {
    const pid = product?.id;
    if (!pid) return;
    (async () => {
      if (userId) {
        try {
          const res = await getUserWish(userId);
          const payload = res?.data?.data ?? res?.data ?? res ?? [];
          const entries = Array.isArray(payload) ? payload : [];
          const existing = entries.find((e) => (e?.product?.id ?? e?.product_id) === pid || (e?.product_id ?? e?.product?.id) === pid);
          if (existing && existing?.id) {
            await deleteWish(existing.id);
          } else {
            await addWish({ user_id: userId, product_id: pid });
          }

          // sync server wishlist -> local storage
          const res2 = await getUserWish(userId);
          const payload2 = res2?.data?.data ?? res2?.data ?? res2 ?? [];
          let items = [];
          if (Array.isArray(payload2)) items = payload2.map((e) => e?.product ?? e).filter(Boolean);
          const ids = items.map((p) => Number(p?.id)).filter(Boolean);
          setWishIds(ids);
          localStorage.setItem("wishlist", JSON.stringify(ids));
          window.dispatchEvent(new Event("wishlist-updated"));
        } catch (e) {
          console.error("Failed to update wishlist", e);
        }
        return;
      }

      setWishIds((prev) => {
        const has = prev.includes(pid);
        localStorage.setItem("wishlist", JSON.stringify(next));
        window.dispatchEvent(new Event("wishlist-updated"));
        return next;
      });
    })();
  };

  const handleAddToCart = async () => {
    if (!product?.id) return;

    if (!userId) {
      setMsg("Please login to add to cart.");
      navigate("/login");
      return;
    }
    if (!inStock) {
      setMsg("This product is out of stock.");
      return;
    }

    setBusyCart(true);
    try {
      const payload = {
        user_id: userId,
        product_id: product.id,
        qty: Number(qty || 1),
        attribute_id: selectedAttributeId ?? null,
        price: mainPrice, // send final_sale_price to cart
      };
      const res = await addCart(payload);

      if (res?.status === "success") {
        const cartRes = await getCartByUser(userId);
        const total =
          cartRes?.data?.total_items ??
          (Array.isArray(cartRes?.data?.items) ? cartRes.data.items.length : 0);

        localStorage.setItem("cart", JSON.stringify(total));
        window.dispatchEvent(new Event("cart-updated"));
        setMsg(res?.message || "Added to cart");
      } else {
        setMsg(res?.message || "Failed to add to cart");
      }
    } catch (e) {
      console.error(e);
      setMsg("Failed to add to cart");
    } finally {
      setBusyCart(false);
    }
  };
  const handleBuyNow = async () => {
    if (!product?.id) return;

    if (!userId) {
      setMsg("Please login to add to cart.");
      navigate("/login");
      return;
    }
    if (!inStock) {
      setMsg("This product is out of stock.");
      return;
    }

    setBusyCart(true);
    try {
      const payload = {
        user_id: userId,
        product_id: product.id,
        qty: Number(qty || 1),
        attribute_id: selectedAttributeId ?? null,
        price: mainPrice, // send final_sale_price to cart
      };
      const res = await addCart(payload);

      if (res?.status === "success") {
        const cartRes = await getCartByUser(userId);
        const total =
          cartRes?.data?.total_items ??
          (Array.isArray(cartRes?.data?.items) ? cartRes.data.items.length : 0);

        localStorage.setItem("cart", JSON.stringify(total));
        window.dispatchEvent(new Event("cart-updated"));
        navigate("/cart");
      } else {
        setMsg(res?.message || "Failed to add to cart");
      }
    } catch (e) {
      console.error(e);
      setMsg("Failed to add to cart");
    } finally {
      setBusyCart(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "grid", placeItems: "center" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} sx={{ color: theme.palette.primary.main }} />
          <Typography sx={{ color: subInk, fontWeight: 600 }}>Loading product...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "grid", placeItems: "center" }}>
        <Stack alignItems="center" spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: ink }}>Product not found</Typography>
          <Button onClick={() => navigate(storeHomePath(slug))} variant="contained" sx={{ borderRadius: 999, textTransform: "none", fontWeight: 600 }}>
            Back to home
          </Button>
        </Stack>
      </Box>
    );
  }

  const ratingValue = Number(product?.average_review?.average_rating || 0);
  const reviewCount = product?.average_review?.review_count ?? 0;
  const colorsList = safeJsonParse(product?.colors, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 6 }}>
      <Helmet>
        <title>{seoTitle}</title>
        {seoDescription ? <meta name="description" content={seoDescription} /> : null}
        {seoKeywords ? <meta name="keywords" content={seoKeywords} /> : null}
        {seoCanonical ? <link rel="canonical" href={seoCanonical} /> : null}

        <meta property="og:title" content={seoTitle} />
        {seoDescription ? <meta property="og:description" content={seoDescription} /> : null}
        {seoImage ? <meta property="og:image" content={seoImage} /> : null}
        {seoUrl ? <meta property="og:url" content={seoUrl} /> : null}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        {seoDescription ? <meta name="twitter:description" content={seoDescription} /> : null}
        {seoImage ? <meta name="twitter:image" content={seoImage} /> : null}

        {seoSchema ? (
          <script type="application/ld+json">
            {JSON.stringify(seoSchema)}
          </script>
        ) : null}
      </Helmet>
      {/* Breadcrumb / Back bar */}
      <Box sx={{ bgcolor: surface, borderBottom: `1px solid ${divider}` }}>
        <Container>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.5 }}>
            <IconButton
              onClick={() => navigate(-1)}
              size="small"
              sx={{
                border: `1px solid ${divider}`,
                borderRadius: 2,
                bgcolor: surface2,
                "&:hover": { bgcolor: surface },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ color: subInk, fontWeight: 600 }}>
              {product?.category?.name || "Products"} / <Box component="span" sx={{ color: ink }}>{product?.name}</Box>
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container sx={{ mt: 6}}>
        <Grid container spacing={3}>
          {/* ────── LEFT: IMAGE ────── */}
          <Grid item xs={12} md={5}>
            <ProductDetailImage
              mainImage={mainImage}
              mainImagePath={mainImagePath}
              productName={product?.name}
              zoom={zoom}
              setZoom={setZoom}
              images={images}
              onSelectImage={(fileName) => setSelectedImage(fileName)}
              buildImageUrl={buildImageUrl}
              divider={divider}
              surface={surface}
              surface2={surface2}
              brandGradient={theme.palette.secondary.main}
              brandGlow={"none"}
            />
          </Grid>

          {/* ────── RIGHT: INFO ────── */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2.5}>
              {/* Product name */}
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: ink, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                  {product?.name}
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.2 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Rating value={ratingValue} precision={0.1} size="small" readOnly />
                    <Typography variant="body2" sx={{ color: subInk, fontWeight: 600 }}>
                      ({reviewCount})
                    </Typography>
                  </Stack>
                  <Divider orientation="vertical" flexItem />
                  <Typography variant="body2" sx={{ color: inStock ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                    {inStock ? "In Stock" : "Out of Stock"}
                  </Typography>
                  {product?.brand?.name && (
                    <>
                      <Divider orientation="vertical" flexItem />
                      <Chip size="small" label={product.brand.name} sx={{ borderRadius: 1, fontWeight: 600, bgcolor: surface2, border: `1px solid ${divider}` }} />
                    </>
                  )}
                </Stack>
              </Box>

              {/* ── Price block ── */}
              <Card sx={{ borderRadius: 1, border: `1px solid ${divider}`, bgcolor: surface, overflow: "visible" }}>
                <Box sx={{ p: 2.5 }}>
                  <Stack direction="row" alignItems="flex-end" spacing={1.5}>
                    <Typography sx={{ fontSize: 32, fontWeight: 800, color: "#6366f1", lineHeight: 1 }}>
                     {money(mainPrice)}
                    </Typography>
                    {hasDiscount && (
                      <Typography sx={{ fontSize: 18, fontWeight: 600, color: subInk, textDecoration: "line-through", lineHeight: 1.3 }}>
                        {money(unitPrice)}
                      </Typography>
                    )}
                    {discountLabel && (
                      <Chip
                        label={discountLabel}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          bgcolor: "#fef2f2",
                          color: "#dc2626",
                          border: "1px solid #fecaca",
                          borderRadius: 1,
                        }}
                      />
                    )}
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: subInk, fontWeight: 600, display: "block" }}>
                      Unit Price: {money(unitPrice)}
                    </Typography>
                    {hasDiscount && (
                      <Typography variant="caption" sx={{ color: subInk, fontWeight: 600, display: "block" }}>
                        Final Sale Price: {money(finalSalePrice)}
                      </Typography>
                    )}
                  </Stack>
                  {discountInfo && (
                    <Typography variant="caption" sx={{ color: subInk, fontWeight: 600, display: "block" }}>
                      Discount: {discountInfo.type === "percent" ? `${discountInfo.amount}%` : money(discountInfo.amount)}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ color: subInk, fontWeight: 600, mt: 0.5, display: "block" }}>
                    Unit: {product?.unit || "pc"} &nbsp;·&nbsp; Min order: {product?.min_qty || 1}
                  </Typography>
                </Box>
              </Card>

              {/* ── Color swatches ── */}
              {Array.isArray(colorsList) && colorsList.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: ink, mb: 1 }}>Colors</Typography>
                  <Stack direction="row" spacing={1}>
                    {colorsList.map((c) => (
                      <Tooltip key={c} title={c}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            bgcolor: c,
                            border: `2px solid ${divider}`,
                            cursor: "pointer",
                            transition: "transform 150ms",
                            "&:hover": { transform: "scale(1.15)" },
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* ── Attributes ── */}
              {productAttributeOptions.length > 0 && (
                <Box>
                  {productAttributeOptions.map((attr) => (
                    <Box key={attr.name} sx={{ mb: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: ink, mb: 0.8 }}>
                        {attr.name}
                      </Typography>
                      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ rowGap: 0.8 }}>
                        {attr.options.map((opt) => {
                          const selected = String(selectedAttributeId) === String(opt.id);
                          return (
                            <Chip
                              key={`${attr.name}-${opt.id}`}
                              size="small"
                              label={opt.label}
                              onClick={() => setSelectedAttributeId(opt.id)}
                              sx={{
                                borderRadius: 1,
                                fontWeight: 600,
                                bgcolor: selected ? "#6366f1" : surface2,
                                color: selected ? "#fff" : ink,
                                border: `1px solid ${selected ? "#6366f1" : divider}`,
                                cursor: "pointer",
                                transition: "all 150ms",
                                "&:hover": { bgcolor: selected ? "#4f46e5" : surface },
                              }}
                            />
                          );
                        })}
                      </Stack>
                    </Box>
                  ))}
                </Box>
              )}

              <Divider />

              {/* ── Quantity and Actions ── */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    border: `1px solid ${divider}`,
                    borderRadius: 1,
                    bgcolor: surface2,
                    overflow: "hidden",
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => setQty((q) => Math.max(Number(product?.min_qty || 1), q - 1))}
                    sx={{ borderRadius: 0, px: 1.5 }}
                  >
                    <RemoveCircleOutlineIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    size="small"
                    value={qty}
                    onChange={(e) => {
                      const v = Number(e.target.value || product?.min_qty || 1);
                      const min = Number(product?.min_qty || 1);
                      setQty(Number.isFinite(v) ? Math.max(min, v) : min);
                    }}
                    sx={{
                      width: 64,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 0,
                        bgcolor: surface,
                        "& fieldset": { border: "none" },
                      },
                      input: { textAlign: "center", fontWeight: 700, color: ink, py: 0.8 },
                    }}
                  />
                  <IconButton size="small" onClick={() => setQty((q) => q + 1)} sx={{ borderRadius: 0, px: 1.5 }}>
                    <AddCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Tooltip title={inWish ? "Remove from wishlist" : "Add to wishlist"}>
                  <IconButton
                    onClick={toggleWishlist}
                    sx={{
                      border: `1px solid ${divider}`,
                      borderRadius: 1,
                      bgcolor: inWish ? "#fef2f2" : surface2,
                      "&:hover": { bgcolor: surface },
                    }}
                  >
                    {inWish ? <FavoriteIcon sx={{ color: "#ef4444" }} /> : <FavoriteBorderIcon />}
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* ── CTA Buttons ── */}
              <Stack direction="row" spacing={1.5}>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={!inStock || busyCart}
                  onClick={handleAddToCart}
                  startIcon={busyCart ? <CircularProgress size={16} color="inherit" /> : <ShoppingCartOutlinedIcon />}
                  sx={{
                    borderRadius: 1,
                    py: 1.4,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: 15,
                    bgcolor: "#6366f1",
                    color: "#fff",
                    boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                    "&:hover": { bgcolor: "#4f46e5", boxShadow: "0 6px 20px rgba(99,102,241,0.4)" },
                    "&.Mui-disabled": { opacity: 0.5 },
                  }}
                >
                  Add to Cart
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  disabled={!inStock}
                  onClick={handleBuyNow}
                  sx={{
                    borderRadius: 1,
                    py: 1.4,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: 15,
                    borderColor: "#6366f1",
                    color: "#6366f1",
                    "&:hover": { bgcolor: "rgba(99,102,241,0.06)", borderColor: "#4f46e5" },
                  }}
                >
                  Buy Now
                </Button>
              </Stack>

              <Divider />

              {/* ── Shipping & Meta info ── */}
              <Card sx={{ borderRadius: 1, border: `1px solid ${divider}`, bgcolor: surface }}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: ink, mb: 1.5 }}>Delivery & Policies</Typography>
                  <Grid container spacing={1.5}>
                    {[
                      { label: "Stock", value: typeof product?.current_stock === "number" ? product.current_stock : "—", icon: "📦" },
                      { label: "COD", value: product?.cash_on_delivery ? "Available" : "Not available", icon: "💵" },
                      { label: "Shipping", value: product?.shipping_type || "Flat rate", icon: "🚚" },
                      ...(product?.est_shipping_days != null ? [{ label: "Est. delivery", value: `${product.est_shipping_days} day(s)`, icon: "📅" }] : []),
                    ].map((item) => (
                      <Grid item xs={6} key={item.label}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.2, borderRadius: 1, bgcolor: surface2, border: `1px solid ${divider}` }}>
                          <Typography sx={{ fontSize: 18 }}>{item.icon}</Typography>
                          <Box>
                            <Typography variant="caption" sx={{ color: subInk, fontWeight: 600, display: "block", lineHeight: 1.2 }}>
                              {item.label}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: ink, lineHeight: 1.2 }}>
                              {item.value}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {/* ────── BOTTOM SECTION: Description, Reviews, Related ────── */}
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
                 <Grid item xs={12} md={4}>
              {/* ── Shop Card ── */}
              {product?.shop && (
                <Card
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${divider}`,
                    bgcolor: surface,
                    mb: 2,
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ p: 2.5 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        src={
                          product.shop.logo
                            ? buildImageUrl(product.shop.logo)
                            : undefined
                        }
                        sx={{
                          width: 52,
                          height: 52,
                          bgcolor: "#6366f1",
                          fontWeight: 700,
                          fontSize: 20,
                          border: `2px solid ${divider}`,
                        }}
                      >
                        {(product.shop.shop_name || product.shop.name || "S")[0].toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 700, color: ink, lineHeight: 1.3 }}
                          noWrap
                        >
                          {product.shop.shop_name || product.shop.name}
                        </Typography>
                        {product.shop.name && product.shop.shop_name && (
                          <Typography variant="caption" sx={{ color: subInk, fontWeight: 500 }}>
                            {product.shop.description || 'No description'}
                          </Typography>
                        )}
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={product.shop.status || "active"}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: 11,
                              height: 20,
                              bgcolor:
                                (product.shop.status || "active") === "active"
                                  ? "#dcfce7"
                                  : "#fef9c3",
                              color:
                                (product.shop.status || "active") === "active"
                                  ? "#16a34a"
                                  : "#92400e",
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                      </Box>
                    </Stack>

                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<StorefrontIcon fontSize="small" />}
                      onClick={() => navigate(slug ? storeHomePath(slug) : `/shop/${product.shop.id}`)}
                      sx={{
                        mt: 2,
                        borderRadius: 1,
                        textTransform: "none",
                        fontWeight: 600,
                        borderColor: "#6366f1",
                        color: "#6366f1",
                        "&:hover": {
                          bgcolor: "rgba(99,102,241,0.06)",
                          borderColor: "#4f46e5",
                        },
                      }}
                    >
                      Visit Store
                    </Button>
                  </Box>
                </Card>
              )}
              <RelatedProduct productId={product?.id} storeSlug={slug} />
            </Grid>
            <Grid item xs={12} md={8}>
              
              <ProductDescription description={product?.description} ink={ink} subInk={subInk} />
              <Box sx={{ mt: 3 }}>
                <ProductReview productId={product?.id} />
              </Box>
            </Grid>
       
          </Grid>
        </Box>

        <Snackbar open={!!msg} autoHideDuration={2500} onClose={() => setMsg("")} message={msg} />
      </Container>
    </Box>
  );
};

export default ProductDetail;
