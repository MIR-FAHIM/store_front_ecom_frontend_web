import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Chip, CircularProgress, Pagination, Stack, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getProduct } from "../../../api/controller/admin_controller/product/product_controller";
import FeaturedTitle from "../home/components/FeaturedTitle";
import SmartProductCard from "../home/components/ProductCard";
import { productDetailPath } from "../../../utils/productRoute";

const safeArray = (x) => (Array.isArray(x) ? x : []);

const SearchedProductList = () => {
    const navigate = useNavigate();
    const { slug } = useParams();
    const [searchParams] = useSearchParams();

    const query = searchParams.get("q") || "";
    const categoryId = searchParams.get("category") || "";
    const brandId = searchParams.get("brand") || "";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const perPage = 24;

    const loadProducts = useCallback(async ({ search = "", category = "", brand = "", pg = 1 } = {}) => {
        setLoading(true);
        try {
            const params = { page: pg, per_page: perPage, search };
            if (category) params.category_id = category;
            if (brand) params.brand_id = brand;
            if (slug) params.store_slug = slug;

            const res = await getProduct(params);
            const payload = res?.data ?? res ?? {};
            const list = payload?.data ?? payload ?? [];
            setProducts(safeArray(list));
            setLastPage(Number(payload?.last_page || 1));
            setTotalProducts(Number(payload?.total || safeArray(list).length));
            setPage(Number(payload?.current_page || pg));
        } catch (e) {
            console.error("SearchedProductList load error:", e);
            setProducts([]);
            setLastPage(1);
            setTotalProducts(0);
        } finally {
            setLoading(false);
        }
    }, [perPage, slug]);

    // Load when URL params change
    useEffect(() => {
        setPage(1);
        loadProducts({ search: query, category: categoryId, brand: brandId, pg: 1 });
    }, [query, categoryId, brandId, loadProducts]);

    const handlePageChange = (_e, value) => {
        setPage(value);
        loadProducts({ search: query, category: categoryId, brand: brandId, pg: value });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <Box sx={{ my: 4, minHeight: "60vh" }}>
            {/* Search context header */}
            <Box sx={{ mb: 3 }}>
                {query ? (
                    <>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            <SearchIcon sx={{ fontSize: 28, opacity: 0.6 }} />
                            <FeaturedTitle mb={0}>
                                Search Results for "{query}"
                            </FeaturedTitle>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                {loading ? "Searching..." : `${totalProducts} product${totalProducts !== 1 ? "s" : ""} found`}
                            </Typography>
                            {categoryId && (
                                <Chip label={`Category: ${categoryId}`} size="small" onDelete={() => {
                                    const params = new URLSearchParams(searchParams);
                                    params.delete("category");
                                    navigate(`${slug ? `/store/${encodeURIComponent(String(slug))}/search` : "/search"}?${params.toString()}`);
                                }} />
                            )}
                            {brandId && (
                                <Chip label={`Brand: ${brandId}`} size="small" onDelete={() => {
                                    const params = new URLSearchParams(searchParams);
                                    params.delete("brand");
                                    navigate(`${slug ? `/store/${encodeURIComponent(String(slug))}/search` : "/search"}?${params.toString()}`);
                                }} />
                            )}
                        </Stack>
                    </>
                ) : (
                    <FeaturedTitle>All Products</FeaturedTitle>
                )}
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Box
                        sx={{
                            display: "grid",
                            gap: 2,
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, 1fr)",
                                md: "repeat(3, 1fr)",
                                lg: "repeat(6, 1fr)",
                            },
                        }}
                    >
                        {products.length === 0 ? (
                            <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 8 }}>
                                <SearchIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: "text.secondary", mb: 1 }}>
                                    No products found
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    Try a different search term or browse our categories.
                                </Typography>
                            </Box>
                        ) : (
                            products.map((product) => (
                                <SmartProductCard
                                    key={product.id}
                                    product={product}
                                    storeSlug={slug}
                                    onView={() => navigate(productDetailPath(product, slug))}
                                />
                            ))
                        )}
                    </Box>

                    {lastPage > 1 && (
                        <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
                            <Pagination
                                count={lastPage}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                shape="rounded"
                            />
                        </Stack>
                    )}
                </>
            )}
        </Box>
    );
};

export default SearchedProductList;
