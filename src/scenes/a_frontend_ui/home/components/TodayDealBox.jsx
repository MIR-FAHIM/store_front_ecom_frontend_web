import React, { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, IconButton, Typography, useTheme } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getTodayDealProduct } from "../../../../api/controller/admin_controller/product/product_controller";
import SmartProductCard from "./ProductCard";
import FeaturedTitle from "./FeaturedTitle";

const safeArray = (x) => (Array.isArray(x) ? x : []);

export default function TodayDealBox({ onView, storeParams = {} }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const storeSlug = storeParams?.store_slug || "";
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getTodayDealProduct({ page: 1, per_page: 20, ...storeParams });
        const list = res?.data?.data ?? res?.data ?? res ?? [];
        if (mounted) setItems(safeArray(list));
      } catch (e) {
        console.error("loadTodayDealProducts error:", e);
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
    if (!items.length) return;
    setIndex((i) => Math.min(i, items.length - 1));
  }, [items.length]);

  const current = useMemo(() => items[index] || null, [items, index]);
  const canPrev = index > 0;
  const canNext = index < items.length - 1;

  return (
    <Box
      sx={{
        border: "1px solid #000",
        borderRadius: 1,
        p: 2,
        display: "grid",
        gridTemplateColumns: "32px 1fr 32px",
        alignItems: "center",
        gap: 1.5,
        backgroundColor: "#fff",
        width: { xs: "100%", md: 320 },
        maxWidth: "100%",
        height: 430,
      }}
    >
      <IconButton size="small" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={!canPrev}>
        <ChevronLeft fontSize="small" />
      </IconButton>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        {loading ? (
          <CircularProgress size={22} />
        ) : current ? (
          <Box sx={{ width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
              <FeaturedTitle mb={0}>Todays Deal</FeaturedTitle>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", color: "gray" }}
                onClick={() => navigate(storeSlug ? `/store/${encodeURIComponent(String(storeSlug))}/today-deals` : "/today-deals")}
              >
                See all
              </Typography>
            </Box>
            <SmartProductCard product={current} storeSlug={storeSlug} onView={() => onView?.(current)} />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No today deal products yet.
          </Typography>
        )}
      </Box>
      <IconButton size="small" onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))} disabled={!canNext}>
        <ChevronRight fontSize="small" />
      </IconButton>
    </Box>
  );
}
