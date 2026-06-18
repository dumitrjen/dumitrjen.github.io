<template>
  <div>
    <div v-if="!store.ratings.length" class="empty-state">{{ pick('Noch keine Bewertungen vorhanden.', 'No ratings yet.') }}</div>

    <div v-else>
      <div v-for="p in totals" :key="p.name" class="shopping-card">
        <div class="shopping-row">
          <div>
            <strong class="shopping-name">{{ p.name }}</strong>
            <span class="category-tag">{{ p.cat ? categoryLabel(p.cat, i18n.language) : t('noCategory') }}</span>
            <span v-if="p.isExtra" class="type-tag">{{ t('extra') }}</span>
            <a v-if="p.link" class="product-link" :href="normalizeProductUrl(p.link)" target="_blank" rel="noopener noreferrer">{{ t('openLink') }}</a>
            <p v-if="p.isExtra" class="item-meta">
              {{ pick(`${p.interested} Personen möchten es · ${p.servingsPerPack} Portionen je Packung`, `${p.interested} people want it · ${p.servingsPerPack} servings per package`) }}
            </p>
            <p v-else class="item-meta">{{ pick(`${p.gramm} g benötigt · ${p.packGrams} g je Packung`, `${p.gramm} g required · ${p.packGrams} g per package`) }}</p>
          </div>
          <div class="shopping-total">
            <strong>{{ p.packungen }} {{ t('packages') }}</strong>
            <span>€{{ Number(p.kosten).toFixed(2) }} {{ t('total') }}</span>
            <p class="item-meta">€{{ Number(p.price).toFixed(2) }} / {{ t('package') }}</p>
          </div>
        </div>
      </div>

      <div class="grand-total">
        <div class="total-row">
          <div class="label">
            {{ pick('Gesamtkosten', 'Total cost') }}
            <span class="subline">{{ store.ratings.length }} {{ pick('Personen eingeplant', 'people planned') }}</span>
          </div>
          <div class="price">€{{ gesamtpreis }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { store } from '../stores/grillStore.js'
import { categoryLabel } from '../constants/products.js'
import { i18n, normalizeProductUrl, pick, t } from '../i18n.js'

const totals = computed(() => {
  const map = {}
  store.products.forEach(p => {
    map[p.name] = {
      name: p.name,
      cat: p.cat,
      link: p.link || '',
      isExtra: Boolean(p.isExtra),
      gramm: 0,
      interested: 0,
      packGrams: Number(p.packGrams) || 100,
      servingsPerPack: Number(p.servingsPerPack) || 1,
      price: Number(p.price) || 0,
      kosten: 0,
      packungen: 0
    }
  })
  store.ratings.forEach(person => {
    store.calcDistribution(person).forEach(d => {
      if (map[d.name]) map[d.name].gramm += d.gramm
    })
    store.calcExtras(person).forEach(extra => {
      if (map[extra.name]) map[extra.name].interested++
    })
  })
  Object.values(map).forEach(p => {
    p.packungen = p.isExtra
      ? Math.ceil(p.interested / p.servingsPerPack)
      : Math.ceil(p.gramm / p.packGrams)
    p.kosten = p.packungen * p.price
  })
  return Object.values(map).filter(p => p.isExtra ? p.interested > 0 : p.gramm > 0)
})

const gesamtpreis = computed(() =>
  totals.value.reduce((s, p) => s + p.kosten, 0).toFixed(2)
)
</script>
