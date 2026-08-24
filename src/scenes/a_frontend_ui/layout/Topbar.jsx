import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Tooltip,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  Paper,
  Popper,
  Fade,
  ClickAwayListener,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
} from "@mui/material";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import BoltIcon from "@mui/icons-material/Bolt";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import HistoryIcon from "@mui/icons-material/History";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PersonIcon from "@mui/icons-material/Person";
import StorefrontIcon from "@mui/icons-material/Storefront";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LanguageIcon from "@mui/icons-material/Language";
import FolderIcon from "@mui/icons-material/Folder";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";

import { useNavigate } from "react-router-dom";
import { tokens } from "../../../theme.js";
import { image_file_url } from "../../../api/config/index.jsx";
import { getUserDetail } from "../../../api/controller/admin_controller/user_controller.jsx";
import { getWebsiteSetting } from "../../../api/controller/admin_controller/website_setting/website_setting_controller.jsx";
import { getUserWish } from "../../../api/controller/admin_controller/wishlist/wish_controller";
import { getCategoryWithAllChildren } from "../../../api/controller/admin_controller/category/category_controller";
import { fetchPublicStoreCategories } from "../../../api/controller/admin_controller/category/store_category_controller";
import { normalizeCategoryList } from "../../../utils/categoryTree";
import { categoriesPath, categoryPath, storeHomePath } from "../../../utils/productRoute";
import SearchProduct from "../search_product/SearchProduct.jsx";
import { useTranslation } from "react-i18next";
import { useStorefront } from "../../../context/StorefrontContext";

