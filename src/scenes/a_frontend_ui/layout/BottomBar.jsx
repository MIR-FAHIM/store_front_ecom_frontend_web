import React, { useEffect, useState } from "react";
import { Box, Divider, IconButton, Link, Typography } from "@mui/material";
import { Facebook, Instagram, LinkedIn, YouTube, X, Description, Undo, HeadsetMic, Security } from "@mui/icons-material";
import BoltIcon from "@mui/icons-material/Bolt";
import { useNavigate } from "react-router-dom";
import { getWebsiteSetting } from "../../../api/controller/admin_controller/website_setting/website_setting_controller.jsx";
import { image_file_url } from "../../../api/config/index.jsx";
import { useStorefront } from "../../../context/StorefrontContext";

const buildImageUrl = (media) => {
  if (!media) return "";
  const direct = media?.url || media?.external_link;
  if (direct && /^https?:\/\//i.test(String(direct))) return String(direct);
  const fileName = media?.file_name || media?.file_original_name;
  if (fileName) {
    return `${String(image_file_url || "").replace(/\/+$/, "")}/${String(fileName).replace(/^\/+/, "")}`;
  }
  return "";
};

const BottomBar = () => {
  const navigate = useNavigate();
  const { storePath } = useStorefront();
  const [brand, setBrand] = useState({
    name: "ShopLogo",
    slogan: "Trendy picks, fast checkout",
    logoUrl: "",
  });

  useEffect(() => {
    const loadWebsiteSetting = async () => {
      try {
        const res = await getWebsiteSetting();
        const payload = res?.data ?? res;
        const data = payload?.data ?? payload;
        if (data && typeof data === "object") {
          const logoUrl = buildImageUrl(data?.logo || null);
          setBrand({
            name: data?.website_name || "ShopLogo",
            slogan: data?.slogan || "Trendy picks, fast checkout",
            logoUrl,
          });
        }
      } catch (e) {
        console.error("Failed to load website settings", e);
      }
    };

    loadWebsiteSetting();
  }, []);

  const sectionCard = {};

  const linkStyle = {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: 600,
    textTransform: "capitalize",
    textAlign: "left",
    "&:hover": { color: "#fff" },
  };

  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        color: "#fff",
        fontFamily: "'Playfair Display', 'Times New Roman', serif",
        background:
          "radial-gradient(900px 480px at 12% -20%, rgba(255,198,98,0.16), transparent 60%), radial-gradient(900px 520px at 88% -30%, rgba(94,234,212,0.16), transparent 60%), linear-gradient(180deg, #14161f 0%, #0f1118 100%)",
      }}
    >
           {/* Policy bar */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {[
          { icon: <Description sx={{ fontSize: 28, color: "#444" }} />, label: "Terms & Conditions", path: storePath("/terms") },
          { icon: <Undo sx={{ fontSize: 28, color: "#444" }} />, label: "Return Policy", path: storePath("/terms") },
          { icon: <HeadsetMic sx={{ fontSize: 28, color: "#444" }} />, label: "Support Policy", path: storePath("/contact") },
          { icon: <Security sx={{ fontSize: 28, color: "#444" }} />, label: "Privacy Policy", path: storePath("/privacy") },
        ].map((item, idx, arr) => (
          <Box
            key={item.label}
            component="button"
            onClick={() => navigate(item.path)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              py: 3,
              px: 2,
              background: "#ededed",
              border: "none",
              borderRight: idx < arr.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
              cursor: "pointer",
              transition: "background 150ms ease",
              "&:hover": { background: "#e0e0e0" },
            }}
          >
            {item.icon}
            <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, textAlign: "center" }}>
              <span style={{ color: '#111' }}>{item.label}</span>
            </Typography>
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          px: { xs: 3, md: 8 },
          py: { xs: 5, md: 6 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" },
          alignItems: "start",
          gap: { xs: 4, md: 8 },
        }}
      >
        <Box sx={{ minWidth: 220 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 220 }}>
            <IconButton
              onClick={() => navigate(storePath("/"))}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))",
                "&:hover": { background: "rgba(255,255,255,0.18)", transform: "translateY(-1px)" },
                transition: "transform 120ms ease",
              }}
            >
              {brand.logoUrl ? (
                <Box
                  component="img"
                  src={brand.logoUrl}
                  alt={brand.name}
                  sx={{ width: 28, height: 28, objectFit: "contain", borderRadius: 1 }}
                />
              ) : (
                <BoltIcon />
              )}
            </IconButton>

            <Box onClick={() => navigate(storePath("/"))} sx={{ cursor: "pointer", userSelect: "none", lineHeight: 1.05 }}>
              <Typography sx={{ fontWeight: 700, letterSpacing: "-0.02em", color: "#fff", fontSize: 18 }}>
                {brand.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.58)", fontWeight: 600 }}>
                {brand.slogan}
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ mt: 2, color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.8, maxWidth: 360 }}>
            Discover curated products, transparent policies, and reliable support. We keep shopping simple,
            fast, and secure.
          </Typography>
        </Box>

        <Box sx={{ minWidth: 280 }}>
          <Box sx={{ ...sectionCard }}>
            <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 11 }}>
              FOLLOW US
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: "#2d5aa7", display: "grid", placeItems: "center" }}>
                <Facebook fontSize="small" />
              </Box>
              <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: "#000", display: "grid", placeItems: "center" }}>
                <X fontSize="small" />
              </Box>
              <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: "#d62976", display: "grid", placeItems: "center" }}>
                <Instagram fontSize="small" />
              </Box>
              <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: "#ff0000", display: "grid", placeItems: "center" }}>
                <YouTube fontSize="small" />
              </Box>
              <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: "#0a66c2", display: "grid", placeItems: "center" }}>
                <LinkedIn fontSize="small" />
              </Box>
            </Box>

            <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 700, mt: 3, display: "block", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 11 }}>
              MOBILE APPS
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, mt: 1.5, flexWrap: "wrap" }}>
              <Box sx={{ border: "1px solid rgba(255,255,255,0.18)", borderRadius: 2.5, px: 2, py: 1, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", transition: "all 0.2s", "&:hover": { borderColor: "rgba(255,255,255,0.35)" } }}>
                Get it on Google Play
              </Box>
              <Box sx={{ border: "1px solid rgba(255,255,255,0.18)", borderRadius: 2.5, px: 2, py: 1, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", transition: "all 0.2s", "&:hover": { borderColor: "rgba(255,255,255,0.35)" } }}>
                Available on the App Store
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

 

      <Box
        sx={{
          px: { xs: 3, md: 8 },
          py: { xs: 4, md: 5 },
          display: "grid",
          gap: { xs: 3, md: 6 },
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          alignItems: "start",
        }}
      >
        <Box sx={sectionCard}>
          <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 11 }}>
            CONTACTS
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2, alignItems: "flex-start", color: "rgba(255,255,255,0.7)" }}>
            <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Address</Typography>
            <Typography variant="body2" sx={{ fontSize: 13 }}>House 10, Rd No 4,PC Culture Housing, Shekhertek, Mohammadpur, Dhaka-1207</Typography>
            <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Phone</Typography>
            <Typography variant="body2" sx={{ fontSize: 13 }}>+88 09611 677686</Typography>
            <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Email</Typography>
            <Typography variant="body2" sx={{ fontSize: 13 }}>hi@myzoo.asia</Typography>
          </Box>
        </Box>

        <Box sx={sectionCard}>
          <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 11 }}>
            MY ACCOUNT
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2, alignItems: "flex-start" }}>
            <Link component="button" onClick={() => navigate("/ecom/login")} sx={linkStyle}>
              Login
            </Link>
            <Link component="button" onClick={() => navigate(storePath("/orders"))} sx={linkStyle}>
              Order History
            </Link>
            <Link component="button" onClick={() => navigate(storePath("/wish"))} sx={linkStyle}>
              My Wishlist
            </Link>
            <Link component="button" onClick={() => navigate(storePath("/orders"))} sx={linkStyle}>
              Track Order
            </Link>
          </Box>
        </Box>

        <Box sx={sectionCard}>
          <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 11 }}>
            SELLER ZONE
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2, alignItems: "flex-start" }}>
            <Link component="button" onClick={() => navigate("/ecom/seller")} sx={linkStyle}>
              Become A Seller
            </Link>
            <Link component="button" onClick={() => navigate("/login")} sx={linkStyle}>
              Seller Panel Login
            </Link>
            <Link component="button" onClick={() => navigate("/ecom/seller/app")} sx={linkStyle}>
              Download Seller App
            </Link>
          </Box>
        </Box>

        <Box sx={sectionCard}>
          <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 11 }}>
            DELIVERY BOY
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2, alignItems: "flex-start" }}>
            <Link component="button" onClick={() => navigate("/login")} sx={linkStyle}>
              Delivery Panel Login
            </Link>
            <Link component="button" onClick={() => navigate("/ecom/delivery/app")} sx={linkStyle}>
              Download Delivery App
            </Link>
          </Box>
        </Box>
       
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      {/* Copyright bar */}
      <Box
        sx={{
          px: { xs: 3, md: 8 },
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          background: "rgba(0,0,0,0.25)",
        }}
      >
        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600 }}>
          © {new Date().getFullYear()} {brand.name}. All rights reserved.
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Visa */}
          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 1,
              px: 1,
              py: 0.4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ color: "#1a1f71", fontWeight: 900, fontSize: 13, letterSpacing: "-0.03em", lineHeight: 1 }}>
              VISA
            </Typography>
          </Box>

          {/* Mastercard */}
          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 1,
              px: 0.8,
              py: 0.4,
              display: "flex",
              alignItems: "center",
              gap: 0.3,
            }}
          >
            <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "#eb001b" }} />
            <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "#f79e1b", ml: -1 }} />
            <Typography sx={{ color: "#333", fontWeight: 800, fontSize: 10, ml: 0.5, lineHeight: 1 }}>
              mastercard
            </Typography>
          </Box>

         
        </Box>
      </Box>
    </Box>
  );
};

export default BottomBar;
