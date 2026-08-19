import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  CircularProgress,
  Container,
  Typography,
  Chip,
  Collapse,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import FolderIcon from "@mui/icons-material/Folder";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "@mui/material";
import { tokens } from "../../../theme";
import { image_file_url } from "../../../api/config/index.jsx";
import { getCategoryWithAllChildren } from "../../../api/controller/admin_controller/category/category_controller";
import { fetchPublicStoreCategories } from "../../../api/controller/admin_controller/category/store_category_controller";
import { normalizeCategoryList } from "../../../utils/categoryTree";
import { categoryPath } from "../../../utils/productRoute";

const safeArray = (value) => (Array.isArray(value) ? value : []);

const buildImageUrl = (media) => {
  if (!media) return "";
  const base = String(image_file_url || "").replace(/\/+$/, "");
  if (typeof media === "object") {
    const direct = media?.url || media?.external_link;
    if (direct && /^https?:\/\//i.test(String(direct))) return String(direct);
    const fileName = media?.file_name || media?.file_original_name;
    if (fileName) {
      const path = String(fileName).replace(/^\/+/, "");
      return `${base}/${path}`;
    }
  }
  const raw = String(media);
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!base) return "";
  const path = raw.replace(/^\/+/, "");
  return `${base}/${path}`;
};

const hasImageValue = (media) => {
  if (!media) return false;
  if (typeof media === "object") {
    return Boolean(media.url || media.external_link || media.file_name || media.file_original_name);
  }
  return !/^\d+$/.test(String(media).trim());
};

const countAllDescendants = (children = []) => {
  let total = 0;
  for (const child of children) {
    total += 1;
    total += countAllDescendants(safeArray(child.children));
  }
  return total;
};

const SHOW_LIMIT = 5;

/**
 * A single subcategory column: bold heading + list of leaf children
 */
