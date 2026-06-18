import { reactive, watch } from 'vue'

const storage = typeof window !== 'undefined' ? window.localStorage : null
const savedLanguage = storage?.getItem('grill_language')

export const i18n = reactive({
  language: savedLanguage === 'en' ? 'en' : 'de'
})

const messages = {
  de: {
    planEvening: 'Grillabend planen',
    brand: 'GrillRechner',
    tagline: 'Wünsche sammeln, Mengen berechnen, entspannt einkaufen.',
    products: 'Produkte',
    guests: 'Gäste',
    gramsPerson: 'Gramm / Person',
    preparation: 'Vorbereitung',
    survey: 'Umfrage',
    results: 'Ergebnisse',
    shopping: 'Einkauf',
    language: 'Sprache',
    openLink: 'Produkt öffnen',
    noCategory: 'Ohne Kategorie',
    extra: 'Extra',
    packages: 'Packungen',
    package: 'Packung',
    servings: 'Portionen',
    people: 'Personen',
    total: 'gesamt'
  },
  en: {
    planEvening: 'Plan your barbecue',
    brand: 'GrillCalculator',
    tagline: 'Collect preferences, calculate quantities, shop with confidence.',
    products: 'Products',
    guests: 'Guests',
    gramsPerson: 'Grams / person',
    preparation: 'Setup',
    survey: 'Survey',
    results: 'Results',
    shopping: 'Shopping',
    language: 'Language',
    openLink: 'Open product',
    noCategory: 'No category',
    extra: 'Extra',
    packages: 'packages',
    package: 'package',
    servings: 'servings',
    people: 'people',
    total: 'total'
  }
}

export function t(key) {
  return messages[i18n.language][key] ?? messages.de[key] ?? key
}

export function pick(de, en) {
  return i18n.language === 'en' ? en : de
}

export function normalizeProductUrl(value) {
  const url = String(value || '').trim()
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

watch(() => i18n.language, language => {
  storage?.setItem('grill_language', language)
  if (typeof document !== 'undefined') document.documentElement.lang = language
}, { immediate: true })
