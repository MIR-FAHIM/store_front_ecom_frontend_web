import React, { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Box,
	Card,
	CardContent,
	CircularProgress,
	Container,
	Tab,
	Tabs,
	Typography,
	useTheme,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import { tokens } from "../../../theme";
import { getShopDetails, updateShop, updateShopStatus } from "../../../api/controller/admin_controller/shop/shop_controller.jsx";
// Status options for shop
const statusOptions = [
	{ value: "active", label: "Active", color: "success" },
	{ value: "pending", label: "Pending", color: "info" },
	{ value: "suspended", label: "Suspended", color: "warning" },
	{ value: "banned", label: "Banned", color: "error" },
];

const StatusSelectChip = ({ shopId, status, onStatusChange }) => {
	const [selecting, setSelecting] = useState(false);
	const [current, setCurrent] = useState(status);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setCurrent(status);
	}, [status]);

	const handleStatusChange = async (newStatus) => {
		setLoading(true);
		try {
			const res = await updateShopStatus(shopId, { status: newStatus });
			if (res?.status === "success") {
				setCurrent(newStatus);
				onStatusChange?.(newStatus);
			} else {
				alert(res?.message || "Failed to update status");
			}
		} catch (e) {
			alert("Failed to update status");
		} finally {
			setLoading(false);
			setSelecting(false);
		}
	};

	const currentOption = statusOptions.find((opt) => opt.value === current) || { label: current, color: "default" };

	return selecting ? (
		<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
			{statusOptions.map((opt) => (
				<Card
					key={opt.value}
					sx={{
						display: "inline-block",
						p: 0.5,
						m: 0.2,
						background: opt.value === current ? "#eee" : undefined,
						border: opt.value === current ? "2px solid" : "1px solid #ccc",
						borderColor: opt.value === current ? "primary.main" : "#ccc",
						cursor: loading ? "not-allowed" : "pointer",
						opacity: loading ? 0.7 : 1,
					}}
					onClick={() => !loading && handleStatusChange(opt.value)}
				>
					<Typography variant="body2" color={opt.color} fontWeight={opt.value === current ? 700 : 400}>
						{opt.label}
					</Typography>
				</Card>
			))}
			<Card sx={{ display: "inline-block", p: 0.5, m: 0.2, cursor: "pointer" }} onClick={() => setSelecting(false)}>
				<Typography variant="body2">Cancel</Typography>
			</Card>
		</Box>
	) : (
		<Card
			sx={{ display: "inline-block", px: 2, py: 0.5, mb: 1, cursor: "pointer", border: "2px solid", borderColor: "primary.main" }}
			onClick={() => setSelecting(true)}
		>
			<Typography variant="body2" color={currentOption.color} fontWeight={700}>
				Status: {currentOption.label}
			</Typography>
		</Card>
	);
};
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
	status: "active",
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
						status: data?.status ?? "active",
					});
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
						{/* Status select chip */}
						<StatusSelectChip
						  shopId={shopId}
						  status={form.status}
						  onStatusChange={(newStatus) => setForm((prev) => ({ ...prev, status: newStatus }))}
						/>
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
