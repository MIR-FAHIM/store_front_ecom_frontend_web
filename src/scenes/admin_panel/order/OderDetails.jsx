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
import jsPDF from "jspdf";
import { appname } from "../../../api/config";
import { getOrderDetails, updateOrderStatus, assignDeliveryBoy, unassignDeliveryBoy, getOrderStatusList } from "../../../api/controller/admin_controller/order/order_controller";
import { getDeliveryMen } from "../../../api/controller/admin_controller/user_controller";

/* ── Static style/icon lookup by normalised status name ── */
const ORDER_STATUS_STYLE_MAP = {
  pending:            { color: "#f59e0b", bg: "#fffbeb", icon: <PendingActionsOutlinedIcon sx={{ fontSize: 14 }} /> },
  confirmed:          { color: "#3b82f6", bg: "#eff6ff", icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
  processing:         { color: "#6366f1", bg: "#eef2ff", icon: <SettingsOutlinedIcon sx={{ fontSize: 14 }} /> },
  packed:             { color: "#8b5cf6", bg: "#f5f3ff", icon: <SettingsOutlinedIcon sx={{ fontSize: 14 }} /> },
  shipped:            { color: "#0ea5e9", bg: "#f0f9ff", icon: <LocalShippingOutlinedIcon sx={{ fontSize: 14 }} /> },
  "out for delivery": { color: "#f97316", bg: "#fff7ed", icon: <LocalShippingOutlinedIcon sx={{ fontSize: 14 }} /> },
  delivered:          { color: "#10b981", bg: "#ecfdf5", icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
  completed:          { color: "#059669", bg: "#d1fae5", icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
  cancelled:          { color: "#ef4444", bg: "#fef2f2", icon: <CancelOutlinedIcon sx={{ fontSize: 14 }} /> },
  returned:           { color: "#f59e0b", bg: "#fffbeb", icon: <CancelOutlinedIcon sx={{ fontSize: 14 }} /> },
  refunded:           { color: "#8b5cf6", bg: "#f5f3ff", icon: <PaymentOutlinedIcon sx={{ fontSize: 14 }} /> },
  failed:             { color: "#dc2626", bg: "#fee2e2", icon: <CancelOutlinedIcon sx={{ fontSize: 14 }} /> },
};

const PAYMENT_STATUS_CONFIG = {
  paid:     { label: "Paid",     color: "#10b981", bg: "#ecfdf5" },
  unpaid:   { label: "Unpaid",   color: "#ef4444", bg: "#fef2f2" },
  pending:  { label: "Pending",  color: "#f59e0b", bg: "#fffbeb" },
  refunded: { label: "Refunded", color: "#6366f1", bg: "#eef2ff" },
};

/* ── Reusable helpers ── */
const StatusChip = ({ status, config }) => {
  const cfg = config[status] || config[String(status).toLowerCase()] || { label: status || "—", color: "#64748b", bg: "#f1f5f9" };
  return (
    <Chip
      icon={cfg.icon || null}
      label={cfg.label}
      size="small"
      sx={{ fontWeight: 700, fontSize: 11, height: 26, bgcolor: cfg.bg, color: cfg.color, border: "1px solid", borderColor: cfg.color + "30", "& .MuiChip-icon": { color: cfg.color, ml: 0.5 } }}
    />
  );
};

const InfoRow = ({ icon, label, value }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start">
    <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: "#f1f5f9", display: "grid", placeItems: "center", color: "#64748b", flexShrink: 0, mt: 0.2 }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.5 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-word" }}>{value || "—"}</Typography>
    </Box>
  </Stack>
);

const SectionHeader = ({ icon, title, color = "#6366f1", bg = "#eef2ff", right }) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: bg, display: "grid", placeItems: "center", color }}>{icon}</Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
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




