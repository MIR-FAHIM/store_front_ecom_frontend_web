import React, { useEffect, useMemo, useRef, useState } from "react";
import {
	Avatar,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	IconButton,
	Alert,
	Snackbar,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import { CheckCircleOutline, ChevronLeft, ChevronRight, FavoriteBorder } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { tokens } from "../../../../theme";
import { image_file_url } from "../../../../api/config/index.jsx";
import { getAllShops } from "../../../../api/controller/admin_controller/shop/shop_controller.jsx";
import {
	addSellerPreference,
	getSellersByCustomer,
} from "../../../../api/controller/customer_preference/customer_preference_controller.jsx";

const safeArray = (x) => (Array.isArray(x) ? x : []);

const normalizePreferredSellerRows = (payload) => {
	const rows =
		Array.isArray(payload?.data?.data)
			? payload.data.data
			: Array.isArray(payload?.data)
				? payload.data
				: Array.isArray(payload)
					? payload
					: [];
	return rows
		.map((row) => {
			const seller = row?.seller || row?.seller_user || row?.user || row;
			return row?.seller_id || seller?.id || seller?.user_id;
		})
		.filter(Boolean);
};

const buildImageUrl = (file) => {
	if (!file) return null;
	if (typeof file === "object") {
		const direct = file?.url || file?.external_link;
		if (direct && /^https?:\/\//i.test(String(direct))) return String(direct);
		const named = file?.file_name || file?.file_original_name;
		if (named) return buildImageUrl(named);
	}
	if (/^https?:\/\//i.test(String(file))) return String(file);
	const base = String(image_file_url || "").replace(/\/+$/, "");
	const safeFile = String(file).replaceAll("\\/", "/").replace(/^\/+/, "");
	return `${base}/${safeFile}`;
};

const initialsFromName = (name) => {
	if (!name) return "S";
	const parts = String(name)
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	const initials = parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase();
	return initials || "S";
};

const ShopCard = ({ shop, onView, onPreference, isPreferred, preferenceSaving }) => {
	const theme = useTheme();
	const colors = tokens(theme.palette.mode);

	const logoUrl = useMemo(() => buildImageUrl(shop?.logo), [shop?.logo]);
	const bannerUrl = useMemo(() => buildImageUrl(shop?.banner), [shop?.banner]);
	const sellerId = shop?.user_id;

	return (
		<Card
			onClick={() => onView?.(shop)}
			sx={{
				minWidth: 260,
				maxWidth: 300,
				borderRadius: 1,
				border: `1px solid ${theme.palette.divider}`,
				background: colors.primary[400],
				cursor: "pointer",
				transition: "transform 140ms ease, box-shadow 220ms ease, border-color 220ms ease",
				"&:hover": {
					transform: "translateY(-3px)",
					borderColor: theme.palette.primary.main,
					boxShadow:
						theme.palette.mode === "dark"
							? "0 8px 24px rgba(0,0,0,0.25)"
							: "0 8px 24px rgba(0,0,0,0.08)",
				},
			}}
		>
			<Box
				sx={{
					height: 104,
					borderRadius: "4px 4px 0 0",
					background: bannerUrl
						? `url(${bannerUrl}) center/cover no-repeat`
						: `linear-gradient(120deg, ${colors.blueAccent[700]}, ${colors.blueAccent[400]})`,
				}}
			/>
			<CardContent sx={{ p: 1.5 }}>
				<Stack direction="row" spacing={1.5} alignItems="center">
					<Avatar
						src={logoUrl || undefined}
						sx={{
							width: 56,
							height: 56,
							background: colors.primary[300],
							fontWeight: 600,
							flexShrink: 0,
						}}
					>
						{initialsFromName(shop?.shop_name)}
					</Avatar>
					<Box sx={{ minWidth: 0 }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
							{shop?.shop_name || "Shop"}
						</Typography>
						<Typography
							variant="body2"
							sx={{
								color: colors.gray[300],
								display: "-webkit-box",
								WebkitLineClamp: 2,
								WebkitBoxOrient: "vertical",
								overflow: "hidden",
								lineHeight: 1.35,
							}}
						>
							{shop?.description || "No description"}
						</Typography>
					</Box>
				</Stack>

				{shop?.status ? (
					<Typography variant="caption" sx={{ color: colors.greenAccent?.[400] || colors.gray[300] }}>
						{String(shop.status).toUpperCase()}
					</Typography>
				) : null}
				{sellerId ? (
					<Button
						fullWidth
						size="small"
						variant={isPreferred ? "contained" : "outlined"}
						startIcon={isPreferred ? <CheckCircleOutline /> : <FavoriteBorder />}
						disabled={isPreferred || preferenceSaving}
						onClick={(event) => {
							event.stopPropagation();
							onPreference?.(shop);
						}}
						sx={{ mt: 1.25, borderRadius: 1, textTransform: "none", fontWeight: 800 }}
					>
						{preferenceSaving ? "Adding..." : isPreferred ? "Added to Preference" : "Add This Store to My Preference"}
					</Button>
				) : null}
			</CardContent>
		</Card>
	);
};

const HomeShopList = () => {
	const theme = useTheme();
	const colors = tokens(theme.palette.mode);
	const navigate = useNavigate();
	const rowRef = useRef(null);

	const [loading, setLoading] = useState(false);
	const [items, setItems] = useState([]);
	const [error, setError] = useState("");
	const [preferredSellerIds, setPreferredSellerIds] = useState(() => new Set());
	const [savingSellerId, setSavingSellerId] = useState(null);
	const [notice, setNotice] = useState({ open: false, severity: "success", message: "" });

	useEffect(() => {
		let mounted = true;
		const load = async () => {
			setLoading(true);
			setError("");
			try {
				const res = await getAllShops({ page: 1, per_page: 20 , status: "active"});
				const list = res?.data?.data ?? res?.data ?? res ?? [];
				if (mounted) setItems(safeArray(list));
			} catch (e) {
				console.error("load shops error:", e);
				if (mounted) {
					setItems([]);
					setError("Failed to load shops.");
				}
			} finally {
				if (mounted) setLoading(false);
			}
		};

		load();
		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
		if (!token) return;

		let mounted = true;
		const loadPreferredStores = async () => {
			const res = await getSellersByCustomer({ page: 1, per_page: 100 });
			if (res?.status === "error") return;
			const list = normalizePreferredSellerRows(res);
			if (!mounted) return;
			setPreferredSellerIds(new Set(list.map((id) => String(id)).filter(Boolean)));
		};
		loadPreferredStores();
		return () => {
			mounted = false;
		};
	}, []);

	const handleScroll = (dir) => {
		const el = rowRef.current;
		if (!el) return;
		const amount = Math.max(260, el.clientWidth * 0.8);
		el.scrollBy({ left: dir * amount, behavior: "smooth" });
	};

	const handleSeeAll = () => {
		navigate("/shops");
	};

	const handleViewShop = (shop) => {
		const slug = shop?.slug || shop?.store_slug || shop?.shop_slug;
		if (!slug) return;
		navigate(`/store/${slug}`);
	};

	const handleAddPreference = async (shop) => {
		const sellerId = shop?.user_id;
		if (!sellerId) return;

		const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
		if (!token) {
			sessionStorage.setItem("auth_redirect", `${window.location.pathname}${window.location.search}`);
			navigate("/login");
			return;
		}

		setSavingSellerId(sellerId);
		const res = await addSellerPreference(sellerId);
		setSavingSellerId(null);

		if (res?.status === "error") {
			const message =
				res?.statusCode === 403
					? "You do not have permission."
					: res?.statusCode === 404
						? "Customer or seller not found."
						: res?.statusCode === 422
							? "Please check this store preference request."
							: res?.message || "Failed to add store preference.";
			setNotice({ open: true, severity: "error", message });
			return;
		}

		setPreferredSellerIds((prev) => new Set([...prev, String(sellerId)]));
		setNotice({ open: true, severity: "success", message: res?.message || "Store added to preference" });
	};

	return (
		<Box sx={{ mt: 3 }}>
			<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1 }}>
				<Typography variant="h5" sx={{ fontWeight: 600 }}>
					Shops
				</Typography>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Button size="small" variant="text" onClick={handleSeeAll} sx={{ fontWeight: 700 ,color: colors.blueAccent[400]}}>
						See all shops
					</Button>
					<IconButton size="small" onClick={() => handleScroll(-1)}>
						<ChevronLeft fontSize="small" />
					</IconButton>
					<IconButton size="small" onClick={() => handleScroll(1)}>
						<ChevronRight fontSize="small" />
					</IconButton>
				</Box>
			</Box>

			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
					<CircularProgress size={24} />
				</Box>
			) : error ? (
				<Typography variant="body2" color="error">
					{error}
				</Typography>
			) : !items.length ? (
				<Typography variant="body2" sx={{ color: colors.gray[300] }}>
					No shops found.
				</Typography>
			) : (
				<Box
					ref={rowRef}
					sx={{
						display: "flex",
						gap: 2,
						overflowX: "auto",
						pb: 1,
						scrollBehavior: "smooth",
						"&::-webkit-scrollbar": { height: 8 },
						"&::-webkit-scrollbar-thumb": {
							background: theme.palette.mode === "dark" ? colors.primary[200] : colors.primary[300],
							borderRadius: 999,
						},
					}}
				>
					{items.map((shop) => (
						<Box key={shop?.id ?? Math.random()} sx={{ flex: "0 0 auto" }}>
							<ShopCard
								shop={shop}
								onView={handleViewShop}
								onPreference={handleAddPreference}
								isPreferred={preferredSellerIds.has(String(shop?.user_id))}
								preferenceSaving={String(savingSellerId) === String(shop?.user_id)}
							/>
						</Box>
					))}
				</Box>
			)}
			<Snackbar open={notice.open} autoHideDuration={3500} onClose={() => setNotice((prev) => ({ ...prev, open: false }))}>
				<Alert severity={notice.severity} variant="filled" onClose={() => setNotice((prev) => ({ ...prev, open: false }))}>
					{notice.message}
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default HomeShopList;
