import React from "react";
import PolicyPageTemplate from "./PolicyPageTemplate";

const sections = [
  {
    title: "Support Channels",
    body: "Customers and sellers can contact MyZoo through official support channels shown on the platform, including email, phone, and dashboard support options when available.",
  },
  {
    title: "Order Support",
    body: "For order-related support, users should provide the order number, store name, product details, payment reference if available, and a clear explanation of the issue.",
  },
  {
    title: "Seller Support",
    body: "Seller support may cover store setup, subscription packages, product management, category activation, media orders, payments, delivery settings, and dashboard access.",
  },
  {
    title: "Response Time",
    body: "We aim to respond as quickly as possible. Resolution time may vary depending on issue complexity, seller cooperation, payment gateway response, or delivery partner involvement.",
  },
  {
    title: "Contact",
    body: "For support, contact MyZoo at hi@myzoo.asia or use the support option available inside your customer account or seller dashboard.",
  },
];

const SupportPolicy = () => (
  <PolicyPageTemplate
    title="Support Policy"
    intro="This Support Policy explains how MyZoo helps customers and sellers with ecommerce, storefront, payment, delivery, and account-related issues."
    sections={sections}
  />
);

export default SupportPolicy;
