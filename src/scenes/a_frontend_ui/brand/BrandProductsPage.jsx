import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	Alert,
	Box,
	Breadcrumbs,
	CircularProgress,
	Container,
	Divider,
	InputAdornment,
	Link,
	Pagination,
	Snackbar,
	Stack,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { getBrandDetails } from "../../../api/controller/admin_controller/brand/brand_controller";
import { getProductsByBrand } from "../../../api/controller/admin_controller/product/product_controller";
import SmartProductCard from "../home/components/ProductCard";
import { productDetailPath, storeHomePath, storeScopedPath } from "../../../utils/productRoute";

const PER_PAGE = 20;
const safeArray = (value) => (Array.isArray(value) ? value : []);

const normalizePaginator = (response) => {
	const payload = response?.data ?? response ?? {};
	const paginator = Array.isArray(payload?.data)
		? payload
		: Array.isArray(payload?.data?.data)
			? payload.data
			: payload;

	return {
		rows: safeArray(paginator?.data),
		currentPage: Number(paginator?.current_page || 1),
		lastPage: Number(paginator?.last_page || 1),
		perPage: Number(paginator?.per_page || PER_PAGE),
		total: Number(paginator?.total || 0),
	};
};

const normalizeBrand = (response) => {
	const data = response?.data?.brand || response?.data || response?.brand || response;
	return data?.id ? data : null;
};

