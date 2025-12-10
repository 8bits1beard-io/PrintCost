/**
 * Main Application
 * Initializes the app and handles navigation
 */

const App = {
  currentPage: 'dashboard',

  /**
   * Initialize the application
   */
  init() {
    console.log('Initializing PrintCost...');

    // Check for first launch
    if (storage.isFirstLaunch()) {
      this.showWelcomeModal();
    }

    // Initialize navigation
    this.initNavigation();

    // Initialize header buttons
    this.initHeaderButtons();

    // Load initial page from URL hash or default
    const hash = window.location.hash.slice(1);
    if (hash && document.querySelector(`[data-page="${hash}"]`)) {
      this.navigateTo(hash);
    } else {
      this.navigateTo('dashboard');
    }

    // Render current page
    this.renderPage(this.currentPage);

    console.log('App initialized successfully');
  },

  /**
   * Initialize navigation event listeners
   */
  initNavigation() {
    document.querySelectorAll('.app-nav__link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        this.navigateTo(page);
      });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      this.navigateTo(hash, false);
    });
  },

  /**
   * Navigate to a page
   * @param {string} page - Page name
   * @param {boolean} updateHistory - Update browser history
   */
  navigateTo(page, updateHistory = true) {
    // Update active nav link and aria-current
    document.querySelectorAll('.app-nav__link').forEach(link => {
      const isActive = link.dataset.page === page;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    // Show active page section using hidden attribute for accessibility
    document.querySelectorAll('.page-section').forEach(section => {
      const isActive = section.id === `page-${page}`;
      section.classList.toggle('active', isActive);
      if (isActive) {
        section.removeAttribute('hidden');
      } else {
        section.setAttribute('hidden', '');
      }
    });

    // Update URL hash
    if (updateHistory) {
      window.location.hash = page;
    }

    this.currentPage = page;
    this.renderPage(page);
  },

  /**
   * Render page content
   * @param {string} page - Page name
   */
  renderPage(page) {
    switch (page) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'calculator':
        this.renderCalculator();
        break;
      case 'printers':
        this.renderPrinters();
        break;
      case 'filaments':
        this.renderFilaments();
        break;
      case 'consumables':
        this.renderConsumables();
        break;
      case 'history':
        this.renderHistory();
        break;
      case 'compare':
        this.renderCompare();
        break;
    }
  },

  /**
   * Initialize header buttons
   */
  initHeaderButtons() {
    // Export button
    document.getElementById('btn-export').addEventListener('click', () => {
      storage.downloadExport();
      this.showToast('Data exported successfully', 'success');
    });

    // Import button
    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('file-import').click();
    });

    // File import handler
    document.getElementById('file-import').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const content = await Helpers.readFileAsText(file);
        const result = storage.importAll(content);

        if (result.success) {
          this.showToast(`Imported ${result.stats.printers} printers, ${result.stats.filaments} filaments`, 'success');
          this.renderPage(this.currentPage);
        } else {
          this.showToast(`Import failed: ${result.error}`, 'error');
        }
      } catch (err) {
        this.showToast('Failed to read file', 'error');
      }

      e.target.value = ''; // Reset input
    });

    // Settings button
    document.getElementById('btn-settings').addEventListener('click', () => {
      this.showSettingsModal();
    });

    // Add printer button
    document.getElementById('btn-add-printer').addEventListener('click', () => {
      this.showPrinterModal();
    });

    // Add filament button
    document.getElementById('btn-add-filament').addEventListener('click', () => {
      this.showFilamentModal();
    });

    // Add consumable button
    document.getElementById('btn-add-consumable').addEventListener('click', () => {
      this.showConsumableModal();
    });
  },

  // ============================================================
  // Page Renderers
  // ============================================================

  renderDashboard() {
    const container = document.getElementById('dashboard-content');
    const stats = storage.getStats();
    const recentHistory = storage.getPrintHistory().slice(0, 5);
    const allHistory = storage.getPrintHistory();
    const consumables = storage.getConsumables().filter(c => c.needsReplacement(80));
    const printers = storage.getPrinters();

    // Calculate average cost breakdown from all history
    const avgBreakdown = this.calculateAverageBreakdown(allHistory);

    container.innerHTML = `
      <!-- Stats Cards -->
      <div class="grid grid--4 mb-6">
        <div class="card stat-card">
          <div class="stat-card__label">Total Prints</div>
          <div class="stat-card__value">${stats.totalPrints}</div>
        </div>
        <div class="card stat-card">
          <div class="stat-card__label">Total Cost</div>
          <div class="stat-card__value">${Formatters.currency(stats.totalCost)}</div>
        </div>
        <div class="card stat-card">
          <div class="stat-card__label">Filament Used</div>
          <div class="stat-card__value">${Formatters.weight(stats.totalFilament)}</div>
        </div>
        <div class="card stat-card">
          <div class="stat-card__label">Print Time</div>
          <div class="stat-card__value">${Formatters.time(stats.totalTime)}</div>
        </div>
      </div>

      <!-- Charts Row -->
      ${allHistory.length > 0 ? `
        <div class="grid grid--2 mb-6">
          <!-- Cost Breakdown Chart -->
          <div class="card">
            <div class="card__header">
              <h3 class="card__title">Cost Breakdown</h3>
            </div>
            <div class="card__body">
              <div style="height: 250px;">
                <canvas id="dashboard-cost-breakdown"></canvas>
              </div>
            </div>
          </div>

          <!-- Spending Over Time Chart -->
          <div class="card">
            <div class="card__header">
              <h3 class="card__title">Spending Over Time</h3>
            </div>
            <div class="card__body">
              <div style="height: 250px;">
                <canvas id="dashboard-spending-time"></canvas>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="grid grid--2">
        <!-- Recent Prints -->
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">Recent Prints</h3>
            <a href="#history" class="btn btn--ghost btn--sm">View All</a>
          </div>
          <div class="card__body">
            ${recentHistory.length > 0 ? `
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Cost</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentHistory.map(job => `
                      <tr>
                        <td>${Helpers.escapeHtml(job.name)}</td>
                        <td>${Formatters.currency(job.costs.total)}</td>
                        <td>${job.getDisplayDate()}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div class="empty-state">
                <p class="text-gray-500">No prints yet. Use the calculator to get started!</p>
              </div>
            `}
          </div>
        </div>

        <!-- Consumable Alerts -->
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">Consumable Alerts</h3>
            <a href="#consumables" class="btn btn--ghost btn--sm">Manage</a>
          </div>
          <div class="card__body">
            ${consumables.length > 0 ? `
              <div class="flex flex-col gap-3">
                ${consumables.map(c => {
                  const status = c.getWearStatus();
                  return `
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="font-medium">${Helpers.escapeHtml(c.getDisplayName())}</div>
                        <div class="text-sm text-gray-500">${Formatters.percent(c.getWearPercentage())} worn</div>
                      </div>
                      <span class="badge badge--${status.class}">${status.label}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="empty-state">
                <p class="text-gray-500">All consumables are in good condition!</p>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Printer Utilization -->
      ${printers.length > 0 ? `
        <div class="card mt-6">
          <div class="card__header">
            <h3 class="card__title">Printer Utilization</h3>
          </div>
          <div class="card__body">
            <div style="height: ${Math.max(150, printers.length * 50)}px;">
              <canvas id="dashboard-printer-util"></canvas>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Quick Actions -->
      <div class="card mt-6">
        <div class="card__body">
          <div class="flex items-center justify-center gap-4 flex-wrap">
            <a href="#calculator" class="btn btn--primary btn--lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/></svg>
              Calculate Print Cost
            </a>
            <button class="btn btn--secondary btn--lg" onclick="App.showPrinterModal()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Printer
            </button>
            <button class="btn btn--secondary btn--lg" onclick="App.showFilamentModal()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Filament
            </button>
          </div>
        </div>
      </div>
    `;

    // Render charts after DOM is updated
    if (allHistory.length > 0) {
      ChartManager.createCostBreakdown('dashboard-cost-breakdown', avgBreakdown);
      ChartManager.createSpendingOverTime('dashboard-spending-time', allHistory);
    }

    if (printers.length > 0) {
      ChartManager.createPrinterUtilization('dashboard-printer-util', printers);
    }
  },

  /**
   * Calculate average cost breakdown from print history
   * @param {Array} history - Print history array
   * @returns {Object} Breakdown object
   */
  calculateAverageBreakdown(history) {
    const breakdown = {
      filament: 0,
      electricity: 0,
      depreciation: 0,
      consumables: 0,
      labor: 0,
    };

    if (!history || history.length === 0) {
      return breakdown;
    }

    history.forEach(job => {
      if (job.costs) {
        breakdown.filament += job.costs.filament || 0;
        breakdown.electricity += job.costs.electricity || 0;
        breakdown.depreciation += job.costs.depreciation || 0;
        breakdown.consumables += job.costs.consumables || 0;
        breakdown.labor += job.costs.labor || 0;
      }
    });

    return breakdown;
  },

  renderCalculator() {
    const container = document.getElementById('calculator-content');
    const printers = storage.getPrinters();
    const filaments = storage.getFilaments();
    const settings = storage.getSettings();

    container.innerHTML = `
      <div class="grid grid--2">
        <!-- Input Section -->
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">Print Details</h3>
          </div>
          <div class="card__body">
            <!-- G-code Upload -->
            <div class="dropzone mb-4" id="gcode-dropzone">
              <svg class="dropzone__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div class="dropzone__text">Drop G-code file here or click to browse</div>
              <div class="dropzone__hint">Supports PrusaSlicer, Cura, SuperSlicer</div>
            </div>
            <input type="file" id="gcode-file" accept=".gcode,.gco,.g" style="display:none">

            <div class="form-group">
              <label class="form-label">Job Name</label>
              <input type="text" class="form-input" id="calc-name" placeholder="My Print">
            </div>

            <div class="grid grid--2">
              <div class="form-group">
                <label class="form-label form-label--required">Print Time (minutes)</label>
                <input type="number" class="form-input" id="calc-time" min="0" step="1" value="60">
              </div>
              <div class="form-group">
                <label class="form-label form-label--required">Filament (grams)</label>
                <input type="number" class="form-input" id="calc-grams" min="0" step="0.1" value="20">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label form-label--required">Printer</label>
              <select class="form-select" id="calc-printer">
                ${printers.length === 0 ? '<option value="">No printers - add one first</option>' : ''}
                ${printers.map(p => `<option value="${p.id}">${Helpers.escapeHtml(p.getDisplayName())}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label form-label--required">Filament</label>
              <select class="form-select" id="calc-filament">
                ${filaments.length === 0 ? '<option value="">No filaments - add one first</option>' : ''}
                ${filaments.map(f => `<option value="${f.id}">${Helpers.escapeHtml(f.getDisplayName())} (${Formatters.pricePerGram(f.getPricePerGram())})</option>`).join('')}
              </select>
            </div>

            <hr class="my-4">

            <div class="grid grid--2">
              <div class="form-group">
                <label class="form-label">Electricity Rate</label>
                <div class="input-group">
                  <input type="number" class="form-input" id="calc-electricity" min="0" step="0.01" value="${settings.electricityRate || 0.15}">
                  <span class="input-group__addon">/kWh</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Failure Rate</label>
                <div class="input-group">
                  <input type="number" class="form-input" id="calc-failure" min="0" max="100" step="1" value="${(settings.defaultFailureRate || 0.05) * 100}">
                  <span class="input-group__addon">%</span>
                </div>
              </div>
            </div>

            <div class="grid grid--2">
              <div class="form-group">
                <label class="form-label">Labor Rate</label>
                <div class="input-group">
                  <input type="number" class="form-input" id="calc-labor-rate" min="0" step="0.01" value="0">
                  <span class="input-group__addon">/hr</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Labor Time (hours)</label>
                <input type="number" class="form-input" id="calc-labor-hours" min="0" step="0.1" value="0">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Markup</label>
              <div class="input-group">
                <input type="number" class="form-input" id="calc-markup" min="0" max="1000" step="1" value="0">
                <span class="input-group__addon">%</span>
              </div>
            </div>

            <button class="btn btn--primary btn--lg" style="width:100%" id="btn-calculate">
              Calculate Cost
            </button>
          </div>
        </div>

        <!-- Results Section -->
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">Cost Breakdown</h3>
          </div>
          <div class="card__body">
            <div id="calc-results">
              <div class="empty-state">
                <p class="text-gray-500">Enter print details and click Calculate</p>
              </div>
            </div>
          </div>
          <div class="card__footer hidden" id="calc-actions">
            <button class="btn btn--success" id="btn-save-history">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save to History
            </button>
          </div>
        </div>
      </div>
    `;

    // Initialize calculator events
    this.initCalculatorEvents();
  },

  initCalculatorEvents() {
    const dropzone = document.getElementById('gcode-dropzone');
    const fileInput = document.getElementById('gcode-file');

    // Dropzone click
    dropzone.addEventListener('click', () => fileInput.click());

    // Drag and drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) this.handleGcodeFile(file);
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.handleGcodeFile(file);
    });

    // Calculate button
    document.getElementById('btn-calculate').addEventListener('click', () => {
      this.calculateCost();
    });

    // Save to history button
    document.getElementById('btn-save-history').addEventListener('click', () => {
      this.saveToHistory();
    });
  },

  async handleGcodeFile(file) {
    try {
      const content = await Helpers.readFileAsText(file);

      // Parse the G-code
      const parseResult = gcodeParser.parse(content);

      if (!parseResult.success) {
        this.showToast('Failed to parse G-code file', 'error');
        return;
      }

      // Set the job name from filename
      document.getElementById('calc-name').value = file.name.replace(/\.(gcode|gco|g)$/i, '');

      // Fill in parsed values
      if (parseResult.printTimeMinutes) {
        document.getElementById('calc-time').value = Math.round(parseResult.printTimeMinutes);
      }

      if (parseResult.filamentUsedGrams) {
        document.getElementById('calc-grams').value = parseResult.filamentUsedGrams.toFixed(1);
      }

      // Store parse result for display
      this.lastGcodeResult = parseResult;

      // Show success message with detected slicer
      this.showToast(`Parsed ${parseResult.slicerName} G-code`, 'success');

      // Update the dropzone to show parsed info
      this.displayGcodeInfo(parseResult, file.name);

    } catch (err) {
      console.error('G-code parsing error:', err);
      this.showToast('Failed to read G-code file', 'error');
    }
  },

  displayGcodeInfo(parseResult, filename) {
    const dropzone = document.getElementById('gcode-dropzone');

    const timeStr = parseResult.printTimeMinutes
      ? Formatters.time(parseResult.printTimeMinutes)
      : 'Unknown';

    const weightStr = parseResult.filamentUsedGrams
      ? Formatters.weight(parseResult.filamentUsedGrams)
      : 'Unknown';

    const filamentType = parseResult.filamentType || 'Unknown';

    dropzone.innerHTML = `
      <div class="flex items-center gap-3" style="text-align: left; width: 100%;">
        <svg class="dropzone__icon" style="width: 32px; height: 32px; margin: 0; color: var(--color-success);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <div style="flex: 1;">
          <div class="font-semibold">${Helpers.escapeHtml(filename)}</div>
          <div class="text-sm text-gray-500">
            ${parseResult.slicerName} · ${timeStr} · ${weightStr} · ${filamentType}
          </div>
        </div>
        <button class="btn btn--ghost btn--sm" onclick="App.clearGcode(event)" title="Clear">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
  },

  clearGcode(event) {
    if (event) event.stopPropagation();

    this.lastGcodeResult = null;
    document.getElementById('gcode-file').value = '';

    const dropzone = document.getElementById('gcode-dropzone');
    dropzone.innerHTML = `
      <svg class="dropzone__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <div class="dropzone__text">Drop G-code file here or click to browse</div>
      <div class="dropzone__hint">Supports PrusaSlicer, Cura, SuperSlicer, OrcaSlicer</div>
    `;
  },

  calculateCost() {
    const printerId = document.getElementById('calc-printer').value;
    const filamentId = document.getElementById('calc-filament').value;

    if (!printerId || !filamentId) {
      this.showToast('Please select a printer and filament', 'error');
      return;
    }

    const printer = storage.getPrinter(printerId);
    const filament = storage.getFilament(filamentId);

    if (!printer || !filament) {
      this.showToast('Invalid printer or filament selection', 'error');
      return;
    }

    const consumables = storage.getConsumablesForPrinter(printerId);

    const params = {
      printer,
      filament,
      consumables,
      printTimeMinutes: Helpers.parseNumber(document.getElementById('calc-time').value, 0),
      filamentGrams: Helpers.parseNumber(document.getElementById('calc-grams').value, 0),
      electricityRate: Helpers.parseNumber(document.getElementById('calc-electricity').value, 0.15),
      failureRate: Helpers.parseNumber(document.getElementById('calc-failure').value, 5) / 100,
      laborHourlyRate: Helpers.parseNumber(document.getElementById('calc-labor-rate').value, 0),
      laborHours: Helpers.parseNumber(document.getElementById('calc-labor-hours').value, 0),
      markupPercent: Helpers.parseNumber(document.getElementById('calc-markup').value, 0),
    };

    const result = costCalculator.calculate(params);
    this.lastCalculation = { result, params };
    this.displayCalculationResult(result);
  },

  displayCalculationResult(result) {
    const container = document.getElementById('calc-results');
    const formatted = costCalculator.formatResult(result);

    container.innerHTML = `
      <div class="cost-breakdown">
        <div class="cost-breakdown__row">
          <span class="cost-breakdown__label">
            <span class="cost-breakdown__dot" style="background-color: ${CONFIG.CHART_COLORS.filament}"></span>
            Filament (${Formatters.weight(result.breakdown.filament.grams)})
          </span>
          <span class="cost-breakdown__value">${formatted.filament}</span>
        </div>
        <div class="cost-breakdown__row">
          <span class="cost-breakdown__label">
            <span class="cost-breakdown__dot" style="background-color: ${CONFIG.CHART_COLORS.electricity}"></span>
            Electricity (${Formatters.energy(result.breakdown.electricity.kwh)})
          </span>
          <span class="cost-breakdown__value">${formatted.electricity}</span>
        </div>
        <div class="cost-breakdown__row">
          <span class="cost-breakdown__label">
            <span class="cost-breakdown__dot" style="background-color: ${CONFIG.CHART_COLORS.depreciation}"></span>
            Depreciation
          </span>
          <span class="cost-breakdown__value">${formatted.depreciation}</span>
        </div>
        <div class="cost-breakdown__row">
          <span class="cost-breakdown__label">
            <span class="cost-breakdown__dot" style="background-color: ${CONFIG.CHART_COLORS.consumables}"></span>
            Consumables
          </span>
          <span class="cost-breakdown__value">${formatted.consumables}</span>
        </div>
        ${result.breakdown.labor.cost > 0 ? `
          <div class="cost-breakdown__row">
            <span class="cost-breakdown__label">
              <span class="cost-breakdown__dot" style="background-color: ${CONFIG.CHART_COLORS.labor}"></span>
              Labor
            </span>
            <span class="cost-breakdown__value">${formatted.labor}</span>
          </div>
        ` : ''}
        <div class="cost-breakdown__divider"></div>
        <div class="cost-breakdown__row">
          <span class="cost-breakdown__label">Subtotal</span>
          <span class="cost-breakdown__value">${formatted.subtotal}</span>
        </div>
        <div class="cost-breakdown__row">
          <span class="cost-breakdown__label">
            <span class="cost-breakdown__dot" style="background-color: ${CONFIG.CHART_COLORS.failureBuffer}"></span>
            Failure Buffer (${Formatters.percent(result.failureRate * 100)})
          </span>
          <span class="cost-breakdown__value">${formatted.failureBuffer}</span>
        </div>
        ${result.markupAmount > 0 ? `
          <div class="cost-breakdown__row">
            <span class="cost-breakdown__label">
              <span class="cost-breakdown__dot" style="background-color: ${CONFIG.CHART_COLORS.markup}"></span>
              Markup (${Formatters.percent(result.markupPercent)})
            </span>
            <span class="cost-breakdown__value">${formatted.markup}</span>
          </div>
        ` : ''}
        <div class="cost-breakdown__divider"></div>
        <div class="cost-breakdown__row cost-breakdown__total">
          <span class="cost-breakdown__label">Total</span>
          <span class="cost-breakdown__value">${formatted.total}</span>
        </div>
      </div>

      <div class="mt-6">
        <canvas id="cost-chart" height="200"></canvas>
      </div>
    `;

    // Show save button
    document.getElementById('calc-actions').classList.remove('hidden');

    // Render chart
    this.renderCostChart(result);
  },

  renderCostChart(result) {
    const ctx = document.getElementById('cost-chart').getContext('2d');

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Filament', 'Electricity', 'Depreciation', 'Consumables', 'Labor'],
        datasets: [{
          data: [
            result.breakdown.filament.cost,
            result.breakdown.electricity.cost,
            result.breakdown.depreciation.cost,
            result.breakdown.consumables.totalCost,
            result.breakdown.labor.cost,
          ],
          backgroundColor: [
            CONFIG.CHART_COLORS.filament,
            CONFIG.CHART_COLORS.electricity,
            CONFIG.CHART_COLORS.depreciation,
            CONFIG.CHART_COLORS.consumables,
            CONFIG.CHART_COLORS.labor,
          ],
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
                return `${context.label}: ${Formatters.currency(value)} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  },

  saveToHistory() {
    if (!this.lastCalculation) {
      this.showToast('No calculation to save', 'error');
      return;
    }

    const name = document.getElementById('calc-name').value || 'Untitled Print';
    const printJob = costCalculator.createPrintJob(this.lastCalculation.result, { name });

    storage.savePrintJob(printJob);
    this.showToast('Saved to history', 'success');
    document.getElementById('calc-actions').classList.add('hidden');
  },

  renderPrinters() {
    const container = document.getElementById('printers-content');
    const printers = storage.getPrinters();

    if (printers.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card__body">
            <div class="empty-state">
              <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <h3 class="empty-state__title">No printers yet</h3>
              <p class="empty-state__description">Add your first 3D printer to start calculating costs.</p>
              <button class="btn btn--primary" onclick="App.showPrinterModal()">Add Printer</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid grid--auto-fit">
        ${printers.map(printer => `
          <div class="card card--interactive" data-printer-id="${printer.id}">
            <div class="card__body">
              <h3 class="mb-1">${Helpers.escapeHtml(printer.getDisplayName())}</h3>
              <p class="text-sm text-gray-500 mb-4">${Helpers.escapeHtml(printer.model || 'No model specified')}</p>

              <div class="flex flex-col gap-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Power</span>
                  <span>${Formatters.power(printer.powerConsumption.printing)}${printer.hasAms && printer.ams ? ` (+${Formatters.power(printer.ams.powerConsumption.working)} AMS)` : ''}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Purchase Price</span>
                  <span>${Formatters.currency(printer.purchasePrice)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Depreciation</span>
                  <span>${Formatters.pricePerHour(printer.getDepreciationPerHour() + printer.getAmsDepreciationPerHour())}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Hours Used</span>
                  <span>${Formatters.number(printer.currentHours, 1)}h</span>
                </div>
                ${printer.hasAms && printer.ams ? `
                <div class="flex justify-between">
                  <span class="text-gray-500">AMS</span>
                  <span>${printer.ams.name} (${Formatters.currency(printer.ams.purchasePrice)})</span>
                </div>
                ` : ''}
              </div>

              <div class="mt-4">
                <div class="text-sm text-gray-500 mb-1">Lifetime (${Formatters.percent(printer.getLifetimePercentage())})</div>
                <div class="progress">
                  <div class="progress__bar" style="width: ${printer.getLifetimePercentage()}%"></div>
                </div>
              </div>
            </div>
            <div class="card__footer flex justify-end gap-2">
              <button class="btn btn--ghost btn--sm" onclick="App.showPrinterModal('${printer.id}')">Edit</button>
              <button class="btn btn--ghost btn--sm text-error" onclick="App.deletePrinter('${printer.id}')">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderFilaments() {
    const container = document.getElementById('filaments-content');
    const filaments = storage.getFilaments();

    if (filaments.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card__body">
            <div class="empty-state">
              <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              <h3 class="empty-state__title">No filaments yet</h3>
              <p class="empty-state__description">Add your first filament to start calculating costs.</p>
              <button class="btn btn--primary" onclick="App.showFilamentModal()">Add Filament</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid grid--auto-fit">
        ${filaments.map(filament => `
          <div class="card card--interactive" data-filament-id="${filament.id}">
            <div class="card__body">
              <div class="flex items-center gap-3 mb-3">
                <div class="color-swatch color-swatch--lg" style="background-color: ${filament.colorHex}"></div>
                <div>
                  <h3 class="m-0">${Helpers.escapeHtml(filament.getDisplayName())}</h3>
                  <span class="badge badge--gray">${filament.material}</span>
                </div>
              </div>

              <div class="flex flex-col gap-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Spool Price</span>
                  <span>${Formatters.currency(filament.spoolPrice)} / ${Formatters.weight(filament.spoolWeight)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Price per Gram</span>
                  <span>${Formatters.pricePerGram(filament.getPricePerGram())}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Density</span>
                  <span>${filament.density} g/cm³</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Print Temp</span>
                  <span>${Formatters.temperatureRange(filament.printTemp.min, filament.printTemp.max)}</span>
                </div>
              </div>
            </div>
            <div class="card__footer flex justify-end gap-2">
              <button class="btn btn--ghost btn--sm" onclick="App.showFilamentModal('${filament.id}')">Edit</button>
              <button class="btn btn--ghost btn--sm text-error" onclick="App.deleteFilament('${filament.id}')">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderConsumables() {
    const container = document.getElementById('consumables-content');
    const consumables = storage.getConsumables();

    if (consumables.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card__body">
            <div class="empty-state">
              <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              <h3 class="empty-state__title">No consumables yet</h3>
              <p class="empty-state__description">Track nozzles, beds, and other wear parts.</p>
              <button class="btn btn--primary" onclick="App.showConsumableModal()">Add Consumable</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid grid--auto-fit">
        ${consumables.map(consumable => {
          const status = consumable.getWearStatus();
          return `
            <div class="card" data-consumable-id="${consumable.id}">
              <div class="card__body">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h3 class="m-0">${Helpers.escapeHtml(consumable.getDisplayName())}</h3>
                    <span class="badge badge--gray">${consumable.getTypeName()}</span>
                  </div>
                  <span class="badge badge--${status.class}">${status.label}</span>
                </div>

                <div class="flex flex-col gap-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">Unit Price</span>
                    <span>${Formatters.currency(consumable.unitPrice)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Cost per Hour</span>
                    <span>${Formatters.pricePerHour(consumable.getCostPerHour())}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Hours Used</span>
                    <span>${Formatters.number(consumable.currentHours, 1)}h / ${consumable.estimatedLifetimeHours}h</span>
                  </div>
                </div>

                <div class="mt-4">
                  <div class="text-sm text-gray-500 mb-1">Wear (${Formatters.percent(consumable.getWearPercentage())})</div>
                  <div class="progress">
                    <div class="progress__bar progress__bar--${status.class}" style="width: ${consumable.getWearPercentage()}%"></div>
                  </div>
                </div>
              </div>
              <div class="card__footer flex justify-between">
                <button class="btn btn--success btn--sm" onclick="App.markConsumableReplaced('${consumable.id}')">Mark Replaced</button>
                <div class="flex gap-2">
                  <button class="btn btn--ghost btn--sm" onclick="App.showConsumableModal('${consumable.id}')">Edit</button>
                  <button class="btn btn--ghost btn--sm text-error" onclick="App.deleteConsumable('${consumable.id}')">Delete</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderHistory() {
    const container = document.getElementById('history-content');
    const history = storage.getPrintHistory();

    if (history.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card__body">
            <div class="empty-state">
              <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <h3 class="empty-state__title">No print history</h3>
              <p class="empty-state__description">Your saved calculations will appear here.</p>
              <a href="#calculator" class="btn btn--primary">Go to Calculator</a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="card">
        <div class="card__body">
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Time</th>
                  <th>Filament</th>
                  <th>Cost</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${history.map(job => {
                  const statusInfo = job.getStatusInfo();
                  return `
                    <tr>
                      <td>
                        <div class="font-medium">${Helpers.escapeHtml(job.name)}</div>
                        <span class="badge badge--${statusInfo.class}">${statusInfo.label}</span>
                      </td>
                      <td>${job.getFormattedTime()}</td>
                      <td>${job.getFormattedWeight()}</td>
                      <td class="font-semibold">${job.getFormattedTotal()}</td>
                      <td>${job.getDisplayDate()}</td>
                      <td>
                        <button class="btn btn--ghost btn--sm text-error" onclick="App.deletePrintJob('${job.id}')">Delete</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderCompare() {
    const container = document.getElementById('compare-content');
    const printers = storage.getPrinters();
    const filaments = storage.getFilaments();
    const settings = storage.getSettings();

    // Check if we have enough data to compare
    if (printers.length === 0 || filaments.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card__body">
            <div class="empty-state">
              <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              <h3 class="empty-state__title">Not Enough Data</h3>
              <p class="empty-state__description">Add at least one printer and one filament to compare costs.</p>
              <div class="flex gap-2 justify-center">
                <button class="btn btn--primary" onclick="App.showPrinterModal()">Add Printer</button>
                <button class="btn btn--secondary" onclick="App.showFilamentModal()">Add Filament</button>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid grid--2 mb-6">
        <!-- Print Settings -->
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">Print Settings</h3>
          </div>
          <div class="card__body">
            <div class="grid grid--2">
              <div class="form-group">
                <label class="form-label">Print Time (minutes)</label>
                <input type="number" class="form-input" id="compare-time" min="1" value="60">
              </div>
              <div class="form-group">
                <label class="form-label">Filament (grams)</label>
                <input type="number" class="form-input" id="compare-grams" min="1" value="20">
              </div>
            </div>
            <div class="grid grid--2">
              <div class="form-group">
                <label class="form-label">Electricity Rate</label>
                <div class="input-group">
                  <input type="number" class="form-input" id="compare-electricity" min="0" step="0.01" value="${settings.electricityRate || 0.15}">
                  <span class="input-group__addon">/kWh</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Failure Rate</label>
                <div class="input-group">
                  <input type="number" class="form-input" id="compare-failure" min="0" max="100" value="${(settings.defaultFailureRate || 0.05) * 100}">
                  <span class="input-group__addon">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scenario Builder -->
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">Add Scenario</h3>
          </div>
          <div class="card__body">
            <div class="form-group">
              <label class="form-label">Scenario Name</label>
              <input type="text" class="form-input" id="compare-name" placeholder="e.g., Budget Option">
            </div>
            <div class="grid grid--2">
              <div class="form-group">
                <label class="form-label">Printer</label>
                <select class="form-select" id="compare-printer">
                  ${printers.map(p => `<option value="${p.id}">${Helpers.escapeHtml(p.getDisplayName())}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Filament</label>
                <select class="form-select" id="compare-filament">
                  ${filaments.map(f => `<option value="${f.id}">${Helpers.escapeHtml(f.getDisplayName())}</option>`).join('')}
                </select>
              </div>
            </div>
            <button class="btn btn--primary" style="width: 100%" onclick="App.addCompareScenario()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Scenario
            </button>
          </div>
        </div>
      </div>

      <!-- Scenarios List -->
      <div class="card mb-6">
        <div class="card__header">
          <h3 class="card__title">Scenarios</h3>
          <button class="btn btn--ghost btn--sm" onclick="App.clearCompareScenarios()" ${this.compareScenarios?.length ? '' : 'disabled'}>
            Clear All
          </button>
        </div>
        <div class="card__body" id="compare-scenarios-list">
          ${this.renderCompareScenarios()}
        </div>
      </div>

      <!-- Comparison Chart -->
      <div class="card mb-6" id="compare-chart-container" style="display: ${this.compareScenarios?.length >= 2 ? 'block' : 'none'}">
        <div class="card__header">
          <h3 class="card__title">Cost Comparison</h3>
        </div>
        <div class="card__body">
          <div style="height: 350px;">
            <canvas id="compare-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Comparison Table -->
      <div class="card" id="compare-table-container" style="display: ${this.compareScenarios?.length >= 2 ? 'block' : 'none'}">
        <div class="card__header">
          <h3 class="card__title">Detailed Comparison</h3>
        </div>
        <div class="card__body">
          <div class="table-container" id="compare-table">
            ${this.renderCompareTable()}
          </div>
        </div>
      </div>
    `;

    // Render chart if we have scenarios
    if (this.compareScenarios?.length >= 2) {
      this.updateCompareChart();
    }
  },

  // Store comparison scenarios
  compareScenarios: [],

  renderCompareScenarios() {
    if (!this.compareScenarios || this.compareScenarios.length === 0) {
      return `
        <div class="empty-state">
          <p class="text-gray-500">Add at least 2 scenarios to compare. Try different printer/filament combinations!</p>
        </div>
      `;
    }

    return `
      <div class="flex flex-wrap gap-3">
        ${this.compareScenarios.map((scenario, index) => `
          <div class="badge badge--lg" style="background-color: ${this.getScenarioColor(index)}20; color: ${this.getScenarioColor(index)}; border: 1px solid ${this.getScenarioColor(index)};">
            <span class="font-medium">${Helpers.escapeHtml(scenario.name)}</span>
            <span class="ml-2">${Formatters.currency(scenario.total)}</span>
            <button class="ml-2" onclick="App.removeCompareScenario(${index})" style="background: none; border: none; cursor: pointer; padding: 0; margin-left: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderCompareTable() {
    if (!this.compareScenarios || this.compareScenarios.length < 2) {
      return '';
    }

    const rows = [
      { label: 'Printer', key: 'printerName' },
      { label: 'Filament', key: 'filamentName' },
      { label: 'Filament Cost', key: 'filament', format: 'currency' },
      { label: 'Electricity Cost', key: 'electricity', format: 'currency' },
      { label: 'Depreciation', key: 'depreciation', format: 'currency' },
      { label: 'Consumables', key: 'consumables', format: 'currency' },
      { label: 'Subtotal', key: 'subtotal', format: 'currency' },
      { label: 'Failure Buffer', key: 'failureBuffer', format: 'currency' },
      { label: 'Total', key: 'total', format: 'currency', highlight: true },
    ];

    // Find min and max totals
    const totals = this.compareScenarios.map(s => s.total);
    const minTotal = Math.min(...totals);
    const maxTotal = Math.max(...totals);

    return `
      <table class="table">
        <thead>
          <tr>
            <th>Cost Element</th>
            ${this.compareScenarios.map((s, i) => `
              <th style="border-bottom: 3px solid ${this.getScenarioColor(i)}">
                ${Helpers.escapeHtml(s.name)}
                ${s.total === minTotal ? '<span class="badge badge--success ml-1">Cheapest</span>' : ''}
                ${s.total === maxTotal && this.compareScenarios.length > 1 ? '<span class="badge badge--warning ml-1">Most Expensive</span>' : ''}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr class="${row.highlight ? 'font-semibold' : ''}">
              <td>${row.label}</td>
              ${this.compareScenarios.map(s => {
                const value = row.key.includes('.')
                  ? row.key.split('.').reduce((o, k) => o?.[k], s)
                  : s[row.key] ?? s.costs?.[row.key];

                if (row.format === 'currency') {
                  return `<td>${Formatters.currency(value || 0)}</td>`;
                }
                return `<td>${Helpers.escapeHtml(value || '-')}</td>`;
              }).join('')}
            </tr>
          `).join('')}
          <tr class="bg-gray-50">
            <td><strong>Difference from Cheapest</strong></td>
            ${this.compareScenarios.map(s => {
              const diff = s.total - minTotal;
              if (diff === 0) {
                return '<td class="text-success">-</td>';
              }
              return `<td class="text-error">+${Formatters.currency(diff)} (+${Formatters.percent((diff / minTotal) * 100)})</td>`;
            }).join('')}
          </tr>
        </tbody>
      </table>
    `;
  },

  getScenarioColor(index) {
    const colors = [
      '#3b82f6', // blue
      '#ef4444', // red
      '#22c55e', // green
      '#f59e0b', // amber
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
    ];
    return colors[index % colors.length];
  },

  addCompareScenario() {
    const name = document.getElementById('compare-name').value || `Scenario ${(this.compareScenarios?.length || 0) + 1}`;
    const printerId = document.getElementById('compare-printer').value;
    const filamentId = document.getElementById('compare-filament').value;
    const printTime = Helpers.parseNumber(document.getElementById('compare-time').value, 60);
    const filamentGrams = Helpers.parseNumber(document.getElementById('compare-grams').value, 20);
    const electricityRate = Helpers.parseNumber(document.getElementById('compare-electricity').value, 0.15);
    const failureRate = Helpers.parseNumber(document.getElementById('compare-failure').value, 5) / 100;

    const printer = storage.getPrinter(printerId);
    const filament = storage.getFilament(filamentId);

    if (!printer || !filament) {
      this.showToast('Please select a printer and filament', 'error');
      return;
    }

    const consumables = storage.getConsumablesForPrinter(printerId);

    const result = costCalculator.calculate({
      printer,
      filament,
      consumables,
      printTimeMinutes: printTime,
      filamentGrams,
      electricityRate,
      failureRate,
      laborHourlyRate: 0,
      laborHours: 0,
      markupPercent: 0,
    });

    if (!this.compareScenarios) {
      this.compareScenarios = [];
    }

    this.compareScenarios.push({
      name,
      printerName: printer.getDisplayName(),
      filamentName: filament.getDisplayName(),
      filament: result.breakdown.filament.cost,
      electricity: result.breakdown.electricity.cost,
      depreciation: result.breakdown.depreciation.cost,
      consumables: result.breakdown.consumables.totalCost,
      subtotal: result.subtotal,
      failureBuffer: result.failureBuffer,
      total: result.total,
      costs: {
        filament: result.breakdown.filament.cost,
        electricity: result.breakdown.electricity.cost,
        depreciation: result.breakdown.depreciation.cost,
        consumables: result.breakdown.consumables.totalCost,
        failureBuffer: result.failureBuffer,
      },
    });

    // Clear name input
    document.getElementById('compare-name').value = '';

    // Update the UI
    this.updateCompareUI();
    this.showToast(`Added "${name}" to comparison`, 'success');
  },

  removeCompareScenario(index) {
    this.compareScenarios.splice(index, 1);
    this.updateCompareUI();
  },

  clearCompareScenarios() {
    this.compareScenarios = [];
    this.updateCompareUI();
  },

  updateCompareUI() {
    // Update scenarios list
    const listContainer = document.getElementById('compare-scenarios-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderCompareScenarios();
    }

    // Update table
    const tableContainer = document.getElementById('compare-table');
    if (tableContainer) {
      tableContainer.innerHTML = this.renderCompareTable();
    }

    // Show/hide chart and table containers
    const chartContainer = document.getElementById('compare-chart-container');
    const tableContainerOuter = document.getElementById('compare-table-container');

    if (this.compareScenarios?.length >= 2) {
      if (chartContainer) chartContainer.style.display = 'block';
      if (tableContainerOuter) tableContainerOuter.style.display = 'block';
      this.updateCompareChart();
    } else {
      if (chartContainer) chartContainer.style.display = 'none';
      if (tableContainerOuter) tableContainerOuter.style.display = 'none';
    }
  },

  updateCompareChart() {
    if (!this.compareScenarios || this.compareScenarios.length < 2) return;

    ChartManager.createComparison('compare-chart', this.compareScenarios);
  },

  // ============================================================
  // Modals
  // ============================================================

  showModal(title, content, options = {}) {
    const container = document.getElementById('modal-container');
    this._modalHasChanges = false;
    this._modalConfirmClose = options.confirmClose ?? false;

    container.innerHTML = `
      <div class="modal-backdrop open" id="modal-backdrop">
        <div class="modal ${options.size ? `modal--${options.size}` : ''}">
          <div class="modal__header">
            <h2 class="modal__title">${title}</h2>
            <button class="modal__close" onclick="App.tryCloseModal()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal__body">
            ${content}
          </div>
          ${options.footer ? `<div class="modal__footer">${options.footer}</div>` : ''}
        </div>
      </div>
    `;

    // Track changes in form inputs
    if (options.confirmClose) {
      container.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('input', () => { this._modalHasChanges = true; });
        el.addEventListener('change', () => { this._modalHasChanges = true; });
      });
    }

    // Do NOT close on backdrop click - modal stays open until explicitly closed
    // (removed backdrop click handler)

    // Close on Escape key (with confirmation if needed)
    document.addEventListener('keydown', this._escapeHandler = (e) => {
      if (e.key === 'Escape') this.tryCloseModal();
    });
  },

  tryCloseModal() {
    if (this._modalConfirmClose && this._modalHasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        this.closeModal();
      }
    } else {
      this.closeModal();
    }
  },

  closeModal() {
    const container = document.getElementById('modal-container');
    container.innerHTML = '';
    this._modalHasChanges = false;
    this._modalConfirmClose = false;
    document.removeEventListener('keydown', this._escapeHandler);
  },

  showWelcomeModal() {
    const regions = CONFIG.getElectricityRatesByRegion();

    let optionsHtml = '';
    for (const [region, locations] of Object.entries(regions)) {
      optionsHtml += `<optgroup label="${region}">`;
      locations.forEach(loc => {
        optionsHtml += `<option value="${loc.key}">${loc.name} (${Formatters.electricityRate(loc.rate)})</option>`;
      });
      optionsHtml += '</optgroup>';
    }

    const content = `
      <div class="text-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-primary); margin-bottom: 1rem;"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        <h3>Welcome to PrintCost!</h3>
        <p class="text-gray-500">Let's set up your location to get accurate electricity rates.</p>
      </div>

      <div class="form-group">
        <label class="form-label">Select Your Location</label>
        <select class="form-select" id="welcome-location">
          ${optionsHtml}
        </select>
      </div>
    `;

    const footer = `
      <button class="btn btn--secondary" onclick="App.skipWelcome()">Skip for Now</button>
      <button class="btn btn--primary" onclick="App.completeWelcome()">Get Started</button>
    `;

    this.showModal('Welcome!', content, { footer });
  },

  skipWelcome() {
    storage.completeFirstLaunch();
    this.closeModal();
  },

  completeWelcome() {
    const location = document.getElementById('welcome-location').value;
    const rate = CONFIG.getElectricityRate(location);

    storage.saveSetting('location', location);
    storage.saveSetting('electricityRate', rate);
    storage.completeFirstLaunch();

    this.closeModal();
    this.showToast(`Location set! Electricity rate: ${Formatters.electricityRate(rate)}`, 'success');
  },

  showSettingsModal() {
    const settings = storage.getSettings();
    const regions = CONFIG.getElectricityRatesByRegion();

    let optionsHtml = '';
    for (const [region, locations] of Object.entries(regions)) {
      optionsHtml += `<optgroup label="${region}">`;
      locations.forEach(loc => {
        const selected = loc.key === settings.location ? 'selected' : '';
        optionsHtml += `<option value="${loc.key}" ${selected}>${loc.name} (${Formatters.electricityRate(loc.rate)})</option>`;
      });
      optionsHtml += '</optgroup>';
    }

    const content = `
      <div class="form-group">
        <label class="form-label">Location</label>
        <select class="form-select" id="settings-location">
          ${optionsHtml}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Custom Electricity Rate (overrides location)</label>
        <div class="input-group">
          <input type="number" class="form-input" id="settings-electricity" min="0" step="0.01" value="${settings.electricityRate || 0.15}">
          <span class="input-group__addon">/kWh</span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Default Failure Rate</label>
        <div class="input-group">
          <input type="number" class="form-input" id="settings-failure" min="0" max="100" step="1" value="${(settings.defaultFailureRate || 0.05) * 100}">
          <span class="input-group__addon">%</span>
        </div>
      </div>

      <hr class="my-4">

      <div class="alert alert--warning">
        <strong>Danger Zone</strong>
        <p class="m-0 mt-2">
          <button class="btn btn--danger btn--sm" onclick="App.clearAllData()">Clear All Data</button>
        </p>
      </div>
    `;

    const footer = `
      <button class="btn btn--secondary" onclick="App.tryCloseModal()">Cancel</button>
      <button class="btn btn--primary" onclick="App.saveSettings()">Save Settings</button>
    `;

    this.showModal('Settings', content, { footer, confirmClose: true });

    // Update rate when location changes
    document.getElementById('settings-location').addEventListener('change', (e) => {
      const rate = CONFIG.getElectricityRate(e.target.value);
      document.getElementById('settings-electricity').value = rate;
    });
  },

  saveSettings() {
    const location = document.getElementById('settings-location').value;
    const electricityRate = Helpers.parseNumber(document.getElementById('settings-electricity').value, 0.15);
    const failureRate = Helpers.parseNumber(document.getElementById('settings-failure').value, 5) / 100;

    storage.saveSetting('location', location);
    storage.saveSetting('electricityRate', electricityRate);
    storage.saveSetting('defaultFailureRate', failureRate);

    this.closeModal();
    this.showToast('Settings saved', 'success');
  },

  clearAllData() {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
      storage.clearAll();
      this.closeModal();
      this.showToast('All data cleared', 'success');
      this.renderPage(this.currentPage);
    }
  },

  showPrinterModal(printerId = null) {
    const printer = printerId ? storage.getPrinter(printerId) : new Printer();
    const isEdit = !!printerId;

    // Build preset options grouped by manufacturer
    const presets = CONFIG.getPrinterPresetsByManufacturer();
    let presetOptionsHtml = '<option value="">-- Select a preset (optional) --</option>';
    for (const [manufacturer, printers] of Object.entries(presets)) {
      presetOptionsHtml += `<optgroup label="${manufacturer}">`;
      printers.forEach(p => {
        presetOptionsHtml += `<option value="${p.key}">${p.name} (${p.buildVolume})</option>`;
      });
      presetOptionsHtml += '</optgroup>';
    }

    const content = `
      ${!isEdit ? `
        <div class="form-group">
          <label class="form-label">Load from Preset</label>
          <select class="form-select" id="printer-preset">
            ${presetOptionsHtml}
          </select>
          <div class="form-hint">Select a printer to auto-fill specs, or enter manually below</div>
        </div>
        <hr class="my-4">
      ` : ''}

      <div class="form-group">
        <label class="form-label form-label--required">Name</label>
        <input type="text" class="form-input" id="printer-name" value="${Helpers.escapeHtml(printer.name)}" placeholder="e.g., My Prusa MK3S+">
      </div>

      <div class="grid grid--2">
        <div class="form-group">
          <label class="form-label">Manufacturer</label>
          <input type="text" class="form-input" id="printer-manufacturer" value="${Helpers.escapeHtml(printer.manufacturer)}" placeholder="e.g., Prusa">
        </div>
        <div class="form-group">
          <label class="form-label">Model</label>
          <input type="text" class="form-input" id="printer-model" value="${Helpers.escapeHtml(printer.model)}" placeholder="e.g., MK3S+">
        </div>
      </div>

      <h4 class="mt-4 mb-2">Power Consumption</h4>
      <div class="grid grid--3">
        <div class="form-group">
          <label class="form-label">Printing (W)</label>
          <input type="number" class="form-input" id="printer-power-printing" min="0" value="${printer.powerConsumption.printing}">
        </div>
        <div class="form-group">
          <label class="form-label">Idle (W)</label>
          <input type="number" class="form-input" id="printer-power-idle" min="0" value="${printer.powerConsumption.idle}">
        </div>
        <div class="form-group">
          <label class="form-label">Heated (W)</label>
          <input type="number" class="form-input" id="printer-power-heated" min="0" value="${printer.powerConsumption.heated}">
        </div>
      </div>

      <h4 class="mt-4 mb-2">Depreciation</h4>
      <div class="grid grid--2">
        <div class="form-group">
          <label class="form-label">Purchase Price</label>
          <div class="input-group">
            <input type="number" class="form-input" id="printer-price" min="0" step="0.01" value="${printer.purchasePrice}">
            <span class="input-group__addon">${CONFIG.CURRENCY.symbol}</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Expected Lifetime</label>
          <div class="input-group">
            <input type="number" class="form-input" id="printer-lifetime" min="1" value="${printer.estimatedLifetimeHours}">
            <span class="input-group__addon">hours</span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Current Hours Used</label>
        <input type="number" class="form-input" id="printer-hours" min="0" step="0.1" value="${printer.currentHours}">
      </div>

      <div class="form-group">
        <label class="form-label">Default Failure Rate</label>
        <div class="input-group">
          <input type="number" class="form-input" id="printer-failure" min="0" max="100" step="1" value="${printer.defaultFailureRate * 100}">
          <span class="input-group__addon">%</span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="printer-notes" rows="2">${Helpers.escapeHtml(printer.notes)}</textarea>
      </div>

      <h4 class="mt-4 mb-2">AMS (Automatic Material System)</h4>
      <div class="form-group">
        <label class="form-checkbox">
          <input type="checkbox" id="printer-has-ams" ${printer.hasAms ? 'checked' : ''}>
          <span>This printer has an AMS attached</span>
        </label>
      </div>

      <div id="ams-settings" class="${printer.hasAms ? '' : 'hidden'}">
        <div class="form-group">
          <label class="form-label">AMS Model</label>
          <select class="form-select" id="printer-ams-type">
            <option value="">-- Select AMS model --</option>
            ${Object.entries(CONFIG.AMS_PRESETS).map(([key, ams]) =>
              `<option value="${key}" ${printer.ams?.type === key ? 'selected' : ''}>${ams.name}</option>`
            ).join('')}
          </select>
        </div>

        <div class="grid grid--2">
          <div class="form-group">
            <label class="form-label">AMS Power (Working)</label>
            <div class="input-group">
              <input type="number" class="form-input" id="printer-ams-power" min="0" step="0.01" value="${printer.ams?.powerConsumption?.working || 0}" readonly>
              <span class="input-group__addon">W</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">AMS Purchase Price</label>
            <div class="input-group">
              <input type="number" class="form-input" id="printer-ams-price" min="0" step="0.01" value="${printer.ams?.purchasePrice || 0}">
              <span class="input-group__addon">${CONFIG.CURRENCY.symbol}</span>
            </div>
          </div>
        </div>

        <div class="grid grid--2">
          <div class="form-group">
            <label class="form-label">AMS Lifetime</label>
            <div class="input-group">
              <input type="number" class="form-input" id="printer-ams-lifetime" min="1" value="${printer.ams?.estimatedLifetimeHours || 5000}">
              <span class="input-group__addon">hours</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">AMS Hours Used</label>
            <input type="number" class="form-input" id="printer-ams-hours" min="0" step="0.1" value="${printer.ams?.currentHours || 0}">
          </div>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn--secondary" onclick="App.tryCloseModal()">Cancel</button>
      <button class="btn btn--primary" onclick="App.savePrinter('${printer.id}')">${isEdit ? 'Save Changes' : 'Add Printer'}</button>
    `;

    this.showModal(isEdit ? 'Edit Printer' : 'Add Printer', content, { footer, size: 'lg', confirmClose: true });

    // AMS checkbox toggle
    document.getElementById('printer-has-ams').addEventListener('change', (e) => {
      const amsSettings = document.getElementById('ams-settings');
      if (e.target.checked) {
        amsSettings.classList.remove('hidden');
      } else {
        amsSettings.classList.add('hidden');
      }
    });

    // AMS type selector
    document.getElementById('printer-ams-type').addEventListener('change', (e) => {
      const amsKey = e.target.value;
      if (!amsKey) return;

      const amsPreset = CONFIG.AMS_PRESETS[amsKey];
      if (!amsPreset) return;

      document.getElementById('printer-ams-power').value = amsPreset.powerConsumption.working;
      document.getElementById('printer-ams-lifetime').value = amsPreset.estimatedLifetimeHours;
    });

    // Add preset selector event listener (only for new printers)
    if (!isEdit) {
      document.getElementById('printer-preset').addEventListener('change', (e) => {
        const presetKey = e.target.value;
        if (!presetKey) return;

        const preset = CONFIG.PRINTER_PRESETS[presetKey];
        if (!preset) return;

        // Auto-fill the form fields
        document.getElementById('printer-name').value = `My ${preset.manufacturer} ${preset.name}`;
        document.getElementById('printer-manufacturer').value = preset.manufacturer;
        document.getElementById('printer-model').value = preset.model;
        document.getElementById('printer-power-printing').value = preset.powerConsumption.printing;
        document.getElementById('printer-power-idle').value = preset.powerConsumption.idle;
        document.getElementById('printer-power-heated').value = preset.powerConsumption.heated;
        document.getElementById('printer-lifetime').value = preset.estimatedLifetimeHours;

        this.showToast(`Loaded ${preset.manufacturer} ${preset.name} preset`, 'success');
      });
    }
  },

  savePrinter(printerId) {
    const hasAms = document.getElementById('printer-has-ams').checked;
    const amsType = document.getElementById('printer-ams-type').value;
    const amsPreset = amsType ? CONFIG.AMS_PRESETS[amsType] : null;

    const printerData = {
      id: printerId,
      name: document.getElementById('printer-name').value,
      manufacturer: document.getElementById('printer-manufacturer').value,
      model: document.getElementById('printer-model').value,
      powerConsumption: {
        printing: Helpers.parseNumber(document.getElementById('printer-power-printing').value, 120),
        idle: Helpers.parseNumber(document.getElementById('printer-power-idle').value, 10),
        heated: Helpers.parseNumber(document.getElementById('printer-power-heated').value, 200),
      },
      purchasePrice: Helpers.parseNumber(document.getElementById('printer-price').value, 0),
      estimatedLifetimeHours: Helpers.parseNumber(document.getElementById('printer-lifetime').value, 5000),
      currentHours: Helpers.parseNumber(document.getElementById('printer-hours').value, 0),
      defaultFailureRate: Helpers.parseNumber(document.getElementById('printer-failure').value, 5) / 100,
      notes: document.getElementById('printer-notes').value,
      hasAms: hasAms,
    };

    if (hasAms && amsType) {
      printerData.ams = {
        type: amsType,
        name: amsPreset?.name || '',
        powerConsumption: {
          standby: amsPreset?.powerConsumption?.standby || 0,
          working: Helpers.parseNumber(document.getElementById('printer-ams-power').value, 0),
        },
        purchasePrice: Helpers.parseNumber(document.getElementById('printer-ams-price').value, 0),
        estimatedLifetimeHours: Helpers.parseNumber(document.getElementById('printer-ams-lifetime').value, 5000),
        currentHours: Helpers.parseNumber(document.getElementById('printer-ams-hours').value, 0),
      };
    }

    const printer = new Printer(printerData);

    if (!printer.name.trim()) {
      this.showToast('Please enter a printer name', 'error');
      return;
    }

    storage.savePrinter(printer);
    this.closeModal();
    this.showToast('Printer saved', 'success');
    this.renderPage('printers');
  },

  deletePrinter(printerId) {
    if (confirm('Are you sure you want to delete this printer?')) {
      storage.deletePrinter(printerId);
      this.showToast('Printer deleted', 'success');
      this.renderPage('printers');
    }
  },

  showFilamentModal(filamentId = null) {
    const filament = filamentId ? storage.getFilament(filamentId) : new Filament();
    const isEdit = !!filamentId;

    const materialOptions = Object.keys(CONFIG.MATERIALS).map(m =>
      `<option value="${m}" ${filament.material === m ? 'selected' : ''}>${m}</option>`
    ).join('');

    const content = `
      <div class="form-group">
        <label class="form-label">Name</label>
        <input type="text" class="form-input" id="filament-name" value="${Helpers.escapeHtml(filament.name)}" placeholder="e.g., Prusament PLA Galaxy Black">
      </div>

      <div class="grid grid--2">
        <div class="form-group">
          <label class="form-label">Manufacturer</label>
          <input type="text" class="form-input" id="filament-manufacturer" value="${Helpers.escapeHtml(filament.manufacturer)}" placeholder="e.g., Prusament">
        </div>
        <div class="form-group">
          <label class="form-label form-label--required">Material</label>
          <select class="form-select" id="filament-material">
            ${materialOptions}
          </select>
        </div>
      </div>

      <div class="grid grid--2">
        <div class="form-group">
          <label class="form-label">Color Name</label>
          <input type="text" class="form-input" id="filament-color" value="${Helpers.escapeHtml(filament.color)}" placeholder="e.g., Galaxy Black">
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <input type="color" class="form-input" id="filament-color-hex" value="${filament.colorHex}" style="height: 42px; padding: 4px;">
        </div>
      </div>

      <h4 class="mt-4 mb-2">Pricing</h4>
      <div class="grid grid--2">
        <div class="form-group">
          <label class="form-label form-label--required">Spool Price</label>
          <div class="input-group">
            <input type="number" class="form-input" id="filament-price" min="0" step="0.01" value="${filament.spoolPrice}">
            <span class="input-group__addon">${CONFIG.CURRENCY.symbol}</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label form-label--required">Spool Weight</label>
          <div class="input-group">
            <input type="number" class="form-input" id="filament-weight" min="1" value="${filament.spoolWeight}">
            <span class="input-group__addon">g</span>
          </div>
        </div>
      </div>

      <h4 class="mt-4 mb-2">Properties</h4>
      <div class="grid grid--2">
        <div class="form-group">
          <label class="form-label">Diameter</label>
          <div class="input-group">
            <input type="number" class="form-input" id="filament-diameter" min="0" step="0.01" value="${filament.diameter}">
            <span class="input-group__addon">mm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Density</label>
          <div class="input-group">
            <input type="number" class="form-input" id="filament-density" min="0" step="0.01" value="${filament.density}">
            <span class="input-group__addon">g/cm³</span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="filament-notes" rows="2">${Helpers.escapeHtml(filament.notes)}</textarea>
      </div>
    `;

    const footer = `
      <button class="btn btn--secondary" onclick="App.tryCloseModal()">Cancel</button>
      <button class="btn btn--primary" onclick="App.saveFilament('${filament.id}')">${isEdit ? 'Save Changes' : 'Add Filament'}</button>
    `;

    this.showModal(isEdit ? 'Edit Filament' : 'Add Filament', content, { footer, size: 'lg', confirmClose: true });

    // Update density when material changes
    document.getElementById('filament-material').addEventListener('change', (e) => {
      const material = e.target.value;
      if (CONFIG.MATERIALS[material]) {
        document.getElementById('filament-density').value = CONFIG.MATERIALS[material].density;
      }
    });
  },

  saveFilament(filamentId) {
    const filament = new Filament({
      id: filamentId,
      name: document.getElementById('filament-name').value,
      manufacturer: document.getElementById('filament-manufacturer').value,
      material: document.getElementById('filament-material').value,
      color: document.getElementById('filament-color').value,
      colorHex: document.getElementById('filament-color-hex').value,
      spoolPrice: Helpers.parseNumber(document.getElementById('filament-price').value, 25),
      spoolWeight: Helpers.parseNumber(document.getElementById('filament-weight').value, 1000),
      diameter: Helpers.parseNumber(document.getElementById('filament-diameter').value, 1.75),
      density: Helpers.parseNumber(document.getElementById('filament-density').value, 1.24),
      notes: document.getElementById('filament-notes').value,
    });

    storage.saveFilament(filament);
    this.closeModal();
    this.showToast('Filament saved', 'success');
    this.renderPage('filaments');
  },

  deleteFilament(filamentId) {
    if (confirm('Are you sure you want to delete this filament?')) {
      storage.deleteFilament(filamentId);
      this.showToast('Filament deleted', 'success');
      this.renderPage('filaments');
    }
  },

  showConsumableModal(consumableId = null) {
    const consumable = consumableId ? storage.getConsumable(consumableId) : new Consumable();
    const isEdit = !!consumableId;
    const printers = storage.getPrinters();

    const typeOptions = Object.entries(CONFIG.CONSUMABLE_TYPES).map(([key, val]) =>
      `<option value="${key}" ${consumable.type === key ? 'selected' : ''}>${val.name}</option>`
    ).join('');

    const printerOptions = printers.map(p =>
      `<option value="${p.id}" ${consumable.printerId === p.id ? 'selected' : ''}>${Helpers.escapeHtml(p.getDisplayName())}</option>`
    ).join('');

    const content = `
      <div class="grid grid--2">
        <div class="form-group">
          <label class="form-label form-label--required">Type</label>
          <select class="form-select" id="consumable-type">
            ${typeOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Associated Printer</label>
          <select class="form-select" id="consumable-printer">
            <option value="">None (shared)</option>
            ${printerOptions}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Custom Name (optional)</label>
        <input type="text" class="form-input" id="consumable-name" value="${Helpers.escapeHtml(consumable.name)}" placeholder="Leave blank to use type name">
      </div>

      <div class="grid grid--2">
        <div class="form-group">
          <label class="form-label form-label--required">Unit Price</label>
          <div class="input-group">
            <input type="number" class="form-input" id="consumable-price" min="0" step="0.01" value="${consumable.unitPrice}">
            <span class="input-group__addon">${CONFIG.CURRENCY.symbol}</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label form-label--required">Expected Lifetime</label>
          <div class="input-group">
            <input type="number" class="form-input" id="consumable-lifetime" min="1" value="${consumable.estimatedLifetimeHours}">
            <span class="input-group__addon">hours</span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Current Hours Used</label>
        <input type="number" class="form-input" id="consumable-hours" min="0" step="0.1" value="${consumable.currentHours}">
      </div>

      <div class="form-group">
        <label class="form-label">Quantity in Stock</label>
        <input type="number" class="form-input" id="consumable-quantity" min="0" value="${consumable.quantity}">
      </div>

      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="consumable-notes" rows="2">${Helpers.escapeHtml(consumable.notes)}</textarea>
      </div>
    `;

    const footer = `
      <button class="btn btn--secondary" onclick="App.tryCloseModal()">Cancel</button>
      <button class="btn btn--primary" onclick="App.saveConsumable('${consumable.id}')">${isEdit ? 'Save Changes' : 'Add Consumable'}</button>
    `;

    this.showModal(isEdit ? 'Edit Consumable' : 'Add Consumable', content, { footer, confirmClose: true });

    // Update defaults when type changes
    document.getElementById('consumable-type').addEventListener('change', (e) => {
      const type = e.target.value;
      if (CONFIG.CONSUMABLE_TYPES[type]) {
        document.getElementById('consumable-price').value = CONFIG.CONSUMABLE_TYPES[type].defaultPrice;
        document.getElementById('consumable-lifetime').value = CONFIG.CONSUMABLE_TYPES[type].defaultLifetimeHours;
      }
    });
  },

  saveConsumable(consumableId) {
    const consumable = new Consumable({
      id: consumableId,
      name: document.getElementById('consumable-name').value,
      type: document.getElementById('consumable-type').value,
      printerId: document.getElementById('consumable-printer').value || null,
      unitPrice: Helpers.parseNumber(document.getElementById('consumable-price').value, 10),
      estimatedLifetimeHours: Helpers.parseNumber(document.getElementById('consumable-lifetime').value, 500),
      currentHours: Helpers.parseNumber(document.getElementById('consumable-hours').value, 0),
      quantity: Helpers.parseInt(document.getElementById('consumable-quantity').value, 1),
      notes: document.getElementById('consumable-notes').value,
    });

    storage.saveConsumable(consumable);
    this.closeModal();
    this.showToast('Consumable saved', 'success');
    this.renderPage('consumables');
  },

  deleteConsumable(consumableId) {
    if (confirm('Are you sure you want to delete this consumable?')) {
      storage.deleteConsumable(consumableId);
      this.showToast('Consumable deleted', 'success');
      this.renderPage('consumables');
    }
  },

  markConsumableReplaced(consumableId) {
    const consumable = storage.getConsumable(consumableId);
    if (consumable) {
      consumable.markReplaced();
      storage.saveConsumable(consumable);
      this.showToast('Consumable marked as replaced', 'success');
      this.renderPage('consumables');
    }
  },

  deletePrintJob(jobId) {
    if (confirm('Are you sure you want to delete this print from history?')) {
      storage.deletePrintJob(jobId);
      this.showToast('Print deleted from history', 'success');
      this.renderPage('history');
    }
  },

  // ============================================================
  // Toast Notifications
  // ============================================================

  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const id = `toast-${Date.now()}`;

    const icons = {
      success: '<svg class="toast__icon toast__icon--success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg class="toast__icon toast__icon--error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg class="toast__icon toast__icon--warning" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg class="toast__icon toast__icon--info" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = id;
    toast.innerHTML = `
      ${icons[type] || icons.info}
      <div class="toast__content">
        <div class="toast__message">${message}</div>
      </div>
      <button class="toast__close" onclick="App.dismissToast('${id}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    container.appendChild(toast);

    // Auto-dismiss
    setTimeout(() => this.dismissToast(id), duration);
  },

  dismissToast(id) {
    const toast = document.getElementById(id);
    if (toast) {
      toast.style.animation = 'slideIn 0.2s ease reverse';
      setTimeout(() => toast.remove(), 200);
    }
  },
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
