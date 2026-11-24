import type { Vendor } from '@/types'

export const seedVendors: Vendor[] = [
  {
    id: 'vendor-aling-nena',
    name: "Aling Nena's Gulayan",
    description:
      'Vegetable stall offering everyday gulay staples for home cooking.',
    categories: ['Vegetables', 'Spices and Condiments'],
    location: 'Stall A12',
    branchId: 'branch-baclaran',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    opensAt: '05:00',
    cutoffTime: '23:59',
    rating: 4.9,
    qrLabel: 'QR — Aling Nena Gulayan',
    paymentQrUrl: '',
    ownerUserId: 'vuser-aling-nena',
  },
  {
    id: 'vendor-kuya-ben',
    name: "Kuya Ben's Seafood",
    description:
      'Seafood counter featuring bangus, tilapia, and shellfish.',
    categories: ['Seafood'],
    location: 'Stall B07',
    branchId: 'branch-la-huerta',
    imageUrl:
      'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    opensAt: '04:00',
    /** Early cut-off so the disabled / past cut-off state is easy to test. */
    cutoffTime: '12:00',
    rating: 4.3,
    qrLabel: "QR — Kuya Ben's Seafood",
    paymentQrUrl: '',
    ownerUserId: 'vuser-kuya-ben',
  },
  {
    id: 'vendor-mang-tony',
    name: "Mang Tony's Meat Shop",
    description:
      'Meat stall with liempo, kasim, and everyday cuts.',
    categories: ['Meat'],
    location: 'Stall C03',
    branchId: 'branch-sucat',
    imageUrl:
      'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    opensAt: '05:00',
    cutoffTime: '23:59',
    rating: 4.7,
    qrLabel: "QR — Mang Tony's Meat Shop",
    paymentQrUrl: '',
    ownerUserId: 'vuser-mang-tony',
  },
  {
    id: 'vendor-ate-liza',
    name: "Ate Liza's Fruits",
    description:
      'Fruit stand with seasonal local favorites like mango, banana, and calamansi.',
    categories: ['Fruits'],
    location: 'Stall D15',
    branchId: 'branch-bf-homes',
    imageUrl:
      'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    opensAt: '06:00',
    cutoffTime: '23:59',
    rating: 4.8,
    qrLabel: "QR — Ate Liza's Fruits",
    paymentQrUrl: '',
    ownerUserId: 'vuser-ate-liza',
  },
  {
    id: 'vendor-fresh-basket',
    name: 'Fresh Basket Poultry',
    description:
      'Poultry stall for chicken and eggs.',
    categories: ['Poultry', 'Eggs and Dairy'],
    location: 'Stall E02',
    branchId: 'branch-moonwalk',
    imageUrl:
      'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    opensAt: '05:30',
    cutoffTime: '23:59',
    rating: 4.5,
    qrLabel: 'QR — Fresh Basket Poultry',
    paymentQrUrl: '',
    ownerUserId: 'vuser-fresh-basket',
  },
  {
    id: 'vendor-bigas-nanay',
    name: 'Bigas ni Nanay',
    description:
      'Rice and grains store for household essentials.',
    categories: ['Rice and Grains', 'Spices and Condiments'],
    location: 'Stall F09',
    branchId: 'branch-san-dionisio',
    imageUrl:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    opensAt: '06:00',
    cutoffTime: '23:59',
    rating: 4.4,
    qrLabel: 'QR — Bigas ni Nanay',
    paymentQrUrl: '',
    ownerUserId: 'vuser-bigas-nanay',
  },
]
