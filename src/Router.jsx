import React from "react";
// Scroll to top on route change
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import { hasCustomerSite, hasSellerPanel, initialRoute } from "./api/config";
import Dashboard from "./scenes/admin_panel/dashboard";
import AdminProfile from "./scenes/admin_panel/profile";
import Login from "./scenes/auth/login";
import AdminLogin from "./scenes/auth/admin_login";
import SellerLogin from "./scenes/auth/seller_login";
import LoginOtp from "./scenes/auth/LoginOtp";
import Register from "./scenes/auth/Register";
import SellerRegister from "./scenes/auth/SellerRegister";
import AddProductTab from "./scenes/admin_panel/product/add_product/AddProductTab";
import AllProducts from "./scenes/admin_panel/product/AllProducts";
import InactiveProducts from "./scenes/admin_panel/product/InactiveProducts";
import StockOutProduct from "./scenes/admin_panel/product/StockOutProduct";
import SellerProducts from "./scenes/admin_panel/product/SellerProducts";
import AllOrdersEcom from "./scenes/admin_panel/order/AllOrders";
import AllTransaction from "./scenes/admin_panel/accounts/AllTransaction";
import Settlement from "./scenes/admin_panel/accounts/Settlement";
import OderDetails from "./scenes/admin_panel/order/OderDetails";
import CompletedOrders from "./scenes/admin_panel/order/CompletedOrders";
import OrderReport from "./scenes/admin_panel/order/OrderReport";
import AddSeller from "./scenes/admin_panel/seller/AddSeller";
import AllSellers from "./scenes/admin_panel/seller/AllSellers";
import AddCustomer from "./scenes/admin_panel/customer/AddCustomer";
import AllCustomers from "./scenes/admin_panel/customer/AllCustomers";
import TodayReport from "./scenes/admin_panel/report/TodayReport";
import MonthWiseReport from "./scenes/admin_panel/report/MonthWiseReport";
import LoginSuccessLogs from "./scenes/admin_panel/report/LoginSuccessLogs";
import AddCategory from "./scenes/admin_panel/category/AddCategory";
import BrandManagement from "./scenes/admin_panel/brand/BrandManagement";
import SubscriptionPackageManagement from "./scenes/admin_panel/subscription/SubscriptionPackageManagement";
import AddDeliveryMan from "./scenes/admin_panel/delivery/AddDeliveryMan";
import DeliveryManDetail from "./scenes/admin_panel/delivery/DeliveryManDetail";
import RelatedProductAdd from "./scenes/admin_panel/product/add_product/components/RelatedProductAdd";

import EcommerceSetting from "./scenes/admin_panel/setting/EcommerceSetting";
import EcommerceAccounts from "./scenes/admin_panel/accounts/EcommerceAccounts";
import AddBanner from "./scenes/admin_panel/media/AddBanner";
import Attribute from "./scenes/admin_panel/product/attribute/attribute";
import AllMedia from "./scenes/admin_panel/media/AllMedia";
import EditProduct from "./scenes/admin_panel/product/edit_product/EditProduct";
import AllDeliveryMans from "./scenes/admin_panel/delivery/AllDeliveryMans";
import WebsiteLogoSetting from "./scenes/admin_panel/setting/website_logo_setting";
import ShippingCostSetting from "./scenes/admin_panel/setting/shipping_cost";
import ErrorLog from "./scenes/admin_panel/error_log/ErrorLog";

// Public / frontend pages
import HomeP1 from "./scenes/a_frontend_ui/home/Home";
import FeaturedProductList from "./scenes/a_frontend_ui/home/FeaturedProductList";
import ProductDetail from "./scenes/a_frontend_ui/product/ProductDetail";
import CategoryWiseProduct from "./scenes/a_frontend_ui/product/category_wise/CategoryWiseProduct";
import Cart from "./scenes/a_frontend_ui/order/cart";
import Brand from "./scenes/a_frontend_ui/brand/brand";
import BrandProductsPage from "./scenes/a_frontend_ui/brand/BrandProductsPage";
import AllCategory from "./scenes/a_frontend_ui/category/AllCategory";


