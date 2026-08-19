import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Container,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import { getCategory } from "../../../api/controller/admin_controller/product/setting_controller";
import { fetchPublicStoreCategories } from "../../../api/controller/admin_controller/category/store_category_controller";
import { normalizeCategoryList } from "../../../utils/categoryTree";
import Hero from "./components/Hero";
import CategoryGrid from "./components/CategoryGrid";
import FeaturedCategory from "./components/FeaturedCategory";
import FeaturedProduct from "./components/FeaturedProduct";
import CategoryWiseProductHome from "./components/category_wise_product_home";
import TodayDealProduct from "./components/TodayDealProduct";
import AllProduct from "./components/AllProduct";
import HomeShopList from "./components/HomeShopList";
import TodayDealBox from "./components/TodayDealBox";
import BannerRow from "./components/BannerRow";

import BestSellingProduct from "./components/BestSellingProduct";
import MobileHome from "./mobile_view_home/MobileHome";
import { productDetailPath } from "../../../utils/productRoute";

const safeArray = (x) => (Array.isArray(x) ? x : []);

const HomeP1 = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { slug } = useParams();
  const storeParams = useMemo(() => (slug ? { store_slug: slug } : {}), [slug]);
  const isStorefront = Boolean(slug);
  const productPath = useCallback((product) => productDetailPath(product, slug), [slug]);

  const pageBg = theme.palette.background?.default || "#fff";

  const categoryBlockColor =
    theme.palette.mode === "dark" ? "#2f3b2c" : "#cfe1b8";

  const [categories, setCategories] = useState([]);

  const loadCategories = useCallback(async () => {
    try {
      const c = isStorefront ? await fetchPublicStoreCategories(slug) : await getCategory(storeParams);
      const list = normalizeCategoryList(c);

      // Keep nested structure (top-level categories with `children` array)
      setCategories(safeArray(list));
    } catch (e) {
      console.error("loadCategories error:", e);
      setCategories([]);
    }
  }, [isStorefront, slug, storeParams]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  if (isMobile) {
    return <MobileHome storeParams={storeParams} isStorefront={isStorefront} />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: pageBg,
        backgroundImage:
          theme.palette.mode === "dark"
            ? `radial-gradient(1200px 700px at 10% 0%, rgba(251,239,118,0.10), transparent 55%),
               radial-gradient(1200px 700px at 90% 5%, rgba(250,92,92,0.10), transparent 55%),
               radial-gradient(1200px 700px at 50% 95%, rgba(254,194,136,0.08), transparent 55%)`
            : `radial-gradient(1200px 700px at 10% 0%, rgba(251,239,118,0.22), transparent 55%),
               radial-gradient(1200px 700px at 90% 5%, rgba(250,92,92,0.18), transparent 55%),
               radial-gradient(1200px 700px at 50% 95%, rgba(254,194,136,0.14), transparent 55%)`,
      }}
    >
      <Container sx={{ py: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2.5, md: 3 } }}>
          {isStorefront ? (
            <Chip
              label={`Storefront: ${slug}`}
              sx={{ alignSelf: "flex-start", borderRadius: 1, fontWeight: 900, bgcolor: "#eef2ff", color: "#3730a3" }}
            />
          ) : null}
          <Box
              sx={{
                display: "grid",
                gap: 2.5,
                gridTemplateColumns: {
                  md: "1.1fr 0.9fr",
                  lg: "1.35fr 0.65fr",
                },
                alignItems: "stretch",
              }}
            >
              <Box sx={{ height: { md: 520 } }}>
                <Hero storeParams={storeParams} />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, height: { md: 520 } }}>
                <Box sx={{ height: { md: 320 } }}>
                  {categories.length > 0 || !isStorefront ? <CategoryGrid categories={categories} storeSlug={slug} /> : null}
                </Box>
                <Box sx={{ height: { md: 180 } }}>
                  <TodayDealProduct
                    compact
                    title="Today Deals"
                    storeParams={storeParams}
                    onView={(product) => navigate(productPath(product))}
                  />
                </Box>
              </Box>
            </Box>
          {categories.length > 0 || !isStorefront ? <FeaturedCategory categories={categories} storeSlug={slug} /> : null}
           
       

        

          <Box
            sx={{
              display: "grid",
              gap: 2.5,
              gridTemplateColumns: {
                xs: "1fr",
                md: "2.8fr 0.8fr",
              },
              alignItems: "stretch",
            }}
          >
            <FeaturedProduct
              storeParams={storeParams}
              onView={(product) => navigate(productPath(product))}
            />
            <TodayDealBox storeParams={storeParams} onView={(product) => navigate(productPath(product))} />
          </Box>
          <BannerRow storeParams={storeParams} />
          <BestSellingProduct storeParams={storeParams} onView={(product) => navigate(productPath(product))} />
          <CategoryWiseProductHome
            onView={(product) => navigate(productPath(product))}
            category_id={4}
            color={"#ecddec"}
            storeParams={storeParams}
          
          />
          <CategoryWiseProductHome
            onView={(product) => navigate(productPath(product))}
            category_id={5}
            color={"#f5d9e4"}
            storeParams={storeParams}
          
          />
          {!isStorefront ? <HomeShopList /> : null}
          <AllProduct storeParams={storeParams} storeSlug={slug} />
        
        </Box>
      </Container>
    </Box>
  );
};

export default HomeP1;
