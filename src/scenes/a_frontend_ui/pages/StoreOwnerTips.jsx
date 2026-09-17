import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import BottomBar from "../layout/BottomBar";
import brandLogoBlue from "../../../assets/logo/store_myzoo_logo_blue.png";

const steps = [
  {
    title: "১. প্যাকেজ কিনুন",
    icon: <PaymentsOutlinedIcon />,
    accent: "#2563eb",
    summary: "স্টোর চালু করার আগে আপনার ব্যবসার জন্য একটি সাবস্ক্রিপশন প্যাকেজ নির্বাচন করুন।",
    tips: [
      "Seller Dashboard থেকে Packages পেজে যান।",
      "প্যাকেজের দাম, প্রোডাক্ট লিমিট, স্টাফ লিমিট এবং কমিশন দেখে নির্বাচন করুন।",
      "Buy/Subscribe বাটনে চাপুন। পেমেন্ট পেজ এলে পেমেন্ট সম্পন্ন করুন।",
      "পেমেন্ট শেষ হলে dashboard এ ফিরে প্যাকেজ status active হয়েছে কি না দেখুন।",
    ],
  },
  {
    title: "২. ক্যাটাগরি অ্যাকটিভ করুন",
    icon: <CategoryOutlinedIcon />,
    accent: "#0f766e",
    summary: "Marketplace category list থেকে আপনার দোকানে যে ক্যাটাগরি লাগবে শুধু সেগুলো চালু করুন।",
    tips: [
      "Seller Panel থেকে Categories পেজ খুলুন।",
      "যে store এর জন্য কাজ করছেন সেটি নির্বাচন করুন।",
      "Category tree থেকে প্রয়োজনীয় parent/child category tick দিন।",
      "Save Categories চাপুন। এরপর product add page এ শুধু active category দেখা যাবে।",
    ],
  },
  {
    title: "৩. প্রোডাক্ট যোগ করুন",
    icon: <Inventory2OutlinedIcon />,
    accent: "#7c3aed",
    summary: "নিজের প্রোডাক্ট upload করুন অথবা marketplace catalog থেকে store এ add করুন।",
    tips: [
      "Products পেজ থেকে Add Product চাপুন।",
      "Product name, category, price, stock, unit এবং image দিন।",
      "প্রথম image primary হিসেবে রাখুন, যাতে storefront এ সুন্দর দেখা যায়।",
      "Publish চালু রাখুন। Save করার পর public store এ product দেখা যাচ্ছে কি না চেক করুন।",
    ],
  },
  {
    title: "৪. স্টোর লিংক ও QR শেয়ার করুন",
    icon: <QrCode2OutlinedIcon />,
    accent: "#db2777",
    summary: "আপনার public storefront link বা QR customer দের সাথে share করুন।",
    tips: [
      "Store QR পেজ থেকে QR frame download করুন।",
      "দোকানের counter, delivery bag, social post এবং visiting card এ QR ব্যবহার করুন।",
      "Customer scan করলে MyZoo app/storefront এ আপনার store load হবে।",
      "Slug ঠিক আছে কি না দেখুন, যেমন /store/your_store_slug।",
    ],
  },
  {
    title: "৫. অর্ডার হ্যান্ডেল করুন",
    icon: <ReceiptLongOutlinedIcon />,
    accent: "#ea580c",
    summary: "নতুন order আসলে দ্রুত confirm, process এবং delivery/pickup status update করুন।",
    tips: [
      "Orders পেজে pending order দেখুন।",
      "Product stock মিলিয়ে order confirm করুন।",
      "Payment status এবং customer phone/address চেক করুন।",
      "Status update করলে customer order progress বুঝতে পারবে।",
    ],
  },
  {
    title: "৬. Delivery man যোগ করুন",
    icon: <LocalShippingOutlinedIcon />,
    accent: "#0891b2",
    summary: "নিজস্ব delivery team থাকলে delivery man তৈরি করে order assignment সহজ করুন।",
    tips: [
      "Delivery Man পেজে গিয়ে Add Delivery Man চাপুন।",
      "নাম, phone, address এবং login তথ্য দিন।",
      "Order ready হলে delivery man assign করুন।",
      "পরবর্তীতে courier/3PL support এলে একই flow আরও বড়ভাবে ব্যবহার করা যাবে।",
    ],
  },
];

const quickChecklist = [
  "Store profile complete করুন",
  "Logo ও banner upload করুন",
  "Package active করুন",
  "Category activate করুন",
  "কমপক্ষে ১০টি product add করুন",
  "QR/link customer দের share করুন",
  "প্রতিদিন orders check করুন",
];

