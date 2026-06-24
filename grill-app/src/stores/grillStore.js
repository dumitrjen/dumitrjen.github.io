import { reactive, watch } from 'vue'
import { normalizeCategory, productIsExtra, productKind } from '../constants/products.js'
import { supabase, supabaseConfigError, supabaseConfigured } from '../services/supabaseClient.js'

const storage = typeof window !== 'undefined' ? window.localStorage : null
const savedShoppingState = normalizeShoppingState(
  JSON.parse(storage?.getItem('grill_shoppingState') || 'null')
)
const savedProducts = JSON.parse(storage?.getItem('grill_products') || '[]')
  .map(product => {
    const { kind, purchaseMode, amountPerPack, amountPerPerson, servingsPerPack, ...cleanProduct } = product
    return {
      ...cleanProduct,
      cat: normalizeCategory(product.cat),
      isExtra: productKind(product) !== 'main'
    }
  })

let autosaveTimer = null

export const store = reactive({
  products: savedProducts,
  ratings: JSON.parse(storage?.getItem('grill_ratings') || '[]'),
  globalGrams: JSON.parse(storage?.getItem('grill_globalGrams') || '0'),
  shoppingState: savedShoppingState,
  onlineEventId: storage?.getItem('grill_onlineEventId') || '',
  onlineEventName: storage?.getItem('grill_onlineEventName') || '',
  onlineStatus: supabaseConfigured ? 'ready' : 'not_configured',
  onlineMessage: '',
  onlineBusy: false,
  onlineDirty: false,
  onlineAutosave: true,
  loadingOnline: false,
  lastSavedAt: storage?.getItem('grill_lastSavedAt') || '',
  supabaseConfigured,
  supabaseConfigError,

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
    this.shoppingState = defaultShoppingState()
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
  },

  async loadEventFromUrl() {
    const id = new URLSearchParams(window.location.search).get('event')
    if (id) await this.loadOnlineEvent(id)
  },

  async createOnlineEvent() {
    if (!supabase) return this.setOnlineError('Supabase ist noch nicht konfiguriert.')
    this.onlineBusy = true
    this.onlineMessage = ''
    try {
      const name = this.onlineEventName || `Grillabend ${new Date().toLocaleDateString('de-AT')}`
      const { data, error } = await supabase
        .from('events')
        .insert({
          name,
          global_grams: Number(this.globalGrams) || 0,
          shopping_state: toDbShoppingState(this.shoppingState)
        })
        .select('id, name, global_grams')
        .single()
      if (error) throw error
      this.onlineEventId = data.id
      this.onlineEventName = data.name || name
      await this.replaceOnlineData()
      this.onlineDirty = false
      this.lastSavedAt = new Date().toISOString()
      this.setEventUrl(data.id)
      this.setOnlineSuccess('Online-Event erstellt.')
    } catch (error) {
      this.setOnlineError(error.message)
    } finally {
      this.onlineBusy = false
    }
  },

  async saveOnlineEvent(silent = false) {
    if (!supabase) return this.setOnlineError('Supabase ist noch nicht konfiguriert.')
    if (!this.onlineEventId) return this.setOnlineError('Noch kein Online-Event aktiv.')
    this.onlineBusy = true
    if (!silent) this.onlineMessage = ''
    try {
      const { error } = await supabase
        .from('events')
        .update({
          name: this.onlineEventName || null,
          global_grams: Number(this.globalGrams) || 0,
          shopping_state: toDbShoppingState(this.shoppingState),
          updated_at: new Date().toISOString()
        })
        .eq('id', this.onlineEventId)
      if (error) throw error
      await this.replaceOnlineData()
      this.onlineDirty = false
      this.lastSavedAt = new Date().toISOString()
      this.setOnlineSuccess(silent ? 'Automatisch gespeichert.' : 'Online gespeichert.')
    } catch (error) {
      this.setOnlineError(error.message)
    } finally {
      this.onlineBusy = false
    }
  },

  async loadOnlineEvent(id) {
    if (!supabase) return this.setOnlineError('Supabase ist noch nicht konfiguriert.')
    this.onlineBusy = true
    this.onlineMessage = ''
    try {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, name, global_grams, shopping_state')
        .eq('id', id)
        .single()
      if (eventError) throw eventError

      const [{ data: products, error: productsError }, { data: ratings, error: ratingsError }] = await Promise.all([
        supabase.from('products').select('*').eq('event_id', id).order('created_at'),
        supabase.from('ratings').select('*').eq('event_id', id).order('created_at')
      ])
      if (productsError) throw productsError
      if (ratingsError) throw ratingsError

      this.loadingOnline = true
      this.onlineEventId = event.id
      this.onlineEventName = event.name || ''
      this.globalGrams = Number(event.global_grams) || 0
      this.shoppingState = normalizeShoppingState(event.shopping_state)
      this.products = (products || []).map(fromDbProduct)
      this.ratings = (ratings || []).map(fromDbRating)
      this.onlineDirty = false
      this.setEventUrl(event.id)
      this.setOnlineSuccess('Online-Event geladen.')
    } catch (error) {
      this.setOnlineError(error.message)
    } finally {
      this.loadingOnline = false
      this.onlineBusy = false
    }
  },

  async replaceOnlineData() {
    const eventId = this.onlineEventId
    const [{ error: productsDeleteError }, { error: ratingsDeleteError }] = await Promise.all([
      supabase.from('products').delete().eq('event_id', eventId),
      supabase.from('ratings').delete().eq('event_id', eventId)
    ])
    if (productsDeleteError) throw productsDeleteError
    if (ratingsDeleteError) throw ratingsDeleteError

    if (this.products.length) {
      const { error } = await supabase.from('products').insert(this.products.map(product => toDbProduct(product, eventId)))
      if (error) throw error
    }
    if (this.ratings.length) {
      const { error } = await supabase.from('ratings').insert(this.ratings.map(rating => toDbRating(rating, eventId)))
      if (error) throw error
    }
  },

  async copyEventLink() {
    if (!this.onlineEventId) return
    await navigator.clipboard.writeText(this.eventLink())
    this.setOnlineSuccess('Link kopiert.')
  },

  markOnlineDirty() {
    if (this.loadingOnline || !this.onlineEventId || !this.supabaseConfigured) return
    this.onlineDirty = true
    if (!this.onlineAutosave) return
    clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(() => {
      this.saveOnlineEvent(true)
    }, 1600)
  },

  eventLink() {
    const url = new URL(window.location.href)
    url.searchParams.set('event', this.onlineEventId)
    return url.toString()
  },

  setEventUrl(id) {
    const url = new URL(window.location.href)
    url.searchParams.set('event', id)
    window.history.replaceState({}, '', url)
  },

  setOnlineSuccess(message) {
    this.onlineStatus = 'success'
    this.onlineMessage = message
  },

  setOnlineError(message) {
    this.onlineStatus = 'error'
    this.onlineMessage = message || 'Online-Aktion fehlgeschlagen.'
  }
})