const BrandProductsPage = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { brandId, slug } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();

	const pageParam = Number(searchParams.get("page") || 1);
	const searchParam = searchParams.get("search") || "";

	const [brand, setBrand] = useState(null);
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [brandLoading, setBrandLoading] = useState(false);
	const [total, setTotal] = useState(0);
	const [lastPage, setLastPage] = useState(1);
	const [currentPage, setCurrentPage] = useState(pageParam);
	const [searchInput, setSearchInput] = useState(searchParam);
	const [searchQuery, setSearchQuery] = useState(searchParam);
	const [snack, setSnack] = useState({ open: false, message: "", severity: "error" });

	const loadBrand = useCallback(async () => {
		if (!brandId) return;
		setBrandLoading(true);
		try {
			const response = await getBrandDetails(brandId);
			setBrand(normalizeBrand(response));
		} catch (error) {
			setBrand(null);
		} finally {
			setBrandLoading(false);
		}
	}, [brandId]);

	const loadProducts = useCallback(async (page, search) => {
		if (!brandId) return;
		setLoading(true);
		try {
			const response = await getProductsByBrand(brandId, {
				page,
				per_page: PER_PAGE,
				search,
				...(slug ? { store_slug: slug } : {}),
			});

			if (response?.status === "failed" || response?.status === "error") {
				setProducts([]);
				setSnack({
					open: true,
					message: response?.message || "Brand products fetch failed",
					severity: "error",
				});
				return;
			}

			const normalized = normalizePaginator(response);
			setProducts(normalized.rows);
			setCurrentPage(normalized.currentPage || page);
			setLastPage(normalized.lastPage);
			setTotal(normalized.total);
		} catch (error) {
			setProducts([]);
			setLastPage(1);
			setSnack({
				open: true,
				message: error?.response?.data?.message || "Brand products fetch failed",
				severity: "error",
			});
		} finally {
			setLoading(false);
		}
	}, [brandId, slug]);

	useEffect(() => {
		loadBrand();
	}, [loadBrand]);

	useEffect(() => {
		setCurrentPage(pageParam);
		setSearchQuery(searchParam);
		setSearchInput(searchParam);
		loadProducts(pageParam, searchParam);
	}, [pageParam, searchParam, loadProducts]);

	const handlePageChange = (_event, value) => {
		const params = {};
		if (value > 1) params.page = value;
		if (searchQuery) params.search = searchQuery;
		setSearchParams(params);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleSearchKeyDown = (event) => {
		if (event.key !== "Enter") return;
		const params = {};
		const value = searchInput.trim();
		if (value) params.search = value;
		setSearchParams(params);
	};

	const list = useMemo(() => products, [products]);
	const isDark = theme.palette.mode === "dark";
	const brandName = brand?.name || (brandLoading ? "Loading brand..." : "Selected Brand");

	return (
		<Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 8 }}>
			<Box
				sx={{
					background: isDark
						? "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
						: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
					py: { xs: 4, md: 6 },
					px: 2,
					mb: 4,
				}}
			>
				<Container maxWidth="xl">
					<Breadcrumbs sx={{ mb: 2, "& .MuiBreadcrumbs-separator": { color: "rgba(255,255,255,0.5)" } }}>
						<Link href={storeHomePath(slug)} underline="hover" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
							<HomeOutlinedIcon sx={{ fontSize: 16 }} />
							Home
						</Link>
						<Link href={storeScopedPath("/brands", slug)} underline="hover" sx={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
							Brands
						</Link>
						<Typography sx={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
							Products
						</Typography>
					</Breadcrumbs>

					<Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={2}>
						<Box>
							<Stack direction="row" alignItems="center" spacing={1.5}>
								<LocalOfferOutlinedIcon sx={{ color: "#fff", fontSize: 32 }} />
								<Typography variant="h4" fontWeight={800} color="#fff" lineHeight={1.2}>
									Products by Brand
								</Typography>
							</Stack>
							<Typography sx={{ color: "rgba(255,255,255,0.78)", mt: 0.5, fontSize: 14 }}>
								{brandName}{!loading && total > 0 ? ` • ${total.toLocaleString()} products` : ""}
							</Typography>
						</Box>

						<TextField
							placeholder="Search products..."
							size="small"
							value={searchInput}
							onChange={(event) => setSearchInput(event.target.value)}
							onKeyDown={handleSearchKeyDown}
							sx={{
								minWidth: { xs: "100%", sm: 280 },
								"& .MuiOutlinedInput-root": {
									bgcolor: "rgba(255,255,255,0.15)",
									borderRadius: 3,
									color: "#fff",
									"& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
									"&:hover fieldset": { borderColor: "rgba(255,255,255,0.6)" },
									"&.Mui-focused fieldset": { borderColor: "#fff" },
								},
								"& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.6)" },
							}}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchOutlinedIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: 20 }} />
									</InputAdornment>
								),
							}}
						/>
					</Stack>
				</Container>
			</Box>

			<Container maxWidth="xl">
				{searchQuery && (
					<Box sx={{ mb: 3 }}>
						<Typography variant="body2" color="text.secondary">
							Showing results for <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>"{searchQuery}"</Box>
						</Typography>
						<Divider sx={{ mt: 1 }} />
					</Box>
				)}

				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
						<CircularProgress size={48} />
					</Box>
				) : list.length === 0 ? (
					<Box sx={{ textAlign: "center", py: 12 }}>
						<Typography variant="h6" fontWeight={700} color="text.secondary">
							No products found for this brand.
						</Typography>
						{searchQuery && (
							<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
								Try a different search term.
							</Typography>
						)}
					</Box>
				) : (
					<>
						<Box
							sx={{
								display: "grid",
								gap: 2,
								gridTemplateColumns: {
									xs: "repeat(2, 1fr)",
									sm: "repeat(3, 1fr)",
									md: "repeat(4, 1fr)",
									lg: "repeat(5, 1fr)",
								},
							}}
						>
							{list.map((product) => (
								<SmartProductCard
									key={product.id}
									product={product}
									storeSlug={slug}
									onView={() => navigate(productDetailPath(product, slug))}
								/>
							))}
						</Box>

						{lastPage > 1 && (
							<Stack direction="row" justifyContent="center" alignItems="center" spacing={2} sx={{ mt: 6 }}>
								<Typography variant="body2" color="text.secondary">
									Page {currentPage} of {lastPage}
								</Typography>
								<Pagination
									count={lastPage}
									page={currentPage}
									onChange={handlePageChange}
									color="primary"
									shape="rounded"
									showFirstButton
									showLastButton
								/>
							</Stack>
						)}
					</>
				)}
			</Container>

			<Snackbar
				open={snack.open}
				autoHideDuration={3500}
				onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			>
				<Alert severity={snack.severity} onClose={() => setSnack((prev) => ({ ...prev, open: false }))}>
					{snack.message}
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default BrandProductsPage;
