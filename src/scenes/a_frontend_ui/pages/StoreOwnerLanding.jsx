import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LanguageIcon from "@mui/icons-material/Language";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import { getSubscriptionPackages } from "../../../api/controller/admin_controller/subscription_package/subscription_package_controller";
import commissionBanner from "../../../assets/banner/new-web-banner--1.png";
import storeOrderBanner from "../../../assets/banner/new-web-banner--2.png";
import deliveryBanner from "../../../assets/banner/new-web-banner--3.png";
import brandLogoBlue from "../../../assets/logo/store_myzoo_logo_blue.png";
import brandLogoWhite from "../../../assets/logo/store_myzoo_white.png";

const normalizePackages = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const normalizeFeatures = (features) => {
  if (Array.isArray(features)) return features;
  if (typeof features !== "string") return [];
  try {
    const parsed = JSON.parse(features);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Use comma split fallback.
  }
  return features.split(",").map((item) => item.trim()).filter(Boolean);
};

const formatMoney = (pkg) =>
  `${pkg?.currency || "BDT"} ${Number(pkg?.price || 0).toLocaleString("en-BD")}`;

const formatLimit = (value, suffix, unlimitedLabel) => {
  if (value === null || value === undefined || value === "") return `${unlimitedLabel} ${suffix}`;
  return `${Number(value).toLocaleString("en-BD")} ${suffix}`;
};

