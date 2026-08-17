import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  CircularProgress,
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
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import { getSubscriptionPackages } from "../../../api/controller/admin_controller/subscription_package/subscription_package_controller";

const imageUrl = "https://placehold.co/600x400/png";

const features = [
  {
    title: "Online storefront",
    text: "Get a branded store page with banner, logo, categories, products, and shareable store URL.",
    icon: StorefrontOutlinedIcon,
  },
  {
    title: "Product catalog",
    text: "Manage products, stock, prices, discounts, categories, brands, and product visibility from one dashboard.",
    icon: Inventory2OutlinedIcon,
  },
  {
    title: "Order management",
    text: "See new orders fast, update status, track payment, and keep customer information organized.",
    icon: DashboardCustomizeOutlinedIcon,
  },
  {
    title: "Payment ready",
    text: "Accept online payment options through supported payment gateway flows when your store is ready.",
    icon: PaymentsOutlinedIcon,
  },
  {
    title: "Delivery or pickup",
    text: "Offer merchant delivery, pickup, local delivery settings, and courier support as the business grows.",
    icon: LocalShippingOutlinedIcon,
  },
  {
    title: "Reports",
    text: "Track sales, products, orders, payments, and store growth with useful dashboard insights.",
    icon: QueryStatsOutlinedIcon,
  },
];

const steps = [
  "Create your store profile",
  "Upload products and organize categories",
  "Share your store link with customers",
  "Receive orders from marketplace and storefront",
];

const packageItems = [
  "Store profile and public storefront",
  "Product, category, and brand management",
  "Order dashboard and customer details",
  "Payment, delivery, and pickup settings",
  "Reports, support, and future integrations",
];

const formatMoney = (pkg) =>
  `${pkg?.currency || "BDT"} ${Number(pkg?.price || 0).toLocaleString("en-BD")}`;

const formatLimit = (value, suffix) => {
  if (value === null || value === undefined || value === "") return `Unlimited ${suffix}`;
  return `${Number(value).toLocaleString("en-BD")} ${suffix}`;
};

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
    // fall through
  }
  return features.split(",").map((item) => item.trim()).filter(Boolean);
};

const integrations = ["AamarPay", "bKash", "Nagad", "SSLCOMMERZ", "Pathao", "SteadFast"];

const faqs = [
  {
    q: "Is this only a marketplace?",
    a: "No. The store is the main focus. Marketplace discovery can help customers find you, but your own storefront remains important.",
  },
  {
    q: "Can I share my store link?",
    a: "Yes. Each store can have a public storefront URL so customers can browse products directly.",
  },
  {
    q: "Can I manage orders myself?",
    a: "Yes. Store owners can manage products, orders, delivery or pickup settings, and subscription status from the merchant dashboard.",
  },
];

const SectionTitle = ({ label, title, text }) => (
  <Stack spacing={1} sx={{ maxWidth: 720, mx: "auto", textAlign: "center", mb: { xs: 3, md: 5 } }}>
    {label ? (
      <Chip
        label={label}
        sx={{ alignSelf: "center", borderRadius: 1, bgcolor: "#eef2ff", color: "#3730a3", fontWeight: 900 }}
      />
    ) : null}
    <Typography variant="h3" sx={{ fontWeight: 950, color: "#111827", lineHeight: 1.08 }}>
      {title}
    </Typography>
    <Typography sx={{ color: "#64748b", fontSize: 17, lineHeight: 1.75 }}>
      {text}
    </Typography>
  </Stack>
);

