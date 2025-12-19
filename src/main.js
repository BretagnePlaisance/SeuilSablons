import './style.css'
import Alpine from 'alpinejs'

window.Alpine = Alpine

const API_URL =
  'https://www.weincloud.net/dashboard/api/v2/published-dashboard/dc0b7a15-e32e-4dee-b193-8247579b656f/addresstag/get/value'

const translations = {
  fr: {
    title: "Niveau d'Eau - Port des Sablons",
    waterLevelLabel: "Hauteur d'eau au dessus du seuil",
    unit: 'mètres',
    error: 'ERREUR',
  },
  en: {
    title: 'Water Level - Port des Sablons',
    waterLevelLabel: 'Water level on the sill',
    unit: 'meters',
    error: 'ERROR',
  },
}

function formatLevel(value, lang) {
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US'
  return value.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

Alpine.data('waterLevelApp', () => ({
  lang: 'fr',
  t: translations.fr,
  value: null,
  formattedLevel: '--,--',
  loading: false,
  levelHistory: [],
  maxHistoryLength: 20,
  trend: 'stable',

  get trendReady() {
    return this.levelHistory.length >= this.maxHistoryLength
  },

  init() {
    // langue sauvegardée
    const saved = localStorage.getItem('language')
    if (saved && translations[saved]) {
      this.lang = saved
      this.t = translations[this.lang]
      document.title = this.t.title
    } else {
      document.title = this.t.title
    }

    // fetch initial
    this.updateDisplay()
    setInterval(() => this.updateDisplay(), 30000)

    // switch auto
    setInterval(() => {
      this.setLang(this.lang === 'fr' ? 'en' : 'fr')
    }, 7500)
  },

  setLang(newLang) {
    if (!translations[newLang]) return
    this.lang = newLang
    this.t = translations[newLang]
    document.title = this.t.title
    localStorage.setItem('language', this.lang)

    if (this.value != null) {
      this.formattedLevel = formatLevel(this.value, this.lang)
    }
  },

  async fetchData() {
    const payload = [
      { hmi_id: 168069, type: 'Float', name: 'NIVEAU_MER' },
      { hmi_id: 168069, type: 'Int', name: 'Jour' },
      { hmi_id: 168069, type: 'Int', name: 'mois' },
      { hmi_id: 168069, type: 'Int', name: 'Annee' },
      { hmi_id: 168069, type: 'Int', name: 'Heure' },
      { hmi_id: 168069, type: 'Int', name: 'Minute' },
    ]

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    const d = data.d || []

    const niveauMer = d.find((i) => i.name === 'NIVEAU_MER')
    if (!niveauMer) throw new Error('Donnée NIVEAU_MER manquante')

    return parseFloat(niveauMer.values[0].value)
  },

  analyzeTrend() {
    if (this.levelHistory.length < this.maxHistoryLength) return 'stable'
    const diff =
      this.levelHistory[this.levelHistory.length - 1] - this.levelHistory[0]
    if (diff > 0.01) return 'rising'
    if (diff < -0.01) return 'falling'
    return 'stable'
  },

  async updateDisplay() {
    this.loading = true
    try {
      const exact = await this.fetchData()
      this.value = parseFloat(exact.toFixed(2))
      this.formattedLevel = formatLevel(this.value, this.lang)

      this.levelHistory.push(exact)
      if (this.levelHistory.length > this.maxHistoryLength) {
        this.levelHistory.shift()
      }
      this.trend = this.analyzeTrend()
    } catch (e) {
      console.error(e)
      this.formattedLevel = this.t.error
    } finally {
      this.loading = false
    }
  },
}))

Alpine.start()