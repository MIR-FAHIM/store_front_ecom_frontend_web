import React, { useEffect, useMemo, useState } from "react";
import {
	Box,
	Card,
	CardContent,
	Typography,
	CircularProgress,
	Stack,
	useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { getRelatedProducts, getSellerFeaturedByProduct } from "../../../../api/controller/admin_controller/product/product_varient_controller";
import { image_file_url } from "../../../../api/config";
import { tokens } from "../../../../theme";
import { productDetailPath } from "../../../../utils/productRoute";

const safeArray = (x) => (Array.isArray(x) ? x : []);

  const getPrimaryImage = (product) => {
	const imgPath =
	  product?.primary_image?.file_name ;

	if (imgPath) return `${image_file_url}/${imgPath}`;
	return "https://placehold.co/600x400";
  };

const RelatedProduct = ({ productId, storeSlug = "" }) => {
	const theme = useTheme();
	const navigate = useNavigate();

	const colors = tokens(theme.palette.mode);
	const border = theme.palette.divider || colors.primary[200];
	const surface = colors.primary[400];
	const surface2 = colors.primary[300];
	const ink = colors.gray[100];
	const subInk = colors.gray[300];

	const [loading, setLoading] = useState(false);
	const [items, setItems] = useState([]);

	// Discount calculation helpers (from HorizontalProductCard)
	const getDiscountInfo = (product) => {
		const pd = product?.product_discount;
		if (pd) {
			const d = Number(pd.discount ?? 0);
			if (d > 0) {
				return { amount: d, type: String(pd.discount_type ?? "").toLowerCase() };
			}
		}
		const d = Number(product?.discount ?? 0);
		if (d <= 0) return null;
		const type = String(product?.discount_type ?? "").toLowerCase();
		return { amount: d, type };
	};

	const getPrice = (product) => Number(product?.unit_price ?? product?.price ?? 0);
	const getSalePrice = (product, price, discountInfo) => {
		const s = Number(product?.sale_price ?? 0);
		if (s > 0) return s;
		if (discountInfo && price > 0) {
			if (discountInfo.type === "percent") return Math.round(price - (price * discountInfo.amount) / 100);
			const flat = price - discountInfo.amount;
			return flat > 0 ? flat : 0;
		}
		return 0;
	};
	const getDiscountLabel = (discountInfo, hasSale, price, salePrice) => {
		if (discountInfo) {
			if (discountInfo.type === "percent") return `${discountInfo.amount}% OFF`;
			return `${money(discountInfo.amount)} OFF`;
		}
		if (hasSale && price > 0) {
			const pct = Math.round(((price - salePrice) / price) * 100);
			return pct > 0 ? `${pct}% OFF` : null;
		}
		return null;
	};

	useEffect(() => {
		if (!productId) return;
		let mounted = true;

		const load = async () => {
			setLoading(true);
			try {
				const res = await getSellerFeaturedByProduct(productId, storeSlug ? { store_slug: storeSlug } : {});
				// API returns { status, message, data: [products] }
				const products = safeArray(res?.data);
				if (mounted) setItems(products);
			} catch (e) {
				console.error("RelatedProduct error:", e);
				if (mounted) setItems([]);
			} finally {
				if (mounted) setLoading(false);
			}
		};

		load();
		return () => {
			mounted = false;
		};
	}, [productId, storeSlug]);

	const money = useMemo(
		() => (n) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(Number(n || 0)),
		[]
	);

	return (
		<Card
			sx={{
				borderRadius: 1,
				border: `1px solid ${border}`,
				background: surface,
			}}
		>
			<CardContent sx={{ p: 2 }}>
				<Typography sx={{ fontWeight: 700, color: ink, mb: 1 }}>Related Products</Typography>

				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
						<CircularProgress size={20} />
					</Box>
				) : items.length === 0 ? (
					<Typography variant="body2" sx={{ color: subInk, fontWeight: 700 }}>
						No related products.
					</Typography>
				) : (
					<Stack spacing={1}>
						{items.map((p) => {
							const price = getPrice(p);
							const discountInfo = getDiscountInfo(p);
							const salePrice = getSalePrice(p, price, discountInfo);
							const hasSale = salePrice > 0 && salePrice < price;
							const displayPrice = hasSale ? salePrice : price;
							const discountLabel = getDiscountLabel(discountInfo, hasSale, price, salePrice);
							return (
								<Box
									key={p?.id}
									onClick={() => navigate(productDetailPath(p, storeSlug))}
									sx={{
										display: "flex",
										gap: 1,
										alignItems: "center",
										p: 1,
										borderRadius: 1,
										border: `1px solid ${border}`,
										background: surface2,
										cursor: "pointer",
										"&:hover": { background: surface },
									}}
								>
									<Box
										component="img"
										src={getPrimaryImage(p)}
										alt={p?.name || "product"}
										sx={{ width: 56, height: 56, borderRadius: 0.5, objectFit: "cover" }}
										onError={(e) => {
											e.currentTarget.onerror = null;
											e.currentTarget.src = "https://placehold.co/600x400";
										}}
									/>
									<Box sx={{ minWidth: 0 }}>
										<Typography
											sx={{
												fontWeight: 700,
												color: ink,
												fontSize: 12,
												display: "-webkit-box",
												WebkitLineClamp: 1,
												WebkitBoxOrient: "vertical",
												overflow: "hidden",
											}}
										>
											{p?.name || "Unnamed product"}
										</Typography>
										<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
											<Typography variant="caption" sx={{  fontWeight: 700 }}>
												{money(displayPrice)}
											</Typography>
											{hasSale && (
												<Typography
													variant="caption"
													color="text.secondary"
													sx={{ textDecoration: "line-through", fontSize: 10, ml: 0.5 }}
												>
													{money(price)}
												</Typography>
											)}
											{discountLabel && (
												<Typography
													variant="caption"
													sx={{ fontWeight: 700, fontSize: 9, color: theme.palette.error.main, ml: 0.5 }}
												>
													{discountLabel}
												</Typography>
											)}
										</Box>
									</Box>
								</Box>
							);
						})}
					</Stack>
				)}
			</CardContent>
		</Card>
	);
};

export default RelatedProduct;
