import React, { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Tooltip,
	Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import BoltIcon from "@mui/icons-material/Bolt";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { image_file_url } from "../../../../api/config/index.jsx";
import { getShopProduct } from "../../../../api/controller/admin_controller/shop/shop_controller.jsx";

const safeArray = (value) => (Array.isArray(value) ? value : []);

const formatPrice = (value) => {
	const numeric = Number(value);
	if (!Number.isFinite(numeric)) return "-";
	return numeric.toLocaleString("en-BD", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
};

const getImageUrl = (product) => {
	if (product?.primary_image?.url) return product.primary_image.url;
	if (product?.primary_image?.file_name) return `${image_file_url}/${product.primary_image.file_name}`;

	const primary = safeArray(product?.images).find((item) => item?.is_primary) || safeArray(product?.images)[0];
	if (primary?.upload?.url) return primary.upload.url;
	if (primary?.url) return primary.url;
	if (primary?.file_name) return `${image_file_url}/${primary.file_name}`;

	return "";
};

const ProductThumb = ({ product }) => {
	const [failed, setFailed] = useState(false);
	const src = getImageUrl(product);

	if (!src || failed) {
		return (
			<Box
				sx={{
					width: 56,
					height: 56,
					borderRadius: 1.5,
					border: "1px dashed",
					borderColor: "divider",
					bgcolor: "action.hover",
					display: "grid",
					placeItems: "center",
					flexShrink: 0,
				}}
			>
				<ImageNotSupportedOutlinedIcon sx={{ fontSize: 22, color: "text.disabled" }} />
			</Box>
		);
	}

	return (
		<Box
			component="img"
			src={src}
			alt={product?.name || "Product"}
			onError={() => setFailed(true)}
			sx={{
				width: 56,
				height: 56,
				borderRadius: 1.5,
				objectFit: "cover",
				border: "1px solid",
				borderColor: "divider",
				flexShrink: 0,
			}}
		/>
	);
};

const StockCell = ({ product }) => {
	const stock = Number(product?.current_stock ?? product?.stock);
	if (!Number.isFinite(stock)) return <Typography variant="body2">-</Typography>;
	if (stock <= 0) {
		return (
			<Chip
				size="small"
				icon={<WarningAmberIcon sx={{ fontSize: "14px !important" }} />}
				label="Out"
				sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 800 }}
			/>
		);
	}
	if (stock <= 5) {
		return (
			<Chip
				size="small"
				icon={<WarningAmberIcon sx={{ fontSize: "14px !important" }} />}
				label={`Low: ${stock}`}
				sx={{ bgcolor: "#fff7ed", color: "#ea580c", fontWeight: 800 }}
			/>
		);
	}
	return (
		<Typography variant="body2" sx={{ color: "#16a34a", fontWeight: 800 }}>
			{stock.toLocaleString("en-BD")}
		</Typography>
	);
};

const StatusChips = ({ product }) => {
	const published = Boolean(product?.published);
	const approved = Boolean(product?.approved);
	const featured = Boolean(product?.featured);
	const todaysDeal = Boolean(product?.todays_deal);

	return (
		<Stack spacing={0.5} alignItems="flex-start">
			{published ? (
				<Chip size="small" label="Published" sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 800 }} />
			) : (
				<Chip size="small" label="Unpublished" sx={{ bgcolor: "#fef3c7", color: "#b45309", fontWeight: 800 }} />
			)}
			{approved ? (
				<Chip size="small" label="Approved" sx={{ bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 800 }} />
			) : (
				<Chip size="small" label="Not approved" sx={{ bgcolor: "#f3f4f6", color: "#4b5563", fontWeight: 800 }} />
			)}
			{featured ? (
				<Chip
					size="small"
					icon={<StarBorderIcon sx={{ fontSize: "13px !important" }} />}
					label="Featured"
					sx={{ bgcolor: "#ede9fe", color: "#7c3aed", fontWeight: 800 }}
				/>
			) : null}
			{todaysDeal ? (
				<Chip
					size="small"
					icon={<BoltIcon sx={{ fontSize: "13px !important" }} />}
					label="Today deal"
					sx={{ bgcolor: "#fee2e2", color: "#dc2626", fontWeight: 800 }}
				/>
			) : null}
		</Stack>
	);
};

