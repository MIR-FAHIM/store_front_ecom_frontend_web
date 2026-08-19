import React, { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, useTheme } from "@mui/material";
import { getBanner } from "../../../../api/controller/admin_controller/media/banner_controller";
import { image_file_url } from "../../../../api/config";

const resolveBanner = (banner) => {
  if (banner?.image?.file_name) return `${image_file_url}/${banner.image.file_name}`;
  if (banner?.image?.url) return banner.image.url;
  if (banner?.image_path) {
    return banner.image_path.startsWith("http")
      ? banner.image_path
      : `${image_file_url}/${banner.image_path}`;
  }
  return "/assets/images/banner.jpg";
};

export default function BannerRow({ storeParams = {} }) {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getBanner(storeParams);
        const list = Array.isArray(res) ? res : res?.data || res?.data?.data || [];
        if (mounted) setItems(list);
      } catch (e) {
        console.error("loadBannerRow error:", e);
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

  const banners = useMemo(() => items.slice(0, 3), [items]);

  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
      }}
    >
      {loading ? (
        <Box sx={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        banners.map((banner, idx) => (
          <Box
            key={banner?.id ?? idx}
            sx={{
              height: { xs: 180, md: 200 },
              borderRadius: 1,
              overflow: "hidden",
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
              backgroundImage: `url("${resolveBanner(banner)}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: "rgba(0,0,0,0.04)",
            }}
          />
        ))
      )}
    </Box>
  );
}
