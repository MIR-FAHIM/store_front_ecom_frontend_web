import React, { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, useTheme } from "@mui/material";
import { getBanner } from "../../../../api/controller/admin_controller/media/banner_controller";
import { image_file_url } from "../../../../api/config";
import { useNavigate } from "react-router-dom";

const resolveBanner = (banner) => {
  if (banner?.image?.file_name) return `${image_file_url}/${banner.image.file_name}`;
  if (banner?.image?.url) return banner.image.url;
  if (banner?.image_path)
    return banner.image_path.startsWith("http")
      ? banner.image_path
      : `${image_file_url}/${banner.image_path}`;
  return "/assets/images/banner.jpg";
};

export default function MobilePromoBanner({ bannerIndex = 1, storeParams = {} }) {
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getBanner(storeParams);
        const list = Array.isArray(res) ? res : res?.data || res?.data?.data || [];
        if (mounted) setBanner(list[bannerIndex] || list[0] || null);
      } catch (e) {
        if (mounted) setBanner(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [bannerIndex, storeParams]);

  const bg = useMemo(() => (banner ? resolveBanner(banner) : "/assets/images/banner.jpg"), [banner]);

  if (loading) {
    return (
      <Box sx={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (!banner) return null;

  return (
    <Box
      onClick={() => banner?.link && navigate(banner.link)}
      sx={{
        mx: 1.5,
        height: 100,
        borderRadius: 2.5,
        backgroundImage: `url("${bg}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        cursor: banner?.link ? "pointer" : "default",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        overflow: "hidden",
        "&:active": { opacity: 0.92 },
        transition: "opacity 0.15s ease",
      }}
    />
  );
}
