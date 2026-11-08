import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from 'react-router-dom';
import Topbar from './Topbar';
import BottomBar from './BottomBar';
import { Button, CircularProgress, Container, Stack, Typography, useTheme } from '@mui/material';
import { Refresh, StorefrontOutlined } from '@mui/icons-material';
import { checkStorefrontAvailability } from '../../../api/controller/admin_controller/shop/shop_controller';
import { getStoreSlugFromPathname, StorefrontProvider } from '../../../context/StorefrontContext';

const StorefrontAvailability = ({ slug, pathname, children }) => {
  const [state, setState] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let request;
    const check = async () => {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      try {
        const available = await checkStorefrontAvailability(slug, controller.signal);
        if (!controller.signal.aborted) setState(available ? 'available' : 'unavailable');
      } catch {
        if (!controller.signal.aborted) setState('error');
      }
    };

    check();
    window.addEventListener('focus', check);
    return () => {
      request?.abort();
      window.removeEventListener('focus', check);
    };
  }, [slug, pathname, attempt]);

  if (state === 'available') return children;

  return (
    <Container component="main" maxWidth="sm" sx={{ flex: 1, display: 'grid', placeItems: 'center', py: 6 }}>
      {state === 'loading' ? (
        <CircularProgress aria-label="Checking store availability" />
      ) : (
        <Stack spacing={2} alignItems="center" textAlign="center">
          <StorefrontOutlined color="action" fontSize="large" />
          <Typography component="h1" variant="h5" fontWeight={700} role="status">
            {state === 'unavailable' ? 'This store is currently unavailable' : 'Could not check store availability'}
          </Typography>
          <Button startIcon={<Refresh />} onClick={() => { setState('loading'); setAttempt((prev) => prev + 1); }}>
            Try again
          </Button>
        </Stack>
      )}
    </Container>
  );
};

const FrontendLayout = () => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const slug = getStoreSlugFromPathname(pathname);
  const isStorefront = Boolean(slug);
  const isPolicyPage = /^\/(privacy|terms|return-policy|support-policy)$/.test(pathname);

  if (!isStorefront && !isPolicyPage) return <Outlet />;

  // Payment returns and order receipts must remain reachable for purchases already made.
  const isOrderResult = /^\/store\/[^/]+\/(?:order-success|payment-(?:success|failed|cancelled))\/?$/.test(pathname);
  const content = (
    <>
      {isStorefront ? <Topbar /> : null}
      <Container sx={{
        flex: 1,
        minHeight: '70vh',
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1.5, sm: 2, md: 3 },
      }}>
        <Outlet />
      </Container>
      <BottomBar />
    </>
  );

  return (
    <StorefrontProvider>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.background.default,
      }}>
        {isStorefront && !isOrderResult ? (
          <StorefrontAvailability key={slug} slug={slug} pathname={pathname}>
            {content}
          </StorefrontAvailability>
        ) : content}
      </div>
    </StorefrontProvider>
  );
};

export default FrontendLayout;
