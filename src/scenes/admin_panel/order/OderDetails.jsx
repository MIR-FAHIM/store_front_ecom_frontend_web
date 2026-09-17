import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  TextField,
  MenuItem,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Paper,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import NoteAltOutlinedIcon from "@mui/icons-material/NoteAltOutlined";
import DeliveryDiningOutlinedIcon from "@mui/icons-material/DeliveryDiningOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import jsPDF from "jspdf";
import { appname } from "../../../api/config";
import {
  getOrderDetails,
  updateOrderStatus,
  assignDeliveryBoy,
  unassignDeliveryBoy,
  getOrderStatusList,
} from "../../../api/controller/admin_controller/order/order_controller";
import { getDeliveryMen } from "../../../api/controller/admin_controller/user_controller";

/* ── Status style map ── */
const ORDER_STATUS_STYLE_MAP = {
  pending:            { label: "Pending",           color: "#f59e0b", bg: "#fffbeb", icon: <PendingActionsOutlinedIcon sx={{ fontSize: 14 }} /> },
  confirmed:          { label: "Confirmed",         color: "#3b82f6", bg: "#eff6ff", icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
  processing:         { label: "Processing",        color: "#6366f1", bg: "#eef2ff", icon: <SettingsOutlinedIcon sx={{ fontSize: 14 }} /> },
  packed:             { label: "Packed",            color: "#8b5cf6", bg: "#f5f3ff", icon: <SettingsOutlinedIcon sx={{ fontSize: 14 }} /> },
  shipped:            { label: "Shipped",           color: "#0ea5e9", bg: "#f0f9ff", icon: <LocalShippingOutlinedIcon sx={{ fontSize: 14 }} /> },
  "out for delivery": { label: "Out for Delivery", color: "#f97316", bg: "#fff7ed", icon: <LocalShippingOutlinedIcon sx={{ fontSize: 14 }} /> },
  delivered:          { label: "Delivered",         color: "#10b981", bg: "#ecfdf5", icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
  completed:          { label: "Completed",         color: "#059669", bg: "#d1fae5", icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
  cancelled:          { label: "Cancelled",         color: "#ef4444", bg: "#fef2f2", icon: <CancelOutlinedIcon sx={{ fontSize: 14 }} /> },
  returned:           { label: "Returned",          color: "#f59e0b", bg: "#fffbeb", icon: <CancelOutlinedIcon sx={{ fontSize: 14 }} /> },
  refunded:           { label: "Refunded",          color: "#8b5cf6", bg: "#f5f3ff", icon: <PaymentOutlinedIcon sx={{ fontSize: 14 }} /> },
  failed:             { label: "Failed",            color: "#dc2626", bg: "#fee2e2", icon: <CancelOutlinedIcon sx={{ fontSize: 14 }} /> },
};

const PAYMENT_STATUS_CONFIG = {
  paid:     { label: "Paid",     color: "#10b981", bg: "#ecfdf5" },
  unpaid:   { label: "Unpaid",   color: "#ef4444", bg: "#fef2f2" },
  pending:  { label: "Pending",  color: "#f59e0b", bg: "#fffbeb" },
  refunded: { label: "Refunded", color: "#6366f1", bg: "#eef2ff" },
};

/* ── Helpers ── */
const StatusChip = ({ status, config = ORDER_STATUS_STYLE_MAP }) => {
  const key = String(status || "").toLowerCase();
  const cfg = config[key] || { label: status || "—", color: "#64748b", bg: "#f1f5f9" };
  return (
    <Chip
      icon={cfg.icon || null}
      label={cfg.label || status}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: 11,
        height: 26,
        bgcolor: cfg.bg,
        color: cfg.color,
        border: "1px solid",
        borderColor: cfg.color + "35",
        "& .MuiChip-icon": { color: cfg.color, ml: 0.5 },
      }}
    />
  );
};

const InfoRow = ({ icon, label, value }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start">
    <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "action.hover", display: "grid", placeItems: "center", color: "text.secondary", flexShrink: 0 }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
        {value || "—"}
      </Typography>
    </Box>
  </Stack>
);

const SectionHeader = ({ icon, title, color = "#6366f1", bg = "#eef2ff", right }) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: bg, display: "grid", placeItems: "center", color }}>
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 16 }}>{title}</Typography>
    </Stack>
    {right}
  </Stack>
);

