import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  Tooltip,
  IconButton,
} from "@mui/material";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

import {
  getAllShops,
  getShopDetails,
  getStoreQrAppBlob,
  getStoreQrPayloadData,
} from "../../../api/controller/admin_controller/shop/shop_controller.jsx";
import logoBlue from "../../../assets/logo/store_myzoo_logo_blue.png";

const safeArray = (value) => (Array.isArray(value) ? value : []);
const getStoreName = (store) => store?.shop_name || store?.name || store?.store_name || "MyZoo Store";
const getStoreSlug = (store) => store?.slug || store?.shop_slug || store?.store_slug || "";
const getStoreCode = (store) => store?.code || store?.shop_code || store?.store_code || "";

const SellerStoreQrPanel = ({ storeId: storeIdProp = "" }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [loadingStores, setLoadingStores] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [copyingPayload, setCopyingPayload] = useState(false);

  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrError, setQrError] = useState("");

  const [snack, setSnack] = useState("");
  const [error, setError] = useState("");

  // Load stores list
  useEffect(() => {
    const loadStores = async () => {
      const userId = localStorage.getItem("userId");
      if (!storeIdProp && !userId) return;
      setLoadingStores(true);
      setError("");
      try {
        let list = [];
        if (storeIdProp) {
          const response = await getShopDetails(storeIdProp);
          if (response?.status !== "success") throw new Error(response?.message || "Failed to load store.");
          list = response?.data ? [response.data] : [];
        } else {
          const response = await getAllShops({ user_id: userId, page: 1, per_page: 200 });
          const payload = response?.data ?? response;
          list = safeArray(payload?.data ?? payload);
        }
        setStores(list);

        const storedId = localStorage.getItem("storeId") || localStorage.getItem("shopId");
        const selected = storeIdProp
          ? list[0]
          : list.find((store) => String(store?.id) === String(storedId)) || list[0] || null;

        if (selected?.id) {
          setSelectedStoreId(String(selected.id));
        }
      } catch (err) {
        setStores([]);
        setError(err?.message || "Failed to load your stores.");
      } finally {
        setLoadingStores(false);
      }
    };

    loadStores();
  }, [storeIdProp]);

  const selectedStore = useMemo(
    () => stores.find((store) => String(store?.id) === String(selectedStoreId)) || null,
    [stores, selectedStoreId]
  );

  const storeName = getStoreName(selectedStore);
  const storeSlug = getStoreSlug(selectedStore);
  const storeCode = getStoreCode(selectedStore);

  const storeUrl = useMemo(() => {
    if (!storeSlug) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://myzoo.asia";
    return `${origin}/store/${encodeURIComponent(String(storeSlug))}`;
  }, [storeSlug]);

  // Fetch official QR Image Blob from GET /api/stores/{storeId}/qr/app
  const fetchQrImage = async (storeId) => {
    if (!storeId) return;
    setLoadingQr(true);
    setQrError("");

    try {
      const blob = await getStoreQrAppBlob(storeId);
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        setQrImageUrl((prevUrl) => {
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          return objectUrl;
        });
      } else {
        throw new Error("Empty image response from server.");
      }
    } catch (err) {
      console.error("Failed to load official store QR image:", err);
      const is404 = err?.response?.status === 404;
      setQrError(
        is404
          ? `Backend endpoint GET /api/stores/${storeId}/qr/app not found (404). Please register this route in your Laravel backend.`
          : err?.response?.data?.message || err?.message || "Failed to fetch official store QR image from backend."
      );
    } finally {
      setLoadingQr(false);
    }
  };

  useEffect(() => {
    if (selectedStoreId) {
      fetchQrImage(selectedStoreId);
    }
    return () => {
      setQrImageUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return "";
      });
    };
  }, [selectedStoreId]);

  // Download Store QR Button (filename format: store_{store_code}_qr.png)
  const handleDownloadQr = () => {
    if (!qrImageUrl) return;

    const identifier = storeCode || storeSlug || selectedStoreId || "store";
    const fileName = `store_${identifier}_qr.png`;

    const a = document.createElement("a");
    a.href = qrImageUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setSnack(`Downloading ${fileName}...`);
  };

  // Requirement 4: Copy / Debug Payload Button (GET /api/stores/{storeId}/qr/payload)
  const handleCopyPayload = async () => {
    if (!selectedStoreId) return;
    setCopyingPayload(true);
    try {
      const resData = await getStoreQrPayloadData(selectedStoreId);
      if (resData?.status === "success" && resData?.data?.payload !== undefined) {
        const payloadStr =
          typeof resData.data.payload === "string"
            ? resData.data.payload
            : JSON.stringify(resData.data.payload);

        await navigator.clipboard.writeText(payloadStr);
        setSnack("QR Payload copied to clipboard!");
      } else {
        throw new Error(resData?.message || "QR Payload unavailable");
      }
    } catch (err) {
      console.error("Failed to copy QR payload:", err);
      setSnack(err?.message || "Failed to copy QR payload.");
    } finally {
      setCopyingPayload(false);
    }
  };

  // Copy Store Link
  const handleCopyUrl = async () => {
    if (!storeUrl) return;
    try {
      await navigator.clipboard.writeText(storeUrl);
      setSnack("Store URL copied to clipboard!");
    } catch {
      setSnack("Could not copy Store URL");
    }
  };

  // Open Public Store Page
  const handleOpenStore = () => {
    if (!storeUrl) return;
    window.open(storeUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      {/* ── Page Header ── */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <QrCode2OutlinedIcon sx={{ color: "#07145f", fontSize: 36 }} />
            <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: -0.5 }}>
              Official Store QR Panel
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
            Official MyZoo App scanner QR code for customer app scanning & store sharing.
          </Typography>
        </Box>

        {/* Store Selector (for multi-store sellers or general seller panel view) */}
        {!storeIdProp && (
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 280 } }}>
            <InputLabel>Select Store</InputLabel>
            <Select
              label="Select Store"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(String(e.target.value))}
              disabled={loadingStores || stores.length === 0}
            >
              {stores.map((store) => (
                <MenuItem key={store?.id} value={String(store?.id ?? "")}>
                  {getStoreName(store)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        {/* ── Left Column: QR Poster Card ── */}
        <Grid item xs={12} md={7}>
          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: isDark ? "#161822" : "#fff",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              {loadingStores ? (
                <Box sx={{ py: 12, display: "grid", placeItems: "center" }}>
                  <CircularProgress />
                </Box>
              ) : !selectedStore ? (
                <Alert severity="info">No store found for this account.</Alert>
              ) : (
                <Stack spacing={2.5}>
                  {/* Poster Box Container */}
                  <Box
                    sx={{
                      mx: "auto",
                      width: "min(100%, 480px)",
                      p: 2.5,
                      borderRadius: 4,
                      background: "linear-gradient(135deg, #07145f 0%, #0f2f88 58%, #0f766e 100%)",
                      boxShadow: "0 12px 32px rgba(7, 20, 95, 0.18)",
                    }}
                  >
                    <Box
                      sx={{
                        borderRadius: 3,
                        bgcolor: "#fff",
                        p: { xs: 2.5, sm: 3.5 },
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {/* MyZoo Logo */}
                      <Box
                        component="img"
                        src={logoBlue}
                        alt="MyZoo"
                        sx={{ width: 150, height: 50, objectFit: "contain", mb: 1 }}
                      />

                      {/* Store Name */}
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 950, color: "#07145f", lineHeight: 1.2, mb: 0.5 }}
                      >
                        {storeName}
                      </Typography>

                      <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 700, mb: 2 }}>
                        Scan to shop from our online store
                      </Typography>

                      {/* Requirement 2: Render Backend QR Image Blob */}
                      <Box
                        sx={{
                          width: { xs: 240, sm: 290 },
                          height: { xs: 240, sm: 290 },
                          bgcolor: "#f8fafc",
                          borderRadius: 3,
                          p: 1.5,
                          border: "1.5px solid #dbeafe",
                          display: "grid",
                          placeItems: "center",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {loadingQr ? (
                          <Stack alignItems="center" spacing={1}>
                            <CircularProgress size={36} sx={{ color: "#07145f" }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              Fetching Store QR...
                            </Typography>
                          </Stack>
                        ) : qrError ? (
                          <Alert severity="error" sx={{ width: "90%", fontSize: 12 }}>
                            {qrError}
                          </Alert>
                        ) : qrImageUrl ? (
                          <Box
                            component="img"
                            src={qrImageUrl}
                            alt={`Store QR for ${storeName}`}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              borderRadius: 1.5,
                            }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            No QR image available
                          </Typography>
                        )}
                      </Box>

                      {/* Footer Badge */}
                      <Typography sx={{ mt: 2.5, color: "#07145f", fontWeight: 900, fontSize: 16 }}>
                        MyZoo Storefront App QR
                      </Typography>

                      {(storeCode || storeSlug) && (
                        <Tooltip title="Click to copy Store Code">
                          <Chip
                            icon={<CodeOutlinedIcon sx={{ fontSize: "14px !important", color: "inherit" }} />}
                            label={
                              <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.6 }}>
                                <span style={{ opacity: 0.7, fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px" }}>CODE:</span>
                                <span style={{ fontFamily: "monospace, Courier, sans-serif", fontWeight: 900, letterSpacing: "1.2px", fontSize: "13px" }}>
                                  {storeCode || storeSlug}
                                </span>
                              </Box>
                            }
                            size="small"
                            onClick={() => {
                              const val = storeCode || storeSlug;
                              navigator.clipboard.writeText(val);
                              setSnack(`Store Code (${val}) copied to clipboard!`);
                            }}
                            sx={{
                              mt: 1.2,
                              fontWeight: 800,
                              fontSize: 12,
                              height: 28,
                              px: 0.5,
                              bgcolor: "#f1f5f9",
                              color: "#07145f",
                              border: "1px solid",
                              borderColor: "#cbd5e1",
                              borderRadius: 2,
                              cursor: "pointer",
                              transition: "all 0.2s ease-in-out",
                              "&:hover": {
                                bgcolor: "#e0e7ff",
                                borderColor: "#818cf8",
                                color: "#3730a3",
                                transform: "translateY(-1px)",
                                boxShadow: "0 2px 8px rgba(7, 20, 95, 0.12)",
                              },
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  {/* Requirement 5: Mandatory Scanner Notice Text */}
                  <Alert
                    severity="warning"
                    icon={<WarningAmberOutlinedIcon sx={{ color: "#b45309" }} />}
                    sx={{
                      borderRadius: 2.5,
                      fontWeight: 600,
                      fontSize: 13,
                      bgcolor: isDark ? "rgba(245, 158, 11, 0.1)" : "#fffbeb",
                      color: isDark ? "#fbbf24" : "#92400e",
                      border: "1px solid",
                      borderColor: isDark ? "rgba(245, 158, 11, 0.25)" : "#fef3c7",
                    }}
                  >
                    <strong>Notice:</strong> This QR is for MyZoo app scanner. Normal phone camera may not open it.
                  </Alert>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right Column: Action Buttons & Debug Panel ── */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: isDark ? "#161822" : "#fff",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      bgcolor: "rgba(7, 20, 95, 0.08)",
                      color: "#07145f",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <StorefrontOutlinedIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                      Store QR Actions
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Download official PNG or copy payload data.
                    </Typography>
                  </Box>
                </Stack>

                {storeUrl && (
                  <TextField
                    label="Public Store URL"
                    value={storeUrl}
                    size="small"
                    fullWidth
                    InputProps={{ readOnly: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                )}

                {/* Requirement 3: Download Store QR Button */}
                <Button
                  variant="contained"
                  startIcon={<DownloadOutlinedIcon />}
                  onClick={handleDownloadQr}
                  disabled={!qrImageUrl || loadingQr}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.3,
                    textTransform: "none",
                    fontWeight: 900,
                    fontSize: 14,
                    bgcolor: "#07145f",
                    boxShadow: "0 4px 14px rgba(7, 20, 95, 0.25)",
                    "&:hover": { bgcolor: "#0f2f88" },
                  }}
                >
                  Download Store QR (PNG)
                </Button>

                {/* Requirement 4: Copy / Debug Payload Button */}
                <Button
                  variant="outlined"
                  startIcon={
                    copyingPayload ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <CodeOutlinedIcon />
                    )
                  }
                  onClick={handleCopyPayload}
                  disabled={!selectedStoreId || copyingPayload}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.2,
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: 14,
                    borderColor: "divider",
                    color: "text.primary",
                    "&:hover": { borderColor: "#07145f", bgcolor: "rgba(7, 20, 95, 0.04)" },
                  }}
                >
                  {copyingPayload ? "Fetching Payload..." : "Copy / Debug Payload"}
                </Button>

                {/* Optional Store URL actions */}
                {storeUrl && (
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ContentCopyOutlinedIcon />}
                      onClick={handleCopyUrl}
                      sx={{ borderRadius: 2, py: 1, textTransform: "none", fontWeight: 700, fontSize: 13 }}
                    >
                      Copy Link
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<LaunchOutlinedIcon />}
                      onClick={handleOpenStore}
                      sx={{ borderRadius: 2, py: 1, textTransform: "none", fontWeight: 700, fontSize: 13 }}
                    >
                      Open Store
                    </Button>
                  </Stack>
                )}

                {/* Refresh QR button */}
                {selectedStoreId && (
                  <Button
                    size="small"
                    startIcon={<RefreshOutlinedIcon />}
                    onClick={() => fetchQrImage(selectedStoreId)}
                    disabled={loadingQr}
                    sx={{ textTransform: "none", color: "text.secondary", alignSelf: "center", mt: 1 }}
                  >
                    Refresh QR Image
                  </Button>
                )}

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                    border: "1px solid",
                    borderColor: "divider",
                    mt: 1,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, display: "block", mb: 0.5 }}>
                    QR TECHNICAL SPECIFICATIONS
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    • Endpoint: <code>GET /api/stores/&#123;storeId&#125;/qr/app</code><br />
                    • Format: PNG Image (800×800 px)<br />
                    • App Scanner Payload: <code>GET /api/stores/&#123;storeId&#125;/qr/payload</code>
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar notification */}
      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={3000}
        onClose={() => setSnack("")}
        message={snack}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      />
    </Box>
  );
};

export default SellerStoreQrPanel;
