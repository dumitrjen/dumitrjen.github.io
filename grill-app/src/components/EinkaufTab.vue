<template>
  <div>
    <div v-if="!store.ratings.length" class="empty-state">{{ pick('Noch keine Bewertungen vorhanden.', 'No ratings yet.') }}</div>

    <template v-else>
      <div class="result-page-nav">
        <div>
          <span>{{ pick('Seite', 'Page') }} {{ page }} / 2</span>
          <strong>{{ page === 1 ? pick('Berechneter Einkauf', 'Calculated shopping') : pick('Sides & Getränke', 'Sides & drinks') }}</strong>
        </div>
        <div class="result-page-buttons">
          <button v-if="page === 2" @click="page = 1" class="button button-quiet">{{ pick('Zurück', 'Back') }}</button>
          <button v-if="page === 1" @click="page = 2" class="button button-primary">{{ pick('Sides & Getränke festlegen', 'Set sides & drinks') }}</button>
        </div>
      </div>

      <div class="shopping-overview">
        <div>
          <span>{{ pick('Gäste', 'Guests') }}</span>
          <strong>{{ store.ratings.length }}</strong>
        </div>
        <div>
          <span>{{ pick('Fleisch', 'Meat') }}</span>
          <strong>{{ categoryGrams('Fleisch') }} g</strong>
        </div>
        <div>
          <span>Veggie</span>
          <strong>{{ categoryGrams('Veggie') }} g</strong>
        </div>
        <div>
          <span>{{ pick('Extras gewählt', 'Extras selected') }}</span>
          <strong>{{ selectedTemporaryCount }}</strong>
        </div>
        <div>
          <span>{{ pick('Kosten pro Person', 'Cost per person') }}</span>
          <strong>€{{ costPerPerson.toFixed(2) }}</strong>
        </div>
      </div>

      <div v-if="shoppingChecks.length" class="shopping-checks">
        <div v-for="check in shoppingChecks" :key="check" class="status-chip warning">{{ check }}</div>
      </div>

      <div class="filter-bar shopping-filter-bar">
        <div class="field search-field">
          <label>{{ pick('Einkauf suchen', 'Search shopping list') }}</label>
          <input v-model="shoppingSearch" type="search" :placeholder="pick('Produkt suchen …', 'Search product …')">
        </div>
        <div class="field">
          <label>{{ pick('Sortieren', 'Sort') }}</label>
          <select v-model="shoppingSort">
            <option value="name">{{ pick('Name', 'Name') }}</option>
            <option value="cost">{{ pick('Teuerste zuerst', 'Highest cost first') }}</option>
            <option value="demand">{{ pick('Höchste Nachfrage zuerst', 'Highest demand first') }}</option>
          </select>
        </div>
      </div>

      <template v-if="page === 1">
        <div v-if="!visibleCalculatedProducts.length" class="empty-state">{{ pick('Keine passenden berechneten Produkte.', 'No matching calculated products.') }}</div>

        <div v-for="p in visibleCalculatedProducts" :key="p.name" class="shopping-card">
          <div class="shopping-row">
            <div>
              <strong class="shopping-name">{{ p.name }}</strong>
              <span class="category-tag">{{ categoryLabel(p.cat, i18n.language) }}</span>
              <span class="status-chip" :class="{ warning: !p.price || !p.link }">
                {{ productStatus(p) }}
              </span>
              <a v-if="p.link" class="product-link" :href="normalizeProductUrl(p.link)" target="_blank" rel="noopener noreferrer">{{ t('openLink') }}</a>
              <p class="item-meta">{{ pick(`${p.gramm} g benötigt · ${p.packGrams} g je Packung`, `${p.gramm} g required · ${p.packGrams} g per package`) }}</p>
              <details class="calc-details">
                <summary>{{ pick('So wurde gerechnet', 'How this was calculated') }}</summary>
                <p>
                  {{ pick(
                    `${p.gramm} g Bedarf ÷ ${p.packGrams} g pro Packung = ${p.rawPackages.toFixed(2)} → ${p.packungen} Packungen.`,
                    `${p.gramm} g required ÷ ${p.packGrams} g per package = ${p.rawPackages.toFixed(2)} → ${p.packungen} packages.`
                  ) }}
                </p>
              </details>
            </div>
            <div class="shopping-total">
              <strong>{{ p.packungen }} {{ t('packages') }}</strong>
              <span>€{{ p.kosten.toFixed(2) }} {{ t('total') }}</span>
              <p class="item-meta">€{{ p.price.toFixed(2) }} / {{ t('package') }}</p>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="temporary-notice">
          <strong>{{ pick('Temporär für diesen Einkauf', 'Temporary for this shopping check') }}</strong>
          <span>{{ pick('Die eingegebenen Packungszahlen werden nicht dauerhaft gespeichert.', 'The entered package quantities are not saved permanently.') }}</span>
        </div>

        <div class="section-card">
          <div class="section-heading">
            <div>
              <p class="section-kicker">Sides</p>
              <h2>{{ pick('Wie viel willst du davon holen?', 'How much do you want to get?') }}</h2>
            </div>
          </div>
          <div v-if="!sideStats.length" class="empty-state">{{ pick('Keine Sides vorhanden.', 'No sides available.') }}</div>
          <div v-else class="drink-check-list">
            <QuantityRow
              v-for="item in visibleSideStats"
              :key="item.name"
              :item="item"
              v-model="temporaryPackages[item.name]"
            />
          </div>
        </div>

        <div class="section-card green-card">
          <div class="section-heading">
            <div>
              <p class="section-kicker">{{ pick('Getränke', 'Drinks') }}</p>
              <h2>{{ pick('Wie viele Packungen holst du?', 'How many packages will you get?') }}</h2>
            </div>
          </div>
          <div v-if="!drinkStats.length" class="empty-state">{{ pick('Keine Getränke vorhanden.', 'No drinks available.') }}</div>
          <div v-else class="drink-check-list">
            <QuantityRow
              v-for="item in visibleDrinkStats"
              :key="item.name"
              :item="item"
              v-model="temporaryPackages[item.name]"
            />
          </div>
        </div>
      </template>

      <div class="grand-total">
        <div class="total-row">
          <div class="label">
            {{ pick('Gesamtkosten', 'Total cost') }}
            <span class="subline">
              {{ pick(
                `Berechnet €${calculatedTotal.toFixed(2)} + temporär €${temporaryTotal.toFixed(2)} + manuell €${manualTotal.toFixed(2)}`,
                `Calculated €${calculatedTotal.toFixed(2)} + temporary €${temporaryTotal.toFixed(2)} + manual €${manualTotal.toFixed(2)}`
              ) }}
            </span>
          </div>
          <div class="price">€{{ grandTotal.toFixed(2) }}</div>
        </div>
      </div>

      <div class="section-card final-shopping-section">
        <div class="section-heading">
          <div>
            <p class="section-kicker">{{ pick('Finale Liste', 'Final list') }}</p>
            <h2>{{ pick('Echte Einkaufsliste', 'Actual shopping list') }}</h2>
          </div>
          <div class="section-heading-actions">
            <button @click="copyShoppingText" class="button button-quiet" :disabled="!finalShoppingItems.length">
              {{ pick('Text kopieren', 'Copy text') }}
            </button>
            <button @click="shareShoppingText" class="button button-quiet" :disabled="!finalShoppingItems.length">
              {{ pick('Teilen', 'Share') }}
            </button>
            <button @click="exportShoppingText" class="button button-quiet" :disabled="!finalShoppingItems.length">
              TXT
            </button>
            <button @click="exportShoppingList" class="button button-quiet" :disabled="!finalShoppingItems.length">
              {{ pick('CSV exportieren', 'Export CSV') }}
            </button>
            <button @click="printShoppingList" class="button button-quiet" :disabled="!finalShoppingItems.length">
              {{ pick('Drucken', 'Print') }}
            </button>
          </div>
        </div>

        <div v-if="!finalShoppingItems.length" class="empty-state">
          {{ pick('Noch keine Produkte mit Einkaufsmenge.', 'No products with shopping quantities yet.') }}
        </div>
        <p v-if="exportMessage" class="feedback success">{{ exportMessage }}</p>

        <div v-if="finalShoppingItems.length" class="shopping-mode-tools">
          <div class="shopping-progress">
            <div>
              <span>{{ pick('Einkaufsfortschritt', 'Shopping progress') }}</span>
              <strong>{{ boughtCount }} / {{ finalShoppingItems.length }} · €{{ grandTotal.toFixed(2) }}</strong>
            </div>
            <progress :value="boughtCount" :max="finalShoppingItems.length"></progress>
          </div>
          <label class="toggle-line">
            <input v-model="hideBought" type="checkbox">
            {{ pick('Gekaufte ausblenden', 'Hide bought items') }}
          </label>
        </div>

        <form class="manual-shopping-form" @submit.prevent="addManualShoppingItem">
          <div class="field">
            <label>{{ pick('Extra Item', 'Extra item') }}</label>
            <input v-model="manualItem.name" type="text" :placeholder="pick('z.B. Kohle, Eis, Servietten', 'e.g. charcoal, ice, napkins')">
          </div>
          <div class="field">
            <label>{{ pick('Menge', 'Quantity') }}</label>
            <input v-model="manualItem.quantity" type="text" :placeholder="pick('z.B. 2 Packungen', 'e.g. 2 packages')">
          </div>
          <div class="field">
            <label>{{ pick('Preis optional', 'Price optional') }}</label>
            <input v-model.number="manualItem.cost" type="number" min="0" step="0.01" placeholder="0.00">
          </div>
          <button class="button button-quiet" type="submit">{{ pick('Hinzufügen', 'Add') }}</button>
        </form>

        <div v-if="finalShoppingItems.length && !visibleFinalShoppingGroups.length" class="empty-state">
          {{ pick('Alles gekauft oder ausgeblendet.', 'Everything is bought or hidden.') }}
        </div>
        <div v-if="visibleFinalShoppingGroups.length" class="actual-shopping-list">
          <details
            v-for="[category, items] in visibleFinalShoppingGroups"
            :key="category"
            class="shopping-group"
            :open="!collapsedGroups[category]"
            @toggle="collapsedGroups[category] = !$event.target.open"
          >
            <summary>
              <span>{{ categoryLabel(category, i18n.language) }}</span>
              <small>{{ groupBoughtCount(items) }} / {{ items.length }}</small>
            </summary>
            <label
              v-for="item in items"
              :key="item.key"
              class="actual-shopping-row"
              :class="{ bought: boughtItems[item.key] }"
            >
              <input v-model="boughtItems[item.key]" type="checkbox">
              <span class="actual-shopping-copy">
                <strong>{{ item.name }}</strong>
                <small>{{ categoryLabel(item.category, i18n.language) }} · {{ item.note }}</small>
              </span>
              <span class="actual-shopping-qty">{{ item.quantity }}</span>
              <span class="actual-shopping-price">€{{ item.cost.toFixed(2) }}</span>
              <button
                v-if="item.manual"
                type="button"
                class="inline-danger"
                @click.prevent="removeManualShoppingItem(item.id)"
              >
                {{ pick('Entfernen', 'Remove') }}
              </button>
            </label>
          </details>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, reactive, ref } from 'vue'
