/**
 * Storage Manager
 * Handles localStorage operations and JSON import/export
 */

class StorageManager {
  constructor(prefix = CONFIG.STORAGE_PREFIX) {
    this.prefix = prefix;
    this.keys = {
      printers: 'printers',
      filaments: 'filaments',
      consumables: 'consumables',
      printHistory: 'printHistory',
      settings: 'settings',
    };
  }

  // ============================================================
  // Core Storage Methods
  // ============================================================

  /**
   * Get data from localStorage
   * @param {string} key - Storage key
   * @returns {*} Parsed data or null
   */
  get(key) {
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Error reading from localStorage [${key}]:`, e);
      return null;
    }
  }

  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {*} value - Data to save
   * @returns {boolean} Success status
   */
  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error writing to localStorage [${key}]:`, e);
      return false;
    }
  }

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (e) {
      console.error(`Error removing from localStorage [${key}]:`, e);
      return false;
    }
  }

  /**
   * Clear all app data from localStorage
   */
  clearAll() {
    Object.values(this.keys).forEach(key => {
      this.remove(key);
    });
  }

  // ============================================================
  // Printers
  // ============================================================

  getPrinters() {
    const data = this.get(this.keys.printers) || [];
    return data.map(p => Printer.fromJSON(p));
  }

  savePrinters(printers) {
    const data = printers.map(p => p.toJSON ? p.toJSON() : p);
    return this.set(this.keys.printers, data);
  }

  getPrinter(id) {
    const printers = this.getPrinters();
    return printers.find(p => p.id === id) || null;
  }

  savePrinter(printer) {
    const printers = this.getPrinters();
    const index = printers.findIndex(p => p.id === printer.id);

    if (index > -1) {
      printers[index] = printer;
    } else {
      printers.push(printer);
    }

    return this.savePrinters(printers);
  }

  deletePrinter(id) {
    const printers = this.getPrinters().filter(p => p.id !== id);
    return this.savePrinters(printers);
  }

  // ============================================================
  // Filaments
  // ============================================================

  getFilaments() {
    const data = this.get(this.keys.filaments) || [];
    return data.map(f => Filament.fromJSON(f));
  }

  saveFilaments(filaments) {
    const data = filaments.map(f => f.toJSON ? f.toJSON() : f);
    return this.set(this.keys.filaments, data);
  }

  getFilament(id) {
    const filaments = this.getFilaments();
    return filaments.find(f => f.id === id) || null;
  }

  saveFilament(filament) {
    const filaments = this.getFilaments();
    const index = filaments.findIndex(f => f.id === filament.id);

    if (index > -1) {
      filaments[index] = filament;
    } else {
      filaments.push(filament);
    }

    return this.saveFilaments(filaments);
  }

  deleteFilament(id) {
    const filaments = this.getFilaments().filter(f => f.id !== id);
    return this.saveFilaments(filaments);
  }

  // ============================================================
  // Consumables
  // ============================================================

  getConsumables() {
    const data = this.get(this.keys.consumables) || [];
    return data.map(c => Consumable.fromJSON(c));
  }

  saveConsumables(consumables) {
    const data = consumables.map(c => c.toJSON ? c.toJSON() : c);
    return this.set(this.keys.consumables, data);
  }

  getConsumable(id) {
    const consumables = this.getConsumables();
    return consumables.find(c => c.id === id) || null;
  }

  saveConsumable(consumable) {
    const consumables = this.getConsumables();
    const index = consumables.findIndex(c => c.id === consumable.id);

    if (index > -1) {
      consumables[index] = consumable;
    } else {
      consumables.push(consumable);
    }

    return this.saveConsumables(consumables);
  }

  deleteConsumable(id) {
    const consumables = this.getConsumables().filter(c => c.id !== id);
    return this.saveConsumables(consumables);
  }

  getConsumablesForPrinter(printerId) {
    return this.getConsumables().filter(c => c.printerId === printerId);
  }

  // ============================================================
  // Print History
  // ============================================================

  getPrintHistory() {
    const data = this.get(this.keys.printHistory) || [];
    return data.map(p => PrintJob.fromJSON(p));
  }

  savePrintHistory(history) {
    const data = history.map(p => p.toJSON ? p.toJSON() : p);
    return this.set(this.keys.printHistory, data);
  }

  getPrintJob(id) {
    const history = this.getPrintHistory();
    return history.find(p => p.id === id) || null;
  }

  savePrintJob(printJob) {
    const history = this.getPrintHistory();
    const index = history.findIndex(p => p.id === printJob.id);

    if (index > -1) {
      history[index] = printJob;
    } else {
      // Add to beginning (newest first)
      history.unshift(printJob);
    }

    return this.savePrintHistory(history);
  }

  deletePrintJob(id) {
    const history = this.getPrintHistory().filter(p => p.id !== id);
    return this.savePrintHistory(history);
  }

  // ============================================================
  // Settings
  // ============================================================

  getSettings() {
    return this.get(this.keys.settings) || {
      location: null,
      electricityRate: 0.15,
      currency: 'USD',
      defaultFailureRate: CONFIG.DEFAULTS.FAILURE_RATE,
      theme: 'light',
      firstLaunch: true,
    };
  }

  saveSettings(settings) {
    return this.set(this.keys.settings, settings);
  }

  getSetting(key) {
    const settings = this.getSettings();
    return settings[key];
  }

  saveSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    return this.saveSettings(settings);
  }

  // ============================================================
  // Import / Export
  // ============================================================

  /**
   * Export all data as JSON string
   * @returns {string} JSON string
   */
  exportAll() {
    const data = {
      version: CONFIG.APP_VERSION,
      exportDate: new Date().toISOString(),
      printers: this.get(this.keys.printers) || [],
      filaments: this.get(this.keys.filaments) || [],
      consumables: this.get(this.keys.consumables) || [],
      printHistory: this.get(this.keys.printHistory) || [],
      settings: this.get(this.keys.settings) || {},
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON string
   * @param {string} jsonString - JSON data
   * @param {Object} options - Import options
   * @param {boolean} options.merge - Merge with existing data (default: replace)
   * @returns {Object} Result { success, error?, stats }
   */
  importAll(jsonString, options = { merge: false }) {
    try {
      const data = JSON.parse(jsonString);

      // Validate structure
      if (!data.version) {
        throw new Error('Invalid export file format: missing version');
      }

      const stats = {
        printers: 0,
        filaments: 0,
        consumables: 0,
        printHistory: 0,
      };

      if (options.merge) {
        // Merge with existing data
        if (data.printers) {
          const existing = this.get(this.keys.printers) || [];
          const merged = this._mergeArraysById(existing, data.printers);
          this.set(this.keys.printers, merged);
          stats.printers = data.printers.length;
        }

        if (data.filaments) {
          const existing = this.get(this.keys.filaments) || [];
          const merged = this._mergeArraysById(existing, data.filaments);
          this.set(this.keys.filaments, merged);
          stats.filaments = data.filaments.length;
        }

        if (data.consumables) {
          const existing = this.get(this.keys.consumables) || [];
          const merged = this._mergeArraysById(existing, data.consumables);
          this.set(this.keys.consumables, merged);
          stats.consumables = data.consumables.length;
        }

        if (data.printHistory) {
          const existing = this.get(this.keys.printHistory) || [];
          const merged = this._mergeArraysById(existing, data.printHistory);
          this.set(this.keys.printHistory, merged);
          stats.printHistory = data.printHistory.length;
        }
      } else {
        // Replace all data
        if (data.printers) {
          this.set(this.keys.printers, data.printers);
          stats.printers = data.printers.length;
        }

        if (data.filaments) {
          this.set(this.keys.filaments, data.filaments);
          stats.filaments = data.filaments.length;
        }

        if (data.consumables) {
          this.set(this.keys.consumables, data.consumables);
          stats.consumables = data.consumables.length;
        }

        if (data.printHistory) {
          this.set(this.keys.printHistory, data.printHistory);
          stats.printHistory = data.printHistory.length;
        }

        if (data.settings) {
          this.set(this.keys.settings, data.settings);
        }
      }

      return { success: true, stats };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Merge two arrays by ID (imported items override existing)
   * @private
   */
  _mergeArraysById(existing, imported) {
    const map = new Map();

    // Add existing items
    existing.forEach(item => map.set(item.id, item));

    // Override/add imported items
    imported.forEach(item => map.set(item.id, item));

    return Array.from(map.values());
  }

  /**
   * Download data as JSON file
   * @param {string} filename - Filename (default: auto-generated)
   */
  downloadExport(filename = null) {
    const data = this.exportAll();
    const date = new Date().toISOString().split('T')[0];
    const defaultFilename = `printcost-backup-${date}.json`;

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ============================================================
  // Statistics
  // ============================================================

  /**
   * Get summary statistics
   * @returns {Object} Stats object
   */
  getStats() {
    const history = this.getPrintHistory();
    const completedPrints = history.filter(p => p.status === 'completed');
    const failedPrints = history.filter(p => p.status === 'failed');

    const totalCost = history.reduce((sum, p) => sum + (p.costs?.total || 0), 0);
    const totalFilament = history.reduce((sum, p) => sum + (p.filamentUsedGrams || 0), 0);
    const totalTime = history.reduce((sum, p) => sum + (p.printTimeMinutes || 0), 0);

    return {
      totalPrints: history.length,
      completedPrints: completedPrints.length,
      failedPrints: failedPrints.length,
      successRate: history.length > 0
        ? (completedPrints.length / history.length) * 100
        : 0,
      totalCost,
      totalFilament,
      totalTime,
      averageCost: history.length > 0 ? totalCost / history.length : 0,
      printerCount: this.getPrinters().length,
      filamentCount: this.getFilaments().length,
      consumableCount: this.getConsumables().length,
    };
  }

  /**
   * Check if this is first launch
   * @returns {boolean}
   */
  isFirstLaunch() {
    const settings = this.getSettings();
    return settings.firstLaunch !== false;
  }

  /**
   * Mark first launch as complete
   */
  completeFirstLaunch() {
    this.saveSetting('firstLaunch', false);
  }
}

// Create singleton instance
const storage = new StorageManager();
