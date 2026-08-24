import React, { useEffect, useState } from 'react';
import { Box, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Button, Chip, TablePagination, useTheme } from '@mui/material';
import { getUserOrder } from '../../../api/controller/admin_controller/order/order_controller';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../../../theme';
import { useStorefront } from '../../../context/StorefrontContext';

const UserOrder = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const border = theme.palette.divider || colors.primary[200];
  const surface = colors.primary[400];
  const surface2 = colors.primary[300];
  const ink = colors.gray[100];
  const subInk = colors.gray[300];
  const navigate = useNavigate();
  const { storePath, storeParams } = useStorefront();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  const loadOrders = async (p = 1) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getUserOrder(userId, { page: p, per_page: perPage, ...storeParams });
      // res.data contains pagination object
      const pageData = res?.data ?? res;
      const list = pageData?.data ?? [];
      setOrders(list);
      setTotal(pageData?.total ?? pageData?.data?.length ?? 0);
      setPage(pageData?.current_page ?? p);
    } catch (e) {
      console.error('Failed to load user orders', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(page);
  }, [page, perPage]);

  const handleChangePage = (event, newPage) => {
    // TablePagination uses zero-based pages
    loadOrders(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    setPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    if (status === 'pending') return 'warning';
    if (status === 'completed') return 'success';
    if (status === 'cancelled') return 'error';
    return 'default';
  };

  return (
    <Container sx={{ py: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: ink, letterSpacing: "-0.02em" }}>My Orders</Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: subInk, mb: 1 }}>No orders yet</Typography>
          <Typography variant="body2" sx={{ color: subInk, opacity: 0.7 }}>Your order history will appear here.</Typography>
        </Box>
      ) : (
        <Paper sx={{ border: `1px solid ${border}`, background: surface, borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table sx={{ "& th": { fontWeight: 700, fontSize: 12, color: ink, background: surface2, textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.5 }, "& td": { py: 1.8, fontSize: 13 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id} hover sx={{ "& td": { color: subInk }, transition: "background 0.15s ease" }}>
                    <TableCell sx={{ color: ink, fontWeight: 700, fontSize: 13 }}>{o.order_number}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{new Date(o.created_at).toLocaleString()}</TableCell>
                    <TableCell><Chip label={o.status} color={getStatusColor(o.status)} size="small" sx={{ fontWeight: 600, fontSize: 11, borderRadius: 2 }} /></TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{o.payment_status}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 13 }}>৳ {o.total ?? 0}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ minWidth: 64, fontSize: 12, fontWeight: 600, color: ink, borderColor: border, 
                           borderRadius: 1, textTransform: 'none' }}
                        onClick={() => navigate(storePath(`/order/${o.id}`))}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={(page - 1) || 0}
            onPageChange={handleChangePage}
            rowsPerPage={perPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50]}
            sx={{ color: subInk, fontSize: 12, borderTop: `1px solid ${border}` }}
          />
        </Paper>
      )}
    </Container>
  );
};

export default UserOrder;