import { ratingIsInterested, store } from '../stores/grillStore.js'
import { categoryLabel } from '../constants/products.js'
import { i18n, normalizeProductUrl, pick, t } from '../i18n.js'

const page = ref(1)
const temporaryPackages = computed(() => store.shoppingState.temporaryPackages)
const boughtItems = computed(() => store.shoppingState.boughtItems)
const collapsedGroups = computed(() => store.shoppingState.collapsedGroups)
const shoppingSearch = ref('')
const shoppingSort = ref('name')
const exportMessage = ref('')
const hideBought = computed({
  get: () => store.shoppingState.hideBought,
  set: value => { store.shoppingState.hideBought = value }
})
const manualItems = computed({
  get: () => store.shoppingState.manualItems,
  set: value => { store.shoppingState.manualItems = value }
})
const manualItem = reactive({
  name: '',
  quantity: '',
  cost: 0
})

const calculatedProducts = computed(() => {
  const map = {}
  store.products
    .filter(product => product.cat === 'Fleisch' || product.cat === 'Veggie')
    .forEach(product => {
      map[product.name] = {
        ...product,
        gramm: 0,
        packGrams: Number(product.packGrams) || 100,
        price: Number(product.price) || 0,
        packungen: 0,
        kosten: 0
      }
    })
  store.ratings.forEach(person => {
    store.calcDistribution(person).forEach(item => {
      if (map[item.name]) map[item.name].gramm += item.gramm
    })
  })
  return Object.values(map)
    .map(product => {
      product.packungen = Math.ceil(product.gramm / product.packGrams)
      product.rawPackages = product.gramm / product.packGrams
      product.kosten = product.packungen * product.price
      return product
    })
    .filter(product => product.gramm > 0)
})

