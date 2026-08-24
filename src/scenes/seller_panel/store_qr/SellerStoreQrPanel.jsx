import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { getAllShops } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";
import { createQrMatrix } from "../../../utils/qrCode";
import logoBlue from "../../../assets/logo/store_myzoo_logo_blue.png";

const safeArray = (value) => (Array.isArray(value) ? value : []);

const getStoreName = (store) => store?.shop_name || store?.name || store?.store_name || "MyZoo Store";
const getStoreSlug = (store) => store?.slug || store?.shop_slug || store?.store_slug || "";

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const fitText = (ctx, text, maxWidth, startSize, minSize, weight = 900) => {
  let size = startSize;
  do {
    ctx.font = `${weight} ${size}px Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  } while (size >= minSize);
  return minSize;
};

const drawQr = (ctx, matrix, x, y, size, dark = "#07145f", light = "#ffffff") => {
  const moduleCount = matrix.length;
  const quiet = 4;
  const totalModules = moduleCount + quiet * 2;
  const moduleSize = size / totalModules;

  ctx.fillStyle = light;
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = dark;
  matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (!value) return;
      ctx.fillRect(
        x + (colIndex + quiet) * moduleSize,
        y + (rowIndex + quiet) * moduleSize,
        Math.ceil(moduleSize),
        Math.ceil(moduleSize)
      );
    });
  });
};

const SellerStoreQrPanel = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState("");
  const [error, setError] = useState("");
  const logoRef = useRef(null);

  useEffect(() => {
    const image = new Image();
    image.src = logoBlue;
    logoRef.current = image;
  }, []);

  useEffect(() => {
    const loadStores = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      setLoading(true);
      setError("");
      try {
        const response = await getAllShops({ user_id: userId, page: 1, per_page: 200 });
        const payload = response?.data ?? response;
        const list = safeArray(payload?.data ?? payload);
        setStores(list);
        const storedId = localStorage.getItem("storeId") || localStorage.getItem("shopId");
        const selected = list.find((store) => String(store?.id) === String(storedId)) || list[0] || null;
        if (selected?.id) setSelectedStoreId(String(selected.id));
      } catch (err) {
        setStores([]);
        setError(err?.message || "Failed to load your stores.");
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, []);

  const selectedStore = useMemo(
    () => stores.find((store) => String(store?.id) === String(selectedStoreId)) || null,
    [stores, selectedStoreId]
  );

  const storeName = getStoreName(selectedStore);
  const storeSlug = getStoreSlug(selectedStore);
  const storeUrl = useMemo(() => {
    if (!storeSlug) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://myzoo.asia";
    return `${origin}/store/${encodeURIComponent(String(storeSlug))}`;
  }, [storeSlug]);

  const qrResult = useMemo(() => {
    if (!storeUrl) return { matrix: null, error: "" };
    try {
      return { matrix: createQrMatrix(storeUrl), error: "" };
    } catch (err) {
      return { matrix: null, error: err?.message || "Could not generate QR code." };
    }
  }, [storeUrl]);
  const qrMatrix = qrResult.matrix;

  const handleCopy = async () => {
    if (!storeUrl) return;
    try {
      await navigator.clipboard.writeText(storeUrl);
      setSnack("Store URL copied");
    } catch {
      setSnack("Could not copy URL");
    }
  };

  const handleOpen = () => {
    if (!storeUrl) return;
    window.open(storeUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    if (!qrMatrix || !storeUrl) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 1080, 420);
    gradient.addColorStop(0, "#07145f");
    gradient.addColorStop(0.58, "#0f2f88");
    gradient.addColorStop(1, "#0f766e");
    ctx.fillStyle = gradient;
    drawRoundedRect(ctx, 80, 80, 920, 1190, 52);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, 126, 126, 828, 1098, 38);
    ctx.fill();

    if (logoRef.current?.complete) {
      ctx.drawImage(logoRef.current, 388, 162, 304, 112);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#07145f";
    fitText(ctx, storeName, 760, 64, 34);
    ctx.fillText(storeName, 540, 354);

    ctx.font = "700 30px Arial, sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText("Scan to shop from our online store", 540, 410);

    ctx.fillStyle = "#f8fafc";
    drawRoundedRect(ctx, 210, 470, 660, 660, 34);
    ctx.fill();
    ctx.strokeStyle = "#dbeafe";
    ctx.lineWidth = 6;
    ctx.stroke();
    drawQr(ctx, qrMatrix, 250, 510, 580);

    ctx.fillStyle = "#07145f";
    ctx.font = "900 34px Arial, sans-serif";
    ctx.fillText("MyZoo Storefront", 540, 1184);
    ctx.font = "600 26px Arial, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(storeUrl, 540, 1232);

    const link = document.createElement("a");
    link.download = `${String(storeSlug || "store").replace(/[^a-z0-9_-]+/gi, "-")}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <QrCode2OutlinedIcon sx={{ color: "#07145f", fontSize: 34 }} />
            <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: -0.5 }}>
              Store QR Download
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
            Create a framed QR poster customers can scan to open your storefront.
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 280 } }}>
          <InputLabel>Store</InputLabel>
          <Select label="Store" value={selectedStoreId} onChange={(e) => setSelectedStoreId(String(e.target.value))} disabled={loading || stores.length === 0}>
            {stores.map((store) => (
              <MenuItem key={store?.id} value={String(store?.id ?? "")}>
                {getStoreName(store)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {error || qrResult.error ? <Alert severity="warning" sx={{ mb: 2 }}>{error || qrResult.error}</Alert> : null}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: isDark ? "#161822" : "#fff" }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              {loading ? (
                <Box sx={{ py: 12, display: "grid", placeItems: "center" }}>
                  <CircularProgress />
                </Box>
              ) : !selectedStore ? (
                <Alert severity="info">No store found for this seller account.</Alert>
              ) : !storeSlug ? (
                <Alert severity="warning">This store does not have a public slug yet. Please update the store profile first.</Alert>
              ) : (
                <Box
                  sx={{
                    mx: "auto",
                    width: "min(100%, 520px)",
                    p: 2,
                    borderRadius: 4,
                    background: "linear-gradient(135deg, #07145f 0%, #0f2f88 58%, #0f766e 100%)",
                  }}
                >
                  <Box sx={{ borderRadius: 3, bgcolor: "#fff", p: { xs: 2.2, sm: 3 }, textAlign: "center" }}>
                    <Box component="img" src={logoBlue} alt="MyZoo" sx={{ width: 160, height: 58, objectFit: "contain", mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 950, color: "#07145f", lineHeight: 1.15 }}>
                      {storeName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 700, mt: 0.6 }}>
                      Scan to shop from our online store
                    </Typography>

                    <Box sx={{ mt: 2.5, mx: "auto", width: { xs: 250, sm: 310 }, aspectRatio: "1 / 1", bgcolor: "#f8fafc", borderRadius: 2.5, p: 2, border: "1px solid #dbeafe" }}>
                      {qrMatrix ? (
                        <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${qrMatrix.length + 8}, 1fr)`, width: "100%", height: "100%", bgcolor: "#fff" }}>
                          {Array.from({ length: qrMatrix.length + 8 }).flatMap((_, y) =>
                            Array.from({ length: qrMatrix.length + 8 }).map((__, x) => {
                              const row = y - 4;
                              const col = x - 4;
                              const on = row >= 0 && row < qrMatrix.length && col >= 0 && col < qrMatrix.length ? qrMatrix[row][col] : false;
                              return <Box key={`${x}-${y}`} sx={{ bgcolor: on ? "#07145f" : "#fff" }} />;
                            })
                          )}
                        </Box>
                      ) : null}
                    </Box>

                    <Typography sx={{ mt: 2, color: "#07145f", fontWeight: 900 }}>
                      MyZoo Storefront
                    </Typography>
                    <Typography variant="caption" sx={{ display: "block", color: "#64748b", wordBreak: "break-all", fontWeight: 700 }}>
                      {storeUrl}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: isDark ? "#161822" : "#fff", height: "100%" }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack spacing={2.2}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: "#eef2ff", color: "#07145f", display: "grid", placeItems: "center" }}>
                    <StorefrontOutlinedIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 950 }}>Public Store URL</Typography>
                    <Typography variant="caption" color="text.secondary">This QR opens your storefront directly.</Typography>
                  </Box>
                </Stack>

                <TextField label="Store link" value={storeUrl} size="small" fullWidth InputProps={{ readOnly: true }} />

                <Button variant="contained" startIcon={<DownloadOutlinedIcon />} onClick={handleDownload} disabled={!qrMatrix || !storeUrl} sx={{ borderRadius: 2, py: 1.2, textTransform: "none", fontWeight: 900, bgcolor: "#07145f" }}>
                  Download QR Frame
                </Button>
                <Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={handleCopy} disabled={!storeUrl} sx={{ borderRadius: 2, py: 1.1, textTransform: "none", fontWeight: 800 }}>
                  Copy Store URL
                </Button>
                <Button variant="outlined" startIcon={<LaunchOutlinedIcon />} onClick={handleOpen} disabled={!storeUrl} sx={{ borderRadius: 2, py: 1.1, textTransform: "none", fontWeight: 800 }}>
                  Open Public Store
                </Button>

                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Print this frame for your counter, delivery bag, product packaging, or social media poster.
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={Boolean(snack)} autoHideDuration={2500} onClose={() => setSnack("")} message={snack} />
    </Box>
  );
};

export default SellerStoreQrPanel;