const SubCategoryColumn = ({ category, navigate, colors, storeSlug = "" }) => {
  const leaves = safeArray(category?.children);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? leaves : leaves.slice(0, SHOW_LIMIT);

  return (
    <Box sx={{ minWidth: 0 }}>
      {/* Subcategory heading */}
      <Typography
        variant="body2"
        onClick={() => category?.id && navigate(categoryPath(category.id, storeSlug))}
        sx={{
          fontWeight: 700,
          fontSize: "0.8rem",
          color: colors.gray[100],
          cursor: "pointer",
          mb: 0.75,
          lineHeight: 1.3,
          "&:hover": { color: colors.greenAccent?.[400] || "#56b3a0" },
        }}
      >
        {category?.name || "Unnamed"}
      </Typography>

      {/* Leaf items */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        {visible.map((leaf) => (
          <Typography
            key={leaf.id ?? leaf.name}
            variant="caption"
            onClick={() => leaf?.id && navigate(categoryPath(leaf.id, storeSlug))}
            sx={{
              fontSize: "0.74rem",
              color: colors.gray[400],
              cursor: "pointer",
              lineHeight: 1.5,
              "&:hover": {
                color: colors.greenAccent?.[400] || "#56b3a0",
                textDecoration: "underline",
              },
            }}
          >
            {leaf.name}
          </Typography>
        ))}

        {leaves.length > SHOW_LIMIT && (
          <Typography
            variant="caption"
            onClick={() => setShowAll((v) => !v)}
            sx={{
              fontSize: "0.72rem",
              color: colors.greenAccent?.[500] || colors.blueAccent?.[300] || "#56b3a0",
              cursor: "pointer",
              mt: 0.25,
              fontWeight: 600,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {showAll ? "Show less" : `More ${leaves.length - SHOW_LIMIT} ▸`}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

/**
 * Top-level category card with horizontal grid of subcategories
 */
const CategoryCard = ({ category, navigate, colors, storeSlug = "" }) => {
  const children = safeArray(category?.children);
  const totalDescendants = countAllDescendants(children);
  const banner = buildImageUrl(
    [category?.banner, category?.icon, category?.cover_image].find(hasImageValue)
  );
  const [expanded, setExpanded] = useState(true);

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: `1px solid ${colors.primary[300]}`,
        background: colors.primary[500],
        overflow: "hidden",
      }}
    >
      {/* Card header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 2.5,
          py: 1.75,
          borderBottom:
            expanded && children.length > 0
              ? `1px solid ${colors.primary[300]}`
              : "none",
          cursor: "pointer",
          "&:hover": { background: colors.primary[400] },
          transition: "background 0.15s",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Banner / icon */}
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            overflow: "hidden",
            flexShrink: 0,
            background: colors.primary[400],
            border: `1px solid ${colors.primary[300]}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {banner ? (
            <Box
              component="img"
              src={banner}
              alt={category?.name}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <FolderIcon sx={{ fontSize: 22, color: colors.gray[400] }} />
          )}
        </Box>

        {/* Name + chips */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: colors.gray[100],
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            onClick={(e) => {
              e.stopPropagation();
              category?.id && navigate(categoryPath(category.id, storeSlug));
            }}
          >
            {category?.name || "Category"}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.75, mt: 0.4, flexWrap: "wrap" }}>
            {children.length > 0 && (
              <Chip
                label={`${children.length} subcategories`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.63rem",
                  background: colors.primary[300],
                  color: colors.gray[300],
                  "& .MuiChip-label": { px: "6px" },
                }}
              />
            )}
            {totalDescendants > children.length && (
              <Chip
                label={`${totalDescendants} total`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.63rem",
                  background: colors.primary[300],
                  color: colors.gray[400],
                  "& .MuiChip-label": { px: "6px" },
                }}
              />
            )}
            {category?.featured === 1 && (
              <Chip
                label="Featured"
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.63rem",
                  background: colors.greenAccent?.[800] || "#1b4a3a",
                  color: colors.greenAccent?.[300] || "#4cceac",
                  "& .MuiChip-label": { px: "6px" },
                }}
              />
            )}
          </Box>
        </Box>

        {children.length > 0 && (
          <IconButton
            size="small"
            sx={{
              color: colors.gray[400],
              flexShrink: 0,
              "&:hover": { color: colors.gray[100] },
            }}
          >
            {expanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
        )}
      </Box>

      {/* ✅ Horizontal grid of subcategory columns */}
      {children.length > 0 && (
        <Collapse in={expanded} unmountOnExit>
          <Box
            sx={{
              px: 2.5,
              pt: 2,
              pb: 2.5,
              background: colors.primary[100],
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
                lg: "repeat(5, 1fr)",
              },
              gap: 2.5,
              columnGap: 3,
            }}
          >
            {children.map((child) => (
              <SubCategoryColumn
                key={child.id ?? child.name}
                category={child}
                navigate={navigate}
                colors={colors}
                storeSlug={storeSlug}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

// Stats bar
const StatsBar = ({ categories, colors }) => {
  const totalCats = categories.length;
  const totalChildren = categories.reduce(
    (sum, c) => sum + countAllDescendants(safeArray(c.children)),
    0
  );
  const featured = categories.filter((c) => c.featured === 1).length;

  const stats = [
    { label: "Root categories", value: totalCats },
    { label: "Total subcategories", value: totalChildren },
    { label: "Featured", value: featured },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 2,
        mb: 3,
      }}
    >
      {stats.map((s) => (
        <Box
          key={s.label}
          sx={{
            background: colors.primary[400],
            border: `1px solid ${colors.primary[300]}`,
            borderRadius: 2,
            px: 2,
            py: 1.5,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: colors.gray[100], lineHeight: 1 }}
          >
            {s.value}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: colors.gray[400], mt: 0.25, display: "block" }}
          >
            {s.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const AllCategory = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { slug } = useParams();
  const isStorefront = Boolean(slug);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = isStorefront
          ? await fetchPublicStoreCategories(slug)
          : await getCategoryWithAllChildren();
        const list = normalizeCategoryList(res);
        setCategories(list);
      } catch (e) {
        console.error("Failed to load categories", e);
        setError("Failed to load categories.");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isStorefront, slug]);

  const filterTree = useCallback((nodes, term) => {
    if (!term) return nodes;
    const lower = term.toLowerCase();

    const filterNode = (node) => {
      const match = node.name?.toLowerCase().includes(lower);
      const filteredChildren = filterList(safeArray(node.children));
      if (match || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };

    const filterList = (list) => list.map(filterNode).filter(Boolean);
    return filterList(nodes);
  }, []);

  const displayed = filterTree(categories, search.trim());

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 4,
        background: theme.palette.background?.default || colors.primary[500],
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.gray[100],
              letterSpacing: "-0.02em",
            }}
          >
            All Categories
          </Typography>
          <Typography variant="body2" sx={{ color: colors.gray[400], mt: 0.5 }}>
            Browse the full category hierarchy — expand any category to explore
            its subcategories.
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : (
          <>
            {categories.length > 0 && (
              <StatsBar categories={categories} colors={colors} />
            )}

            {/* Search */}
            <Box sx={{ mb: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                component="input"
                placeholder="Search categories…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  flex: 1,
                  maxWidth: 380,
                  height: 38,
                  px: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${colors.primary[300]}`,
                  background: colors.primary[400],
                  color: colors.gray[100],
                  fontSize: "0.85rem",
                  outline: "none",
                  "&::placeholder": { color: colors.gray[500] },
                  "&:focus": {
                    borderColor:
                      colors.greenAccent?.[500] || colors.gray[300],
                  },
                }}
              />
              {search && (
                <Typography variant="caption" sx={{ color: colors.gray[400] }}>
                  {displayed.length} result{displayed.length !== 1 ? "s" : ""}
                </Typography>
              )}
            </Box>

            {/* Category list — one card per root, full width */}
            {displayed.length === 0 ? (
              <Typography variant="body2" sx={{ color: colors.gray[400] }}>
                {search
                  ? "No categories match your search."
                  : "No categories found."}
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {displayed.map((category) => (
                  <CategoryCard
                    key={category.id ?? category.name}
                    category={category}
                    navigate={navigate}
                    colors={colors}
                    storeSlug={slug}
                  />
                ))}
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default AllCategory;