const ShopManageProducts = ({ shopId, shopSlug, onOpenShop }) => {
	const navigate = useNavigate();
	const [rows, setRows] = useState([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(20);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const productCountLabel = useMemo(() => {
		if (loading) return "Loading shop catalog";
		return total ? `${total.toLocaleString("en-BD")} products found` : "No products found yet";
	}, [loading, total]);

	const fetchProducts = async (pageZero = page, perPage = rowsPerPage) => {
		if (!shopId) {
			setRows([]);
			setTotal(0);
			setError("Shop id not found.");
			return;
		}

		setLoading(true);
		setError("");
		try {
			const apiPage = pageZero + 1;
			const response = await getShopProduct(shopId, {
				page: apiPage,
				per_page: perPage,
			});

			if (response?.status === "success") {
				const paginator = response?.data ?? {};
				const list = safeArray(paginator?.data);
				setRows(list);
				setTotal(Number(paginator?.total ?? list.length));
				setRowsPerPage(Number(paginator?.per_page ?? perPage));
				setPage(Math.max(Number(paginator?.current_page ?? apiPage) - 1, 0));
			} else {
				setRows([]);
				setTotal(0);
				setError(response?.message || "Failed to load shop products.");
			}
		} catch (err) {
			setRows([]);
			setTotal(0);
			setError(err?.response?.data?.message || err?.message || "Failed to load shop products.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProducts(0, rowsPerPage);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [shopId]);

	const handleOpenAdminProducts = () => {
		if (onOpenShop && typeof onOpenShop === "function") {
			onOpenShop(shopId);
		} else {
			navigate(`/ecom/product/all?shop_id=${shopId}`);
		}
	};

	const handleOpenStorefront = () => {
		if (shopSlug) {
			window.open(`/store/${shopSlug}/products`, "_blank", "noopener,noreferrer");
		}
	};

	const handleChangePage = (_, nextPage) => {
		setPage(nextPage);
		fetchProducts(nextPage, rowsPerPage);
	};

	const handleChangeRowsPerPage = (event) => {
		const next = parseInt(event.target.value, 10);
		setRowsPerPage(next);
		setPage(0);
		fetchProducts(0, next);
	};

	return (
		<Box sx={{ py: 1 }}>
			<Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} sx={{ mb: 2 }}>
				<Box sx={{ flex: 1 }}>
					<Typography variant="h6" sx={{ fontWeight: 900 }}>
						Shop Products Management
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{productCountLabel}
					</Typography>
				</Box>

				<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
					<Button
						variant="contained"
						startIcon={<InventoryOutlinedIcon />}
						onClick={handleOpenAdminProducts}
						disabled={!shopId}
						sx={{
							borderRadius: 2,
							px: 2.5,
							fontWeight: 800,
							textTransform: "none",
							bgcolor: "#6366f1",
							boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
							"&:hover": { bgcolor: "#4f46e5" },
						}}
					>
						Open Full Product Manager
					</Button>

					{shopSlug ? (
						<Button
							variant="outlined"
							startIcon={<LaunchOutlinedIcon />}
							onClick={handleOpenStorefront}
							sx={{ borderRadius: 2, px: 2.5, fontWeight: 800, textTransform: "none" }}
						>
							Open Storefront
						</Button>
					) : null}

					<Tooltip title="Refresh products">
						<span>
							<IconButton onClick={() => fetchProducts(page, rowsPerPage)} disabled={loading || !shopId}>
								<RefreshIcon />
							</IconButton>
						</span>
					</Tooltip>
				</Stack>
			</Stack>

			{error ? (
				<Alert
					severity="error"
					action={
						<Button color="inherit" size="small" onClick={() => fetchProducts(page, rowsPerPage)}>
							Retry
						</Button>
					}
					sx={{ mb: 2 }}
				>
					{error}
				</Alert>
			) : null}

			<Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
				<CardContent sx={{ p: { xs: 1, md: 2 } }}>
					<TableContainer component={Paper} sx={{ boxShadow: "none", border: "1px solid", borderColor: "divider" }}>
						<Table size="small">
							<TableHead>
								<TableRow>
									{["Product", "Category", "Brand", "Price", "Stock", "Status", "Updated", "Action"].map((header) => (
										<TableCell key={header} sx={{ fontWeight: 900, bgcolor: "action.hover", whiteSpace: "nowrap" }}>
											{header}
										</TableCell>
									))}
								</TableRow>
							</TableHead>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={8}>
											<Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
												<CircularProgress size={26} />
											</Box>
										</TableCell>
									</TableRow>
								) : rows.length ? (
									rows.map((product) => (
										<TableRow key={product?.id} hover>
											<TableCell sx={{ minWidth: 280 }}>
												<Stack direction="row" spacing={1.5} alignItems="center">
													<ProductThumb product={product} />
													<Box sx={{ minWidth: 0 }}>
														<Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
															{product?.name || "Unnamed product"}
														</Typography>
														<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
															SKU: {product?.sku || "-"}
														</Typography>
														<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
															Slug: {product?.slug || "-"}
														</Typography>
													</Box>
												</Stack>
											</TableCell>
											<TableCell>{product?.category?.name || product?.category_name || "-"}</TableCell>
											<TableCell>{product?.brand?.name || product?.brand_name || "-"}</TableCell>
											<TableCell sx={{ whiteSpace: "nowrap", fontWeight: 800 }}>
												{formatPrice(product?.unit_price ?? product?.price ?? product?.sale_price)}
											</TableCell>
											<TableCell>
												<StockCell product={product} />
											</TableCell>
											<TableCell>
												<StatusChips product={product} />
											</TableCell>
											<TableCell sx={{ whiteSpace: "nowrap" }}>
												{product?.updated_at ? String(product.updated_at).slice(0, 10) : "-"}
											</TableCell>
											<TableCell>
												<Tooltip title="Edit product">
													<IconButton
														size="small"
														onClick={() => product?.id && navigate(`/ecom/product/edit/${product.id}`)}
														sx={{ color: "#6366f1" }}
													>
														<EditOutlinedIcon fontSize="small" />
													</IconButton>
												</Tooltip>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={8}>
											<Box sx={{ py: 5, textAlign: "center" }}>
												<InventoryOutlinedIcon sx={{ fontSize: 34, color: "text.disabled", mb: 1 }} />
												<Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
													No products found
												</Typography>
												<Typography variant="body2" color="text.secondary">
													This shop has no product data returned from the backend yet.
												</Typography>
											</Box>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>

					<TablePagination
						component="div"
						count={total}
						page={page}
						onPageChange={handleChangePage}
						rowsPerPage={rowsPerPage}
						onRowsPerPageChange={handleChangeRowsPerPage}
						rowsPerPageOptions={[10, 20, 50, 100]}
					/>
				</CardContent>
			</Card>
		</Box>
	);
};

export default ShopManageProducts;
