import React, { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AccountCircle,
  Key,
  Lock,
  LockOpen,
  Refresh,
  Save,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  changePassword,
  getUserDetail,
} from "../../../api/controller/admin_controller/user_controller";

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────
const EMPTY_PW_FORM = {
  old_password: "",
  new_password: "",
  new_password_confirmation: "",
};

const extractErrors = (err) =>
  err?.response?.data?.errors || err?.errors || {};

const extractMessage = (err, fallback = "Something went wrong.") =>
  err?.response?.data?.message || err?.message || fallback;

// ──────────────────────────────────────────
// Component
// ──────────────────────────────────────────
const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // password-change state
  const [pwForm, setPwForm] = useState(EMPTY_PW_FORM);
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // snackbar
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  // ── Fetch profile ──────────────────────
  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const userId =
        localStorage.getItem("userId") || sessionStorage.getItem("userId");
      if (!userId) {
        setError("User is not logged in.");
        return;
      }
      const res = await getUserDetail(userId);
      const data =
        res?.data?.data ?? res?.data?.user ?? res?.data ?? null;
      if (!data) {
        setError("Unable to load profile details.");
        return;
      }
      setUser(data);
    } catch (err) {
      console.error("Failed to load admin profile:", err);
      setError("Failed to load profile information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // ── Change password ────────────────────
  const handlePwChange = (field) => (e) =>
    setPwForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwErrors({});

    // client-side: new passwords must match
    if (
      pwForm.new_password_confirmation &&
      pwForm.new_password !== pwForm.new_password_confirmation
    ) {
      setPwErrors({ new_password_confirmation: ["Passwords do not match."] });
      return;
    }

    setPwSaving(true);
    try {
      const userId =
        localStorage.getItem("userId") || sessionStorage.getItem("userId");

      const payload = {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
        new_password_confirmation: pwForm.new_password_confirmation,
      };
      if (userId) payload.user_id = Number(userId);

      const res = await changePassword(payload);

      if (res?.status === "success") {
        setSnack({ open: true, message: res.message || "Password changed successfully!", severity: "success" });
        setPwForm(EMPTY_PW_FORM);
      } else {
        setSnack({ open: true, message: res?.message || "Failed to change password.", severity: "error" });
      }
    } catch (err) {
      const apiErrors = extractErrors(err);
      if (Object.keys(apiErrors).length > 0) {
        // normalise arrays → strings
        const flat = Object.fromEntries(
          Object.entries(apiErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
        );
        setPwErrors(flat);
      }
      setSnack({
        open: true,
        message: extractMessage(err, "Failed to change password."),
        severity: "error",
      });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Derived display values ─────────────
  const fullName = user?.name || user?.full_name || user?.user_name || "Admin";
  const email    = user?.email || user?.mail || "—";
  const phone    = user?.phone || user?.mobile || "—";
  const role     = user?.user_type || "admin";
  const userId   = user?.id ?? "—";
  const status   = user?.status ?? "active";

  const EyeToggle = ({ show, onToggle }) => (
    <InputAdornment position="end">
      <IconButton size="small" onClick={onToggle} edge="end">
        {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
      {/* ── Page Header ──────────────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: { sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <AccountCircle sx={{ fontSize: 32, color: "primary.main" }} />
            <Typography variant="h4" fontWeight={800}>
              Admin Profile
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            View your account details and manage your password.
          </Typography>
        </Box>

        <Tooltip title="Reload profile">
          <span>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadProfile}
              disabled={loading}
              sx={{ textTransform: "none", borderRadius: "8px" }}
            >
              Refresh
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* ── Profile Card ─────────────────── */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "10px" }}>
          {error}
        </Alert>
      ) : (
        <Stack spacing={3}>
          {/* Profile info */}
          <Card sx={{ borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                {/* Avatar + name */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      src={user?.image || user?.profile_image || user?.avatar}
                      sx={{ width: 76, height: 76, fontSize: 28, fontWeight: 700, bgcolor: "primary.dark" }}
                    >
                      {fullName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {fullName}
                      </Typography>
                      <Chip
                        label={String(role).toUpperCase()}
                        size="small"
                        color="primary"
                        sx={{ mt: 0.5, fontWeight: 600, fontSize: 11 }}
                      />
                    </Box>
                  </Box>
                </Grid>

                {/* Details */}
                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    {[
                      { label: "Email", value: email },
                      { label: "Phone", value: phone },
                      { label: "User ID", value: `#${userId}` },
                      { label: "Status", value: status },
                    ].map(({ label, value }) => (
                      <Grid item xs={12} sm={6} key={label}>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          {label}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25 }}>
                          {value}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ── Change Password Card ───────── */}
          <Card sx={{ borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p: 3 }}>
              {/* Card header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                <Key color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Change Password
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your current password and choose a strong new one.
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Box component="form" onSubmit={handlePwSubmit}>
                <Grid container spacing={2.5}>
                  {/* Old password */}
                  <Grid item xs={12}>
                    <TextField
                      label="Current Password"
                      fullWidth
                      required
                      size="small"
                      type={showOld ? "text" : "password"}
                      value={pwForm.old_password}
                      onChange={handlePwChange("old_password")}
                      error={Boolean(pwErrors.old_password)}
                      helperText={pwErrors.old_password || ""}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOpen fontSize="small" sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <EyeToggle show={showOld} onToggle={() => setShowOld((v) => !v)} />
                        ),
                      }}
                    />
                  </Grid>

                  {/* New password */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="New Password"
                      fullWidth
                      required
                      size="small"
                      type={showNew ? "text" : "password"}
                      value={pwForm.new_password}
                      onChange={handlePwChange("new_password")}
                      error={Boolean(pwErrors.new_password)}
                      helperText={pwErrors.new_password || ""}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock fontSize="small" sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <EyeToggle show={showNew} onToggle={() => setShowNew((v) => !v)} />
                        ),
                      }}
                    />
                  </Grid>

                  {/* Confirm new password */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Confirm New Password"
                      fullWidth
                      size="small"
                      type={showConfirm ? "text" : "password"}
                      value={pwForm.new_password_confirmation}
                      onChange={handlePwChange("new_password_confirmation")}
                      error={Boolean(pwErrors.new_password_confirmation)}
                      helperText={pwErrors.new_password_confirmation || ""}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock fontSize="small" sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <EyeToggle show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
                        ),
                      }}
                    />
                  </Grid>

                  {/* Submit */}
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={pwSaving}
                        startIcon={
                          pwSaving ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <Save />
                          )
                        }
                        sx={{ textTransform: "none", borderRadius: "8px", px: 3 }}
                      >
                        {pwSaving ? "Saving…" : "Update Password"}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* ── Snackbar ──────────────────────── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.severity}
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