const cleanText = (value, fallback = "—") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") {
    return value.name || value.bn_name || fallback;
  }

  const text = String(value)
    .replace(/\[object Object\]/g, "")
    .replace(/\s*,\s*,/g, ", ")
    .replace(/,\s*$/g, "")
    .trim();

  return text || fallback;
};

const getOrderAddressInfo = (order) => {
  const userAddress = order?.user_address || {};
  const districtName = cleanText(userAddress?.district?.name || userAddress?.district || order?.district, "");
  const districtBnName = cleanText(userAddress?.district?.bn_name, "");
  const area = cleanText(userAddress?.area || order?.area, "");
  const addressLine =
    [
      cleanText(userAddress?.address || order?.shipping_address, ""),
      area,
      districtName,
    ].filter(Boolean).join(", ") || cleanText(order?.shipping_address);

  return {
    id: userAddress?.id ?? order?.user_address_id ?? "",
    name: cleanText(userAddress?.name || order?.customer_name),
    phone: cleanText(userAddress?.mobile || order?.customer_phone),
    addressLine,
    zone: cleanText(order?.zone),
    district: districtBnName && districtBnName !== districtName ? `${districtName} (${districtBnName})` : cleanText(districtName),
    area: cleanText(area),
  };
};

/* ── Main Order Details Component ── */
const OderDetails = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();

  const [errMsg, setErrMsg] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deliveryMen, setDeliveryMen] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [selectedDeliveryManId, setSelectedDeliveryManId] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [orderStatusList, setOrderStatusList] = useState([]);

  const extractErrorMessage = (value, fallback) => {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value?.message && typeof value.message === "string") return value.message;
    return fallback;
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await getOrderDetails(id);
      if (response.status === "success" && response.data) {
        setOrder(response.data);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryMenList = async () => {
    try {
      setDeliveryLoading(true);
      const response = await getDeliveryMen({ page: 1, per_page: 200 });
      if (response?.status === "success") {
        const paginator = response?.data;
        const list = Array.isArray(paginator?.data) ? paginator.data : [];
        setDeliveryMen(list);
      } else {
        setDeliveryMen([]);
      }
    } catch (error) {
      console.error("Error fetching delivery men:", error);
      setDeliveryMen([]);
    } finally {
      setDeliveryLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
      fetchDeliveryMenList();
    }
  }, [id]);

  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const res = await getOrderStatusList();
        if (res?.status === "success" && Array.isArray(res?.data)) {
          setOrderStatusList(res.data.filter((s) => s.is_active !== false));
        }
      } catch (e) {
        console.error("Failed to load order statuses", e);
      }
    };
    loadStatuses();
  }, []);

  const dynamicOrderStatusConfig = React.useMemo(() => {
    const cfg = {};
    orderStatusList.forEach((s) => {
      const key = s.name.toLowerCase();
      const style = ORDER_STATUS_STYLE_MAP[key] || { color: "#64748b", bg: "#f1f5f9" };
      cfg[key] = { label: s.name, ...style };
    });
    return cfg;
  }, [orderStatusList]);

  const handleUpdateStatus = async (newStatusValue) => {
    if (!order || newStatusValue === (order.status || "").toLowerCase()) return;
    try {
      setErrMsg("");
      setUpdatingStatus(true);
      const response = await updateOrderStatus(order.id, newStatusValue);
      if (response.status === "success") {
        setOrder({ ...order, status: newStatusValue });
      } else {
        setErrMsg(extractErrorMessage(response?.message, "Failed to update order status"));
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      setErrMsg(extractErrorMessage(error?.response?.data?.message, "Failed to update order status"));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const assignment = order?.delivery_man_assign || order?.delivery_man_assignment || null;
  const currentAssignedMan = assignment?.delivery_man || assignment?.deliveryman || order?.delivery_man || null;

  useEffect(() => {
    if (currentAssignedMan?.id) {
      setSelectedDeliveryManId(String(currentAssignedMan.id));
    } else {
      setSelectedDeliveryManId("");
    }
    if (assignment?.note) {
      setAssignNote(assignment.note);
    }
  }, [order, currentAssignedMan, assignment]);

  const handleAssignDelivery = async () => {
    if (!order?.id || !selectedDeliveryManId) return;
    try {
      setErrMsg("");
      setAssigning(true);
      const response = await assignDeliveryBoy({
        order_id: order.id,
        delivery_man_id: selectedDeliveryManId,
        note: assignNote,
      });

      if (response?.status === "success") {
        await fetchOrderDetails();
      } else {
        setErrMsg(extractErrorMessage(response?.message, "Failed to assign delivery man"));
      }
    } catch (error) {
      console.error("Error assigning delivery man:", error);
      setErrMsg(extractErrorMessage(error?.response?.data?.message, "Failed to assign delivery man"));
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignDelivery = async () => {
    if (!order?.id) return;
    try {
      setErrMsg("");
      setAssigning(true);
      const response = await unassignDeliveryBoy({ order_id: order.id });
      if (response?.status === "success") {
        await fetchOrderDetails();
        setSelectedDeliveryManId("");
        setAssignNote("");
      } else {
        setErrMsg(extractErrorMessage(response?.message, "Failed to unassign delivery man"));
      }
    } catch (error) {
      console.error("Error unassigning delivery man:", error);
      setErrMsg(extractErrorMessage(error?.response?.data?.message, "Failed to unassign delivery man"));
    } finally {
      setAssigning(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-BD", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* ── PDF generation ── */
  const generateReceiptPdf = async () => {
    if (!order) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const addressInfo = getOrderAddressInfo(order);
    let pdfFont = "helvetica";
    const receiptBrandName = appname || "PharmaVan";

    try {
      const res = await fetch("/fonts/NotoSansBengali.ttf");
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        }
        doc.addFileToVFS("NotoSansBengali.ttf", btoa(binary));
        doc.addFont("NotoSansBengali.ttf", "NotoSansBengali", "normal");
        doc.addFont("NotoSansBengali.ttf", "NotoSansBengali", "bold");
        doc.setFont("NotoSansBengali", "normal");
        pdfFont = "NotoSansBengali";
      }
    } catch (e) {
      console.warn("Bangla font load failed, using default font.", e);
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;
    const items = Array.isArray(order.items) ? order.items : [];
    const colors = {
      ink: "#111827",
      muted: "#64748b",
      line: "#e5e7eb",
      soft: "#f8fafc",
      softer: "#f1f5f9",
      primary: "#4f46e5",
      primaryDark: "#312e81",
      success: "#059669",
      danger: "#dc2626",
    };
    let y = 34;

    const drawText = (text, x, yPos, opts = {}) => {
      doc.setFontSize(opts.size || 10);
      doc.setFont(pdfFont, opts.weight || "normal");
      doc.setTextColor(opts.color || colors.ink);
      doc.text(text, x, yPos, opts.options || {});
    };

    const drawFooter = () => {
      const footerY = pageHeight - 24;
      doc.setDrawColor(colors.line);
      doc.line(margin, footerY - 14, pageWidth - margin, footerY - 14);
      drawText(`Generated from ${receiptBrandName} Admin Panel`, margin, footerY, { size: 8, color: colors.muted });
      drawText(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, footerY, {
        size: 8,
        color: colors.muted,
        options: { align: "right" },
      });
    };

    const ensureSpace = (heightNeeded, resetY = 58) => {
      if (y + heightNeeded <= pageHeight - 60) return false;
      drawFooter();
      doc.addPage();
      y = resetY;
      return true;
    };

    const drawBadge = (text, x, yPos, color, bg) => {
      const width = Math.max(62, doc.getTextWidth(text) + 20);
      doc.setFillColor(bg);
      doc.setDrawColor(color);
      doc.roundedRect(x, yPos - 14, width, 23, 8, 8, "FD");
      drawText(text, x + 10, yPos + 1, { size: 8.5, weight: "bold", color });
      return width;
    };

    const drawLabelValue = (label, value, x, yPos, maxWidth) => {
      drawText(label, x, yPos, { size: 8, weight: "bold", color: colors.muted });
      const lines = doc.splitTextToSize(cleanText(value), maxWidth);
      drawText(lines, x, yPos + 16, { size: 9.5, color: colors.ink });
      return yPos + 16 + lines.length * 13;
    };

    const drawInfoCard = (title, rows, x, yPos, width) => {
      doc.setFillColor("#ffffff");
      doc.setDrawColor(colors.line);
      doc.roundedRect(x, yPos, width, 124, 10, 10, "FD");
      drawText(title, x + 14, yPos + 23, { size: 11, weight: "bold", color: colors.primaryDark });
      let rowY = yPos + 45;
      rows.forEach(([label, value]) => {
        rowY = drawLabelValue(label, value, x + 14, rowY, width - 28) + 5;
      });
    };

    doc.setFillColor(colors.primaryDark);
    doc.roundedRect(margin, y, contentWidth, 98, 14, 14, "F");
    doc.setFillColor(colors.primary);
    doc.circle(pageWidth - margin - 42, y + 34, 54, "F");

    drawText(receiptBrandName, margin + 22, y + 32, { size: 20, weight: "bold", color: "#ffffff" });
    drawText("Order Receipt", margin + 22, y + 56, { size: 12, color: "#c7d2fe" });
    drawText(`# ${order.order_number || order.id}`, margin + 22, y + 78, { size: 11, weight: "bold", color: "#ffffff" });
    drawText(formatCurrency(order.total), pageWidth - margin - 22, y + 43, {
      size: 18,
      weight: "bold",
      color: "#ffffff",
      options: { align: "right" },
    });
    drawText("TOTAL PAYABLE", pageWidth - margin - 22, y + 63, {
      size: 8,
      weight: "bold",
      color: "#c7d2fe",
      options: { align: "right" },
    });

    y += 116;
    const statusText = cleanText(order.status, "Pending");
    const paymentText = cleanText(order.payment_status, "Unpaid");
    const paymentColor = String(order.payment_status).toLowerCase() === "paid" ? colors.success : colors.danger;
    const statusWidth = drawBadge(statusText, margin, y, colors.primary, "#eef2ff");
    drawBadge(paymentText, margin + statusWidth + 10, y, paymentColor, String(order.payment_status).toLowerCase() === "paid" ? "#ecfdf5" : "#fef2f2");
    drawText(`Date: ${formatDate(order.created_at)}`, pageWidth - margin, y, {
      size: 9.5,
      color: colors.muted,
      options: { align: "right" },
    });

    y += 26;
    const cardGap = 14;
    const cardWidth = (contentWidth - cardGap) / 2;
    drawInfoCard("Customer", [
      ["Name", addressInfo.name],
      ["Phone", addressInfo.phone],
      ["User ID", order.user_id || "N/A"],
    ], margin, y, cardWidth);
    drawInfoCard("Shipping Address", [
      ["Address", addressInfo.addressLine],
      ["Area / District", [addressInfo.area, addressInfo.district].filter((value) => value && value !== "—").join(", ") || "N/A"],
      ["Address ID", addressInfo.id || "N/A"],
    ], margin + cardWidth + cardGap, y, cardWidth);

    y += 148;
    drawText("Order Items", margin, y, { size: 13, weight: "bold", color: colors.ink });
    drawText(`${items.length} item${items.length === 1 ? "" : "s"}`, pageWidth - margin, y, {
      size: 9,
      color: colors.muted,
      options: { align: "right" },
    });
    y += 16;

    const table = {
      x: margin,
      width: contentWidth,
      itemX: margin + 14,
      shopX: margin + 270,
      qtyX: margin + 394,
      unitX: pageWidth - margin - 98,
      totalX: pageWidth - margin - 14,
    };
    const drawTableHeader = () => {
      doc.setFillColor(colors.softer);
      doc.setDrawColor(colors.line);
      doc.roundedRect(table.x, y, table.width, 30, 8, 8, "FD");
      drawText("Item", table.itemX, y + 19, { size: 8, weight: "bold", color: colors.muted });
      drawText("Shop", table.shopX, y + 19, { size: 8, weight: "bold", color: colors.muted });
      drawText("Qty", table.qtyX, y + 19, { size: 8, weight: "bold", color: colors.muted, options: { align: "center" } });
      drawText("Unit", table.unitX, y + 19, { size: 8, weight: "bold", color: colors.muted, options: { align: "right" } });
      drawText("Total", table.totalX, y + 19, { size: 8, weight: "bold", color: colors.muted, options: { align: "right" } });
      y += 34;
    };
    drawTableHeader();

    items.forEach((item, index) => {
      const itemLines = doc.splitTextToSize(cleanText(item.product_name || item.name || "Item"), 240);
      const shopLines = doc.splitTextToSize(cleanText(item?.shop?.shop_name || item?.shop?.name || "-", "-"), 92);
      const rowHeight = Math.max(36, Math.max(itemLines.length, shopLines.length) * 12 + 16);
      if (ensureSpace(rowHeight + 14)) drawTableHeader();

      doc.setFillColor(index % 2 === 0 ? "#ffffff" : colors.soft);
      doc.setDrawColor(colors.line);
      doc.roundedRect(table.x, y, table.width, rowHeight, 6, 6, "FD");

      drawText(itemLines, table.itemX, y + 16, { size: 9, weight: "bold", color: colors.ink });
      drawText(shopLines, table.shopX, y + 16, { size: 8.5, color: colors.muted });
      drawText(String(item.quantity || 1), table.qtyX, y + 16, { size: 9, weight: "bold", color: colors.ink, options: { align: "center" } });
      drawText(formatCurrency(item.price), table.unitX, y + 16, { size: 9, color: colors.muted, options: { align: "right" } });
      drawText(formatCurrency((item.price || 0) * (item.quantity || 1)), table.totalX, y + 16, { size: 9, weight: "bold", color: colors.ink, options: { align: "right" } });

      y += rowHeight + 6;
    });

    ensureSpace(110);
    const summaryWidth = 230;
    const summaryX = pageWidth - margin - summaryWidth;

    doc.setFillColor(colors.soft);
    doc.setDrawColor(colors.line);
    doc.roundedRect(summaryX, y, summaryWidth, 90, 10, 10, "FD");

    const summaryY = y + 20;
    drawText("Subtotal", summaryX + 16, summaryY, { size: 9, color: colors.muted });
    drawText(formatCurrency(order.total), pageWidth - margin - 16, summaryY, { size: 9, weight: "bold", color: colors.ink, options: { align: "right" } });

    drawText("Grand Total", summaryX + 16, summaryY + 40, { size: 10, weight: "bold", color: colors.primaryDark });
    drawText(formatCurrency(order.total), pageWidth - margin - 16, summaryY + 40, { size: 12, weight: "bold", color: colors.primaryDark, options: { align: "right" } });

    drawFooter();
    doc.save(`receipt-${order.order_number || order.id}.pdf`);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={24} sx={{ color: "#6366f1" }} />
          <Typography sx={{ fontWeight: 700, color: "text.secondary" }}>Loading order details...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6">Order not found</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2, borderRadius: 2 }}>
          Back to Orders
        </Button>
      </Box>
    );
  }

  const itemsArr = Array.isArray(order.items) ? order.items : [];
  const addressInfo = getOrderAddressInfo(order);
  const currentStatusKey = (order.status || "").toLowerCase();
  const currentIdx = orderStatusList.findIndex((s) => s.name.toLowerCase() === currentStatusKey);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      {/* ── Header Bar ── */}
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: "action.hover", "&:hover": { bgcolor: "action.selected" } }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={800}>Order Details</Typography>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.3 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={700}>
                #{order.order_number || order.id}
              </Typography>
              <StatusChip status={currentStatusKey} config={dynamicOrderStatusConfig} />
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            size="small"
            startIcon={<PictureAsPdfOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={generateReceiptPdf}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: "#6366f1",
              boxShadow: "0 2px 10px rgba(99,102,241,0.25)",
              "&:hover": { bgcolor: "#4f46e5" },
            }}
          >
            Download PDF
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => window.print()}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, borderColor: "divider", color: "text.primary" }}
          >
            Print
          </Button>
        </Stack>
      </Stack>

      {errMsg && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }}>{errMsg}</Alert>}

      {/* ── Quick Summary Card ── */}
      <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "divider", mb: 3, background: theme.palette.mode === "dark" ? "rgba(99,102,241,0.06)" : "linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)" }}>
        <CardContent sx={{ py: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ width: 44, height: 44, bgcolor: "#6366f1", color: "#fff", borderRadius: 2 }}>
                  <ReceiptLongOutlinedIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}>
                    ORDER NUMBER
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    #{order.order_number || order.id}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={6} sm={4}>
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}>
                  STATUS SUMMARY
                </Typography>
                <Stack direction="row" spacing={0.8} flexWrap="wrap">
                  <StatusChip status={currentStatusKey} config={dynamicOrderStatusConfig} />
                  <StatusChip status={order.payment_status} config={PAYMENT_STATUS_CONFIG} />
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={6} sm={4} sx={{ textAlign: { sm: "right" } }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}>
                TOTAL AMOUNT
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: "#6366f1" }}>
                {formatCurrency(order.total)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Status Progress / Fast Update Controls ── */}
      <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "divider", mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <SectionHeader icon={<SettingsOutlinedIcon sx={{ fontSize: 18 }} />} title="Update Order Status" />
          {orderStatusList.length === 0 ? (
            <CircularProgress size={20} sx={{ color: "#6366f1" }} />
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ rowGap: 1 }}>
              {orderStatusList.map((s, i) => {
                const key = s.name.toLowerCase();
                const cfg = dynamicOrderStatusConfig[key] || { color: "#64748b", bg: "#f1f5f9" };
                const isActive = currentStatusKey === key;
                const isPast = currentIdx >= 0 && i < currentIdx;

                return (
                  <Button
                    key={s.id}
                    size="small"
                    disabled={updatingStatus || isActive}
                    onClick={() => handleUpdateStatus(key)}
                    startIcon={cfg.icon || null}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: 12,
                      borderRadius: 2,
                      px: 2,
                      py: 0.8,
                      border: "1.5px solid",
                      borderColor: isActive ? cfg.color : isPast ? cfg.color + "40" : "divider",
                      bgcolor: isActive ? cfg.bg : isPast ? cfg.bg + "80" : "transparent",
                      color: isActive ? cfg.color : isPast ? cfg.color : "text.secondary",
                      "&:hover": { bgcolor: cfg.bg, borderColor: cfg.color },
                    }}
                  >
                    {s.name}
                  </Button>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* ── Overview Cards Grid ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionHeader icon={<PersonOutlineIcon sx={{ fontSize: 18 }} />} title="Customer Details" color="#6366f1" bg="#eef2ff" />
              <Stack spacing={2}>
                <InfoRow icon={<BadgeOutlinedIcon sx={{ fontSize: 16 }} />} label="Name" value={addressInfo.name} />
                <InfoRow icon={<PhoneOutlinedIcon sx={{ fontSize: 16 }} />} label="Phone" value={addressInfo.phone} />
                <InfoRow icon={<BadgeOutlinedIcon sx={{ fontSize: 16 }} />} label="User ID" value={order.user_id ? `#${order.user_id}` : "N/A"} />
                <InfoRow icon={<HomeOutlinedIcon sx={{ fontSize: 16 }} />} label="Address ID" value={addressInfo.id ? `#${addressInfo.id}` : "N/A"} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionHeader icon={<LocationOnOutlinedIcon sx={{ fontSize: 18 }} />} title="Shipping Address" color="#10b981" bg="#ecfdf5" />
              <Stack spacing={2}>
                <InfoRow icon={<HomeOutlinedIcon sx={{ fontSize: 16 }} />} label="Full Address" value={addressInfo.addressLine} />
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={4}>
                    <InfoRow icon={<LocationOnOutlinedIcon sx={{ fontSize: 16 }} />} label="Zone" value={addressInfo.zone} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <InfoRow icon={<LocationOnOutlinedIcon sx={{ fontSize: 16 }} />} label="District" value={addressInfo.district} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <InfoRow icon={<LocationOnOutlinedIcon sx={{ fontSize: 16 }} />} label="Area" value={addressInfo.area} />
                  </Grid>
                </Grid>
                {order.note && <InfoRow icon={<NoteAltOutlinedIcon sx={{ fontSize: 16 }} />} label="Order Note" value={order.note} />}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Assign Delivery Man Card ── */}
      <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "divider", mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <SectionHeader
            icon={<DeliveryDiningOutlinedIcon sx={{ fontSize: 18 }} />}
            title="Delivery Assignment"
            color="#8b5cf6"
            bg="#f5f3ff"
            right={
              currentAssignedMan ? (
                <Chip
                  icon={<CheckCircleOutlineIcon sx={{ fontSize: 13 }} />}
                  label={`Assigned to ${currentAssignedMan.name}`}
                  size="small"
                  sx={{ bgcolor: "#ecfdf5", color: "#10b981", fontWeight: 700, borderRadius: 1.5 }}
                />
              ) : (
                <Chip label="Unassigned" size="small" variant="outlined" sx={{ color: "text.secondary", fontSize: 11 }} />
              )
            }
          />

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                select
                fullWidth
                label="Select Delivery Man"
                value={selectedDeliveryManId}
                onChange={(e) => setSelectedDeliveryManId(e.target.value)}
                disabled={deliveryLoading || assigning}
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              >
                <MenuItem value="">Select delivery personnel</MenuItem>
                {deliveryMen.map((man) => (
                  <MenuItem key={man?.id} value={String(man?.id)}>
                    {man?.name} ({man?.phone || "N/A"})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Delivery Note / Instructions"
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                disabled={assigning}
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              {assignment ? (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleUnassignDelivery}
                  disabled={assigning}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                    borderColor: "#ef4444",
                    color: "#ef4444",
                    "&:hover": { bgcolor: "#fef2f2", borderColor: "#ef4444" },
                  }}
                >
                  Unassign
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAssignDelivery}
                  disabled={!selectedDeliveryManId || assigning}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                    bgcolor: "#8b5cf6",
                    "&:hover": { bgcolor: "#7c3aed" },
                    boxShadow: "0 2px 8px rgba(139,92,246,0.25)",
                  }}
                >
                  {assigning ? "Assigning..." : "Assign"}
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Order Items Table ── */}
      <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "divider", mb: 3, overflow: "hidden" }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ p: 2.5, pb: 1.5 }}>
            <SectionHeader
              icon={<LocalMallOutlinedIcon sx={{ fontSize: 18 }} />}
              title="Purchased Items"
              color="#0ea5e9"
              bg="#f0f9ff"
              right={
                <Chip
                  label={`${itemsArr.length} item${itemsArr.length === 1 ? "" : "s"}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700, borderRadius: 1.5 }}
                />
              }
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.mode === "dark" ? "rgba(99,102,241,0.08)" : "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>
                    Product Item
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>
                    Shop / Vendor
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>
                    Quantity
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>
                    Unit Price
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {itemsArr.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.disabled" }}>
                      No items found in this order
                    </TableCell>
                  </TableRow>
                ) : (
                  itemsArr.map((item, idx) => {
                    const productName = item.product_name || item.name || "Product Item";
                    const shopName = item?.shop?.shop_name || item?.shop?.name || order.shop_name || "Main Store";
                    const qty = item.quantity || 1;
                    const price = item.price || 0;
                    const itemTotal = price * qty;
                    const imgUrl = item.product_thumbnail || item.thumbnail || item.image || "";

                    return (
                      <TableRow key={item.id || idx} hover sx={{ "&:last-child td": { borderBottom: "none" } }}>
                        {/* Product Info */}
                        <TableCell sx={{ py: 1.8 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              src={imgUrl}
                              variant="rounded"
                              sx={{ width: 44, height: 44, bgcolor: "action.hover", borderRadius: 1.5 }}
                            >
                              <ShoppingBagOutlinedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                                {productName}
                              </Typography>
                              {item.variant && (
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                  Variant: {item.variant}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Shop Info */}
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.8}>
                            <StorefrontOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {shopName}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* Qty */}
                        <TableCell align="center">
                          <Chip label={qty} size="small" sx={{ fontWeight: 800, minWidth: 28, height: 24, borderRadius: 1.5 }} />
                        </TableCell>

                        {/* Unit Price */}
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(price)}
                          </Typography>
                        </TableCell>

                        {/* Line Total */}
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary" }}>
                            {formatCurrency(itemTotal)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ── Order Financial Summary Box ── */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, width: { xs: "100%", sm: 340 } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5, color: "text.secondary" }}>
            Payment Summary
          </Typography>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2" fontWeight={700}>{formatCurrency(order.subtotal || order.total)}</Typography>
            </Stack>
            {order.shipping_fee > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Shipping Fee</Typography>
                <Typography variant="body2" fontWeight={700}>{formatCurrency(order.shipping_fee)}</Typography>
              </Stack>
            )}
            {order.discount > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Discount</Typography>
                <Typography variant="body2" fontWeight={700} color="error.main">-{formatCurrency(order.discount)}</Typography>
              </Stack>
            )}
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography variant="subtitle1" fontWeight={800}>Grand Total</Typography>
              <Typography variant="h6" fontWeight={800} color="#6366f1">{formatCurrency(order.total)}</Typography>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default OderDetails;
