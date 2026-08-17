import React, { useContext, useState } from "react";
import { Box, Typography, Collapse, IconButton, Tooltip } from "@mui/material";
import { Sidebar } from "react-pro-sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MenuOutlined,
  DashboardOutlined,
  Inventory2Outlined,
  ShoppingCartOutlined,
  ReceiptLongOutlined,
  StorefrontOutlined,
  DeliveryDiningOutlined,
  SettingsOutlined,
  AccountBalanceOutlined,
  AddBoxOutlined,
  WarningAmberOutlined,
  TuneOutlined,
  BarChartOutlined,
  PointOfSaleOutlined,
  TodayOutlined,
  CalendarMonthOutlined,
  LocalShippingOutlined,
  PersonAddAltOutlined,
  PermMediaOutlined,
  ImageOutlined,
  CollectionsOutlined,
  LanguageOutlined,
  AccountBalanceWalletOutlined,
  CurrencyExchangeOutlined,
  PeopleAltOutlined,
  BugReportOutlined,
  ExpandLess,
  ExpandMore,
  FormatListBulleted,
  CheckCircleOutline,
  LoginOutlined,
  CategoryOutlined,
  LocalOfferOutlined,
  CardMembershipOutlined,
} from "@mui/icons-material";
import defaultLogo from "../../../assets/images/logo.png";
import { ToggledContext } from "../../../App";
import { appClient, appLogo, appname } from "../../../api/config/index";
import { getProjectText } from "../../../config/projectSettings";

// Always-dark sidebar palette
const S = {
  bg:        "#0f172a",
  border:    "#1e293b",
  text:      "#f1f5f9",
  muted:     "#64748b",
  accent:    "#6366f1",
  accentBg:  "rgba(99,102,241,0.15)",
  hover:     "rgba(255,255,255,0.05)",
  groupLbl:  "#334155",
  activeTxt: "#ffffff",
};

const NAV_GROUPS = [
  {
    items: [
      { title: "Dashboard",      path: "/admin",     icon: <DashboardOutlined   fontSize="small" /> },
      { title: "POS Management", path: "/admin/pos", icon: <PointOfSaleOutlined fontSize="small" /> },
    ],
  },
  {
    label: "CATALOG",
    items: [
      {
        title: "Products", key: "product", icon: <Inventory2Outlined fontSize="small" />,
        children: [
          { title: "Add Product",    path: "/ecom/product/add",        icon: <AddBoxOutlined       fontSize="small" /> },
          { title: "All Products",   path: "/ecom/product/all",        icon: <FormatListBulleted   fontSize="small" /> },
          { title: "Inactive",       path: "/ecom/product/inactive",   icon: <WarningAmberOutlined fontSize="small" /> },
          { title: "Stock Out",      path: "/ecom/product/stock-out",  icon: <WarningAmberOutlined fontSize="small" /> },
          { title: "Attribute",      path: "/ecom/product/attribute",  icon: <TuneOutlined         fontSize="small" /> },
          { title: "Add Category",   path: "/ecom/category/add",       icon: <CategoryOutlined     fontSize="small" /> },
          { title: "Brands",         path: "/ecom/brand/manage",       icon: <LocalOfferOutlined   fontSize="small" /> },
        ],
      },
      {
        title: "Orders", key: "order", icon: <ReceiptLongOutlined fontSize="small" />,
        children: [
          { title: "All Orders",  path: "/ecom/order/all",       icon: <ReceiptLongOutlined fontSize="small" /> },
          { title: "Completed",   path: "/ecom/order/completed", icon: <CheckCircleOutline  fontSize="small" /> },
        ],
      },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      {
        title: "Sellers", key: "seller", icon: <StorefrontOutlined fontSize="small" />,
        children: [
          { title: "Add Seller",  path: "/ecom/seller/add", icon: <PersonAddAltOutlined fontSize="small" /> },
          { title: "All Sellers", path: "/ecom/seller/all", icon: <StorefrontOutlined   fontSize="small" /> },
        ],
      },
      {
        title: "Subscription Packages",
        path: "/admin/subscription-packages",
        icon: <CardMembershipOutlined fontSize="small" />,
      },
      {
        title: "Customers", key: "customer", icon: <PeopleAltOutlined fontSize="small" />,
        children: [
          { title: "Add Customer",  path: "/ecom/customer/add", icon: <PersonAddAltOutlined fontSize="small" /> },
          { title: "All Customers", path: "/ecom/customer/all", icon: <PeopleAltOutlined   fontSize="small" /> },
        ],
      },
      {
        title: "Delivery", key: "delivery", icon: <LocalShippingOutlined fontSize="small" />,
        children: [
          { title: "Add Delivery Man",   path: "/ecom/delivery/add", icon: <PersonAddAltOutlined fontSize="small" /> },
          { title: "All Delivery Men",   path: "/ecom/delivery/all", icon: <DeliveryDiningOutlined fontSize="small" /> },
        ],
      },
    ],
  },
  {
    label: "ANALYTICS",
    items: [
      {
        title: "Reports", key: "report", icon: <BarChartOutlined fontSize="small" />,
        children: [
          { title: "Today Report", path: "/ecom/report/today",      icon: <TodayOutlined         fontSize="small" /> },
          { title: "Month Wise",   path: "/ecom/report/month-wise", icon: <CalendarMonthOutlined fontSize="small" /> },
          { title: "Login Success", path: "/ecom/report/login-success", icon: <LoginOutlined fontSize="small" /> },
        ],
      },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      {
        title: "Media", key: "media", icon: <PermMediaOutlined fontSize="small" />,
        children: [
          { title: "Add Banner", path: "/ecom/banner/add",  icon: <ImageOutlined      fontSize="small" /> },
          { title: "All Media",  path: "/ecom/media/all",   icon: <CollectionsOutlined fontSize="small" /> },
        ],
      },
      {
        title: "Settings", key: "setting", icon: <SettingsOutlined fontSize="small" />,
        children: [
          { title: "Website Logo",  path: "/ecom/setting/website-logo",  icon: <LanguageOutlined       fontSize="small" /> },
          { title: "Shipping Cost", path: "/ecom/setting/shipping-cost", icon: <LocalShippingOutlined  fontSize="small" /> },
        ],
      },
      {
        title: "Accounts", key: "accounts", icon: <AccountBalanceOutlined fontSize="small" />,
        children: [
          { title: "Ledgers",      path: "/ecom/accounts/transactions", icon: <AccountBalanceWalletOutlined fontSize="small" /> },
          { title: "Settlements",  path: "/ecom/accounts/settlements",  icon: <CurrencyExchangeOutlined     fontSize="small" /> },
        ],
      },
      {
        title: "Error Log",
        path: "/ecom/error-log",
        icon: <BugReportOutlined fontSize="small" />,
      },
    ],
  },
];

