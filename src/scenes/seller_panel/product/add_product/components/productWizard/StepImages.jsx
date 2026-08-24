import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Typography, Divider, Card, CardContent, Chip, FormHelperText } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import SellerMediaLibrary, { resolveUploadUrl } from "../../../../media/SellerMediaLibrary";
import { image_file_url } from "../../../../../../api/config";
import {
  deleteProductImage,
  getProductImages,
} from "../../../../../../api/controller/admin_controller/product/product_setting_controller";

function StepImages({ value = [], onChange, onPrimary, error = "", productId }) {
  const fileInputRef = useRef(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [loadingImages, setLoadingImages] = useState(false);

  const ensurePrimary = (list) => {
    if (list.length === 0) return list;
    if (list.some((x) => x.is_primary)) return list;
    const next = [...list];
    next[0] = { ...next[0], is_primary: true };
    return next;
  };

  const updateImages = (next) => {
    if (!onChange) return;
    onChange(ensurePrimary(next));
  };

  const removeAtIndex = (idx) => {
    updateImages(value.filter((_, i) => i !== idx));
  };

  const getImageKey = (img) => String(img?.media_id ?? img?.id ?? img?.file_name ?? img?.filename ?? "");

  const mapServerImage = (img) => {
    const upload = img?.upload || null;
    const mediaId = img?.media_id ?? upload?.id ?? img?.id ?? null;
    return {
      file: null,
      media_id: mediaId,
      file_name: upload?.file_name || img?.file_name || img?.image || "",
      filename:
        upload?.file_original_name ||
        upload?.file_name ||
        img?.file_original_name ||
        img?.file_name ||
        img?.image ||
        "",
      url: upload?.url || img?.url || null,
      is_primary: Boolean(img?.is_primary ?? img?.is_primary_image ?? img?.primary),
    };
  };

  const normalizeList = (x) => {
    if (!x) return [];
    if (Array.isArray(x)) return x;
    if (Array.isArray(x?.data)) return x.data;
    if (Array.isArray(x?.data?.data)) return x.data.data;
    if (Array.isArray(x?.data?.data?.data)) return x.data.data.data;
    return [];
  };

  useEffect(() => {
    const loadImages = async () => {
      if (!productId || !onChange) return;
      setLoadingImages(true);
      try {
        const res = await getProductImages(productId);
        const list = normalizeList(res?.data ?? res);
        const serverImages = list.map(mapServerImage).filter((img) => img.media_id || img.file_name);
        const existingKeys = new Set(value.map(getImageKey));
        const merged = [...value];
        serverImages.forEach((img) => {
          const key = getImageKey(img);
          if (!key || existingKeys.has(key)) return;
          existingKeys.add(key);
          merged.push(img);
        });
        updateImages(merged);
      } catch (err) {
        console.error("Failed to load product images", err);
      } finally {
        setLoadingImages(false);
      }
    };

    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not a valid image file`);
        return;
      }

      // Add file object with is_primary flag
      const next = [
        ...value,
        {
          file: file,
          filename: file.name,
          is_primary: value.length === 0, // first image is primary by default
        },
      ];
      updateImages(next);
    });

    // Reset input
    fileInputRef.current.value = "";
  };

  const handleMediaSelect = (itemOrItems) => {
    if (!itemOrItems) return;
    const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    items.forEach((it) => {
      const next = [
        ...value,
        {
          file: null,
          media_id: it.id,
          filename: it.file_original_name || it.file_name,
          file_name: it.file_name || "",
          url: resolveUploadUrl(it),
          is_primary: value.length === 0 || !value.some((v) => v.is_primary),
        },
      ];
      updateImages(next);
    });
  };

  const handleRemove = async (img, idx) => {
    if (!img || !onChange) return;
    const mediaId = img?.media_id ?? img?.id ?? null;
    if (!mediaId || img?.file) {
      removeAtIndex(idx);
      return;
    }

    try {
      setRemovingId(mediaId);
      const res = await deleteProductImage(mediaId);
      if (res?.status && res.status !== "success") {
        console.error("Failed to delete product image", res);
        return;
      }
      removeAtIndex(idx);
    } catch (err) {
      console.error("Failed to delete product image", err);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload product images. The first image will be set as primary by default.
      </Typography>

      {/* File Upload Section */}
      <Box
        sx={{
          border: "2px dashed",
          borderColor: error ? "error.main" : "primary.main",
          borderRadius: 1,
          p: 3,
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        <CloudUpload sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
        <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
          Click to upload or drag and drop
        </Typography>
        <Typography variant="caption" color="text.secondary">
          PNG, JPG, GIF up to 10MB
        </Typography>
      </Box>

      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
        <Button variant="outlined" onClick={() => fileInputRef.current?.click()} startIcon={<CloudUpload />}>Upload Images</Button>
        <Button variant="contained" onClick={() => setMediaOpen(true)}>Choose From Library</Button>
      </Box>

      {error && (
        <FormHelperText error sx={{ mt: 1 }}>
          {error}
        </FormHelperText>
      )}

      <Divider sx={{ my: 2, opacity: 0.2 }} />

      {/* Images List */}
      {loadingImages ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Loading images...
        </Typography>
      ) : null}
      {value.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No images added yet. Upload at least one image.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {value.map((img, idx) => (
            <Card key={idx} variant="outlined">
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: 2 }}>
                  {/* File preview thumbnail */}
                  {img.file && (
                    <Box
                      component="img"
                      src={URL.createObjectURL(img.file)}
                      alt="preview"
                      sx={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 0.5,
                        bgcolor: "action.hover",
                      }}
                    />
                  )}

                  {/* media library preview */}
                  {!img.file && img.media_id && (
                    <Box
                      component="img"
                      src={img.file_name ? `${image_file_url}/${img.file_name}` : (img.url || "/assets/images/placeholder.png")}
                      alt={img.filename}
                      sx={{ width: 60, height: 60, objectFit: "cover", borderRadius: 0.5, bgcolor: "action.hover" }}
                    />
                  )}

                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap title={img.filename}>
                      {img.filename}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {img.file ? `${(img.file.size / 1024).toFixed(2)} KB` : "No file"}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                  {img.is_primary ? (
                    <Chip label="Primary" color="success" size="small" />
                  ) : (
                    <Button size="small" variant="outlined" onClick={() => onPrimary(idx)}>
                      Set Primary
                    </Button>
                  )}

                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => handleRemove(img, idx)}
                    disabled={removingId != null}
                  >
                    Remove
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={mediaOpen} onClose={() => setMediaOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>Select media</DialogTitle>
        <DialogContent>
          <SellerMediaLibrary
            picker
            single={false}
            accept="image/*"
            title="Select product images"
            onSelect={(it) => { handleMediaSelect(it); setMediaOpen(false); }}
            onClose={() => setMediaOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default StepImages;

