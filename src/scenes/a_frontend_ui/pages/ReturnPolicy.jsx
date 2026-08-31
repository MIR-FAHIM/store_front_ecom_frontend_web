import React from "react";
import PolicyPageTemplate from "./PolicyPageTemplate";

const sections = [
  {
    title: "Return Eligibility",
    body: "Returns may be accepted when the item is unused, in original condition, and reported within the eligible return window shown by the store or platform policy.",
  },
  {
    title: "Non-returnable Items",
    body: "Certain items such as perishable goods, hygiene-sensitive products, personalized products, clearance items, or damaged-by-user products may not be eligible for return.",
  },
  {
    title: "Return Review",
    body: "Returned products may be reviewed by the seller or MyZoo support before approval. Approval depends on product condition, order records, and applicable seller rules.",
  },
  {
    title: "Refund Processing",
    body: "Approved refunds are processed through the original payment method where possible. Processing time may vary depending on payment gateway, bank, or mobile financial service provider.",
  },
  {
    title: "Contact",
    body: "For return help, contact support with your order number, product details, photos if applicable, and the reason for the return request.",
  },
];

const ReturnPolicy = () => (
  <PolicyPageTemplate
    title="Return Policy"
    intro="This Return Policy explains how customers can request returns for eligible orders placed through MyZoo storefronts and marketplace services."
    sections={sections}
  />
);

export default ReturnPolicy;
