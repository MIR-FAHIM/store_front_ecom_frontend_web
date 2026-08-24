import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, IconButton, Typography, Stack, Chip, ToggleButton, ToggleButtonGroup, useTheme } from "@mui/material";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SideBar from "./SideBar";
import brandLogo from "../../../assets/logo/store_myzoo_logo_blue.png";
import { getAllShops } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";

const SellerLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stores, setStores] = useState([]);
  const theme = useTheme();
  const { i18n } = useTranslation();
  const isDark = theme.palette.mode === "dark";
  const activeLang = i18n.language?.startsWith("bn") ? "bn" : "en";

  useEffect(() => {
    const loadStores = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        const res = await getAllShops({ user_id: userId, page: 1, per_page: 50 });
        const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
        setStores(list);
      } catch (error) {
        setStores([]);
      }
    };

    loadStores();
  }, []);

  const publicStore = useMemo(() => {
    const selectedId = localStorage.getItem("storeId") || localStorage.getItem("shopId");
    return stores.find((store) => String(store?.id) === String(selectedId)) || stores[0] || null;
  }, [stores]);

  const publicStoreSlug = publicStore?.slug || publicStore?.shop_slug || publicStore?.store_slug || "";

  const handleOpenPublicStore = () => {
    if (!publicStoreSlug) return;
    window.open(`/store/${encodeURIComponent(String(publicStoreSlug))}`, "_blank", "noopener,noreferrer");
  };

  const handleLanguageChange = (_event, nextLang) => {
    if (!nextLang) return;
    i18n.changeLanguage(nextLang);
    localStorage.setItem("lang", nextLang);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: isDark ? "#0f1117" : "#f8fafc" }}>
      <SideBar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 1.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: isDark ? "#161822" : "#fff",
            backdropFilter: "blur(12px)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton
              onClick={() => setMobileOpen(true)}
              size="small"
              sx={{ display: { xs: "inline-flex", md: "none" }, bgcolor: isDark ? "#1e2030" : "#f1f5f9", "&:hover": { bgcolor: isDark ? "#262940" : "#e2e8f0" } }}
            >
              <MenuOutlined fontSize="small" />
            </IconButton>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box component="img" src={brandLogo} alt="Seller Panel" sx={{ width: 86, height: 34, objectFit: "contain", display: "block" }} />
              <Typography sx={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>
                Seller Panel
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              onClick={() => handleLanguageChange(null, activeLang === "bn" ? "en" : "bn")}
              size="small"
              aria-label="switch language"
              sx={{
                display: { xs: "inline-flex", sm: "none" },
                bgcolor: "#07145f",
                color: "#fff",
                borderRadius: 2,
                fontWeight: 900,
                "&:hover": { bgcolor: "#0f2f88" },
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 950 }}>{activeLang === "bn" ? "EN" : "BN"}</Typography>
            </IconButton>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={activeLang}
              onChange={handleLanguageChange}
              aria-label="seller language"
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                bgcolor: isDark ? "#1e2030" : "#f8fafc",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
                "& .MuiToggleButton-root": {
                  gap: 0.5,
                  px: 1.1,
                  py: 0.45,
                  border: 0,
                  borderRadius: "0 !important",
                  fontSize: 11,
                  fontWeight: 900,
                  textTransform: "none",
                  color: "text.secondary",
                },
                "& .Mui-selected": {
                  bgcolor: "#07145f !important",
                  color: "#fff !important",
                },
              }}
            >
              <ToggleButton value="en" aria-label="English language">
                <LanguageOutlinedIcon sx={{ fontSize: 15 }} />
                EN
              </ToggleButton>
              <ToggleButton value="bn" aria-label="Bangla language">
                বাংলা
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              size="small"
              variant="outlined"
              startIcon={<LaunchOutlinedIcon fontSize="small" />}
              disabled={!publicStoreSlug}
              onClick={handleOpenPublicStore}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800, display: { xs: "none", sm: "inline-flex" } }}
            >
              Public Store
            </Button>
            <Chip label="v2.0" size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: isDark ? "#1e2030" : "#f1f5f9", color: "text.secondary" }} />
          </Stack>
        </Box>

        {/* Page content */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default SellerLayout;