const sideStats = computed(() => demandStats('Sides'))
const drinkStats = computed(() => demandStats('Getränke'))
const temporaryItems = computed(() => [...sideStats.value, ...drinkStats.value])
const visibleCalculatedProducts = computed(() => sortItems(filterBySearch(calculatedProducts.value), 'main'))
const visibleSideStats = computed(() => sortItems(filterBySearch(sideStats.value), 'temporary'))
const visibleDrinkStats = computed(() => sortItems(filterBySearch(drinkStats.value), 'temporary'))

const calculatedTotal = computed(() =>
  calculatedProducts.value.reduce((sum, product) => sum + product.kosten, 0)
)
const temporaryTotal = computed(() =>
  temporaryItems.value.reduce((sum, item) =>
    sum + Math.max(0, Number(temporaryPackages.value[item.name]) || 0) * item.price, 0)
)
const manualTotal = computed(() =>
  manualItems.value.reduce((sum, item) => sum + Math.max(0, Number(item.cost) || 0), 0)
)
const grandTotal = computed(() => calculatedTotal.value + temporaryTotal.value + manualTotal.value)
const finalShoppingItems = computed(() => {
  const calculated = calculatedProducts.value.map(product => ({
    key: `calc:${product.name}`,
    name: product.name,
    category: product.cat,
    quantity: `${product.packungen} ${t('packages')}`,
    packages: product.packungen,
    cost: product.kosten,
    note: pick(`${product.gramm} g benötigt`, `${product.gramm} g required`),
    source: pick('berechnet', 'calculated')
  }))
  const temporary = temporaryItems.value
    .map(item => {
      const packages = Math.max(0, Number(temporaryPackages.value[item.name]) || 0)
      return {
        key: `temp:${item.name}`,
        name: item.name,
        category: item.cat,
        quantity: `${packages} ${t('packages')}`,
        packages,
        cost: packages * item.price,
        note: pick(`${item.interested}/${store.ratings.length} interessiert`, `${item.interested}/${store.ratings.length} interested`),
        source: pick('temporär', 'temporary')
      }
    })
    .filter(item => item.packages > 0)
  const manual = manualItems.value.map(item => ({
    ...item,
    key: `manual:${item.id}`,
    category: 'Sonstiges',
    source: pick('manuell', 'manual'),
    note: pick('manuell hinzugefügt', 'manually added'),
    manual: true
  }))
  return [...calculated, ...temporary, ...manual]
})
const visibleFinalShoppingGroups = computed(() => {
  const visible = hideBought.value
    ? finalShoppingItems.value.filter(item => !boughtItems.value[item.key])
    : finalShoppingItems.value
  const groups = visible.reduce((map, item) => {
    if (!map[item.category]) map[item.category] = []
    map[item.category].push(item)
    return map
  }, {})
  return Object.entries(groups)
})
const boughtCount = computed(() =>
  finalShoppingItems.value.filter(item => boughtItems.value[item.key]).length
)
const selectedTemporaryCount = computed(() =>
  temporaryItems.value.filter(item => Number(temporaryPackages.value[item.name]) > 0).length
)
const costPerPerson = computed(() =>
  store.ratings.length ? grandTotal.value / store.ratings.length : 0
)
const shoppingChecks = computed(() => {
  const checks = []
  if (drinkStats.value.length && !drinkStats.value.some(item => Number(temporaryPackages.value[item.name]) > 0)) {
    checks.push(pick('0 Getränke-Packungen gesetzt', '0 drink packages set'))
  }
  const missingPrices = store.products.filter(product => !Number(product.price)).length
  if (missingPrices) checks.push(pick(`${missingPrices} Produkte ohne Preis`, `${missingPrices} products without price`))
  const missingLinks = store.products.filter(product => !product.link).length
  if (missingLinks) checks.push(pick(`${missingLinks} Produkte ohne Link`, `${missingLinks} products without link`))
  if (selectedTemporaryCount.value) checks.push(pick(`${selectedTemporaryCount.value} temporäre Anpassungen`, `${selectedTemporaryCount.value} temporary changes`))
  return checks
})