watch(() => store.products, v => storage?.setItem('grill_products', JSON.stringify(v)), { deep: true })
watch(() => store.products, () => store.markOnlineDirty(), { deep: true })
watch(() => store.ratings, v => storage?.setItem('grill_ratings', JSON.stringify(v)), { deep: true })
watch(() => store.ratings, () => store.markOnlineDirty(), { deep: true })
watch(() => store.globalGrams, v => storage?.setItem('grill_globalGrams', JSON.stringify(v)))
watch(() => store.globalGrams, () => store.markOnlineDirty())
watch(() => store.shoppingState, v => storage?.setItem('grill_shoppingState', JSON.stringify(v)), { deep: true })
watch(() => store.shoppingState, () => store.markOnlineDirty(), { deep: true })
watch(() => store.onlineEventId, v => storage?.setItem('grill_onlineEventId', v || ''))
watch(() => store.onlineEventName, v => storage?.setItem('grill_onlineEventName', v || ''))
watch(() => store.onlineEventName, () => store.markOnlineDirty())
watch(() => store.lastSavedAt, v => storage?.setItem('grill_lastSavedAt', v || ''))

export function ratingIsInterested(value) {
  return Number(value) > 1
}

export function ratingWeight(value) {
  return Math.max(0, (Number(value) || 0) - 1)
}

function toDbProduct(product, eventId) {
  return {
    event_id: eventId,
    name: product.name,
    category: product.cat,
    price: Number(product.price) || 0,
    pack_grams: Number(product.packGrams) || 100,
    link: product.link || null
  }
}

function fromDbProduct(product) {
  const category = normalizeCategory(product.category)
  return {
    name: product.name,
    cat: category,
    price: Number(product.price) || 0,
    packGrams: Number(product.pack_grams) || 100,
    link: product.link || '',
    isExtra: productKind({ cat: category }) !== 'main'
  }
}

function toDbRating(rating, eventId) {
  return {
    event_id: eventId,
    person_name: rating.name,
    grams: Number(rating.grams) || 0,
    ratings: rating.ratings || {}
  }
}

function fromDbRating(rating) {
  return {
    name: rating.person_name,
    grams: Number(rating.grams) || 0,
    ratings: rating.ratings || {}
  }
}

function defaultShoppingState() {
  return {
    temporaryPackages: {},
    boughtItems: {},
    collapsedGroups: {},
    hideBought: false,
    manualItems: []
  }
}

function normalizeShoppingState(value) {
  const fallback = defaultShoppingState()
  if (!value || typeof value !== 'object') return fallback
  return {
    temporaryPackages: plainObject(value.temporaryPackages),
    boughtItems: plainObject(value.boughtItems),
    collapsedGroups: plainObject(value.collapsedGroups),
    hideBought: Boolean(value.hideBought),
    manualItems: Array.isArray(value.manualItems)
      ? value.manualItems.map(normalizeManualItem).filter(Boolean)
      : []
  }
}

function normalizeManualItem(item) {
  if (!item || typeof item !== 'object') return null
  const name = String(item.name || '').trim()
  if (!name) return null
  return {
    id: String(item.id || `${Date.now()}-${Math.random()}`),
    name,
    quantity: String(item.quantity || '1'),
    packages: '',
    cost: Math.max(0, Number(item.cost) || 0)
  }
}

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {}
}

function toDbShoppingState(value) {
  return normalizeShoppingState(value)
}
