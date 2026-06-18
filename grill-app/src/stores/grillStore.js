import { reactive, watch } from 'vue'
import { normalizeCategory, productIsExtra, productKind } from '../constants/products.js'

const savedProducts = JSON.parse(localStorage.getItem('grill_products') || '[]')
  .map(product => {
    const { kind, purchaseMode, amountPerPack, amountPerPerson, servingsPerPack, ...cleanProduct } = product
    return {
      ...cleanProduct,
      cat: normalizeCategory(product.cat),
      isExtra: productKind(product) !== 'main'
    }
  })

export const store = reactive({
  products: savedProducts,
  ratings:  JSON.parse(localStorage.getItem('grill_ratings')  || '[]'),
  globalGrams: JSON.parse(localStorage.getItem('grill_globalGrams') || '0'),

  addProduct(p)    { this.products.push(p) },
  deleteProduct(i) { this.products.splice(i, 1) },
  addRating(r)     {
    const idx = this.ratings.findIndex(x => x.name === r.name)
    idx >= 0 ? this.ratings[idx] = r : this.ratings.push(r)
  },
  resetRatings()   { this.ratings = [] },
  resetAll()       {
    this.products = []
    this.ratings = []
    this.globalGrams = 0
  },

  calcDistribution(person) {
    const grams = this.globalGrams || person.grams || 0
    const active = this.products
      .filter(p => !productIsExtra(p))
      .map(p => {
        const rating = Number(person.ratings[p.name]) || 0
        return { name: p.name, rating, weight: ratingWeight(rating) }
      })
      .filter(x => x.weight > 0)
    const total = active.reduce((sum, item) => sum + item.weight, 0)
    if (!total) return []
    let assigned = 0
    return active.map((item, i) => {
      const g = i === active.length - 1
        ? grams - assigned
        : Math.round(grams * (item.weight / total))
      assigned += g
      return { name: item.name, rating: item.rating, gramm: g }
    })
  },

  calcExtras(person) {
    return this.products
      .filter(p => productIsExtra(p) && ratingIsInterested(person.ratings[p.name]))
      .map(p => ({
        name: p.name,
        rating: person.ratings[p.name]
      }))
  }
})

watch(() => store.products,    v => localStorage.setItem('grill_products',    JSON.stringify(v)), { deep: true })
watch(() => store.ratings,     v => localStorage.setItem('grill_ratings',     JSON.stringify(v)), { deep: true })
watch(() => store.globalGrams, v => localStorage.setItem('grill_globalGrams', JSON.stringify(v)))

export function ratingIsInterested(value) {
  return Number(value) > 1
}

export function ratingWeight(value) {
  return Math.max(0, (Number(value) || 0) - 1)
}
