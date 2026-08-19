import React, { useMemo, useRef, useState } from "react";
import { Box, Button, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { image_file_url } from "../../../../api/config";
import { categoriesPath, categoryPath } from "../../../../utils/productRoute";

const resolveCategoryImage = (cat) => {
  const media = cat?.banner || cat?.cover_image ||  cat?.icon;
  if (!media) return "/assets/images/placeholder.png";

  if (typeof media === "object") {
    const direct = media.url || media.external_link;
    if (direct && /^https?:\/\//i.test(String(direct))) return String(direct);

    const fileName = media.file_name || media.file_original_name;
    if (fileName) {
      return `${String(image_file_url || "").replace(/\/+$/, "")}/${String(fileName).replace(/^\/+/, "")}`;
    }
  }

  const raw = String(media);
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^\d+$/.test(raw.trim())) return "/assets/images/placeholder.png";
  return `${String(image_file_url || "").replace(/\/+$/, "")}/${raw.replace(/^\/+/, "")}`;
};

export default function FeaturedCategory({ categories = [], storeSlug = "" }) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [scrollState, setScrollState] = useState({ canLeft: false, canRight: false });

  const items = useMemo(() => categories.slice(0, 10), [categories]);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setScrollState({
      canLeft: el.scrollLeft > 4,
      canRight: el.scrollLeft < maxScroll - 4,
    });
  };

  const handleScroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(isXs ? 180 : 260, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <Box
      sx={{
        mt: 3,
        borderRadius: 1,
        p: { xs: 2, sm: 2.5 },
        background: "linear-gradient(90deg, rgba(210,236,255,0.9), rgba(220,243,255,0.6))",
        border: `1px solid ${theme.palette.primary.main}`,
        boxShadow: "0 14px 28px rgba(0,0,0,0.06)",
        display: "grid",
        gap: 2.5,
        gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
        alignItems: "center",
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Featured Categories
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }}>
          Categories catching eyes and winning hearts across our marketplace
        </Typography>
        <Button
          variant="contained"
          size="small"
          sx={{ mt: 2, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          onClick={() => navigate(categoriesPath(storeSlug))}
        >
          All categories
        </Button>
      </Box>

      <Box sx={{ position: "relative" }}>
        {isXs ? (
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            }}
          >
            {items.map((cat) => (
              <Box
                key={cat.id}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                }}
                onClick={() => navigate(categoryPath(cat.id, storeSlug))}
              >
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: 2,
                    backgroundImage: `url("${resolveCategoryImage(cat)}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
                    bgcolor: "#fff",
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 700, maxWidth: 120, textAlign: "center" }} noWrap>
                  {cat.name}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <>
            <IconButton
              size="small"
              onClick={() => handleScroll("left")}
              disabled={!scrollState.canLeft}
              sx={{
                position: "absolute",
                left: -20,
                top: "50%",
                transform: "translateY(-50%)",
                bgcolor: "#fff",
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
                zIndex: 2,
                display: { xs: "none", md: "flex" },
              }}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>

            <Box
              ref={scrollRef}
              onScroll={updateScrollState}
              onMouseEnter={updateScrollState}
              sx={{
                display: "flex",
                gap: { xs: 1.5, sm: 2 },
                overflowX: "auto",
                pb: 1,
                pr: 2,
                pl: { xs: 0.5, sm: 0 },
                scrollSnapType: "x mandatory",
                "& > *": { scrollSnapAlign: "start" },
                msOverflowStyle: "none",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {items.map((cat) => (
                <Box
                  key={cat.id}
                  sx={{
                    flex: { xs: "0 0 44%", sm: "0 0 32%", md: "0 0 calc((100% - 120px) / 7)" },
                    minWidth: { xs: 140, sm: 150, md: 0 },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(categoryPath(cat.id, storeSlug))}
                >
                  <Box
                    sx={{
                      width: { xs: 90, sm: 100, md: 110 },
                      height: { xs: 90, sm: 100, md: 110 },
                      borderRadius: 1,
                      backgroundImage: `url("${resolveCategoryImage(cat)}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
                      bgcolor: "#fff",
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700, maxWidth: 120, textAlign: "center" }} noWrap>
                    {cat.name}
                  </Typography>
                </Box>
              ))}
            </Box>

            <IconButton
              size="small"
              onClick={() => handleScroll("right")}
              disabled={!scrollState.canRight}
              sx={{
                position: "absolute",
                right: -6,
                top: "50%",
                transform: "translateY(-50%)",
                bgcolor: "#fff",
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
                zIndex: 2,
                display: { xs: "none", md: "flex" },
              }}
            >
              <ChevronRight fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>
    </Box>
  );
}
