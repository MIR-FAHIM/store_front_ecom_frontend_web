import React from "react";
import PolicyPageTemplate from "./PolicyPageTemplate";

const sections = [
  {
    title: "Information We Collect",
    body: "We collect information needed to operate the marketplace and store services, including account details, contact information, delivery addresses, order history, payment references, device data, and communications with support.",
  },
  {
    title: "How We Use Information",
    body: "We use information to create accounts, process orders, manage seller storefronts, provide customer support, improve product discovery, prevent fraud, personalize the shopping experience, and send service-related updates.",
  },
  {
    title: "Orders and Payments",
    body: "Order and payment information may be used to confirm purchases, calculate delivery charges, reconcile transactions, process refunds, and support sellers, customers, payment gateways, and delivery partners involved in completing an order.",
  },
  {
    title: "Cookies and Tracking",
    body: "We may use cookies and similar technologies to keep users signed in, remember preferences, understand site performance, improve campaigns, and maintain a secure shopping and seller dashboard experience.",
  },
  {
    title: "Data Sharing",
    body: "We share information only when needed with sellers, delivery partners, payment processors, technology providers, professional advisers, or legal authorities. We do not sell personal data as a standalone product.",
  },
  {
    title: "Data Security",
    body: "We use reasonable administrative, technical, and organizational safeguards to protect user data. No online system is completely risk-free, so users should also protect passwords and report suspicious activity quickly.",
  },
  {
    title: "User Rights",
    body: "Users may request access, correction, update, or deletion of their personal information, subject to identity verification, legal obligations, transaction records, fraud prevention, and platform safety requirements.",
  },
  {
    title: "Contact",
    body: "For privacy questions or account data requests, contact MyZoo support at hi@myzoo.asia or through the official support channels shown on the platform.",
  },
];

const Privacy = () => (
  <PolicyPageTemplate
    title="Privacy Policy"
    intro="This Privacy Policy explains how MyZoo collects, uses, stores, and protects information for customers, sellers, and visitors using our ecommerce and store-first commerce platform."
    sections={sections}
  />
);

export default Privacy;
