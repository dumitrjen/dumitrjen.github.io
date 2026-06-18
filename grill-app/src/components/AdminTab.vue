<template>
  <div>
    <div class="section-card ember-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{{ pick('Grundlage', 'Basics') }}</p>
          <h2>{{ pick('Portion festlegen', 'Set portion size') }}</h2>
        </div>
        <p>{{ pick('Diese Menge gilt für jeden Gast.', 'This amount applies to every guest.') }}</p>
      </div>
      <div class="field-row">
        <div class="field">
          <label>{{ pick('Gramm pro Person', 'Grams per person') }}</label>
          <input v-model.number="store.globalGrams" type="number" min="0" :placeholder="pick('z. B. 400', 'e.g. 400')">
        </div>
        <div class="status-note">
          {{ store.globalGrams ? store.globalGrams + pick(' g pro Person', ' g per person') : pick('Noch nicht festgelegt', 'Not set yet') }}
        </div>
      </div>
    </div>

    <div class="section-card green-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{{ pick('Schneller Start', 'Quick start') }}</p>
          <h2>{{ pick('Produkte importieren', 'Import products') }}</h2>
        </div>
      </div>
      <p class="helper-text">{{ pick('Die Produktnamen werden später exakt diesen Umfragespalten zugeordnet.', 'Product names are matched exactly to the survey columns later.') }}</p>
      <div class="csv-preview">
        <div class="csv-preview-title">
          <strong>{{ pick('So muss die Produkt-CSV aussehen', 'Required product CSV format') }}</strong>
          <span>{{ pick('Komma oder Semikolon sind erlaubt', 'Comma or semicolon delimiters are supported') }}</span>
        </div>
        <div class="csv-table-wrap">
          <table class="csv-table">
            <thead>
              <tr>
                <th>{{ pick('Name', 'Name') }}</th>
                <th>{{ pick('Kategorie', 'Category') }}</th>
                <th>{{ pick('Typ', 'Type') }}</th>
                <th>{{ pick('Preis', 'Price') }}</th>
                <th>{{ pick('GrammProPackung', 'GramsPerPackage') }}</th>
                <th>{{ pick('PortionenProPackung', 'ServingsPerPackage') }}</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bratwurst</td>
                <td>Fleisch</td>
                <td>Hauptprodukt</td>
                <td>4.99</td>
                <td>400</td>
                <td></td>
                <td>https://shop.example/bratwurst</td>
              </tr>
              <tr>
                <td>Griechischer Salat</td>
                <td>Salate</td>
                <td>Extra</td>
                <td>6.50</td>
                <td></td>
                <td>6</td>
                <td>https://shop.example/salat</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>{{ pick('Hauptprodukt: GrammProPackung ausfüllen. Extra: PortionenProPackung ausfüllen. Link ist optional.', 'Main product: fill GramsPerPackage. Extra: fill ServingsPerPackage. Link is optional.') }}</p>
      </div>
      <input type="file" accept=".csv" @change="importProducts" class="file-input">
      <p v-if="csvMsg" class="feedback" :class="csvOk ? 'success' : 'error'">{{ csvMsg }}</p>
    </div>

    <div class="section-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{{ pick('Sortiment', 'Selection') }}</p>
          <h2>{{ pick('Produkt hinzufügen', 'Add product') }}</h2>
        </div>
      </div>
      <div class="field-grid">
        <div class="field">
          <label>{{ pick('Name', 'Name') }}</label>
          <input v-model="form.name" :placeholder="pick('z. B. Bratwurst', 'e.g. sausage')">
        </div>
        <div class="field">
          <label>{{ pick('Kategorie', 'Category') }}</label>
          <select v-model="form.cat">
            <option value="">{{ pick('Kategorie wählen', 'Choose category') }}</option>
            <option v-for="category in PRODUCT_CATEGORIES" :key="category" :value="category">{{ categoryLabel(category, i18n.language) }}</option>
          </select>
        </div>
        <div class="field">
          <label>{{ pick('Preis pro Packung (€)', 'Price per package (€)') }}</label>
          <input v-model.number="form.price" type="number" step="0.01" min="0" placeholder="4.99">
        </div>
        <div v-if="!form.isExtra" class="field">
          <label>{{ pick('Gramm pro Packung', 'Grams per package') }}</label>
          <input v-model.number="form.packGrams" type="number" min="1" :placeholder="pick('z. B. 200', 'e.g. 200')">
        </div>
        <div v-else class="field">
          <label>{{ pick('Portionen pro Packung', 'Servings per package') }}</label>
          <input v-model.number="form.servingsPerPack" type="number" min="1" :placeholder="pick('z. B. 6', 'e.g. 6')">
        </div>
        <div class="field field-span">
          <label>{{ pick('Produktlink (optional)', 'Product link (optional)') }}</label>
          <input v-model="form.link" type="url" placeholder="https://…">
        </div>
      </div>
      <label class="check-card">
        <input v-model="form.isExtra" type="checkbox">
        <span>
          <strong>{{ pick('Als Extra / Beilage behandeln', 'Treat as an extra / side') }}</strong>
          <small>{{ pick('Wird bewertet und eingekauft, aber nicht in die Grammportion eingerechnet.', 'It is rated and purchased, but excluded from the gram allocation.') }}</small>
        </span>
      </label>
      <button @click="addProduct" class="button button-primary button-block">{{ pick('Produkt hinzufügen', 'Add product') }}</button>
    </div>

    <div class="section-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{{ pick('Aktuelle Auswahl', 'Current selection') }}</p>
          <h2>{{ pick('Produkte', 'Products') }} <span class="count-badge">{{ store.products.length }}</span></h2>
        </div>
      </div>
      <div class="filter-bar">
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
            <option value="">{{ pick('Alle Typen', 'All types') }}</option>
            <option value="main">{{ pick('Hauptprodukte', 'Main products') }}</option>
            <option value="extra">{{ pick('Extras', 'Extras') }}</option>
          </select>
        </div>
      </div>
      <div v-if="!store.products.length" class="empty-state">{{ pick('Noch keine Produkte angelegt.', 'No products added yet.') }}</div>
      <div v-else-if="!filteredProducts.length" class="empty-state">{{ pick('Keine passenden Produkte gefunden.', 'No matching products found.') }}</div>
      <div v-else class="item-list">
        <div v-for="p in filteredProducts" :key="p.index" class="list-item">
          <div>
            <strong>{{ p.name }}</strong>
            <span class="category-tag">{{ p.cat ? categoryLabel(p.cat, i18n.language) : t('noCategory') }}</span>
            <span v-if="p.isExtra" class="type-tag">{{ t('extra') }}</span>
            <p class="item-meta">
              €{{ Number(p.price).toFixed(2) }} / {{ t('package') }} ·
              {{ p.isExtra ? `${p.servingsPerPack || 1} ${t('servings')}` : `${p.packGrams || 100} g` }}
            </p>
            <a v-if="p.link" class="product-link" :href="normalizeProductUrl(p.link)" target="_blank" rel="noopener noreferrer">{{ t('openLink') }}</a>
            <label v-if="p.isExtra" class="inline-number-field">
              {{ pick('Portionen pro Packung', 'Servings per package') }}
              <input v-model.number="store.products[p.index].servingsPerPack" type="number" min="1">
            </label>
          </div>
          <div class="item-actions">
            <button @click="toggleExtra(p.index)" class="button button-muted">
              {{ p.isExtra ? pick('Als Hauptprodukt', 'Make main product') : pick('Als Extra markieren', 'Mark as extra') }}
            </button>
            <button @click="store.deleteProduct(p.index)" class="button button-danger">{{ pick('Löschen', 'Delete') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{{ pick('Aufräumen', 'Cleanup') }}</p>
          <h2>{{ pick('Daten zurücksetzen', 'Reset data') }}</h2>
        </div>
      </div>
      <div class="button-grid">
        <button @click="resetRatings" class="button button-muted">{{ pick('Nur Bewertungen löschen', 'Delete ratings only') }}</button>
        <button @click="resetAll" class="button button-danger">{{ pick('Alle Daten löschen', 'Delete all data') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { store } from '../stores/grillStore.js'
import { normalizeHeader, parseCSV } from '../utils/csv.js'
import { PRODUCT_CATEGORIES, categoryLabel } from '../constants/products.js'
import { i18n, normalizeProductUrl, pick, t } from '../i18n.js'

const csvMsg = ref('')
const csvOk = ref(false)
const search = ref('')
const categoryFilter = ref('')
const typeFilter = ref('')
const form = reactive({
  name: '',
  cat: '',
  price: 0,
  packGrams: 100,
  servingsPerPack: 1,
  isExtra: false,
  link: ''
})

const usedCategories = computed(() =>
  [...new Set(store.products.map(product => product.cat).filter(Boolean))].sort()
)

const filteredProducts = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('de-DE')
  return store.products
    .map((product, index) => ({ ...product, index }))
    .filter(product =>
      (!query || product.name.toLocaleLowerCase('de-DE').includes(query))
      && (!categoryFilter.value || product.cat === categoryFilter.value)
      && (!typeFilter.value
        || (typeFilter.value === 'extra' ? product.isExtra : !product.isExtra))
    )
})

function addProduct() {
  if (!form.name.trim()) return alert(pick('Bitte Produktname eingeben!', 'Please enter a product name.'))
  store.addProduct({
    name: form.name.trim(),
    cat: form.cat.trim(),
    price: Number(form.price) || 0,
    packGrams: Number(form.packGrams) || 100,
    servingsPerPack: Number(form.servingsPerPack) || 1,
    isExtra: form.isExtra,
    link: form.link.trim()
  })
  form.name = ''
  form.cat = ''
  form.price = 0
  form.packGrams = 100
  form.servingsPerPack = 1
  form.isExtra = false
  form.link = ''
}

function importProducts(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const rows = parseCSV(ev.target.result)
      if (rows.length < 2) throw new Error(pick('Keine Produktdaten gefunden.', 'No product data found.'))

      const headers = rows[0].map(normalizeHeader)
      const columns = {
        name: findHeader(headers, ['name']),
        cat: findHeader(headers, ['kategorie', 'category']),
        type: findHeader(headers, ['typ', 'type']),
        price: findHeader(headers, ['preis', 'price']),
        packGrams: findHeader(headers, ['grammpropackung', 'gramsperpackage']),
        servingsPerPack: findHeader(headers, ['portionenpropackung', 'servingsperpackage']),
        link: findHeader(headers, ['link', 'url'])
      }
      if ([columns.name, columns.cat, columns.price].some(index => index < 0)) {
        throw new Error(pick('Kopfzeile muss mindestens Name, Kategorie und Preis enthalten.', 'Header must contain at least Name, Category, and Price.'))
      }

      let count = 0
      for (const cols of rows.slice(1)) {
        if (!cols[columns.name]) continue
        const type = columns.type >= 0 ? normalizeHeader(cols[columns.type]) : ''
        const isExtra = ['extra', 'beilage', 'side'].includes(type)
        store.addProduct({
          name: cols[columns.name].trim(),
          cat: cols[columns.cat]?.trim() || '',
          price: Number(cols[columns.price]?.replace(',', '.')) || 0,
          packGrams: columns.packGrams >= 0 ? Number(cols[columns.packGrams]) || 100 : 100,
          servingsPerPack: columns.servingsPerPack >= 0
            ? Number(cols[columns.servingsPerPack]) || 1
            : 1,
          isExtra,
          link: columns.link >= 0 ? cols[columns.link]?.trim() || '' : ''
        })
        count++
      }
      if (!count) throw new Error(pick('Keine gültigen Produktzeilen gefunden.', 'No valid product rows found.'))
      csvMsg.value = pick(`${count} Produkte importiert.`, `${count} products imported.`)
      csvOk.value = true
    } catch (error) {
      csvMsg.value = error.message || pick('Fehler beim Lesen der CSV-Datei.', 'Could not read the CSV file.')
      csvOk.value = false
    }
  }
  reader.readAsText(file)
}

function resetRatings() {
  if (confirm(pick('Alle Bewertungen löschen?', 'Delete all ratings?'))) store.resetRatings()
}

function toggleExtra(index) {
  const product = store.products[index]
  product.isExtra = !product.isExtra
  if (product.isExtra && !product.servingsPerPack) product.servingsPerPack = 1
}

function resetAll() {
  if (confirm(pick('Wirklich alles löschen?', 'Really delete all data?'))) store.resetAll()
}

function findHeader(headers, names) {
  return headers.findIndex(header => names.includes(header))
}
</script>
