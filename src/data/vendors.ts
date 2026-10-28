import type { Vendor } from '@/types'

export const seedVendors: Vendor[] = [
  {
    id: 'vendor-aling-nena',
    name: "Aling Nena's Gulayan",
    description:
      'Demo vegetable stall offering everyday gulay staples for home cooking. Fresh harvest look, demonstration inventory only.',
    categories: ['Vegetables', 'Spices and Condiments'],
    location: 'Baclaran Public Market — Demo Stall A12',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    opensAt: '05:00',
    cutoffTime: '23:59',
    isDemo: true,
    demoQrLabel: 'DEMO QR — Aling Nena Gulayan',
  },
  {
    id: 'vendor-kuya-ben',
    name: "Kuya Ben's Seafood",
    description:
      'Demo seafood counter featuring bangus, tilapia, and shellfish. Simulated stock for prototype walkthroughs.',
    categories: ['Seafood'],
    location: 'La Huerta Palengke — Demo Stall B07',
    imageUrl:
      'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    opensAt: '04:00',
    /** Early cut-off so the disabled / past cut-off state is easy to demo. */
    cutoffTime: '12:00',
    isDemo: true,
    demoQrLabel: "DEMO QR — Kuya Ben's Seafood",
  },
  {
    id: 'vendor-mang-tony',
    name: "Mang Tony's Meat Shop",
    description:
      'Demo meat stall with liempo, kasim, and everyday cuts. Prices and stock are illustrative only.',
    categories: ['Meat'],
    location: 'Sucat Public Market — Demo Stall C03',
    imageUrl:
      'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    opensAt: '05:00',
    cutoffTime: '23:59',
    isDemo: true,
    demoQrLabel: "DEMO QR — Mang Tony's Meat Shop",
  },
  {
    id: 'vendor-ate-liza',
    name: "Ate Liza's Fruits",
    description:
      'Demo fruit stand with seasonal local favorites like mango, banana, and calamansi. Not a verified live business.',
    categories: ['Fruits'],
    location: 'BF Homes Weekend Market — Demo Stall D15',
    imageUrl:
      'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    opensAt: '06:00',
    cutoffTime: '23:59',
    isDemo: true,
    demoQrLabel: "DEMO QR — Ate Liza's Fruits",
  },
  {
    id: 'vendor-fresh-basket',
    name: 'Fresh Basket Poultry',
    description:
      'Demo poultry stall for chicken and eggs. Built for payment-flow demonstrations only.',
    categories: ['Poultry', 'Eggs and Dairy'],
    location: 'Moonwalk Palengke — Demo Stall E02',
    imageUrl:
      'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    opensAt: '05:30',
    cutoffTime: '23:59',
    isDemo: true,
    demoQrLabel: 'DEMO QR — Fresh Basket Poultry',
  },
  {
    id: 'vendor-bigas-nanay',
    name: 'Bigas ni Nanay',
    description:
      'Demo rice and grains store for household essentials. Demonstration vendor — not an official market listing.',
    categories: ['Rice and Grains', 'Spices and Condiments'],
    location: 'San Dionisio Market — Demo Stall F09',
    imageUrl:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    opensAt: '06:00',
    cutoffTime: '23:59',
    isDemo: true,
    demoQrLabel: 'DEMO QR — Bigas ni Nanay',
  },
]
