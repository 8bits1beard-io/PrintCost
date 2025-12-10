/**
 * CostCalculation Engine
 * Handles all cost calculations for 3D prints
 */

class CostCalculation {
  constructor(config = {}) {
    this.electricityRate = config.electricityRate ?? 0.15;
    this.currency = config.currency ?? CONFIG.CURRENCY.code;
    this.currencySymbol = config.currencySymbol ?? CONFIG.CURRENCY.symbol;
  }

  /**
   * Calculate complete print cost
   * @param {Object} params - Calculation parameters
   * @param {Printer} params.printer - Printer profile
   * @param {Filament} params.filament - Filament profile
   * @param {Consumable[]} params.consumables - Array of consumables
   * @param {number} params.printTimeMinutes - Print time in minutes
   * @param {number} params.filamentGrams - Filament usage in grams
   * @param {number} params.electricityRate - Electricity rate ($/kWh)
   * @param {number} params.failureRate - Failure rate (0-1)
   * @param {number} params.laborHourlyRate - Labor rate ($/hour)
   * @param {number} params.laborHours - Labor time (hours)
   * @param {number} params.markupPercent - Markup percentage
   * @returns {Object} Detailed cost breakdown
   */
  calculate(params) {
    const {
      printer,
      filament,
      consumables = [],
      printTimeMinutes,
      filamentGrams,
      electricityRate = this.electricityRate,
      failureRate = CONFIG.DEFAULTS.FAILURE_RATE,
      laborHourlyRate = 0,
      laborHours = 0,
      markupPercent = 0,
    } = params;

    const printTimeHours = printTimeMinutes / 60;

    // 1. Filament cost
    const filamentCost = filamentGrams * filament.getPricePerGram();

    // 2. Electricity cost (includes AMS if attached)
    let powerWatts = printer.powerConsumption.printing;
    if (printer.hasAms && printer.ams) {
      powerWatts += printer.ams.powerConsumption.working;
    }
    const energyKwh = (powerWatts * printTimeHours) / 1000;
    const electricityCost = energyKwh * electricityRate;

    // 3. Printer depreciation
    const printerDepreciationCost = printer.getDepreciationPerHour() * printTimeHours;

    // 3b. AMS depreciation (if attached)
    const amsDepreciationCost = printer.getAmsDepreciationCost(printTimeMinutes);
    const depreciationCost = printerDepreciationCost + amsDepreciationCost;

    // 4. Consumables allocation
    let consumablesCost = 0;
    const consumablesBreakdown = [];

    for (const consumable of consumables) {
      const cost = consumable.getCostPerHour() * printTimeHours;
      consumablesCost += cost;
      consumablesBreakdown.push({
        id: consumable.id,
        name: consumable.getDisplayName(),
        type: consumable.type,
        costPerHour: consumable.getCostPerHour(),
        cost: cost,
      });
    }

    // 5. Labor cost (optional)
    const laborCost = laborHourlyRate * laborHours;

    // 6. Subtotal before adjustments
    const subtotal = filamentCost + electricityCost + depreciationCost + consumablesCost + laborCost;

    // 7. Failure rate buffer
    // Effective cost = base cost / (1 - failure rate)
    const effectiveCost = failureRate < 1 ? subtotal / (1 - failureRate) : subtotal;
    const failureBuffer = effectiveCost - subtotal;

    // 8. Profit markup (optional)
    const markupAmount = effectiveCost * (markupPercent / 100);

    // 9. Total
    const total = effectiveCost + markupAmount;

    // Calculate percentages for charts (based on subtotal)
    const percentages = subtotal > 0 ? {
      filament: (filamentCost / subtotal) * 100,
      electricity: (electricityCost / subtotal) * 100,
      depreciation: (depreciationCost / subtotal) * 100,
      consumables: (consumablesCost / subtotal) * 100,
      labor: (laborCost / subtotal) * 100,
    } : {
      filament: 0,
      electricity: 0,
      depreciation: 0,
      consumables: 0,
      labor: 0,
    };

    return {
      // Detailed breakdown
      breakdown: {
        filament: {
          grams: filamentGrams,
          pricePerGram: filament.getPricePerGram(),
          cost: filamentCost,
        },
        electricity: {
          watts: powerWatts,
          hours: printTimeHours,
          kwh: energyKwh,
          rate: electricityRate,
          cost: electricityCost,
        },
        depreciation: {
          printerValue: printer.purchasePrice,
          lifetimeHours: printer.estimatedLifetimeHours,
          ratePerHour: printer.getDepreciationPerHour(),
          printerCost: printerDepreciationCost,
          amsValue: printer.ams?.purchasePrice || 0,
          amsLifetimeHours: printer.ams?.estimatedLifetimeHours || 0,
          amsRatePerHour: printer.getAmsDepreciationPerHour(),
          amsCost: amsDepreciationCost,
          cost: depreciationCost,
        },
        consumables: {
          items: consumablesBreakdown,
          totalCost: consumablesCost,
        },
        labor: {
          hourlyRate: laborHourlyRate,
          hours: laborHours,
          cost: laborCost,
        },
      },

      // Summary
      subtotal: subtotal,
      failureRate: failureRate,
      failureBuffer: failureBuffer,
      markupPercent: markupPercent,
      markupAmount: markupAmount,
      total: total,

      // For charts
      percentages: percentages,

      // Input parameters (for reference/saving)
      params: {
        printTimeMinutes,
        filamentGrams,
        electricityRate,
        failureRate,
        laborHourlyRate,
        laborHours,
        markupPercent,
        printerId: printer.id,
        filamentId: filament.id,
        consumableIds: consumables.map(c => c.id),
      },
    };
  }

