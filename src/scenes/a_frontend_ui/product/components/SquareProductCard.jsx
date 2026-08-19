import React, { useMemo } from "react";
import { Box, Chip, Link, Typography, useTheme } from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useNavigate } from "react-router-dom";
import { image_file_url } from "../../../../api/config/index.jsx";
import { tokens } from "../../../../theme.js";
const formatMoney = (n) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(Number(n || 0));

const resolveImage = (product) => {
  const primary = product?.primary_image ?? product?.primaryImage ?? null;
  const direct = primary?.url;
  if (direct && /^https?:\/\//i.test(String(direct))) return String(direct);

  const file = primary?.file_name;
  if (file) {
    const safeFile = String(file).replaceAll("\\/", "/").replace(/^\/+/, "");
    const base = String(image_file_url || "").replace(/\/+$/, "");
    return `${base}/${safeFile}`;
  }

  const maybeUrl = product?.image || product?.file_name;
  if (maybeUrl && /^https?:\/\//i.test(String(maybeUrl))) return String(maybeUrl);

  return "https://via.placeholder.com/600x400?text=No+Image";
};

export default function SquareProductCard({ product, onView, size = 140, storeSlug = "" }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const colors = tokens(theme.palette.mode);
  const price = useMemo(
    () => Number(product?.unit_price ?? product?.price ?? 0),
    [product?.unit_price, product?.price]
  );
  const discountInfo = useMemo(() => {
    // 1. Try product_discount relation
    const pd = product?.product_discount;
    if (pd) {
      const d = Number(pd.discount ?? 0);
      if (d > 0) {
        return { amount: d, type: String(pd.discount_type ?? "").toLowerCase() };
      }
    }

    // 2. Fallback: direct product fields
    const d = Number(product?.discount ?? 0);
    if (d <= 0) return null;
    const type = String(product?.discount_type ?? "").toLowerCase();
    return { amount: d, type };
  }, [product?.product_discount, product?.discount, product?.discount_type, product?.discount_start_date, product?.discount_end_date]);

  const salePrice = useMemo(() => {
    const s = Number(product?.sale_price ?? 0);
    if (s > 0) return s;
    if (discountInfo && price > 0) {
      if (discountInfo.type === "percent") return Math.round(price - (price * discountInfo.amount) / 100);
      const flat = price - discountInfo.amount;
      return flat > 0 ? flat : 0;
    }
    return 0;
  }, [product?.sale_price, discountInfo, price]);

  const hasSale = salePrice > 0 && salePrice < price;
  const displayPrice = hasSale ? salePrice : price;

  const discountLabel = useMemo(() => {
    if (discountInfo) {
      if (discountInfo.type === "percent") return `${discountInfo.amount}% OFF`;
      return `${formatMoney(discountInfo.amount)} OFF`;
    }
    if (hasSale && price > 0) {
      const pct = Math.round(((price - salePrice) / price) * 100);
      return pct > 0 ? `${pct}% OFF` : null;
    }
    return null;
  }, [discountInfo, hasSale, price, salePrice]);

  const accent = theme.palette.mode === "dark" ? colors.blueAccent[400] : colors.blueAccent[100];
  const imageUrl = useMemo(() => resolveImage(product), [product]);

  return (
    <Box
      onClick={() => onView?.(product)}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        cursor: "pointer",
      }}
    >
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: 1,
          backgroundImage: `url("${imageUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#fff",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": { transform: "scale(1.03)", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" },
          position: "relative",
          overflow: "hidden",
        }}
      >
 
      </Box>
      <Box sx={{ width: size, textAlign: "center" }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: 12,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 48,
          }}
        >
          {product?.name || "Untitled product"}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5, mt: 0.25 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11, color: accent }}>
            Shop:
          </Typography>
          {product?.shop?.id ? (
            <Link
              component="button"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(storeSlug ? `/store/${encodeURIComponent(String(storeSlug))}` : `/shop/${product.shop.id}`);
              }}
              sx={{
                fontSize: 12,
                fontWeight: 700,
                 color: accent,
                textDecoration: "none",
                lineHeight: 1.2,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {product.shop?.shop_name || "View shop"}
            </Link>
          ) : (
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11, color: accent }}>
              {product?.shop?.shop_name || "Unknown"}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, flexWrap: "wrap", mt: 0.25 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13, color: accent }}>
            {formatMoney(displayPrice)}
          </Typography>
          {hasSale && (
            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through", fontSize: 10 }}>
              {formatMoney(price)}
            </Typography>
          )}
        </Box>
        {discountLabel && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: 10,
              color: theme.palette.error.main,
            }}
          >
            {discountLabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
