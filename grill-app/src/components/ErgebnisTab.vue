<template>
  <div>
    <div v-if="!store.ratings.length" class="empty-state">{{ pick('Noch keine Bewertungen vorhanden.', 'No ratings yet.') }}</div>

    <div v-for="person in store.ratings" :key="person.name" class="result-card">
      <div class="result-header">
        <div>
          <p class="section-kicker">{{ pick('Persönliche Verteilung', 'Personal allocation') }}</p>
          <h3>{{ person.name }}</h3>
        </div>
        <span class="portion-badge">{{ store.globalGrams }} g {{ t('total') }}</span>
      </div>

      <p v-if="!dist(person).length && !extras(person).length" class="helper-text">{{ pick('Keine Produkte gewählt.', 'No products selected.') }}</p>

      <div v-if="dist(person).length">
        <p class="result-section-label">{{ pick('Grammverteilung', 'Gram allocation') }}</p>
        <div v-for="d in dist(person)" :key="d.name" class="distribution-row">
          <div class="distribution-meta">
            <strong>{{ d.name }}</strong>
            <a v-if="product(d.name)?.link" class="product-link" :href="normalizeProductUrl(product(d.name).link)" target="_blank" rel="noopener noreferrer">{{ t('openLink') }}</a>
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

      <div v-if="extras(person).length" class="extras-result">
        <p class="result-section-label">{{ pick('Extras · außerhalb der Grammportion', 'Extras · outside the gram allocation') }}</p>
        <div class="extras-list">
          <div v-for="extra in extras(person)" :key="extra.name" class="extra-result-item">
            <strong>{{ extra.name }}</strong>
            <a v-if="product(extra.name)?.link" class="product-link" :href="normalizeProductUrl(product(extra.name).link)" target="_blank" rel="noopener noreferrer">{{ t('openLink') }}</a>
            <span class="stars">{{ '★'.repeat(extra.rating) }}{{ '☆'.repeat(4 - extra.rating) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { store } from '../stores/grillStore.js'
import { normalizeProductUrl, pick, t } from '../i18n.js'
const dist = (person) => store.calcDistribution(person)
const extras = (person) => store.calcExtras(person)
const product = (name) => store.products.find(item => item.name === name)
</script>
