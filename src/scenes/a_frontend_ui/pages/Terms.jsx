import React from "react";
import PolicyPageTemplate from "./PolicyPageTemplate";

const sections = [
  {
    title: "Acceptance of Terms",
    body: "By accessing MyZoo, creating an account, placing an order, managing a store, or using any related service, you agree to follow these Terms & Conditions and applicable platform policies.",
  },
  {
    title: "Account Registration",
    body: "Users must provide accurate registration information and keep account credentials secure. MyZoo may suspend or restrict accounts that provide false information, misuse the service, or create security risk.",
  },
  {
    title: "Products and Pricing",
    body: "Product details, availability, pricing, discounts, and stock may change. Sellers are responsible for keeping product information accurate, and customers should review final checkout details before placing an order.",
  },
  {
    title: "Orders and Payments",
    body: "Orders are confirmed subject to product availability, payment validation, seller acceptance, and platform checks. Online payments are processed through supported payment partners, while cash-on-delivery may depend on store settings.",
  },
  {
    title: "Shipping and Delivery",
    body: "Delivery timing, charges, pickup options, merchant delivery, and courier support may vary by store, location, and order. Estimated delivery times are not guaranteed unless expressly stated.",
  },
  {
    title: "Returns and Refunds",
    body: "Return and refund eligibility depends on product condition, seller policy, platform rules, and payment method. Approved refunds may require processing time through banks or payment providers.",
  },
  {
    title: "Seller Responsibilities",
    body: "Sellers are responsible for store information, product accuracy, inventory, order handling, customer communication, legal compliance, and fulfillment settings connected to their storefront.",
  },
  {
    title: "User Conduct",
    body: "Users must not misuse the platform, attempt unauthorized access, submit fraudulent orders, abuse promotions, violate intellectual property rights, or disrupt platform operations.",
  },
  {
    title: "Limitation of Liability",
    body: "To the maximum extent permitted by law, MyZoo is not liable for indirect losses, seller misrepresentation, delivery delays outside our control, user misuse, or third-party service interruptions.",
  },
  {
    title: "Contact",
    body: "For questions about these terms, contact MyZoo support at hi@myzoo.asia or through the official support channels available on the platform.",
  },
];

const Terms = () => (
  <PolicyPageTemplate
    title="Terms & Conditions"
    intro="These Terms & Conditions govern use of MyZoo ecommerce services, public storefronts, seller tools, marketplace discovery, orders, payments, and related platform features."
    sections={sections}
  />
);

export default Terms;
