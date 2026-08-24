import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { deleteSellerUpload, fetchSellerUploads, uploadSellerFile } from "../../../api/controller/seller_controller/seller_media_controller.jsx";
import { image_file_url } from "../../../api/config";

const safeArray = (value) => (Array.isArray(value) ? value : []);

const normalizePayload = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response ?? {};
  const list = Array.isArray(payload?.data) ? payload.data : safeArray(payload);
  return {
    list,
    currentPage: Number(payload?.current_page || 1),
    lastPage: Number(payload?.last_page || 1),
    total: Number(payload?.total || list.length),
  };
};

export const resolveUploadUrl = (item) => {
  const raw = item?.url || item?.file_url || item?.preview_url || item?.file_name || "";
  if (!raw) return "";
  const cleaned = String(raw).replaceAll("\\/", "/");
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  const base = String(image_file_url || "").replace(/\/+$/, "");
  return `${base}/${cleaned.replace(/^\/+/, "")}`;
};

const formatFileSize = (size) => {
  const n = Number(size || 0);
  if (!n) return "-";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const isImage = (item) => {
  const type = String(item?.type || "").toLowerCase();
  const ext = String(item?.extension || "").toLowerCase();
  return type.startsWith("image") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
};

export default function SellerMediaLibrary({
  picker = false,
  single = true,
  accept = "",
  onSelect,
  onClose,
  title = "My Media Library",
}) {
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(single ? null : []);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadUploads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchSellerUploads({ page, per_page: 20 });
      const payload = normalizePayload(response);
      setItems(payload.list);
      setLastPage(payload.lastPage);
      setTotal(payload.total);
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || e.message || "Failed to load your media library.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  const selectedItems = useMemo(() => {
    if (single) return selected ? items.filter((item) => String(item.id) === String(selected)) : [];
    return items.filter((item) => safeArray(selected).some((id) => String(id) === String(item.id)));
  }, [items, selected, single]);

  const isChecked = (id) =>
    single ? String(selected) === String(id) : safeArray(selected).some((value) => String(value) === String(id));

  const toggleSelect = (item) => {
    if (!picker) return;
    if (single) {
      setSelected((prev) => (String(prev) === String(item.id) ? null : item.id));
      return;
    }
    setSelected((prev) => {
      const current = safeArray(prev);
      return current.some((id) => String(id) === String(item.id))
        ? current.filter((id) => String(id) !== String(item.id))
        : [...current, item.id];
    });
  };

  const confirmSelect = () => {
    if (!onSelect) return;
    onSelect(single ? selectedItems[0] || null : selectedItems);
  };

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      for (const file of files) {
        await uploadSellerFile(file);
      }
      setMessage(files.length > 1 ? "Files uploaded successfully." : "File uploaded successfully.");
      await loadUploads();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to upload file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (event, item) => {
    event.stopPropagation();
    setDeletingId(item.id);
    setError("");
    setMessage("");
    try {
      await deleteSellerUpload(item.id);
      setItems((prev) => prev.filter((row) => String(row.id) !== String(item.id)));
      setSelected((prev) => (single ? (String(prev) === String(item.id) ? null : prev) : safeArray(prev).filter((id) => String(id) !== String(item.id))));
      setMessage("File deleted successfully.");
    } catch (e) {
      const status = e?.response?.status;
      setError(status === 404 ? "File not found or access denied." : e?.response?.data?.message || e.message || "Failed to delete file.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box sx={{ p: picker ? 0 : { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
        <Box>
          <Typography variant={picker ? "h6" : "h5"} sx={{ fontWeight: 900 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {total} file{total === 1 ? "" : "s"} uploaded by your seller account
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<CloudUploadOutlinedIcon />}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900 }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          {picker ? (
            <Button
              variant="outlined"
              disabled={!selectedItems.length}
              onClick={confirmSelect}
              sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900 }}
            >
              Select
            </Button>
          ) : null}
          {picker && onClose ? (
            <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 800 }}>
              Close
            </Button>
          ) : null}
        </Stack>
        <input ref={fileInputRef} hidden type="file" multiple={!single || !picker} accept={accept} onChange={handleUpload} />
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert> : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Alert severity="info">No files found in your media library.</Alert>
      ) : (
        <Grid container spacing={2}>
          {items.map((item) => {
            const url = resolveUploadUrl(item);
            const checked = isChecked(item.id);
            return (
              <Grid item xs={12} sm={6} md={picker ? 4 : 3} xl={picker ? 3 : 2.4} key={item.id}>
                <Card
                  onClick={() => toggleSelect(item)}
                  variant="outlined"
                  sx={{
                    borderRadius: 1,
                    overflow: "hidden",
                    cursor: picker ? "pointer" : "default",
                    borderColor: checked ? "primary.main" : "divider",
                    boxShadow: checked ? "0 0 0 2px rgba(37,99,235,0.16)" : "none",
                  }}
                >
                  <Box sx={{ position: "relative", bgcolor: "#f8fafc", height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isImage(item) && url ? (
                      <Box component="img" src={url} alt={item.file_original_name || item.file_name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Stack alignItems="center" spacing={1}>
                        <InsertDriveFileOutlinedIcon sx={{ fontSize: 42, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">{item.extension || "file"}</Typography>
                      </Stack>
                    )}
                    {picker ? (
                      <Checkbox checked={checked} sx={{ position: "absolute", top: 6, left: 6, bgcolor: "rgba(255,255,255,0.86)", borderRadius: 1 }} />
                    ) : null}
                    <IconButton
                      size="small"
                      color="error"
                      disabled={deletingId === item.id}
                      onClick={(event) => handleDelete(event, item)}
                      sx={{ position: "absolute", top: 6, right: 6, bgcolor: "rgba(255,255,255,0.88)", "&:hover": { bgcolor: "#fff" } }}
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <CardContent sx={{ p: 1.4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap title={item.file_original_name || item.file_name}>
                      {item.file_original_name || item.file_name || `File #${item.id}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap title={item.file_name}>
                      {item.file_name || "-"}
                    </Typography>
                    <Stack direction="row" spacing={0.7} sx={{ mt: 1, flexWrap: "wrap" }}>
                      <Chip label={item.type || "file"} size="small" sx={{ borderRadius: 1, maxWidth: 110 }} />
                      <Chip label={item.extension || "-"} size="small" sx={{ borderRadius: 1 }} />
                      <Chip label={formatFileSize(item.file_size)} size="small" sx={{ borderRadius: 1 }} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.8 }}>
                      {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                    </Typography>
                    {url ? (
                      <Typography variant="caption" color="primary" display="block" noWrap title={url}>
                        {url}
                      </Typography>
                    ) : null}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {lastPage > 1 ? (
        <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
          <Pagination count={lastPage} page={page} onChange={(_event, value) => setPage(value)} color="primary" />
        </Stack>
      ) : null}
    </Box>
  );
}
