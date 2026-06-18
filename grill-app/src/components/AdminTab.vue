<template>
  <div>
    <div class="section-card ember-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Grundlage</p>
          <h2>Portion festlegen</h2>
        </div>
        <p>Diese Menge gilt für jeden Gast.</p>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Gramm pro Person</label>
          <input v-model.number="store.globalGrams" type="number" min="0" placeholder="z. B. 400">
        </div>
        <div class="status-note">
          {{ store.globalGrams ? store.globalGrams + ' g pro Person' : 'Noch nicht festgelegt' }}
        </div>
      </div>
    </div>

    <div class="section-card green-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Schneller Start</p>
          <h2>Produkte importieren</h2>
        </div>
      </div>
      <p class="helper-text">Die Produktnamen werden später exakt diesen Umfragespalten zugeordnet.</p>
      <div class="csv-preview">
        <div class="csv-preview-title">
          <strong>So muss die Produkt-CSV aussehen</strong>
          <span>Komma oder Semikolon sind erlaubt</span>
        </div>
        <div class="csv-table-wrap">
          <table class="csv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Kategorie</th>
                <th>Preis</th>
                <th>GrammProPackung</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bratwurst</td>
                <td>Fleisch</td>
                <td>4.99</td>
                <td>400</td>
              </tr>
              <tr>
                <td>Grillkäse</td>
                <td>Vegetarisch</td>
                <td>3.49</td>
                <td>200</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><strong>Name</strong> muss eindeutig sein. Preis = Packungspreis, GrammProPackung = Packungsinhalt.</p>
      </div>
      <input type="file" accept=".csv" @change="importProducts" class="file-input">
      <p v-if="csvMsg" class="feedback" :class="csvOk ? 'success' : 'error'">{{ csvMsg }}</p>
    </div>

    <div class="section-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Sortiment</p>
          <h2>Produkt hinzufügen</h2>
        </div>
      </div>
      <div class="field-grid">
        <div class="field">
          <label>Name</label>
          <input v-model="form.name" placeholder="z. B. Bratwurst">
        </div>
        <div class="field">
          <label>Kategorie</label>
          <input v-model="form.cat" placeholder="z. B. Fleisch">
        </div>
        <div class="field">
          <label>Preis pro Packung (€)</label>
          <input v-model.number="form.price" type="number" step="0.01" min="0" placeholder="4.99">
        </div>
        <div class="field">
          <label>Gramm pro Packung</label>
          <input v-model.number="form.packGrams" type="number" min="1" placeholder="z. B. 200">
        </div>
      </div>
      <button @click="addProduct" class="button button-primary button-block">Produkt hinzufügen</button>
    </div>

    <div class="section-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Aktuelle Auswahl</p>
          <h2>Produkte <span class="count-badge">{{ store.products.length }}</span></h2>
        </div>
      </div>
      <div v-if="!store.products.length" class="empty-state">Noch keine Produkte angelegt.</div>
      <div v-else class="item-list">
        <div v-for="(p, i) in store.products" :key="i" class="list-item">
          <div>
            <strong>{{ p.name }}</strong>
            <span class="category-tag">{{ p.cat || 'Ohne Kategorie' }}</span>
            <p class="item-meta">€{{ Number(p.price).toFixed(2) }} / Packung · {{ p.packGrams || 100 }} g</p>
          </div>
          <button @click="store.deleteProduct(i)" class="button button-danger" :aria-label="`${p.name} löschen`">Löschen</button>
        </div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Aufräumen</p>
          <h2>Daten zurücksetzen</h2>
        </div>
      </div>
      <div class="button-grid">
        <button @click="resetRatings" class="button button-muted">Nur Bewertungen löschen</button>
        <button @click="resetAll" class="button button-danger">Alle Daten löschen</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { store } from '../stores/grillStore.js'
import { normalizeHeader, parseCSV } from '../utils/csv.js'

const csvMsg = ref('')
const csvOk = ref(false)
const form = reactive({ name: '', cat: '', price: 0, packGrams: 100 })

function addProduct() {
  if (!form.name.trim()) return alert('Bitte Produktname eingeben!')
  store.addProduct({
    name: form.name.trim(),
    cat: form.cat.trim(),
    price: Number(form.price) || 0,
    packGrams: Number(form.packGrams) || 100
  })
  form.name = ''; form.cat = ''; form.price = 0; form.packGrams = 100
}

function importProducts(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const rows = parseCSV(ev.target.result)
      if (rows.length < 2) throw new Error('Keine Produktdaten gefunden.')

      const headers = rows[0].map(normalizeHeader)
      const columns = {
        name: headers.indexOf('name'),
        cat: headers.indexOf('kategorie'),
        price: headers.indexOf('preis'),
        packGrams: headers.indexOf('grammpropackung')
      }
      if (Object.values(columns).some(index => index < 0)) {
        throw new Error('Kopfzeile muss Name, Kategorie, Preis und GrammProPackung enthalten.')
      }

      let count = 0
      for (const cols of rows.slice(1)) {
        if (!cols[columns.name]) continue
        store.addProduct({
          name: cols[columns.name].trim(),
          cat: cols[columns.cat]?.trim() || '',
          price: Number(cols[columns.price]?.replace(',', '.')) || 0,
          packGrams: Number(cols[columns.packGrams]) || 100
        })
        count++
      }
      if (!count) throw new Error('Keine gültigen Produktzeilen gefunden.')
      csvMsg.value = `${count} Produkte importiert.`
      csvOk.value = true
    } catch (error) {
      csvMsg.value = error.message || 'Fehler beim Lesen der CSV-Datei.'
      csvOk.value = false
    }
  }
  reader.readAsText(file)
}

function resetRatings() {
  if (confirm('Alle Bewertungen löschen?')) store.resetRatings()
}
function resetAll() {
  if (confirm('Wirklich alles löschen?')) store.resetAll()
}
</script>
