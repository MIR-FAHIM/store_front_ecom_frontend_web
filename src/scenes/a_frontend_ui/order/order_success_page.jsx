import React from "react";
import { useNavigate } from "react-router-dom";
import { useStorefront } from "../../../context/StorefrontContext";
import {
	Box,
	Button,
	Container,
	Divider,
	Paper,
	Stack,
	Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const OrderSuccessPage = () => {
	const navigate = useNavigate();
	const { storePath } = useStorefront();

	return (
		<Box
			sx={{
				minHeight: "100vh",
				display: "grid",
				placeItems: "center",
				px: 2,
				background:
					"radial-gradient(700px 400px at 10% 10%, rgba(255, 214, 165, 0.35), transparent 60%),\n" +
					"radial-gradient(600px 300px at 90% 20%, rgba(118, 210, 200, 0.35), transparent 65%),\n" +
					"linear-gradient(180deg, #fff7f0 0%, #f7f8ff 100%)",
			}}
		>
			<Container maxWidth="sm">
				<Paper
					elevation={6}
					sx={{
						p: { xs: 3, sm: 4 },
						borderRadius: 4,
						background:
							"linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)",
						border: "1px solid rgba(0,0,0,0.06)",
						backdropFilter: "blur(8px)",
					}}
				>
					<Stack spacing={2.5} alignItems="center" textAlign="center">
						<Box
							sx={{
								width: 84,
								height: 84,
								borderRadius: "50%",
								display: "grid",
								placeItems: "center",
								background:
									"linear-gradient(140deg, rgba(54, 199, 159, 0.2), rgba(54, 199, 159, 0.05))",
								border: "1px solid rgba(54, 199, 159, 0.35)",
							}}
						>
							<CheckCircleIcon sx={{ fontSize: 44, color: "#2db489" }} />
						</Box>

						<Typography
							variant="h4"
							sx={{
								fontWeight: 700,
								letterSpacing: "-0.02em",
								color: "#1f2a44",
							}}
						>
							Order confirmed
						</Typography>
						<Typography variant="body1" sx={{ color: "#49536b" }}>
							Thanks for your purchase. We have received your order and are
							preparing it for shipment.
						</Typography>

						<Divider sx={{ width: "100%" }} />

						<Stack
							spacing={1}
							sx={{
								width: "100%",
								textAlign: "left",
								bgcolor: "rgba(31, 42, 68, 0.04)",
								borderRadius: 2,
								p: 2,
								border: "1px dashed rgba(31, 42, 68, 0.15)",
							}}
						>
							<Typography variant="subtitle2" sx={{ color: "#1f2a44" }}>
								What happens next
							</Typography>
							<Typography variant="body2" sx={{ color: "#5a657f" }}>
								- You will receive a confirmation email shortly.
							</Typography>
							<Typography variant="body2" sx={{ color: "#5a657f" }}>
								- Our team will pack your items within 24 hours.
							</Typography>
							<Typography variant="body2" sx={{ color: "#5a657f" }}>
								- Tracking will appear in your order history once shipped.
							</Typography>
						</Stack>

						<Stack
							direction={{ xs: "column", sm: "row" }}
							spacing={1.5}
							sx={{ width: "100%" }}
						>
							<Button
								variant="contained"
								size="large"
								fullWidth
								onClick={() => navigate(storePath("/orders"))}
								sx={{
									textTransform: "none",
									fontWeight: 700,
									borderRadius: 2.5,
									py: 1.2,
									background:
										"linear-gradient(90deg, #2db489 0%, #3bb3d8 100%)",
								}}
							>
								View order details
							</Button>
							<Button
								variant="outlined"
								size="large"
								fullWidth
								onClick={() => navigate(storePath("/"))}
								sx={{
									textTransform: "none",
									fontWeight: 700,
									borderRadius: 2.5,
									py: 1.2,
								}}
							>
								Continue shopping
							</Button>
						</Stack>
					</Stack>
				</Paper>
			</Container>
		</Box>
	);
};

export default OrderSuccessPage;
