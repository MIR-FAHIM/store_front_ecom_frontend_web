import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "@mui/material";
import {
	Box,
	Card,
	CardContent,
	Typography,
	Stepper,
	Step,
	StepLabel,
	Button,
	Divider,
	CircularProgress,
	Alert,
} from "@mui/material";
import { tokens } from "../../../../theme";
import {
	getProductDetails,
	updateProduct,
	uploadProductImages,
	addProductAttribute,
} from "../../../../api/controller/admin_controller/product/product_controller";
import { getAllShops } from "../../../../api/controller/admin_controller/shop/shop_controller.jsx";
import { getBrand } from "../../../../api/controller/admin_controller/product/setting_controller";
import { getProductCategoryDetails } from "../../../../api/controller/admin_controller/product/product_setting_controller.jsx";
import { fetchSellerMarketplaceCategories } from "../../../../api/controller/admin_controller/category/store_category_controller.jsx";
import { filterActiveCategoryTree, flattenCategoryTree, normalizeCategoryList } from "../../../../utils/categoryTree";
import { PRODUCT_WIZARD_STEPS } from "../add_product/components/productWizard/steps";
import StepGeneral from "../add_product/components/productWizard/StepGeneral";
import StepDiscountSeo from "../../../admin_panel/product/add_product/components/productWizard/StepDiscountSeo";
import StepAttributes from "../add_product/components/productWizard/StepAttributes";
import StepImages from "../add_product/components/productWizard/StepImages";

const DEFAULT_GENERAL = {
	name: "",
	slug: "",
	category_id: "",
	brand_id: "",
	user_id: "",
	shop_id: "",
	added_by: 1,
	description: "",
	unit_price: "",
	purchase_price: "",
	current_stock: "",
	variant_product: 0,
	todays_deal: 0,
	published: 0,
	approved: 1,
	featured: 0,
	refundable: 0,
	cash_on_delivery: 1,
	stock_visibility_state: 1,
	unit: "",
	weight: "",
	max_resell_price: "",
	// Discount
	discount_type: "flat",
	discount_value: "",
	discount_start_date: "",
	discount_end_date: "",
	// SEO
	short_description: "",
	meta_title: "",
	meta_description: "",
};