import FrontendLayout from "./scenes/a_frontend_ui/layout/FrontendLayout";
import CategoryWiseProductHome from "./scenes/a_frontend_ui/home/components/category_wise_product_home";
import Privacy from "./scenes/a_frontend_ui/pages/Privacy";
import Terms from "./scenes/a_frontend_ui/pages/Terms";
import About from "./scenes/a_frontend_ui/pages/About";
import Contact from "./scenes/a_frontend_ui/pages/Contact";
import DateInvitation from "./scenes/a_frontend_ui/pages/DateInvitation";
import StoreOwnerLanding from "./scenes/a_frontend_ui/pages/StoreOwnerLanding";
import ProceedOrder from "./scenes/a_frontend_ui/order/ProceedOrder";
import OrderSuccessPage from "./scenes/a_frontend_ui/order/order_success_page";
import PaymentSuccessPage from "./scenes/a_frontend_ui/order/PaymentSuccessPage";
import PaymentFailedPage from "./scenes/a_frontend_ui/order/PaymentFailedPage";
import PaymentCancelledPage from "./scenes/a_frontend_ui/order/PaymentCancelledPage";
import Profile from "./scenes/a_frontend_ui/profile/Profile";
import UserOrder from "./scenes/a_frontend_ui/order/UserOrder";
import UserOrderDetails from "./scenes/a_frontend_ui/order/UserOrderDetails";
import Wish from "./scenes/a_frontend_ui/wish/Wish";
import RelatedProduct from "./scenes/a_frontend_ui/product/related_product/RelatedProduct";
import ProductReview from "./scenes/a_frontend_ui/product/review_product/ProductReview";
import AddShop from "./scenes/a_frontend_ui/seller/AddShop";
import ShopProducts from "./scenes/a_frontend_ui/seller/ShopProducts";
import EditSellerTab from "./scenes/admin_panel/seller/EditSellerTab";
import ShopList from "./scenes/a_frontend_ui/seller/ShopList";
import SearchedProductList from "./scenes/a_frontend_ui/search_product/SearchedProductList";
import PosManagement from "./scenes/admin_panel/pos_management/PosManagement";
import RequireAdmin from "./components/RequireAdmin";
import RequireSeller from "./components/RequireSeller";
import Blogs from "./scenes/a_frontend_ui/blogs/Blogs";
import FlashSale from "./scenes/a_frontend_ui/flash_sale/FlashSale";
import AllProductsPage from "./scenes/a_frontend_ui/product/all_product/AllProductsPage";
import TodayDealsPage from "./scenes/a_frontend_ui/product/today_deal/TodayDealsPage";

// Seller panel
import SellerLayout from "./scenes/seller_panel/layout/SellerLayout";
import SellerDashboard from "./scenes/seller_panel/dashboard/index";
import SellerPanelProducts from "./scenes/seller_panel/product/SellerProducts";
import SellerProductCatalog from "./scenes/seller_panel/product/SellerProductCatalog";
import StoreProductEdit from "./scenes/seller_panel/product/StoreProductEdit";
import SellerShopList from "./scenes/seller_panel/shop/SellerShopList";
import SellerShopProduct from "./scenes/seller_panel/shop/SellerShopProduct";
import AddProductTabSeller from "./scenes/seller_panel/product/add_product/AddProductTab";
import EditProductSeller from "./scenes/seller_panel/product/edit_product/EditProduct";
import OrderShop from "./scenes/seller_panel/order/OrderShop";
import SellerBankAccount from "./scenes/seller_panel/accounting/bank_account";
import PosManagementSeller from "./scenes/seller_panel/pos_management/PosManagement";
import SellerOrderDetails from "./scenes/seller_panel/order/SellerOrderDetails";
import SettledAmountHistory from "./scenes/seller_panel/accounting/settled_amount_history";
import MerchantPackages from "./scenes/seller_panel/subscription/MerchantPackages";
import SellerBannerManager from "./scenes/seller_panel/banner/SellerBannerManager";
import SellerCategoryManagement from "./scenes/seller_panel/category/SellerCategoryManagement";
import MediaMarketplace from "./scenes/seller_panel/media/MediaMarketplace";
import MediaResourceDetails from "./scenes/seller_panel/media/MediaResourceDetails";
import MediaOrders from "./scenes/seller_panel/media/MediaOrders";
import MediaOrderDetails from "./scenes/seller_panel/media/MediaOrderDetails";
import MediaOrderPaymentResult from "./scenes/seller_panel/media/MediaOrderPaymentResult";
import SellerMediaLibrary from "./scenes/seller_panel/media/SellerMediaLibrary";
import AdminMediaMarketplace from "./scenes/admin_panel/media_marketplace/AdminMediaMarketplace";
import { storeScopedPath } from "./utils/productRoute";
import SellerStoreQrPanel from "./scenes/seller_panel/store_qr/SellerStoreQrPanel";



