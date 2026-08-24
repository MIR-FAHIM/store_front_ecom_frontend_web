import React, { useEffect, useState } from 'react';
import { Container, Box, Paper, Typography, TextField, Button, Grid, Snackbar, MenuItem, CircularProgress, Checkbox, FormControlLabel, Link } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { registerEmployee } from "../../api/controller/admin_controller/user_controller";
import { loginController } from "../../api/controller/admin_controller/user_controller";

const Register = () => {
  const location = useLocation();
  const [name, setName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState(location.state?.phoneNumber || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const isPhone = (val) => /^\d{11}$/.test(val.trim());
  const isEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const consumeAuthRedirect = () => {
    const redirect = sessionStorage.getItem('auth_redirect');
    sessionStorage.removeItem('auth_redirect');
    if (redirect && String(redirect).startsWith('/')) return redirect;
    const activeStoreSlug = sessionStorage.getItem('active_store_slug');
    return activeStoreSlug ? `/store/${encodeURIComponent(String(activeStoreSlug))}` : '/';
  };

  useEffect(() => {
    if (location.state?.phoneNumber) {
      setPhoneOrEmail(location.state.phoneNumber);
    }
  }, [location.state?.phoneNumber]);

  const handleRegister = async () => {
    const trimmed = phoneOrEmail.trim();
    const phoneDetected = isPhone(trimmed);
    const emailDetected = isEmail(trimmed);

    if (!name || !trimmed || !password) {
      setMsg('Please fill required fields');
      return;
    }
    if (!agreedToTerms) {
      setMsg('Please agree to the Terms and Conditions');
      return;
    }
    if (!phoneDetected && !emailDetected) {
      setMsg('Enter a valid 11-digit phone number or email address');
      return;
    }
    if (password !== confirm) {
      setMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('password', password);
      form.append('role', role);
      if (phoneDetected) form.append('phone', trimmed);
      if (emailDetected) form.append('email', trimmed);

      const res = await registerEmployee(form);
      const ok = res?.status === 200 || res?.status === 'success' || res?.success === true;
      if (!ok) {
        setMsg(res?.message || 'Registration failed');
        return;
      }

      const loginPayload = emailDetected ? { email: trimmed, password } : { phone: trimmed, password };
      const loginRes = await loginController(loginPayload);
      const loginOk =
        loginRes?.status === 200 ||
        loginRes?.status === 'success' ||
        loginRes?.success === true;

      if (!loginOk) {
        setMsg(res?.message || 'Registration successful. You can now login.');
        setTimeout(() => navigate('/login'), 900);
        return;
      }

      const token = loginRes?.token || loginRes?.data?.token || loginRes?.data?.access_token;
      const userId = loginRes?.user?.id || loginRes?.data?.user?.id || loginRes?.data?.id;

      if (!token || !userId) {
        setMsg('Registration successful but login token/user is missing.');
        setTimeout(() => navigate('/login'), 900);
        return;
      }

      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', userId);
      navigate(consumeAuthRedirect());
    } catch (err) {
      console.error(err);
      const emailError = err?.response?.data?.errors?.email;
      const message = Array.isArray(emailError) ? emailError[0] : emailError;
      setMsg(message || err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

return (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa, #e4ecf7)',
      px: 2,
    }}
  >
    <Container maxWidth="sm">
      <Paper
        elevation={6}
        sx={{
          p: 4,
          borderRadius: 3,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}
        >
          Create Account
        </Typography>

        <Typography
          variant="body2"
          sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}
        >
          Sign up to get started
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone Number or Email"
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
              variant="outlined"
              helperText={
                phoneOrEmail.trim()
                  ? isPhone(phoneOrEmail)
                    ? 'Phone number detected'
                    : isEmail(phoneOrEmail)
                    ? 'Email detected'
                    : 'Enter an 11-digit phone number or a valid email'
                  : ''
              }
              sx={{ borderRadius: 2 }}
            />
          </Grid>

         

          {/* <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="customer">Customer</MenuItem>
            </TextField>
          </Grid> */}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  color="primary"
                  sx={{
                    color: '#1976d2',
                    '&.Mui-checked': {
                      color: '#1976d2',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Link href="/privacy" target="_blank" underline="hover">
                    <span style={{ color: '#1976d2' }}>Terms and Conditions</span>
                  </Link>
                </Typography>
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleRegister}
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '16px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                color: '#fff',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338ca, #4f46e5)',
                },
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Create Account'}
            </Button>
          </Grid>

          <Grid item xs={12} textAlign="center">
            <Typography variant="body2">
              Already have an account?
            </Typography>
            <Button
              onClick={() => navigate('/login')}
              sx={{
                textTransform: 'none',
                color: '#fff',
                background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1e40af, #2563eb)',
                },
                mt: 1
              }}
            >
              Login
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={!!msg}
        autoHideDuration={3000}
        onClose={() => setMsg('')}
        message={msg}
      />
    </Container>
  </Box>
);
};

export default Register;
