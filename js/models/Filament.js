/**
 * Filament Model
 * Represents a filament profile with material properties and pricing
 */

class Filament {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name || '';
    this.manufacturer = data.manufacturer || '';
    this.material = data.material || 'PLA';
    this.color = data.color || '';
    this.colorHex = data.colorHex || '#808080';

    // Physical properties
    this.diameter = data.diameter ?? CONFIG.DEFAULTS.FILAMENT_DIAMETER;
    this.density = data.density ?? this._getDefaultDensity();

    // Pricing
    this.spoolWeight = data.spoolWeight ?? 1000; // grams per spool
    this.spoolPrice = data.spoolPrice ?? 25;     // price per spool

    // Temperature settings (for reference)
    this.printTemp = {
      min: data.printTemp?.min ?? this._getDefaultPrintTemp().min,
      max: data.printTemp?.max ?? this._getDefaultPrintTemp().max,
    };
    this.bedTemp = {
      min: data.bedTemp?.min ?? this._getDefaultBedTemp().min,
      max: data.bedTemp?.max ?? this._getDefaultBedTemp().max,
    };

    // Inventory (optional tracking)
    this.inStock = data.inStock ?? 0;           // grams remaining
    this.spoolsInStock = data.spoolsInStock ?? 0;

    // Metadata
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Get default density based on material type
   * @private
   */
  _getDefaultDensity() {
    return CONFIG.MATERIALS[this.material]?.density ?? 1.24;
  }

  /**
   * Get default print temperature based on material type
   * @private
   */
  _getDefaultPrintTemp() {
    return CONFIG.MATERIALS[this.material]?.printTemp ?? { min: 200, max: 220 };
  }

  /**
   * Get default bed temperature based on material type
   * @private
   */
  _getDefaultBedTemp() {
    return CONFIG.MATERIALS[this.material]?.bedTemp ?? { min: 50, max: 60 };
  }

  /**
   * Calculate price per gram
   * @returns {number} Price per gram
   */
  getPricePerGram() {
    if (this.spoolWeight <= 0) return 0;
    return this.spoolPrice / this.spoolWeight;
  }

  /**
   * Calculate filament cost for a given weight
   * @param {number} grams - Weight in grams
   * @returns {number} Cost
   */
  getCost(grams) {
    return grams * this.getPricePerGram();
  }

  /**
   * Convert filament length (mm) to weight (grams)
   * Using: Volume = π × r² × length, then Weight = Volume × density
   * @param {number} lengthMm - Length in millimeters
   * @returns {number} Weight in grams
   */
  lengthToWeight(lengthMm) {
    const radiusCm = (this.diameter / 2) / 10; // Convert mm to cm
    const lengthCm = lengthMm / 10;
    const volumeCm3 = Math.PI * Math.pow(radiusCm, 2) * lengthCm;
    return volumeCm3 * this.density;
  }

  /**
   * Convert weight (grams) to filament length (mm)
   * @param {number} grams - Weight in grams
   * @returns {number} Length in millimeters
   */
  weightToLength(grams) {
    const radiusCm = (this.diameter / 2) / 10;
    const volumeCm3 = grams / this.density;
    const lengthCm = volumeCm3 / (Math.PI * Math.pow(radiusCm, 2));
    return lengthCm * 10; // Convert cm to mm
  }

  /**
   * Get length per spool in meters
   * @returns {number} Length in meters
   */
  getLengthPerSpool() {
    return this.weightToLength(this.spoolWeight) / 1000; // mm to m
  }

  /**
   * Get display name (manufacturer + name or material + color)
   * @returns {string} Display name
   */
  getDisplayName() {
    if (this.name) {
      return this.manufacturer ? `${this.manufacturer} ${this.name}` : this.name;
    }
    return this.color ? `${this.material} - ${this.color}` : this.material;
  }

  /**
   * Get short display (material + color)
   * @returns {string} Short display name
   */
  getShortName() {
    return this.color ? `${this.material} ${this.color}` : this.material;
  }

  /**
   * Update material and auto-set defaults if needed
   * @param {string} material - Material type
   */
  setMaterial(material) {
    this.material = material;
    if (CONFIG.MATERIALS[material]) {
      this.density = CONFIG.MATERIALS[material].density;
      this.printTemp = { ...CONFIG.MATERIALS[material].printTemp };
      this.bedTemp = { ...CONFIG.MATERIALS[material].bedTemp };
    }
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Deduct filament from inventory
   * @param {number} grams - Grams used
   */
  useFilament(grams) {
    this.inStock = Math.max(0, this.inStock - grams);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Add spool to inventory
   * @param {number} count - Number of spools to add
   */
  addSpools(count = 1) {
    this.spoolsInStock += count;
    this.inStock += count * this.spoolWeight;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Check if filament is considered abrasive (wears nozzles faster)
   * @returns {boolean} True if abrasive
   */
  isAbrasive() {
    const abrasiveMaterials = ['Carbon Fiber', 'Metal-Fill', 'Wood-Fill', 'Glow-in-Dark'];
    return abrasiveMaterials.some(m =>
      this.material.toLowerCase().includes(m.toLowerCase()) ||
      this.name.toLowerCase().includes(m.toLowerCase())
    );
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
      material: this.material,
      color: this.color,
      colorHex: this.colorHex,
      diameter: this.diameter,
      density: this.density,
      spoolWeight: this.spoolWeight,
      spoolPrice: this.spoolPrice,
      printTemp: { ...this.printTemp },
      bedTemp: { ...this.bedTemp },
      inStock: this.inStock,
      spoolsInStock: this.spoolsInStock,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create Filament from plain object
   * @param {Object} data - Plain object
   * @returns {Filament} Filament instance
   */
  static fromJSON(data) {
    return new Filament(data);
  }
}