const readActiveStoreSlug = () => {
  try {
    return sessionStorage.getItem("active_store_slug") || "";
  } catch {
    return "";
  }
};

const StorefrontRedirect = ({ path = "" }) => {
  const location = useLocation();
  const storeSlug = readActiveStoreSlug();
  if (!storeSlug) return <Navigate to="/store-owner" replace />;

  const targetPath = path || location.pathname;
  return <Navigate to={`${storeScopedPath(targetPath, storeSlug)}${location.search || ""}`} replace />;
};

const AppRouter = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/admin-login" element={<AdminLogin />}></Route>
        <Route path="/date-invitation" element={<DateInvitation />}></Route>
        <Route path="/" element={hasCustomerSite ? <StoreOwnerLanding /> : <Navigate to="/admin" replace />}></Route>
        <Route path="/store-owner" element={<StoreOwnerLanding />}></Route>
        <Route path="/start-selling" element={<StoreOwnerLanding />}></Route>
        {hasCustomerSite && (
          <>
            <Route path="/login" element={<Login />}></Route>
            <Route path="/login-otp" element={<LoginOtp />}></Route>
            <Route path="/register" element={<Register />}></Route>
          </>
        )}
        {hasSellerPanel && (
          <>
            <Route path="/seller-login" element={<SellerLogin />}></Route>
            <Route path="/seller-register" element={<SellerRegister />}></Route>
            <Route path="/seller/stores/:storeId/media-orders/:orderId/payment-success" element={<MediaOrderPaymentResult result="success" />}></Route>
            <Route path="/seller/stores/:storeId/media-orders/:orderId/payment-failed" element={<MediaOrderPaymentResult result="failed" />}></Route>
            <Route path="/seller/stores/:storeId/media-orders/:orderId/payment-cancelled" element={<MediaOrderPaymentResult result="cancelled" />}></Route>
          </>
        )}
        {/* Public / storefront routes */}
        {hasCustomerSite && (
          <Route path="/" element={<FrontendLayout />}>
            <Route path="home" element={<StorefrontRedirect path="/" />} />
            <Route path="store/:slug" element={<HomeP1 />} />

            <Route path="featured-products" element={<StorefrontRedirect />} />
            <Route path="store/:slug/featured-products" element={<FeaturedProductList />} />

            <Route path="profile" element={<StorefrontRedirect />} />
            <Route path="store/:slug/profile" element={<Profile />} />

            <Route path="product/:idOrSlug" element={<StorefrontRedirect />} />
            <Route path="store/:slug/products" element={<AllProductsPage />} />
            <Route path="store/:slug/products/:idOrSlug" element={<ProductDetail />} />
            <Route path="store/:slug/product/:idOrSlug" element={<ProductDetail />} />
            <Route path="store/:slug/category/:id" element={<CategoryWiseProduct />} />
            <Route path="shop/:id" element={<StorefrontRedirect path="/" />} />
            <Route path="shops" element={<StorefrontRedirect path="/" />} />
            <Route path="category/:id" element={<StorefrontRedirect />} />
            <Route path="cart" element={<StorefrontRedirect />} />
            <Route path="store/:slug/cart" element={<Cart />} />
            <Route path="orders" element={<StorefrontRedirect />} />
            <Route path="store/:slug/orders" element={<UserOrder />} />
            <Route path="order/:id" element={<StorefrontRedirect />} />
            <Route path="store/:slug/order/:id" element={<UserOrderDetails />} />
            <Route path="checkout" element={<StorefrontRedirect />} />
            <Route path="store/:slug/checkout" element={<ProceedOrder />} />
            <Route path="order-success" element={<StorefrontRedirect />} />
            <Route path="store/:slug/order-success" element={<OrderSuccessPage />} />
            <Route path="payment-success" element={<StorefrontRedirect />} />
            <Route path="store/:slug/payment-success" element={<PaymentSuccessPage />} />
            <Route path="payment-failed" element={<StorefrontRedirect />} />
            <Route path="store/:slug/payment-failed" element={<PaymentFailedPage />} />
            <Route path="payment-cancelled" element={<StorefrontRedirect />} />
            <Route path="store/:slug/payment-cancelled" element={<PaymentCancelledPage />} />
            <Route path="payments/aamarpay/success" element={<StorefrontRedirect path="/payment-success" />} />
            <Route path="payments/aamarpay/fail" element={<StorefrontRedirect path="/payment-failed" />} />
            <Route path="payments/aamarpay/cancel" element={<StorefrontRedirect path="/payment-cancelled" />} />
            <Route path="privacy" element={<StorefrontRedirect />} />
            <Route path="store/:slug/privacy" element={<Privacy />} />
            <Route path="terms" element={<StorefrontRedirect />} />
            <Route path="store/:slug/terms" element={<Terms />} />
            <Route path="blogs" element={<StorefrontRedirect />} />
            <Route path="store/:slug/blogs" element={<Blogs />} />
            <Route path="flash-sale" element={<StorefrontRedirect />} />
            <Route path="store/:slug/flash-sale" element={<FlashSale />} />
            <Route path="about" element={<StorefrontRedirect />} />
            <Route path="store/:slug/about" element={<About />} />
            <Route path="contact" element={<StorefrontRedirect />} />
            <Route path="store/:slug/contact" element={<Contact />} />
            <Route path="proceed-order" element={<StorefrontRedirect />} />
            <Route path="store/:slug/proceed-order" element={<ProceedOrder />} />
            <Route path="wish" element={<StorefrontRedirect />} />
            <Route path="store/:slug/wish" element={<Wish />} />
            <Route path="related-product" element={<StorefrontRedirect />} />
            <Route path="store/:slug/related-product" element={<RelatedProduct />} />
            <Route path="product-review" element={<StorefrontRedirect />} />
            <Route path="store/:slug/product-review" element={<ProductReview />} />
            <Route path="seller/add" element={<Navigate to="/seller-register" replace />} />
            <Route path="brands" element={<StorefrontRedirect />} />
            <Route path="store/:slug/brands" element={<Brand />} />
            <Route path="brands/:brandId/products" element={<StorefrontRedirect />} />
            <Route path="store/:slug/brands/:brandId/products" element={<BrandProductsPage />} />
            <Route path="categories" element={<StorefrontRedirect />} />
            <Route path="store/:slug/categories" element={<AllCategory />} />
            <Route path="categories/home" element={<StorefrontRedirect />} />
            <Route path="store/:slug/categories/home" element={<CategoryWiseProductHome />} />
            <Route path="search" element={<StorefrontRedirect />} />
            <Route path="store/:slug/search" element={<SearchedProductList />} />
            <Route path="all-products" element={<StorefrontRedirect />} />
            <Route path="today-deals" element={<StorefrontRedirect />} />
            <Route path="store/:slug/all-products" element={<AllProductsPage />} />
            <Route path="store/:slug/today-deals" element={<TodayDealsPage />} />

          </Route>
        )}



        <Route path="/" element={<RequireAdmin><App /></RequireAdmin>}>

          {!hasCustomerSite && <Route index element={<Navigate to="/admin" replace />} />}
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/pos" element={<PosManagement />} />

          {/* Product Routes */}
          <Route path="/ecom/product/add" element={<AddProductTab />} />
          <Route path="/ecom/product/all" element={<AllProducts />} />
          <Route path="/ecom/product/inactive" element={<InactiveProducts />} />
          <Route path="/ecom/product/stock-out" element={<StockOutProduct />} />
          <Route path="/ecom/product/seller" element={<SellerProducts />} />
          <Route path="/ecom/product/attribute" element={<Attribute />} />
          <Route path="/ecom/product/edit/:id" element={<EditProduct />} />
          <Route path="related-product-add" element={<RelatedProductAdd />} />
          <Route path="/ecom/category/add" element={<AddCategory />} />
          <Route path="/ecom/brand/manage" element={<BrandManagement />} />
          <Route path="/admin/subscription-packages" element={<SubscriptionPackageManagement />} />
          {/* Order Routes */}
          <Route path="/ecom/order/all" element={<AllOrdersEcom />} />
          <Route path="/ecom/order/completed" element={<CompletedOrders />} />
          <Route path="/ecom/order/report" element={<OrderReport />} />
          <Route path="/admin/order/:id" element={<OderDetails />} />

          {/* Seller Routes */}
          <Route path="/ecom/seller/add" element={<AddSeller />} />
          <Route path="/ecom/seller/all" element={<AllSellers />} />
          <Route path="/ecom/admin/seller/:id" element={<EditSellerTab />} />
          <Route path="/ecom/admin/seller/edit/:id" element={<EditSellerTab />} />


          {/* Customer Routes */}
          <Route path="/ecom/customer/add" element={<AddCustomer />} />
          <Route path="/ecom/customer/all" element={<AllCustomers />} />

          {/* Report Routes */}
          <Route path="/ecom/report/today" element={<TodayReport />} />
          <Route path="/ecom/report/month-wise" element={<MonthWiseReport />} />
          <Route path="/ecom/report/login-success" element={<LoginSuccessLogs />} />

          {/* Delivery Routes */}
          <Route path="/ecom/delivery/add" element={<AddDeliveryMan />} />
          <Route path="/ecom/delivery/all" element={<AllDeliveryMans />} />
          <Route path="/ecom/delivery/detail/:id" element={<DeliveryManDetail />} />

          {/* Settings & Accounts */}
          <Route path="/ecom/setting" element={<EcommerceSetting />} />
          <Route path="/ecom/accounts" element={<EcommerceAccounts />} />
          <Route path="/ecom/accounts/transactions" element={<AllTransaction />} />
          <Route path="/ecom/accounts/settlements" element={<Settlement />} />
          <Route path="/ecom/setting/website-logo" element={<WebsiteLogoSetting />} />
          <Route path="/ecom/setting/shipping-cost" element={<ShippingCostSetting />} />
          <Route path="/ecom/error-log" element={<ErrorLog />} />


          <Route path="/ecom/banner/add" element={<AddBanner />} />
          <Route path="/ecom/media/all" element={<AllMedia />} />
          <Route path="/admin/media-marketplace" element={<AdminMediaMarketplace />} />

        </Route>`r`n
        {hasSellerPanel && (
          <Route path="/seller" element={<RequireSeller><SellerLayout /></RequireSeller>}>
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="products" element={<SellerPanelProducts />} />
            <Route path="catalog" element={<SellerProductCatalog />} />
            <Route path="stores/:storeId/products" element={<SellerPanelProducts />} />
            <Route path="stores/:storeId/catalog" element={<SellerProductCatalog />} />
            <Route path="stores/:storeId/products/:storeProductId/edit" element={<StoreProductEdit />} />
            <Route path="shops" element={<SellerShopList />} />
            <Route path="shops/add" element={<AddShop />} />
            <Route path="shops/products" element={<SellerShopProduct />} />
            <Route path="accounting" element={<SellerBankAccount />} />
            <Route path="add/product" element={<AddProductTabSeller />} />
            <Route path="edit/product/:id" element={<EditProductSeller />} />
            <Route path="orders" element={<OrderShop />} />
            <Route path="pos" element={<PosManagementSeller />} />
            <Route path="packages" element={<MerchantPackages />} />
            <Route path="banners" element={<SellerBannerManager />} />
            <Route path="store-qr" element={<SellerStoreQrPanel />} />
            <Route path="categories" element={<SellerCategoryManagement />} />
            <Route path="stores/:storeId/categories" element={<SellerCategoryManagement />} />
            <Route path="media-marketplace" element={<MediaMarketplace />} />
            <Route path="media-library" element={<SellerMediaLibrary />} />
            <Route path="media-marketplace/resources/:idOrSlug" element={<MediaResourceDetails />} />
            <Route path="media-orders" element={<MediaOrders />} />
            <Route path="stores/:storeId/media-orders" element={<MediaOrders />} />
            <Route path="stores/:storeId/media-orders/:orderId" element={<MediaOrderDetails />} />
            <Route path="orders/:id" element={<SellerOrderDetails />} />
            <Route path="accounting/settled-amount-history" element={<SettledAmountHistory />} />

          </Route>
        )}
        {hasSellerPanel && (
          <Route path="/merchant" element={<RequireSeller><SellerLayout /></RequireSeller>}>
            <Route path="packages" element={<MerchantPackages />} />
          </Route>
        )}
        {!hasCustomerSite && <Route path="*" element={<Navigate to="/admin" replace />} />}
      </Routes>
    </Router>
  );
};

export default AppRouter;
