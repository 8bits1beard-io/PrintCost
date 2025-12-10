/**
 * Consumable Model
 * Represents wear parts like nozzles, beds, belts, etc.
 */

class Consumable {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name || '';
    this.type = data.type || 'other';
    this.printerId = data.printerId || null; // Associated printer (optional)

    // Cost tracking
    this.unitPrice = data.unitPrice ?? this._getDefaultPrice();
    this.quantity = data.quantity ?? 1; // Current quantity in stock

    // Lifetime estimation (primary: hours)
    this.estimatedLifetimeHours = data.estimatedLifetimeHours ?? this._getDefaultLifetimeHours();
    this.currentHours = data.currentHours ?? 0;

    // Alternative tracking methods
    this.estimatedLifetimePrints = data.estimatedLifetimePrints ?? null;
    this.currentPrints = data.currentPrints ?? 0;
    this.estimatedLifetimeGrams = data.estimatedLifetimeGrams ?? null;
    this.currentGrams = data.currentGrams ?? 0;

    // Replacement tracking
    this.lastReplaced = data.lastReplaced || null;
    this.replacementHistory = data.replacementHistory || [];

    // Metadata
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Get default price based on consumable type
   * @private
   */
  _getDefaultPrice() {
    return CONFIG.CONSUMABLE_TYPES[this.type]?.defaultPrice ?? 10;
  }

  /**
   * Get default lifetime hours based on consumable type
   * @private
   */
  _getDefaultLifetimeHours() {
    return CONFIG.CONSUMABLE_TYPES[this.type]?.defaultLifetimeHours ?? 1000;
  }

  /**
   * Calculate cost per print hour
   * @returns {number} Cost per hour
   */
  getCostPerHour() {
    if (this.estimatedLifetimeHours <= 0) return 0;
    return this.unitPrice / this.estimatedLifetimeHours;
  }

  /**
   * Calculate cost for a given print time
   * @param {number} printTimeMinutes - Print time in minutes
   * @returns {number} Cost allocation
   */
  getCost(printTimeMinutes) {
    const hours = printTimeMinutes / 60;
    return this.getCostPerHour() * hours;
  }

  /**
   * Get wear percentage based on hours
   * @returns {number} Percentage (0-100)
   */
  getWearPercentage() {
    if (this.estimatedLifetimeHours <= 0) return 0;
    return Math.min(100, (this.currentHours / this.estimatedLifetimeHours) * 100);
  }

  /**
   * Get remaining lifetime in hours
   * @returns {number} Remaining hours
   */
  getRemainingHours() {
    return Math.max(0, this.estimatedLifetimeHours - this.currentHours);
  }

  /**
   * Check if replacement is needed
   * @param {number} threshold - Percentage threshold (default 90%)
   * @returns {boolean} True if replacement needed
   */
  needsReplacement(threshold = 90) {
    return this.getWearPercentage() >= threshold;
  }

  /**
   * Get wear status for display
   * @returns {Object} Status info { status, label, class }
   */
  getWearStatus() {
    const percentage = this.getWearPercentage();

    if (percentage >= 100) {
      return { status: 'critical', label: 'Replace Now', class: 'error' };
    } else if (percentage >= 90) {
      return { status: 'warning', label: 'Replace Soon', class: 'warning' };
    } else if (percentage >= 70) {
      return { status: 'fair', label: 'Fair', class: 'warning' };
    } else {
      return { status: 'good', label: 'Good', class: 'success' };
    }
  }

  /**
   * Record usage from a print
   * @param {number} hours - Print time in hours
   * @param {number} grams - Filament used in grams
   */
  addUsage(hours = 0, grams = 0) {
    this.currentHours += hours;
    this.currentGrams += grams;
    this.currentPrints += 1;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Mark as replaced and reset counters
   */
  markReplaced() {
    // Save to history
    this.replacementHistory.push({
      date: new Date().toISOString(),
      hoursUsed: this.currentHours,
      gramsUsed: this.currentGrams,
      printsCompleted: this.currentPrints,
    });

    // Reset counters
    this.currentHours = 0;
    this.currentGrams = 0;
    this.currentPrints = 0;
    this.lastReplaced = new Date().toISOString();

    // Decrease quantity
    this.quantity = Math.max(0, this.quantity - 1);

    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get average lifetime from replacement history
   * @returns {number|null} Average hours or null if no history
   */
  getAverageLifetime() {
    if (this.replacementHistory.length === 0) return null;

    const totalHours = this.replacementHistory.reduce(
      (sum, record) => sum + record.hoursUsed, 0
    );
    return totalHours / this.replacementHistory.length;
  }

  /**
   * Get type display name
   * @returns {string} Display name for type
   */
  getTypeName() {
    return CONFIG.CONSUMABLE_TYPES[this.type]?.name || this.type;
  }

  /**
   * Get display name
   * @returns {string} Display name
   */
  getDisplayName() {
    return this.name || this.getTypeName();
  }

  /**
   * Convert to plain object for storage
   * @returns {Object} Plain object
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      printerId: this.printerId,
      unitPrice: this.unitPrice,
      quantity: this.quantity,
      estimatedLifetimeHours: this.estimatedLifetimeHours,
      currentHours: this.currentHours,
      estimatedLifetimePrints: this.estimatedLifetimePrints,
      currentPrints: this.currentPrints,
      estimatedLifetimeGrams: this.estimatedLifetimeGrams,
      currentGrams: this.currentGrams,
      lastReplaced: this.lastReplaced,
      replacementHistory: [...this.replacementHistory],
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create Consumable from plain object
   * @param {Object} data - Plain object
   * @returns {Consumable} Consumable instance
   */
  static fromJSON(data) {
    return new Consumable(data);
  }
}
