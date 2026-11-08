export const shopStatusOptions = [
  { value: "active", label: "Active", color: "success" },
  { value: "inactive", label: "Inactive", color: "default" },
  { value: "pending", label: "Pending", color: "info" },
  { value: "suspended", label: "Suspended", color: "warning" },
  { value: "banned", label: "Banned", color: "error" },
];

export const getShopStatus = (status) =>
  shopStatusOptions.find(({ value }) => value === status) ||
  { value: "", label: status || "Not set", color: "default" };
