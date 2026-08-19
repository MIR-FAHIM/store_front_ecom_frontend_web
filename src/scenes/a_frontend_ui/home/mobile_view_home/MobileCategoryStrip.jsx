import React, { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { image_file_url } from "../../../../api/config";
import { categoriesPath, categoryPath } from "../../../../utils/productRoute";

const resolveCategoryImage = (cat) => {
  if (cat?.banner?.url) return cat.banner.url;
  if (cat?.banner?.file_name) return `${image_file_url}/${cat.banner.file_name}`;
  if (cat?.cover_image) return `${image_file_url}/${cat.cover_image}`;
  return null;
};

// Gradient fallbacks when no image
const GRADIENTS = [
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#fccb90,#d57eeb)",
  "linear-gradient(135deg,#a1c4fd,#c2e9fb)",
  "linear-gradient(135deg,#fd7043,#ffb300)",
];

function CategoryBubble({ cat, index, storeSlug = "" }) {
  const navigate = useNavigate();
  const img = useMemo(() => resolveCategoryImage(cat), [cat]);
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <Box
      onClick={() => navigate(categoryPath(cat.id, storeSlug))}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.6,
        cursor: "pointer",
        flexShrink: 0,
        width: 68,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: img ? `url("${img}") center/cover no-repeat` : gradient,
          boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
          transition: "transform 0.18s ease",
          "&:active": { transform: "scale(0.93)" },
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontSize: 10,
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: 64,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          color: "text.primary",
        }}
      >
        {cat.name}
      </Typography>
    </Box>
  );
}

export default function MobileCategoryStrip({ categories = [], storeSlug = "" }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const items = useMemo(() => categories.slice(0, 12), [categories]);

  if (!items.length) return null;

  return (
    <Box sx={{ px: 1.5, py: 0.5 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700} fontSize={13}>
          Shop by Category
        </Typography>
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{ color: "primary.main", cursor: "pointer" }}
          onClick={() => navigate(categoriesPath(storeSlug))}
        >
          See all
        </Typography>
      </Box>

      {/* Scrollable strip */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          overflowX: "auto",
          pb: 0.5,
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {items.map((cat, i) => (
          <CategoryBubble key={cat.id} cat={cat} index={i} storeSlug={storeSlug} />
        ))}
      </Box>
    </Box>
  );
}