function demandStats(category) {
  return store.products
    .filter(item => item.cat === category)
    .map(item => {
      const ratings = store.ratings.map(person => Number(person.ratings[item.name]) || 0)
      return {
        ...item,
        price: Number(item.price) || 0,
        interested: ratings.filter(ratingIsInterested).length,
        average: ratings.reduce((sum, rating) => sum + rating, 0) / store.ratings.length
      }
    })
}

function filterBySearch(items) {
  const query = shoppingSearch.value.trim().toLocaleLowerCase('de-DE')
  if (!query) return items
  return items.filter(item => item.name.toLocaleLowerCase('de-DE').includes(query))
}

function sortItems(items, type) {
  return [...items].sort((a, b) => {
    if (shoppingSort.value === 'cost') {
      const aCost = type === 'main' ? a.kosten : (Number(temporaryPackages.value[a.name]) || 0) * a.price
      const bCost = type === 'main' ? b.kosten : (Number(temporaryPackages.value[b.name]) || 0) * b.price
      return bCost - aCost || a.name.localeCompare(b.name)
    }
    if (shoppingSort.value === 'demand') {
      return (b.interested || b.gramm || 0) - (a.interested || a.gramm || 0) || a.name.localeCompare(b.name)
    }
    return a.name.localeCompare(b.name)
  })
}

