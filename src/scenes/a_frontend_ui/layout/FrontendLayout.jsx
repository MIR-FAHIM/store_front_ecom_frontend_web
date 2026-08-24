import React from "react";
import { Outlet, useLocation } from 'react-router-dom';
import Topbar from './Topbar';
import BottomBar from './BottomBar';
import { Container, useTheme } from '@mui/material';
import { StorefrontProvider } from '../../../context/StorefrontContext';

const FrontendLayout = () => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const isStorefront = /^\/store\/[^/]+/.test(pathname);

  if (!isStorefront) return <Outlet />;

  return (
    <StorefrontProvider>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.background.default,
      }}>
        <Topbar />
        <Container sx={{
          flex: 1,
          minHeight: '70vh',
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 1.5, sm: 2, md: 3 },
        }}>
          <Outlet />
        </Container>
        <BottomBar />
      </div>
    </StorefrontProvider>
  );
};

export default FrontendLayout;
