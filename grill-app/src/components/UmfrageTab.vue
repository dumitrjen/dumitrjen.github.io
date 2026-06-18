<template>
  <div>
    <div class="section-card green-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{{ pick('Mehrere Gäste', 'Multiple guests') }}</p>
          <h2>{{ pick('Antworten importieren', 'Import responses') }}</h2>
        </div>
      </div>
      <p class="helper-text">{{ pick('Die Exportdatei aus der Umfrage wird anhand der Spaltenüberschriften zugeordnet.', 'Survey exports are matched using their column headers.') }}</p>
      <div class="csv-preview">
        <div class="csv-preview-title">
          <strong>{{ pick('So muss die Umfrage-CSV aussehen', 'Required survey CSV format') }}</strong>
          <span>{{ pick('Bewertungen von 1 bis 4 Sternen', 'Ratings from 1 to 4 stars') }}</span>
        </div>
        <div class="csv-table-wrap">
          <table class="csv-table survey-csv-table">
            <thead>
              <tr>
                <th class="ignored-column">{{ pick('Zeitstempel', 'Timestamp') }}</th>
                <th>Name</th>
                <th>Bratwurst</th>
                <th>Grillkäse</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="ignored-column">18.06.2026 12:30</td>
                <td>Anna</td>
                <td>4</td>
                <td>2</td>
              </tr>
              <tr>
                <td class="ignored-column">18.06.2026 12:34</td>
                <td>Max</td>
                <td>3</td>
                <td>4</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="csv-legend">
          <span><i class="legend-swatch ignored" /> {{ pick('wird ignoriert', 'is ignored') }}</span>
          <span><i class="legend-swatch product" /> {{ pick('Produktname muss zur Produkt-CSV passen', 'product name must match the product CSV') }}</span>
        </div>
      </div>
      <input type="file" accept=".csv" @change="importCSV" class="file-input">
      <p v-if="csvMsg" class="feedback" :class="csvOk ? 'success' : 'error'">{{ csvMsg }}</p>
    </div>

    <div class="section-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{{ pick('Einzelne Antwort', 'Single response') }}</p>
          <h2>{{ pick('Wünsche eintragen', 'Enter preferences') }}</h2>
        </div>
        <p>{{ store.globalGrams }} g {{ pick('Gesamtportion', 'total portion') }}</p>
      </div>

      <div class="field" style="margin-bottom: 20px">
        <label>Name</label>
        <input v-model="name" :placeholder="pick('z. B. Teddy', 'e.g. Teddy')">
      </div>

      <div v-if="!store.products.length" class="empty-state">{{ pick('Zuerst Produkte unter „Vorbereitung“ anlegen.', 'Add products under “Setup” first.') }}</div>

      <div v-else class="filter-bar survey-filters">
        <div class="field search-field">
          <label>{{ pick('Produkte suchen', 'Search products') }}</label>
          <input v-model="search" type="search" :placeholder="pick('Name suchen …', 'Search by name …')">
        </div>
        <div class="field">
          <label>{{ pick('Kategorie filtern', 'Filter category') }}</label>
          <select v-model="categoryFilter">
            <option value="">{{ pick('Alle Kategorien', 'All categories') }}</option>
            <option v-for="category in usedCategories" :key="category" :value="category">{{ categoryLabel(category, i18n.language) }}</option>
          </select>
        </div>
        <div class="field">
          <label>{{ pick('Typ filtern', 'Filter type') }}</label>
          <select v-model="typeFilter">
            <option value="">{{ pick('Alles anzeigen', 'Show all') }}</option>
            <option value="main">{{ pick('Hauptprodukte', 'Main products') }}</option>
            <option value="extra">Extras</option>
          </select>
        </div>
      </div>

      <div v-if="store.products.length && !filteredProducts.length" class="empty-state">{{ pick('Keine passenden Produkte gefunden.', 'No matching products found.') }}</div>

      <div
        v-for="p in filteredProducts"
        :key="p.name"
        class="rating-card"
        :class="{ selected: (tempRatings[p.name] || 0) > 0, extra: p.isExtra }"
      >
        <div class="rating-header">
          <div>
            <strong>{{ p.name }}</strong>
            <span class="category-tag">{{ p.cat ? categoryLabel(p.cat, i18n.language) : t('noCategory') }}</span>
            <span v-if="p.isExtra" class="type-tag">{{ pick('Extra · zählt nicht zur Grammportion', 'Extra · excluded from gram allocation') }}</span>
            <a v-if="p.link" class="product-link" :href="normalizeProductUrl(p.link)" target="_blank" rel="noopener noreferrer">{{ t('openLink') }}</a>
          </div>
          <span class="rating-label">{{ labels[tempRatings[p.name] || 0] }}</span>
        </div>
        <div class="rating-options">
          <button
            v-for="s in [0, 1, 2, 3, 4]"
            :key="s"
            @click="tempRatings[p.name] = s"
            class="rating-option"
            :class="{ active: (tempRatings[p.name] || 0) === s, zero: s === 0 }"
            :aria-label="`${p.name}: ${labels[s]}`"
          >
            {{ s === 0 ? pick('Nein', 'No') : s }}
          </button>
        </div>
      </div>

      <button @click="submit" class="button button-primary button-block">{{ pick('Bewertung speichern', 'Save rating') }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import { store } from '../stores/grillStore.js'
import { normalizeHeader, parseCSV } from '../utils/csv.js'
import { categoryLabel } from '../constants/products.js'
import { i18n, normalizeProductUrl, pick, t } from '../i18n.js'

const name = ref('')
const labels = computed(() => i18n.language === 'en'
  ? ['not at all', 'barely', 'like it', 'really like it', 'must have']
  : ['gar nicht', 'kaum', 'gerne', 'sehr gerne', 'unbedingt'])
const tempRatings = reactive({})
const csvMsg = ref('')
const csvOk = ref(false)
const search = ref('')
const categoryFilter = ref('')
const typeFilter = ref('')

const usedCategories = computed(() =>
  [...new Set(store.products.map(product => product.cat).filter(Boolean))].sort()
)

const filteredProducts = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('de-DE')
  return store.products.filter(product =>
    (!query || product.name.toLocaleLowerCase('de-DE').includes(query))
    && (!categoryFilter.value || product.cat === categoryFilter.value)
    && (!typeFilter.value
      || (typeFilter.value === 'extra' ? product.isExtra : !product.isExtra))
  )
})

