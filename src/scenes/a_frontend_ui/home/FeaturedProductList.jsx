import React, { useCallback, useEffect, useState } from "react";
import { Box, CircularProgress, Pagination, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { getFeaturedProduct } from "../../../api/controller/admin_controller/product/product_controller";
import FeaturedTitle from "./components/FeaturedTitle";
import SmartProductCard from "./components/ProductCard";
import { productDetailPath } from "../../../utils/productRoute";

const safeArray = (x) => (Array.isArray(x) ? x : []);

const FeaturedProductList = () => {
	const navigate = useNavigate();
	const { slug } = useParams();
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [lastPage, setLastPage] = useState(1);
	const [totalProducts, setTotalProducts] = useState(0);
	const perPage = 24;

	const loadProducts = useCallback(async (pg = 1) => {
		setLoading(true);
		try {
			const res = await getFeaturedProduct({ page: pg, per_page: perPage, ...(slug ? { store_slug: slug } : {}) });
			const payload = res?.data ?? res ?? {};
			const list = payload?.data ?? payload ?? [];
			setProducts(safeArray(list));
			setLastPage(Number(payload?.last_page || 1));
			setTotalProducts(Number(payload?.total || safeArray(list).length));
			setPage(Number(payload?.current_page || pg));
		} catch (e) {
			console.error("FeaturedProductList load error:", e);
			setProducts([]);
			setLastPage(1);
			setTotalProducts(0);
		} finally {
			setLoading(false);
		}
	}, [perPage, slug]);

	useEffect(() => {
		loadProducts(1);
	}, [loadProducts]);

	const handlePageChange = (_e, value) => {
		setPage(value);
		loadProducts(value);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<Box sx={{ my: 4, minHeight: "60vh" }}>
			<Box sx={{ mb: 3 }}>
				<FeaturedTitle>Featured Products</FeaturedTitle>
				<Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
					{loading ? "Loading featured products..." : `${totalProducts} product${totalProducts !== 1 ? "s" : ""}`}
				</Typography>
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
								<Typography variant="h6" sx={{ fontWeight: 600, color: "text.secondary", mb: 1 }}>
									No featured products found.
								</Typography>
								<Typography variant="body2" sx={{ color: "text.secondary" }}>
									Please check back later.
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

export default FeaturedProductList;
