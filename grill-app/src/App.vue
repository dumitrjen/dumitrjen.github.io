<template>
  <div class="app-shell">
    <div class="heat-glow heat-glow-one" />
    <div class="heat-glow heat-glow-two" />

    <main class="app-frame">
      <header class="site-header">
        <div class="brand-lockup">
          <div class="brand-mark" aria-hidden="true">
            <span class="grill-lid" />
            <span class="grill-grate" />
            <span class="grill-leg grill-leg-left" />
            <span class="grill-leg grill-leg-right" />
          </div>
          <div>
            <p class="eyebrow">Grillabend planen</p>
            <h1>Grill<span>Rechner</span></h1>
            <p class="header-copy">Wünsche sammeln, Mengen berechnen, entspannt einkaufen.</p>
          </div>
        </div>

        <div class="header-stats" aria-label="Aktueller Planungsstand">
          <div>
            <strong>{{ store.products.length }}</strong>
            <span>Produkte</span>
          </div>
          <div>
            <strong>{{ store.ratings.length }}</strong>
            <span>Gäste</span>
          </div>
          <div>
            <strong>{{ store.globalGrams || '–' }}</strong>
            <span>Gramm / Person</span>
          </div>
        </div>
      </header>

      <nav class="tab-bar" aria-label="Bereiche">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
        >
          <span class="tab-index">0{{ index + 1 }}</span>
          {{ tab.label }}
        </button>
      </nav>

      <section class="content-panel">
        <AdminTab v-if="activeTab === 'admin'" />
        <UmfrageTab v-if="activeTab === 'umfrage'" />
        <ErgebnisTab v-if="activeTab === 'ergebnis'" />
        <EinkaufTab v-if="activeTab === 'einkauf'" />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AdminTab from './components/AdminTab.vue'
import UmfrageTab from './components/UmfrageTab.vue'
import ErgebnisTab from './components/ErgebnisTab.vue'
import EinkaufTab from './components/EinkaufTab.vue'
import { store } from './stores/grillStore.js'

const activeTab = ref('admin')
const tabs = [
  { id: 'admin', label: 'Vorbereitung' },
  { id: 'umfrage', label: 'Umfrage' },
  { id: 'ergebnis', label: 'Ergebnisse' },
  { id: 'einkauf', label: 'Einkauf' },
]
</script>