const buildImageUrl = (media) => {
  if (!media) return "";
  const direct = media?.url || media?.external_link;
  if (direct && /^https?:\/\//i.test(String(direct))) return String(direct);
  const fileName = media?.file_name || media?.file_original_name;
  if (fileName)
    return `${String(image_file_url || "").replace(/\/+$/, "")}/${String(fileName).replace(/^\/+/, "")}`;
  return "";
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

// ─── Mega Menu ────────────────────────────────────────────────────────────────

const MegaMenu = ({ open, anchorEl, categories, onClose, navigate, colors, border, storeSlug = "" }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const closeTimer = useRef(null);

  const activeCategory = categories[activeIndex] ?? null;
  const children = safeArray(activeCategory?.children);

  const handleMouseEnterMenu = () => {
    clearTimeout(closeTimer.current);
  };

  const handleMouseLeaveMenu = () => {
    closeTimer.current = setTimeout(onClose, 180);
  };

  useEffect(() => {
    if (open) setActiveIndex(0);
    return () => clearTimeout(closeTimer.current);
  }, [open]);

  if (!open || !anchorEl) return null;

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      transition
      style={{ zIndex: 1400 }}
      modifiers={[{ name: "offset", options: { offset: [0, 4] } }]}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={160}>
          <Paper
            onMouseEnter={handleMouseEnterMenu}
            onMouseLeave={handleMouseLeaveMenu}
            elevation={0}
            sx={{
              display: "flex",
              borderRadius: 0.5,
              border: `1px solid ${border}`,
              background: colors.primary[500],
              overflow: "hidden",
              minWidth: 680,
              maxWidth: 900,
              maxHeight: 480,
              boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
            }}
          >
            {/* Left: parent category list */}
            <Box
              sx={{
                width: 210,
                flexShrink: 0,
                borderRight: `1px solid ${border}`,
                overflowY: "auto",
                py: 1,
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-thumb": {
                  background: colors.primary[300],
                  borderRadius: 999,
                },
              }}
            >
              {categories.map((cat, idx) => {
                const icon = buildImageUrl(cat?.banner || cat?.icon || cat?.cover_image);
                const isActive = idx === activeIndex;
                return (
                  <Box
                    key={cat.id ?? cat.name}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      onClose();
                      if (cat?.id) navigate(categoryPath(cat.id, storeSlug));
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.2,
                      px: 1.5,
                      py: 0.9,
                      cursor: "pointer",
                      background: isActive ? colors.primary[400] : "transparent",
                      borderLeft: isActive
                        ? `3px solid ${colors.greenAccent?.[500] || "#4cceac"}`
                        : "3px solid transparent",
                      transition: "background 0.12s",
                      "&:hover": { background: colors.primary[400] },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                      {/* Category icon */}
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 1.5,
                          overflow: "hidden",
                          flexShrink: 0,
                          background: colors.primary[300],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {icon ? (
                          <Box
                            component="img"
                            src={icon}
                            alt={cat?.name}
                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <FolderIcon sx={{ fontSize: 15, color: colors.gray[400] }} />
                        )}
                      </Box>

                      <Typography
                        sx={{
                          fontSize: "0.8rem",
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? colors.gray[100] : colors.gray[300],
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cat?.name || "Category"}
                      </Typography>
                    </Box>

                    {safeArray(cat?.children).length > 0 && (
                      <KeyboardArrowRightIcon
                        sx={{
                          fontSize: 15,
                          color: isActive
                            ? colors.greenAccent?.[500] || "#4cceac"
                            : colors.gray[500],
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Box>
                );
              })}

              {/* See all */}
              <Divider sx={{ opacity: 0.1, my: 0.5 }} />
              <Box
                onClick={() => { onClose(); navigate(categoriesPath(storeSlug)); }}
                sx={{
                  px: 1.5,
                  py: 0.9,
                  cursor: "pointer",
                  "&:hover": { background: colors.primary[400] },
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: colors.greenAccent?.[400] || "#4cceac",
                  }}
                >
                  See all categories →
                </Typography>
              </Box>
            </Box>

            {/* Right: children grid */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                p: 2.5,
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-thumb": {
                  background: colors.primary[300],
                  borderRadius: 999,
                },
              }}
            >
              {children.length === 0 ? (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    sx={{ fontSize: "0.8rem", color: colors.gray[500] }}
                  >
                    No subcategories
                  </Typography>
                </Box>
              ) : (
                <>
                  {/* Header */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        color: colors.gray[100],
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {activeCategory?.name}
                    </Typography>
                    <Typography
                      onClick={() => {
                        onClose();
                        if (activeCategory?.id)
                          navigate(categoryPath(activeCategory.id, storeSlug));
                      }}
                      sx={{
                        fontSize: "0.72rem",
                        color: colors.greenAccent?.[400] || "#4cceac",
                        cursor: "pointer",
                        fontWeight: 600,
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      View all →
                    </Typography>
                  </Box>

                  {/* Subcategory grid */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                      gap: 2,
                    }}
                  >
                    {children.map((child) => {
                      const grandchildren = safeArray(child?.children);
                      return (
                        <Box key={child.id ?? child.name}>
                          {/* Sub heading */}
                          <Typography
                            onClick={() => {
                              onClose();
                              if (child?.id) navigate(categoryPath(child.id, storeSlug));
                            }}
                            sx={{
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              color: colors.gray[100],
                              cursor: "pointer",
                              mb: 0.6,
                              lineHeight: 1.3,
                              "&:hover": {
                                color:
                                  colors.greenAccent?.[400] || "#4cceac",
                              },
                            }}
                          >
                            {child?.name}
                          </Typography>

                          {/* Leaf items */}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                            }}
                          >
                            {grandchildren.slice(0, 20).map((leaf) => (
                              <Typography
                                key={leaf.id ?? leaf.name}
                                onClick={() => {
                                  onClose();
                                  if (leaf?.id)
                                    navigate(categoryPath(leaf.id, storeSlug));
                                }}
                                sx={{
                                  fontSize: "0.72rem",
                                  color: colors.gray[400],
                                  cursor: "pointer",
                                  lineHeight: 1.5,
                                  "&:hover": {
                                    color:
                                      colors.greenAccent?.[400] || "#4cceac",
                                    textDecoration: "underline",
                                  },
                                }}
                              >
                                {leaf.name}
                              </Typography>
                            ))}
                            {grandchildren.length > 20 && (
                              <Typography
                                onClick={() => {
                                  onClose();
                                  if (child?.id)
                                    navigate(categoryPath(child.id, storeSlug));
                                }}
                                sx={{
                                  fontSize: "0.7rem",
                                  color:
                                    colors.greenAccent?.[500] || "#4cceac",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  mt: 0.2,
                                  "&:hover": { textDecoration: "underline" },
                                }}
                              >
                                +{grandchildren.length - 20} more
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Fade>
      )}
    </Popper>
  );
};

// ─── Mobile Drawer ────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Home", path: "/", key: "home", icon: <HomeOutlinedIcon fontSize="small" /> },
  { label: "Flash Sale", path: "/flash-sale", icon: <LocalOfferOutlinedIcon fontSize="small" /> },
  { label: "Blogs", path: "/blogs", icon: <ArticleOutlinedIcon fontSize="small" /> },
  { label: "All Brands", path: "/brands", icon: <LabelOutlinedIcon fontSize="small" /> },
  { label: "All Categories", path: "/categories", key: "categories", icon: <CategoryOutlinedIcon fontSize="small" /> },
];

function MobileDrawer({ open, onClose, navigate, categories, colors, border, glass, user, initials, t, i18n, handleLangChange, handleLogout, handleAuthNavigate, storeSlug = "", storePath = (path) => path }) {
  const [catOpen, setCatOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState(null);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 296,
          bgcolor: colors.primary[500],
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.4, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${border}`, background: colors.primary[400] }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15, color: colors.greenAccent?.[400] || "#4cceac" }}>
          Menu
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: colors.gray[200], borderRadius: 2, border: `1px solid ${border}` }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* User info */}
      {user && (
        <Box sx={{ px: 2, py: 1.8, borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 38, height: 38, fontSize: 14, fontWeight: 700, bgcolor: colors.blueAccent?.[400] || "#6870fa", color: colors.gray[900] }}>{initials}</Avatar>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: colors.gray[100] }}>{user.name}</Typography>
            <Typography variant="caption" sx={{ color: colors.gray[400] }}>{user.email}</Typography>
          </Box>
        </Box>
      )}

      {/* Scrollable list */}
      <Box sx={{ flex: 1, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: colors.primary[300], borderRadius: 999 } }}>
        <List dense disablePadding>
          {/* Nav links */}
          {NAV_ITEMS.map((item) => {
            const path = item.key === "home"
              ? storeHomePath(storeSlug)
              : item.key === "categories"
                ? categoriesPath(storeSlug)
                : storePath(item.path);
            return (
              <ListItemButton key={item.path} onClick={() => { onClose(); navigate(path); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: colors.primary[400] } }}>
                <ListItemIcon sx={{ minWidth: 30, color: colors.gray[400] }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13, fontWeight: 600, color: colors.gray[100] }} />
              </ListItemButton>
            );
          })}

          <Divider sx={{ opacity: 0.1, my: 0.5 }} />

          {/* Categories */}
          <ListItemButton onClick={() => setCatOpen((p) => !p)} sx={{ px: 2, py: 1, "&:hover": { bgcolor: colors.primary[400] } }}>
            <ListItemIcon sx={{ minWidth: 30, color: colors.gray[400] }}><CategoryOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Shop by Category" primaryTypographyProps={{ fontSize: 13, fontWeight: 700, color: colors.gray[100] }} />
            {catOpen ? <ExpandLessIcon sx={{ color: colors.gray[400], fontSize: 18 }} /> : <ExpandMoreIcon sx={{ color: colors.gray[400], fontSize: 18 }} />}
          </ListItemButton>
          <Collapse in={catOpen} timeout="auto" unmountOnExit>
            <List dense disablePadding>
              {categories.map((cat) => (
                <Box key={cat.id ?? cat.name}>
                  <ListItemButton onClick={() => setExpandedCat((p) => (p === cat.id ? null : cat.id))} sx={{ pl: 4, pr: 2, py: 0.8, "&:hover": { bgcolor: colors.primary[400] } }}>
                    <ListItemText primary={cat.name} primaryTypographyProps={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[200] }} />
                    {safeArray(cat.children).length > 0 && (expandedCat === cat.id ? <ExpandLessIcon sx={{ color: colors.gray[500], fontSize: 16 }} /> : <ExpandMoreIcon sx={{ color: colors.gray[500], fontSize: 16 }} />)}
                  </ListItemButton>
                  <Collapse in={expandedCat === cat.id} timeout="auto" unmountOnExit>
                    <List dense disablePadding>
                      {safeArray(cat.children).map((child) => (
                        <ListItemButton key={child.id ?? child.name} onClick={() => { onClose(); navigate(categoryPath(child.id, storeSlug)); }} sx={{ pl: 6, pr: 2, py: 0.5, "&:hover": { bgcolor: colors.primary[400] } }}>
                          <ListItemText primary={child.name} primaryTypographyProps={{ fontSize: 12, color: colors.gray[400] }} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              ))}
              <ListItemButton onClick={() => { onClose(); navigate(categoriesPath(storeSlug)); }} sx={{ pl: 4, pr: 2, py: 0.8 }}>
                <ListItemText primary="See all categories →" primaryTypographyProps={{ fontSize: 12, fontWeight: 700, color: colors.greenAccent?.[400] || "#4cceac" }} />
              </ListItemButton>
            </List>
          </Collapse>

          <Divider sx={{ opacity: 0.1, my: 0.5 }} />

          {/* Seller + About */}
          <ListItemButton onClick={() => { onClose(); navigate("/seller-login"); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: colors.primary[400] } }}>
            <ListItemIcon sx={{ minWidth: 30, color: colors.gray[400] }}><StorefrontIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Seller Login" primaryTypographyProps={{ fontSize: 13, color: colors.gray[100] }} />
          </ListItemButton>
          <ListItemButton onClick={() => { onClose(); navigate("/seller-register"); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: colors.primary[400] } }}>
            <ListItemIcon sx={{ minWidth: 30, color: colors.gray[400] }}><StorefrontIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Seller Register" primaryTypographyProps={{ fontSize: 13, color: colors.gray[100] }} />
          </ListItemButton>
          <ListItemButton onClick={() => { onClose(); navigate(storePath("/about")); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: colors.primary[400] } }}>
            <ListItemIcon sx={{ minWidth: 30, color: colors.gray[400] }}><InfoOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="About" primaryTypographyProps={{ fontSize: 13, color: colors.gray[100] }} />
          </ListItemButton>

          <Divider sx={{ opacity: 0.1, my: 0.5 }} />

          {/* Auth */}
          {user ? (
            <>
              <ListItemButton onClick={() => { onClose(); navigate(storePath("/orders")); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: colors.primary[400] } }}>
                <ListItemIcon sx={{ minWidth: 30, color: colors.gray[400] }}><HistoryIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Order History" primaryTypographyProps={{ fontSize: 13, color: colors.gray[100] }} />
              </ListItemButton>
              <ListItemButton onClick={() => { onClose(); navigate(storePath("/profile")); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: colors.primary[400] } }}>
                <ListItemIcon sx={{ minWidth: 30, color: colors.gray[400] }}><PersonIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Profile" primaryTypographyProps={{ fontSize: 13, color: colors.gray[100] }} />
              </ListItemButton>
              <ListItemButton onClick={() => { handleLogout(); onClose(); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: colors.primary[400] } }}>
                <ListItemIcon sx={{ minWidth: 30 }}><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 13, fontWeight: 600, color: "error.main" }} />
              </ListItemButton>
            </>
          ) : (
            <>
              <ListItemButton onClick={() => { onClose(); handleAuthNavigate("/login"); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: colors.primary[400] } }}>
                <ListItemIcon sx={{ minWidth: 30, color: colors.gray[400] }}><AccountCircleIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Login" primaryTypographyProps={{ fontSize: 13, color: colors.gray[100] }} />
              </ListItemButton>
              <ListItemButton onClick={() => { onClose(); handleAuthNavigate("/register"); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: colors.primary[400] } }}>
                <ListItemIcon sx={{ minWidth: 30, color: colors.gray[400] }}><AccountCircleIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Register" primaryTypographyProps={{ fontSize: 13, color: colors.gray[100] }} />
              </ListItemButton>
            </>
          )}
        </List>
      </Box>

      {/* Language footer */}
      <Box sx={{ px: 2, py: 1.4, borderTop: `1px solid ${border}`, display: "flex", gap: 1 }}>
        {["en", "bn"].map((lang) => (
          <Button key={lang} size="small" variant={i18n.language === lang ? "contained" : "outlined"} onClick={() => handleLangChange(lang)} sx={{ flex: 1, borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: 12 }}>
            {lang === "en" ? "English" : "বাংলা"}
          </Button>
        ))}
      </Box>
    </Drawer>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

const Topbar = () => {
  const navigate = useNavigate();
  const { currentStoreSlug: storeSlug, storePath } = useStorefront();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const colors = tokens(theme.palette.mode);
  const border = colors.gray[600];
  const glass =
    theme.palette.mode === "dark" ? colors.primary[400] : colors.primary[300];
  const glass2 =
    theme.palette.mode === "dark" ? colors.primary[300] : colors.primary[200];

  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState({
    name: "ShopLogo",
    slogan: "Trendy picks, fast checkout",
    logoUrl: "",
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Category mega menu
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const categoryBtnRef = useRef(null);
  const megaCloseTimer = useRef(null);

  const [langAnchor, setLangAnchor] = useState(null);
  const langOpen = Boolean(langAnchor);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const initials = useMemo(() => {
    const n = (user?.name || "").trim();
    if (!n) return "U";
    const parts = n.split(" ").filter(Boolean);
    return ((parts[0] || "U").slice(0, 1) + (parts[1] || "").slice(0, 1)).toUpperCase();
  }, [user?.name]);

  const loadCounts = () => {
    try {
      const raw = localStorage.getItem("cart");
      const parsed = raw ? JSON.parse(raw) : 0;
      setCartCount(Array.isArray(parsed) ? parsed.length : Number(parsed || 0));
    } catch { setCartCount(0); }

    try {
      const storedId = localStorage.getItem("userId");
      if (storedId) {
        (async () => {
          try {
            const res = await getUserWish(storedId);
            const payload = res?.data?.data ?? res?.data ?? res ?? [];
            const items = Array.isArray(payload)
              ? payload.map((e) => e?.product ?? e).filter(Boolean)
              : [];
            setWishCount(items.length);
          } catch { setWishCount(0); }
        })();
      } else { setWishCount(0); }
    } catch { setWishCount(0); }
  };

  useEffect(() => {
    const loadWebsiteSetting = async () => {
      try {
        const res = await getWebsiteSetting();
        const data = (res?.data ?? res)?.data ?? (res?.data ?? res);
        if (data && typeof data === "object") {
          setBrand({
            name: data?.website_name || "ShopLogo",
            slogan: data?.slogan || "Trendy picks, fast checkout",
            logoUrl: buildImageUrl(data?.logo || null),
          });
        }
      } catch (e) { console.error("Failed to load website settings", e); }
    };

    const loadUser = async () => {
      try {
        const storedId = localStorage.getItem("userId");
        if (!storedId) return setUser(null);
        const res = await getUserDetail(storedId);
        setUser(res?.data?.data ?? res?.data ?? null);
      } catch { setUser(null); }
    };

    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = storeSlug
          ? await fetchPublicStoreCategories(storeSlug)
          : await getCategoryWithAllChildren();
        setCategories(safeArray(normalizeCategoryList(res)));
      } catch { setCategories([]); }
      finally { setLoadingCategories(false); }
    };

    loadWebsiteSetting();
    loadUser();
    loadCounts();
    loadCategories();

    const onAuth = () => loadUser();
    const onCart = () => loadCounts();
    window.addEventListener("auth-changed", onAuth);
    window.addEventListener("cart-updated", onCart);
    window.addEventListener("wishlist-updated", onCart);
    return () => {
      window.removeEventListener("auth-changed", onAuth);
      window.removeEventListener("cart-updated", onCart);
      window.removeEventListener("wishlist-updated", onCart);
    };
  }, [storeSlug]);

  // Mega menu hover handlers
  const handleCategoryBtnMouseEnter = () => {
    clearTimeout(megaCloseTimer.current);
    setMegaMenuOpen(true);
  };

  const handleCategoryBtnMouseLeave = () => {
    megaCloseTimer.current = setTimeout(() => setMegaMenuOpen(false), 180);
  };

  const handleMegaMenuClose = () => {
    clearTimeout(megaCloseTimer.current);
    setMegaMenuOpen(false);
  };

  const handleUserClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLangOpen = (e) => setLangAnchor(e.currentTarget);
  const handleLangClose = () => setLangAnchor(null);
  const handleLangChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
    handleLangClose();
  };

  const handleAuthNavigate = (path) => {
    if (storeSlug) sessionStorage.setItem("auth_redirect", `${window.location.pathname}${window.location.search}`);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    setUser(null);
    handleMenuClose();
    window.dispatchEvent(new Event("auth-changed"));
    navigate(storePath("/"));
  };

  return (
    <>
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        mb: 0,
        borderBottom: `1px solid ${border}`,
        background: colors.primary[500],
        backdropFilter: "blur(20px)",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          gap: 1,
          justifyContent: "space-between",
          py: { xs: 0.6, sm: 0.8 },
          minHeight: { xs: 54, sm: 64 },
          px: { xs: 1.5, sm: 2, md: 3 },
        }}
      >
        {/* Left: hamburger (mobile) + brand */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          {isMobile && (
            <IconButton
              onClick={() => setDrawerOpen(true)}
              size="small"
              sx={{ borderRadius: 2, border: `1px solid ${border}`, background: glass, color: colors.gray[100], "&:hover": { background: glass2 } }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", userSelect: "none" }} onClick={() => navigate(storeHomePath(storeSlug))}>
            <Box sx={{ width: { xs: 34, sm: 38 }, height: { xs: 34, sm: 38 }, borderRadius: 2.5, border: `1px solid ${border}`, background: glass, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              {brand.logoUrl ? (
                <Box component="img" src={brand.logoUrl} alt={brand.name} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <BoltIcon sx={{ color: colors.greenAccent?.[500] || "#4cceac" }} />
              )}
            </Box>
            <Box sx={{ lineHeight: 1.1 }}>
              <Typography sx={{ fontWeight: 800, letterSpacing: "-0.03em", color: colors.greenAccent?.[500] || "#4cceac", fontSize: { xs: 14, sm: 16 }, lineHeight: 1.2 }}>
                {brand.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, display: { xs: "none", sm: "block" }, opacity: 0.65, fontSize: 10 }}>
                {brand.slogan}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Center: search (hidden on xs) */}
        <Box sx={{ flex: 1, mx: { sm: 2, md: 3 }, display: { xs: "none", sm: "block" }, maxWidth: 720 }}>
          <SearchProduct placeholder={t("topbar.searchPlaceholder")} storeSlug={storeSlug} />
        </Box>

        {/* Right: actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 0.8 }, flexShrink: 0 }}>
          {/* Language — desktop only */}
          {!isMobile && (
            <Tooltip title={t("lang.label")}>
              <Button
                onClick={handleLangOpen}
                startIcon={<LanguageIcon sx={{ fontSize: 16 }} />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: 12, border: `1px solid ${border}`, background: glass, px: 1.2, py: 0.6, minWidth: 58, color: colors.gray[100], "&:hover": { background: glass2 } }}
              >
                {i18n.language === "bn" ? "BN" : "EN"}
              </Button>
            </Tooltip>
          )}
          <Menu anchorEl={langAnchor} open={langOpen} onClose={handleLangClose} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
            <MenuItem onClick={() => handleLangChange("en")}>{t("lang.english")}</MenuItem>
            <MenuItem onClick={() => handleLangChange("bn")}>{t("lang.bangla")}</MenuItem>
          </Menu>

          {/* Wishlist */}
          <Tooltip title={t("topbar.wishlist")}>
            <IconButton onClick={() => navigate(storePath("/wish"))} sx={{ borderRadius: 2, border: `1px solid ${border}`, background: glass, color: colors.gray[100], "&:hover": { background: glass2, transform: "translateY(-1px)" }, transition: "transform 120ms ease" }}>
              <Badge badgeContent={wishCount} color="secondary"><FavoriteIcon sx={{ fontSize: { xs: 20, sm: 22 } }} /></Badge>
            </IconButton>
          </Tooltip>

          {/* Cart */}
          <Tooltip title={t("topbar.cart")}>
            <IconButton onClick={() => navigate(storePath("/cart"))} sx={{ borderRadius: 2, border: `1px solid ${border}`, background: theme.palette.secondary.main, color: colors.gray[900], "&:hover": { opacity: 0.9, transform: "translateY(-1px)" }, transition: "transform 120ms ease" }}>
              <Badge badgeContent={cartCount} color="error"><ShoppingCartIcon sx={{ fontSize: { xs: 20, sm: 22 } }} /></Badge>
            </IconButton>
          </Tooltip>

          {/* User — desktop */}
          {!isMobile && (
            user?.user_type === "customer" ? (
              <>
                <Tooltip title={t("topbar.menu.account")}>
                  <Button
                    onClick={handleUserClick}
                    sx={{ ml: 0.4, borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: 13, border: `1px solid ${border}`, background: glass, px: 1.2, py: 0.5, gap: 0.8, color: colors.gray[100], "&:hover": { background: glass2 } }}
                    startIcon={<Avatar sx={{ width: 24, height: 24, fontSize: 11, fontWeight: 700, bgcolor: colors.blueAccent?.[400] || "#6870fa", color: colors.gray[900] }}>{initials}</Avatar>}
                  >
                    <Box sx={{ display: { xs: "none", lg: "block" }, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user?.name}
                    </Box>
                  </Button>
                </Tooltip>
                <Menu id="user-menu" anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} PaperProps={{ sx: { mt: 1, borderRadius: 3, minWidth: 250, border: `1px solid ${border}`, background: colors.primary[500] } }}>
                  <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{user?.name}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.2 }}>{user?.email}</Typography>
                    <Chip size="small" label={t("topbar.menu.verified")} sx={{ mt: 1, borderRadius: 999, fontWeight: 600, background: glass, border: `1px solid ${border}` }} />
                  </Box>
                  <Divider sx={{ opacity: 0.12 }} />
                  <MenuItem onClick={() => { handleMenuClose(); navigate(storePath("/orders")); }}><ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>{t("topbar.menu.orderHistory")}</MenuItem>
                  <MenuItem onClick={() => { handleMenuClose(); navigate(storePath("/profile")); }}><ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>{t("topbar.menu.profile")}</MenuItem>
                  <MenuItem onClick={() => { handleMenuClose(); navigate(storePath("/wish")); }}><ListItemIcon><FavoriteIcon fontSize="small" /></ListItemIcon>{t("topbar.menu.wishList")}</MenuItem>
                  <Divider sx={{ opacity: 0.12 }} />
                  <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}><ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>{t("topbar.menu.logout")}</MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: "flex", gap: 0.8, ml: 0.4 }}>
                <Button onClick={() => handleAuthNavigate("/login")} size="small" sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: 12, border: `1px solid ${border}`, background: glass, color: colors.gray[100], px: 1.4, "&:hover": { background: glass2 } }}>Login</Button>
                <Button onClick={() => handleAuthNavigate("/register")} size="small" variant="contained" sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: 12, px: 1.4 }}>Register</Button>
              </Box>
            )
          )}

          {/* User avatar — mobile only */}
          {isMobile && (
            user?.user_type === "customer" ? (
              <>
                <IconButton onClick={handleUserClick} sx={{ borderRadius: 2, border: `1px solid ${border}`, background: glass, p: 0.5 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: 12, fontWeight: 700, bgcolor: colors.blueAccent?.[400] || "#6870fa", color: colors.gray[900] }}>{initials}</Avatar>
                </IconButton>
                <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} PaperProps={{ sx: { mt: 1, borderRadius: 3, minWidth: 220, border: `1px solid ${border}`, background: colors.primary[500] } }}>
                  <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{user?.name}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{user?.email}</Typography>
                  </Box>
                  <Divider sx={{ opacity: 0.12 }} />
                  <MenuItem onClick={() => { handleMenuClose(); navigate(storePath("/orders")); }}><ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>Orders</MenuItem>
                  <MenuItem onClick={() => { handleMenuClose(); navigate(storePath("/profile")); }}><ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>Profile</MenuItem>
                  <Divider sx={{ opacity: 0.12 }} />
                  <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}><ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <IconButton onClick={() => handleAuthNavigate("/login")} sx={{ borderRadius: 2, border: `1px solid ${border}`, background: glass, color: colors.gray[100], "&:hover": { background: glass2 } }}>
                <AccountCircleIcon sx={{ fontSize: 22 }} />
              </IconButton>
            )
          )}
        </Box>
      </Toolbar>

      {/* Secondary nav — desktop only */}
      <Box
        sx={{
          borderTop: `1px solid ${border}`,
          background: colors.primary[500],
          px: { md: 2, lg: 3 },
          py: 0.6,
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          gap: 1,
          overflowX: "auto",
          "&::-webkit-scrollbar": { height: 4 },
          "&::-webkit-scrollbar-thumb": { background: colors.primary[300], borderRadius: 999 },
        }}
      >
        {/* ✅ Category button with hover mega menu */}
        <Box
          ref={categoryBtnRef}
          onMouseEnter={handleCategoryBtnMouseEnter}
          onMouseLeave={handleCategoryBtnMouseLeave}
          sx={{ position: "relative" }}
        >
          <Button
            endIcon={
              <KeyboardArrowDownIcon
                sx={{
                  transition: "transform 0.2s",
                  transform: megaMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            }
            sx={{
              borderRadius: .5,
              textTransform: "none",
              fontWeight: 700,
              fontSize: 13,
              px: 2,
              py: 0.75,
              width: { xs: "auto", sm: 180 },
              background: colors.yellowAccent ? colors.yellowAccent[500] : "#f5d000",
              color: colors.gray[100],
              border: `1px solid ${border}`,
              whiteSpace: "nowrap",
              "&:hover": { opacity: 0.92 },
            }}
          >
            {loadingCategories ? "Loading…" : "Categories"}
          </Button>

          {/* Mega menu */}
          <MegaMenu
            open={megaMenuOpen}
            anchorEl={categoryBtnRef.current}
            categories={categories}
            onClose={handleMegaMenuClose}
            navigate={navigate}
            colors={colors}
            border={border}
            storeSlug={storeSlug}
          />
        </Box>

        {/* Nav links + Helpline */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, whiteSpace: "nowrap", flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {[
              { label: "Home", path: storeHomePath(storeSlug) },
              { label: "Flash Sale", path: storePath("/flash-sale") },
              { label: "Blogs", path: storePath("/blogs") },
              { label: "All Brands", path: storePath("/brands") },
              { label: "All Categories", path: categoriesPath(storeSlug) },
            ].map((item) => (
              <Button
                key={item.label}
                onClick={() => navigate(item.path)}
                sx={{ textTransform: "none", fontWeight: 500, fontSize: 13, color: colors.gray[100], borderRadius: 1.5, px: 1.4, py: 0.4, "&:hover": { background: colors.primary[400] } }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          <Box sx={{ flex: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Button onClick={() => navigate("/seller-login")} startIcon={<StorefrontIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: "none", fontWeight: 500, fontSize: 12, color: colors.gray[300], px: 1, py: 0.4, borderRadius: 1.5, "&:hover": { background: colors.primary[400], color: colors.gray[100] } }}>Seller Login</Button>
            <Button onClick={() => navigate("/seller-register")} startIcon={<StorefrontIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: "none", fontWeight: 500, fontSize: 12, color: colors.gray[300], px: 1, py: 0.4, borderRadius: 1.5, "&:hover": { background: colors.primary[400], color: colors.gray[100] } }}>Seller Register</Button>
            <Button onClick={() => navigate(storePath("/about"))} startIcon={<InfoOutlinedIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: "none", fontWeight: 500, fontSize: 12, color: colors.gray[300], px: 1, py: 0.4, borderRadius: 1.5, "&:hover": { background: colors.primary[400], color: colors.gray[100] } }}>About</Button>
            <Divider orientation="vertical" flexItem sx={{ opacity: 0.2, mx: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#000000", whiteSpace: "nowrap", fontSize: 11 }}>
              Helpline: <Box component="span" sx={{ color: colors.gray[100], ml: 0.3 }}>+88 09611-677686</Box>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Mobile Search row */}
      <Box sx={{ px: 1.5, pb: 1, display: { xs: "block", sm: "none" } }}>
        <SearchProduct isMobile placeholder="Search products..." storeSlug={storeSlug} />
      </Box>
    </AppBar>

    {/* Mobile Drawer */}
    <MobileDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      navigate={navigate}
      categories={categories}
      colors={colors}
      border={border}
      glass={glass}
      user={user}
      initials={initials}
      t={t}
      i18n={i18n}
      handleLangChange={handleLangChange}
      handleLogout={handleLogout}
      handleAuthNavigate={handleAuthNavigate}
      storeSlug={storeSlug}
      storePath={storePath}
    />
    </>
  );
};

export default Topbar;
