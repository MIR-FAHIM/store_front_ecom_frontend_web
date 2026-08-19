import React, { useEffect, useMemo, useRef, useState } from "react";
import {
	Box,
	TextField,
	InputAdornment,
	Button,
	IconButton,
	Paper,
	Typography,
	CircularProgress,
	Stack,
	useTheme,
	Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";

import { getProduct } from "../../../api/controller/admin_controller/product/product_controller";
import { image_file_url } from "../../../api/config";
import { tokens } from "../../../theme";
import { productDetailPath } from "../../../utils/productRoute";

const safeArray = (x) => (Array.isArray(x) ? x : []);

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT = 8;

const getRecentSearches = () => {
	try {
		const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
};

const saveRecentSearch = (term) => {
	const t = (term || "").trim();
	if (!t) return;
	const recent = getRecentSearches().filter((s) => s.toLowerCase() !== t.toLowerCase());
	recent.unshift(t);
	localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
};

const removeRecentSearch = (term) => {
	const recent = getRecentSearches().filter((s) => s !== term);
	localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
};

const SearchProduct = ({
	placeholder = "Search products...",
	size = "small",
	isMobile = false,
	fullWidth = true,
	maxResults = 6,
	storeSlug = "",
}) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const wrapperRef = useRef(null);

	const colors = tokens(theme.palette.mode);
	const border = colors.gray[600];
	const glass = theme.palette.mode === "dark" ? colors.primary[400] : colors.primary[300];
	const glass2 = theme.palette.mode === "dark" ? colors.primary[300] : colors.primary[200];

	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState([]);
	const [open, setOpen] = useState(false);
	const [focused, setFocused] = useState(false);
	const [recentSearches, setRecentSearches] = useState(getRecentSearches);

	const showRecent = focused && query.trim().length < 2 && recentSearches.length > 0;

	const handleSearch = (searchTerm) => {
		const q = (searchTerm ?? query ?? "").trim();
		if (!q) return;
		saveRecentSearch(q);
		setRecentSearches(getRecentSearches());
		setOpen(false);
		setFocused(false);
		navigate(`${storeSlug ? `/store/${encodeURIComponent(String(storeSlug))}/search` : "/search"}?q=${encodeURIComponent(q)}`);
	};

	const onKeyDown = (e) => {
		if (e.key === "Enter") handleSearch();
		if (e.key === "Escape") { setOpen(false); setFocused(false); }
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
				setOpen(false);
				setFocused(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		const q = (query || "").trim();
		if (q.length < 2) {
			setResults([]);
			setOpen(false);
			return;
		}

		let alive = true;
		setLoading(true);

		const t = setTimeout(async () => {
			try {
				const res = await getProduct({ search: q, page: 1, per_page: maxResults, ...(storeSlug ? { store_slug: storeSlug } : {}) });
				const list = res?.data?.data ?? res?.data ?? [];
				if (!alive) return;
				setResults(safeArray(list));
				setOpen(true);
			} catch (e) {
				console.error("SearchProduct error:", e);
				if (!alive) return;
				setResults([]);
				setOpen(true);
			} finally {
				if (alive) setLoading(false);
			}
		}, 350);

		return () => {
			alive = false;
			clearTimeout(t);
		};
	}, [query, maxResults]);

	const renderImage = (product) => {
		const file = product?.primary_image?.file_name || product?.image || product?.file_name;
		if (!file) return "https://via.placeholder.com/80x80?text=No+Image";
		const safeFile = String(file).replaceAll("\\/", "/").replace(/^\/+/, "");
		const base = String(image_file_url || "").replace(/\/+$/, "");
		return `${base}/${safeFile}`;
	};

	const money = useMemo(
		() => (n) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(Number(n || 0)),
		[]
	);

	const getDiscountInfo = (product) => {
		const pd = product?.product_discount;
		if (pd) {
			const d = Number(pd.discount ?? 0);
			if (d > 0) return { amount: d, type: String(pd.discount_type ?? "").toLowerCase() };
		}
		const d = Number(product?.discount ?? 0);
		if (d <= 0) return null;
		return { amount: d, type: String(product?.discount_type ?? "").toLowerCase() };
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

	return (
		<Box ref={wrapperRef} sx={{ position: "relative", width: fullWidth ? "100%" : "auto" }}>
			<TextField
			borderRadius={1}
				size={size}
				placeholder={placeholder}
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				onKeyDown={onKeyDown}
				onFocus={() => { setFocused(true); setRecentSearches(getRecentSearches()); }}
				fullWidth={fullWidth}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<SearchIcon sx={{ opacity: 0.75 }} />
						</InputAdornment>
					),
					endAdornment: (
						<InputAdornment position="end">
							{isMobile ? (
								<IconButton
									onClick={handleSearch}
									sx={{
										borderRadius: 1,
										border: `1px solid ${border}`,
										background: theme.palette.secondary.main,
										color: colors.gray[900],
									}}
								>
									<SearchIcon />
								</IconButton>
							) : (
								<Button
									onClick={handleSearch}
									size="small"
									variant="contained"
									sx={{
										borderRadius: 1,
										textTransform: "none",
										fontWeight: 600,
										fontSize: 13,
										px: 2,
										boxShadow: "none",
										background: theme.palette.primary.main,
										"&:hover": { opacity: 0.92, boxShadow: "none" },
									}}
								>
									Search
								</Button>
							)}
						</InputAdornment>
					),
				}}
				sx={{
					"& .MuiOutlinedInput-root": {
						borderRadius: 1,
						background: glass,
						border: `1px solid ${border}`,
						"& fieldset": { borderColor: "transparent" },
						"&:hover": { background: glass2 },
						"&.Mui-focused": {
							background: glass2,
							borderColor: theme.palette.primary.main,
						},
					},
				}}
			/>

			{(open || showRecent) ? (
				<Paper
					elevation={0}
					sx={{
						position: "absolute",
						top: "calc(100% + 8px)",
						left: 0,
						right: 0,
						zIndex: 10,
						borderRadius: 1,
						border: `1px solid ${border}`,
						background: glass,
						backdropFilter: "blur(10px)",
						p: 1,
						maxHeight: 420,
						overflow: "auto",
					}}
				>
					{/* Recent searches */}
					{showRecent && (
						<>
							<Typography variant="caption" sx={{ fontWeight: 700, px: 1, py: 0.5, color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5 }}>
								<HistoryIcon sx={{ fontSize: 14 }} /> Recent Searches
							</Typography>
					1		<Stack spacing={0.5} sx={{ mb: 1 }}>
								{recentSearches.map((term, i) => (
									<Box
										key={i}
										onMouseDown={(e) => e.preventDefault()}
										onClick={() => {
											setQuery(term);
											handleSearch(term);
										}}
										sx={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											px: 1.5,
											py: 0.8,
											borderRadius: 2,
											cursor: "pointer",
											"&:hover": { background: glass2 },
										}}
									>
										<Typography sx={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 0.8 }}>
											<TrendingUpIcon sx={{ fontSize: 15, opacity: 0.6 }} />
											{term}
										</Typography>
										<IconButton
											size="small"
											onMouseDown={(e) => e.stopPropagation()}
											onClick={(e) => {
												e.stopPropagation();
												removeRecentSearch(term);
												setRecentSearches(getRecentSearches());
											}}
											sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}
										>
											<CloseIcon sx={{ fontSize: 14 }} />
										</IconButton>
									</Box>
								))}
							</Stack>
						</>
					)}

					{/* Live suggestions */}
					{open && (
						<>
							{loading ? (
								<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
									<CircularProgress size={20} />
								</Box>
							) : results.length === 0 ? (
								<Typography variant="body2" sx={{ color: "text.secondary", px: 1, py: 1.2 }}>
									No products found for "{query}".
								</Typography>
							) : (
								<Stack spacing={1}>
									{results.map((product) => (
										<Box
											key={product?.id}
											onMouseDown={(e) => e.preventDefault()}
											onClick={() => {
												setOpen(false);
												setFocused(false);
												saveRecentSearch(query.trim());
												navigate(productDetailPath(product, storeSlug));
											}}
											sx={{
												display: "flex",
												gap: 1.2,
												alignItems: "center",
												p: 1,
												borderRadius: 1,
												border: `1px solid ${border}`,
												background: glass2,
												cursor: "pointer",
												"&:hover": { background: glass },
											}}
										>
											<Box
												component="img"
												src={renderImage(product)}
												alt={product?.name || "product"}
												sx={{ width: 56, height: 56, borderRadius: 2, objectFit: "cover" }}
												onError={(e) => {
													e.currentTarget.onerror = null;
													e.currentTarget.src = "https://via.placeholder.com/80x80?text=No+Image";
												}}
											/>
											<Box sx={{ minWidth: 0 }}>
												<Typography
													sx={{
														fontWeight: 700,
														lineHeight: 1.3,
														fontSize: 13,
														display: "-webkit-box",
														WebkitLineClamp: 1,
														WebkitBoxOrient: "vertical",
														overflow: "hidden",
													}}
												>
													{product?.name || "Unnamed product"}
												</Typography>
												{(() => {
													const price = getPrice(product);
													const discountInfo = getDiscountInfo(product);
													const salePrice = getSalePrice(product, price, discountInfo);
													const hasSale = salePrice > 0 && salePrice < price;
													const displayPrice = hasSale ? salePrice : price;
													const discountLabel = getDiscountLabel(discountInfo, hasSale, price, salePrice);
													return (
														<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", mt: 0.25 }}>
															<Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12 }}>
																{money(displayPrice)}
															</Typography>
															{hasSale && (
																<Typography variant="caption" sx={{ textDecoration: "line-through", color: "text.secondary", fontSize: 10 }}>
																	{money(price)}
																</Typography>
															)}
															{discountLabel && (
																<Typography variant="caption" sx={{ fontWeight: 700, fontSize: 9, color: theme.palette.error.main }}>
																	{discountLabel}
																</Typography>
															)}
														</Box>
													);
												})()}
											</Box>
										</Box>
									))}

									{/* View all results link */}
									<Divider sx={{ my: 0.5 }} />
									<Box
										onMouseDown={(e) => e.preventDefault()}
										onClick={() => handleSearch()}
										sx={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											gap: 0.5,
											py: 1,
											borderRadius: 2,
											cursor: "pointer",
											"&:hover": { background: glass2 },
										}}
									>
										<SearchIcon sx={{ fontSize: 16, opacity: 0.7 }} />
										<Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.primary.main }}>
											View all results for "{query.trim()}"
										</Typography>
									</Box>
								</Stack>
							)}
						</>
					)}
				</Paper>
			) : null}
		</Box>
	);
};

export default SearchProduct;
