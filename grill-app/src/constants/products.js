export const PRODUCT_CATEGORIES = ['Fleisch', 'Veggie', 'Sides', 'Süßes', 'Getränke']

const CATEGORY_EN = {
  Fleisch: 'Meat',
  Veggie: 'Veggie',
  Sides: 'Sides',
  Süßes: 'Sweets',
  Getränke: 'Drinks'
}

export function categoryLabel(category, language) {
  return language === 'en' ? CATEGORY_EN[category] || category : category
}

export function normalizeCategory(category) {
  const value = String(category || '').trim().toLocaleLowerCase('de-DE')
  if (['wurst', 'fleisch', 'meat', 'sausages'].includes(value)) return 'Fleisch'
  if (['veggie', 'vegetarisch', 'vegetarian', 'vegan'].includes(value)) return 'Veggie'
  if (['beilagen', 'brot', 'salate', 'saucen', 'soßen', 'sossen', 'sides', 'bread', 'salads', 'sauces'].includes(value)) return 'Sides'
  if (['süßes', 'suesses', 'sweets', 'dessert', 'desserts'].includes(value)) return 'Süßes'
  if (['getränke', 'getraenke', 'drinks', 'beverages'].includes(value)) return 'Getränke'
  return category
}

export function productKind(product) {
  const category = normalizeCategory(product?.cat)
  if (category === 'Fleisch' || category === 'Veggie') return 'main'
  if (category === 'Getränke') return 'drink'
  return 'extra'
}

export function productIsExtra(product) {
  return productKind(product) !== 'main'
}