function categoryGrams(category) {
  return calculatedProducts.value
    .filter(product => product.cat === category)
    .reduce((sum, product) => sum + product.gramm, 0)
}

function productStatus(product) {
  if (!product.price) return pick('Preis fehlt', 'Missing price')
  if (!product.link) return pick('Link fehlt', 'Missing link')
  return pick('Berechnet', 'Calculated')
}

function addManualShoppingItem() {
  const name = manualItem.name.trim()
  if (!name) return
  manualItems.value.push({
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    name,
    quantity: manualItem.quantity.trim() || '1',
    packages: '',
    cost: Math.max(0, Number(manualItem.cost) || 0)
  })
  manualItem.name = ''
  manualItem.quantity = ''
  manualItem.cost = 0
}

function removeManualShoppingItem(id) {
  const item = manualItems.value.find(entry => entry.id === id)
  if (item) delete boughtItems.value[`manual:${item.id}`]
  manualItems.value = manualItems.value.filter(entry => entry.id !== id)
}

function groupBoughtCount(items) {
  return items.filter(item => boughtItems.value[item.key]).length
}

function exportShoppingList() {
  const rows = [
    ['Name', 'Kategorie', 'Packungen', 'Kosten', 'Quelle', 'Notiz', 'Gekauft'],
    ...finalShoppingItems.value.map(item => [
      item.name,
      item.category,
      item.packages,
      item.cost.toFixed(2),
      item.source,
      item.note,
      boughtItems.value[item.key] ? 'ja' : 'nein'
    ])
  ]
  const csv = rows.map(row => row.map(csvCell).join(',')).join('\r\n')
  downloadText(`\uFEFF${csv}`, 'grill-einkaufsliste.csv', 'text/csv;charset=utf-8')
}

