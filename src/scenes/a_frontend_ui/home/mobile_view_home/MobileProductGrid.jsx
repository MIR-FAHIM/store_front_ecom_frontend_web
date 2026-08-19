import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, CircularProgress, Typography, useTheme } from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import { useNavigate } from "react-router-dom";
import { getProduct } from "../../../../api/controller/admin_controller/product/product_controller";
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

function MiniProductCard({ product, storeSlug = "" }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { price, displayPrice, hasSale, discountLabel } = getProductPricing(product);

  return (
    <Box
      onClick={() => navigate(productDetailPath(product, storeSlug))}
      sx={{
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        cursor: "pointer",
        "&:active": { transform: "scale(0.97)" },
        transition: "transform 0.15s ease",
      }}
    >
      <Box sx={{ position: "relative" }}>
        <Box
          component="img"
          src={resolveImage(product)}
          alt={product?.name}
          sx={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }}
          onError={(e) => { e.target.src = "https://via.placeholder.com/200x200?text=No+Image"; }}
        />
        {discountLabel && (
          <Chip
            label={discountLabel}
            size="small"
            sx={{
              position: "absolute",
              top: 5,
              left: 5,
              height: 18,
              fontSize: 9,
              fontWeight: 800,
              bgcolor: "#ff4444",
              color: "#fff",
              "& .MuiChip-label": { px: 0.5 },
            }}
          />
        )}
      </Box>
      <Box sx={{ p: 0.8 }}>
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
            mb: 0.4,
            color: "text.primary",
          }}
        >
          {product?.name}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 11, color: "#f83600" }}>
          {formatMoney(displayPrice)}
        </Typography>
        {hasSale && (
          <Typography
            variant="caption"
            sx={{ textDecoration: "line-through", color: "text.disabled", ml: 0.4, fontSize: 10 }}
          >
            {formatMoney(price)}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function MobileProductGrid({ title = "All Products", seeAllPath = "/all-products", storeParams = {} }) {
  const navigate = useNavigate();
  const storeSlug = storeParams?.store_slug || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await getProduct({ page: p, per_page: 12, ...storeParams });
      const payload = res?.data ?? res ?? {};
      const list = safeArray(payload?.data ?? payload ?? []);
      setProducts((prev) => (append ? [...prev, ...list] : list));
      setLastPage(Number(payload?.last_page || 1));
      setPage(p);
    } catch (e) {
      console.error("MobileProductGrid load error:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [storeParams]);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleLoadMore = () => {
    if (page < lastPage) load(page + 1, true);
    else navigate(seeAllPath);
  };

  const list = useMemo(() => products, [products]);

  return (
    <Box sx={{ px: 1.5 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          <GridViewIcon sx={{ color: "primary.main", fontSize: 18 }} />
          <Typography variant="subtitle2" fontWeight={700} fontSize={13}>
            {title}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{ color: "primary.main", cursor: "pointer" }}
          onClick={() => navigate(seeAllPath)}
        >
          See all
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gap: 1.2,
              gridTemplateColumns: "repeat(2, 1fr)",
            }}
          >
            {list.map((product) => (
              <MiniProductCard key={product.id} product={product} storeSlug={storeSlug} />
            ))}
          </Box>

          {/* Load more / View all */}
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={handleLoadMore}
            disabled={loadingMore}
            sx={{
              mt: 2,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {loadingMore ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : page < lastPage ? (
              "Load more"
            ) : (
              "View all products →"
            )}
          </Button>
        </>
      )}
    </Box>
  );
}