const copy = {
  en: {
    navSubtitle: "Store-first commerce",
    login: "Login",
    start: "Start free",
    heroBadge: "Built for local store owners",
    heroTitle: "Open your smart online store and sell from your own storefront.",
    heroText:
      "Create a branded store, organize products, activate categories, manage orders, and share one clean link with your customers.",
    primaryCta: "Create seller account",
    secondaryCta: "View packages",
    trial: "Start 3 Days Trial",
    heroStats: [
      ["10 min", "Store setup"],
      ["Own URL", "Public storefront"],
      ["COD + Online", "Payment flow"],
      ["Pickup + Delivery", "Fulfillment"],
    ],
    previewTitle: "Your store page, product catalog, and seller dashboard work together.",
    previewItems: ["Store banner", "Active categories", "Store products only", "Fast checkout"],
    stepsLabel: "How it works",
    stepsTitle: "From offline counter to online orders",
    stepsText: "A simple path for store owners who want online sales without managing a separate technical project.",
    steps: [
      "Create your seller account",
      "Choose a subscription package",
      "Setup profile, banner, products, and categories",
      "Share your public store URL and receive orders",
    ],
    toolsLabel: "Store tools",
    toolsTitle: "Everything a local store needs to sell online",
    toolsText: "Store owner experience first. Marketplace discovery can help, but the store remains the main business.",
    packagesLabel: "Subscription packages",
    packagesTitle: "Choose a plan and unlock your seller dashboard",
    packagesText: "Every package is built for storefronts, product management, orders, reports, and future growth tools.",
    loadingPackages: "Loading packages...",
    noPackages: "No active subscription packages found yet.",
    packageFallback: "A practical package for growing your online store.",
    mostPopular: "Most Popular",
    featured: "Featured",
    choosePackage: "Choose Package",
    trialDays: "trial days",
    products: "products",
    orders: "orders",
    staff: "staff",
    branches: "branches",
    commission: "commission",
    unlimited: "Unlimited",
    growthBadge: "Marketplace plus own store",
    growthTitle: "Sell from your own storefront and stay discoverable.",
    growthText:
      "Customers can browse your store, check products, place orders, and choose delivery or pickup. You manage everything from one seller dashboard.",
    checklist: [
      "Store profile and public storefront",
      "Product, category, and brand management",
      "Order dashboard and customer details",
      "Payment, delivery, and pickup settings",
      "Reports, support, and future integrations",
    ],
    integrationTitle: "Ready for payments, courier, and growth integrations.",
    integrationText: "Start simple. Add payment gateways, courier support, reports, and subscription features as your store grows.",
    templatesLabel: "Store look",
    templatesTitle: "Launch with banners made for mobile shoppers",
    templatesText: "Use a storefront layout that puts products, categories, offers, and checkout-friendly actions in front.",
    templateCards: [
      ["Order from your store", "Guide customers to products and fast order actions."],
      ["Delivery support", "Show delivery, pickup, and fulfillment messages clearly."],
      ["Promotion ready", "Run campaigns with smart banners and package offers."],
    ],
    finalTitle: "Build your store today. Start selling from your own link.",
    finalText: "Pick a package, activate your merchant dashboard, and bring your local store online.",
    support: "Talk to support",
    footerText: "A store-first SaaS commerce platform with marketplace discovery.",
  },
  bn: {
    navSubtitle: "স্টোর-ফার্স্ট কমার্স",
    login: "লগইন",
    start: "ফ্রি শুরু করুন",
    heroBadge: "লোকাল দোকান মালিকদের জন্য",
    heroTitle: "আপনার স্মার্ট অনলাইন স্টোর চালু করুন এবং নিজের স্টোরফ্রন্ট থেকে বিক্রি করুন।",
    heroText:
      "ব্র্যান্ডেড স্টোর তৈরি করুন, প্রোডাক্ট সাজান, ক্যাটাগরি চালু করুন, অর্ডার ম্যানেজ করুন এবং কাস্টমারকে একটি সুন্দর স্টোর লিংক দিন।",
    primaryCta: "সেলার অ্যাকাউন্ট তৈরি করুন",
    secondaryCta: "প্যাকেজ দেখুন",
    trial: "৩ দিনের ট্রায়াল শুরু করুন",
    heroStats: [
      ["১০ মিনিট", "স্টোর সেটআপ"],
      ["নিজস্ব URL", "পাবলিক স্টোরফ্রন্ট"],
      ["COD + Online", "পেমেন্ট ফ্লো"],
      ["Pickup + Delivery", "ডেলিভারি ব্যবস্থা"],
    ],
    previewTitle: "আপনার স্টোর পেজ, প্রোডাক্ট ক্যাটালগ এবং সেলার ড্যাশবোর্ড একসাথে কাজ করবে।",
    previewItems: ["স্টোর ব্যানার", "অ্যাকটিভ ক্যাটাগরি", "শুধু আপনার প্রোডাক্ট", "দ্রুত চেকআউট"],
    stepsLabel: "কিভাবে কাজ করে",
    stepsTitle: "অফলাইন কাউন্টার থেকে অনলাইন অর্ডার",
    stepsText: "যারা আলাদা টেকনিক্যাল প্রজেক্ট ছাড়াই অনলাইনে বিক্রি শুরু করতে চান, তাদের জন্য সহজ পথ।",
    steps: [
      "সেলার অ্যাকাউন্ট তৈরি করুন",
      "সাবস্ক্রিপশন প্যাকেজ বেছে নিন",
      "প্রোফাইল, ব্যানার, প্রোডাক্ট এবং ক্যাটাগরি সেটআপ করুন",
      "পাবলিক স্টোর URL শেয়ার করুন এবং অর্ডার নিন",
    ],
    toolsLabel: "স্টোর টুলস",
    toolsTitle: "লোকাল স্টোরের অনলাইন বিক্রির জন্য দরকারি সবকিছু",
    toolsText: "প্রথম ফোকাস স্টোর মালিকের অভিজ্ঞতা। মার্কেটপ্লেস ডিসকভারি সাহায্য করবে, কিন্তু মূল ব্যবসা আপনার স্টোর।",
    packagesLabel: "সাবস্ক্রিপশন প্যাকেজ",
    packagesTitle: "প্ল্যান বেছে নিন এবং সেলার ড্যাশবোর্ড আনলক করুন",
    packagesText: "প্রতিটি প্যাকেজ স্টোরফ্রন্ট, প্রোডাক্ট ম্যানেজমেন্ট, অর্ডার, রিপোর্ট এবং গ্রোথ টুলসের জন্য তৈরি।",
    loadingPackages: "প্যাকেজ লোড হচ্ছে...",
    noPackages: "এখনও কোনো অ্যাকটিভ সাবস্ক্রিপশন প্যাকেজ পাওয়া যায়নি।",
    packageFallback: "আপনার অনলাইন স্টোর বাড়ানোর জন্য ব্যবহারিক প্যাকেজ।",
    mostPopular: "সবচেয়ে জনপ্রিয়",
    featured: "ফিচার্ড",
    choosePackage: "প্যাকেজ নির্বাচন করুন",
    trialDays: "ট্রায়াল দিন",
    products: "প্রোডাক্ট",
    orders: "অর্ডার",
    staff: "স্টাফ",
    branches: "ব্রাঞ্চ",
    commission: "কমিশন",
    unlimited: "আনলিমিটেড",
    growthBadge: "মার্কেটপ্লেস ও নিজের স্টোর",
    growthTitle: "নিজের স্টোরফ্রন্ট থেকে বিক্রি করুন এবং ডিসকভারেবল থাকুন।",
    growthText:
      "কাস্টমার আপনার স্টোর ব্রাউজ করবে, প্রোডাক্ট দেখবে, অর্ডার করবে এবং ডেলিভারি বা পিকআপ বেছে নেবে। সবকিছু এক সেলার ড্যাশবোর্ডে ম্যানেজ করুন।",
    checklist: [
      "স্টোর প্রোফাইল এবং পাবলিক স্টোরফ্রন্ট",
      "প্রোডাক্ট, ক্যাটাগরি এবং ব্র্যান্ড ম্যানেজমেন্ট",
      "অর্ডার ড্যাশবোর্ড এবং কাস্টমার ডিটেইলস",
      "পেমেন্ট, ডেলিভারি এবং পিকআপ সেটিংস",
      "রিপোর্ট, সাপোর্ট এবং ভবিষ্যৎ ইন্টিগ্রেশন",
    ],
    integrationTitle: "পেমেন্ট, কুরিয়ার এবং গ্রোথ ইন্টিগ্রেশনের জন্য প্রস্তুত।",
    integrationText: "সহজভাবে শুরু করুন। স্টোর বড় হলে পেমেন্ট গেটওয়ে, কুরিয়ার, রিপোর্ট এবং সাবস্ক্রিপশন ফিচার যোগ করুন।",
    templatesLabel: "স্টোর লুক",
    templatesTitle: "মোবাইল শপারদের জন্য সুন্দর ব্যানার দিয়ে লঞ্চ করুন",
    templatesText: "প্রোডাক্ট, ক্যাটাগরি, অফার এবং চেকআউট অ্যাকশন সামনে রাখে এমন স্টোরফ্রন্ট লেআউট ব্যবহার করুন।",
    templateCards: [
      ["আপনার স্টোর থেকে অর্ডার", "কাস্টমারকে প্রোডাক্ট এবং দ্রুত অর্ডার অ্যাকশনে নিয়ে যান।"],
      ["ডেলিভারি সাপোর্ট", "ডেলিভারি, পিকআপ এবং ফুলফিলমেন্ট মেসেজ পরিষ্কারভাবে দেখান।"],
      ["প্রমোশন প্রস্তুত", "স্মার্ট ব্যানার এবং প্যাকেজ অফার দিয়ে ক্যাম্পেইন চালান।"],
    ],
    finalTitle: "আজই আপনার স্টোর তৈরি করুন। নিজের লিংক থেকে বিক্রি শুরু করুন।",
    finalText: "প্যাকেজ বেছে নিন, মার্চেন্ট ড্যাশবোর্ড চালু করুন এবং লোকাল স্টোরকে অনলাইনে আনুন।",
    support: "সাপোর্টে কথা বলুন",
    footerText: "মার্কেটপ্লেস ডিসকভারি সহ স্টোর-ফার্স্ট SaaS কমার্স প্ল্যাটফর্ম।",
  },
};

