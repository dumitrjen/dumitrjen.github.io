<template>
  <div>
    <div v-if="!store.ratings.length" class="empty-state">Noch keine Bewertungen vorhanden.</div>

    <div v-else>
      <div v-for="p in totals" :key="p.name" class="shopping-card">
        <div class="shopping-row">
          <div>
            <strong class="shopping-name">{{ p.name }}</strong>
            <span class="category-tag">{{ p.cat || 'Ohne Kategorie' }}</span>
            <p class="item-meta">{{ p.gramm }} g benötigt · {{ p.packGrams }} g je Packung</p>
          </div>
          <div class="shopping-total">
            <strong>{{ p.packungen }} Packungen</strong>
            <span>€{{ Number(p.kosten).toFixed(2) }} gesamt</span>
            <p class="item-meta">€{{ Number(p.price).toFixed(2) }} / Packung</p>
          </div>
        </div>
      </div>

      <div class="grand-total">
        <div class="total-row">
          <div class="label">
            Gesamtkosten
            <span class="subline">{{ store.ratings.length }} Personen eingeplant</span>
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

const totals = computed(() => {
  const map = {}
  store.products.forEach(p => {
    map[p.name] = {
      name: p.name,
      cat: p.cat,
      gramm: 0,
      packGrams: Number(p.packGrams) || 100,
      price: Number(p.price) || 0,
      kosten: 0,
      packungen: 0
    }
  })
  store.ratings.forEach(person => {
    store.calcDistribution(person).forEach(d => {
      if (map[d.name]) map[d.name].gramm += d.gramm
    })
  })
  Object.values(map).forEach(p => {
    p.packungen = Math.ceil(p.gramm / p.packGrams)
    p.kosten = p.packungen * p.price
  })
  return Object.values(map)
})

const gesamtpreis = computed(() =>
  totals.value.reduce((s, p) => s + p.kosten, 0).toFixed(2)
)
</script>
