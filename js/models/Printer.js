/**
 * Printer Model
 * Represents a 3D printer profile with power consumption and depreciation settings
 */

class Printer {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name || '';
    this.manufacturer = data.manufacturer || '';
    this.model = data.model || '';

    // Power consumption in watts
    this.powerConsumption = {
      printing: data.powerConsumption?.printing ?? CONFIG.DEFAULTS.PRINTER_POWER_WATTS,
      idle: data.powerConsumption?.idle ?? 10,
      heated: data.powerConsumption?.heated ?? 200,
    };

    // Depreciation settings
    this.purchasePrice = data.purchasePrice ?? 0;
    this.estimatedLifetimeHours = data.estimatedLifetimeHours ?? CONFIG.DEFAULTS.PRINTER_LIFETIME_HOURS;
    this.currentHours = data.currentHours ?? 0;

    // Default failure rate for this printer
    this.defaultFailureRate = data.defaultFailureRate ?? CONFIG.DEFAULTS.FAILURE_RATE;

    // Build volume (for reference)
    this.buildVolume = {
      x: data.buildVolume?.x ?? 220,
      y: data.buildVolume?.y ?? 220,
      z: data.buildVolume?.z ?? 250,
    };

    // Associated consumable IDs
    this.consumableIds = data.consumableIds || [];

    // AMS settings (optional)
    this.hasAms = data.hasAms ?? false;
    this.ams = data.ams ? {
      type: data.ams.type || '',
      name: data.ams.name || '',
      powerConsumption: {
        standby: data.ams.powerConsumption?.standby ?? 0,
        working: data.ams.powerConsumption?.working ?? 0,
      },
      purchasePrice: data.ams.purchasePrice ?? 0,
      estimatedLifetimeHours: data.ams.estimatedLifetimeHours ?? 5000,
      currentHours: data.ams.currentHours ?? 0,
    } : null;

    // Metadata
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Calculate depreciation cost per hour
   * @returns {number} Cost per hour in currency
   */
  getDepreciationPerHour() {
    if (this.estimatedLifetimeHours <= 0) return 0;
    return this.purchasePrice / this.estimatedLifetimeHours;
  }

  /**
   * Calculate depreciation cost for a given print time
   * @param {number} printTimeMinutes - Print time in minutes
   * @returns {number} Depreciation cost
   */
  getDepreciationCost(printTimeMinutes) {
    const hours = printTimeMinutes / 60;
    return this.getDepreciationPerHour() * hours;
  }

  /**
   * Calculate electricity cost for a given print time (includes AMS if attached)
   * @param {number} printTimeMinutes - Print time in minutes
   * @param {number} electricityRate - Cost per kWh
   * @returns {number} Electricity cost
   */
  getElectricityCost(printTimeMinutes, electricityRate) {
    const hours = printTimeMinutes / 60;
    let totalWatts = this.powerConsumption.printing;

    // Add AMS power consumption if attached
    if (this.hasAms && this.ams) {
      totalWatts += this.ams.powerConsumption.working;
    }

    const kWh = (totalWatts / 1000) * hours;
    return kWh * electricityRate;
  }

  /**
   * Get AMS depreciation cost per hour
   * @returns {number} Cost per hour in currency
   */
  getAmsDepreciationPerHour() {
    if (!this.hasAms || !this.ams || this.ams.estimatedLifetimeHours <= 0) return 0;
    return this.ams.purchasePrice / this.ams.estimatedLifetimeHours;
  }

  /**
   * Calculate AMS depreciation cost for a given print time
   * @param {number} printTimeMinutes - Print time in minutes
   * @returns {number} AMS depreciation cost
   */
  getAmsDepreciationCost(printTimeMinutes) {
    const hours = printTimeMinutes / 60;
    return this.getAmsDepreciationPerHour() * hours;
  }

  /**
   * Get total depreciation cost (printer + AMS) for a given print time
   * @param {number} printTimeMinutes - Print time in minutes
   * @returns {number} Total depreciation cost
   */
  getTotalDepreciationCost(printTimeMinutes) {
    return this.getDepreciationCost(printTimeMinutes) + this.getAmsDepreciationCost(printTimeMinutes);
  }

  /**
   * Get remaining lifetime in hours
   * @returns {number} Remaining hours
   */
  getRemainingLifetime() {
    return Math.max(0, this.estimatedLifetimeHours - this.currentHours);
  }

  /**
   * Get lifetime usage percentage
   * @returns {number} Percentage (0-100)
   */
  getLifetimePercentage() {
    if (this.estimatedLifetimeHours <= 0) return 0;
    return Math.min(100, (this.currentHours / this.estimatedLifetimeHours) * 100);
  }

  /**
   * Add print time to current hours
   * @param {number} minutes - Print time in minutes
   */
  addPrintTime(minutes) {
    this.currentHours += minutes / 60;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get display name (manufacturer + name or just name)
   * @returns {string} Display name
   */
  getDisplayName() {
    if (this.manufacturer && this.name) {
      return `${this.manufacturer} ${this.name}`;
    }
    return this.name || 'Unnamed Printer';
  }

  /**
   * Get build volume as formatted string
   * @returns {string} Formatted build volume
   */
  getBuildVolumeString() {
    return `${this.buildVolume.x} × ${this.buildVolume.y} × ${this.buildVolume.z} mm`;
  }

  /**
   * Link a consumable to this printer
   * @param {string} consumableId - Consumable ID to link
   */
  linkConsumable(consumableId) {
    if (!this.consumableIds.includes(consumableId)) {
      this.consumableIds.push(consumableId);
      this.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Unlink a consumable from this printer
   * @param {string} consumableId - Consumable ID to unlink
   */
  unlinkConsumable(consumableId) {
    const index = this.consumableIds.indexOf(consumableId);
    if (index > -1) {
      this.consumableIds.splice(index, 1);
      this.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Convert to plain object for storage
   * @returns {Object} Plain object
   */
  toJSON() {
    const json = {
      id: this.id,
      name: this.name,
      manufacturer: this.manufacturer,
      model: this.model,
      powerConsumption: { ...this.powerConsumption },
      purchasePrice: this.purchasePrice,
      estimatedLifetimeHours: this.estimatedLifetimeHours,
      currentHours: this.currentHours,
      defaultFailureRate: this.defaultFailureRate,
      buildVolume: { ...this.buildVolume },
      consumableIds: [...this.consumableIds],
      hasAms: this.hasAms,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    if (this.ams) {
      json.ams = {
        type: this.ams.type,
        name: this.ams.name,
        powerConsumption: { ...this.ams.powerConsumption },
        purchasePrice: this.ams.purchasePrice,
        estimatedLifetimeHours: this.ams.estimatedLifetimeHours,
        currentHours: this.ams.currentHours,
      };
    }

    return json;
  }

  /**
   * Create Printer from plain object
   * @param {Object} data - Plain object
   * @returns {Printer} Printer instance
   */
  static fromJSON(data) {
    return new Printer(data);
  }
}
