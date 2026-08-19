import React, { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, Chip, Typography, useTheme } from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useNavigate } from "react-router-dom";
import { getTodayDealProduct } from "../../../../api/controller/admin_controller/product/product_controller";
import { image_file_url } from "../../../../api/config";
import { productDetailPath } from "../../../../utils/productRoute";
import { getProductPricing } from "../../../../utils/productPricing";

const safeArray = (x) => (Array.isArray(x) ? x : []);

const formatMoney = (n) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number(n || 0));

const resolveImage = (product) => {
  const primary = product?.primary_image ?? null;
  if (primary?.url && /^https?:\/\//i.test(String(primary.url))) return String(primary.url);
  if (primary?.file_name) {
    const base = String(image_file_url || "").replace(/\/+$/, "");
    return `${base}/${String(primary.file_name).replace(/^\/+/, "")}`;
  }
  const maybeUrl = product?.image || product?.file_name;
  if (maybeUrl && /^https?:\/\//i.test(String(maybeUrl))) return String(maybeUrl);
  return "https://via.placeholder.com/200x200?text=No+Image";
};

function DealCard({ product, storeSlug = "" }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { price, displayPrice, hasSale, discountLabel } = getProductPricing(product);

  return (
    <Box
      onClick={() => navigate(productDetailPath(product, storeSlug))}
      sx={{
        flexShrink: 0,
        width: 130,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: theme.palette.background.paper,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        cursor: "pointer",
        "&:active": { transform: "scale(0.97)" },
        transition: "transform 0.15s ease",
      }}
    >
      {/* Product image */}
      <Box sx={{ position: "relative" }}>
        <Box
          component="img"
          src={resolveImage(product)}
          alt={product?.name}
          sx={{ width: "100%", height: 130, objectFit: "cover", display: "block" }}
          onError={(e) => { e.target.src = "https://via.placeholder.com/200x200?text=No+Image"; }}
        />
        {discountLabel && (
          <Chip
            label={discountLabel}
            size="small"
            sx={{
              position: "absolute",
              top: 6,
              left: 6,
              height: 20,
              fontSize: 10,
              fontWeight: 800,
              bgcolor: "#ff4444",
              color: "#fff",
              "& .MuiChip-label": { px: 0.6 },
            }}
          />
        )}
      </Box>

      {/* Info */}
      <Box sx={{ p: 1 }}>
        <Typography
          variant="caption"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 1.3,
            mb: 0.5,
            color: "text.primary",
          }}
        >
          {product?.name}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 800, color: "#f83600", fontSize: 12 }}>
          {formatMoney(displayPrice)}
        </Typography>
        {hasSale && (
          <Typography
            variant="caption"
            sx={{ textDecoration: "line-through", color: "text.disabled", ml: 0.5, fontSize: 10 }}
          >
            {formatMoney(price)}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function MobileDealsStrip({ storeParams = {} }) {
  const navigate = useNavigate();
  const storeSlug = storeParams?.store_slug || "";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getTodayDealProduct({ page: 1, per_page: 12, ...storeParams });
        const list = res?.data?.data ?? res?.data ?? res ?? [];
        if (mounted) setItems(safeArray(list));
      } catch (e) {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [storeParams]);

  if (!loading && items.length === 0) return null;

  return (
    <Box sx={{ px: 1.5 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
          px: 1.5,
          py: 1,
          borderRadius: 2,
          background: "linear-gradient(90deg, #f83600 0%, #f9d423 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <LocalOfferIcon sx={{ color: "#fff", fontSize: 18 }} />
          <Typography variant="subtitle2" fontWeight={800} color="#fff" fontSize={13}>
            Today's Deals
          </Typography>
        </Box>
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{
            color: "#fff",
            cursor: "pointer",
            bgcolor: "rgba(0,0,0,0.2)",
            px: 1,
            py: 0.3,
            borderRadius: 2,
          }}
          onClick={() => navigate(storeSlug ? `/store/${encodeURIComponent(String(storeSlug))}/today-deals` : "/today-deals")}
        >
          See all →
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            overflowX: "auto",
            pb: 0.5,
            msOverflowStyle: "none",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {items.map((product) => (
            <DealCard key={product.id} product={product} storeSlug={storeSlug} />
          ))}
        </Box>
      )}
    </Box>
  );
}
