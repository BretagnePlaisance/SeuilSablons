import './style.css'
import Alpine from 'alpinejs'

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

// Exposer window.Alpine AVANT de définir les composants
window.Alpine = Alpine

// Définir le composant et l'exposer à window
window.waterLevelApp = function() {
  return {
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

    init: function() {
      const saved = localStorage.getItem('language')
      if (saved && translations[saved]) {
        this.lang = saved
        this.t = translations[this.lang]
        document.title = this.t.title
      } else {
        document.title = this.t.title
      }

      this.updateDisplay()
      const self = this
      setInterval(function() { self.updateDisplay() }, 30000)
      setInterval(function() {
        self.setLang(self.lang === 'fr' ? 'en' : 'fr')
      }, 7500)
    },

    setLang: function(newLang) {
      if (!translations[newLang]) return
      this.lang = newLang
      this.t = translations[newLang]
      document.title = this.t.title
      localStorage.setItem('language', newLang)

      if (this.value != null) {
        this.formattedLevel = formatLevel(this.value, this.lang)
      }
    },

    fetchData: function() {
      const self = this
      const payload = [
        { hmi_id: 168069, type: 'Float', name: 'NIVEAU_MER' },
        { hmi_id: 168069, type: 'Int', name: 'Jour' },
        { hmi_id: 168069, type: 'Int', name: 'mois' },
        { hmi_id: 168069, type: 'Int', name: 'Annee' },
        { hmi_id: 168069, type: 'Int', name: 'Heure' },
        { hmi_id: 168069, type: 'Int', name: 'Minute' },
      ]

      return fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.json()
      }).then(function(data) {
        const d = data.d || []
        const niveauMer = d.find(function(i) { return i.name === 'NIVEAU_MER' })
        if (!niveauMer) throw new Error('Donnée NIVEAU_MER manquante')
        return parseFloat(niveauMer.values[0].value)
      })
    },

    analyzeTrend: function() {
      if (this.levelHistory.length < this.maxHistoryLength) return 'stable'
      const diff = this.levelHistory[this.levelHistory.length - 1] - this.levelHistory[0]
      if (diff > 0.01) return 'rising'
      if (diff < -0.01) return 'falling'
      return 'stable'
    },

    updateDisplay: function() {
      const self = this
      this.loading = true
      
      this.fetchData().then(function(exact) {
        self.value = parseFloat(exact.toFixed(2))
        self.formattedLevel = formatLevel(self.value, self.lang)
        self.levelHistory.push(exact)
        
        if (self.levelHistory.length > self.maxHistoryLength) {
          self.levelHistory.shift()
        }
        self.trend = self.analyzeTrend()
        self.loading = false
      }).catch(function(e) {
        console.error(e)
        self.formattedLevel = self.t.error
        self.loading = false
      })
    }
  }
}

// Enregistrer le composant
Alpine.data('waterLevelApp', window.waterLevelApp)

// Démarrer Alpine
Alpine.start()