/* ── Style constants ── */
const cardSx = { borderRadius: 2.5, border: "1px solid", borderColor: "divider" };
const headCellSx = { fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary", py: 1.5, borderBottom: "2px solid", borderColor: "divider" };
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2 }, "& .MuiInputLabel-root": { fontSize: 13 } };

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

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(amount || 0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

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
      amber: "#d97706",
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
    doc.setFillColor("#818cf8");
    doc.circle(pageWidth - margin - 12, y + 84, 44, "F");

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
      doc.setDrawColor("#eef2f7");
      doc.roundedRect(table.x, y - 4, table.width, rowHeight, 8, 8, "FD");
      drawText(itemLines, table.itemX, y + 13, { size: 9.5, weight: "bold", color: colors.ink });
      drawText(shopLines, table.shopX, y + 13, { size: 8.5, color: colors.muted });
      drawText(String(item.qty || 0), table.qtyX, y + 13, { size: 9.5, color: colors.ink, options: { align: "center" } });
      drawText(formatCurrency(item.unit_price), table.unitX, y + 13, { size: 9, color: colors.ink, options: { align: "right" } });
      drawText(formatCurrency(item.line_total), table.totalX, y + 13, { size: 9.5, weight: "bold", color: colors.ink, options: { align: "right" } });
      y += rowHeight + 8;
    });

    ensureSpace(132);
    const totalsWidth = 224;
    const totalsX = pageWidth - margin - totalsWidth;
    y += 4;
    doc.setFillColor("#ffffff");
    doc.setDrawColor(colors.line);
    doc.roundedRect(totalsX, y, totalsWidth, 114, 12, 12, "FD");
    [
      ["Subtotal", formatCurrency(order.subtotal)],
      ["Shipping", formatCurrency(order.shipping_fee)],
      ["Discount", `-${formatCurrency(order.discount)}`],
    ].forEach(([label, value], index) => {
      const rowY = y + 24 + index * 18;
      drawText(label, totalsX + 16, rowY, { size: 9, color: colors.muted });
      drawText(value, totalsX + totalsWidth - 16, rowY, { size: 9, weight: "bold", color: colors.ink, options: { align: "right" } });
    });
    doc.setDrawColor(colors.line);
    doc.line(totalsX + 16, y + 73, totalsX + totalsWidth - 16, y + 73);
    drawText("Grand Total", totalsX + 16, y + 94, { size: 11, weight: "bold", color: colors.primaryDark });
    drawText(formatCurrency(order.total), totalsX + totalsWidth - 16, y + 94, {
      size: 12,
      weight: "bold",
      color: colors.primary,
      options: { align: "right" },
    });

    if (order.note) {
      y += 136;
      ensureSpace(58);
      doc.setFillColor("#fffbeb");
      doc.setDrawColor("#fde68a");
      doc.roundedRect(margin, y, contentWidth, 50, 10, 10, "FD");
      drawText("Order Note", margin + 14, y + 19, { size: 9, weight: "bold", color: colors.amber });
      drawText(doc.splitTextToSize(cleanText(order.note), contentWidth - 28), margin + 14, y + 36, { size: 9, color: colors.ink });
    }

    drawFooter();
    doc.save(`order-${order.order_number || order.id}.pdf`);
  };

  /* ── Delivery ── */
  const assignment = order?.delivery_man ?? null;
  const deliveryProfile = assignment?.delivery_man ?? null;

  useEffect(() => {
    if (assignment?.delivery_man_id) setSelectedDeliveryManId(String(assignment.delivery_man_id));
  }, [assignment?.delivery_man_id]);

  const handleAssignDelivery = async () => {
    if (!order?.id || !selectedDeliveryManId) return;
    try {
      setErrMsg(""); setAssigning(true);
      const response = await assignDeliveryBoy({ delivery_man_id: selectedDeliveryManId, order_id: order.id, note: assignNote });
      if (response?.status === "success") { await fetchOrderDetails(); }
      else { setErrMsg(extractErrorMessage(response?.message, "Failed to assign delivery man")); }
    } catch (error) {
      console.error("Error assigning delivery man:", error);
      setErrMsg(extractErrorMessage(error?.response?.data?.message, "Failed to assign delivery man"));
    } finally { setAssigning(false); }
  };

  const handleUnassignDelivery = async () => {
    if (!order?.id) return;
    try {
      setErrMsg(""); setAssigning(true);
      const response = await unassignDeliveryBoy({ order_id: order.id });
      if (response?.status === "success") { await fetchOrderDetails(); setSelectedDeliveryManId(""); setAssignNote(""); }
      else { setErrMsg(extractErrorMessage(response?.message, "Failed to unassign delivery man")); }
    } catch (error) {
      console.error("Error unassigning delivery man:", error);
      setErrMsg(extractErrorMessage(error?.response?.data?.message, "Failed to unassign delivery man"));
    } finally { setAssigning(false); }
  };

  /* ── Loading / empty ── */
  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#6366f1" }} />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2.5 }}>Order not found</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2, borderRadius: 2, textTransform: "none" }}>Back</Button>
      </Box>
    );
  }

  const itemsArr = Array.isArray(order.items) ? order.items : [];
  const addressInfo = getOrderAddressInfo(order);
  const currentStatusKey = (order.status || "").toLowerCase();
  const currentIdx = orderStatusList.findIndex((s) => s.name.toLowerCase() === currentStatusKey);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>

      {/* ─── Header ─── */}
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#e2e8f0" } }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={800}>Order Details</Typography>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.3 }}>
              <Typography variant="body2" color="text.secondary">{order.order_number}</Typography>
              <StatusChip status={currentStatusKey} config={dynamicOrderStatusConfig} />
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" startIcon={<PictureAsPdfOutlinedIcon sx={{ fontSize: 16 }} />} onClick={generateReceiptPdf}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, boxShadow: "0 2px 8px #6366f130" }}>
            Receipt PDF
          </Button>
          <Button variant="outlined" size="small" startIcon={<PrintOutlinedIcon sx={{ fontSize: 16 }} />} onClick={() => window.print()}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, borderColor: "divider", color: "text.primary" }}>
            Print
          </Button>
        </Stack>
      </Stack>

      {errMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>{errMsg}</Alert>}

      {/* ─── Quick Summary Banner ─── */}
      <Card variant="outlined" sx={{ ...cardSx, mb: 2.5, background: `linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)` }}>
        <CardContent sx={{ py: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ width: 44, height: 44, bgcolor: "#6366f1", borderRadius: 2.5 }}>
                  <ReceiptLongOutlinedIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}>ORDER NO.</Typography>
                  <Typography variant="subtitle1" fontWeight={800}>{order.order_number || order.id}</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}>STATUS</Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap">
                  <StatusChip status={currentStatusKey} config={dynamicOrderStatusConfig} />
                  <StatusChip status={order.payment_status} config={PAYMENT_STATUS_CONFIG} />
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={4} sx={{ textAlign: { sm: "right" } }}>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}>TOTAL</Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: "#6366f1" }}>{formatCurrency(order.total)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Status Progress ─── */}
      <Card variant="outlined" sx={{ ...cardSx, mb: 2.5 }}>
        <CardContent>
          <SectionHeader icon={<SettingsOutlinedIcon sx={{ fontSize: 18 }} />} title="Update Status" />
          {orderStatusList.length === 0 ? (
            <CircularProgress size={20} sx={{ color: "#6366f1" }} />
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
                      minWidth: 0,
                      border: "1.5px solid",
                      borderColor: isActive ? cfg.color : isPast ? cfg.color + "40" : "divider",
                      bgcolor: isActive ? cfg.bg : isPast ? cfg.bg + "80" : "transparent",
                      color: isActive ? cfg.color : isPast ? cfg.color : "text.secondary",
                      "&:hover": { bgcolor: cfg.bg, borderColor: cfg.color },
                      ...(isActive && { boxShadow: `0 2px 8px ${cfg.color}30` }),
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

      {/* ─── Info Row: Date / Payment ─── */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {[
          { icon: <CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />, label: "Order Date", value: formatDate(order.created_at), accent: "#3b82f6", bg: "#eff6ff" },
          { icon: <CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />, label: "Last Updated", value: formatDate(order.updated_at), accent: "#f59e0b", bg: "#fffbeb" },
          { icon: <PaymentOutlinedIcon sx={{ fontSize: 16 }} />, label: "Payment", value: <StatusChip status={order.payment_status} config={PAYMENT_STATUS_CONFIG} />, accent: "#10b981", bg: "#ecfdf5" },
          { icon: <LocalMallOutlinedIcon sx={{ fontSize: 16 }} />, label: "Items", value: `${itemsArr.length} product${itemsArr.length !== 1 ? "s" : ""}`, accent: "#8b5cf6", bg: "#f5f3ff" },
        ].map((c) => (
          <Grid item xs={6} md={3} key={c.label}>
            <Card variant="outlined" sx={{ ...cardSx, height: "100%" }}>
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: c.bg, display: "grid", placeItems: "center", color: c.accent }}>{c.icon}</Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}>{c.label}</Typography>
                    {typeof c.value === "string" ? (
                      <Typography variant="body2" fontWeight={600}>{c.value}</Typography>
                    ) : c.value}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ─── Customer + Shipping row ─── */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ ...cardSx, height: "100%" }}>
            <CardContent>
              <SectionHeader icon={<PersonOutlineIcon sx={{ fontSize: 18 }} />} title="Customer" color="#6366f1" bg="#eef2ff" />
              <Stack spacing={2}>
                <InfoRow icon={<BadgeOutlinedIcon sx={{ fontSize: 16 }} />} label="Name" value={addressInfo.name} />
                <InfoRow icon={<PhoneOutlinedIcon sx={{ fontSize: 16 }} />} label="Phone" value={addressInfo.phone} />
                <InfoRow icon={<BadgeOutlinedIcon sx={{ fontSize: 16 }} />} label="User ID" value={order.user_id} />
                <InfoRow icon={<HomeOutlinedIcon sx={{ fontSize: 16 }} />} label="User Address ID" value={addressInfo.id} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ ...cardSx, height: "100%" }}>
            <CardContent>
              <SectionHeader icon={<LocationOnOutlinedIcon sx={{ fontSize: 18 }} />} title="Shipping" color="#10b981" bg="#ecfdf5" />
              <Stack spacing={2}>
                <InfoRow icon={<HomeOutlinedIcon sx={{ fontSize: 16 }} />} label="Address" value={addressInfo.addressLine} />
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={4}><InfoRow icon={<LocationOnOutlinedIcon sx={{ fontSize: 16 }} />} label="Zone" value={addressInfo.zone} /></Grid>
                  <Grid item xs={12} sm={4}><InfoRow icon={<LocationOnOutlinedIcon sx={{ fontSize: 16 }} />} label="District" value={addressInfo.district} /></Grid>
                  <Grid item xs={12} sm={4}><InfoRow icon={<LocationOnOutlinedIcon sx={{ fontSize: 16 }} />} label="Area" value={addressInfo.area} /></Grid>
                </Grid>
                {order.note && <InfoRow icon={<NoteAltOutlinedIcon sx={{ fontSize: 16 }} />} label="Note" value={order.note} />}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ─── Delivery Assignment ─── */}
      <Card variant="outlined" sx={{ ...cardSx, mb: 2.5 }}>
        <CardContent>
          <SectionHeader icon={<AssignmentIndOutlinedIcon sx={{ fontSize: 18 }} />} title="Assign Delivery Man" color="#8b5cf6" bg="#f5f3ff" />
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField select fullWidth label="Delivery Man" value={selectedDeliveryManId} onChange={(e) => setSelectedDeliveryManId(e.target.value)} disabled={deliveryLoading || assigning} size="small" sx={fieldSx}>
                <MenuItem value="">Select delivery man</MenuItem>
                {deliveryMen.map((man) => (
                  <MenuItem key={man?.id} value={String(man?.id)}>{man?.name} ({man?.phone || "N/A"})</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField fullWidth label="Note" value={assignNote} onChange={(e) => setAssignNote(e.target.value)} disabled={assigning} size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} md={2}>
              {assignment ? (
                <Button fullWidth variant="outlined" onClick={handleUnassignDelivery} disabled={assigning}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, borderColor: "#ef4444", color: "#ef4444", "&:hover": { bgcolor: "#fef2f2", borderColor: "#ef4444" } }}>
                  Unassign
                </Button>
              ) : (
                <Button fullWidth variant="contained" onClick={handleAssignDelivery} disabled={!selectedDeliveryManId || assigning}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: "#8b5cf6", "&:hover": { bgcolor: "#7c3aed" }, boxShadow: "0 2px 8px #8b5cf630" }}>
                  Assign
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Delivery Info ─── */}
      {assignment && (
        <Card variant="outlined" sx={{ ...cardSx, mb: 2.5 }}>
          <CardContent>
            <SectionHeader icon={<DeliveryDiningOutlinedIcon sx={{ fontSize: 18 }} />} title="Delivery Information" color="#0ea5e9" bg="#f0f9ff" />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <InfoRow icon={<SettingsOutlinedIcon sx={{ fontSize: 16 }} />} label="Delivery Status" value={<StatusChip status={assignment?.status ?? "N/A"} config={dynamicOrderStatusConfig} />} />
                  <InfoRow icon={<NoteAltOutlinedIcon sx={{ fontSize: 16 }} />} label="Note" value={assignment?.note || "N/A"} />
                  <InfoRow icon={<CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />} label="Assigned At" value={assignment?.created_at ? formatDate(assignment.created_at) : "N/A"} />
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <InfoRow icon={<BadgeOutlinedIcon sx={{ fontSize: 16 }} />} label="Delivery Man" value={deliveryProfile?.name ?? "N/A"} />
                  <InfoRow icon={<EmailOutlinedIcon sx={{ fontSize: 16 }} />} label="Email" value={deliveryProfile?.email ?? "N/A"} />
                  <InfoRow icon={<PhoneOutlinedIcon sx={{ fontSize: 16 }} />} label="Phone" value={deliveryProfile?.phone ?? "N/A"} />
                  <InfoRow icon={<HomeOutlinedIcon sx={{ fontSize: 16 }} />} label="Address" value={deliveryProfile?.address || "N/A"} />
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ─── Order Items Table ─── */}
      <Card variant="outlined" sx={{ ...cardSx, mb: 2.5 }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
            <SectionHeader icon={<ShoppingBagOutlinedIcon sx={{ fontSize: 18 }} />} title={`Order Items (${itemsArr.length})`} color="#f59e0b" bg="#fffbeb" />
          </Box>

          {itemsArr.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={headCellSx}>Product</TableCell>
                    <TableCell sx={headCellSx}>SKU</TableCell>
                    <TableCell sx={{ ...headCellSx, textAlign: "center" }}>Unit Price</TableCell>
                    <TableCell sx={{ ...headCellSx, textAlign: "center" }}>Qty</TableCell>
                    <TableCell sx={{ ...headCellSx, textAlign: "right" }}>Line Total</TableCell>
                    <TableCell sx={{ ...headCellSx, textAlign: "center" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itemsArr.map((item) => (
                    <TableRow key={item.id} sx={{ "&:hover": { bgcolor: "action.hover" }, transition: "background .15s" }}>
                      <TableCell sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                        <Typography variant="body2" fontWeight={700}>{item.product_name}</Typography>
                        <Typography variant="caption" sx={{ color: "#6366f1" }}>Shop: {item?.shop?.name || item?.product?.shop?.name || ""}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>{item.sku}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid", borderColor: "divider", textAlign: "center" }}>
                        <Typography variant="body2">{formatCurrency(item.unit_price)}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid", borderColor: "divider", textAlign: "center" }}>
                        <Chip label={item.qty} size="small" sx={{ fontWeight: 700, minWidth: 32, bgcolor: "#f1f5f9" }} />
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid", borderColor: "divider", textAlign: "right" }}>
                        <Typography variant="body2" fontWeight={700}>{formatCurrency(item.line_total)}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid", borderColor: "divider", textAlign: "center" }}>
                        <StatusChip status={(item.status || "").toLowerCase()} config={dynamicOrderStatusConfig} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <ShoppingBagOutlinedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography color="text.secondary">No items in this order</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ─── Order Summary ─── */}
      <Card variant="outlined" sx={{ ...cardSx }}>
        <CardContent>
          <SectionHeader icon={<ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} />} title="Order Summary" color="#10b981" bg="#ecfdf5" />
          <Box sx={{ maxWidth: 380, ml: "auto" }}>
            <Stack spacing={1.5}>
              {[
                { label: "Subtotal", value: formatCurrency(order.subtotal) },
                { label: "Shipping Fee", value: formatCurrency(order.shipping_fee) },
                { label: "Discount", value: `-${formatCurrency(order.discount)}`, color: "#ef4444" },
              ].map((r) => (
                <Stack key={r.label} direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: r.color || "text.primary" }}>{r.value}</Typography>
                </Stack>
              ))}
              <Box sx={{ borderTop: "2px dashed", borderColor: "divider", pt: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={800}>Total</Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: "#6366f1" }}>{formatCurrency(order.total)}</Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OderDetails;
