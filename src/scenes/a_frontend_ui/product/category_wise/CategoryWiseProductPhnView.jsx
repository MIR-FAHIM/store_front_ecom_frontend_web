import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SmartProductCard from "../../home/components/ProductCard";
import { productDetailPath } from "../../../../utils/productRoute";

const safeArray = (x) => (Array.isArray(x) ? x : []);

function CategoryWiseProductPhnView({
  theme,
  colors,
  pageBg,
  title,
  category,
  children = [],
  childrenByParent = {},
  selectedSubId,
  handleSelectSubCategory,
  products = [],
  loading,
  error,
  navigate,
  pagination,
  page,
  handlePageChange,
  storeSlug = "",
}) {
  const border = theme.palette.divider || colors.primary[200];
  const panelBg = colors.primary[400];
  const softBg = colors.primary[300];
  const [categoriesExpanded, setCategoriesExpanded] = React.useState(false);
  const [expandedParentId, setExpandedParentId] = React.useState(null);
  const isSelected = (value) => String(selectedSubId || "") === String(value || "");

  React.useEffect(() => {
    if (!selectedSubId) {
      setExpandedParentId(null);
      return;
    }

    setCategoriesExpanded(true);

    const activeParent = children.find((child) => String(child?.id) === String(selectedSubId));

    if (activeParent && safeArray(childrenByParent?.[activeParent.id]).length) {
      setExpandedParentId(String(activeParent.id));
      return;
    }

    const parentWithSelectedChild = children.find((child) =>
      safeArray(childrenByParent?.[child?.id]).some((nestedChild) => String(nestedChild?.id) === String(selectedSubId))
    );

    setExpandedParentId(parentWithSelectedChild ? String(parentWithSelectedChild.id) : null);
  }, [children, childrenByParent, selectedSubId]);

  const handleCategorySelect = (value, parentId = null) => {
    handleSelectSubCategory(String(value ?? ""));
    setCategoriesExpanded(true);
    setExpandedParentId(parentId ? String(parentId) : null);
  };

  const categoryButtonSx = (active) => ({
    border: `1px solid ${active ? theme.palette.primary.main : border}`,
    borderRadius: 1.5,
    background: active ? theme.palette.primary.main : panelBg,
    color: active ? theme.palette.primary.contrastText : "inherit",
    cursor: "pointer",
    font: "inherit",
    minHeight: 38,
    px: 1.25,
    py: 0.8,
    textAlign: "left",
    width: "100%",
    "&:hover": {
      background: active ? theme.palette.primary.dark : theme.palette.action.hover,
    },
  });

  return (
    <Box sx={{ minHeight: "100vh", background: pageBg, py: 2 }}>
      <Container maxWidth="sm">
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Browse products from this category.
          </Typography>
        </Box>

        <Accordion
          disableGutters
          expanded={categoriesExpanded}
          onChange={(_, isExpanded) => setCategoriesExpanded(isExpanded)}
          sx={{
            mb: 2,
            border: `1px solid ${border}`,
            borderRadius: 2,
            background: panelBg,
            overflow: "hidden",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>{category?.name || "Categories"}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Stack spacing={1.25}>
              <Box
                component="button"
                type="button"
                onClick={() => handleCategorySelect("", null)}
                sx={categoryButtonSx(!selectedSubId)}
              >
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  All {category?.name || "Products"}
                </Typography>
              </Box>

              {children.map((child) => {
                const nestedChildren = safeArray(childrenByParent?.[child?.id]);
                const parentActive =
                  isSelected(child?.id) || nestedChildren.some((nestedChild) => isSelected(nestedChild?.id));

                if (!nestedChildren.length) {
                  return (
                    <Box
                      key={child?.id}
                      component="button"
                      type="button"
                      onClick={() => handleCategorySelect(child?.id, child?.id)}
                      sx={categoryButtonSx(parentActive)}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {child?.name || "Unnamed"}
                      </Typography>
                    </Box>
                  );
                }

                return (
                  <Accordion
                    key={child?.id}
                    disableGutters
                    expanded={expandedParentId === String(child?.id)}
                    onChange={(_, isExpanded) => setExpandedParentId(isExpanded ? String(child?.id) : null)}
                    sx={{
                      border: `1px solid ${parentActive ? theme.palette.primary.main : border}`,
                      borderRadius: 1.5,
                      background: parentActive ? theme.palette.action.selected : softBg,
                      boxShadow: "none",
                      overflow: "hidden",
                      "&:before": { display: "none" },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                        {child?.name || "Unnamed"}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Stack spacing={1}>
                        <Box
                          component="button"
                          type="button"
                          onClick={() => handleCategorySelect(child?.id, child?.id)}
                          sx={categoryButtonSx(isSelected(child?.id))}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            All {child?.name || "Products"}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                          {nestedChildren.map((nestedChild) => (
                            <Box
                              key={nestedChild?.id}
                              component="button"
                              type="button"
                              onClick={() => handleCategorySelect(nestedChild?.id, child?.id)}
                              sx={categoryButtonSx(isSelected(nestedChild?.id))}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 400,
                                  lineHeight: 1.25,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {nestedChild?.name || "Unnamed"}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              {error || "No products found."}
            </Typography>
            <Button variant="contained" onClick={() => navigate(storeSlug ? `/store/${encodeURIComponent(String(storeSlug))}` : "/")} sx={{ textTransform: "none", fontWeight: 700 }}>
              Back to home
            </Button>
          </Box>
        ) : (
          <>
            <Grid container spacing={1.5}>
              {products.map((product, index) => (
                <Grid key={product?.id ?? product?.product_id ?? index} item xs={6}>
                  <SmartProductCard product={product} storeSlug={storeSlug} onView={(p) => navigate(productDetailPath(p, storeSlug))} />
                </Grid>
              ))}
            </Grid>

            {pagination.last_page > 1 ? (
              <Stack alignItems="center" sx={{ mt: 3 }}>
                <Pagination count={pagination.last_page} page={page} onChange={handlePageChange} color="primary" size="small" />
              </Stack>
            ) : null}
          </>
        )}
      </Container>
    </Box>
  );
}

export default CategoryWiseProductPhnView;
