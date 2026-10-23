# Parañaque Palengke

A frontend marketplace prototype for Parañaque public markets. One Vite + React + TypeScript application delivers three connected interfaces for shopping, vendor operations, and LGU price administration.

1. **Customer storefront** — browse, tumawad (offer), cart, checkout, demo QR payment, orders  
2. **Vendor portal** — products, offers, payment verification, store profile  
3. **LGU Admin portal** — commodity standard prices, price history, vendor/offer/order monitoring  

Shared Zustand + localStorage state connects all three portals. This is a demonstration prototype only — no backend, authentication provider, or real payments.

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`). Routing uses **HashRouter** (`#/customer`, `#/vendor`, `#/admin`) for GitHub Pages compatibility.

```bash
npm run build
npm run preview
npm test
```

## Module layout

```
src/features/customer/   # customer layouts + pages
src/features/vendor/     # vendor layouts + pages
src/features/admin/      # LGU admin layouts + pages
src/components/shared/   # shared UI pieces
src/stores/              # shared Zustand stores
src/types/               # shared domain types
src/data/                # seed commodities, products, vendors
src/lib/                 # pricing, offers, order transitions
```

Customer, vendor, and admin page modules do not import each other. They share typed stores and domain helpers only.

## Routes

### Customer (`#/customer/*`)

| Route | Purpose |
|---|---|
| `/customer` | Homepage |
| `/customer/products` | Browse / filter |
| `/customer/products/:productId` | Details + tumawad |
| `/customer/stores/:vendorId` | Vendor storefront |
| `/customer/cart` | Cart |
| `/customer/checkout` | Checkout |
| `/customer/payment/:orderId` | Demo QR payment |
| `/customer/orders` | My orders |
| `/customer/offers` | My offers |

### Vendor (`#/vendor/*`)

| Route | Purpose |
|---|---|
| `/vendor` | Dashboard |
| `/vendor/orders` | Orders |
| `/vendor/orders/:orderId` | Payment verification |
| `/vendor/offers` | Incoming tawad offers |
| `/vendor/products` | Product / stock management |
| `/vendor/store` | Store profile |

### Admin (`#/admin/*`)

| Route | Purpose |
|---|---|
| `/admin` | Summary dashboard |
| `/admin/commodities` | LGU standard price catalog |
| `/admin/price-history` | Mock price history |
| `/admin/vendors` | Vendor directory |
| `/admin/vendors/:vendorId` | Vendor detail |
| `/admin/offers` | Offer monitoring |
| `/admin/orders` | Order monitoring |

`/` redirects to `/customer`.

## Switching interfaces

Use the **portal switcher** beside the cart (also in vendor/admin sidebars) to move between:

- Customer storefront (`#/customer`)
- Vendor portal (`#/vendor`)
- LGU Admin (`#/admin`)

Vendor sidebar also includes an **Active store** picker. All three share the same localStorage state.

## Key workflows

**A — Standard purchase:** browse → cart → checkout at LGU price → I've Paid → vendor confirms → Confirmed  

**B — Accepted tawad:** offer lower price → vendor accepts → add to cart at negotiated price → pay → confirm  

**C — Counteroffer:** offer → vendor counters → customer accepts → checkout at agreed amount  

**D — Rejected offer:** vendor rejects → customer may buy at standard price or offer again  

**E — LGU price update:** admin edits commodity price → customer/vendor immediately see new standard price  

**F — Payment rejection:** I've Paid → vendor rejects → customer resubmits → vendor approves  

## Pricing rules

- Commodity **standard prices** are LGU-controlled and labeled as illustrative demo prices (not official rates).
- Vendors manage stock and availability; they do not edit base LGU prices.
- Negotiated offer prices are transaction-specific and never overwrite the commodity standard price.
- Checkout uses the negotiated unit price only when a valid accepted / counter-accepted offer applies.

## GitHub Pages

- App uses `HashRouter`.
- Optional base path via `VITE_BASE_PATH` (workflow sets `/${{ github.event.repository.name }}/`).
- Workflow file: `.github/workflows/deploy-pages.yml` (manual/push to `main`). Enable GitHub Pages (GitHub Actions) on the repository when ready.
- This project does not auto-create remotes or push without your permission.

## Tests run

```text
npm test  →  8 passed (pricing, offers, cart totals, order transitions)
npm run build → success
```

## Limitations

- Frontend prototype only; no API, database, real QR, delivery, or cross-device sync.
- Demo vendors and prices are fictional.
- Product images load from remote Unsplash/Pexels URLs.
- Persistence is same-browser / same-origin localStorage only.
- Feature modules are separable later into three apps, but currently share one Vite build.
