/**
 * ChartManager
 * Centralized management of Chart.js charts
 */

const ChartManager = {
  // Store active chart instances to prevent memory leaks
  instances: {},

  /**
   * Destroy an existing chart instance
   * @param {string} chartId - Canvas element ID
   */
  destroy(chartId) {
    if (this.instances[chartId]) {
      this.instances[chartId].destroy();
      delete this.instances[chartId];
    }
  },

  /**
   * Create or update a chart
   * @param {string} chartId - Canvas element ID
   * @param {Object} config - Chart.js configuration
   * @returns {Chart} Chart instance
   */
  create(chartId, config) {
    this.destroy(chartId);
    const ctx = document.getElementById(chartId);
    if (!ctx) return null;

    this.instances[chartId] = new Chart(ctx.getContext('2d'), config);
    return this.instances[chartId];
  },

  /**
   * Create a cost breakdown doughnut chart
   * @param {string} chartId - Canvas element ID
   * @param {Object} breakdown - Cost breakdown data
   * @returns {Chart} Chart instance
   */
  createCostBreakdown(chartId, breakdown) {
    const data = [
      breakdown.filament || 0,
      breakdown.electricity || 0,
      breakdown.depreciation || 0,
      breakdown.consumables || 0,
      breakdown.labor || 0,
    ];

    // Filter out zero values for cleaner display
    const labels = ['Filament', 'Electricity', 'Depreciation', 'Consumables', 'Labor'];
    const colors = [
      CONFIG.CHART_COLORS.filament,
      CONFIG.CHART_COLORS.electricity,
      CONFIG.CHART_COLORS.depreciation,
      CONFIG.CHART_COLORS.consumables,
      CONFIG.CHART_COLORS.labor,
    ];

    const filteredData = [];
    const filteredLabels = [];
    const filteredColors = [];

    data.forEach((value, index) => {
      if (value > 0) {
        filteredData.push(value);
        filteredLabels.push(labels[index]);
        filteredColors.push(colors[index]);
      }
    });

    return this.create(chartId, {
      type: 'doughnut',
      data: {
        labels: filteredLabels,
        datasets: [{
          data: filteredData,
          backgroundColor: filteredColors,
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${Formatters.currency(value)} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  },

  /**
   * Create a spending over time line chart
   * @param {string} chartId - Canvas element ID
   * @param {Array} history - Print history array
   * @returns {Chart} Chart instance
   */
  createSpendingOverTime(chartId, history) {
    if (!history || history.length === 0) {
      return null;
    }

    // Sort by date and group by day/week/month based on data range
    const sortedHistory = [...history].sort((a, b) =>
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    // Determine grouping based on date range
    const firstDate = new Date(sortedHistory[0].createdAt);
    const lastDate = new Date(sortedHistory[sortedHistory.length - 1].createdAt);
    const daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));

    let groupBy = 'day';
    if (daysDiff > 90) groupBy = 'month';
    else if (daysDiff > 30) groupBy = 'week';

    // Group data
    const grouped = {};
    let runningTotal = 0;

    sortedHistory.forEach(job => {
      const date = new Date(job.createdAt);
      let key;

      if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        // Get week number
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { cost: 0, count: 0, cumulative: 0 };
      }
      grouped[key].cost += job.costs?.total || 0;
      grouped[key].count += 1;
      runningTotal += job.costs?.total || 0;
      grouped[key].cumulative = runningTotal;
    });

    const labels = Object.keys(grouped);
    const costs = labels.map(k => grouped[k].cost);
    const cumulative = labels.map(k => grouped[k].cumulative);

    // Format labels for display
    const formattedLabels = labels.map(label => {
      if (groupBy === 'month') {
        const [year, month] = label.split('-');
        const date = new Date(year, parseInt(month) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else if (groupBy === 'week') {
        return label;
      } else {
        const date = new Date(label);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    });

    return this.create(chartId, {
      type: 'line',
      data: {
        labels: formattedLabels,
        datasets: [
          {
            label: 'Per Period',
            data: costs,
            borderColor: CONFIG.CHART_COLORS.primary,
            backgroundColor: CONFIG.CHART_COLORS.primary + '20',
            fill: true,
            tension: 0.3,
            yAxisID: 'y',
          },
          {
            label: 'Cumulative',
            data: cumulative,
            borderColor: CONFIG.CHART_COLORS.secondary,
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${Formatters.currency(context.raw)}`;
              },
            },
          },
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Cost per Period',
            },
            ticks: {
              callback: (value) => Formatters.currency(value),
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Cumulative Cost',
            },
            ticks: {
              callback: (value) => Formatters.currency(value),
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        },
      },
    });
  },

  /**
   * Create a cost comparison bar chart
   * @param {string} chartId - Canvas element ID
   * @param {Array} scenarios - Array of scenario objects with name and costs
   * @returns {Chart} Chart instance
   */
  createComparison(chartId, scenarios) {
    if (!scenarios || scenarios.length === 0) {
      return null;
    }

    const labels = scenarios.map(s => s.name);

    const datasets = [
      {
        label: 'Filament',
        data: scenarios.map(s => s.costs.filament || 0),
        backgroundColor: CONFIG.CHART_COLORS.filament,
      },
      {
        label: 'Electricity',
        data: scenarios.map(s => s.costs.electricity || 0),
        backgroundColor: CONFIG.CHART_COLORS.electricity,
      },
      {
        label: 'Depreciation',
        data: scenarios.map(s => s.costs.depreciation || 0),
        backgroundColor: CONFIG.CHART_COLORS.depreciation,
      },
      {
        label: 'Consumables',
        data: scenarios.map(s => s.costs.consumables || 0),
        backgroundColor: CONFIG.CHART_COLORS.consumables,
      },
      {
        label: 'Failure Buffer',
        data: scenarios.map(s => s.costs.failureBuffer || 0),
        backgroundColor: CONFIG.CHART_COLORS.failureBuffer,
      },
    ];

    return this.create(chartId, {
      type: 'bar',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${Formatters.currency(context.raw)}`;
              },
              footer: (tooltipItems) => {
                const total = tooltipItems.reduce((sum, item) => sum + item.raw, 0);
                return `Total: ${Formatters.currency(total)}`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            ticks: {
              callback: (value) => Formatters.currency(value),
            },
          },
        },
      },
    });
  },

  /**
   * Create a material usage pie chart
   * @param {string} chartId - Canvas element ID
   * @param {Array} history - Print history array
   * @returns {Chart} Chart instance
   */
  createMaterialUsage(chartId, history) {
    if (!history || history.length === 0) {
      return null;
    }

    // Group by filament material
    const materialUsage = {};

    history.forEach(job => {
      if (job.filamentId) {
        const filament = storage.getFilament(job.filamentId);
        if (filament) {
          const material = filament.material || 'Unknown';
          if (!materialUsage[material]) {
            materialUsage[material] = 0;
          }
          materialUsage[material] += job.filamentUsedGrams || 0;
        }
      }
    });

    const labels = Object.keys(materialUsage);
    const data = labels.map(k => materialUsage[k]);

    // Generate colors based on material
    const colors = labels.map(material => {
      const materialConfig = CONFIG.MATERIALS[material];
      return materialConfig?.color || '#6b7280';
    });

    return this.create(chartId, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${Formatters.weight(value)} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  },

  /**
   * Create a printer utilization chart
   * @param {string} chartId - Canvas element ID
   * @param {Array} printers - Array of printer objects
   * @returns {Chart} Chart instance
   */
  createPrinterUtilization(chartId, printers) {
    if (!printers || printers.length === 0) {
      return null;
    }

    const labels = printers.map(p => p.getDisplayName());
    const used = printers.map(p => p.currentHours);
    const remaining = printers.map(p => Math.max(0, p.estimatedLifetimeHours - p.currentHours));

    return this.create(chartId, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Hours Used',
            data: used,
            backgroundColor: CONFIG.CHART_COLORS.primary,
          },
          {
            label: 'Remaining Lifetime',
            data: remaining,
            backgroundColor: '#e5e7eb',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${Formatters.number(context.raw, 1)}h`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Hours',
            },
          },
          y: {
            stacked: true,
          },
        },
      },
    });
  },
};