function EditProductSeller() {
	const theme = useTheme();
	const colors = tokens(theme.palette.mode);
	const navigate = useNavigate();
	const { id } = useParams();

	const [step, setStep] = useState(0);
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	const [errorMessage, setErrorMessage] = useState("");

	const [general, setGeneral] = useState(DEFAULT_GENERAL);
	const [attributes, setAttributes] = useState([]);
	const [images, setImages] = useState([]);

	const [categories, setCategories] = useState([]);
	const [brands, setBrands] = useState([]);
	const [shops, setShops] = useState([]);
	const [parentCategoryId, setParentCategoryId] = useState("");
	const [subCategories, setSubCategories] = useState([]);
	const [loadingSubCategories, setLoadingSubCategories] = useState(false);
	const categoryOptions = useMemo(
		() =>
			flattenCategoryTree(categories)
				.filter((category) => category?.is_active_for_store === true)
				.map((category) => ({
					...category,
					label: `${"  ".repeat(category.depth || 0)}${category.name || "Category"}`,
				})),
		[categories]
	);

	const normalizeList = (x) => {
		if (!x) return [];
		if (Array.isArray(x)) return x;
		if (Array.isArray(x?.data)) return x.data;
		if (Array.isArray(x?.data?.data)) return x.data.data;
		if (Array.isArray(x?.data?.data?.data)) return x.data.data.data;
		if (Array.isArray(x?.data?.items)) return x.data.items;
		if (Array.isArray(x?.data?.rows)) return x.data.rows;
		if (Array.isArray(x?.results)) return x.results;
		if (Array.isArray(x?.data?.results)) return x.data.results;
		const inner = x?.data ?? x;
		if (inner && typeof inner === "object") {
			for (const k of Object.keys(inner)) {
				if (Array.isArray(inner[k])) return inner[k];
			}
		}
		return [];
	};

	const resolveSellerStoreId = (shops = [], preferredId = "") => {
		if (preferredId) return preferredId;
		const storedId = localStorage.getItem("storeId") || localStorage.getItem("shopId");
		if (storedId) return storedId;
		return shops[0]?.id ? String(shops[0].id) : "";
	};

	const loadDropdowns = async () => {
		try {
			const [bRes, vRes] = await Promise.all([
				getBrand(),
				getAllShops(),
			]);

			const shops = normalizeList(vRes);
			const nextStoreId = resolveSellerStoreId(shops, general.shop_id);
			let activeCategories = [];
			if (nextStoreId) {
				const cRes = await fetchSellerMarketplaceCategories(nextStoreId);
				activeCategories = filterActiveCategoryTree(normalizeCategoryList(cRes));
			}

			setCategories(activeCategories);
			setBrands(normalizeList(bRes));
			setShops(shops);
		} catch (e) {
			console.error("Error loading dropdowns:", e);
			setCategories([]);
		}
	};

	const buildImageList = (product) => {
		const list = [];
		const primary = product?.primary_image || null;

		if (primary?.file_name || primary?.url) {
			list.push({
				file: null,
				media_id: primary?.id ?? primary?.media_id,
				file_name: primary?.file_name || primary?.url || "",
				filename: primary?.file_original_name || primary?.file_name || "",
				url: primary?.url || null,
				is_primary: true,
			});
		}

		const extra = Array.isArray(product?.images) ? product.images : [];
		extra.forEach((img) => {
			const upload = img?.upload || null;
			const mediaId = upload?.id ?? img?.id ?? img?.media_id;
			if (!mediaId) return;
			if (list.some((x) => String(x.media_id) === String(mediaId))) return;
			list.push({
				file: null,
				media_id: mediaId,
				file_name: upload?.file_name || upload?.url || img?.file_name || img?.image || "",
				filename:
					upload?.file_original_name ||
					upload?.file_name ||
					img?.file_original_name ||
					img?.file_name ||
					img?.image ||
					"",
				url: upload?.url || img?.url || null,
				is_primary: !!img?.is_primary,
			});
		});

		if (!list.length && product?.thumbnail_img) {
			list.push({
				file: null,
				media_id: product.thumbnail_img,
				file_name: "",
				filename: `media-${product.thumbnail_img}`,
				url: null,
				is_primary: true,
			});
		}

		if (list.length > 0 && !list.some((x) => x.is_primary)) {
			list[0].is_primary = true;
		}

		return list;
	};

	const loadProduct = async () => {
		if (!id) return;
		setFetching(true);
		setErrorMessage("");
		try {
			const resp = await getProductDetails(id);
			const product = resp?.data ?? resp;
			if (!product) {
				setErrorMessage("Unable to load product details.");
				return;
			}

			setGeneral({
				...DEFAULT_GENERAL,
				name: product?.name ?? "",
				slug: product?.slug ?? "",
				category_id: product?.category_id ?? "",
				brand_id: product?.brand_id ?? "",
				shop_id: product?.shop_id ?? product?.store_id ?? "",
				user_id: product?.user_id ?? localStorage.getItem("userId") ?? "",
				added_by: product?.added_by ?? localStorage.getItem("userId") ?? 1,
				description: product?.description ?? "",
				unit_price: product?.unit_price ?? "",
				purchase_price: product?.purchase_price ?? "",
				current_stock: product?.current_stock ?? "",
				variant_product: product?.variant_product ?? 0,
				todays_deal: product?.todays_deal ?? 0,
				published: product?.published ?? 0,
				approved: product?.approved ?? 1,
				featured: product?.featured ?? 0,
				refundable: product?.refundable ?? 0,
				cash_on_delivery: product?.cash_on_delivery ?? 1,
				stock_visibility_state:
					product?.stock_visibility_state === "quantity" ? 1 : (product?.stock_visibility_state ?? 1),
				unit: product?.unit ?? "",
				weight: product?.weight ?? "",
				max_resell_price: product?.max_resell_price ?? "",
				short_description: product?.short_description ?? "",
				meta_title: product?.meta_title ?? "",
				meta_description: product?.meta_description ?? "",
				// Discount — loaded directly from product columns
				discount_type: product?.discount_type === "amount" ? "flat" : (product?.discount_type ?? "flat"),
				discount_value: product?.discount ?? "",
				discount_start_date: product?.discount_start_date
					? new Date(product.discount_start_date * 1000).toISOString().slice(0, 10)
					: "",
				discount_end_date: product?.discount_end_date
					? new Date(product.discount_end_date * 1000).toISOString().slice(0, 10)
					: "",
			});

			setImages(buildImageList(product));

			const productStoreId = product?.shop_id ?? product?.store_id ?? "";
			if (productStoreId) {
				try {
					localStorage.setItem("storeId", String(productStoreId));
					const cRes = await fetchSellerMarketplaceCategories(productStoreId);
					setCategories(filterActiveCategoryTree(normalizeCategoryList(cRes)));
				} catch (e) {
					console.error("Failed to load product store categories:", e);
				}
			}

			const categoryId = product?.category_id;
			if (categoryId) {
				try {
					const categoryRes = await getProductCategoryDetails(categoryId);
					const category = categoryRes?.data ?? categoryRes;
					const parentId = category?.parent_id ? String(category.parent_id) : String(categoryId);
					setParentCategoryId(parentId);
				} catch (e) {
					console.error("Failed to load category details:", e);
					setParentCategoryId(String(categoryId));
				}
			}
		} catch (e) {
			console.error("Failed to load product:", e);
			setErrorMessage(e?.response?.data?.message || e.message || "Failed to load product");
		} finally {
			setFetching(false);
		}
	};

	useEffect(() => {
		loadDropdowns();
	}, []);

	useEffect(() => {
		loadProduct();
	}, [id]);

	useEffect(() => {
		const loadSubCategories = async () => {
			if (!parentCategoryId) {
				setSubCategories([]);
				return;
			}

			setLoadingSubCategories(true);
			try {
				const parent = categories.find((cat) => String(cat?.id ?? cat?._id) === String(parentCategoryId));
				const list = Array.isArray(parent?.children) ? parent.children : [];
				setSubCategories(list);
				setGeneral((prev) => {
					if (list.length === 0) return { ...prev, category_id: parentCategoryId };
					const exists = list.some((c) => String(c?.id ?? c?._id) === String(prev.category_id));
					return exists ? prev : { ...prev, category_id: "" };
				});
			} catch (e) {
				console.error("Error loading sub categories:", e);
				setSubCategories([]);
			} finally {
				setLoadingSubCategories(false);
			}
		};

		loadSubCategories();
	}, [parentCategoryId, categories]);

	const canGoBack = step > 0;
	const canGoNext = step < PRODUCT_WIZARD_STEPS.length - 1;

	const validateStep = (s) => {
		const nextErrors = {};

		if (s === 0) {
			if (!general.name || !general.name.trim()) nextErrors.name = "Product name is required";
			if (!general.slug || !general.slug.trim()) nextErrors.slug = "Slug is required";
			if (!general.category_id) nextErrors.category_id = "Category is required";
			if (!general.user_id) nextErrors.user_id = "User ID is required";
		}

		if (s === 1) {
			const discVal = parseFloat(general.discount_value);
			if (general.discount_value !== "" && general.discount_value !== undefined && !isNaN(discVal)) {
				if (discVal <= 0) nextErrors.discount_value = "Discount must be greater than 0";
				if (general.discount_type === "percent" && discVal > 100)
					nextErrors.discount_value = "Percentage discount cannot exceed 100%";
				const price = parseFloat(general.unit_price) || 0;
				if (general.discount_type === "flat" && price > 0 && discVal >= price)
					nextErrors.discount_value = "Flat discount cannot equal or exceed the unit price";
			}
			if (general.discount_start_date && general.discount_end_date) {
				if (new Date(general.discount_end_date) <= new Date(general.discount_start_date))
					nextErrors.discount_end_date = "End date must be after start date";
			}
		}

		if (s === 3) {
			if (images.length === 0) {
				nextErrors.images = "At least one image is required";
			} else {
				const primaryCount = images.filter((i) => i.is_primary).length;
				if (primaryCount !== 1) nextErrors.images = "Exactly one image must be primary";
			}
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleFinish = async () => {
		if (!validateStep(step)) return;
		if (!id) return;

		try {
			setLoading(true);
			setErrorMessage("");
			setSuccessMessage("");

			const productFormData = new FormData();
			productFormData.append("name", general.name);
			productFormData.append("slug", general.slug);
			productFormData.append("category_id", general.category_id);
			if (general.brand_id) productFormData.append("brand_id", general.brand_id);
			productFormData.append("added_by", general.added_by ?? 1);
			productFormData.append("user_id", general.user_id);
			productFormData.append("description", general.description || "");
			productFormData.append("unit_price", general.unit_price);
			productFormData.append("purchase_price", general.purchase_price);
			productFormData.append("current_stock", general.current_stock);
			productFormData.append("variant_product", general.variant_product ? 1 : 0);
			productFormData.append("todays_deal", general.todays_deal ? 1 : 0);
			productFormData.append("published", general.published ? 1 : 0);
			productFormData.append("approved", general.approved ? 1 : 0);
			productFormData.append("featured", general.featured ? 1 : 0);
			productFormData.append("refundable", general.refundable ? 1 : 0);
			productFormData.append("cash_on_delivery", general.cash_on_delivery ? 1 : 0);
			productFormData.append("stock_visibility_state", general.stock_visibility_state ? 1 : 0);
			productFormData.append("unit", general.unit || "");
			if (general.weight) productFormData.append("weight", general.weight);
			productFormData.append("max_resell_price", general.max_resell_price || "");
			if (general.short_description) productFormData.append("short_description", general.short_description);
			if (general.meta_title) productFormData.append("meta_title", general.meta_title);
			if (general.meta_description) productFormData.append("meta_description", general.meta_description);
			// Discount fields sent directly on product
			if (general.discount_value && parseFloat(general.discount_value) > 0) {
				productFormData.append("discount", general.discount_value);
				productFormData.append("discount_type", general.discount_type === "flat" ? "amount" : "percent");
				if (general.discount_start_date)
					productFormData.append("discount_start_date", Math.floor(new Date(general.discount_start_date).getTime() / 1000));
				if (general.discount_end_date)
					productFormData.append("discount_end_date", Math.floor(new Date(general.discount_end_date).getTime() / 1000));
			} else {
				productFormData.append("discount", "");
				productFormData.append("discount_type", "");
			}

			const mediaPhotos = images.filter((i) => i.media_id).map((i) => i.media_id);
			mediaPhotos.forEach((mid) => productFormData.append("photos[]", mid));

			const primaryMedia = images.find((i) => i.is_primary && i.media_id);
			if (primaryMedia) productFormData.append("thumbnail_img", primaryMedia.media_id);

			await updateProduct(id, productFormData);
     
			const imagesToUpload = images
				.filter((img) => img.file)
				.map((img) => ({ file: img.file, is_primary: img.is_primary }));

			if (imagesToUpload.length > 0) {
				await uploadProductImages(id, imagesToUpload);
			}

			if (attributes && attributes.length > 0) {
				for (const attr of attributes) {
					try {
						const fd = new FormData();
						fd.append("product_id", id);
						if (attr.attribute_id) fd.append("attribute_id", attr.attribute_id);
						if (attr.attribute_value_id) fd.append("attribute_value_id", attr.attribute_value_id);
						fd.append("stock", attr.stock ?? 0);
						await addProductAttribute(fd);
					} catch (err) {
						console.error("Failed to attach attribute to product:", err);
					}
				}
			}

			setSuccessMessage("Product updated successfully!");
			setTimeout(() => {
				navigate("/seller/shops");
			}, 1500);
		} catch (error) {
			console.error("Product update error:", error);
			const backendMessage = error.response?.data?.message || error.message || "Failed to update product";
			if (backendMessage === "This category is not active for your store.") {
				setErrors((prev) => ({ ...prev, category_id: backendMessage }));
			}
			setErrorMessage(backendMessage);
		} finally {
			setLoading(false);
		}
	};

	const stepView = useMemo(() => {
		if (step === 0) {
			return (
				<StepGeneral
					value={general}
					onChange={(patch) => setGeneral((prev) => ({ ...prev, ...patch }))}
					parentCategoryId={parentCategoryId}
					subCategories={subCategories}
					loadingSubCategories={loadingSubCategories}
					onParentCategoryChange={(nextId) => {
						setParentCategoryId(nextId);
						setGeneral((prev) => ({ ...prev, category_id: "" }));
					}}
					onSubCategoryChange={(nextId) => setGeneral((prev) => ({ ...prev, category_id: nextId }))}
					onOpenDropdown={loadDropdowns}
					errors={errors}
					categories={categories}
					categoryOptions={categoryOptions}
					brands={brands}
					shops={shops}
				/>
			);
		}

		if (step === 1) {
			return (
				<StepDiscountSeo
					value={general}
					onChange={(patch) => setGeneral((prev) => ({ ...prev, ...patch }))}
					errors={errors}
				/>
			);
		}

		if (step === 2) {
			return (
				<StepAttributes
					value={attributes}
					onAdd={(attr) => setAttributes((prev) => [...prev, attr])}
					onRemove={(idx) => setAttributes((prev) => prev.filter((_, i) => i !== idx))}
					productId={id}
				/>
			);
		}

		return (
			<StepImages
				value={images}
				error={errors.images}
				onAdd={(img) => setImages((prev) => [...prev, img])}
				onChange={setImages}
				onPrimary={(idx) => {
					setImages((prev) =>
						prev.map((x, i) => ({
							...x,
							is_primary: i === idx,
						}))
					);
				}}
			/>
		);
	}, [step, general, attributes, images, errors, categories, brands, shops]);

	return (
		<Box sx={{ p: 3 }}>
			<Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "start", gap: 2 }}>
				<Box>
					<Typography variant="h4" fontWeight={800}>
						Edit Product
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						Update product information and images.
					</Typography>
				</Box>

				<Button variant="outlined" onClick={() => navigate(-1)} disabled={loading}>
					Back
				</Button>
			</Box>

			{successMessage && (
				<Alert severity="success" sx={{ mb: 2 }}>
					{successMessage}
				</Alert>
			)}

			{errorMessage && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{errorMessage}
				</Alert>
			)}

			<Card sx={{ background: colors.primary[400], borderRadius: 2 }}>
				<CardContent>
					<Stepper activeStep={step} alternativeLabel>
						{PRODUCT_WIZARD_STEPS.map((s) => (
							<Step key={s.key}>
								<StepLabel>{s.label}</StepLabel>
							</Step>
						))}
					</Stepper>

					<Divider sx={{ my: 2, opacity: 0.2 }} />

					{fetching ? (
						<Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
							<CircularProgress />
						</Box>
					) : (
						stepView
					)}

					<Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", gap: 2 }}>
						<Button
							variant="outlined"
							disabled={!canGoBack || loading || fetching}
							onClick={() => setStep((s) => Math.max(0, s - 1))}
						>
							Previous
						</Button>

						{canGoNext ? (
							<Button
								variant="contained"
								disabled={loading || fetching}
								onClick={() => {
									if (!validateStep(step)) return;
									setStep((s) => Math.min(PRODUCT_WIZARD_STEPS.length - 1, s + 1));
								}}
							>
								Next
							</Button>
						) : (
							<Button
								variant="contained"
								disabled={loading || fetching}
								onClick={handleFinish}
								startIcon={loading ? <CircularProgress size={20} /> : null}
							>
								{loading ? "Updating..." : "Update"}
							</Button>
						)}
					</Box>
				</CardContent>
			</Card>
		</Box>
	);
}

export default EditProductSeller;
