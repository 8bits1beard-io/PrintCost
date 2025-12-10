/**
 * PrintJob Model
 * Represents a calculated or completed print job with cost breakdown
 */

class PrintJob {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name || 'Untitled Print';
    this.description = data.description || '';

    // Source information
    this.sourceType = data.sourceType || 'manual'; // 'gcode' or 'manual'
    this.gcodeFileName = data.gcodeFileName || null;
    this.slicerType = data.slicerType || null;

    // References
    this.printerId = data.printerId || null;
    this.filamentId = data.filamentId || null;

    // Print parameters (from slicer or manual entry)
    this.printTimeMinutes = data.printTimeMinutes ?? 0;
    this.filamentUsedGrams = data.filamentUsedGrams ?? 0;
    this.filamentUsedMeters = data.filamentUsedMeters ?? 0;

    // Additional print info (from G-code if available)
    this.layerHeight = data.layerHeight || null;
    this.nozzleDiameter = data.nozzleDiameter || null;
    this.infillPercent = data.infillPercent || null;

    // Cost breakdown
    this.costs = {
      filament: data.costs?.filament ?? 0,
      electricity: data.costs?.electricity ?? 0,
      depreciation: data.costs?.depreciation ?? 0,
      consumables: data.costs?.consumables ?? 0,
      labor: data.costs?.labor ?? 0,
      subtotal: data.costs?.subtotal ?? 0,
      failureBuffer: data.costs?.failureBuffer ?? 0,
      markup: data.costs?.markup ?? 0,
      total: data.costs?.total ?? 0,
    };

    // Calculation parameters used
    this.calculationParams = {
      electricityRate: data.calculationParams?.electricityRate ?? 0.15,
      failureRate: data.calculationParams?.failureRate ?? CONFIG.DEFAULTS.FAILURE_RATE,
      laborHourlyRate: data.calculationParams?.laborHourlyRate ?? 0,
      laborHours: data.calculationParams?.laborHours ?? 0,
      markupPercent: data.calculationParams?.markupPercent ?? 0,
    };

    // Consumables used (for detailed breakdown)
    this.consumablesUsed = data.consumablesUsed || [];

    // Status tracking
    this.status = data.status || 'calculated'; // 'calculated', 'printing', 'completed', 'failed'
    this.actualOutcome = data.actualOutcome || null;

    // Metadata
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.completedAt = data.completedAt || null;
  }

  /**
   * Get formatted print time
   * @returns {string} Formatted time string
   */
  getFormattedTime() {
    return CONFIG.formatTime(this.printTimeMinutes);
  }

  /**
   * Get formatted filament weight
   * @returns {string} Formatted weight string
   */
  getFormattedWeight() {
    return CONFIG.formatWeight(this.filamentUsedGrams);
  }

  /**
   * Get formatted total cost
   * @returns {string} Formatted currency string
   */
  getFormattedTotal() {
    return CONFIG.formatCurrency(this.costs.total);
  }

  /**
   * Get cost per gram
   * @returns {number} Cost per gram of filament
   */
  getCostPerGram() {
    if (this.filamentUsedGrams <= 0) return 0;
    return this.costs.total / this.filamentUsedGrams;
  }

  /**
   * Get cost per hour
   * @returns {number} Cost per hour of printing
   */
  getCostPerHour() {
    if (this.printTimeMinutes <= 0) return 0;
    return this.costs.total / (this.printTimeMinutes / 60);
  }

  /**
   * Get cost breakdown as percentages
   * @returns {Object} Percentage breakdown
   */
  getPercentages() {
    const subtotal = this.costs.subtotal;
    if (subtotal <= 0) {
      return {
        filament: 0,
        electricity: 0,
        depreciation: 0,
        consumables: 0,
        labor: 0,
      };
    }

    return {
      filament: (this.costs.filament / subtotal) * 100,
      electricity: (this.costs.electricity / subtotal) * 100,
      depreciation: (this.costs.depreciation / subtotal) * 100,
      consumables: (this.costs.consumables / subtotal) * 100,
      labor: (this.costs.labor / subtotal) * 100,
    };
  }

  /**
   * Mark print as completed
   */
  markCompleted() {
    this.status = 'completed';
    this.completedAt = new Date().toISOString();
  }

  /**
   * Mark print as failed
   * @param {string} reason - Reason for failure (optional)
   */
  markFailed(reason = null) {
    this.status = 'failed';
    this.actualOutcome = reason;
    this.completedAt = new Date().toISOString();
  }

  /**
   * Add a tag
   * @param {string} tag - Tag to add
   */
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  /**
   * Remove a tag
   * @param {string} tag - Tag to remove
   */
  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
    }
  }

  /**
   * Get status display info
   * @returns {Object} Status info { label, class }
   */
  getStatusInfo() {
    switch (this.status) {
      case 'completed':
        return { label: 'Completed', class: 'success' };
      case 'failed':
        return { label: 'Failed', class: 'error' };
      case 'printing':
        return { label: 'Printing', class: 'primary' };
      default:
        return { label: 'Calculated', class: 'gray' };
    }
  }

  /**
   * Get date for display
   * @returns {string} Formatted date
   */
  getDisplayDate() {
    const date = new Date(this.createdAt);
    return date.toLocaleDateString();
  }

  /**
   * Get detailed date/time for display
   * @returns {string} Formatted date and time
   */
  getDisplayDateTime() {
    const date = new Date(this.createdAt);
    return date.toLocaleString();
  }

  /**
   * Clone this print job (for re-calculation or comparison)
   * @returns {PrintJob} Cloned PrintJob
   */
  clone() {
    return new PrintJob({
      ...this.toJSON(),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completedAt: null,
      status: 'calculated',
    });
  }

  /**
   * Convert to plain object for storage
   * @returns {Object} Plain object
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      sourceType: this.sourceType,
      gcodeFileName: this.gcodeFileName,
      slicerType: this.slicerType,
      printerId: this.printerId,
      filamentId: this.filamentId,
      printTimeMinutes: this.printTimeMinutes,
      filamentUsedGrams: this.filamentUsedGrams,
      filamentUsedMeters: this.filamentUsedMeters,
      layerHeight: this.layerHeight,
      nozzleDiameter: this.nozzleDiameter,
      infillPercent: this.infillPercent,
      costs: { ...this.costs },
      calculationParams: { ...this.calculationParams },
      consumablesUsed: [...this.consumablesUsed],
      status: this.status,
      actualOutcome: this.actualOutcome,
      tags: [...this.tags],
      createdAt: this.createdAt,
      completedAt: this.completedAt,
    };
  }

  /**
   * Create PrintJob from plain object
   * @param {Object} data - Plain object
   * @returns {PrintJob} PrintJob instance
   */
  static fromJSON(data) {
    return new PrintJob(data);
  }
}
