import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Paper, List, ListItemButton, ListItemText, Typography, Button, CircularProgress, Stack, Chip } from '@mui/material';
import { getUserDetail } from '../../../api/controller/admin_controller/user_controller.jsx';
import { getSellersByCustomer } from '../../../api/controller/customer_preference/customer_preference_controller.jsx';
import { useNavigate } from 'react-router-dom';

const MENU = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'orders', label: 'Purchase History' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'wishlist', label: 'Wish List' },
  { key: 'preferred-stores', label: 'My Preferred Stores' },
  { key: 'support', label: 'Support Tickets' },
  { key: 'delete', label: 'Delete My Account' },
  { key: 'logout', label: 'Logout' },
];

const normalizePreferenceRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.data?.data)) return payload.data.data.data;
  return [];
};

const PreferredStoresPanel = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      const res = await getSellersByCustomer({ page: 1, per_page: 50 });
      if (!mounted) return;
      if (res?.status === 'error') {
        setRows([]);
        setError(res?.statusCode === 403 ? 'You do not have permission.' : res?.message || 'Failed to load preferred stores.');
      } else {
        setRows(normalizePreferenceRows(res));
      }
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 5 }}>
        <CircularProgress size={24} />
      </Stack>
    );
  }

  if (error) return <Typography color="error">{error}</Typography>;

  if (!rows.length) {
    return <Typography color="text.secondary">No preferred stores yet.</Typography>;
  }

  return (
    <Stack spacing={1.5}>
      {rows.map((row, index) => {
        const seller = row?.seller || row?.seller_user || row?.user || row;
        const store = row?.store || row?.shop || seller?.store || seller?.shop;
        return (
          <Paper key={row?.id || `${seller?.id || 'seller'}-${index}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography sx={{ fontWeight: 800 }}>{store?.shop_name || store?.name || seller?.name || 'Preferred store'}</Typography>
                <Typography variant="body2" color="text.secondary">{seller?.email || 'No email'} {seller?.phone ? `- ${seller.phone}` : ''}</Typography>
              </Box>
              <Chip size="small" label="Preferred" color="success" />
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('dashboard');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const storedId = localStorage.getItem('userId');
        if (!storedId) {
          setUser(null);
          setLoading(false);
          return;
        }
        const res = await getUserDetail(storedId);
        // response shape: { status, message, data }
        const u = res?.data ?? res?.data?.data ?? res?.data ?? null;
        setUser(u || res?.data || null);
      } catch (e) {
        console.error('Failed to load user detail', e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  const renderContent = () => {
    if (!user) return <Typography>Please login to see your profile.</Typography>;

    switch (selected) {
      case 'dashboard':
        return (
          <Box>
            <Typography variant="h6">Welcome, {user.name}</Typography>
            <Typography variant="body2" color="text.secondary">Email: {user.email}</Typography>
            <Typography variant="body2" color="text.secondary">Phone: {user.phone}</Typography>
          </Box>
        );

      case 'orders':
        return <Typography>Purchase history will appear here.</Typography>;
      case 'addresses':
        return <Typography>Manage your saved addresses here.</Typography>;
      case 'reviews':
        return <Typography>Your reviews will appear here.</Typography>;
      case 'wishlist':
        return <Typography>Your wish list items will appear here.</Typography>;
      case 'preferred-stores':
        return <PreferredStoresPanel />;
      case 'support':
        return <Typography>Open support tickets and create new ones here.</Typography>;
      case 'delete':
        return (
          <Box>
            <Typography color="error" sx={{ mb: 2 }}>Delete your account permanently.</Typography>
            <Button color="error" variant="contained" onClick={() => alert('Send delete request (demo)')}>Delete My Account</Button>
          </Box>
        );
      case 'logout':
        return (
          <Box>
            <Typography sx={{ mb: 2 }}>You will be logged out of your account.</Typography>
            <Button variant="contained" onClick={handleLogout}>Logout</Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container sx={{ py: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, letterSpacing: "-0.02em" }}>My Profile</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <List disablePadding>
              {MENU.map((m) => (
                <ListItemButton
                  key={m.key}
                  selected={selected === m.key}
                  onClick={() => setSelected(m.key)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    py: 1,
                    '&.Mui-selected': { fontWeight: 700 },
                  }}
                >
                  <ListItemText primary={m.label} primaryTypographyProps={{ fontSize: 13, fontWeight: selected === m.key ? 700 : 500 }} />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper sx={{ p: { xs: 2.5, md: 4 }, minHeight: 320, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            {loading ? <Typography sx={{ color: 'text.secondary' }}>Loading…</Typography> : renderContent()}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
