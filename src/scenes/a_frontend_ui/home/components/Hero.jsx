import React, { useEffect, useState, useRef, useMemo } from "react";
import { Box, IconButton, CircularProgress, useTheme, useMediaQuery } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { getBanner } from "../../../../api/controller/admin_controller/media/banner_controller";
import { useNavigate } from "react-router-dom";
import { image_file_url } from "../../../../api/config";
import { categoryPath, productDetailPath } from "../../../../utils/productRoute";

export default function Hero({ storeParams = {} }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const storeSlug = storeParams?.store_slug || "";

  // MUI breakpoints: xs <600, sm 600-899, md 900-1199, lg 1200-1535, xl 1536+
  const isXs = useMediaQuery(theme.breakpoints.down("sm")); // phones
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md")); // small tablets
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getBanner(storeParams);
        const list = Array.isArray(res) ? res : res?.data || res?.data?.data || [];
        setBanners(list);
      } catch (e) {
        console.error("Failed to load banners:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storeParams]);

  // Keep index valid if banners length changes
  useEffect(() => {
    if (!banners.length) return;
    setIndex((i) => (i >= banners.length ? 0 : i));
  }, [banners.length]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!isPaused && banners.length > 1) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % banners.length);
      }, 5000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners, isPaused]);

  const prev = () => {
    if (!banners.length) return;
    setIndex((i) => (i - 1 + banners.length) % banners.length);
  };
  const next = () => {
    if (!banners.length) return;
    setIndex((i) => (i + 1) % banners.length);
  };

  const current = banners[index] || {};

  const bg = useMemo(() => {
    let fallback = "/assets/images/banner.jpg";
    if (current?.image?.file_name) return `${image_file_url}/${current.image.file_name}`;
    if (current?.image?.url) return current.image.url;
    if (current?.image_path) {
      return current.image_path.startsWith("http")
        ? current.image_path
        : `${image_file_url}/${current.image_path}`;
    }
    return fallback;
  }, [current]);

  // Responsive sizing (mobile smaller)
  const heroHeight = useMemo(() => {
    if (isXs) return 220;
    if (isSm) return 320;
    if (isMdUp) return 520;
    return 420;
  }, [isXs, isSm, isMdUp]);

  const arrowSize = isXs ? "small" : "medium";
  const arrowSx = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#fff",
    bgcolor: "rgba(0,0,0,0.25)",
    "&:hover": { bgcolor: "rgba(0,0,0,0.35)" },
    // Bigger tap-target on touch devices while keeping visual size reasonable
    width: isXs ? 40 : 44,
    height: isXs ? 40 : 44,
  };

  // Banner click handler
  const handleBannerClick = () => {
    if (current?.related_category_id) {
      navigate(categoryPath(current.related_category_id, storeSlug));
    } else if (current?.related_product_id) {
      navigate(productDetailPath({
        id: current.related_product_id,
        slug: current.related_product_slug || current.related_product?.slug,
      }, storeSlug));
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        height: heroHeight,
        borderRadius: { xs: 1, sm: 1 },
        position: "relative",
        overflow: "hidden",
        overflowX: "hidden",
        boxSizing: "border-box",
        mx: "auto",
        boxShadow: { xs: "0 10px 24px rgba(0,0,0,0.12)", md: "0 16px 32px rgba(0,0,0,0.12)" },
        bgcolor: "rgba(0,0,0,0.02)",
        cursor: (current?.related_category_id || current?.related_product_id) ? "pointer" : "default",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      // On touch devices, hover doesn't exist; pause while finger is on slider
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onClick={handleBannerClick}
    >
      {/* Background image */}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          backgroundImage: `url("${bg}")`,
          backgroundPosition: "center",
          backgroundSize: { xs: "cover", sm: "cover" },
          backgroundRepeat: "repeat",
          bgcolor: "rgba(0,0,0,0.06)",
          transition: "background-image 300ms ease",
        }}
      />

      {/* Navigation */}
      {banners.length > 1 && (
        <>
            <IconButton onClick={prev} size={arrowSize} sx={{ ...arrowSx, left: { xs: 6, sm: 8 } }}>
            <ChevronLeft />
          </IconButton>

            <IconButton onClick={next} size={arrowSize} sx={{ ...arrowSx, right: { xs: 6, sm: 8 } }}>
            <ChevronRight />
          </IconButton>

          {/* Dots */}
          <Box
            sx={{
              position: "absolute",
              bottom: { xs: 8, sm: 12 },
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: { xs: 0.75, sm: 1 },
              px: 1,
              py: 0.75,
              borderRadius: 999,
              bgcolor: "rgba(0,0,0,0.18)",
              backdropFilter: "blur(6px)",
            }}
          >
            {banners.map((_, i) => (
              <Box
                key={i}
                onClick={() => setIndex(i)}
                sx={{
                  width: { xs: 8, sm: 10 },
                  height: { xs: 8, sm: 10 },
                  borderRadius: "50%",
                  bgcolor: i === index ? "#fff" : "rgba(255,255,255,0.45)",
                  cursor: "pointer",
                }}
              />
            ))}
          </Box>
        </>
      )}

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.2)",
          }}
        >
          <CircularProgress color="inherit" />
        </Box>
      )}
    </Box>
  );
}
