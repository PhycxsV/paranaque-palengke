import fs from 'node:fs'

const source = fs.readFileSync('src/data/products.ts', 'utf8')
const objectRegex =
  /\{\s*id:\s*'([^']+)',\s*vendorId:\s*'([^']+)',\s*name:\s*'([^']*)',\s*description:\s*'([^']*)',\s*category:\s*'([^']+)',\s*price:\s*([0-9.]+),\s*unit:\s*'([^']+)',\s*stock:\s*([0-9]+),\s*imageUrl:\s*'([^']+)',\s*isAvailable:\s*(true|false),([\s\S]*?)\}/g

const products = []
let match
while ((match = objectRegex.exec(source)) !== null) {
  const flags = match[11]
  products.push({
    id: match[1],
    vendorId: match[2],
    name: match[3],
    description: match[4],
    category: match[5],
    price: Number(match[6]),
    unit: match[7],
    stock: Number(match[8]),
    imageUrl: match[9],
    isAvailable: match[10] === 'true',
    isFeatured: flags.includes('isFeatured: true'),
    isPopular: flags.includes('isPopular: true'),
  })
}

if (products.length < 30) {
  console.error('Parsed too few products:', products.length)
  process.exit(1)
}

const now = '2026-01-01T00:00:00.000Z'
const commodities = products.map((p) => ({
  id: p.id.replace(/^prod-/, 'comm-'),
  name: p.name,
  description: p.description,
  category: p.category,
  unit: p.unit,
  standardPrice: p.price,
  imageUrl: p.imageUrl,
  effectiveFrom: now,
  isActive: true,
}))

const listings = products.map((p) => ({
  id: p.id,
  vendorId: p.vendorId,
  commodityId: p.id.replace(/^prod-/, 'comm-'),
  name: p.name,
  description: p.description,
  category: p.category,
  unit: p.unit,
  stock: p.stock,
  imageUrl: p.imageUrl,
  isAvailable: p.isAvailable,
  isFeatured: p.isFeatured || undefined,
  isPopular: p.isPopular || undefined,
}))

function serialize(value, indent = 2) {
  return JSON.stringify(value, null, indent)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'")
    .replace(/'(Vegetables|Fruits|Seafood|Meat|Poultry|Rice and Grains|Eggs and Dairy|Spices and Condiments)'/g, "'$1'")
}

const commoditiesFile = `import type { Commodity } from '@/types'

/** Illustrative demo commodity catalog. Prices are NOT official LGU rates. */
export const seedCommodities: Commodity[] = ${serialize(commodities)}
`

const productsFile = `import type { Product } from '@/types'

/** Vendor listings linked to LGU commodities. Base price comes from the commodity. */
export const seedProducts: Product[] = ${serialize(listings)}
`

fs.writeFileSync('src/data/commodities.ts', commoditiesFile)
fs.writeFileSync('src/data/products.ts', productsFile)
console.log(`Wrote ${commodities.length} commodities and ${listings.length} products`)
