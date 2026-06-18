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

      <template v-if="page === 1">
        <div v-if="!calculatedProducts.length" class="empty-state">{{ pick('Noch keine berechneten Hauptprodukte.', 'No calculated main products yet.') }}</div>

        <div v-for="p in calculatedProducts" :key="p.name" class="shopping-card">
          <div class="shopping-row">
            <div>
              <strong class="shopping-name">{{ p.name }}</strong>
              <span class="category-tag">{{ categoryLabel(p.cat, i18n.language) }}</span>
              <a v-if="p.link" class="product-link" :href="normalizeProductUrl(p.link)" target="_blank" rel="noopener noreferrer">{{ t('openLink') }}</a>
              <p class="item-meta">{{ pick(`${p.gramm} g benötigt · ${p.packGrams} g je Packung`, `${p.gramm} g required · ${p.packGrams} g per package`) }}</p>
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
              v-for="item in sideStats"
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
              v-for="item in drinkStats"
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
                `Berechnet €${calculatedTotal.toFixed(2)} + temporär €${temporaryTotal.toFixed(2)}`,
                `Calculated €${calculatedTotal.toFixed(2)} + temporary €${temporaryTotal.toFixed(2)}`
              ) }}
            </span>
          </div>
          <div class="price">€{{ grandTotal.toFixed(2) }}</div>
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
const temporaryPackages = reactive({})

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
      product.kosten = product.packungen * product.price
      return product
    })
    .filter(product => product.gramm > 0)
})

const sideStats = computed(() => demandStats('Sides'))
const drinkStats = computed(() => demandStats('Getränke'))
const temporaryItems = computed(() => [...sideStats.value, ...drinkStats.value])

const calculatedTotal = computed(() =>
  calculatedProducts.value.reduce((sum, product) => sum + product.kosten, 0)
)
const temporaryTotal = computed(() =>
  temporaryItems.value.reduce((sum, item) =>
    sum + Math.max(0, Number(temporaryPackages[item.name]) || 0) * item.price, 0)
)
const grandTotal = computed(() => calculatedTotal.value + temporaryTotal.value)

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

const QuantityRow = defineComponent({
  props: {
    item: { type: Object, required: true },
    modelValue: { type: Number, default: 0 }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', { class: 'drink-check-row' }, [
      h('div', [
        h('strong', props.item.name),
        h('p', `${props.item.interested} / ${store.ratings.length} ${pick('Personen interessiert', 'people interested')} · Ø ${props.item.average.toFixed(1)} ★`)
      ]),
      h('label', [
        h('span', t('packages')),
        h('input', {
          type: 'number',
          min: 0,
          step: 1,
          value: props.modelValue || 0,
          onInput: event => emit('update:modelValue', Math.max(0, Number(event.target.value) || 0))
        })
      ]),
      h('div', { class: 'drink-line-price' }, `€${((props.modelValue || 0) * props.item.price).toFixed(2)}`)
    ])
  }
})
</script>
