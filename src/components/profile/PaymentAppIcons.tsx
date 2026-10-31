import React from "react";

export interface PaymentAppItem {
  id: string;
  name: string;
  isCustom?: boolean;
  packageOrScheme?: string;
}

export const DEFAULT_PAYMENT_APPS: PaymentAppItem[] = [
  {
    id: "gpay",
    name: "Google Pay",
    packageOrScheme: "com.google.android.apps.nbu.paisa.user",
  },
  {
    id: "paytm",
    name: "Paytm",
    packageOrScheme: "net.one97.paytm",
  },
  {
    id: "samsungwallet",
    name: "Samsung Wallet",
    packageOrScheme: "com.samsung.android.spay",
  },
  {
    id: "phonepe",
    name: "PhonePe",
    packageOrScheme: "com.phonepe.app",
  },
];

export function PaymentAppIcon({
  id,
  className = "w-6 h-6",
}: {
  id: string;
  className?: string;
}) {
  switch (id) {
    case "gpay":
      // Official Google Pay dual-capsule / GPay symbol
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          <path d="M16 11.5h-4v2h2.2c-.3 1-1.2 1.5-2.2 1.5-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5c.6 0 1.2.2 1.6.6l1.2-1.2C13.9 8.8 13 8.5 12 8.5 9.8 8.5 8 10.3 8 12.5s1.8 4 4 4c2.1 0 3.8-1.5 3.8-3.8 0-.4 0-.8-.1-1.2h.3z" />
        </svg>
      );

    case "phonepe":
      // Official PhonePe "पे" emblem
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M19.5 2h-15A2.5 2.5 0 0 0 2 4.5v15A2.5 2.5 0 0 0 4.5 22h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 19.5 2zm-5.2 15.5l-2.4-3.8h-1.6v3.8H8.5V6.5h4.2c2.5 0 4.1 1.4 4.1 3.6 0 1.5-.8 2.7-2.1 3.2l2.7 4.2h-3.1zm-4-5.8h2.3c1.3 0 2.1-.6 2.1-1.7 0-1-.8-1.7-2.1-1.7h-2.3v3.4z" />
        </svg>
      );

    case "paytm":
      // Official Paytm stylized logo badge
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="2" y="5" width="20" height="14" rx="4" />
          <path d="M6 9.5h3.5a1.8 1.8 0 0 1 1.8 1.8v0a1.8 1.8 0 0 1-1.8 1.8H6" />
          <path d="M6 9.5v5" />
          <path d="M14 9.5v5" />
          <path d="M12.5 11.5h3" />
          <path d="M18 11v3.5" />
        </svg>
      );

    case "samsungwallet":
    case "samsungpay":
      // Official Samsung Wallet multi-card symbol
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="3" y="6" width="18" height="13" rx="3.5" />
          <path d="M6 3.5h12a3 3 0 0 1 3 3" />
          <path d="M7 11h10" />
          <circle cx="16" cy="15" r="1" fill="currentColor" />
        </svg>
      );

    default:
      // Custom user-added application icon
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <path d="M9 12h6" />
          <path d="M12 9v6" />
        </svg>
      );
  }
}
