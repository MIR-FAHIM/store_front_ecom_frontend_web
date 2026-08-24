import React, { useEffect, useState } from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Container,
	Grid,
	Pagination,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { useNavigate, useParams } from "react-router-dom";
import { tokens } from "../../../theme";
import { image_file_url } from "../../../api/config/index.jsx";
import { getBrand } from "../../../api/controller/admin_controller/product/setting_controller";

const buildImageUrl = (media) => {
	if (!media) return "";
	const base = String(image_file_url || "").replace(/\/+$/, "");

	if (typeof media === "object") {
		const direct = media?.url || media?.external_link;
		if (direct && /^https?:\/\//i.test(String(direct))) return String(direct);
		const fileName = media?.file_name || media?.file_original_name;
		if (fileName) {
			const path = String(fileName).replace(/^\/+/, "");
			return `${base}/${path}`;
		}
	}

	const raw = String(media);
	if (/^https?:\/\//i.test(raw)) return raw;
	if (!base) return "";
	const path = raw.replace(/^\/+/, "");
	return `${base}/${path}`;
};

const Brand = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { slug } = useParams();
	const colors = tokens(theme.palette.mode);

	const [brands, setBrands] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [page, setPage] = useState(1);
	const [lastPage, setLastPage] = useState(1);
	const [perPage, setPerPage] = useState(20);

	const loadBrands = async (nextPage = page) => {
		setLoading(true);
		setError("");
		try {
			const res = await getBrand({ page: nextPage, per_page: perPage, status: "active", ...(slug ? { store_slug: slug } : {}) });
			const payload = res?.data ?? res;
			const data = payload?.data ?? payload;
			const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

			setBrands(list);
			setPage(Number(data?.current_page ?? nextPage));
			setLastPage(Number(data?.last_page ?? 1));
			setPerPage(Number(data?.per_page ?? perPage));
		} catch (e) {
			console.error("Failed to load brands", e);
			setError("Failed to load brands.");
			setBrands([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadBrands(page);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, perPage]);

	return (
												<Box
													sx={{
				minHeight: "100vh",
				py: 4,
				background: theme.palette.background?.default || colors.primary[500],
													}}
												>
			<Container maxWidth="xl">
				<Box sx={{ mb: 4 }}>
					<Typography variant="h4" sx={{ fontWeight: 700, color: colors.gray[100], letterSpacing: "-0.02em" }}>
						All Brands
					</Typography>
					<Typography variant="body2" sx={{ color: colors.gray[300], mt: 0.5, fontWeight: 400 }}>
						Explore trusted brands and shop by your favorites.
					</Typography>
				</Box>

				<Card sx={{ background: colors.primary[400], borderRadius: 3, border: `1px solid ${colors.primary[300]}` }}>
					<CardContent>
						{loading ? (
							<Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
								<CircularProgress size={24} />
							</Box>
						) : error ? (
							<Typography variant="body2" color="error">
								{error}
							</Typography>
						) : brands.length === 0 ? (
							<Typography variant="body2" sx={{ color: colors.gray[300] }}>
								No brands found.
							</Typography>
						) : (
							<Grid container spacing={2}>
								{brands.map((brand) => {
									const logo = buildImageUrl(brand?.logo);
									return (
										<Grid item xs={6} sm={4} md={3} lg={2} key={brand?.id ?? brand?.name}>
											<Box
												role="button"
												tabIndex={brand?.id ? 0 : -1}
												onClick={() => brand?.id && navigate(slug ? `/store/${encodeURIComponent(String(slug))}/brands/${brand.id}/products` : `/brands/${brand.id}/products`)}
												onKeyDown={(event) => {
													if (!brand?.id) return;
													if (event.key === "Enter" || event.key === " ") {
														event.preventDefault();
														navigate(slug ? `/store/${encodeURIComponent(String(slug))}/brands/${brand.id}/products` : `/brands/${brand.id}/products`);
													}
												}}
												sx={{
													borderRadius: 3,
													border: `1px solid ${colors.primary[300]}`,
													background: colors.primary[500],
													p: 2,
													display: "flex",
													alignItems: "center",
													gap: 1.5,
													minHeight: 80,
													cursor: brand?.id ? "pointer" : "default",
													transition: "border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease",
													"&:hover": brand?.id ? {
														borderColor: theme.palette.primary.main,
														transform: "translateY(-2px)",
														boxShadow: theme.shadows[3],
													} : undefined,
													"&:focus-visible": {
														outline: `2px solid ${theme.palette.primary.main}`,
														outlineOffset: 2,
													},
												}}
											>
												<Box
													component="img"
													src={logo || "https://via.placeholder.com/64x64?text=Logo"}
													alt={brand?.name || "brand"}
													sx={{ width: 48, height: 48, objectFit: "contain", borderRadius: 2, background: colors.primary[400] }}
													onError={(e) => {
														e.currentTarget.onerror = null;
														e.currentTarget.src = "https://via.placeholder.com/64x64?text=Logo";
													}}
												/>
												<Box sx={{ minWidth: 0 }}>
													<Typography
														variant="subtitle2"
														sx={{
															color: colors.gray[100],
															fontWeight: 600,
															fontSize: 13,
															textTransform: "capitalize",
															display: "-webkit-box",
															WebkitLineClamp: 2,
															WebkitBoxOrient: "vertical",
															overflow: "hidden",
														}}
													>
														{brand?.name || "Brand"}
													</Typography>
													<Button
														size="small"
														startIcon={<Inventory2OutlinedIcon sx={{ fontSize: 15 }} />}
														onClick={(event) => {
															event.stopPropagation();
															navigate(slug ? `/store/${encodeURIComponent(String(slug))}/brands/${brand.id}/products` : `/brands/${brand.id}/products`);
														}}
														disabled={!brand?.id}
														sx={{ mt: 0.75, px: 0, minWidth: 0, fontSize: 11, fontWeight: 700 }}
													>
														Products
													</Button>
												</Box>
											</Box>
										</Grid>
									);
								})}
							</Grid>
						)}

						{lastPage > 1 ? (
							<Stack alignItems="center" sx={{ mt: 3 }}>
								<Pagination
									count={lastPage}
									page={page}
									onChange={(_, value) => setPage(value)}
									color="primary"
								/>
							</Stack>
						) : null}
					</CardContent>
				</Card>
			</Container>
		</Box>
	);
};

export default Brand;
