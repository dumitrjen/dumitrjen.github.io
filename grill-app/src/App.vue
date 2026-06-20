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
            <p class="eyebrow">{{ t('planEvening') }}</p>
            <h1 v-if="i18n.language === 'de'">Grill<span>Rechner</span></h1>
            <h1 v-else>Grill<span>Calculator</span></h1>
            <p class="header-copy">{{ t('tagline') }}</p>
          </div>
        </div>

        <div class="header-tools">
          <div class="language-switch" :aria-label="t('language')">
            <button :class="{ active: i18n.language === 'de' }" @click="i18n.language = 'de'">DE</button>
            <button :class="{ active: i18n.language === 'en' }" @click="i18n.language = 'en'">EN</button>
          </div>
          <div class="header-stats">
            <div>
              <strong>{{ store.products.length }}</strong>
              <span>{{ t('products') }}</span>
            </div>
            <div>
              <strong>{{ store.ratings.length }}</strong>
              <span>{{ t('guests') }}</span>
            </div>
            <div>
              <strong>{{ store.globalGrams || '–' }}</strong>
              <span>{{ t('gramsPerson') }}</span>
            </div>
          </div>
        </div>
      </header>

      <nav class="tab-bar" :aria-label="pick('Bereiche', 'Sections')">
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

      <section class="online-panel">
        <div>
          <p class="section-kicker">{{ pick('Online speichern', 'Online sync') }}</p>
          <strong>{{ store.onlineEventId ? store.onlineEventName || store.onlineEventId : pick('Lokale Session', 'Local session') }}</strong>
          <span v-if="!store.supabaseConfigured">{{ pick('Supabase-Keys fehlen. Die App läuft lokal weiter.', 'Supabase keys are missing. The app keeps working locally.') }}</span>
          <span v-else-if="store.onlineMessage" :class="{ error: store.onlineStatus === 'error' }">{{ store.onlineMessage }}</span>
          <span v-else>{{ pick('Erstelle ein Online-Event oder lade eins per Link.', 'Create an online event or load one by link.') }}</span>
        </div>
        <div class="online-actions">
          <input
            v-model="store.onlineEventName"
            :placeholder="pick('Eventname', 'Event name')"
            :disabled="store.onlineBusy || !store.supabaseConfigured"
          >
          <button
            v-if="!store.onlineEventId"
            @click="store.createOnlineEvent()"
            class="button button-primary"
            :disabled="store.onlineBusy || !store.supabaseConfigured"
          >
            {{ store.onlineBusy ? pick('Speichert …', 'Saving …') : pick('Online-Event erstellen', 'Create online event') }}
          </button>
          <button
            v-else
            @click="store.saveOnlineEvent()"
            class="button button-primary"
            :disabled="store.onlineBusy || !store.supabaseConfigured"
          >
            {{ store.onlineBusy ? pick('Speichert …', 'Saving …') : pick('Online speichern', 'Save online') }}
          </button>
          <button
            v-if="store.onlineEventId"
            @click="store.copyEventLink()"
            class="button button-quiet"
            :disabled="store.onlineBusy"
          >
            {{ pick('Link kopieren', 'Copy link') }}
          </button>
        </div>
      </section>

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
import { computed, onMounted, ref } from 'vue'
import AdminTab from './components/AdminTab.vue'
import UmfrageTab from './components/UmfrageTab.vue'
import ErgebnisTab from './components/ErgebnisTab.vue'
import EinkaufTab from './components/EinkaufTab.vue'
import { store } from './stores/grillStore.js'
import { i18n, pick, t } from './i18n.js'

const activeTab = ref('admin')
const tabs = computed(() => [
  { id: 'admin', label: t('preparation') },
  { id: 'umfrage', label: t('survey') },
  { id: 'ergebnis', label: t('results') },
  { id: 'einkauf', label: t('shopping') },
])

onMounted(() => {
  store.loadEventFromUrl()
})
</script>
