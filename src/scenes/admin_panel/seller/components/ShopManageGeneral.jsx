import React from "react";
import {
	Box,
	Button,
	Grid,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

const ShopManageGeneral = ({ form, onChange, onSave, saving }) => {
	return (
		<Box>
			<Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
				General Info
			</Typography>
			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<TextField
						fullWidth
						label="Shop Name"
						value={form.name}
						onChange={(e) => onChange("name", e.target.value)}
					/>
				</Grid>
				<Grid item xs={12} md={6}>
					<TextField
						fullWidth
						label="Slug"
						value={form.slug}
						onChange={(e) => onChange("slug", e.target.value)}
					/>
				</Grid>

				<Grid item xs={12}>
					<TextField
						fullWidth
						label="Description"
						multiline
						minRows={3}
						value={form.description}
						onChange={(e) => onChange("description", e.target.value)}
					/>
				</Grid>

				<Grid item xs={12} md={6}>
					<TextField
						fullWidth
						label="Phone"
						value={form.phone}
						onChange={(e) => onChange("phone", e.target.value)}
					/>
				</Grid>
				<Grid item xs={12} md={6}>
					<TextField
						fullWidth
						label="Email"
						type="email"
						value={form.email}
						onChange={(e) => onChange("email", e.target.value)}
					/>
				</Grid>

				<Grid item xs={12} md={6}>
					<TextField
						fullWidth
						label="Address"
						value={form.address}
						onChange={(e) => onChange("address", e.target.value)}
					/>
				</Grid>
				<Grid item xs={12} md={6}>
					<TextField
						fullWidth
						label="Zone"
						value={form.zone}
						onChange={(e) => onChange("zone", e.target.value)}
					/>
				</Grid>
				<Grid item xs={12} md={6}>
					<TextField
						fullWidth
						label="District"
						value={form.district}
						onChange={(e) => onChange("district", e.target.value)}
					/>
				</Grid>
				<Grid item xs={12} md={6}>
					<TextField
						fullWidth
						label="Area"
						value={form.area}
						onChange={(e) => onChange("area", e.target.value)}
					/>
				</Grid>

				<Grid item xs={12} md={6}>
					<TextField
						fullWidth
						label="Latitude"
						value={form.lat}
						onChange={(e) => onChange("lat", e.target.value)}
					/>
				</Grid>
				<Grid item xs={12} md={6}>
					<TextField
						fullWidth
						label="Longitude"
						value={form.lon}
						onChange={(e) => onChange("lon", e.target.value)}
					/>
				</Grid>

			</Grid>

			<Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
				<Button variant="contained" onClick={onSave} disabled={saving}>
					{saving ? "Saving..." : "Save Changes"}
				</Button>
			</Stack>
		</Box>
	);
};

export default ShopManageGeneral;
