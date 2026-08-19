import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, Pagination, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getProduct } from "../../../../api/controller/admin_controller/product/product_controller";
import FeaturedTitle from "./FeaturedTitle";
import SmartProductCard from "./ProductCard";
import { productDetailPath } from "../../../../utils/productRoute";

const safeArray = (x) => (Array.isArray(x) ? x : []);

const AllProduct = ({ categoryId = "", storeParams = {}, storeSlug = "" }) => {
	const navigate = useNavigate();

	const allProductRef = React.useRef(null);

	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [query, setQuery] = useState("");
	const [page, setPage] = useState(1);
	const [lastPage, setLastPage] = useState(1);
	const [perPage, setPerPage] = useState(24);

	const loadProducts = useCallback(async ({ search = "", category = "", page = 1, per_page = 20 } = {}) => {
		setLoading(true);
		try {
			const res = await getProduct({ page, per_page, search, category_id: category, ...storeParams });
			const payload = res?.data ?? res ?? {};
			const list = payload?.data ?? payload ?? [];
			setProducts(safeArray(list));
			setLastPage(Number(payload?.last_page || 1));
			setPerPage(Number(payload?.per_page || per_page));
			setPage(Number(payload?.current_page || page));
		} catch (e) {
			console.error("AllProduct load error:", e);
			setProducts([]);
			setLastPage(1);
		} finally {
			setLoading(false);
		}
	}, [storeParams]);

	useEffect(() => {
		const handler = (e) => {
			const detail = (e?.detail || "").toString();
			setQuery(detail);
			setPage(1);
			loadProducts({ page: 1, per_page: perPage, search: detail, category: categoryId || "" });
		};
		window.addEventListener("search", handler);
		return () => window.removeEventListener("search", handler);
	}, [loadProducts, categoryId, perPage]);

	useEffect(() => {
		loadProducts({ page, per_page: perPage, search: query, category: categoryId || "" });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [categoryId, page]);

	const handlePageChange = (_e, value) => {
		const params = new URLSearchParams();
		if (value > 1) params.set("page", value);
		if (query) params.set("search", query);
		const qs = params.toString();
		navigate(`${storeSlug ? `/store/${encodeURIComponent(String(storeSlug))}` : "/all-products"}${qs ? `?${qs}` : ""}`);
	};

	const list = useMemo(() => products, [products]);

	return (
		<Box sx={{ my: 4 }}>
			<div ref={allProductRef} />
			<Box id="all-products">
				<FeaturedTitle>All Products</FeaturedTitle>
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
						{list.length === 0 ? (
							<Box sx={{ gridColumn: "1 / -1" }}>
								<Typography variant="h6" align="center" sx={{ py: 6, fontWeight: 600, color: "text.secondary" }}>
									No products found.
								</Typography>
							</Box>
						) : (
							list.map((product) => (
								<SmartProductCard
									key={product.id}
									product={product}
									storeSlug={storeSlug}
									onView={() => navigate(productDetailPath(product, storeSlug))}
								/>
							))
						)}
					</Box>

					{lastPage > 1 ? (
						<Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
							<Pagination
								count={lastPage}
								page={page}
								onChange={handlePageChange}
								color="primary"
								shape="rounded"
							/>
						</Stack>
					) : null}
				</>
			)}
		</Box>
	);
};

export default AllProduct;
