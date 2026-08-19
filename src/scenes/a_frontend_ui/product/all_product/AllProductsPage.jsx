import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	Box,
	Breadcrumbs,
	CircularProgress,
	Container,
	Divider,
	InputAdornment,
	Link,
	Pagination,
	Stack,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { getProduct } from "../../../../api/controller/admin_controller/product/product_controller";
import SmartProductCard from "../../home/components/ProductCard";
import { productDetailPath, storeHomePath } from "../../../../utils/productRoute";

const safeArray = (x) => (Array.isArray(x) ? x : []);
const PER_PAGE = 24;

const AllProductsPage = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { slug } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();

	const pageParam = Number(searchParams.get("page") || 1);
	const searchParam = searchParams.get("search") || "";

	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [total, setTotal] = useState(0);
	const [lastPage, setLastPage] = useState(1);
	const [currentPage, setCurrentPage] = useState(pageParam);
	const [searchInput, setSearchInput] = useState(searchParam);
	const [searchQuery, setSearchQuery] = useState(searchParam);

	const loadProducts = useCallback(async (page, search) => {
		setLoading(true);
		try {
			const res = await getProduct({ page, per_page: PER_PAGE, search, ...(slug ? { store_slug: slug } : {}) });
			const payload = res?.data ?? res ?? {};
			const list = payload?.data ?? payload ?? [];
			setProducts(safeArray(list));
			setLastPage(Number(payload?.last_page || 1));
			setTotal(Number(payload?.total || 0));
			setCurrentPage(Number(payload?.current_page || page));
		} catch (e) {
			console.error("AllProductsPage load error:", e);
			setProducts([]);
			setLastPage(1);
		} finally {
			setLoading(false);
		}
	}, [slug]);

	// Sync URL params → local state and load on mount / param changes
	useEffect(() => {
		setCurrentPage(pageParam);
		setSearchQuery(searchParam);
		setSearchInput(searchParam);
		loadProducts(pageParam, searchParam);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageParam, searchParam]);

	const handlePageChange = (_e, value) => {
		const params = {};
		if (value > 1) params.page = value;
		if (searchQuery) params.search = searchQuery;
		setSearchParams(params);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleSearchKeyDown = (e) => {
		if (e.key === "Enter") {
			const params = {};
			if (searchInput.trim()) params.search = searchInput.trim();
			setSearchParams(params);
		}
	};

	const list = useMemo(() => products, [products]);

	const isDark = theme.palette.mode === "dark";
	const subtleText = theme.palette.text.secondary;

	return (
		<Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 8 }}>
			{/* ── Page Header ── */}
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
					{/* Breadcrumbs */}
					<Breadcrumbs
						sx={{ mb: 2, "& .MuiBreadcrumbs-separator": { color: "rgba(255,255,255,0.5)" } }}
					>
						<Link
							href={storeHomePath(slug)}
							underline="hover"
							sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "rgba(255,255,255,0.7)", fontSize: 14 }}
						>
							<HomeOutlinedIcon sx={{ fontSize: 16 }} />
							Home
						</Link>
						<Typography sx={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
							All Products
						</Typography>
					</Breadcrumbs>

					{/* Title + count row */}
					<Stack
						direction={{ xs: "column", sm: "row" }}
						alignItems={{ xs: "flex-start", sm: "center" }}
						justifyContent="space-between"
						spacing={2}
					>
						<Box>
							<Stack direction="row" alignItems="center" spacing={1.5}>
								<GridViewOutlinedIcon sx={{ color: "#fff", fontSize: 32 }} />
								<Typography variant="h4" fontWeight={800} color="#fff" lineHeight={1.2}>
									All Products
								</Typography>
							</Stack>
							{!loading && total > 0 && (
								<Typography sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5, fontSize: 14 }}>
									{total.toLocaleString()} products available
								</Typography>
							)}
						</Box>

						{/* Search */}
						<TextField
							placeholder="Search products…"
							size="small"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
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

			{/* ── Product Grid ── */}
			<Container maxWidth="xl">
				{/* Active search label */}
				{searchQuery && (
					<Box sx={{ mb: 3 }}>
						<Typography variant="body2" color={subtleText}>
							Showing results for{" "}
							<Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
								"{searchQuery}"
							</Box>
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
						<Typography variant="h6" fontWeight={600} color="text.secondary">
							No products found.
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
									lg: "repeat(6, 1fr)",
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

						{/* Pagination */}
						{lastPage > 1 && (
							<Stack
								direction="row"
								justifyContent="center"
								alignItems="center"
								spacing={2}
								sx={{ mt: 6 }}
							>
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
									siblingCount={1}
									sx={{
										"& .MuiPaginationItem-root": {
											borderRadius: 2,
											fontWeight: 600,
										},
									}}
								/>
							</Stack>
						)}
					</>
				)}
			</Container>
		</Box>
	);
};

export default AllProductsPage;
