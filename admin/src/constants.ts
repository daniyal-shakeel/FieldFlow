export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export const LOCAL_STORAGE_PREFIX = "_ff_admin";
export const LOCAL_STORAGE_TOKEN_KEY = "_ff_admin_token";
export const APP_TITLE = "FieldFlow Admin";
export const SIDEBAR_NAV_ITEMS = [
  { label: "Users", href: "/users", icon: "users" },
  { label: "Analytics", href: "/analytics", icon: "analytics" },
  { label: "Plans", href: "/plans", icon: "plans" },
  { label: "Payment Proofs", href: "/payments", icon: "payments" },
  { label: "Payment Accounts", href: "/accounts", icon: "accounts" },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const;


