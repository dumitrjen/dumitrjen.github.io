<template>
  <div>
    <p v-if="!store.ratings.length" class="text-gray-400">Noch keine Bewertungen vorhanden.</p>

    <div v-else>
      <div v-for="p in totals" :key="p.name"
        class="bg-gray-50 rounded-xl p-5 mb-4 border-l-4 border-green-500">
        <div class="flex justify-between items-center mb-2">
          <div>
            <span class="font-bold text-gray-700">{{ p.name }}</span>
            <span class="text-xs text-gray-400 ml-2">{{ p.cat }}</span>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-green-600">{{ p.gramm }}g</div>
            <div class="text-sm text-gray-400">€{{ p.kosten.toFixed(2) }}</div>
          </div>
        </div>
        <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
            :style="{ width: Math.min(100, Math.round(p.gramm / Math.max(p.available, 1) * 100)) + '%' }"/>
        </div>
        <div class="text-xs text-gray-400 mt-1">{{ p.gramm }}g von {{ p.available }}g verfügbar</div>
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
    map[p.name] = { name: p.name, cat: p.cat, gramm: 0, available: p.grams, price: p.price, kosten: 0 }
  })
  store.ratings.forEach(person => {
    store.calcDistribution(person).forEach(d => {
      if (map[d.name]) {
        map[d.name].gramm  += d.gramm
        map[d.name].kosten += d.gramm / 1000 * map[d.name].price
      }
    })
  })
  return Object.values(map)
})

const gesamtpreis = computed(() =>
  totals.value.reduce((s, p) => s + p.kosten, 0).toFixed(2)
)
</script>