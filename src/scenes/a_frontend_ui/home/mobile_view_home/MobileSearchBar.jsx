import React, { useState } from "react";
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Badge,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { useNavigate } from "react-router-dom";
import { useStorefront } from "../../../../context/StorefrontContext";
import { searchPath } from "../../../../utils/productRoute";

export default function MobileSearchBar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentStoreSlug, storePath } = useStorefront();
  const isDark = theme.palette.mode === "dark";
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    if (e.key === "Enter" && query.trim()) {
      navigate(searchPath(query.trim(), currentStoreSlug));
    }
  };

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        px: 1.5,
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        background: isDark
          ? "linear-gradient(135deg, #1e1e2e 0%, #16213e 100%)"
          : "linear-gradient(135deg, #ff6b35 0%, #f7c59f 100%)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
      }}
    >
      <TextField
        placeholder="Search products, brands..."
        size="small"
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleSearch}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#fff",
            color: isDark ? "#fff" : "text.primary",
            "& fieldset": { border: "none" },
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          },
          "& .MuiInputBase-input::placeholder": {
            color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
            fontSize: 13,
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)", fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />
      <IconButton size="small" onClick={() => navigate(storePath("/wish"))} sx={{ color: "#fff" }}>
        <FavoriteBorderIcon sx={{ fontSize: 22 }} />
      </IconButton>
      <IconButton size="small" onClick={() => navigate(storePath("/cart"))} sx={{ color: "#fff" }}>
        <ShoppingCartOutlinedIcon sx={{ fontSize: 22 }} />
      </IconButton>
    </Box>
  );
}
