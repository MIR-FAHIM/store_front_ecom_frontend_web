import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getTodayDealProduct } from "../../../../api/controller/admin_controller/product/product_controller";
import FeaturedTitle from "./FeaturedTitle";
import HorizontalProductCard from "../../../a_frontend_ui/product/components/HorizontalProductCard";

const safeArray = (x) => (Array.isArray(x) ? x : []);

export default function TodayDealProduct({ onView, compact = false, title, storeParams = {} }) {
    const navigate = useNavigate();
    const scrollRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [scrollState, setScrollState] = useState({ canLeft: false, canRight: false });

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const res = await getTodayDealProduct({ page: 1, per_page: 50, ...storeParams });
                const list = res?.data?.data ?? res?.data ?? res ?? [];
                if (mounted) setItems(safeArray(list));
            } catch (e) {
                console.error("loadTodayDealProducts error:", e);
                if (mounted) setItems([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [storeParams]);

    const content = useMemo(() => {
        if (loading) {
            return (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (!items.length) {
            return (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No today deal products yet.
                </Typography>
            );
        }

        return (
            <Box
                ref={scrollRef}
                onScroll={() => {
                    const el = scrollRef.current;
                    if (!el) return;
                    const maxScroll = el.scrollWidth - el.clientWidth;
                    setScrollState({
                        canLeft: el.scrollLeft > 4,
                        canRight: el.scrollLeft < maxScroll - 4,
                    });
                }}
                sx={{
                    display: "flex",
                     borderRadius: 1,
                    gap: 1.5,
                    overflowX: "auto",
                    pb: 1,
                    pr: 1,
                    scrollSnapType: "x mandatory",
                    "& > *": { scrollSnapAlign: "start" },
                    msOverflowStyle: "none",
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                }}
            >
                {items.map((product) => (
                    <HorizontalProductCard
                        key={product.id}
                        product={product}
                        onView={() => onView?.(product)}
                    />
                ))}
            </Box>
        );
    }, [items, loading, onView]);

    const handleScroll = (dir) => {
        const el = scrollRef.current;
        if (!el) return;
        const amount = Math.max(260, Math.floor(el.clientWidth * 0.7));
        el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    };

    const handleSeeAll = () => {
        navigate("/today-deals");
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        setScrollState({
            canLeft: el.scrollLeft > 4,
            canRight: el.scrollLeft < maxScroll - 4,
        });
    }, [items, loading]);

    return (
        <Box
            sx={{
                mt: 0,
                p: compact ? 2 : 2,
                borderRadius: 1,
                bgcolor: "background.paper",
                boxShadow: "0 16px 32px rgba(0,0,0,0.06)",
                width: { xs: "100%", md: 820 },
                maxWidth: "100%",
                minWidth: 0,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1 }}>
                <FeaturedTitle variant={compact ? "h6" : "h5"} mb={compact ? 1 : 2}>
                    {title || (compact ? "Flash Sale" : "Today Deals")}
                </FeaturedTitle>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, cursor: "pointer" }} onClick={handleSeeAll}>
                        See all
                    </Typography>
                    <IconButton size="small" onClick={() => handleScroll("left")} disabled={!scrollState.canLeft}>
                        <ChevronLeft fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleScroll("right")} disabled={!scrollState.canRight}>
                        <ChevronRight fontSize="small" />
                    </IconButton>
                </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
                {content}
            </Box>
        </Box>
    );
}
