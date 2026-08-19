import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Link,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { loginController, registerSeller } from "../../api/controller/admin_controller/user_controller.jsx";
import brandLogo from "../../assets/logo/store_myzoo_white.png";

const navy = "#070078";

const initialForm = {
  name: "",
  shop_name: "",
  email: "",
  password: "",
  user_type: "seller",
  phone: "",
  country: "",
  state: "",
  city: "",
  postal_code: "",
  address: "",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1,
    color: navy,
    fontWeight: 700,
    bgcolor: "#fff",
    "& fieldset": { borderColor: navy },
    "&:hover fieldset": { borderColor: navy },
    "&.Mui-focused fieldset": { borderColor: navy, borderWidth: 1.5 },
  },
  "& .MuiInputBase-input": {
    py: 1.55,
    "&::placeholder": {
      color: navy,
      opacity: 0.72,
      fontWeight: 700,
    },
  },
};

const SellerRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [autoLoginLoading, setAutoLoginLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) nextErrors.name = "Seller name is required.";
    if (!form.shop_name.trim()) nextErrors.shop_name = "Shop name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    else if (!emailPattern.test(form.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!form.password) nextErrors.password = "Password is required.";
    else if (form.password.length < 6) nextErrors.password = "Password must be at least 6 characters.";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const firstFieldError = (errors) => {
    const first = Object.values(errors).find(Boolean);
    if (Array.isArray(first)) return first[0];
    return first || "";
  };

  const getFieldError = (field) => {
    const value = fieldErrors[field];
    if (Array.isArray(value)) return value[0] || "";
    return value || "";
  };

  const parseBackendValidationErrors = (err) => {
    const response = err?.response;
    if (response?.status !== 422) return {};
    const errors = response?.data?.errors || response?.data?.data?.errors || {};
    if (errors && typeof errors === "object" && !Array.isArray(errors)) return errors;
    return {};
  };

  const storeLoginSession = (res) => {
    const token = res?.token || res?.data?.token || res?.data?.access_token;
    const userId = res?.user?.id || res?.data?.user?.id || res?.data?.id;
    const userType = res?.user?.user_type || res?.data?.user?.user_type || res?.data?.user_type;

    if (!token || !userId) return false;

    localStorage.setItem("authToken", token);
    localStorage.setItem("userId", userId);
    if (userType) localStorage.setItem("userType", userType);
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userType");
    window.dispatchEvent(new Event("auth-changed"));
    return true;
  };

  const loginAfterRegistration = async ({ email, password }) => {
    setAutoLoginLoading(true);
    try {
      const res = await loginController({ email, password });
      const ok = res?.status === 200 || res?.status === "success" || res?.success === true;

      if (!ok || !storeLoginSession(res)) {
        setError(res?.message || "Account created, but auto login failed. Please sign in.");
        return;
      }

      setTimeout(() => navigate("/seller/dashboard", { replace: true }), 1800);
    } catch (err) {
      setError(err?.response?.data?.message || "Account created, but auto login failed. Please sign in.");
    } finally {
      setAutoLoginLoading(false);
    }
  };

  const validateTerms = () => {
    if (!agreedToTerms) return "Please agree to the terms and conditions.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    const termsError = validateTerms();
    if (termsError) {
      setError(termsError);
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      const res = await registerSeller({
        name: form.name,
        email: form.email,
        password: form.password,
        user_type: "seller",
        phone: form.phone,
        address: form.address,
        country: form.country,
        state: form.state,
        city: form.city,
        postal_code: form.postal_code,
        shop_name: form.shop_name,
      });
      if (res?.status === "success") {
        setSuccess("Seller and shop created successfully");
        setShowSuccessPage(true);
        setAgreedToTerms(false);
        loginAfterRegistration({ email: form.email, password: form.password });
        setForm(initialForm);
      } else {
        setError(res?.message || "Registration failed");
      }
    } catch (err) {
      const backendErrors = parseBackendValidationErrors(err);
      if (Object.keys(backendErrors).length) {
        setFieldErrors(backendErrors);
        setError(firstFieldError(backendErrors) || err?.response?.data?.message || "Please fix the highlighted fields.");
      } else {
        setError(err?.response?.data?.message || err?.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  if (showSuccessPage) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#fff", display: "grid", placeItems: "center", py: { xs: 3, md: 6 }, px: 2 }}>
        <Container maxWidth="sm">
          <Card
            elevation={0}
            sx={{
              border: `1.5px solid ${navy}`,
              borderRadius: { xs: 3, md: 4 },
              overflow: "hidden",
              boxShadow: "none",
            }}
          >
            <Box sx={{ bgcolor: navy, color: "#fff", textAlign: "center", px: 3, py: { xs: 5, md: 6 } }}>
              <Box
                component="img"
                src={brandLogo}
                alt="MyZoo Store"
                sx={{ width: 76, height: 76, objectFit: "contain", display: "block", mx: "auto", mb: 2 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 950, lineHeight: 1.08 }}>
                Seller and shop created successfully
              </Typography>
              <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.82)", fontWeight: 600 }}>
                Your store account is ready. We are preparing your seller dashboard.
              </Typography>
            </Box>

            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Stack spacing={2.2}>
                <Alert severity={error ? "warning" : "success"} sx={{ borderRadius: 1 }}>
                  {error || "Welcome to MyZoo Store. You can now add products, manage orders, choose packages, and share your public store link."}
                </Alert>

                <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 1, p: 2.2, bgcolor: "#f8fafc" }}>
                  <Typography sx={{ fontWeight: 900, color: "#111827", mb: 1 }}>
                    What happens next
                  </Typography>
                  <Stack spacing={1}>
                    {[
                      "Complete your store profile with logo, banner, and address.",
                      "Choose or confirm your subscription package.",
                      "Add products and start receiving store orders.",
                    ].map((item) => (
                      <Typography key={item} sx={{ color: "#475569", fontWeight: 700, lineHeight: 1.55 }}>
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </Box>

                {autoLoginLoading ? (
                  <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ color: navy, fontWeight: 900 }}>
                    <CircularProgress size={22} />
                    <Typography sx={{ fontWeight: 900 }}>Signing you in...</Typography>
                  </Stack>
                ) : error ? (
                  <Button
                    variant="contained"
                    onClick={() => navigate("/seller-login", { replace: true })}
                    sx={{ alignSelf: "center", bgcolor: navy, borderRadius: 1, px: 3, py: 1.1, fontWeight: 900, textTransform: "none" }}
                  >
                    Go to Seller Login
                  </Button>
                ) : (
                  <Typography sx={{ textAlign: "center", color: navy, fontWeight: 900 }}>
                    Taking you to the seller dashboard...
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff", display: "flex", alignItems: "center", py: { xs: 3, md: 6 } }}>
      <Container maxWidth="sm">
        <Card
          elevation={0}
          sx={{
            border: `1.5px solid ${navy}`,
            borderRadius: { xs: 3, md: 4 },
            overflow: "hidden",
            boxShadow: "none",
          }}
        >
          <Box sx={{ bgcolor: navy, color: "#fff", textAlign: "center", px: 3, py: { xs: 5, md: 7 } }}>
            <Box
              component="img"
              src={brandLogo}
              alt="Store logo"
              sx={{
                width: 58,
                height: 58,
                objectFit: "contain",
                display: "block",
                mx: "auto",
                mb: 1.5,
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
              Become a Seller
            </Typography>
            <Typography sx={{ fontSize: { xs: 14, md: 16 }, lineHeight: 1.25 }}>
              Create your seller account to start selling
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} autoComplete="off" sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 2.5, md: 3.5 } }}>
            <Stack spacing={2.2}>
              <Typography sx={{ color: navy, fontWeight: 800 }}>Personal Information</Typography>

              {error ? <Alert severity="error">{error}</Alert> : null}
              {success ? <Alert severity="success">{success}</Alert> : null}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Seller Name"
                    fullWidth
                    required
                    error={Boolean(getFieldError("name"))}
                    helperText={getFieldError("name")}
                    sx={fieldSx}
                    inputProps={{ "aria-label": "Seller Name" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="shop_name"
                    value={form.shop_name}
                    onChange={handleChange}
                    placeholder="Store Name"
                    fullWidth
                    required
                    error={Boolean(getFieldError("shop_name"))}
                    helperText={getFieldError("shop_name")}
                    sx={fieldSx}
                    inputProps={{ "aria-label": "Store Name" }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email"
                    fullWidth
                    required
                    type="email"
                    error={Boolean(getFieldError("email"))}
                    helperText={getFieldError("email")}
                    sx={fieldSx}
                    inputProps={{ "aria-label": "Email" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone"
                    fullWidth
                    type="tel"
                    error={Boolean(getFieldError("phone"))}
                    helperText={getFieldError("phone")}
                    sx={fieldSx}
                    inputProps={{ "aria-label": "Phone" }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    placeholder="Country"
                    fullWidth
                    error={Boolean(getFieldError("country"))}
                    helperText={getFieldError("country")}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="Division"
                    fullWidth
                    error={Boolean(getFieldError("state"))}
                    helperText={getFieldError("state")}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    fullWidth
                    error={Boolean(getFieldError("city"))}
                    helperText={getFieldError("city")}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="postal_code"
                    value={form.postal_code}
                    onChange={handleChange}
                    placeholder="Postal code"
                    fullWidth
                    error={Boolean(getFieldError("postal_code"))}
                    helperText={getFieldError("postal_code")}
                    sx={fieldSx}
                  />
                </Grid>
              </Grid>

              <TextField
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Address"
                fullWidth
                error={Boolean(getFieldError("address"))}
                helperText={getFieldError("address")}
                sx={fieldSx}
              />
              <TextField
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                type="password"
                fullWidth
                required
                error={Boolean(getFieldError("password"))}
                helperText={getFieldError("password")}
                sx={fieldSx}
              />

              <FormControlLabel
                sx={{ m: 0, alignItems: "flex-start", "& .MuiFormControlLabel-label": { pt: 0.7 } }}
                control={
                  <Checkbox
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    sx={{ color: navy, p: 0.5, mr: 0.5, "&.Mui-checked": { color: navy } }}
                  />
                }
                label={
                  <Typography sx={{ color: navy, fontSize: 11, fontWeight: 700 }}>
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" underline="hover" sx={{ color: navy, fontWeight: 900 }}>
                      terms & conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" target="_blank" underline="hover" sx={{ color: navy, fontWeight: 900 }}>
                      privacy policy
                    </Link>
                  </Typography>
                }
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  alignSelf: "center",
                  minWidth: { xs: "100%", sm: 210 },
                  bgcolor: navy,
                  borderRadius: 1,
                  px: 3,
                  py: 1.1,
                  fontWeight: 800,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#05005f", boxShadow: "none" },
                }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Create Seller Account"}
              </Button>
            </Stack>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default SellerRegister;