function submit() {
  if (!name.value.trim()) return alert(pick('Bitte Namen eingeben!', 'Please enter a name.'))
  if (!store.globalGrams && store.products.some(product => !product.isExtra)) {
    return alert(pick('Bitte zuerst Gramm pro Person unter Vorbereitung einstellen!', 'Set grams per person under Setup first.'))
  }
  const rObj = {}
  store.products.forEach(p => { rObj[p.name] = tempRatings[p.name] || 0 })
  const existing = store.ratings.findIndex(r => r.name === name.value.trim())
  if (existing >= 0 && !confirm(pick(
    name.value + ' hat schon abgestimmt. Überschreiben?',
    name.value + ' has already responded. Overwrite?'
  ))) return
  store.addRating({ name: name.value.trim(), grams: store.globalGrams, ratings: rObj })
  name.value = ''
  store.products.forEach(p => { tempRatings[p.name] = 0 })
  alert(pick('Bewertung gespeichert.', 'Rating saved.'))
}

function importCSV(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      if (!store.globalGrams && store.products.some(product => !product.isExtra)) {
        throw new Error(pick('Bitte zuerst die Gramm pro Person unter „Vorbereitung“ festlegen.', 'Set grams per person under “Setup” first.'))
      }
      if (!store.products.length) {
        throw new Error(pick('Bitte zuerst die Produkt-CSV importieren.', 'Import the product CSV first.'))
      }

      const rows = parseCSV(ev.target.result)
      if (rows.length < 2) throw new Error(pick('Keine Umfrageantworten gefunden.', 'No survey responses found.'))

      const headers = rows[0]
      const normalizedHeaders = headers.map(normalizeHeader)
      const nameColumn = normalizedHeaders.indexOf('name')
      if (nameColumn < 0) {
        throw new Error(pick('Die Umfrage-CSV benötigt eine Spalte mit der Überschrift „Name“.', 'The survey CSV requires a column named “Name”.'))
      }

      const productMap = new Map(store.products.map(product => [normalizeHeader(product.name), product.name]))
      const productColumns = headers
        .map((header, index) => ({
          index,
          header: header.trim(),
          productName: productMap.get(normalizeHeader(header))
        }))
        .filter(column => column.productName)

      const unknownColumns = headers
        .filter((header, index) => {
          const normalized = normalizeHeader(header)
          return index !== nameColumn
            && !isIgnoredSurveyColumn(normalized)
            && header.trim()
            && !productMap.has(normalized)
        })

      if (!productColumns.length) {
        throw new Error(pick('Keine Produktspalten erkannt. Die Überschriften müssen den Produktnamen entsprechen.', 'No product columns detected. Headers must match product names.'))
      }

      let count = 0
      for (const cols of rows.slice(1)) {
        const personName = cols[nameColumn]?.trim()
        if (!personName) continue
        const rObj = {}
        store.products.forEach(product => { rObj[product.name] = 0 })
        productColumns.forEach(column => {
          const stars = parseInt(cols[column.index], 10)
          rObj[column.productName] = Number.isFinite(stars) && stars >= 1 && stars <= 4
            ? stars
            : 0
        })
        store.addRating({ name: personName, grams: store.globalGrams, ratings: rObj })
        count++
      }

      if (!count) throw new Error(pick('Keine Zeilen mit einem Namen gefunden.', 'No rows containing a name were found.'))
      const ignoredNote = unknownColumns.length
        ? pick(` Nicht erkannte Spalten ignoriert: ${unknownColumns.join(', ')}.`, ` Unrecognized columns ignored: ${unknownColumns.join(', ')}.`)
        : ''
      csvMsg.value = pick(
        `${count} Personen und ${productColumns.length} Produktspalten importiert.${ignoredNote}`,
        `${count} people and ${productColumns.length} product columns imported.${ignoredNote}`
      )
      csvOk.value = true
    } catch (error) {
      csvMsg.value = error.message || pick('Fehler beim Lesen der CSV-Datei.', 'Could not read the CSV file.')
      csvOk.value = false
    }
  }
  reader.readAsText(file)
}

function isIgnoredSurveyColumn(header) {
  const compact = header.replace(/[^a-z0-9äöüß]/g, '')
  return compact === 'zeitstempel'
    || compact === 'timestamp'
    || compact === 'bigback'
}
</script>
