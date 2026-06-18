<template>
  <div>
    <!-- CSV Import -->
    <div class="bg-green-50 border-2 border-green-200 rounded-xl p-5 mb-6">
      <h2 class="text-xl font-bold text-green-600 mb-2">📥 CSV Import</h2>
      <p class="text-sm text-gray-500 mb-3">
        CSV aus Google Forms: erste Spalte = Name, dann pro Produkt eine Spalte mit 0–4.
      </p>
      <input type="file" accept=".csv" @change="importCSV"
        class="w-full border-2 border-dashed border-green-300 rounded-xl p-3 cursor-pointer"/>
      <p v-if="csvMsg" class="mt-2 text-sm font-bold" :class="csvOk ? 'text-green-600' : 'text-red-500'">
        {{ csvMsg }}
      </p>
    </div>

    <!-- Manuell -->
    <div class="bg-gray-50 rounded-xl p-5 mb-6">
      <h2 class="text-xl font-bold text-indigo-600 mb-4">Manuell eintragen</h2>
      <div>
        <label class="block text-sm font-bold text-gray-500 mb-1">Name</label>
        <input v-model="name" placeholder="z.B. Teddy"
          class="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-500 outline-none"/>
      </div>
      <p class="text-sm text-indigo-500 mt-2 mb-4">
        Portion: <strong>{{ store.globalGrams }}g</strong> (global eingestellt)
      </p>

      <p v-if="!store.products.length" class="text-gray-400">Zuerst Produkte im Admin anlegen.</p>

      <div v-for="p in store.products" :key="p.name"
        class="bg-white rounded-xl p-4 mb-3 border-2 transition-all"
        :class="(tempRatings[p.name] || 0) > 0 ? 'border-indigo-400' : 'border-gray-200'">
        <div class="flex justify-between items-center mb-3">
          <div>
            <span class="font-bold text-gray-700">{{ p.name }}</span>
            <span class="text-xs text-gray-400 ml-2">{{ p.cat }}</span>
          </div>
          <span class="text-sm font-bold"
            :class="(tempRatings[p.name] || 0) > 0 ? 'text-indigo-600' : 'text-gray-300'">
            {{ labels[tempRatings[p.name] || 0] }}
          </span>
        </div>
        <div class="flex gap-2">
          <div v-for="s in [0,1,2,3]" :key="s" class="text-center">
            <button @click="tempRatings[p.name] = s"
              :class="(tempRatings[p.name] || 0) === s
                ? s === 0 ? 'bg-red-500 border-red-500 text-white' : 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-gray-200 text-gray-400'"
              class="w-12 h-12 rounded-xl border-2 font-bold text-lg transition-all hover:scale-110">
              {{ s === 0 ? '✕' : '★' }}
            </button>
            <div class="text-xs text-gray-400 mt-1">{{ s }}</div>
          </div>
        </div>
      </div>

      <button @click="submit"
        class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-lg mt-4 transition-all">
        ✅ Bewertung abschicken
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { store } from '../stores/grillStore.js'

const name  = ref('')
const labels = ['gar nicht', 'wenig', 'gerne', 'unbedingt!']
const tempRatings = reactive({})
const csvMsg = ref(''); const csvOk = ref(false)

function submit() {
  if (!name.value.trim()) return alert('Bitte Namen eingeben!')
  if (!store.globalGrams) return alert('Bitte zuerst Gramm pro Person im Admin einstellen!')
  const rObj = {}
  store.products.forEach(p => { rObj[p.name] = tempRatings[p.name] || 0 })
  const existing = store.ratings.findIndex(r => r.name === name.value.trim())
  if (existing >= 0 && !confirm(name.value + ' hat schon abgestimmt. Überschreiben?')) return
  store.addRating({ name: name.value.trim(), grams: store.globalGrams, ratings: rObj })
  name.value = ''
  store.products.forEach(p => { tempRatings[p.name] = 0 })
  alert('✅ Gespeichert!')
}

function importCSV(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const lines = ev.target.result.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      // headers[0] = Name, rest = Produktnamen
      let count = 0
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        const personName = cols[0]
        if (!personName) continue
        const rObj = {}
        headers.slice(1).forEach((h, idx) => {
          rObj[h] = Math.min(3, Math.max(0, parseInt(cols[idx + 1]) || 0))
        })
        store.addRating({ name: personName, grams: store.globalGrams, ratings: rObj })
        count++
      }
      csvMsg.value = `✅ ${count} Personen importiert!`
      csvOk.value = true
    } catch {
      csvMsg.value = '❌ Fehler beim Lesen der CSV-Datei.'
      csvOk.value = false
    }
  }
  reader.readAsText(file)
}
</script>