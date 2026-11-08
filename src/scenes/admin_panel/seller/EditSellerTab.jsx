import React, { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Box,
	Card,
	CardContent,
	CircularProgress,
	Container,
	MenuItem,
	Tab,
	Tabs,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import { tokens } from "../../../theme";
import { getShopStatus, shopStatusOptions } from "../../../utils/shopStatus";
import { getShopDetails, updateShop, updateShopStatus } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";
import ShopManageGeneral from "./components/ShopManageGeneral";
import ShopManageProducts from "./components/ShopManageProducts";
import ShopManageImages from "./components/ShopManageImages";
import ShopManageReviews from "./components/ShopManageReviews";
import ShopManageReport from "./components/ShopManageReport";

const defaultForm = {
	name: "",
	slug: "",
	description: "",
	phone: "",
	email: "",
	address: "",
	zone: "",
	district: "",
	area: "",
	lat: "",
	lon: "",
};

const ShopManage = () => {
	const theme = useTheme();
	const colors = tokens(theme.palette.mode);
	const navigate = useNavigate();
	const { id } = useParams();

	const [tab, setTab] = useState(0);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [form, setForm] = useState(defaultForm);
	const [shopStatus, setShopStatus] = useState(null);
	const [savingStatus, setSavingStatus] = useState(false);
	const [logo, setLogo] = useState(null);
	const [banner, setBanner] = useState(null);

	const shopId = useMemo(() => id, [id]);

	useEffect(() => {
		if (!shopId) return;
		let mounted = true;

		const load = async () => {
			setLoading(true);
			setError("");
			try {
				const res = await getShopDetails(shopId);
				if (res?.status === "success" && mounted) {
					const data = res?.data ?? {};
					setForm({
						name: data?.name ?? "",
						slug: data?.slug ?? "",
						description: data?.description ?? "",
						phone: data?.phone ?? "",
						email: data?.email ?? "",
						address: data?.address ?? "",
						zone: data?.zone ?? "",
						district: data?.district ?? "",
						area: data?.area ?? "",
						lat: data?.lat ?? "",
						lon: data?.lon ?? "",
					});
					setShopStatus({ shopId, status: data?.status ?? "" });
					setLogo(data?.logo ?? null);
					setBanner(data?.banner ?? null);
				} else if (mounted) {
					setError(res?.message || "Failed to load shop details.");
				}
			} catch (err) {
				if (mounted) setError(err?.message || "Failed to load shop details.");
			} finally {
				if (mounted) setLoading(false);
			}
		};

		load();
		return () => {
			mounted = false;
		};
	}, [shopId]);

	const updateField = (key, value) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const handleChangeShopStatus = async (status) => {
		if (loading || savingStatus || shopStatus?.shopId !== shopId || shopStatus.status === status) return;
		setSavingStatus(true);
		setError("");
		setSuccess("");
		try {
			const response = await updateShopStatus(shopId, { status });
			if (response?.status !== "success" || typeof response.data?.status !== "string") {
				setError(response?.message || "Failed to update shop status.");
				return;
			}
			setShopStatus((prev) => prev?.shopId === shopId ? { shopId, status: response.data.status } : prev);
			setSuccess(response.message || "Shop status updated successfully.");
		} finally {
			setSavingStatus(false);
		}
	};

	const statusOption = getShopStatus(shopStatus?.shopId === shopId ? shopStatus.status : "");

	const handleSave = async () => {
		if (!shopId) return;
		setSaving(true);
		setError("");
		setSuccess("");
		try {
			const fd = new FormData();
			Object.entries(form).forEach(([key, value]) => {
				if (value !== undefined && value !== null && String(value).length > 0) {
					fd.append(key, value);
				}
			});
			if (logo?.id) fd.append("logo", logo.id);
			if (banner?.id) fd.append("banner", banner.id);

			const res = await updateShop(shopId, fd);
			if (res?.status === "success") {
				setSuccess(res?.message || "Shop updated successfully.");
			} else {
				setError(res?.message || "Failed to update shop.");
			}
		} catch (err) {
			setError(err?.message || "Failed to update shop.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Box sx={{ minHeight: "100vh", background: colors.primary[500], py: 3 }}>
			<Container maxWidth="lg">
				<Box sx={{ mb: 2 }}>
					<Typography variant="h4" sx={{ fontWeight: 900 }}>
						Shop Manage
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Manage shop information, images, and more.
					</Typography>
				</Box>

				{error ? (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				) : null}
				{success ? (
					<Alert severity="success" sx={{ mb: 2 }}>
						{success}
					</Alert>
				) : null}

				<Card sx={{ background: colors.primary[400], borderRadius: 2 }}>
					<CardContent>
						<TextField
							select
							size="small"
							label="Shop Status"
							value={statusOption.value}
							onChange={(event) => handleChangeShopStatus(event.target.value)}
							disabled={loading || savingStatus || shopStatus?.shopId !== shopId}
							InputLabelProps={{ shrink: true }}
							SelectProps={{ displayEmpty: true }}
							sx={{ minWidth: 148, mb: 1 }}
						>
							{!statusOption.value && <MenuItem value="" disabled>{statusOption.label}</MenuItem>}
							{shopStatusOptions.map(({ value, label }) => (
								<MenuItem key={value} value={value}>{label}</MenuItem>
							))}
						</TextField>
						<Tabs
							value={tab}
							onChange={(_, value) => setTab(value)}
							textColor="inherit"
							indicatorColor="secondary"
							sx={{ mb: 2 }}
						>
							<Tab label="General Info" />
							<Tab label="Products" />
							<Tab label="Images" />
							<Tab label="Reviews" />
							<Tab label="Report" />
						</Tabs>

						{loading ? (
							<Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
								<CircularProgress />
							</Box>
						) : (
							<Box>
								{tab === 0 ? (
									<ShopManageGeneral form={form} onChange={updateField} onSave={handleSave} saving={saving} />
								) : null}

								{tab === 1 ? (
									<ShopManageProducts
										shopId={shopId}
										shopSlug={form.slug}
										onOpenShop={(sid) => navigate(`/ecom/product/all?shop_id=${sid}`)}
									/>
								) : null}

								{tab === 2 ? (
									<ShopManageImages
										logo={logo}
										banner={banner}
										onSelectLogo={(item) => setLogo(item)}
										onSelectBanner={(item) => setBanner(item)}
									/>
								) : null}

								{tab === 3 ? <ShopManageReviews /> : null}
								{tab === 4 ? <ShopManageReport /> : null}
							</Box>
						)}
					</CardContent>
				</Card>
			</Container>
		</Box>
	);
};

export default ShopManage;