async function copyShoppingText() {
  await copyText(shoppingText())
  exportMessage.value = pick('Einkaufsliste als Text kopiert.', 'Shopping list copied as text.')
}

async function shareShoppingText() {
  const text = shoppingText()
  const title = pick('Grill-Einkaufsliste', 'Grill shopping list')
  if (navigator.share) {
    await navigator.share({ title, text })
    exportMessage.value = pick('Einkaufsliste geteilt.', 'Shopping list shared.')
    return
  }
  await copyText(text)
  exportMessage.value = pick(
    'Teilen wird hier nicht unterstützt; Text wurde kopiert.',
    'Sharing is not supported here; text was copied.'
  )
}

function exportShoppingText() {
  downloadText(shoppingText(), 'grill-einkaufsliste.txt', 'text/plain;charset=utf-8')
}

function printShoppingList() {
  window.print()
}

function shoppingText() {
  const title = pick('Grill-Einkaufsliste', 'Grill shopping list')
  const lines = [
    title,
    '='.repeat(title.length),
    pick(`Gesamtkosten: €${grandTotal.value.toFixed(2)}`, `Total cost: €${grandTotal.value.toFixed(2)}`),
    pick(`Personen: ${store.ratings.length}`, `People: ${store.ratings.length}`),
    ''
  ]

  groupedShoppingItems().forEach(([category, items]) => {
    const label = categoryLabel(category, i18n.language)
    lines.push(label)
    lines.push('-'.repeat(label.length))
    items.forEach(item => {
      const checked = boughtItems.value[item.key] ? 'x' : ' '
      lines.push(`[${checked}] ${item.quantity} ${item.name} - €${item.cost.toFixed(2)}`)
      if (item.note) lines.push(`    ${item.note}`)
      if (item.source) lines.push(`    ${item.source}`)
    })
    lines.push('')
  })

  return `${lines.join('\n').trim()}\n`
}

function groupedShoppingItems() {
  const groups = finalShoppingItems.value.reduce((map, item) => {
    if (!map[item.category]) map[item.category] = []
    map[item.category].push(item)
    return map
  }, {})
  return Object.entries(groups)
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function downloadText(text, filename, type) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const QuantityRow = defineComponent({
  props: {
    item: { type: Object, required: true },
    modelValue: { type: Number, default: 0 }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const update = (next) => emit('update:modelValue', Math.max(0, Number(next) || 0))
    return () => h('div', { class: 'drink-check-row' }, [
      h('div', [
        h('strong', props.item.name),
        h('p', `${props.item.interested} / ${store.ratings.length} ${pick('Personen interessiert', 'people interested')} · Ø ${props.item.average.toFixed(1)} ★`),
        h('span', {
          class: ['status-chip', (props.modelValue || 0) ? 'manual' : '']
        }, (props.modelValue || 0) ? pick('Temporär angepasst', 'Temporary override') : pick('Nicht im Einkauf', 'Not in shopping list'))
      ]),
      h('label', [
        h('span', t('packages')),
        h('div', { class: 'quantity-stepper' }, [
          h('button', { type: 'button', onClick: () => update((props.modelValue || 0) - 1) }, '−'),
          h('input', {
            type: 'number',
            min: 0,
            step: 1,
            value: props.modelValue || 0,
            onInput: event => update(event.target.value)
          }),
          h('button', { type: 'button', onClick: () => update((props.modelValue || 0) + 1) }, '+')
        ])
      ]),
      h('div', { class: 'drink-line-price' }, [
        h('span', { class: 'temporary-delta' }, (props.modelValue || 0)
          ? `+${props.modelValue} ${t('packages')} · +€${((props.modelValue || 0) * props.item.price).toFixed(2)}`
          : '+0'),
        h('strong', `€${((props.modelValue || 0) * props.item.price).toFixed(2)}`)
      ])
    ])
  }
})
</script>