const featureIcons = [
  StorefrontOutlinedIcon,
  Inventory2OutlinedIcon,
  DashboardCustomizeOutlinedIcon,
  PaymentsOutlinedIcon,
  LocalShippingOutlinedIcon,
  QueryStatsOutlinedIcon,
];

const featureCopy = {
  en: [
    ["Online storefront", "Get a branded store page with banner, logo, categories, products, and shareable store URL."],
    ["Product catalog", "Manage products, stock, prices, discounts, categories, brands, and visibility from one dashboard."],
    ["Order management", "See new orders fast, update status, track payment, and keep customer information organized."],
    ["Payment ready", "Accept online payment options through supported payment gateway flows when your store is ready."],
    ["Delivery or pickup", "Offer merchant delivery, pickup, local settings, and courier support as the business grows."],
    ["Reports", "Track sales, products, orders, payments, and store growth with useful dashboard insights."],
  ],
  bn: [
    ["অনলাইন স্টোরফ্রন্ট", "ব্যানার, লোগো, ক্যাটাগরি, প্রোডাক্ট এবং শেয়ারযোগ্য URL সহ ব্র্যান্ডেড স্টোর পেজ।"],
    ["প্রোডাক্ট ক্যাটালগ", "এক ড্যাশবোর্ডে প্রোডাক্ট, স্টক, দাম, ডিসকাউন্ট, ক্যাটাগরি, ব্র্যান্ড এবং ভিজিবিলিটি ম্যানেজ করুন।"],
    ["অর্ডার ম্যানেজমেন্ট", "নতুন অর্ডার দ্রুত দেখুন, স্ট্যাটাস আপডেট করুন, পেমেন্ট ট্র্যাক করুন এবং কাস্টমার তথ্য রাখুন।"],
    ["পেমেন্ট রেডি", "স্টোর প্রস্তুত হলে সাপোর্টেড পেমেন্ট গেটওয়ের মাধ্যমে অনলাইন পেমেন্ট নিন।"],
    ["ডেলিভারি বা পিকআপ", "মার্চেন্ট ডেলিভারি, পিকআপ, লোকাল সেটিংস এবং ভবিষ্যৎ কুরিয়ার সাপোর্ট দিন।"],
    ["রিপোর্ট", "সেলস, প্রোডাক্ট, অর্ডার, পেমেন্ট এবং স্টোর গ্রোথ ইনসাইট দেখুন।"],
  ],
};

