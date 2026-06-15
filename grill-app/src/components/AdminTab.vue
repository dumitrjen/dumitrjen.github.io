<template>
  <div>
    <!-- Global Portion -->
    <div class="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-5 mb-6">
      <h2 class="text-xl font-bold text-indigo-600 mb-3">⚖️ Portion für alle</h2>
      <div class="flex gap-3 items-end">
        <div class="flex-1">
          <label class="block text-sm font-bold text-gray-500 mb-1">Gramm pro Person (gilt für alle)</label>
          <input v-model.number="store.globalGrams" type="number" min="0" placeholder="z.B. 400"
            class="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none"/>
        </div>
        <div class="text-indigo-400 text-sm pb-3">
          {{ store.globalGrams ? store.globalGrams + 'g pro Person' : 'Noch nicht gesetzt' }}
        </div>
      </div>
    </div>

    <!-- Produkte CSV Import -->
    <div class="bg-green-50 border-2 border-green-200 rounded-xl p-5 mb-6">
    <h2 class="text-xl font-bold text-green-600 mb-2">📥 Produkte aus CSV importieren</h2>
    <p class="text-sm text-gray-500 mb-3">
        Format: <code class="bg-gray-100 px-1 rounded">Name,Kategorie,Preis</code> — erste Zeile = Header
    </p>
    <input type="file" accept=".csv" @change="importProducts"
        class="w-full border-2 border-dashed border-green-300 rounded-xl p-3 cursor-pointer bg-white"/>
    <p v-if="csvMsg" class="mt-2 text-sm font-bold" :class="csvOk ? 'text-green-600' : 'text-red-500'">
        {{ csvMsg }}
    </p>
    </div>

    <!-- Produkt hinzufügen -->
    <div class="bg-gray-50 rounded-xl p-5 mb-6">
      <h2 class="text-xl font-bold text-indigo-600 mb-4">Produkt hinzufügen</h2>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-bold text-gray-500 mb-1">Name</label>
          <input v-model="form.name" placeholder="z.B. Bratwurst"
            class="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none"/>
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-500 mb-1">Kategorie</label>
          <input v-model="form.cat" placeholder="z.B. Fleisch"
            class="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none"/>
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-500 mb-1">Preis (€)</label>
          <input v-model.number="form.price" type="number" step="0.01" min="0" placeholder="4.99"
            class="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none"/>
        </div>
      </div>
      <button @click="addProduct"
        class="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all">
        + Produkt hinzufügen
      </button>
    </div>

    <!-- Produktliste -->
    <div class="bg-gray-50 rounded-xl p-5 mb-6">
      <h2 class="text-xl font-bold text-indigo-600 mb-4">
        Produkte
        <span class="bg-indigo-600 text-white text-sm px-3 py-1 rounded-full ml-2">{{ store.products.length }}</span>
      </h2>
      <p v-if="!store.products.length" class="text-gray-400">Noch keine Produkte angelegt.</p>
      <div v-for="(p, i) in store.products" :key="i"
        class="bg-white border-l-4 border-indigo-500 rounded-xl p-4 mb-3 flex justify-between items-center">
        <div>
          <span class="font-bold text-gray-700">{{ p.name }}</span>
          <span class="bg-indigo-100 text-indigo-600 text-xs px-2 py-1 rounded-full ml-2">{{ p.cat || 'keine Kat.' }}</span>
          <p class="text-sm text-gray-400 mt-1">€{{ Number(p.price).toFixed(2) }}</p>
        </div>
        <button @click="store.deleteProduct(i)"
          class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold">✕</button>
      </div>
    </div>

    <!-- Reset -->
    <div class="bg-gray-50 rounded-xl p-5">
      <h2 class="text-xl font-bold text-indigo-600 mb-4">Zurücksetzen</h2>
      <div class="grid grid-cols-2 gap-3">
        <button @click="resetRatings"
          class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl">
          Nur Bewertungen löschen
        </button>
        <button @click="resetAll"
          class="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl">
          Alles löschen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { store } from '../stores/grillStore.js'
const csvMsg = ref('')
const csvOk  = ref(false)

function importProducts(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const lines = ev.target.result.trim().split('\n')
      let count = 0
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        if (!cols[0]) continue
        store.addProduct({
          name:  cols[0],
          cat:   cols[1] || '',
          price: Number(cols[2]?.replace(',', '.')) || 0
        })
        count++
      }
      csvMsg.value = `✅ ${count} Produkte importiert!`
      csvOk.value = true
    } catch {
      csvMsg.value = '❌ Fehler beim Lesen der CSV!'
      csvOk.value = false
    }
  }
  reader.readAsText(file)
}


const form = reactive({ name: '', cat: '', price: 0 })

function addProduct() {
  if (!form.name.trim()) return alert('Bitte Produktname eingeben!')
  store.addProduct({ 
    name: form.name.trim(), 
    cat: form.cat.trim(), 
    price: Number(form.price) || 0  // fix: immer Number
  })
  form.name = ''; form.cat = ''; form.price = 0
}

function resetRatings() {
  if (confirm('Alle Bewertungen löschen?')) store.resetRatings()
}
function resetAll() {
  if (confirm('Wirklich alles löschen?')) store.resetAll()
}
</script>