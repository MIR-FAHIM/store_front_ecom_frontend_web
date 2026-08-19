import React, { useEffect, useRef, useState, useMemo } from "react";
import { Box, CircularProgress, useTheme } from "@mui/material";
import { getBanner } from "../../../../api/controller/admin_controller/media/banner_controller";
import { image_file_url } from "../../../../api/config";
import { useNavigate } from "react-router-dom";

const resolveBg = (banner) => {
  if (banner?.image?.file_name) return `${image_file_url}/${banner.image.file_name}`;
  if (banner?.image?.url) return banner.image.url;
  if (banner?.image_path)
    return banner.image_path.startsWith("http")
      ? banner.image_path
      : `${image_file_url}/${banner.image_path}`;
  return "/assets/images/banner.jpg";
};

export default function MobileHero({ storeParams = {} }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getBanner(storeParams);
        const list = Array.isArray(res) ? res : res?.data || res?.data?.data || [];
        setBanners(list.slice(0, 5));
      } catch (e) {
        console.error("MobileHero banner error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storeParams]);

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % banners.length), 4000);
    return () => clearInterval(timerRef.current);
  }, [banners.length]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      setIndex((i) => {
        if (diff < 0) return (i + 1) % banners.length;
        return (i - 1 + banners.length) % banners.length;
      });
    }
    touchStartX.current = null;
  };

  const current = banners[index];
  const bg = useMemo(() => (current ? resolveBg(current) : "/assets/images/banner.jpg"), [current]);

  if (loading) {
    return (
      <Box sx={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,0,0,0.05)", borderRadius: 2 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box
      sx={{ position: "relative", borderRadius: 2, overflow: "hidden", mx: 1.5 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Banner image */}
      <Box
        onClick={() => current?.link && navigate(current.link)}
        sx={{
          height: 180,
          backgroundImage: `url("${bg}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          cursor: current?.link ? "pointer" : "default",
          transition: "background-image 0.4s ease",
        }}
      />

      {/* Gradient overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Dot indicators */}
      {banners.length > 1 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 0.6,
          }}
        >
          {banners.map((_, i) => (
            <Box
              key={i}
              onClick={() => setIndex(i)}
              sx={{
                width: i === index ? 18 : 6,
                height: 6,
                borderRadius: 3,
                bgcolor: i === index ? "#fff" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "width 0.25s ease",
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
