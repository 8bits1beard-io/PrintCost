/**
 * Application Configuration
 * Contains defaults, constants, and electricity rates by region
 */

const CONFIG = {
  // App info
  APP_NAME: '3DPrintCostCalculator',
  APP_NAME_SHORT: '3DPCC',
  APP_TAGLINE: 'FDM 3D Print Cost Calculator',
  APP_VERSION: '1.0.0',
  APP_AUTHOR: 'Joshua Walderbach',
  APP_LICENSE: 'MIT',
  APP_REPO: 'https://github.com/8bits1beard-io/PrintCost',
  STORAGE_PREFIX: '3dpcc_',

  // Default calculation values
  DEFAULTS: {
    FAILURE_RATE: 0.05,           // 5%
    LABOR_HOURLY_RATE: 0,
    MARKUP_PERCENT: 0,
    FILAMENT_DIAMETER: 1.75,      // mm
    PRINTER_LIFETIME_HOURS: 5000,
    PRINTER_POWER_WATTS: 120,
  },

  // Electricity rates by region (USD per kWh)
  ELECTRICITY_RATES: {
    // North America
    'us-average': { name: 'USA (Average)', rate: 0.18, region: 'North America' },
    'us-nevada': { name: 'USA - Nevada', rate: 0.12, region: 'North America' },
    'us-texas': { name: 'USA - Texas', rate: 0.14, region: 'North America' },
    'us-florida': { name: 'USA - Florida', rate: 0.16, region: 'North America' },
    'us-new-york': { name: 'USA - New York', rate: 0.24, region: 'North America' },
    'us-california': { name: 'USA - California', rate: 0.32, region: 'North America' },
    'us-hawaii': { name: 'USA - Hawaii', rate: 0.40, region: 'North America' },
    'canada': { name: 'Canada', rate: 0.13, region: 'North America' },
    'mexico': { name: 'Mexico', rate: 0.08, region: 'North America' },

    // Europe
    'uk': { name: 'United Kingdom', rate: 0.28, region: 'Europe' },
    'germany': { name: 'Germany', rate: 0.37, region: 'Europe' },
    'france': { name: 'France', rate: 0.23, region: 'Europe' },
    'netherlands': { name: 'Netherlands', rate: 0.29, region: 'Europe' },
    'belgium': { name: 'Belgium', rate: 0.37, region: 'Europe' },
    'spain': { name: 'Spain', rate: 0.21, region: 'Europe' },
    'italy': { name: 'Italy', rate: 0.43, region: 'Europe' },
    'ireland': { name: 'Ireland', rate: 0.45, region: 'Europe' },
    'denmark': { name: 'Denmark', rate: 0.38, region: 'Europe' },
    'sweden': { name: 'Sweden', rate: 0.20, region: 'Europe' },
    'norway': { name: 'Norway', rate: 0.15, region: 'Europe' },
    'finland': { name: 'Finland', rate: 0.18, region: 'Europe' },
    'poland': { name: 'Poland', rate: 0.18, region: 'Europe' },
    'czech': { name: 'Czech Republic', rate: 0.22, region: 'Europe' },
    'austria': { name: 'Austria', rate: 0.26, region: 'Europe' },
    'switzerland': { name: 'Switzerland', rate: 0.21, region: 'Europe' },
    'portugal': { name: 'Portugal', rate: 0.20, region: 'Europe' },
    'greece': { name: 'Greece', rate: 0.19, region: 'Europe' },

    // Asia-Pacific
    'australia': { name: 'Australia', rate: 0.24, region: 'Asia-Pacific' },
    'new-zealand': { name: 'New Zealand', rate: 0.21, region: 'Asia-Pacific' },
    'japan': { name: 'Japan', rate: 0.20, region: 'Asia-Pacific' },
    'south-korea': { name: 'South Korea', rate: 0.11, region: 'Asia-Pacific' },
    'china': { name: 'China', rate: 0.08, region: 'Asia-Pacific' },
    'india': { name: 'India', rate: 0.08, region: 'Asia-Pacific' },
    'singapore': { name: 'Singapore', rate: 0.18, region: 'Asia-Pacific' },
    'hong-kong': { name: 'Hong Kong', rate: 0.15, region: 'Asia-Pacific' },
    'taiwan': { name: 'Taiwan', rate: 0.09, region: 'Asia-Pacific' },
    'philippines': { name: 'Philippines', rate: 0.18, region: 'Asia-Pacific' },
    'thailand': { name: 'Thailand', rate: 0.11, region: 'Asia-Pacific' },
    'malaysia': { name: 'Malaysia', rate: 0.06, region: 'Asia-Pacific' },
    'indonesia': { name: 'Indonesia', rate: 0.08, region: 'Asia-Pacific' },
    'vietnam': { name: 'Vietnam', rate: 0.08, region: 'Asia-Pacific' },

    // South America
    'brazil': { name: 'Brazil', rate: 0.15, region: 'South America' },
    'argentina': { name: 'Argentina', rate: 0.06, region: 'South America' },
    'chile': { name: 'Chile', rate: 0.14, region: 'South America' },
    'colombia': { name: 'Colombia', rate: 0.12, region: 'South America' },

    // Middle East & Africa
    'uae': { name: 'United Arab Emirates', rate: 0.08, region: 'Middle East & Africa' },
    'saudi-arabia': { name: 'Saudi Arabia', rate: 0.05, region: 'Middle East & Africa' },
    'israel': { name: 'Israel', rate: 0.16, region: 'Middle East & Africa' },
    'south-africa': { name: 'South Africa', rate: 0.12, region: 'Middle East & Africa' },

    // Custom
    'custom': { name: 'Custom Rate', rate: 0.15, region: 'Other' },
  },

  // Get electricity rate by location key
  getElectricityRate(locationKey) {
    return this.ELECTRICITY_RATES[locationKey]?.rate || 0.15;
  },

  // Get grouped electricity rates by region
  getElectricityRatesByRegion() {
    const grouped = {};
    for (const [key, data] of Object.entries(this.ELECTRICITY_RATES)) {
      if (!grouped[data.region]) {
        grouped[data.region] = [];
      }
      grouped[data.region].push({ key, ...data });
    }
    return grouped;
  },

  // Filament material defaults (density in g/cm³)
  MATERIALS: {
    'PLA': { density: 1.24, printTemp: { min: 190, max: 220 }, bedTemp: { min: 50, max: 60 } },
    'PLA+': { density: 1.24, printTemp: { min: 200, max: 230 }, bedTemp: { min: 50, max: 60 } },
    'PETG': { density: 1.27, printTemp: { min: 220, max: 250 }, bedTemp: { min: 70, max: 85 } },
    'ABS': { density: 1.04, printTemp: { min: 220, max: 250 }, bedTemp: { min: 90, max: 110 } },
    'ASA': { density: 1.07, printTemp: { min: 230, max: 260 }, bedTemp: { min: 90, max: 110 } },
    'TPU': { density: 1.21, printTemp: { min: 210, max: 230 }, bedTemp: { min: 30, max: 60 } },
    'Nylon': { density: 1.14, printTemp: { min: 240, max: 270 }, bedTemp: { min: 70, max: 90 } },
    'PC': { density: 1.20, printTemp: { min: 260, max: 300 }, bedTemp: { min: 100, max: 120 } },
    'HIPS': { density: 1.04, printTemp: { min: 220, max: 240 }, bedTemp: { min: 90, max: 110 } },
    'PVA': { density: 1.23, printTemp: { min: 180, max: 200 }, bedTemp: { min: 45, max: 60 } },
    'Wood-Fill': { density: 1.15, printTemp: { min: 190, max: 220 }, bedTemp: { min: 50, max: 60 } },
    'Carbon Fiber': { density: 1.30, printTemp: { min: 230, max: 260 }, bedTemp: { min: 70, max: 90 } },
    'Metal-Fill': { density: 3.00, printTemp: { min: 190, max: 220 }, bedTemp: { min: 50, max: 60 } },
  },

  // Printer presets (power in watts, lifetime in hours)
  PRINTER_PRESETS: {
    // Bambu Lab
    'bambu-x1-carbon': {
      name: 'X1 Carbon',
      manufacturer: 'Bambu Lab',
      model: 'X1 Carbon',
      powerConsumption: { printing: 105, idle: 10, heated: 1100 },
      estimatedLifetimeHours: 5000,
      buildVolume: '256 x 256 x 256 mm',
    },
    'bambu-x1e': {
      name: 'X1E',
      manufacturer: 'Bambu Lab',
      model: 'X1E',
      powerConsumption: { printing: 185, idle: 16, heated: 1350 },
      estimatedLifetimeHours: 5000,
      buildVolume: '256 x 256 x 256 mm',
    },
    'bambu-p1s': {
      name: 'P1S',
      manufacturer: 'Bambu Lab',
      model: 'P1S',
      powerConsumption: { printing: 105, idle: 6, heated: 1100 },
      estimatedLifetimeHours: 5000,
      buildVolume: '256 x 256 x 256 mm',
    },
    'bambu-p1p': {
      name: 'P1P',
      manufacturer: 'Bambu Lab',
      model: 'P1P',
      powerConsumption: { printing: 110, idle: 5, heated: 1100 },
      estimatedLifetimeHours: 5000,
      buildVolume: '256 x 256 x 256 mm',
    },
    'bambu-p2s': {
      name: 'P2S',
      manufacturer: 'Bambu Lab',
      model: 'P2S',
      powerConsumption: { printing: 200, idle: 8, heated: 1200 },
      estimatedLifetimeHours: 5000,
      buildVolume: '256 x 256 x 256 mm',
    },
    'bambu-a1': {
      name: 'A1',
      manufacturer: 'Bambu Lab',
      model: 'A1',
      powerConsumption: { printing: 95, idle: 5, heated: 1300 },
      estimatedLifetimeHours: 5000,
      buildVolume: '256 x 256 x 256 mm',
    },
    'bambu-a1-mini': {
      name: 'A1 mini',
      manufacturer: 'Bambu Lab',
      model: 'A1 mini',
      powerConsumption: { printing: 80, idle: 7, heated: 150 },
      estimatedLifetimeHours: 5000,
      buildVolume: '180 x 180 x 180 mm',
    },
    'bambu-h2d': {
      name: 'H2D',
      manufacturer: 'Bambu Lab',
      model: 'H2D',
      powerConsumption: { printing: 197, idle: 26, heated: 1800 },
      estimatedLifetimeHours: 5000,
      buildVolume: '350 x 320 x 325 mm',
    },
    'bambu-h2s': {
      name: 'H2S',
      manufacturer: 'Bambu Lab',
      model: 'H2S',
      powerConsumption: { printing: 197, idle: 26, heated: 1800 },
      estimatedLifetimeHours: 5000,
      buildVolume: '340 x 320 x 340 mm',
    },
    'bambu-h2c': {
      name: 'H2C',
      manufacturer: 'Bambu Lab',
      model: 'H2C',
      powerConsumption: { printing: 197, idle: 26, heated: 1800 },
      estimatedLifetimeHours: 5000,
      buildVolume: '350 x 320 x 325 mm',
    },
    // Prusa
    'prusa-mk4': {
      name: 'MK4',
      manufacturer: 'Prusa',
      model: 'MK4',
      powerConsumption: { printing: 120, idle: 10, heated: 300 },
      estimatedLifetimeHours: 6000,
      buildVolume: '250 x 210 x 220 mm',
    },
    'prusa-mk3s': {
      name: 'MK3S+',
      manufacturer: 'Prusa',
      model: 'MK3S+',
      powerConsumption: { printing: 120, idle: 10, heated: 300 },
      estimatedLifetimeHours: 6000,
      buildVolume: '250 x 210 x 210 mm',
    },
    'prusa-mini': {
      name: 'MINI+',
      manufacturer: 'Prusa',
      model: 'MINI+',
      powerConsumption: { printing: 80, idle: 8, heated: 180 },
      estimatedLifetimeHours: 5000,
      buildVolume: '180 x 180 x 180 mm',
    },
    'prusa-xl': {
      name: 'XL',
      manufacturer: 'Prusa',
      model: 'XL',
      powerConsumption: { printing: 200, idle: 15, heated: 500 },
      estimatedLifetimeHours: 6000,
      buildVolume: '360 x 360 x 360 mm',
    },
    // Creality
    'creality-ender3-v3': {
      name: 'Ender-3 V3',
      manufacturer: 'Creality',
      model: 'Ender-3 V3',
      powerConsumption: { printing: 150, idle: 10, heated: 350 },
      estimatedLifetimeHours: 4000,
      buildVolume: '220 x 220 x 250 mm',
    },
    'creality-ender3-s1': {
      name: 'Ender-3 S1 Pro',
      manufacturer: 'Creality',
      model: 'Ender-3 S1 Pro',
      powerConsumption: { printing: 120, idle: 10, heated: 300 },
      estimatedLifetimeHours: 4000,
      buildVolume: '220 x 220 x 270 mm',
    },
    'creality-k1': {
      name: 'K1',
      manufacturer: 'Creality',
      model: 'K1',
      powerConsumption: { printing: 150, idle: 12, heated: 400 },
      estimatedLifetimeHours: 4000,
      buildVolume: '220 x 220 x 250 mm',
    },
    'creality-k1-max': {
      name: 'K1 Max',
      manufacturer: 'Creality',
      model: 'K1 Max',
      powerConsumption: { printing: 200, idle: 15, heated: 500 },
      estimatedLifetimeHours: 4000,
      buildVolume: '300 x 300 x 300 mm',
    },
    // Anycubic
    'anycubic-kobra2': {
      name: 'Kobra 2',
      manufacturer: 'Anycubic',
      model: 'Kobra 2',
      powerConsumption: { printing: 120, idle: 10, heated: 300 },
      estimatedLifetimeHours: 4000,
      buildVolume: '220 x 220 x 250 mm',
    },
    'anycubic-kobra2-max': {
      name: 'Kobra 2 Max',
      manufacturer: 'Anycubic',
      model: 'Kobra 2 Max',
      powerConsumption: { printing: 200, idle: 15, heated: 500 },
      estimatedLifetimeHours: 4000,
      buildVolume: '420 x 420 x 500 mm',
    },
    // Voron (DIY estimates)
    'voron-0': {
      name: 'Voron 0.2',
      manufacturer: 'Voron',
      model: '0.2',
      powerConsumption: { printing: 100, idle: 10, heated: 200 },
      estimatedLifetimeHours: 5000,
      buildVolume: '120 x 120 x 120 mm',
    },
    'voron-2': {
      name: 'Voron 2.4',
      manufacturer: 'Voron',
      model: '2.4 (350mm)',
      powerConsumption: { printing: 200, idle: 15, heated: 600 },
      estimatedLifetimeHours: 5000,
      buildVolume: '350 x 350 x 340 mm',
    },
    'voron-trident': {
      name: 'Voron Trident',
      manufacturer: 'Voron',
      model: 'Trident (300mm)',
      powerConsumption: { printing: 180, idle: 15, heated: 550 },
      estimatedLifetimeHours: 5000,
      buildVolume: '300 x 300 x 250 mm',
    },
  },

  // Get printer presets grouped by manufacturer
  getPrinterPresetsByManufacturer() {
    const grouped = {};
    for (const [key, data] of Object.entries(this.PRINTER_PRESETS)) {
      if (!grouped[data.manufacturer]) {
        grouped[data.manufacturer] = [];
      }
      grouped[data.manufacturer].push({ key, ...data });
    }
    return grouped;
  },

  // Consumable type definitions with default lifetimes
  CONSUMABLE_TYPES: {
    'nozzle-brass': { name: 'Brass Nozzle', defaultLifetimeHours: 400, defaultPrice: 3 },
    'nozzle-steel': { name: 'Hardened Steel Nozzle', defaultLifetimeHours: 1500, defaultPrice: 25 },
    'nozzle-ruby': { name: 'Ruby Nozzle', defaultLifetimeHours: 3000, defaultPrice: 90 },
    'bed-pei': { name: 'PEI Sheet', defaultLifetimeHours: 2000, defaultPrice: 25 },
    'bed-glass': { name: 'Glass Bed', defaultLifetimeHours: 3000, defaultPrice: 30 },
    'bed-magnetic': { name: 'Magnetic Flex Plate', defaultLifetimeHours: 2500, defaultPrice: 40 },
    'tube-ptfe': { name: 'PTFE Bowden Tube', defaultLifetimeHours: 500, defaultPrice: 8 },
    'tube-capricorn': { name: 'Capricorn Tube', defaultLifetimeHours: 800, defaultPrice: 15 },
    'gear-extruder': { name: 'Extruder Gear', defaultLifetimeHours: 3000, defaultPrice: 12 },
    'belt': { name: 'Timing Belt', defaultLifetimeHours: 5000, defaultPrice: 15 },
    'bearing': { name: 'Linear Bearing', defaultLifetimeHours: 4000, defaultPrice: 8 },
    'heater': { name: 'Heater Cartridge', defaultLifetimeHours: 3000, defaultPrice: 10 },
    'thermistor': { name: 'Thermistor', defaultLifetimeHours: 3000, defaultPrice: 5 },
    'heatbreak': { name: 'Heat Break', defaultLifetimeHours: 2000, defaultPrice: 15 },
    'other': { name: 'Other', defaultLifetimeHours: 1000, defaultPrice: 10 },
  },

  // Chart colors
  CHART_COLORS: {
    filament: '#ef4444',      // Red
    electricity: '#3b82f6',   // Blue
    depreciation: '#f59e0b',  // Amber
    consumables: '#14b8a6',   // Teal
    labor: '#8b5cf6',         // Purple
    failureBuffer: '#f97316', // Orange
    markup: '#ec4899',        // Pink
  },

  // Currency formatting
  CURRENCY: {
    symbol: '$',
    code: 'USD',
    decimals: 2,
  },

  // Format currency value
  formatCurrency(value) {
    return `${this.CURRENCY.symbol}${value.toFixed(this.CURRENCY.decimals)}`;
  },

  // Format time in hours and minutes
  formatTime(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  },

  // Format weight
  formatWeight(grams) {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(2)}kg`;
    }
    return `${grams.toFixed(1)}g`;
  },
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.DEFAULTS);
Object.freeze(CONFIG.MATERIALS);
Object.freeze(CONFIG.CONSUMABLE_TYPES);
Object.freeze(CONFIG.CHART_COLORS);
Object.freeze(CONFIG.CURRENCY);
