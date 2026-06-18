export function parseCSV(text) {
  const source = String(text || '').replace(/^\uFEFF/, '')
  const delimiter = detectDelimiter(source)
  const rows = []
  let row = []
  let value = ''
  let quoted = false

  for (let i = 0; i < source.length; i++) {
    const char = source[i]

    if (char === '"') {
      if (quoted && source[i + 1] === '"') {
        value += '"'
        i++
      } else {
        quoted = !quoted
      }
    } else if (char === delimiter && !quoted) {
      row.push(value.trim())
      value = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i++
      row.push(value.trim())
      if (row.some(cell => cell !== '')) rows.push(row)
      row = []
      value = ''
    } else {
      value += char
    }
  }

  row.push(value.trim())
  if (row.some(cell => cell !== '')) rows.push(row)
  return rows
}

export function normalizeHeader(value) {
  return String(value || '').trim().toLocaleLowerCase('de-DE')
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || ''
  let commas = 0
  let semicolons = 0
  let quoted = false

  for (const char of firstLine) {
    if (char === '"') quoted = !quoted
    if (!quoted && char === ',') commas++
    if (!quoted && char === ';') semicolons++
  }

  return semicolons > commas ? ';' : ','
}