const StoreOwnerLanding = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState("");

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
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 1,
                  bgcolor: "#111827",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <StorefrontOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 950, lineHeight: 1 }}>MyZoo Stores</Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
                  Store-first commerce
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ display: { xs: "none", sm: "flex" } }}>
              <Button onClick={() => navigate("/seller-login")} sx={{ textTransform: "none", fontWeight: 800 }}>
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/seller-register")}
                sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900, bgcolor: "#111827" }}
              >
                Start free
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box
        sx={{
          minHeight: { xs: "82vh", md: "86vh" },
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.84) 0%, rgba(15,23,42,0.68) 45%, rgba(15,23,42,0.36) 100%), url("${imageUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: { xs: 8, md: 10 } }}>
          <Stack spacing={3} sx={{ maxWidth: 760 }}>
            <Chip
              label="For local store owners"
              sx={{ alignSelf: "flex-start", borderRadius: 1, bgcolor: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 900 }}
            />
            <Typography
              variant="h1"
              sx={{
                color: "#fff",
                fontSize: { xs: 40, sm: 54, md: 72 },
                lineHeight: 0.98,
                fontWeight: 950,
              }}
            >
              Turn your store into an online business inside a marketplace.
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.82)", fontSize: { xs: 17, md: 20 }, lineHeight: 1.7, maxWidth: 650 }}>
              Launch a public storefront, manage products, receive orders, accept payments, and give customers a simple way to buy from your store.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                size="large"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate("/seller-register")}
                sx={{ borderRadius: 1, py: 1.4, px: 2.4, textTransform: "none", fontWeight: 950, bgcolor: "#22c55e" }}
              >
                Start 3 Days Trial
              </Button>
              <Button
                size="large"
                variant="outlined"
                onClick={() => navigate("/seller-login")}
                sx={{
                  borderRadius: 1,
                  py: 1.4,
                  px: 2.4,
                  textTransform: "none",
                  fontWeight: 900,
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.55)",
                }}
              >
                Merchant login
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: { xs: -4, md: -5 }, position: "relative", zIndex: 2 }}>
        <Grid container spacing={1.5}>
          {[
            ["10 min", "Store setup"],
            ["24/7", "Storefront access"],
            ["COD + Online", "Payment flow"],
            ["Pickup + Delivery", "Fulfillment"],
          ].map(([value, label]) => (
            <Grid item xs={6} md={3} key={label}>
              <Paper elevation={0} sx={{ p: 2.2, borderRadius: 1, border: "1px solid #e2e8f0" }}>
                <Typography sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 950, color: "#0f766e" }}>{value}</Typography>
                <Typography sx={{ color: "#64748b", fontWeight: 800 }}>{label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <SectionTitle
            label="How it works"
            title="From offline counter to online orders"
            text="A simple flow for store owners who want online sales without managing a separate technical project."
          />
          <Grid container spacing={2}>
            {steps.map((step, index) => (
              <Grid item xs={12} md={3} key={step}>
                <Paper elevation={0} sx={{ p: 2.4, borderRadius: 1, border: "1px solid #e2e8f0", height: "100%" }}>
                  <Typography sx={{ color: "#4f46e5", fontWeight: 950, fontSize: 30 }}>0{index + 1}</Typography>
                  <Typography sx={{ mt: 1.2, fontWeight: 900, fontSize: 18 }}>{step}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 }, bgcolor: "#fff" }}>
        <Container maxWidth="lg">
          <SectionTitle
            label="Store tools"
            title="Everything a store owner needs to sell online"
            text="Keep the business focused on your store, while marketplace discovery helps customers find you."
          />
          <Grid container spacing={2}>
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Grid item xs={12} sm={6} md={4} key={feature.title}>
                  <Paper elevation={0} sx={{ p: 2.4, borderRadius: 1, border: "1px solid #e2e8f0", height: "100%" }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: 1, display: "grid", placeItems: "center", bgcolor: "#ecfdf5", color: "#059669", mb: 1.8 }}>
                      <Icon />
                    </Box>
                    <Typography sx={{ fontWeight: 950, fontSize: 19 }}>{feature.title}</Typography>
                    <Typography sx={{ color: "#64748b", mt: 1, lineHeight: 1.65 }}>{feature.text}</Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <SectionTitle
            label="Subscription Packages"
            title="Choose a plan and start selling online"
            text="Every plan is built for store owners who want a clean storefront, product management, orders, and marketplace discovery."
          />

          {packagesLoading ? (
            <Box sx={{ py: 5, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          ) : packagesError ? (
            <Alert severity="warning" sx={{ borderRadius: 1 }}>
              {packagesError}
            </Alert>
          ) : packages.length ? (
            <Grid container spacing={2.5} alignItems="stretch">
              {packages.map((pkg) => {
                const popular = Boolean(pkg.is_popular);
                const featured = Boolean(pkg.is_featured);
                const features = normalizeFeatures(pkg.features);
                return (
                  <Grid item xs={12} md={4} key={pkg.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        height: "100%",
                        borderRadius: 1,
                        border: `1px solid ${popular ? "#4f46e5" : "#e2e8f0"}`,
                        boxShadow: popular ? "0 24px 50px rgba(79,70,229,0.16)" : "none",
                        overflow: "hidden",
                        bgcolor: "#fff",
                      }}
                    >
                      {popular ? (
                        <Box sx={{ bgcolor: "#4f46e5", color: "#fff", py: 0.9, textAlign: "center", fontWeight: 950, fontSize: 12 }}>
                          Most Popular
                        </Box>
                      ) : null}
                      <Stack spacing={2} sx={{ p: 2.5 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 1,
                              bgcolor: featured ? "#ecfdf5" : "#eef2ff",
                              color: featured ? "#059669" : "#4f46e5",
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            {featured ? <RocketLaunchOutlinedIcon /> : <WorkspacePremiumOutlinedIcon />}
                          </Box>
                          {featured ? <Chip size="small" label="Featured" color="success" variant="outlined" sx={{ fontWeight: 800 }} /> : null}
                        </Stack>

                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 950, color: "#111827" }}>
                            {pkg.name}
                          </Typography>
                          <Typography sx={{ color: "#64748b", mt: 0.7, minHeight: 48, lineHeight: 1.55 }}>
                            {pkg.short_description || "A practical package for growing your online store."}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="h3" sx={{ fontWeight: 950, color: "#111827", letterSpacing: 0 }}>
                            {formatMoney(pkg)}
                          </Typography>
                          <Typography sx={{ color: "#64748b", fontWeight: 800 }}>
                            /{pkg.billing_cycle || "monthly"}
                          </Typography>
                        </Box>

                        <Divider />

                        <Grid container spacing={1}>
                          <Grid item xs={6}><Chip label={`${pkg.trial_days || 0} trial days`} sx={{ width: "100%", fontWeight: 800 }} /></Grid>
                          <Grid item xs={6}><Chip label={formatLimit(pkg.max_products, "products")} sx={{ width: "100%", fontWeight: 800 }} /></Grid>
                          <Grid item xs={6}><Chip label={formatLimit(pkg.max_orders_per_month, "orders")} sx={{ width: "100%", fontWeight: 800 }} /></Grid>
                          <Grid item xs={6}><Chip label={formatLimit(pkg.max_staff, "staff")} sx={{ width: "100%", fontWeight: 800 }} /></Grid>
                          <Grid item xs={6}><Chip label={formatLimit(pkg.max_branches, "branches")} sx={{ width: "100%", fontWeight: 800 }} /></Grid>
                          <Grid item xs={6}><Chip label={`${pkg.commission_rate ?? 0}% commission`} sx={{ width: "100%", fontWeight: 800 }} /></Grid>
                        </Grid>

                        {features.length ? (
                          <Stack spacing={1}>
                            {features.slice(0, 6).map((feature, index) => (
                              <Stack direction="row" spacing={1} alignItems="flex-start" key={`${pkg.id}-${index}`}>
                                <CheckCircleOutlineIcon sx={{ color: "#059669", fontSize: 19, mt: 0.15 }} />
                                <Typography variant="body2" sx={{ color: "#334155", fontWeight: 700, lineHeight: 1.55 }}>
                                  {feature}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        ) : null}

                        <Button
                          fullWidth
                          variant={popular ? "contained" : "outlined"}
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => navigate("/seller-register")}
                          sx={{
                            mt: "auto",
                            borderRadius: 1,
                            py: 1.2,
                            textTransform: "none",
                            fontWeight: 950,
                            bgcolor: popular ? "#4f46e5" : undefined,
                          }}
                        >
                          Choose Package
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 1 }}>
              No active subscription packages found yet.
            </Alert>
          )}
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box component="img" src={imageUrl} alt="Store dashboard preview" sx={{ width: "100%", display: "block", borderRadius: 1, border: "1px solid #e2e8f0" }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Chip label="Marketplace plus own store" sx={{ alignSelf: "flex-start", borderRadius: 1, bgcolor: "#fff7ed", color: "#c2410c", fontWeight: 900 }} />
                <Typography variant="h3" sx={{ fontWeight: 950, lineHeight: 1.08 }}>
                  Sell from your own storefront and stay discoverable in the marketplace.
                </Typography>
                <Typography sx={{ color: "#64748b", fontSize: 17, lineHeight: 1.75 }}>
                  Customers can browse your store, check products, place orders, and choose delivery or pickup. You manage everything from one merchant dashboard.
                </Typography>
                <Stack spacing={1.1}>
                  {packageItems.map((item) => (
                    <Stack direction="row" spacing={1} alignItems="flex-start" key={item}>
                      <CheckCircleOutlineIcon sx={{ color: "#059669", fontSize: 20, mt: 0.2 }} />
                      <Typography sx={{ fontWeight: 700 }}>{item}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 }, bgcolor: "#111827", color: "#fff" }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography variant="h3" sx={{ fontWeight: 950, lineHeight: 1.08 }}>
                Ready for payments, courier, and growth integrations.
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.72)", mt: 2, lineHeight: 1.75 }}>
                Start simple. Add payment gateways, courier support, reports, and subscription features as your store grows.
              </Typography>
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
        <Container maxWidth="lg">
          <SectionTitle
            label="Templates"
            title="Launch with a clean store look"
            text="Use a storefront layout made for mobile shoppers, product browsing, and quick buying decisions."
          />
          <Grid container spacing={2}>
            {[1, 2, 3].map((item) => (
              <Grid item xs={12} md={4} key={item}>
                <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <Box component="img" src={imageUrl} alt={`Store template ${item}`} sx={{ width: "100%", display: "block", aspectRatio: "3 / 2", objectFit: "cover" }} />
                  <Box sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 950 }}>Storefront template {item}</Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
                      Product grid, category browsing, store banner, and checkout-friendly layout.
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 1, border: "1px solid #e2e8f0", height: "100%" }}>
                <RocketLaunchOutlinedIcon sx={{ fontSize: 40, color: "#4f46e5" }} />
                <Typography variant="h3" sx={{ fontWeight: 950, mt: 2, lineHeight: 1.08 }}>
                  Start with a package that fits your store.
                </Typography>
                <Typography sx={{ color: "#64748b", mt: 1.5, lineHeight: 1.75 }}>
                  Pick a subscription package, activate your merchant dashboard, and begin building your online store presence.
                </Typography>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/seller-register")}
                  sx={{ mt: 3, borderRadius: 1, py: 1.2, textTransform: "none", fontWeight: 950, bgcolor: "#4f46e5" }}
                >
                  Create merchant account
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 1, border: "1px solid #e2e8f0", height: "100%", bgcolor: "#f8fafc" }}>
                <Stack spacing={1.3}>
                  {packageItems.map((item) => (
                    <Stack direction="row" spacing={1.2} alignItems="center" key={item}>
                      <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#dcfce7", color: "#15803d", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                        <CheckCircleOutlineIcon fontSize="small" />
                      </Box>
                      <Typography sx={{ fontWeight: 800 }}>{item}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Divider sx={{ my: 2.5 }} />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ShareOutlinedIcon />}
                    onClick={() => navigate("/seller-register")}
                    sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900, bgcolor: "#111827" }}
                  >
                    Start selling online
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SupportAgentOutlinedIcon />}
                    onClick={() => navigate("/contact")}
                    sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900 }}
                  >
                    Talk to support
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 7, md: 10 }, bgcolor: "#fff" }}>
        <Container maxWidth="md">
          <SectionTitle
            label="FAQ"
            title="Questions store owners ask"
            text="A quick summary before you start building your online store."
          />
          <Stack spacing={1.5}>
            {faqs.map((faq) => (
              <Paper key={faq.q} elevation={0} sx={{ p: 2.2, borderRadius: 1, border: "1px solid #e2e8f0" }}>
                <Typography sx={{ fontWeight: 950 }}>{faq.q}</Typography>
                <Typography sx={{ color: "#64748b", mt: 0.7, lineHeight: 1.65 }}>{faq.a}</Typography>
              </Paper>
            ))}
          </Stack>
        </Container>
      </Box>

      <Box component="footer" sx={{ bgcolor: "#111827", color: "#fff", py: { xs: 5, md: 6 } }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} justifyContent="space-between">
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: 22 }}>MyZoo Stores</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.68)", mt: 0.5 }}>
                A store-first SaaS commerce platform with marketplace discovery.
              </Typography>
            </Box>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate("/seller-register")}
              sx={{ alignSelf: { xs: "flex-start", md: "center" }, borderRadius: 1, textTransform: "none", fontWeight: 950, bgcolor: "#22c55e" }}
            >
              Start 3 Days Trial
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default StoreOwnerLanding;
