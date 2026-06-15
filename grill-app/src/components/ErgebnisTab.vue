<template>
  <div>
    <p v-if="!store.ratings.length" class="text-gray-400">Noch keine Bewertungen vorhanden.</p>

    <div v-for="person in store.ratings" :key="person.name"
      class="bg-gray-50 rounded-xl p-5 mb-4 border-2 border-indigo-200">
      
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-700">{{ person.name }}</h3>
        <span class="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          {{ person.grams }}g gesamt
        </span>
      </div>

      <p v-if="!dist(person).length" class="text-gray-400 text-sm">
        Keine Produkte gewählt (alle 0 Sterne).
      </p>

      <div v-for="d in dist(person)" :key="d.name" class="mb-3">
        <div class="flex justify-between text-sm mb-1">
          <span class="font-bold text-gray-600">{{ d.name }}</span>
          <div class="flex items-center gap-3">
            <span class="text-yellow-500">{{ '★'.repeat(d.rating) }}{{ '☆'.repeat(4 - d.rating) }}</span>
            <span class="font-bold text-indigo-600">{{ d.gramm }}g</span>
            <span class="text-gray-400">{{ Math.round(d.gramm / person.grams * 100) }}%</span>
          </div>
        </div>
        <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
            :style="{ width: Math.round(d.gramm / person.grams * 100) + '%' }"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { store } from '../stores/grillStore.js'
const dist = (person) => store.calcDistribution(person)
</script>