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
   * Calculate electricity cost for a given print time
   * @param {number} printTimeMinutes - Print time in minutes
   * @param {number} electricityRate - Cost per kWh
   * @returns {number} Electricity cost
   */
  getElectricityCost(printTimeMinutes, electricityRate) {
    const hours = printTimeMinutes / 60;
    const kWh = (this.powerConsumption.printing / 1000) * hours;
    return kWh * electricityRate;
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
    return {
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
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
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
