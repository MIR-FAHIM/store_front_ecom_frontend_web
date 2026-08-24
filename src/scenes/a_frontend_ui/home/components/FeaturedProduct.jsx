import React, { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getFeaturedProduct } from "../../../../api/controller/admin_controller/product/product_controller";
import FeaturedTitle from "./FeaturedTitle";
import SquareProductCard from "../../../a_frontend_ui/product/components/SquareProductCard";

const safeArray = (x) => (Array.isArray(x) ? x : []);

export default function FeaturedProduct({ onView, storeParams = {} }) {
	const theme = useTheme();
	const navigate = useNavigate();
	const storeSlug = storeParams?.store_slug || "";
	const upXl = useMediaQuery(theme.breakpoints.up("xl"));
	const upLg = useMediaQuery(theme.breakpoints.up("lg"));
	const upMd = useMediaQuery(theme.breakpoints.up("md"));
	const upSm = useMediaQuery(theme.breakpoints.up("sm"));

	const [loading, setLoading] = useState(false);
	const [items, setItems] = useState([]);
	const [startIndex, setStartIndex] = useState(0);

	const perView = useMemo(() => {
		if (upXl) return 5;
		if (upLg) return 4;
		if (upMd) return 3;
		if (upSm) return 2;
		return 1;
	}, [upXl, upLg, upMd, upSm]);

	const maxIndex = Math.max(0, items.length - perView);

	useEffect(() => {
		let mounted = true;
		const load = async () => {
			setLoading(true);
			try {
				const res = await getFeaturedProduct({ page: 1, per_page: 12, ...storeParams });
				const list = res?.data?.data ?? res?.data ?? res ?? [];
				if (mounted) setItems(safeArray(list));
			} catch (e) {
				console.error("loadFeaturedProducts error:", e);
				if (mounted) setItems([]);
			} finally {
				if (mounted) setLoading(false);
			}
		};

		load();
		return () => {
			mounted = false;
		};
	}, [storeParams]);

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
					No featured products yet.
				</Typography>
			);
		}

		const slice = items.slice(startIndex, startIndex + perView);

		return (
			<Box sx={{ display: "grid", gap: 2, gridTemplateColumns: `repeat(${perView}, minmax(0, 1fr))` }}>
				{slice.map((product) => (
					<Box key={product.id} sx={{ minWidth: 0, display: "flex", justifyContent: "center" }}>
						<SquareProductCard product={product} onView={() => onView?.(product)} size={150} />
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
		navigate(storeSlug ? `/store/${encodeURIComponent(String(storeSlug))}/featured-products` : "/featured-products");
	};

	return (
		<Box
			sx={{
				mt: 3,
				p: { xs: 2, sm: 3 },
				borderRadius: 1,
				bgcolor: "#cfe1b8",
				boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
			}}
		>
			<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
				<FeaturedTitle>Featured Products</FeaturedTitle>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Typography
						variant="body2"
						sx={{ fontWeight: 600, cursor: "pointer", fontSize: 13, opacity: 0.7, "&:hover": { opacity: 1 } }}
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
