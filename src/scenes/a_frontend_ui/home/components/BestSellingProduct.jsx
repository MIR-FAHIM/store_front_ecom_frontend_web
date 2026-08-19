import React, { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, IconButton, Typography, useTheme } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import { getFeaturedProduct } from "../../../../api/controller/admin_controller/product/product_controller";
import { getBanner } from "../../../../api/controller/admin_controller/media/banner_controller";
import { image_file_url } from "../../../../api/config";
import HorizontalProductCard from "../../../a_frontend_ui/product/components/HorizontalProductCard";

const safeArray = (x) => (Array.isArray(x) ? x : []);

export default function BestSellingProduct({ onView, storeParams = {} }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [bannerUrl, setBannerUrl] = useState("/assets/images/banner.jpg");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getFeaturedProduct({ page: 1, per_page: 8, ...storeParams });
        const list = res?.data?.data ?? res?.data ?? res ?? [];
        if (mounted) setItems(safeArray(list));
      } catch (e) {
        console.error("loadBestSelling error:", e);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [storeParams]);

  useEffect(() => {
    let mounted = true;
    const loadBanner = async () => {
      try {
        const res = await getBanner(storeParams);
        const list = Array.isArray(res) ? res : res?.data || res?.data?.data || [];
        const first = list?.[2] || null;
        if (!first) return;

        let nextUrl = "/assets/images/banner.jpg";
        if (first?.image?.file_name) nextUrl = `${image_file_url}/${first.image.file_name}`;
        else if (first?.image?.url) nextUrl = first.image.url;
        else if (first?.image_path) {
          nextUrl = first.image_path.startsWith("http")
            ? first.image_path
            : `${image_file_url}/${first.image_path}`;
        }

        if (mounted) setBannerUrl(nextUrl);
      } catch (e) {
        console.error("loadBestSellingBanner error:", e);
      }
    };

    loadBanner();
    return () => {
      mounted = false;
    };
  }, [storeParams]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!items.length) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No best selling products yet.
        </Typography>
      );
    }

    const slice = items.slice(0, 6);

    return (
      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        {slice.map((product) => (
          <Box key={product.id} sx={{ display: "flex", justifyContent: "center" }}>
            <HorizontalProductCard product={product} onView={() => onView?.(product)} />
          </Box>
        ))}
      </Box>
    );
  }, [items, loading, onView]);

  return (
    <Box
      sx={{
        borderRadius: 1,
        p: { xs: 2.5, md: 3 },
        bgcolor: "#f1eadc",
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
        display: "grid",
        gap: 3,
        gridTemplateColumns: { xs: "1fr", md: "1.1fr 2fr" },
        alignItems: "stretch",
      }}
    >
      <Box
        sx={{
          borderRadius: 1,
          height: { xs: 200, md: 250 },
          backgroundImage: `url("${bannerUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
        }}
      />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 15 }}>
              Best Selling
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Products ({Math.min(items.length, 10)})
            </Typography>
          </Box>
          <IconButton size="small" sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <ChevronRight fontSize="small" />
          </IconButton>
        </Box>
        {content}
      </Box>
    </Box>
  );
}
