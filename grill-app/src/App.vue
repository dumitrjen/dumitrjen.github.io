<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-700 p-4 md:p-8">
    <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6">
      
      <!-- Header -->
      <h1 class="text-3xl font-bold text-center text-indigo-600 mb-2">🔥 Grill-Essen Aufteilung</h1>
      <p class="text-center text-gray-400 mb-6">Produkte anlegen · bewerten · Mengen berechnen</p>

      <!-- Tabs -->
      <div class="flex gap-2 mb-8 flex-wrap">
        <button v-for="tab in tabs" :key="tab.id"
          @click="activeTab = tab.id"
          :class="activeTab === tab.id
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-indigo-600 border-2 border-indigo-600'"
          class="px-5 py-2 rounded-xl font-bold transition-all">
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <AdminTab   v-if="activeTab === 'admin'" />
      <UmfrageTab v-if="activeTab === 'umfrage'" />
      <ErgebnisTab v-if="activeTab === 'ergebnis'" />
      <EinkaufTab  v-if="activeTab === 'einkauf'" />

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AdminTab    from './components/AdminTab.vue'
import UmfrageTab  from './components/UmfrageTab.vue'
import ErgebnisTab from './components/ErgebnisTab.vue'
import EinkaufTab  from './components/EinkaufTab.vue'

const activeTab = ref('admin')
const tabs = [
  { id: 'admin',    label: '⚙️ Admin' },
  { id: 'umfrage',  label: '⭐ Umfrage' },
  { id: 'ergebnis', label: '📊 Ergebnisse' },
  { id: 'einkauf',  label: '🛒 Einkaufsliste' },
]
</script>