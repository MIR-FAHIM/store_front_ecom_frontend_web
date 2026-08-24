import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  CircularProgress,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Alert,
  useTheme,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";
import LoginIcon from "@mui/icons-material/Login";
import { loginController } from "../../api/controller/admin_controller/user_controller";
//5822
/** ---------------------------------------------
 *  Toggle & configure your demo credentials here
 *  --------------------------------------------- */
const SHOW_DEMO_CREDENTIALS = false; // <- set to false to hide demo panel

const DEMO_CREDENTIALS = [
  { label: "Admin (Full Access)", email: "testuser@gmail.com", password: "12345678" },
  { label: "Manager (HR + Projects)", email: "testuser@gmail.com", password: "12345678" },
  { label: "Sales (CRM)", email: "testuser@gmail.com", password: "12345678" },
  { label: "Test User", email: "testuser@gmail.com", password: "12345678" },
];

const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const validate = () => {
    if ((!email && !phone) || !password) return "Please fill in all fields.";
    if (email) {
      const isEmail = /^\S+@\S+\.\S+$/.test(email);
      if (!isEmail) return "Enter a valid email address.";
    }
    if (phone) {
      const isPhone = /^\+?\d{8,15}$/.test(String(phone).replace(/[\s-]/g, ""));
      if (!isPhone) return "Enter a valid phone number.";
    }
    return "";
  };

  const consumeAuthRedirect = () => {
    const redirect = sessionStorage.getItem("auth_redirect");
    sessionStorage.removeItem("auth_redirect");
    if (redirect && String(redirect).startsWith("/")) return redirect;
    const activeStoreSlug = sessionStorage.getItem("active_store_slug");
    return activeStoreSlug ? `/store/${encodeURIComponent(String(activeStoreSlug))}` : "/";
  };

  const isPhoneInput = (value) => /^\+?\d[\d\s-]*$/.test(value || "");

  const handleLogin = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setErrMsg(v);
      return;
    }
    setLoading(true);
    setErrMsg("");

    try {
      const payload = phone ? { phone, password } : { email, password };
      const res = await loginController(payload);

      const ok =
        res?.status === 200 ||
        res?.status === "success" ||
        res?.success === true;

      if (!ok) {
        setErrMsg(res?.message || "Invalid credentials. Please try again.");
      } else {
        const token =
          res?.token || res?.data?.token || res?.data?.access_token;
        const userId =
          res?.user?.id || res?.data?.user?.id || res?.data?.id;
        
        const userType =
          res?.user?.user_type || res?.data?.user?.user_type || res?.data?.user_type;

        if (!token || !userId) {
          setErrMsg("Login succeeded but token/user is missing.");
        } else {
          if (remember) {
            localStorage.setItem("authToken", token);
            localStorage.setItem("userId", userId);
          } else {
            sessionStorage.setItem("authToken", token);
            sessionStorage.setItem("userId", userId);
          }
          if (userType === "customer" || !userType) {
            navigate(consumeAuthRedirect());
          } 
        }
      }
    } catch (err) {
      console.error(err);
      setErrMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyDemo = (cred) => {
    setEmail(cred.email);
    setPhone("");
    setPassword(cred.password);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: `radial-gradient(1200px 600px at 10% -10%, ${
          theme.palette.mode === "dark"
            ? "rgba(58,134,255,0.10)"
            : "rgba(58,134,255,0.16)"
        }, transparent 60%),
        linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)`,
        p: 2,
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Paper
          elevation={6}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "background.paper",
            backdropFilter: "blur(8px)",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Optional Demo Credentials panel */}
          {SHOW_DEMO_CREDENTIALS && (
            <Box
              sx={{
                px: 3,
                py: 2.5,
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(90deg, #3A86FF 0%, #2EC4B6 100%)"
                    : "linear-gradient(90deg, #86ADF5 0%, #9DE2D0 100%)",
                color: "#fff",
              }}
            >
              <Typography variant="h6" fontWeight={800} gutterBottom>
                Demo Credentials
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.95, mb: 1 }}>
                Pick a profile to auto-fill login:
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                sx={{ mt: 0.5 }}
              >
                {DEMO_CREDENTIALS.map((c) => (
                  <Chip
                    key={c.email}
                    onClick={() => applyDemo(c)}
                    label={c.label}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.18)",
                      color: "#fff",
                      fontWeight: 700,
                      "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
                      cursor: "pointer",
                    }}
                  />
                ))}
              </Stack>

              {/* Show the currently selected demo creds (if any) */}
              {(email || password) && (
                <Typography variant="caption" sx={{ display: "block", mt: 1.25, opacity: 0.9 }}>
                  Selected → <strong>{email || "—"}</strong> / <strong>{password ? "••••••••" : "—"}</strong>
                </Typography>
              )}
            </Box>
          )}

          {/* Header / Brand bar */}
          <Box
            sx={{
              px: 3,
              py: 2.5,
              borderTop: SHOW_DEMO_CREDENTIALS ? `1px solid rgba(255,255,255,0.25)` : "none",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(90deg, #3A86FF 0%, #2EC4B6 100%)"
                  : "linear-gradient(90deg, #86ADF5 0%, #9DE2D0 100%)",
              color: "#fff",
            }}
          >
            <Typography variant="h5" fontWeight={800}>
              Welcome back
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Sign in to continue to your workspace
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handleLogin} sx={{ p: 3 }}>
            {errMsg && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errMsg}
              </Alert>
            )}

            <TextField
              label="Email or Phone Number"
              type="text"
              value={phone || email}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) {
                  setEmail("");
                  setPhone("");
                  return;
                }
                if (isPhoneInput(v)) {
                  setPhone(v);
                  setEmail("");
                } else {
                  setEmail(v);
                  setPhone("");
                }
              }}
              fullWidth
              margin="normal"
              autoComplete="email"
              autoFocus
              sx={{
                "& input:focus::placeholder": {
                  color: "#000",
                  opacity: 1,
                },
                "& label.Mui-focused": {
                  color: "#000",
                },
              }}
              inputProps={{ placeholder: "Email or Phone Number" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              autoComplete="current-password"
                   sx={{
                "& input:focus::placeholder": {
                  color: "#000",
                  opacity: 1,
                },
                "& label.Mui-focused": {
                  color: "#000",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label="toggle password visibility"
                    >
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                mt: 1,
                mb: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                }
                label="Remember me"
              />
              <Button
                size="small"
                sx={{ textTransform: "none" }}
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </Button>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              startIcon={!loading && <LoginIcon />}
              disabled={loading}
              sx={{
                py: 1.2,
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Sign in"}
            </Button>

            {/* <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate("/login-otp")}
              sx={{
                mt: 1.2,
                py: 1.1,
                fontWeight: 700,
                borderRadius: 2,
                textTransform: "none",
              }}
            >
              Login with OTP
            </Button> */}

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" align="center">
              Don’t have an account?{" "}
              <Button
                onClick={() => navigate("/register")}
                sx={{ textTransform: "none", fontWeight: 700, px: 0.5 , color: theme.palette.secondary.main}}
              >
                Create one
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
