import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	Box,
	CircularProgress,
	Container,
	Grid,
	Typography,
	Button,
	List,
	ListItemButton,
	ListItemText,
	Divider,
	Pagination,
	Stack,
	useTheme,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { getCategoryWiseProduct } from "../../../../api/controller/admin_controller/product/product_controller";
import { getProductCategoryDetails, getCategoryChildren} from "../../../../api/controller/admin_controller/product/product_setting_controller";
import { fetchPublicStoreCategories } from "../../../../api/controller/admin_controller/category/store_category_controller";
import { findCategoryInTree, normalizeCategoryList } from "../../../../utils/categoryTree";
import SmartProductCard from "../../home/components/ProductCard";
import { tokens } from "../../../../theme";
import { productDetailPath, storeHomePath } from "../../../../utils/productRoute";
import CategoryWiseProductPhnView from "./CategoryWiseProductPhnView";

const safeArray = (x) => (Array.isArray(x) ? x : []);

const CategoryWiseProduct = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { id, slug } = useParams();
	const isStorefront = Boolean(slug);
	const storeParams = useMemo(() => (slug ? { store_slug: slug } : {}), [slug]);

	const colors = tokens(theme.palette.mode);
	const pageBg = theme.palette.background?.default || colors.primary[500];

	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [category, setCategory] = useState(null);
	const [children, setChildren] = useState([]);
	const [childrenByParent, setChildrenByParent] = useState({});
	const [selectedSubId, setSelectedSubId] = useState("");
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState({
		current_page: 1,
		last_page: 1,
		total: 0,
		per_page: 24,
	});

	const loadProducts = useCallback(async () => {
		if (!id) return;
		setLoading(true);
		setError("");
		try {
			const categoryId = selectedSubId || id;
			const res = await getCategoryWiseProduct({
				category_id: categoryId,
				page,
				per_page: pagination.per_page,
				...storeParams,
			});
			const pageData = res?.data ?? res ?? {};
			const list = safeArray(pageData?.data ?? pageData?.items ?? pageData);
			setProducts(list);
			setPagination((prev) => ({
				...prev,
				current_page: pageData?.current_page || prev.current_page,
				last_page: pageData?.last_page || prev.last_page,
				total: pageData?.total ?? prev.total,
				per_page: pageData?.per_page ?? prev.per_page,
			}));
			if (pageData?.current_page && pageData.current_page !== page) {
				setPage(pageData.current_page);
			}
		} catch (e) {
			console.error("CategoryWiseProduct load error:", e);
			setProducts([]);
			setError("Failed to load products.");
		} finally {
			setLoading(false);
		}
	}, [id, selectedSubId, page, pagination.per_page, storeParams]);

	useEffect(() => {
		loadProducts();
	}, [loadProducts]);

	useEffect(() => {
		const loadCategory = async () => {
			if (!id) return;
			try {
				if (isStorefront) {
					const res = await fetchPublicStoreCategories(slug);
					const tree = normalizeCategoryList(res);
					setCategory(findCategoryInTree(tree, id));
					return;
				}

				const res = await getProductCategoryDetails(id);
				setCategory(res?.data ?? null);
			} catch (e) {
				console.error("Category details error:", e);
				setCategory(null);
			}
		};

		const loadChildren = async () => {
			if (!id) return;
			try {
				if (isStorefront) {
					const res = await fetchPublicStoreCategories(slug);
					const tree = normalizeCategoryList(res);
					const currentCategory = findCategoryInTree(tree, id);
					const list = safeArray(currentCategory?.children);
					setChildren(list);
					setChildrenByParent(
						Object.fromEntries(
							list
								.map((child) => [child?.id, safeArray(child?.children)])
								.filter(([key]) => key)
						)
					);
					return;
				}

				const res = await getCategoryChildren(id);
				const list = safeArray(res?.data);
				setChildren(list);

				const nestedEntries = await Promise.all(
					list.map(async (child) => {
						if (!child?.id) return [child?.id, []];
						try {
							const childRes = await getCategoryChildren(child.id);
							return [child.id, safeArray(childRes?.data)];
						} catch (e) {
							console.error("Nested category children error:", e);
							return [child.id, []];
						}
					})
				);

				setChildrenByParent(Object.fromEntries(nestedEntries.filter(([key]) => key)));
			} catch (e) {
				console.error("Category children error:", e);
				setChildren([]);
				setChildrenByParent({});
			}
		};

		setSelectedSubId("");
		setPage(1);
		setChildrenByParent({});
		loadCategory();
		loadChildren();
	}, [id, isStorefront, slug]);

	const handleSelectSubCategory = (value) => {
		setSelectedSubId(value);
		setPage(1);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handlePageChange = (_, value) => {
		setPage(value);
	};

	const title = useMemo(() => category?.name || `Category: ${id || ""}`, [category?.name, id]);

	return (
		<Box
			sx={{
				minHeight: "100vh",
				background: pageBg,
				py: 4,
			}}
		>
			<Container maxWidth="xl">
				<Box sx={{ mb: 3 }}>
					<Typography variant="h4" sx={{ fontWeight: 600 }}>
						{title}
					</Typography>
					<Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
						Browse products from this category.
					</Typography>
				</Box>

				<Grid container spacing={3}>
					<Grid item xs={12} md={3}>
						<Box
							sx={{
								p: 2,
								borderRadius: 3,
								border: `1px solid ${theme.palette.divider || colors.primary[200]}`,
								background: colors.primary[400],
							}}
						>
							<Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
								{category?.name || "Category"}
							</Typography>
							<Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
								Subcategories
							</Typography>
							<Divider sx={{ mb: 1 }} />
							<List dense disablePadding>
								<ListItemButton
									selected={!selectedSubId}
									onClick={() => handleSelectSubCategory("")}
									sx={{
										borderRadius: 2,
										mb: 1,
										border: `1px solid ${!selectedSubId ? theme.palette.primary.main : theme.palette.divider || colors.primary[200]}`,
										background: !selectedSubId ? theme.palette.primary.main : colors.primary[300],
										color: !selectedSubId ? theme.palette.primary.contrastText : "inherit",
										"&:hover": {
											background: !selectedSubId ? theme.palette.primary.dark : theme.palette.action.hover,
										},
										"&.Mui-selected": {
											background: theme.palette.primary.main,
											color: theme.palette.primary.contrastText,
										},
										"&.Mui-selected:hover": {
											background: theme.palette.primary.dark,
										},
									}}
								>
									<ListItemText primary="All" primaryTypographyProps={{ fontWeight: 800 }} />
								</ListItemButton>

								{children.map((child) => {
									const nestedChildren = safeArray(childrenByParent?.[child?.id]);
									const parentActive =
										String(selectedSubId) === String(child?.id) ||
										nestedChildren.some((nestedChild) => String(selectedSubId) === String(nestedChild?.id));

									return (
										<Box
											key={child?.id}
											sx={{
												p: 1,
												mb: 1.25,
												borderRadius: 2,
												border: `1px solid ${
													parentActive ? theme.palette.primary.main : theme.palette.divider || colors.primary[200]
												}`,
												background: parentActive ? theme.palette.action.selected : colors.primary[300],
												boxShadow: parentActive ? `0 8px 18px ${theme.palette.primary.main}22` : "none",
											}}
										>
											<ListItemButton
												selected={parentActive}
												onClick={() => handleSelectSubCategory(String(child?.id))}
												sx={{
													borderRadius: 1.5,
													mb: nestedChildren.length > 0 ? 1 : 0,
													background: parentActive ? theme.palette.primary.main : colors.primary[400],
													color: parentActive ? theme.palette.primary.contrastText : "inherit",
													"&:hover": {
														background: parentActive ? theme.palette.primary.dark : theme.palette.action.hover,
													},
													"&.Mui-selected": {
														background: theme.palette.primary.main,
														color: theme.palette.primary.contrastText,
													},
													"&.Mui-selected:hover": {
														background: theme.palette.primary.dark,
													},
												}}
											>
												<ListItemText
													primary={child?.name || "Unnamed"}
													primaryTypographyProps={{ fontWeight: 800 }}
												/>
											</ListItemButton>

											{nestedChildren.length > 0 && (
												<Box
													sx={{
														display: "grid",
														gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
														gap: 0.75,
													}}
												>
													{nestedChildren.map((nestedChild) => (
														<Box
															key={nestedChild?.id}
															component="button"
															type="button"
															onClick={() => handleSelectSubCategory(String(nestedChild?.id))}
															sx={{
																border: `1px solid ${
																	String(selectedSubId) === String(nestedChild?.id)
																		? theme.palette.primary.main
																		: theme.palette.divider || colors.primary[200]
																}`,
																borderRadius: 1.5,
																background:
																	String(selectedSubId) === String(nestedChild?.id)
																		? theme.palette.primary.main
																		: colors.primary[400],
																color:
																	String(selectedSubId) === String(nestedChild?.id)
																		? theme.palette.primary.contrastText
																		: "inherit",
																cursor: "pointer",
																font: "inherit",
																minHeight: 34,
																px: 1,
																py: 0.7,
																textAlign: "left",
																width: "100%",
																"&:hover": {
																	background:
																		String(selectedSubId) === String(nestedChild?.id)
																			? theme.palette.primary.dark
																			: theme.palette.action.hover,
																},
															}}
														>
															<Typography
																variant="body2"
																sx={{
																	fontWeight: 400,
																	lineHeight: 1.2,
																	overflow: "hidden",
																	textOverflow: "ellipsis",
																	whiteSpace: "nowrap",
																}}
															>
																{nestedChild?.name || "Unnamed"}
															</Typography>
														</Box>
													))}
												</Box>
											)}
										</Box>
									);
								})}
							</List>
						</Box>
					</Grid>

					<Grid item xs={12} md={9}>
						{loading ? (
							<Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
								<CircularProgress />
							</Box>
						) : products.length === 0 ? (
							<Box sx={{ textAlign: "center", py: 8 }}>
								<Typography variant="h6" sx={{ mb: 1.5 }}>
									{error || "No products found."}
								</Typography>
								<Button
									variant="contained"
									onClick={() => navigate(storeHomePath(slug))}
									sx={{ textTransform: "none", fontWeight: 600 }}
								>
									Back to home
								</Button>
							</Box>
						) : (
							<>
								<Grid container spacing={2.5}>
									{products.map((product, index) => (
										<Grid key={product?.id ?? product?.product_id ?? index} 
										item xs={12} sm={6} md={2} lg={3}>
											<SmartProductCard
												product={product}
												storeSlug={slug}
												onView={(p) => navigate(productDetailPath(p, slug))}
											/>
										</Grid>
									))}
								</Grid>

								{pagination.last_page > 1 ? (
									<Stack alignItems="center" sx={{ mt: 3 }}>
										<Pagination
											count={pagination.last_page}
											page={page}
											onChange={handlePageChange}
											color="primary"
										/>
									</Stack>
								) : null}
							</>
						)}
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default CategoryWiseProduct;