const integrations = ["AamarPay", "bKash", "Nagad", "SSLCOMMERZ", "Pathao", "SteadFast"];
const templateBanners = [storeOrderBanner, deliveryBanner, commissionBanner];

const SectionTitle = ({ label, title, text }) => (
  <Stack spacing={1.2} sx={{ maxWidth: 760, mx: "auto", textAlign: "center", mb: { xs: 3.5, md: 5 } }}>
    <Chip
      label={label}
      sx={{
        alignSelf: "center",
        borderRadius: 1,
        bgcolor: "#eef2ff",
        color: "#1d4ed8",
        border: "1px solid #dbeafe",
        fontWeight: 900,
      }}
    />
    <Typography variant="h3" sx={{ fontWeight: 950, color: "#111827", lineHeight: 1.08, letterSpacing: 0 }}>
      {title}
    </Typography>
    <Typography sx={{ color: "#64748b", fontSize: { xs: 15, md: 17 }, lineHeight: 1.75 }}>
      {text}
    </Typography>
  </Stack>
);

const StoreOwnerLanding = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState("");

  const lang = i18n.language?.startsWith("bn") ? "bn" : "en";
  const t = copy[lang];
  const features = useMemo(
    () => featureCopy[lang].map(([title, text], index) => ({ title, text, Icon: featureIcons[index] })),
    [lang]
  );

  useEffect(() => {
    const loadPackages = async () => {
      setPackagesLoading(true);
      setPackagesError("");
      try {
        const response = await getSubscriptionPackages({ status: "active", all: 1 });
        setPackages(normalizePackages(response));
      } catch (error) {
        setPackagesError(error?.response?.data?.message || "Subscription packages are unavailable right now.");
      } finally {
        setPackagesLoading(false);
      }
    };
    loadPackages();
  }, []);

  const setLanguage = (nextLang) => {
    i18n.changeLanguage(nextLang);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", color: "#111827" }}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          bgcolor: "rgba(255,255,255,0.94)",
          borderBottom: "1px solid #e2e8f0",
          backdropFilter: "blur(12px)",
        }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.2 }} spacing={2}>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
              <Box component="img" src={brandLogoBlue} alt="MyZoo Stores" sx={{ width: { xs: 82, sm: 96 }, height: 40, objectFit: "contain" }} />
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography sx={{ fontWeight: 950, lineHeight: 1 }}>MyZoo Stores</Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
                  {t.navSubtitle}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Stack direction="row" spacing={0.5} sx={{ p: 0.4, border: "1px solid #dbeafe", borderRadius: 1, bgcolor: "#eff6ff" }}>
                {[
                  ["en", "EN"],
                  ["bn", "বাংলা"],
                ].map(([code, label]) => (
                  <Button
                    key={code}
                    size="small"
                    startIcon={code === lang ? <LanguageIcon sx={{ fontSize: 14 }} /> : null}
                    onClick={() => setLanguage(code)}
                    sx={{
                      minWidth: { xs: code === "bn" ? 64 : 42, sm: code === "bn" ? 78 : 52 },
                      borderRadius: 0.8,
                      px: { xs: 0.8, sm: 1.2 },
                      py: 0.45,
                      textTransform: "none",
                      fontWeight: 950,
                      fontSize: 12,
                      bgcolor: code === lang ? "#1d4ed8" : "transparent",
                      color: code === lang ? "#fff" : "#1e3a8a",
                      "&:hover": { bgcolor: code === lang ? "#1d4ed8" : "#dbeafe" },
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Stack>
              <Button onClick={() => navigate("/seller-login")} sx={{ display: { xs: "none", md: "inline-flex" }, textTransform: "none", fontWeight: 900 }}>
                {t.login}
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/seller-register")}
                sx={{ borderRadius: 1, textTransform: "none", fontWeight: 950, bgcolor: "#111827", px: { xs: 1.4, sm: 2 } }}
              >
                {t.start}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box
        sx={{
          minHeight: { xs: "calc(100vh - 66px)", md: 720 },
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#0f172a",
          backgroundImage: "linear-gradient(135deg, #0f172a 0%, #102a43 46%, #0f766e 100%)",
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 7, md: 10 }, position: "relative", zIndex: 1 }}>
          <Grid container spacing={{ xs: 4, md: 7 }} alignItems="center">
            <Grid item xs={12} md={6.5}>
              <Stack spacing={2.4} sx={{ color: "#fff", maxWidth: 760 }}>
                <Chip
                  label={t.heroBadge}
                  sx={{
                    alignSelf: "flex-start",
                    borderRadius: 1,
                    bgcolor: "rgba(34,197,94,0.16)",
                    color: "#bbf7d0",
                    border: "1px solid rgba(187,247,208,0.28)",
                    fontWeight: 950,
                  }}
                />
                <Typography
                  variant="h1"
                  sx={{ fontWeight: 950, fontSize: { xs: 38, sm: 52, md: 72 }, lineHeight: 0.98, letterSpacing: 0 }}
                >
                  {t.heroTitle}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.78)", fontSize: { xs: 16, md: 20 }, lineHeight: 1.72, maxWidth: 660 }}>
                  {t.heroText}
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4}>
                  <Button
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate("/seller-register")}
                    sx={{ borderRadius: 1, py: 1.35, px: 2.4, textTransform: "none", fontWeight: 950, bgcolor: "#22c55e", color: "#052e16" }}
                  >
                    {t.primaryCta}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}
                    sx={{ borderRadius: 1, py: 1.35, px: 2.4, textTransform: "none", fontWeight: 950, color: "#fff", borderColor: "rgba(255,255,255,0.46)" }}
                  >
                    {t.secondaryCta}
                  </Button>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5.5}>
              <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 1.2, bgcolor: "rgba(255,255,255,0.92)", border: "1px solid rgba(255,255,255,0.48)", boxShadow: "0 24px 70px rgba(15,23,42,0.26)" }}>
                <Box component="img" src={storeOrderBanner} alt="Storefront preview" sx={{ width: "100%", display: "block", borderRadius: 1, aspectRatio: "16 / 10", objectFit: "cover" }} />
                <Stack spacing={1.7} sx={{ pt: 2 }}>
                  <Typography sx={{ fontWeight: 950, fontSize: { xs: 18, md: 22 }, lineHeight: 1.25 }}>
                    {t.previewTitle}
                  </Typography>
                  <Grid container spacing={1}>
                    {t.previewItems.map((item) => (
                      <Grid item xs={6} key={item}>
                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 1, p: 1 }}>
                          <CheckCircleOutlineIcon sx={{ color: "#16a34a", fontSize: 18 }} />
                          <Typography sx={{ fontWeight: 850, fontSize: 13 }}>{item}</Typography>
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: { xs: -3, md: -5 }, position: "relative", zIndex: 2 }}>
        <Grid container spacing={1.5}>
          {t.heroStats.map(([value, label]) => (
            <Grid item xs={6} md={3} key={label}>
              <Paper elevation={0} sx={{ p: { xs: 1.7, md: 2.3 }, borderRadius: 1, border: "1px solid #e2e8f0", boxShadow: "0 14px 32px rgba(15,23,42,0.08)" }}>
                <Typography sx={{ fontSize: { xs: 23, md: 31 }, fontWeight: 950, color: "#0f766e", lineHeight: 1 }}>{value}</Typography>
                <Typography sx={{ color: "#64748b", fontWeight: 850, mt: 0.7 }}>{label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="xl">
          <SectionTitle label={t.stepsLabel} title={t.stepsTitle} text={t.stepsText} />
          <Grid container spacing={2}>
            {t.steps.map((step, index) => (
              <Grid item xs={12} sm={6} md={3} key={step}>
                <Paper elevation={0} sx={{ p: 2.4, borderRadius: 1, border: "1px solid #e2e8f0", height: "100%", bgcolor: "#fff" }}>
                  <Typography sx={{ color: "#2563eb", fontWeight: 950, fontSize: 34, lineHeight: 1 }}>0{index + 1}</Typography>
                  <Typography sx={{ mt: 1.3, fontWeight: 950, fontSize: 18, lineHeight: 1.28 }}>{step}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 }, bgcolor: "#fff" }}>
        <Container maxWidth="xl">
          <SectionTitle label={t.toolsLabel} title={t.toolsTitle} text={t.toolsText} />
          <Grid container spacing={2}>
            {features.map(({ title, text, Icon }) => (
              <Grid item xs={12} sm={6} md={4} key={title}>
                <Paper elevation={0} sx={{ p: 2.6, borderRadius: 1, border: "1px solid #e2e8f0", height: "100%", transition: "transform .18s ease, box-shadow .18s ease", "&:hover": { transform: "translateY(-4px)", boxShadow: "0 18px 42px rgba(15,23,42,0.09)" } }}>
                  <Box sx={{ width: 46, height: 46, borderRadius: 1, display: "grid", placeItems: "center", bgcolor: "#ecfdf5", color: "#059669", mb: 1.8 }}>
                    <Icon />
                  </Box>
                  <Typography sx={{ fontWeight: 950, fontSize: 20 }}>{title}</Typography>
                  <Typography sx={{ color: "#64748b", mt: 1, lineHeight: 1.68 }}>{text}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box component="section" id="packages" sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="xl">
          <SectionTitle label={t.packagesLabel} title={t.packagesTitle} text={t.packagesText} />
          {packagesLoading ? (
            <Box sx={{ py: 6, display: "grid", placeItems: "center", gap: 1.2 }}>
              <CircularProgress />
              <Typography sx={{ color: "#64748b", fontWeight: 800 }}>{t.loadingPackages}</Typography>
            </Box>
          ) : packagesError ? (
            <Alert severity="warning" sx={{ borderRadius: 1 }}>{packagesError}</Alert>
          ) : packages.length ? (
            <Grid container spacing={2.5} alignItems="stretch">
              {packages.map((pkg) => {
                const popular = Boolean(pkg.is_popular);
                const featured = Boolean(pkg.is_featured);
                const pkgFeatures = normalizeFeatures(pkg.features);
                return (
                  <Grid item xs={12} md={4} key={pkg.id}>
                    <Paper elevation={0} sx={{ height: "100%", borderRadius: 1, border: `1px solid ${popular ? "#2563eb" : "#e2e8f0"}`, boxShadow: popular ? "0 24px 58px rgba(37,99,235,0.16)" : "0 10px 28px rgba(15,23,42,0.04)", overflow: "hidden", bgcolor: "#fff" }}>
                      {popular ? <Box sx={{ bgcolor: "#2563eb", color: "#fff", py: 0.9, textAlign: "center", fontWeight: 950, fontSize: 12 }}>{t.mostPopular}</Box> : null}
                      <Stack spacing={2} sx={{ p: 2.6 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box sx={{ width: 46, height: 46, borderRadius: 1, bgcolor: featured ? "#ecfdf5" : "#eef2ff", color: featured ? "#059669" : "#2563eb", display: "grid", placeItems: "center" }}>
                            {featured ? <RocketLaunchOutlinedIcon /> : <WorkspacePremiumOutlinedIcon />}
                          </Box>
                          {featured ? <Chip size="small" label={t.featured} color="success" variant="outlined" sx={{ fontWeight: 850 }} /> : null}
                        </Stack>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 950, color: "#111827" }}>{pkg.name}</Typography>
                          <Typography sx={{ color: "#64748b", mt: 0.7, minHeight: 48, lineHeight: 1.55 }}>{pkg.short_description || t.packageFallback}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="h3" sx={{ fontWeight: 950, color: "#111827", letterSpacing: 0 }}>{formatMoney(pkg)}</Typography>
                          <Typography sx={{ color: "#64748b", fontWeight: 850 }}>/{pkg.billing_cycle || "monthly"}</Typography>
                        </Box>
                        <Divider />
                        <Grid container spacing={1}>
                          <Grid item xs={6}><Chip label={`${pkg.trial_days || 0} ${t.trialDays}`} sx={{ width: "100%", fontWeight: 800 }} /></Grid>
                          <Grid item xs={6}><Chip label={formatLimit(pkg.max_products, t.products, t.unlimited)} sx={{ width: "100%", fontWeight: 800 }} /></Grid>
                          <Grid item xs={6}><Chip label={formatLimit(pkg.max_orders_per_month, t.orders, t.unlimited)} sx={{ width: "100%", fontWeight: 800 }} /></Grid>
                          <Grid item xs={6}><Chip label={formatLimit(pkg.max_staff, t.staff, t.unlimited)} sx={{ width: "100%", fontWeight: 800 }} /></Grid>
                          <Grid item xs={6}><Chip label={formatLimit(pkg.max_branches, t.branches, t.unlimited)} sx={{ width: "100%", fontWeight: 800 }} /></Grid>
                          <Grid item xs={6}><Chip label={`${pkg.commission_rate ?? 0}% ${t.commission}`} sx={{ width: "100%", fontWeight: 800 }} /></Grid>
                        </Grid>
                        {pkgFeatures.length ? (
                          <Stack spacing={1}>
                            {pkgFeatures.slice(0, 6).map((feature, index) => (
                              <Stack direction="row" spacing={1} alignItems="flex-start" key={`${pkg.id}-${index}`}>
                                <CheckCircleOutlineIcon sx={{ color: "#059669", fontSize: 19, mt: 0.15 }} />
                                <Typography variant="body2" sx={{ color: "#334155", fontWeight: 750, lineHeight: 1.55 }}>{feature}</Typography>
                              </Stack>
                            ))}
                          </Stack>
                        ) : null}
                        <Button fullWidth variant={popular ? "contained" : "outlined"} endIcon={<ArrowForwardIcon />} onClick={() => navigate("/seller-register")} sx={{ mt: "auto", borderRadius: 1, py: 1.2, textTransform: "none", fontWeight: 950, bgcolor: popular ? "#2563eb" : undefined }}>
                          {t.choosePackage}
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 1 }}>{t.noPackages}</Alert>
          )}
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 }, bgcolor: "#fff" }}>
        <Container maxWidth="xl">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box component="img" src={deliveryBanner} alt="Delivery support for store owners" sx={{ width: "100%", display: "block", borderRadius: 1, border: "1px solid #e2e8f0", boxShadow: "0 24px 54px rgba(15,23,42,0.09)" }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Chip label={t.growthBadge} sx={{ alignSelf: "flex-start", borderRadius: 1, bgcolor: "#fff7ed", color: "#c2410c", fontWeight: 900 }} />
                <Typography variant="h3" sx={{ fontWeight: 950, lineHeight: 1.08, letterSpacing: 0 }}>{t.growthTitle}</Typography>
                <Typography sx={{ color: "#64748b", fontSize: { xs: 15, md: 17 }, lineHeight: 1.75 }}>{t.growthText}</Typography>
                <Stack spacing={1.1}>
                  {t.checklist.map((item) => (
                    <Stack direction="row" spacing={1} alignItems="flex-start" key={item}>
                      <CheckCircleOutlineIcon sx={{ color: "#059669", fontSize: 20, mt: 0.2 }} />
                      <Typography sx={{ fontWeight: 800 }}>{item}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 }, bgcolor: "#111827", color: "#fff" }}>
        <Container maxWidth="xl">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography variant="h3" sx={{ fontWeight: 950, lineHeight: 1.08, letterSpacing: 0 }}>{t.integrationTitle}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.72)", mt: 2, lineHeight: 1.75 }}>{t.integrationText}</Typography>
            </Grid>
            <Grid item xs={12} md={7}>
              <Grid container spacing={1.5}>
                {integrations.map((name) => (
                  <Grid item xs={6} sm={4} key={name}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 1, bgcolor: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>
                      <Typography sx={{ fontWeight: 950 }}>{name}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 }, bgcolor: "#fff" }}>
        <Container maxWidth="xl">
          <SectionTitle label={t.templatesLabel} title={t.templatesTitle} text={t.templatesText} />
          <Grid container spacing={2}>
            {templateBanners.map((banner, index) => (
              <Grid item xs={12} md={4} key={banner}>
                <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #e2e8f0", overflow: "hidden", height: "100%" }}>
                  <Box component="img" src={banner} alt={`Store banner ${index + 1}`} sx={{ width: "100%", display: "block", aspectRatio: "3 / 2", objectFit: "cover" }} />
                  <Box sx={{ p: 2.2 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 18 }}>{t.templateCards[index][0]}</Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5, lineHeight: 1.6 }}>{t.templateCards[index][1]}</Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="xl">
          <Paper elevation={0} sx={{ p: { xs: 2.6, md: 4.5 }, borderRadius: 1.2, bgcolor: "#eff6ff", border: "1px solid #bfdbfe", backgroundImage: `linear-gradient(90deg, rgba(239,246,255,0.97), rgba(239,246,255,0.82)), url("${storeOrderBanner}")`, backgroundSize: "cover", backgroundPosition: "center" }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <RocketLaunchOutlinedIcon sx={{ fontSize: 42, color: "#2563eb" }} />
                <Typography variant="h3" sx={{ fontWeight: 950, mt: 1.5, lineHeight: 1.08, letterSpacing: 0 }}>{t.finalTitle}</Typography>
                <Typography sx={{ color: "#475569", mt: 1.5, lineHeight: 1.75, maxWidth: 660 }}>{t.finalText}</Typography>
              </Grid>
              <Grid item xs={12} md={5}>
                <Stack direction={{ xs: "column", sm: "row", md: "column" }} spacing={1.3}>
                  <Button fullWidth variant="contained" startIcon={<ShareOutlinedIcon />} onClick={() => navigate("/seller-register")} sx={{ borderRadius: 1, py: 1.25, textTransform: "none", fontWeight: 950, bgcolor: "#111827" }}>
                    {t.primaryCta}
                  </Button>
                  <Button fullWidth variant="outlined" startIcon={<SupportAgentOutlinedIcon />} onClick={() => navigate("/contact")} sx={{ borderRadius: 1, py: 1.25, textTransform: "none", fontWeight: 950, bgcolor: "rgba(255,255,255,0.74)" }}>
                    {t.support}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>

      <Box component="footer" sx={{ bgcolor: "#111827", color: "#fff", py: { xs: 5, md: 6 } }}>
        <Container maxWidth="xl">
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} justifyContent="space-between">
            <Box>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box component="img" src={brandLogoWhite} alt="MyZoo Stores" sx={{ width: 96, height: 38, objectFit: "contain", display: "block" }} />
                <Typography sx={{ fontWeight: 950, fontSize: 22 }}>MyZoo Stores</Typography>
              </Stack>
              <Typography sx={{ color: "rgba(255,255,255,0.68)", mt: 0.5 }}>{t.footerText}</Typography>
            </Box>
            <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => navigate("/seller-register")} sx={{ alignSelf: { xs: "flex-start", md: "center" }, borderRadius: 1, textTransform: "none", fontWeight: 950, bgcolor: "#22c55e", color: "#052e16" }}>
              {t.trial}
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default StoreOwnerLanding;
