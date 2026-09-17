import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Tooltip,
  IconButton,
  useTheme,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getOnlinePaymentReport } from "../../../../api/controller/admin_controller/report/report_controller";

const fmt = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function OnlinePaymentMiniRow() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const fetchPaymentReport = async () => {
    setLoading(true);
    try {
      const res = await getOnlinePaymentReport();
      if (res?.status === "success") {
        setReport(res?.data ?? null);
      } else if (res?.data) {
        setReport(res.data);
      }
    } catch (err) {
      console.error("Error fetching online payment report for dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentReport();
  }, []);

  const summary = report?.summary ?? {};
  const today = report?.today ?? {};

  const stats = [
    {
      title: "Total Payments",
      count: summary.total_payments ?? 0,
      amount: fmt(summary.total_amount ?? 0),
      color: "#6366f1",
      bgColor: "rgba(99, 102, 241, 0.1)",
      icon: <AccountBalanceWalletIcon sx={{ fontSize: 18 }} />,
    },
    {
      title: "Successful",
      count: summary.successful?.count ?? 0,
      amount: fmt(summary.successful?.amount ?? 0),
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.1)",
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />,
    },
    {
      title: "Pending",
      count: summary.pending?.count ?? 0,
      amount: fmt(summary.pending?.amount ?? 0),
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.1)",
      icon: <HourglassEmptyIcon sx={{ fontSize: 18 }} />,
    },
    {
      title: "Failed",
      count: summary.failed?.count ?? 0,
      amount: fmt(summary.failed?.amount ?? 0),
      color: "#ef4444",
      bgColor: "rgba(239, 68, 68, 0.1)",
      icon: <ErrorOutlineIcon sx={{ fontSize: 18 }} />,
    },
    {
      title: "Today's Online Sales",
      count: today.successful_count ?? 0,
      amount: fmt(today.successful_amount ?? 0),
      color: "#0ea5e9",
      bgColor: "rgba(14, 165, 233, 0.1)",
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />,
    },
  ];

  return (
    <Card
      sx={{
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack spacing={2}>
          {/* Header Row */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  bgcolor: "rgba(99, 102, 241, 0.12)",
                  color: "#6366f1",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <AccountBalanceWalletIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  Online Payment Summary
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Overview of online gateway transactions & earnings
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="Refresh Payment Summary">
                <IconButton size="small" onClick={fetchPaymentReport} disabled={loading}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Button
                size="small"
                variant="outlined"
                endIcon={<ArrowForwardIcon fontSize="small" />}
                onClick={() => navigate("/admin/report/online-payments")}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  borderColor: "divider",
                  color: "text.primary",
                  "&:hover": {
                    borderColor: "#6366f1",
                    bgcolor: "rgba(99, 102, 241, 0.08)",
                  },
                }}
              >
                View Full Report
              </Button>
            </Stack>
          </Stack>

          {/* Body Section */}
          {loading && !report ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {stats.map((item, idx) => (
                <Grid item xs={12} sm={6} md={2.4} key={idx}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                      transition: "border-color 0.2s, transform 0.2s",
                      "&:hover": {
                        borderColor: item.color,
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.8 }}>
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: 1.5,
                          bgcolor: item.bgColor,
                          color: item.color,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 700,
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.3,
                        }}
                        noWrap
                      >
                        {item.title}
                      </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                      <Typography variant="h6" sx={{ fontWeight: 800, color: item.color, fontSize: 17 }}>
                        {item.amount}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                        ({item.count})
                      </Typography>
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