const StoreOwnerTips = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", color: "#0f172a" }}>
      <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.4 }} spacing={2}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box component="img" src={brandLogoBlue} alt="MyZoo" sx={{ width: 96, height: 42, objectFit: "contain" }} />
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography sx={{ fontWeight: 950, lineHeight: 1 }}>MyZoo Stores</Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>স্টোর মালিকদের গাইড</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button onClick={() => navigate("/store-owner")} sx={{ textTransform: "none", fontWeight: 900 }}>
                Landing
              </Button>
              <Button variant="contained" onClick={() => navigate("/seller-register")} sx={{ borderRadius: 1, textTransform: "none", fontWeight: 950, bgcolor: "#111827" }}>
                Seller Account
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ bgcolor: "#0f172a", color: "#fff" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label="বাংলা গাইড" sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "#fff", fontWeight: 900, mb: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 950, letterSpacing: 0, fontSize: { xs: 34, md: 56 }, lineHeight: 1.05 }}>
                আপনার MyZoo স্টোর চালানোর সহজ ধাপসমূহ
              </Typography>
              <Typography sx={{ color: "#cbd5e1", mt: 2, fontSize: { xs: 16, md: 18 }, lineHeight: 1.8, maxWidth: 720 }}>
                প্যাকেজ কেনা থেকে শুরু করে product add, category activate, order handle এবং delivery man setup পর্যন্ত সবকিছু এক জায়গায় সহজ ভাষায় সাজানো।
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4} sx={{ mt: 3 }}>
                <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => navigate("/seller-register")} sx={{ borderRadius: 1, py: 1.2, textTransform: "none", fontWeight: 950, bgcolor: "#22c55e", color: "#052e16" }}>
                  এখনই স্টোর শুরু করুন
                </Button>
                <Button variant="outlined" onClick={() => navigate("/seller-login")} sx={{ borderRadius: 1, py: 1.2, textTransform: "none", fontWeight: 950, color: "#fff", borderColor: "rgba(255,255,255,0.35)" }}>
                  Seller Login
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 2.4, borderRadius: 1, bgcolor: "#fff", color: "#0f172a" }}>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 1, display: "grid", placeItems: "center", bgcolor: "#eef2ff", color: "#2563eb" }}>
                    <StorefrontOutlinedIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 950 }}>দ্রুত চেকলিস্ট</Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>স্টোর publish করার আগে</Typography>
                  </Box>
                </Stack>
                <Divider sx={{ mb: 1.5 }} />
                <Stack spacing={1.1}>
                  {quickChecklist.map((item) => (
                    <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
                      <CheckCircleOutlineIcon sx={{ color: "#16a34a", fontSize: 20, mt: 0.15 }} />
                      <Typography sx={{ fontWeight: 800, lineHeight: 1.55 }}>{item}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 950 }}>ধাপে ধাপে কাজের নিয়ম</Typography>
          <Typography sx={{ color: "#64748b", fontWeight: 700 }}>
            প্রতিটি কাজ শেষ হলে পরের ধাপে যান। এতে store setup পরিষ্কার থাকবে এবং customer order নিতে সমস্যা কম হবে।
          </Typography>
        </Stack>

        <Grid container spacing={2.2}>
          {steps.map((step) => (
            <Grid item xs={12} md={6} key={step.title}>
              <Paper elevation={0} sx={{ height: "100%", p: { xs: 2, md: 2.5 }, borderRadius: 1, border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
                <Stack spacing={1.8}>
                  <Stack direction="row" spacing={1.4} alignItems="flex-start">
                    <Box sx={{ width: 48, height: 48, borderRadius: 1, display: "grid", placeItems: "center", bgcolor: `${step.accent}14`, color: step.accent, flex: "0 0 auto" }}>
                      {step.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.2 }}>{step.title}</Typography>
                      <Typography sx={{ color: "#64748b", mt: 0.7, lineHeight: 1.65, fontWeight: 700 }}>{step.summary}</Typography>
                    </Box>
                  </Stack>
                  <Divider />
                  <Stack spacing={1}>
                    {step.tips.map((tip) => (
                      <Stack key={tip} direction="row" spacing={1} alignItems="flex-start">
                        <Box sx={{ width: 7, height: 7, mt: 1.05, borderRadius: "50%", bgcolor: step.accent, flex: "0 0 auto" }} />
                        <Typography sx={{ color: "#334155", lineHeight: 1.7, fontWeight: 750 }}>{tip}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper elevation={0} sx={{ mt: 3, p: { xs: 2.2, md: 3 }, borderRadius: 1, bgcolor: "#ecfeff", border: "1px solid #bae6fd" }}>
          <Typography variant="h5" sx={{ fontWeight: 950, mb: 1 }}>মনে রাখবেন</Typography>
          <Typography sx={{ color: "#0f172a", lineHeight: 1.8, fontWeight: 750 }}>
            Product না থাকলেও store page ভাঙা দেখানো উচিত নয়। আগে package, category, product এবং QR ঠিক করুন। এরপর নিয়মিত order status update করলে customer trust বাড়বে।
          </Typography>
        </Paper>
      </Container>

      <BottomBar />
    </Box>
  );
};

export default StoreOwnerTips;