  /**
   * Quick calculation with just essential inputs
   * @param {Object} params - Simple parameters
   * @returns {number} Total cost
   */
  quickCalculate(params) {
    const {
      filamentGrams,
      filamentPricePerGram,
      printTimeMinutes,
      electricityRate = this.electricityRate,
      printerWatts = 120,
      printerCost = 300,
      printerLifetimeHours = 5000,
      consumablesPerHour = 0.05,
      failureRate = 0.05,
    } = params;

    const printTimeHours = printTimeMinutes / 60;

    const filamentCost = filamentGrams * filamentPricePerGram;
    const electricityCost = (printerWatts / 1000) * printTimeHours * electricityRate;
    const depreciationCost = (printerCost / printerLifetimeHours) * printTimeHours;
    const consumablesCost = consumablesPerHour * printTimeHours;

    const subtotal = filamentCost + electricityCost + depreciationCost + consumablesCost;
    const total = subtotal / (1 - failureRate);

    return total;
  }

  /**
   * Compare costs across multiple scenarios
   * @param {Object[]} scenarios - Array of calculation parameters
   * @returns {Object[]} Array of results with comparisons
   */
  compareScenarios(scenarios) {
    const results = scenarios.map((scenario, index) => ({
      index,
      name: scenario.name || `Scenario ${index + 1}`,
      result: this.calculate(scenario),
    }));

    // Find min and max
    const totals = results.map(r => r.result.total);
    const minTotal = Math.min(...totals);
    const maxTotal = Math.max(...totals);

    // Add comparison data
    return results.map(r => ({
      ...r,
      isLowest: r.result.total === minTotal,
      isHighest: r.result.total === maxTotal,
      differenceFromLowest: r.result.total - minTotal,
      percentFromLowest: minTotal > 0
        ? ((r.result.total - minTotal) / minTotal) * 100
        : 0,
    }));
  }

  /**
   * Calculate break-even quantity for selling prints
   * @param {Object} params - Parameters
   * @param {number} params.fixedCosts - One-time costs (design time, etc.)
   * @param {number} params.costPerUnit - Variable cost per print
   * @param {number} params.pricePerUnit - Selling price per print
   * @returns {Object} Break-even analysis
   */
  breakEvenAnalysis(params) {
    const { fixedCosts, costPerUnit, pricePerUnit } = params;

    const marginPerUnit = pricePerUnit - costPerUnit;

    if (marginPerUnit <= 0) {
      return {
        breakEvenQuantity: Infinity,
        marginPerUnit: marginPerUnit,
        profitable: false,
        message: 'Selling price must be higher than cost per unit',
      };
    }

    const breakEvenQuantity = Math.ceil(fixedCosts / marginPerUnit);

    return {
      breakEvenQuantity,
      marginPerUnit,
      profitable: true,
      fixedCosts,
      costPerUnit,
      pricePerUnit,
    };
  }

  /**
   * Format a cost result for display
   * @param {Object} result - Calculation result
   * @returns {Object} Formatted result
   */
  formatResult(result) {
    const format = (value) => CONFIG.formatCurrency(value);

    return {
      filament: format(result.breakdown.filament.cost),
      electricity: format(result.breakdown.electricity.cost),
      depreciation: format(result.breakdown.depreciation.cost),
      consumables: format(result.breakdown.consumables.totalCost),
      labor: format(result.breakdown.labor.cost),
      subtotal: format(result.subtotal),
      failureBuffer: format(result.failureBuffer),
      markup: format(result.markupAmount),
      total: format(result.total),
    };
  }

  /**
   * Create a PrintJob from calculation result
   * @param {Object} result - Calculation result
   * @param {Object} options - Additional options
   * @returns {PrintJob} PrintJob instance
   */
  createPrintJob(result, options = {}) {
    return new PrintJob({
      name: options.name || 'Calculated Print',
      description: options.description || '',
      sourceType: options.sourceType || 'manual',
      gcodeFileName: options.gcodeFileName || null,
      slicerType: options.slicerType || null,
      printerId: result.params.printerId,
      filamentId: result.params.filamentId,
      printTimeMinutes: result.params.printTimeMinutes,
      filamentUsedGrams: result.params.filamentGrams,
      costs: {
        filament: result.breakdown.filament.cost,
        electricity: result.breakdown.electricity.cost,
        depreciation: result.breakdown.depreciation.cost,
        consumables: result.breakdown.consumables.totalCost,
        labor: result.breakdown.labor.cost,
        subtotal: result.subtotal,
        failureBuffer: result.failureBuffer,
        markup: result.markupAmount,
        total: result.total,
      },
      calculationParams: {
        electricityRate: result.params.electricityRate,
        failureRate: result.params.failureRate,
        laborHourlyRate: result.params.laborHourlyRate,
        laborHours: result.params.laborHours,
        markupPercent: result.params.markupPercent,
      },
      consumablesUsed: result.breakdown.consumables.items.map(c => ({
        id: c.id,
        name: c.name,
        cost: c.cost,
      })),
      status: 'calculated',
    });
  }
}

// Create singleton instance
const costCalculator = new CostCalculation();
