# Parañaque Palengke — Customerfront

Customer storefront for Parañaque public markets (**Palengke mo, Keri ko**). Shoppers browse stalls, check out, pay via demo QRPH, track orders, and chat with vendors.

Built with React, TypeScript, and Vite. Talks to the shared Strapi backend (`VITE_API_URL`).

Vendor and LGU portals live in separate apps:

- `paranaque-palengke-vendor` (local, port 5174)
- `paranaque-palengke-lgu` (local, port 5175)

## Quick start

```bash
npm install
# set VITE_API_URL=http://localhost:1337/api in .env.local
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`). Routing uses **HashRouter** (`#/customer`, `#/auth`).

```bash
npm run build
npm run preview
npm test
```

## Routes

| Route | Purpose |
|---|---|
| `/customer` | Homepage |
| `/customer/products` | Browse / filter |
| `/customer/products/:productId` | Product details |
| `/customer/vendors` | Vendor directory |
| `/customer/stores/:vendorId` | Vendor storefront |
| `/customer/cart` | Cart |
| `/customer/checkout` | Checkout (auth) |
| `/customer/payment/:orderId` | Demo QR payment (auth) |
| `/customer/orders` | My orders (auth) |
| `/customer/profile` | Account + delivery prefs (auth) |
| `/customer/chat` | Vendor chat (auth) |
| `/auth` | Customer sign in / register |

`/` redirects to `/customer`.

## Module layout

```
src/features/customer/   # storefront layouts + pages
src/features/auth/       # customer login / register
src/components/shared/   # shared UI pieces
src/stores/              # Zustand stores (API-backed when configured)
src/lib/api/             # Strapi client, mappers, auth
src/types/               # domain types
```

## Live demo

**GitHub Pages:** https://phycxsv.github.io/paranaque-palengke/

## GitHub Pages

- App uses `HashRouter` for static hosting compatibility.
- Base path is set at build time via `VITE_BASE_PATH` (CI uses `/${{ github.event.repository.name }}/`).
- Deploy workflow: `.github/workflows/deploy-pages.yml` (runs on push to `main`).

## Limitations

- Demo QR payment only — no real payments or delivery fulfillment.
- Account profile photo and delivery address are stored locally until the backend exposes those fields.
- Product images may load from remote Unsplash/Pexels URLs.
