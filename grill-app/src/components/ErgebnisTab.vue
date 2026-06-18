<template>
  <div>
    <div v-if="!store.ratings.length" class="empty-state">Noch keine Bewertungen vorhanden.</div>

    <div v-for="person in store.ratings" :key="person.name" class="result-card">
      <div class="result-header">
        <div>
          <p class="section-kicker">Persönliche Verteilung</p>
          <h3>{{ person.name }}</h3>
        </div>
        <span class="portion-badge">{{ store.globalGrams }} g gesamt</span>
      </div>

      <p v-if="!dist(person).length" class="helper-text">Keine Produkte gewählt.</p>

      <div v-for="d in dist(person)" :key="d.name" class="distribution-row">
        <div class="distribution-meta">
          <strong>{{ d.name }}</strong>
          <div class="distribution-values">
            <span class="stars">{{ '★'.repeat(d.rating) }}{{ '☆'.repeat(4 - d.rating) }}</span>
            <span class="grams">{{ d.gramm }} g</span>
            <span class="percentage">{{ Math.round(d.gramm / store.globalGrams * 100) }} %</span>
          </div>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: Math.round(d.gramm / store.globalGrams * 100) + '%' }" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { store } from '../stores/grillStore.js'
const dist = (person) => store.calcDistribution(person)
</script>
