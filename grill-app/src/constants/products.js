export const PRODUCT_CATEGORIES = [
  'Fleisch',
  'Wurst',
  'Fisch',
  'Vegetarisch',
  'Vegan',
  'Salate',
  'Beilagen',
  'Saucen',
  'Brot',
  'Getränke',
  'Sonstiges'
]

const CATEGORY_EN = {
  Fleisch: 'Meat',
  Wurst: 'Sausages',
  Fisch: 'Fish',
  Vegetarisch: 'Vegetarian',
  Vegan: 'Vegan',
  Salate: 'Salads',
  Beilagen: 'Sides',
  Saucen: 'Sauces',
  Brot: 'Bread',
  Getränke: 'Drinks',
  Sonstiges: 'Other'
}

export function categoryLabel(category, language) {
  return language === 'en' ? CATEGORY_EN[category] || category : category
}
