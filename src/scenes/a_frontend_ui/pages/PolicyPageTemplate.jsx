import React from "react";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";

const PolicyPageTemplate = ({ title, intro, sections }) => (
  <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 4, md: 5 },
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1, fontWeight: 700 }}>
            MyZoo / {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 950, letterSpacing: 0, lineHeight: 1.08 }}>
            {title}
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1.5, lineHeight: 1.8 }}>
            {intro}
          </Typography>
        </Box>

        <Stack spacing={2.7}>
          {sections.map((section) => (
            <Box key={section.title}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.8 }}>
                {section.title}
              </Typography>
              <Typography sx={{ color: "text.secondary", lineHeight: 1.85 }}>
                {section.body}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  </Container>
);

export default PolicyPageTemplate;
