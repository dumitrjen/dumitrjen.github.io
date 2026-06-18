<template>
  <div>
    <p v-if="!store.ratings.length" class="text-gray-400">Noch keine Bewertungen vorhanden.</p>

    <div v-else>
      <div v-for="p in totals" :key="p.name"
        class="bg-gray-50 rounded-xl p-5 mb-4 border-l-4 border-green-500">
        <div class="flex justify-between items-center">
          <div>
            <span class="font-bold text-gray-700 text-lg">{{ p.name }}</span>
            <span class="text-xs text-gray-400 ml-2">{{ p.cat }}</span>
            <p class="text-sm text-gray-400 mt-1">{{ p.gramm }}g benötigt · {{ p.packGrams }}g/Stück</p>
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold text-green-600">{{ p.packungen }} Stück</div>
            <div class="text-sm font-bold text-indigo-600 mt-1">
              €{{ Number(p.kosten).toFixed(2) }} gesamt
            </div>
            <div class="text-xs text-gray-400">
              €{{ Number(p.price).toFixed(2) }}/Stück
            </div>
          </div>
        </div>
      </div>

      <!-- Gesamtpreis -->
      <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-5 mt-4">
        <div class="flex justify-between items-center">
          <div>
            <div class="text-lg font-bold">💰 Gesamtkosten</div>
            <div class="text-indigo-200 text-sm">{{ store.ratings.length }} Personen</div>
          </div>
          <div class="text-3xl font-bold">€{{ gesamtpreis }}</div>
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