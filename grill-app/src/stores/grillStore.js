import { reactive, watch } from 'vue'

export const store = reactive({
  products: JSON.parse(localStorage.getItem('grill_products') || '[]'),
  ratings:  JSON.parse(localStorage.getItem('grill_ratings')  || '[]'),
  globalGrams: JSON.parse(localStorage.getItem('grill_globalGrams') || '0'),

  addProduct(p)    { this.products.push(p) },
  deleteProduct(i) { this.products.splice(i, 1) },
  addRating(r)     {
    const idx = this.ratings.findIndex(x => x.name === r.name)
    idx >= 0 ? this.ratings[idx] = r : this.ratings.push(r)
  },
  resetRatings()   { this.ratings = [] },
  resetAll()       { this.products = []; this.ratings = []; this.globalGrams = 0 },

  calcDistribution(person) {
    const grams = this.globalGrams || person.grams || 0
    const active = this.products
      .map(p => ({ name: p.name, r: person.ratings[p.name] || 0 }))
      .filter(x => x.r > 0)
    const total = active.reduce((s, x) => s + x.r, 0)
    if (!total) return []
    let assigned = 0
    return active.map((x, i) => {
      const g = i === active.length - 1
        ? grams - assigned
        : Math.round(grams * (x.r / total))
      assigned += g
      return { name: x.name, rating: x.r, gramm: g }
    })
  }
})

watch(() => store.products,    v => localStorage.setItem('grill_products',    JSON.stringify(v)), { deep: true })
watch(() => store.ratings,     v => localStorage.setItem('grill_ratings',     JSON.stringify(v)), { deep: true })
watch(() => store.globalGrams, v => localStorage.setItem('grill_globalGrams', JSON.stringify(v)))