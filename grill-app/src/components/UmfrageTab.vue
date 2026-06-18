<template>
  <div>
    <div class="section-card green-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Mehrere Gäste</p>
          <h2>Antworten importieren</h2>
        </div>
      </div>
      <p class="helper-text">Die Exportdatei aus der Umfrage wird anhand der Spaltenüberschriften zugeordnet.</p>
      <div class="csv-preview">
        <div class="csv-preview-title">
          <strong>So muss die Umfrage-CSV aussehen</strong>
          <span>Bewertungen von 1 bis 4 Sternen</span>
        </div>
        <div class="csv-table-wrap">
          <table class="csv-table survey-csv-table">
            <thead>
              <tr>
                <th class="ignored-column">Zeitstempel</th>
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
          <span><i class="legend-swatch ignored" /> wird ignoriert</span>
          <span><i class="legend-swatch product" /> Produktname muss zur Produkt-CSV passen</span>
        </div>
      </div>
      <input type="file" accept=".csv" @change="importCSV" class="file-input">
      <p v-if="csvMsg" class="feedback" :class="csvOk ? 'success' : 'error'">{{ csvMsg }}</p>
    </div>

    <div class="section-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Einzelne Antwort</p>
          <h2>Wünsche eintragen</h2>
        </div>
        <p>{{ store.globalGrams }} g Gesamtportion</p>
      </div>

      <div class="field" style="margin-bottom: 20px">
        <label>Name</label>
        <input v-model="name" placeholder="z. B. Teddy">
      </div>

      <div v-if="!store.products.length" class="empty-state">Zuerst Produkte unter „Vorbereitung“ anlegen.</div>

      <div
        v-for="p in store.products"
        :key="p.name"
        class="rating-card"
        :class="{ selected: (tempRatings[p.name] || 0) > 0 }"
      >
        <div class="rating-header">
          <div>
            <strong>{{ p.name }}</strong>
            <span class="category-tag">{{ p.cat || 'Ohne Kategorie' }}</span>
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
            {{ s === 0 ? 'Nein' : s }}
          </button>
        </div>
      </div>

      <button @click="submit" class="button button-primary button-block">Bewertung speichern</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { store } from '../stores/grillStore.js'
import { normalizeHeader, parseCSV } from '../utils/csv.js'

const name = ref('')
const labels = ['gar nicht', 'kaum', 'gerne', 'sehr gerne', 'unbedingt']
const tempRatings = reactive({})
const csvMsg = ref('')
const csvOk = ref(false)

function submit() {
  if (!name.value.trim()) return alert('Bitte Namen eingeben!')
  if (!store.globalGrams) return alert('Bitte zuerst Gramm pro Person unter Vorbereitung einstellen!')
  const rObj = {}
  store.products.forEach(p => { rObj[p.name] = tempRatings[p.name] || 0 })
  const existing = store.ratings.findIndex(r => r.name === name.value.trim())
  if (existing >= 0 && !confirm(name.value + ' hat schon abgestimmt. Überschreiben?')) return
  store.addRating({ name: name.value.trim(), grams: store.globalGrams, ratings: rObj })
  name.value = ''
  store.products.forEach(p => { tempRatings[p.name] = 0 })
  alert('Bewertung gespeichert.')
}

function importCSV(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      if (!store.globalGrams) {
        throw new Error('Bitte zuerst die Gramm pro Person unter „Vorbereitung“ festlegen.')
      }
      if (!store.products.length) {
        throw new Error('Bitte zuerst die Produkt-CSV importieren.')
      }

      const rows = parseCSV(ev.target.result)
      if (rows.length < 2) throw new Error('Keine Umfrageantworten gefunden.')

      const headers = rows[0]
      const normalizedHeaders = headers.map(normalizeHeader)
      const nameColumn = normalizedHeaders.indexOf('name')
      if (nameColumn < 0) {
        throw new Error('Die Umfrage-CSV benötigt eine Spalte mit der Überschrift „Name“.')
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
        throw new Error('Keine Produktspalten erkannt. Die Überschriften müssen den Produktnamen entsprechen.')
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

      if (!count) throw new Error('Keine Zeilen mit einem Namen gefunden.')
      const ignoredNote = unknownColumns.length
        ? ` Nicht erkannte Spalten ignoriert: ${unknownColumns.join(', ')}.`
        : ''
      csvMsg.value = `${count} Personen und ${productColumns.length} Produktspalten importiert.${ignoredNote}`
      csvOk.value = true
    } catch (error) {
      csvMsg.value = error.message || 'Fehler beim Lesen der CSV-Datei.'
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