const brandLogo = appLogo || (appClient === "myzoo" ? defaultLogo : "");

// ── Flat nav item (no children)
function NavItem({ item, collapsed, isActive, onClick }) {
  const title = getProjectText(item.title);

  return (
    <Tooltip title={collapsed ? title : ""} placement="right" arrow>
      <Box
        component="a"
        href={item.path}
        onClick={onClick}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          px: "14px",
          py: "8px",
          mx: "8px",
          borderRadius: "8px",
          cursor: "pointer",
          textDecoration: "none",
          background: isActive ? S.accentBg : "transparent",
          border: `1px solid ${isActive ? "rgba(99,102,241,0.25)" : "transparent"}`,
          color: isActive ? S.activeTxt : S.muted,
          transition: "all 0.15s ease",
          "&:hover": { background: isActive ? S.accentBg : S.hover, color: S.text },
        }}
      >
        <Box sx={{ color: isActive ? S.accent : "inherit", display: "flex", flexShrink: 0 }}>
          {item.icon}
        </Box>
        {!collapsed && (
          <Typography sx={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: "inherit", flex: 1, lineHeight: 1.4 }}>
            {title}
          </Typography>
        )}
        {!collapsed && isActive && (
          <Box sx={{ width: 5, height: 5, borderRadius: "50%", background: S.accent, flexShrink: 0 }} />
        )}
      </Box>
    </Tooltip>
  );
}

