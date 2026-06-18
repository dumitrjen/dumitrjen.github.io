<template>
  <div>
    <div class="section-card ember-card" :class="{ collapsed: collapsed.portion }">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{{ pick('Grundlage', 'Basics') }}</p>
          <h2>{{ pick('Portion festlegen', 'Set portion size') }}</h2>
        </div>
        <div class="section-heading-actions">
          <p>{{ pick('Diese Menge gilt für jeden Gast.', 'This amount applies to every guest.') }}</p>
          <button @click="toggleSection('portion')" class="collapse-button" :aria-expanded="!collapsed.portion">
            {{ collapsed.portion ? pick('Anzeigen', 'Show') : pick('Ausblenden', 'Hide') }}
          </button>
        </div>
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

    <div class="section-card green-card" :class="{ collapsed: collapsed.csv }">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{{ pick('Schneller Start', 'Quick start') }}</p>
          <h2>{{ pick('Produkte importieren', 'Import products') }}</h2>
        </div>
        <div class="section-heading-actions">
          <button v-if="store.products.length" @click="exportProducts" class="button button-quiet">
            {{ pick('CSV exportieren', 'Export CSV') }}
          </button>
          <button @click="toggleSection('csv')" class="collapse-button" :aria-expanded="!collapsed.csv">
            {{ collapsed.csv ? pick('Anzeigen', 'Show') : pick('Ausblenden', 'Hide') }}
          </button>
        </div>
      </div>
      <p class="helper-text">{{ pick('Die Produktnamen werden später exakt diesen Umfragespalten zugeordnet.', 'Product names are matched exactly to the survey columns later.') }}</p>
      <div class="csv-rules">
        <h3>{{ pick('So werden die Kategorien ausgewertet', 'How categories are evaluated') }}</h3>
        <div class="csv-rule-grid">
          <div>
            <strong>{{ pick('Fleisch und Veggie', 'Meat and veggie') }}</strong>
            <span>{{ pick('Beide Kategorien bilden gemeinsam die Hauptportion und werden nach den Sternen auf die Grammmenge jeder Person verteilt.', 'Both categories form one shared main portion and are distributed across each person’s gram allowance based on ratings.') }}</span>
          </div>
          <div>
            <strong>{{ pick('Getränke', 'Drinks') }}</strong>
            <span>{{ pick('Zeigt Interessenten, Durchschnittssterne und Beliebtheit im Vergleich zu anderen Getränken. Keine automatische Packungszahl.', 'Shows interested guests, average stars, and popularity compared with other drinks. No automatic package count.') }}</span>
          </div>
          <div>
            <strong>{{ pick('Sides und Süßes', 'Sides and sweets') }}</strong>
            <span>{{ pick('Zeigt Interessenten und den Sternedurchschnitt über alle Gäste. Keine Packungszahl.', 'Shows interested guests and the star average across all guests. No package count.') }}</span>
          </div>
        </div>
      </div>
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
                <th>{{ pick('Preis', 'Price') }}</th>
                <th>{{ pick('GrammProPackung', 'GramsPerPackage') }}</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bratwurst</td>
                <td>Fleisch</td>
                <td>4.99</td>
                <td>400</td>
                <td>https://shop.example/bratwurst</td>
              </tr>
              <tr>
                <td>Grillkäse</td>
                <td>Veggie</td>
                <td>3.49</td>
                <td>200</td>
                <td>https://shop.example/grillkaese</td>
              </tr>
              <tr>
                <td>Cola</td>
                <td>Getränke</td>
                <td>1.50</td>
                <td></td>
                <td>https://shop.example/cola</td>
              </tr>
              <tr>
                <td>Ketchup</td>
                <td>Sides</td>
                <td>2.99</td>
                <td></td>
                <td>https://shop.example/ketchup</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>{{ pick('Die Kategorie bestimmt automatisch die Berechnung. GrammProPackung wird für Fleisch und Veggie benötigt.', 'The category automatically controls the calculation. GramsPerPackage is required for meat and veggie products.') }}</p>
      </div>
      <input type="file" accept=".csv" @change="importProducts" class="file-input">
      <p v-if="csvMsg" class="feedback" :class="csvOk ? 'success' : 'error'">{{ csvMsg }}</p>
    </div>

    <div class="section-card" :class="{ collapsed: collapsed.add }">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{{ pick('Sortiment', 'Selection') }}</p>
          <h2>{{ pick('Produkt hinzufügen', 'Add product') }}</h2>
        </div>
        <button @click="toggleSection('add')" class="collapse-button" :aria-expanded="!collapsed.add">
          {{ collapsed.add ? pick('Anzeigen', 'Show') : pick('Ausblenden', 'Hide') }}
        </button>
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
        <div v-if="isMainCategory(form.cat)" class="field">
          <label>{{ pick('Gramm pro Packung', 'Grams per package') }}</label>
          <input v-model.number="form.packGrams" type="number" min="1" :placeholder="pick('z. B. 200', 'e.g. 200')">
        </div>
        <div v-if="form.cat && !isMainCategory(form.cat)" class="field special-category-note">
          <label>{{ pick('Automatische Auswertung', 'Automatic evaluation') }}</label>
          <p>{{ categoryDescription(form.cat) }}</p>
        </div>
        <div class="field field-span">
          <label>{{ pick('Produktlink (optional)', 'Product link (optional)') }}</label>
          <input v-model="form.link" type="url" placeholder="https://…">
        </div>
      </div>
      <button @click="addProduct" class="button button-primary button-block">{{ pick('Produkt hinzufügen', 'Add product') }}</button>
    </div>

    <div class="section-card" :class="{ collapsed: collapsed.products }">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{{ pick('Aktuelle Auswahl', 'Current selection') }}</p>
          <h2>{{ pick('Produkte', 'Products') }} <span class="count-badge">{{ store.products.length }}</span></h2>
        </div>
        <button @click="toggleSection('products')" class="collapse-button" :aria-expanded="!collapsed.products">
          {{ collapsed.products ? pick('Anzeigen', 'Show') : pick('Ausblenden', 'Hide') }}
        </button>
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
        <div v-for="p in filteredProducts" :key="p.index" class="product-list-entry">
          <div class="list-item">
            <div>
            <strong>{{ p.name }}</strong>
            <span class="category-tag">{{ p.cat ? categoryLabel(p.cat, i18n.language) : t('noCategory') }}</span>
            <span v-if="p.isExtra" class="type-tag">{{ t('extra') }}</span>
            <p class="item-meta">
              €{{ Number(p.price).toFixed(2) }} / {{ t('package') }} ·
              {{ purchaseSummary(p) }}
            </p>
            <a v-if="p.link" class="product-link" :href="normalizeProductUrl(p.link)" target="_blank" rel="noopener noreferrer">{{ t('openLink') }}</a>
            </div>
            <div class="item-actions">
              <button @click="toggleEditor(p.index)" class="button button-quiet">
                {{ editingIndex === p.index ? pick('Schließen', 'Close') : pick('Bearbeiten', 'Edit') }}
              </button>
              <button @click="store.deleteProduct(p.index)" class="button button-danger">{{ pick('Löschen', 'Delete') }}</button>
            </div>
          </div>

          <div v-if="editingIndex === p.index" class="inline-editor">
            <div class="field-grid">
              <div class="field">
                <label>{{ pick('Name', 'Name') }}</label>
                <input v-model="editForm.name">
              </div>
              <div class="field">
                <label>{{ pick('Kategorie', 'Category') }}</label>
                <select v-model="editForm.cat">
                  <option v-for="category in PRODUCT_CATEGORIES" :key="category" :value="category">
                    {{ categoryLabel(category, i18n.language) }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label>{{ pick('Preis pro Packung (€)', 'Price per package (€)') }}</label>
                <input v-model.number="editForm.price" type="number" min="0" step="0.01">
              </div>
              <div v-if="isMainCategory(editForm.cat)" class="field">
                <label>{{ pick('Gramm pro Packung', 'Grams per package') }}</label>
                <input v-model.number="editForm.packGrams" type="number" min="1">
              </div>
              <div class="field field-span">
                <label>{{ pick('Produktlink (optional)', 'Product link (optional)') }}</label>
                <input v-model="editForm.link" type="url" placeholder="https://…">
              </div>
            </div>
            <div class="editor-actions">
              <button @click="editingIndex = null" class="button button-quiet">{{ pick('Abbrechen', 'Cancel') }}</button>
              <button @click="saveProduct(p.index)" class="button button-primary">{{ pick('Änderungen speichern', 'Save changes') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-card" :class="{ collapsed: collapsed.reset }">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{{ pick('Aufräumen', 'Cleanup') }}</p>
          <h2>{{ pick('Daten zurücksetzen', 'Reset data') }}</h2>
        </div>
        <button @click="toggleSection('reset')" class="collapse-button" :aria-expanded="!collapsed.reset">
          {{ collapsed.reset ? pick('Anzeigen', 'Show') : pick('Ausblenden', 'Hide') }}
        </button>
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
import { PRODUCT_CATEGORIES, categoryLabel, normalizeCategory, productIsExtra, productKind } from '../constants/products.js'
import { i18n, normalizeProductUrl, pick, t } from '../i18n.js'

const csvMsg = ref('')
const csvOk = ref(false)
const search = ref('')
const categoryFilter = ref('')
const typeFilter = ref('')
const editingIndex = ref(null)
const collapsed = reactive(loadCollapsedSections())
const form = reactive({
  name: '',
  cat: '',
  price: 0,
  packGrams: 100,
  link: ''
})
const editForm = reactive({
  name: '',
  cat: '',
  price: 0,
  packGrams: 100,
  link: ''
})

const usedCategories = computed(() =>
  [...new Set(store.products.map(product => product.cat).filter(Boolean))].sort()
)

const filteredProducts = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('de-DE')
  return store.products
    .map((product, index) => ({ ...product, isExtra: productIsExtra(product), index }))
    .filter(product =>
      (!query || product.name.toLocaleLowerCase('de-DE').includes(query))
      && (!categoryFilter.value || product.cat === categoryFilter.value)
      && (!typeFilter.value
        || (typeFilter.value === 'extra' ? productIsExtra(product) : !productIsExtra(product)))
    )
})

function addProduct() {
  if (!form.name.trim()) return alert(pick('Bitte Produktname eingeben!', 'Please enter a product name.'))
  if (!form.cat) return alert(pick('Bitte Kategorie wählen!', 'Please choose a category.'))
  store.addProduct({
    name: form.name.trim(),
    cat: form.cat.trim(),
    price: Number(form.price) || 0,
    packGrams: Number(form.packGrams) || 100,
    isExtra: !isMainCategory(form.cat),
    link: form.link.trim()
  })
  form.name = ''
  form.cat = ''
  form.price = 0
  form.packGrams = 100
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
        price: findHeader(headers, ['preis', 'price']),
        packGrams: findHeader(headers, ['grammpropackung', 'gramsperpackage']),
        link: findHeader(headers, ['link', 'url'])
      }
      if ([columns.name, columns.cat, columns.price].some(index => index < 0)) {
        throw new Error(pick('Kopfzeile muss mindestens Name, Kategorie und Preis enthalten.', 'Header must contain at least Name, Category, and Price.'))
      }

      let count = 0
      for (const cols of rows.slice(1)) {
        if (!cols[columns.name]) continue
        const rawCategory = cols[columns.cat]?.trim() || ''
        const category = normalizeCategory(rawCategory)
        store.addProduct({
          name: cols[columns.name].trim(),
          cat: category,
          price: Number(cols[columns.price]?.replace(',', '.')) || 0,
          packGrams: columns.packGrams >= 0 ? Number(cols[columns.packGrams]) || 100 : 100,
          isExtra: !isMainCategory(category),
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

function toggleEditor(index) {
  if (editingIndex.value === index) {
    editingIndex.value = null
    return
  }
  const product = store.products[index]
  Object.assign(editForm, {
    name: product.name,
    cat: product.cat,
    price: Number(product.price) || 0,
    packGrams: Number(product.packGrams) || 100,
    link: product.link || ''
  })
  editingIndex.value = index
}

function saveProduct(index) {
  const product = store.products[index]
  const oldName = product.name
  const newName = editForm.name.trim()
  if (!newName) return alert(pick('Bitte Produktname eingeben!', 'Please enter a product name.'))
  if (!editForm.cat) return alert(pick('Bitte Kategorie wählen!', 'Please choose a category.'))
  if (newName !== oldName && store.products.some((item, itemIndex) => itemIndex !== index && item.name === newName)) {
    return alert(pick('Dieser Produktname existiert bereits.', 'This product name already exists.'))
  }

  Object.assign(product, {
    name: newName,
    cat: editForm.cat,
    price: Number(editForm.price) || 0,
    packGrams: Number(editForm.packGrams) || 100,
    isExtra: !isMainCategory(editForm.cat),
    link: editForm.link.trim()
  })

  if (newName !== oldName) {
    store.ratings.forEach(person => {
      if (Object.prototype.hasOwnProperty.call(person.ratings, oldName)) {
        person.ratings[newName] = person.ratings[oldName]
        delete person.ratings[oldName]
      }
    })
  }
  editingIndex.value = null
}

function exportProducts() {
  const headers = ['Name', 'Kategorie', 'Preis', 'GrammProPackung', 'Link']
  const rows = store.products.map(product => [
    product.name,
    product.cat,
    Number(product.price) || 0,
    isMainCategory(product.cat) ? Number(product.packGrams) || 100 : '',
    product.link || ''
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(csvCell).join(','))
    .join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'grill-produkte.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toggleSection(section) {
  collapsed[section] = !collapsed[section]
  localStorage.setItem('grill_admin_collapsed', JSON.stringify(collapsed))
}

function loadCollapsedSections() {
  const defaults = { portion: false, csv: true, add: false, products: false, reset: true }
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem('grill_admin_collapsed') || '{}') }
  } catch {
    return defaults
  }
}

function resetRatings() {
  if (confirm(pick('Alle Bewertungen löschen?', 'Delete all ratings?'))) store.resetRatings()
}

function resetAll() {
  if (confirm(pick('Wirklich alles löschen?', 'Really delete all data?'))) store.resetAll()
}

function findHeader(headers, names) {
  return headers.findIndex(header => names.includes(header))
}

function purchaseSummary(product) {
  const kind = productKind(product)
  if (!productIsExtra(product)) return `${product.packGrams || 100} g`
  if (kind === 'drink') return pick('Beliebtheitsauswertung', 'Popularity analysis')
  return pick('Interessenten und Durchschnitt', 'Interest and average rating')
}

function categoryDescription(category) {
  if (category === 'Getränke') return pick('Wird nur mit anderen Getränken nach Beliebtheit verglichen.', 'Compared with other drinks by popularity only.')
  return pick('Zeigt Interessenten und Durchschnittssterne; keine Packungsberechnung.', 'Shows interested guests and average stars; no package calculation.')
}

function isMainCategory(category) {
  return category === 'Fleisch' || category === 'Veggie'
}
</script>
