import React, { useEffect, useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  Stack,
  Avatar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  DashboardOutlined,
  Inventory2Outlined,
  ShoppingCartOutlined,
  InsightsOutlined,
  AccountBalanceWalletOutlined,
  StorefrontOutlined,
  PointOfSaleOutlined,
  ReceiptLongOutlined,
  LogoutOutlined,
  WorkspacePremiumOutlined,
  ImageOutlined,
  CategoryOutlined,
  LibraryBooksOutlined,
  DesignServicesOutlined,
  CollectionsOutlined,
  QrCode2Outlined,
} from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getUserDetail } from "../../../api/controller/admin_controller/user_controller";

const drawerWidth = 260;
const sidebarBg = "#07145f";
const sidebarBorder = "rgba(255,255,255,0.12)";
const sidebarText = "#eef2ff";
const sidebarMuted = "#a7b4e8";
const sidebarActiveBg = "rgba(255,255,255,0.14)";
const sidebarHoverBg = "rgba(255,255,255,0.09)";
const sidebarAccent = "#facc15";

const navGroups = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: <DashboardOutlined />, path: "/seller/dashboard" },
      { label: "Analytics", icon: <InsightsOutlined />, path: "/seller/dashboard" },
    ],
  },
  {
    title: "Commerce",
    items: [
      { label: "POS", icon: <PointOfSaleOutlined />, path: "/seller/pos" },
      { label: "Shops", icon: <StorefrontOutlined />, path: "/seller/shops" },
      { label: "Store Products", icon: <Inventory2Outlined />, path: "/seller/products" },
      { label: "Product Catalog", icon: <LibraryBooksOutlined />, path: "/seller/catalog" },
      { label: "Creative Marketplace", icon: <DesignServicesOutlined />, path: "/seller/media-marketplace" },
      { label: "Media Library", icon: <CollectionsOutlined />, path: "/seller/media-library" },
      { label: "Banners", icon: <ImageOutlined />, path: "/seller/banners" },
      { label: "Store QR", icon: <QrCode2Outlined />, path: "/seller/store-qr" },
      { label: "Categories", icon: <CategoryOutlined />, path: "/seller/categories" },
      { label: "Orders", icon: <ShoppingCartOutlined />, path: "/seller/orders" },
      { label: "Packages", icon: <WorkspacePremiumOutlined />, path: "/seller/packages" },
    ],
  },
  {
    title: "Accounting",
    items: [
      { label: "Bank Account", icon: <AccountBalanceWalletOutlined />, path: "/seller/accounting" },
      { label: "Transactions", icon: <ReceiptLongOutlined />, path: "/seller/accounting/settled-amount-history" },
    ],
  },
];

const SideBar = ({ mobileOpen = false, onMobileClose }) => {
  const theme = useTheme();
  const location = useLocation();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Seller");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedId = localStorage.getItem("userId");
        if (!storedId) { setUserName("Seller"); return; }
        const res = await getUserDetail(storedId);
        const user = res?.data?.data ?? res?.data ?? null;
        const name = user?.name || user?.full_name || user?.user_name;
        setUserName(name || "Seller");
      } catch (e) {
        console.error("Failed to load seller name", e);
        setUserName("Seller");
      }
    };
    loadUser();
    const onAuth = () => loadUser();
    window.addEventListener("auth-changed", onAuth);
    return () => window.removeEventListener("auth-changed", onAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    setUserName("Seller");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/");
  };

  const renderItem = (item) => {
    const active = location.pathname === item.path ||
      (item.path === "/seller/products" && location.pathname.includes("/products")) ||
      (item.path === "/seller/catalog" && location.pathname.includes("/catalog")) ||
      (item.path === "/seller/media-marketplace" && location.pathname.includes("/media-marketplace")) ||
      (item.path === "/seller/media-library" && location.pathname.includes("/media-library")) ||
      (item.path === "/seller/store-qr" && location.pathname.includes("/store-qr"));
    return (
      <ListItemButton
        key={item.label}
        component={Link}
        to={item.path}
        sx={{
          borderRadius: 2.5,
          mb: 0.4,
          py: 0.8,
          px: 1.5,
          color: active ? "#fff" : sidebarMuted,
          bgcolor: active ? sidebarActiveBg : "transparent",
          "&:hover": { bgcolor: sidebarHoverBg, color: "#fff" },
          transition: "all .15s ease",
        }}
      >
        <ListItemIcon sx={{ minWidth: 34, color: active ? sidebarAccent : sidebarMuted }}>
          {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: 13, letterSpacing: 0.1 }}
        />
        {active && (
          <Box sx={{ width: 4, height: 20, borderRadius: 4, bgcolor: sidebarAccent, ml: 0.5 }} />
        )}
      </ListItemButton>
    );
  };

  const content = (
    <Box
      sx={{
        height: "100%",
        bgcolor: sidebarBg,
        borderRight: "1px solid",
        borderColor: sidebarBorder,
        px: 2,
        py: 2.5,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Profile section */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: sidebarAccent, color: sidebarBg, fontWeight: 800, fontSize: 16 }}>
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: sidebarText, fontWeight: 800, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName}
            </Typography>
            <Typography variant="caption" sx={{ color: sidebarMuted, fontSize: 11 }}>
              Seller Account
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Nav groups */}
      <Box sx={{ flex: 1, overflowY: "auto", mx: -0.5, px: 0.5 }}>
        {navGroups.map((group) =>
          group.items.length === 0 ? null : (
            <Box key={group.title} sx={{ mb: 2.5 }}>
              <Typography
                variant="overline"
                sx={{ color: "rgba(255,255,255,0.48)", fontWeight: 800, fontSize: 10, letterSpacing: 1.2, pl: 1.5 }}
              >
                {group.title}
              </Typography>
              <List disablePadding sx={{ mt: 0.5 }}>
                {group.items.map(renderItem)}
              </List>
            </Box>
          )
        )}
      </Box>

      {/* Store status + logout */}
      <Box sx={{ pt: 2, borderTop: "1px solid", borderColor: sidebarBorder }}>
        <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.22)", mb: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#86efac", fontSize: 11 }}>
                Store Online
              </Typography>
              <Typography variant="caption" sx={{ display: "block", color: sidebarMuted, fontSize: 10 }}>
                Accepting orders
              </Typography>
            </Box>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981", boxShadow: "0 0 8px #10b98180" }} />
          </Stack>
        </Box>
        <Button
          fullWidth
          size="small"
          startIcon={<LogoutOutlined sx={{ fontSize: 16 }} />}
          onClick={handleLogout}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            fontSize: 12,
            borderRadius: 2.5,
            color: "#ef4444",
            justifyContent: "flex-start",
            px: 1.5,
            "&:hover": { bgcolor: "rgba(239,68,68,0.12)" },
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{ keepMounted: true }}
          sx={{ "& .MuiDrawer-paper": { width: drawerWidth, border: "none" } }}
        >
          {content}
        </Drawer>
      )}
      {isDesktop && (
        <Drawer
          variant="permanent"
          open
          sx={{ "& .MuiDrawer-paper": { width: drawerWidth, border: "none" } }}
        >
          {content}
        </Drawer>
      )}
    </Box>
  );
};

export default SideBar;