// ── Group header that expands/collapses
function GroupItem({ item, collapsed, isOpen, hasActive, onToggle, children }) {
  const title = getProjectText(item.title);

  return (
    <Box>
      <Tooltip title={collapsed ? title : ""} placement="right" arrow>
        <Box
          onClick={onToggle}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            px: "14px",
            py: "8px",
            mx: "8px",
            borderRadius: "8px",
            cursor: "pointer",
            background: hasActive ? "rgba(99,102,241,0.06)" : "transparent",
            color: hasActive ? S.text : S.muted,
            transition: "all 0.15s ease",
            "&:hover": { background: S.hover, color: S.text },
          }}
        >
          <Box sx={{ color: hasActive ? S.accent : "inherit", display: "flex", flexShrink: 0 }}>
            {item.icon}
          </Box>
          {!collapsed && (
            <>
              <Typography sx={{ fontSize: 13, fontWeight: hasActive ? 600 : 500, color: "inherit", flex: 1, lineHeight: 1.4 }}>
                {title}
              </Typography>
              <Box sx={{ color: S.groupLbl, display: "flex" }}>
                {isOpen ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
              </Box>
            </>
          )}
        </Box>
      </Tooltip>

      {!collapsed && (
        <Collapse in={isOpen} timeout={200}>
          <Box sx={{ ml: "22px", borderLeft: `1px solid ${S.border}`, pl: "8px", my: "2px" }}>
            {children}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

// ── Child item inside group
function ChildItem({ item, isActive, onClick }) {
  const title = getProjectText(item.title);

  return (
    <Box
      component="a"
      href={item.path}
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        px: "10px",
        py: "7px",
        borderRadius: "6px",
        cursor: "pointer",
        textDecoration: "none",
        background: isActive ? S.accentBg : "transparent",
        color: isActive ? S.activeTxt : S.muted,
        transition: "all 0.15s ease",
        "&:hover": { background: S.hover, color: S.text },
      }}
    >
      <Box sx={{ color: isActive ? S.accent : "inherit", display: "flex", flexShrink: 0 }}>
        {item.icon}
      </Box>
      <Typography sx={{ fontSize: 12.5, fontWeight: isActive ? 600 : 400, color: "inherit", lineHeight: 1.4 }}>
        {title}
      </Typography>
    </Box>
  );
}

// ── Main Sidebar
const SideBar = () => {
  const [collapsed, setCollapsed]  = useState(false);
  const [openGroup, setOpenGroup]  = useState(null);
  const { toggled, setToggled }    = useContext(ToggledContext);
  const location                   = useLocation();
  const navigate                   = useNavigate();

  const isActive    = (path) => location.pathname === path;
  const hasActive   = (children) => children?.some((c) => location.pathname === c.path);
  const toggleGroup = (key) => setOpenGroup((prev) => (prev === key ? null : key));
  const handleLinkClick = (event, path) => {
    if (!path) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(path);
  };

  return (
    <Sidebar
      backgroundColor={S.bg}
      rootStyles={{ border: 0, height: "100%", borderRight: `1px solid ${S.border}` }}
      collapsed={collapsed}
      onBackdropClick={() => setToggled(false)}
      toggled={toggled}
      breakPoint="md"
    >
      {/* ── Logo bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: collapsed ? 0 : "16px",
          py: "16px",
          borderBottom: `1px solid ${S.border}`,
          mb: "4px",
        }}
      >
        {!collapsed && (
          <Box display="flex" alignItems="center" gap="10px">
            <Box
              sx={{
                width: 32, height: 32,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {brandLogo ? (
                <img src={brandLogo} alt="logo" style={{ width: 20, height: 20, objectFit: "contain", filter: "brightness(10)" }} />
              ) : (
                <Typography sx={{ color: "#fff", fontSize: 14, fontWeight: 800, lineHeight: 1 }}>
                  {appname.charAt(0).toUpperCase()}
                </Typography>
              )}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#f1f5f9", fontSize: 15, letterSpacing: "-0.01em" }}>
              {appname}
            </Typography>
          </Box>
        )}
        <IconButton
          onClick={() => setCollapsed(!collapsed)}
          size="small"
          sx={{ color: S.muted, "&:hover": { color: S.text, background: S.hover } }}
        >
          <MenuOutlined fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Navigation */}
      <Box sx={{ overflowY: "auto", overflowX: "hidden", pb: 3 }}>
        {NAV_GROUPS.map((group, gi) => (
          <Box key={gi} sx={{ mb: "2px" }}>
            {!collapsed && group.label && (
              <Typography
                sx={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  color: S.groupLbl, px: "22px", pt: "18px", pb: "6px",
                  textTransform: "uppercase",
                }}
              >
                {group.label}
              </Typography>
            )}
            {collapsed && group.label && <Box sx={{ height: 10 }} />}

            {group.items.map((item, ii) =>
              item.children ? (
                <GroupItem
                  key={ii}
                  item={item}
                  collapsed={collapsed}
                  isOpen={openGroup === item.key}
                  hasActive={hasActive(item.children)}
                  onToggle={() => toggleGroup(item.key)}
                >
                  {item.children.map((child, ci) => (
                    <ChildItem
                      key={ci}
                      item={child}
                      isActive={isActive(child.path)}
                      onClick={(event) => handleLinkClick(event, child.path)}
                    />
                  ))}
                </GroupItem>
              ) : (
                <NavItem
                  key={ii}
                  item={item}
                  collapsed={collapsed}
                  isActive={isActive(item.path)}
                  onClick={(event) => handleLinkClick(event, item.path)}
                />
              )
            )}
          </Box>
        ))}
      </Box>
    </Sidebar>
  );
};

export default SideBar;
