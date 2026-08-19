import React, { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getProduct } from "../../../../api/controller/admin_controller/product/product_controller";
import { getCategoryInfo } from "../../../../api/controller/admin_controller/category/category_controller";
import FeaturedTitle from "./FeaturedTitle";
import SquareProductCard from "../../product/components/SquareProductCard";
import { categoryPath } from "../../../../utils/productRoute";

const safeArray = (x) => (Array.isArray(x) ? x : []);

export default function CategoryWiseProductHome({
	onView,
	category_id = "",
	categoryId = "",
	color = "#cfe1b8",
	title = "",
	storeParams = {},
}) {
	const theme = useTheme();
	const navigate = useNavigate();
	const upXl = useMediaQuery(theme.breakpoints.up("xl"));
	const upLg = useMediaQuery(theme.breakpoints.up("lg"));
	const upMd = useMediaQuery(theme.breakpoints.up("md"));
	const upSm = useMediaQuery(theme.breakpoints.up("sm"));
	const resolvedCategoryId = category_id || categoryId || "";
	const storeSlug = storeParams?.store_slug || "";

	const [loading, setLoading] = useState(false);
	const [items, setItems] = useState([]);
	const [startIndex, setStartIndex] = useState(0);
	const [categoryName, setCategoryName] = useState("");

	const perView = useMemo(() => {
		if (upXl) return 7;
		if (upLg) return 5;
		if (upMd) return 4;
		if (upSm) return 2;
		return 1;
	}, [upXl, upLg, upMd, upSm]);

	const maxIndex = Math.max(0, items.length - perView);

	useEffect(() => {
		let mounted = true;
		const load = async () => {
			if (!resolvedCategoryId) {
				if (mounted) setItems([]);
				return;
			}

			setLoading(true);
			try {
				const res = await getProduct({ page: 1, per_page: 12, category_id: resolvedCategoryId, ...storeParams });
				const payload = res?.data ?? res ?? {};
				const list = payload?.data ?? payload ?? [];
				if (mounted) setItems(safeArray(list));
			} catch (e) {
				console.error("loadCategoryProducts error:", e);
				if (mounted) setItems([]);
			} finally {
				if (mounted) setLoading(false);
			}
		};

		setStartIndex(0);
		load();
		return () => {
			mounted = false;
		};
	}, [resolvedCategoryId, storeParams]);

	useEffect(() => {
		let mounted = true;
		const loadCategory = async () => {
			if (!resolvedCategoryId) {
				if (mounted) setCategoryName("");
				return;
			}

			try {
				const res = await getCategoryInfo(resolvedCategoryId);
				const payload = res?.data ?? res ?? {};
				const name = payload?.name ?? payload?.data?.name ?? payload?.data?.data?.name ?? "";
				if (mounted) setCategoryName(String(name || ""));
			} catch (e) {
				if (mounted) setCategoryName("");
			}
		};

		loadCategory();
		return () => {
			mounted = false;
		};
	}, [resolvedCategoryId]);

	const content = useMemo(() => {
		if (loading) {
			return (
				<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
					<CircularProgress />
				</Box>
			);
		}

		if (!items.length) {
			return (
				<Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
					No products found for this category.
				</Typography>
			);
		}

		const slice = items.slice(startIndex, startIndex + perView);

		return (
			<Box sx={{ display: "grid", gap: 0.5, gridTemplateColumns: `repeat(${perView}, minmax(0, 1fr))` }}>
				{slice.map((product) => (
					<Box key={product.id} sx={{ minWidth: 0, display: "flex", justifyContent: "center" }}>
						<SquareProductCard product={product} onView={() => onView?.(product)} size={150} storeSlug={storeSlug} />
					</Box>
				))}
			</Box>
		);
	}, [items, loading, onView, perView, startIndex]);

	const handlePrev = () => {
		setStartIndex((prev) => Math.max(0, prev - perView));
	};

	const handleNext = () => {
		setStartIndex((prev) => Math.min(maxIndex, prev + perView));
	};

	const handleSeeAll = () => {
		navigate(categoryPath(resolvedCategoryId, storeSlug));
	};

	const displayTitle = title || (categoryName ? `${categoryName} Products` : "Featured Products");

	return (
		<Box
			sx={{
				mt: 3,
				p: { xs: 2, sm: 2.5 },
				borderRadius: 1,
				bgcolor: color,
				boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
			}}
		>
			<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1 }}>
				<FeaturedTitle>{displayTitle}</FeaturedTitle>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Typography
						variant="body2"
						sx={{ fontWeight: 700, cursor: "pointer" }}
						onClick={handleSeeAll}
					>
						See all
					</Typography>
					<IconButton size="small" onClick={handlePrev} disabled={startIndex === 0}>
						<ChevronLeft fontSize="small" />
					</IconButton>
					<IconButton size="small" onClick={handleNext} disabled={startIndex >= maxIndex}>
						<ChevronRight fontSize="small" />
					</IconButton>
				</Box>
			</Box>
			{content}
		</Box>
	);
}
