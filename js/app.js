/**
 * SkyShield – Aviation Safety & Incident Analysis System
 * Main Application Logic & Decision-Support Simulation
 * 
 * Features:
 * - Simple Authorized Personnel Login Validation
 * - Operations Dashboard with Chart.js analytics
 * - Incident Reporting Form with AI Analysis Simulation
 * - Historical Incident Correlation Table
 * - Recurring Pattern Detection
 * - Possible Root Cause Analysis
 * - Searchable & Filterable Incident Archive
 * - Designed for easy integration with Django REST Framework backend
 */

window.SkyShieldApp = (function() {
  'use strict';

  // -------------------------------------------------------------
  // 1. DATA STORE (Simulated Database / DRF Model Equivalents)
  // -------------------------------------------------------------

  // Historical Incidents Dataset (Matches Django Incident Model schema)
  var historicalIncidents = [
    {
      id: "INC-1023",
      flightNo: "SK-482",
      aircraft: "Boeing 737-800",
      airline: "SkyShield Air",
      date: "2026-08-12",
      time: "14:22",
      phase: "Takeoff",
      type: "Engine",
      system: "Engine 1 Turbine Assembly",
      severity: "High",
      location: "Runway 28L (KJFK)",
      weather: "VMC (Clear Skies)",
      description: "Intermittent N2 compressor vibration peak during takeoff roll at 112 knots. Takeoff rejected below V1 safely.",
      possibleCause: "Maintenance issue / blade micro-fissure",
      similarity: 91,
      status: "Closed CAPA"
    },
    {
      id: "INC-0987",
      flightNo: "NW-210",
      aircraft: "Airbus A320neo",
      airline: "Nordic Wings",
      date: "2026-07-04",
      time: "09:45",
      phase: "Takeoff",
      type: "Engine",
      system: "Engine System",
      severity: "Medium",
      location: "Departure corridor (EGLL)",
      weather: "IMC (Overcast, light rain)",
      description: "Vibration advisory during initial power application. EGT within limits, returned to gate for inspection.",
      possibleCause: "Component wear / seal degradation",
      similarity: 87,
      status: "Closed CAPA"
    },
    {
      id: "INC-0842",
      flightNo: "PA-771",
      aircraft: "Boeing 787-9",
      airline: "Pacific Aero",
      date: "2026-05-19",
      time: "21:10",
      phase: "Climb",
      type: "Engine",
      system: "Turbine Sensor / FADEC",
      severity: "Medium",
      location: "Passing FL180",
      weather: "VMC",
      description: "Sensor divergence on turbine temperature channel B during rapid thrust climb transition.",
      possibleCause: "Improper inspection / calibration gap",
      similarity: 84,
      status: "Under Review"
    },
    {
      id: "INC-0715",
      flightNo: "EA-105",
      aircraft: "Airbus A350-900",
      airline: "EuroAirway",
      date: "2026-02-02",
      time: "17:35",
      phase: "Landing",
      type: "Runway",
      system: "Braking & Anti-Skid System",
      severity: "High",
      location: "Runway 09R (EDDF)",
      weather: "IMC (Contaminated Runway, Slush)",
      description: "Asymmetrical braking response on touchdown rollout; antiskid valve cycle delay in cold weather.",
      possibleCause: "Wet surface calibration / hydraulic valve seal",
      similarity: 81,
      status: "Closed CAPA"
    },
    {
      id: "INC-0654",
      flightNo: "SA-302",
      aircraft: "Embraer E195-E2",
      airline: "Shuttle Aero",
      date: "2026-01-14",
      time: "08:15",
      phase: "Takeoff",
      type: "Engine",
      system: "Fuel Metering Unit",
      severity: "Low",
      location: "Runway 14 (LEBL)",
      weather: "VMC",
      description: "Minor fuel flow deviation indicator during climb-out, self-corrected after power level adjustment.",
      possibleCause: "Component wear / filter residue",
      similarity: 78,
      status: "Closed CAPA"
    },
    {
      id: "INC-0599",
      flightNo: "GA-419",
      aircraft: "Boeing 737-800",
      airline: "Global Shuttle",
      date: "2025-11-28",
      time: "16:40",
      phase: "Cruise",
      type: "Weather",
      system: "Airframe / Cabin",
      severity: "Medium",
      location: "FL370 over Alps",
      weather: "Clear Air Turbulence",
      description: "Moderate unforecasted mountain wave turbulence, cabin crew seatbelt instruction broadcasted.",
      possibleCause: "Weather / Jetstream boundary shear",
      similarity: 74,
      status: "Closed CAPA"
    },
    {
      id: "INC-0512",
      flightNo: "BA-882",
      aircraft: "Airbus A320neo",
      airline: "SkyShield Air",
      date: "2025-10-15",
      time: "11:20",
      phase: "Approach",
      type: "Navigation",
      system: "ILS Glide Slope Receiver",
      severity: "Low",
      location: "Final Approach (LFPG)",
      weather: "IMC (Low Visibility)",
      description: "Brief signal deflection on Localizer channel 1, cross-checked with channel 2 before landing.",
      possibleCause: "Ground antenna multipath interference",
      similarity: 70,
      status: "Closed CAPA"
    },
    {
      id: "INC-0430",
      flightNo: "CA-904",
      aircraft: "Boeing 777-300ER",
      airline: "Pacific Cargo",
      date: "2025-08-09",
      time: "03:50",
      phase: "Taxi",
      type: "Technical",
      system: "Nose Wheel Steering",
      severity: "Low",
      location: "Taxiway Charlie (VHHH)",
      weather: "VMC",
      description: "Tiller centering hydraulic micro-lag during 90-degree turn to gate, ground support tow assisted.",
      possibleCause: "Hydraulic pressure sensor lag",
      similarity: 65,
      status: "Closed CAPA"
    }
  ];

  // Auth State
  var currentUser = null;

  // Chart Instances
  var charts = {};

  // -------------------------------------------------------------
  // 2. INITIALIZATION
  // -------------------------------------------------------------
  function init() {
    // 1. Initialize 3D Rotating Earth & Airplane visual
    var globeContainer = document.getElementById('hero-globe-container');
    if (globeContainer && window.SkyShieldGlobe) {
      SkyShieldGlobe.init(globeContainer);
    }

    // 2. Setup Event Listeners & Forms
    setupAuth();
    setupNavigation();
    setupIncidentForm();
    setupReportsTable();
    setupQuickSamples();

    // 3. Render Initial Dashboard Charts & Tables
    initCharts();
    renderHistoricalTable();
    renderReportsTable(historicalIncidents);
    updateDashboardCounters();

    // 4. Live UTC Clock in top bar
    setupClock();
  }

  // -------------------------------------------------------------
  // 3. AUTHENTICATION (Simulated for Demo)
  // -------------------------------------------------------------
  function setupAuth() {
    var loginForm = document.getElementById('login-form');
    var loginModalEl = document.getElementById('loginModal');
    var loginError = document.getElementById('login-error');
    var navLoginBtn = document.getElementById('nav-login-btn');
    var navLogoutBtn = document.getElementById('nav-logout-btn');
    var userPill = document.getElementById('user-profile-pill');
    var heroLoginBtn = document.getElementById('btn-hero-login');
    var quickFillBtn = document.getElementById('btn-quick-login');

    // Quick demo login filler
    if (quickFillBtn) {
      quickFillBtn.addEventListener('click', function() {
        document.getElementById('login-email').value = 'officer@skyshield.aero';
        document.getElementById('login-password').value = 'safety2026';
      });
    }

    // Open modal from hero button
    if (heroLoginBtn) {
      heroLoginBtn.addEventListener('click', function() {
        var modal = bootstrap.Modal.getOrCreateInstance(loginModalEl);
        modal.show();
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('login-email').value.trim();
        var password = document.getElementById('login-password').value.trim();

        // Simple validation
        if (!email || !password) {
          showLoginError('Please enter both username/email and password.');
          return;
        }

        // Demo login check
        if (password.length < 4) {
          showLoginError('Password must be at least 4 characters for security.');
          return;
        }

        // Success: Set authorized officer state
        currentUser = {
          name: "Capt. Richard Vance",
          role: "Authorized Safety Officer",
          id: "ASO-4921",
          email: email
        };

        // Hide error
        if (loginError) loginError.classList.add('d-none');

        // Close modal
        var modal = bootstrap.Modal.getInstance(loginModalEl);
        if (modal) modal.hide();

        // Update UI to Authorized state
        updateAuthState(true);

        // Smoothly scroll to the Dashboard / Incident Entry
        var dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
          dashboardSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    if (navLogoutBtn) {
      navLogoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        currentUser = null;
        updateAuthState(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    function showLoginError(msg) {
      if (loginError) {
        loginError.innerText = msg;
        loginError.classList.remove('d-none');
      }
    }

    function updateAuthState(isLoggedIn) {
      if (isLoggedIn) {
        if (navLoginBtn) navLoginBtn.classList.add('d-none');
        if (navLogoutBtn) navLogoutBtn.classList.remove('d-none');
        if (userPill) {
          userPill.classList.remove('d-none');
          userPill.querySelector('.officer-name').innerText = currentUser.name;
        }
        // Unlock notification
        showToast('Authorized Safety Officer verified: ' + currentUser.name);
      } else {
        if (navLoginBtn) navLoginBtn.classList.remove('d-none');
        if (navLogoutBtn) navLogoutBtn.classList.add('d-none');
        if (userPill) userPill.classList.add('d-none');
        showToast('You have logged out of the safety terminal.');
      }
    }
  }

  // -------------------------------------------------------------
  // 4. NAVIGATION & SMOOTH SCROLLING
  // -------------------------------------------------------------
  function setupNavigation() {
    var links = document.querySelectorAll('a[href^="#"]');
    links.forEach(function(link) {
      link.addEventListener('click', function(e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#' || !targetId) return;
        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  function setupClock() {
    var clockEl = document.getElementById('utc-clock-display');
    function updateTime() {
      if (clockEl) {
        var now = new Date();
        var h = String(now.getUTCHours()).padStart(2, '0');
        var m = String(now.getUTCMinutes()).padStart(2, '0');
        var s = String(now.getUTCSeconds()).padStart(2, '0');
        clockEl.innerText = h + ':' + m + ':' + s + ' UTC';
      }
    }
    setInterval(updateTime, 1000);
    updateTime();
  }

  // -------------------------------------------------------------
  // 5. CHART.JS VISUALIZATIONS (Clean Aviation Theme)
  // -------------------------------------------------------------
  function initCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') return;

    // Palette: Deep Navy (#0f2347), Sky Blue (#0284c7), Slate (#64748b), Soft fills
    var navyColor = '#0f2347';
    var skyBlue = '#0284c7';
    var amberColor = '#f59e0b';
    var redColor = '#ef4444';
    var greenColor = '#10b981';

    // Chart 1: Incidents by Month
    var ctxMonth = document.getElementById('chart-incidents-month');
    if (ctxMonth) {
      charts.month = new Chart(ctxMonth, {
        type: 'line',
        data: {
          labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
          datasets: [{
            label: 'Reported Occurrences',
            data: [14, 11, 16, 12, 9, 13, 10, 15, 12, 18, 14, 11],
            borderColor: skyBlue,
            backgroundColor: 'rgba(2, 132, 199, 0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: skyBlue,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: navyColor,
              titleFont: { size: 13, weight: 'bold' },
              padding: 10
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#f1f5f9' },
              ticks: { color: '#64748b' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#64748b' }
            }
          }
        }
      });
    }

    // Chart 2: Incidents by Incident Type
    var ctxType = document.getElementById('chart-incidents-type');
    if (ctxType) {
      charts.type = new Chart(ctxType, {
        type: 'doughnut',
        data: {
          labels: ['Engine', 'Technical', 'Weather', 'Runway', 'Human Factor', 'Electrical', 'Navigation'],
          datasets: [{
            data: [36, 28, 22, 18, 16, 12, 10],
            backgroundColor: [
              '#0284c7', // Sky blue
              '#1e3a8a', // Deep navy
              '#38bdf8', // Light sky
              '#f59e0b', // Amber
              '#64748b', // Slate
              '#059669', // Emerald
              '#94a3b8'  // Gray
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { boxWidth: 12, font: { size: 11 }, color: '#475569' }
            }
          },
          cutout: '68%'
        }
      });
    }

    // Chart 3: Risk Level Distribution
    var ctxRisk = document.getElementById('chart-risk-distribution');
    if (ctxRisk) {
      charts.risk = new Chart(ctxRisk, {
        type: 'bar',
        data: {
          labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'],
          datasets: [{
            label: 'Incidents',
            data: [68, 48, 19, 7],
            backgroundColor: [
              '#10b981', // Green
              '#f59e0b', // Amber
              '#ef4444', // Red
              '#991b1b'  // Dark Red
            ],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#f1f5f9' },
              ticks: { color: '#64748b' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#64748b' }
            }
          }
        }
      });
    }

    // Chart 4: Incidents by Flight Phase
    var ctxPhase = document.getElementById('chart-incidents-phase');
    if (ctxPhase) {
      charts.phase = new Chart(ctxPhase, {
        type: 'bar',
        data: {
          labels: ['Pre-flight', 'Taxi', 'Takeoff', 'Climb', 'Cruise', 'Descent', 'Approach', 'Landing'],
          datasets: [{
            label: 'Incidents',
            data: [8, 14, 38, 22, 19, 12, 26, 31],
            backgroundColor: '#0284c7',
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: '#f1f5f9' },
              ticks: { color: '#64748b' }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#64748b' }
            }
          }
        }
      });
    }

    // Chart 5: Recurring Trend Graph (Section 6)
    var ctxRecurring = document.getElementById('chart-recurring-trend');
    if (ctxRecurring) {
      charts.recurring = new Chart(ctxRecurring, {
        type: 'line',
        data: {
          labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Current'],
          datasets: [{
            label: 'Takeoff Engine Vibration Occurrences',
            data: [2, 3, 4, 6, 7, 9],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2.5,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#f59e0b',
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#475569', font: { size: 12 } }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 2, color: '#64748b' },
              grid: { color: '#f1f5f9' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#64748b' }
            }
          }
        }
      });
    }

    // Chart 6: Root Cause Percentage Breakdown (Section 7)
    var ctxRootCauses = document.getElementById('chart-root-causes');
    if (ctxRootCauses) {
      charts.rootCauses = new Chart(ctxRootCauses, {
        type: 'bar',
        data: {
          labels: [
            'Maintenance & Inspection',
            'Human & Crew Factors',
            'Weather & Environmental',
            'Technical Failure',
            'Operational Factors'
          ],
          datasets: [{
            label: 'Contributing Factor %',
            data: [38, 24, 18, 12, 8],
            backgroundColor: [
              '#0284c7', // Sky Blue
              '#38bdf8', // Light blue
              '#64748b', // Slate
              '#f59e0b', // Amber
              '#94a3b8'  // Gray
            ],
            borderRadius: 5
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) { return context.raw + '% of analyzed historical cases'; }
              }
            }
          },
          scales: {
            x: {
              max: 50,
              ticks: { callback: function(val) { return val + '%'; }, color: '#64748b' },
              grid: { color: '#f1f5f9' }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#475569', font: { weight: '500' } }
            }
          }
        }
      });
    }
  }

  function updateDashboardCounters() {
    var totalEl = document.getElementById('kpi-total-incidents');
    var highRiskEl = document.getElementById('kpi-high-risk');
    var similarEl = document.getElementById('kpi-similar-cases');
    var alertsEl = document.getElementById('kpi-ai-alerts');

    var total = historicalIncidents.length + 134; // Base historical count
    var highRisk = historicalIncidents.filter(function(i) {
      return i.severity === 'High' || i.severity === 'Critical';
    }).length + 7;

    if (totalEl) totalEl.innerText = total;
    if (highRiskEl) highRiskEl.innerText = highRisk;
    if (similarEl) similarEl.innerText = "28";
    if (alertsEl) alertsEl.innerText = "3";
  }

  // -------------------------------------------------------------
  // 6. QUICK PRE-FILL SAMPLES
  // -------------------------------------------------------------
  function setupQuickSamples() {
    var sample1 = document.getElementById('sample-engine-takeoff');
    var sample2 = document.getElementById('sample-turbulence-cruise');
    var sample3 = document.getElementById('sample-runway-landing');

    if (sample1) {
      sample1.addEventListener('click', function() {
        fillForm({
          flightNo: "SK-512",
          aircraft: "Boeing 737-800",
          airline: "SkyShield Air",
          dep: "KJFK (New York JFK)",
          arr: "EGLL (London Heathrow)",
          phase: "Takeoff",
          type: "Engine",
          location: "Runway 22R on initial rotation",
          weather: "VMC (Clear Skies)",
          system: "Engine 1 Turbine Assembly & Sensor",
          severity: "High",
          desc: "During takeoff roll through 115 knots, flight deck EICAS displayed Engine 1 N2 vibration advisory reaching 3.8 units. Crew executed rejected takeoff below V1. Normal braking applied, exited at high-speed taxiway.",
          action: "RTO completed safely. Aircraft taxied to inspection apron. Engineering dispatched for borescope review."
        });
      });
    }

    if (sample2) {
      sample2.addEventListener('click', function() {
        fillForm({
          flightNo: "NW-884",
          aircraft: "Airbus A350-900",
          airline: "Nordic Wings",
          dep: "ENGM (Oslo Gardermoen)",
          arr: "KORD (Chicago O'Hare)",
          phase: "Cruise",
          type: "Weather",
          location: "FL380 over South Greenland",
          weather: "Clear Air Turbulence",
          system: "Airframe / Flight Controls",
          severity: "Medium",
          desc: "Encountered moderate mountain-wave clear-air turbulence with vertical acceleration peaks of +1.6g / -0.4g. Altitude maintained via autopilot in turbulence penetration airspeed mode.",
          action: "Seatbelt sign illuminated, cabin secured. Pilot broadcasted PIREP to Gander Oceanic Center."
        });
      });
    }

    if (sample3) {
      sample3.addEventListener('click', function() {
        fillForm({
          flightNo: "PA-309",
          aircraft: "Boeing 787-9",
          airline: "Pacific Aero",
          dep: "RJAA (Tokyo Narita)",
          arr: "KSFO (San Francisco)",
          phase: "Landing",
          type: "Runway",
          location: "Runway 28R touchdown zone",
          weather: "IMC (Gusty crosswinds, 24kts)",
          system: "Nose Wheel Steering & Antiskid",
          severity: "High",
          desc: "Firm touchdown with directional pull to port side on rollout. Antiskid cycling active on damp tarmac surface. Minor rudder pedal oscillation noted before taxi speed.",
          action: "Maintained runway centerline with differential braking. Completed rollout. Maintenance log entry completed."
        });
      });
    }

    function fillForm(data) {
      document.getElementById('input-flight-no').value = data.flightNo;
      document.getElementById('select-aircraft').value = data.aircraft;
      document.getElementById('input-airline').value = data.airline;
      document.getElementById('input-dep-airport').value = data.dep;
      document.getElementById('input-arr-airport').value = data.arr;
      document.getElementById('select-phase').value = data.phase;
      document.getElementById('select-type').value = data.type;
      document.getElementById('input-location').value = data.location;
      document.getElementById('select-weather').value = data.weather;
      document.getElementById('input-system').value = data.system;
      document.getElementById('select-severity').value = data.severity;
      document.getElementById('textarea-desc').value = data.desc;
      document.getElementById('textarea-action').value = data.action;

      // Set today's date and current time
      var today = new Date().toISOString().split('T')[0];
      var time = new Date().toTimeString().slice(0, 5);
      document.getElementById('input-date').value = today;
      document.getElementById('input-time').value = time;

      showToast('Sample incident details loaded into form.');
    }
  }

  // -------------------------------------------------------------
  // 7. INCIDENT FORM & SIMULATED AI ANALYSIS
  // -------------------------------------------------------------
  function setupIncidentForm() {
    var form = document.getElementById('incident-form');
    var analyzeBtn = document.getElementById('btn-analyze-incident');
    var loadingBox = document.getElementById('ai-loading-box');
    var resultBox = document.getElementById('ai-result-box');
    var saveReportBtn = document.getElementById('btn-save-analyzed-report');

    // Default Date/Time
    var dateInput = document.getElementById('input-date');
    var timeInput = document.getElementById('input-time');
    if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().split('T')[0];
    if (timeInput && !timeInput.value) timeInput.value = new Date().toTimeString().slice(0, 5);

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();

        // 1. Gather input values
        var flightNo = document.getElementById('input-flight-no').value.trim();
        var aircraft = document.getElementById('select-aircraft').value;
        var airline = document.getElementById('input-airline').value.trim() || 'SkyShield Air';
        var dep = document.getElementById('input-dep-airport').value.trim() || 'KJFK';
        var arr = document.getElementById('input-arr-airport').value.trim() || 'EGLL';
        var date = document.getElementById('input-date').value;
        var time = document.getElementById('input-time').value;
        var phase = document.getElementById('select-phase').value;
        var type = document.getElementById('select-type').value;
        var location = document.getElementById('input-location').value.trim() || 'Airspace Sector';
        var weather = document.getElementById('select-weather').value;
        var system = document.getElementById('input-system').value.trim() || 'General Systems';
        var severity = document.getElementById('select-severity').value;
        var desc = document.getElementById('textarea-desc').value.trim();
        var action = document.getElementById('textarea-action').value.trim();

        if (!flightNo || !desc) {
          alert("Please enter at least the Flight Number and Incident Description.");
          return;
        }

        // 2. Show Loading State with simulated steps
        if (loadingBox) {
          loadingBox.classList.remove('d-none');
          if (resultBox) resultBox.classList.add('d-none');
          loadingBox.scrollIntoView({ behavior: 'smooth' });
        }

        // Simulate multi-step AI reasoning
        var stepText = document.getElementById('ai-step-text');
        var progressBar = document.getElementById('ai-progress-bar');

        if (progressBar) progressBar.style.width = '20%';
        if (stepText) stepText.innerText = 'Step 1/4: Parsing taxonomy and classifying occurrence...';

        setTimeout(function() {
          if (progressBar) progressBar.style.width = '55%';
          if (stepText) stepText.innerText = 'Step 2/4: Querying historical safety vector database...';
        }, 400);

        setTimeout(function() {
          if (progressBar) progressBar.style.width = '85%';
          if (stepText) stepText.innerText = 'Step 3/4: Estimating potential contributing factors & risk signal...';
        }, 850);

        setTimeout(function() {
          if (progressBar) progressBar.style.width = '100%';
          if (stepText) stepText.innerText = 'Step 4/4: Synthesizing safety decision-support insights...';

          // 3. Render AI Analysis Result
          setTimeout(function() {
            if (loadingBox) loadingBox.classList.add('d-none');
            renderAiAnalysisResult({
              flightNo: flightNo,
              aircraft: aircraft,
              airline: airline,
              dep: dep,
              arr: arr,
              date: date,
              time: time,
              phase: phase,
              type: type,
              location: location,
              weather: weather,
              system: system,
              severity: severity,
              desc: desc,
              action: action
            });

            if (resultBox) {
              resultBox.classList.remove('d-none');
              resultBox.scrollIntoView({ behavior: 'smooth' });
            }
          }, 350);
        }, 1250);
      });
    }

    // Save Analyzed Report Button
    if (saveReportBtn) {
      saveReportBtn.addEventListener('click', function() {
        if (!window.currentAnalyzedData) return;

        var item = window.currentAnalyzedData;
        var newId = "INC-" + (Math.floor(1040 + Math.random() * 800));

        var newReport = {
          id: newId,
          flightNo: item.flightNo,
          aircraft: item.aircraft,
          airline: item.airline,
          date: item.date,
          time: item.time,
          phase: item.phase,
          type: item.type,
          system: item.system,
          severity: item.severity,
          location: item.location,
          weather: item.weather,
          description: item.desc,
          possibleCause: item.aiResult.primaryCause,
          similarity: item.aiResult.similarity,
          status: "Under Review"
        };

        // Add to historical list
        historicalIncidents.unshift(newReport);

        // Re-render table and update counters
        renderReportsTable(historicalIncidents);
        renderHistoricalTable();
        updateDashboardCounters();

        showToast("Report " + newId + " successfully archived in safety records.");

        // Scroll to reports table
        var reportsSection = document.getElementById('reports-section');
        if (reportsSection) {
          reportsSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  /**
   * Generates realistic, contextual AI Decision-Support Results based on inputs
   */
  function renderAiAnalysisResult(data) {
    // Dynamic Root Cause generation based on Incident Type & System
    var causesMap = {
      "Engine": {
        classification: "Technical / Engine & Propulsion Assembly",
        causes: [
          "Engine maintenance issue (Turbine blade micro-fissure or stator wear)",
          "Component wear under elevated thermal cycles",
          "Improper inspection interval / borescope calibration gap",
          "Human/operational factors (Throttle rate modulation during initial roll)"
        ],
        primary: "Engine maintenance issue / component wear",
        similarity: 89,
        similarCount: 23
      },
      "Technical": {
        classification: "Technical / Subsystem Sensor & Avionics",
        causes: [
          "Hydraulic valve micro-seal deterioration",
          "Sensor wiring harness degradation under vibration",
          "Pre-flight calibration verification gap",
          "Component wear on electromechanical actuators"
        ],
        primary: "Component wear / sensor calibration variance",
        similarity: 82,
        similarCount: 19
      },
      "Weather": {
        classification: "Environmental / Atmospheric Hazard",
        causes: [
          "Unforecasted jetstream boundary windshear",
          "Mountain-wave clear air turbulence (CAT) dynamics",
          "Localized convective updrafts at transition flight levels",
          "Operational dispatch delay in updating SIGMET warnings"
        ],
        primary: "Atmospheric shear / convective turbulence",
        similarity: 86,
        similarCount: 27
      },
      "Runway": {
        classification: "Runway Safety / Surface & Deceleration Interface",
        causes: [
          "Surface contamination / coefficient of friction reduction",
          "Antiskid valve response delay on wet pavement",
          "Crosswind gust alignment during touchdown rollout",
          "Ground operational situational awareness gap"
        ],
        primary: "Surface braking friction / crosswind alignment",
        similarity: 81,
        similarCount: 15
      },
      "Human Factor": {
        classification: "Human Factors & Crew Resource Management",
        causes: [
          "Task saturation during high-workload approach vector",
          "Checklist interruption during non-standard ATC query",
          "Circadian fatigue during early morning flight window",
          "Standard Operating Procedure (SOP) procedural divergence"
        ],
        primary: "Workload distribution / checklist sequence interruption",
        similarity: 78,
        similarCount: 14
      }
    };

    var defaultCauses = {
      classification: "Aeronautical Systems / Operational Occurrence",
      causes: [
        "Mechanical component wear / scheduled service threshold",
        "Environmental interference / atmospheric temperature gradient",
        "Operational procedural alignment during flight transition",
        "Inspection verification protocol variance"
      ],
      primary: "Component wear / operational factor",
      similarity: 76,
      similarCount: 12
    };

    var aiInsight = causesMap[data.type] || defaultCauses;

    // Determine Risk Level badge
    var riskBadgeClass = "bg-warning text-dark";
    var riskText = "Medium Risk";
    if (data.severity === "Critical") {
      riskBadgeClass = "bg-danger text-white";
      riskText = "Critical Risk";
    } else if (data.severity === "High") {
      riskBadgeClass = "bg-danger text-white";
      riskText = "High Risk";
    } else if (data.severity === "Low") {
      riskBadgeClass = "bg-success text-white";
      riskText = "Low Risk";
    }

    // Populate UI fields
    document.getElementById('ai-res-classification').innerText = aiInsight.classification;
    var riskEl = document.getElementById('ai-res-risk-level');
    riskEl.className = "badge " + riskBadgeClass + " fs-6 px-3 py-2";
    riskEl.innerText = riskText;

    document.getElementById('ai-res-similar-count').innerText = aiInsight.similarCount + " similar incidents found in database";
    document.getElementById('ai-res-similarity-pct').innerText = aiInsight.similarity + "% pattern similarity";

    // Populate Possible Root Causes List
    var causesListEl = document.getElementById('ai-res-causes-list');
    causesListEl.innerHTML = '';
    aiInsight.causes.forEach(function(cause, idx) {
      var li = document.createElement('li');
      li.className = "list-group-item d-flex align-items-center py-2";
      li.innerHTML = 
        '<span class="badge bg-primary-subtle text-primary border border-primary-subtle me-3">Factor ' + (idx + 1) + '</span>' +
        '<span class="text-dark fw-medium">' + cause + '</span>';
      causesListEl.appendChild(li);
    });

    // Flight summary line
    document.getElementById('ai-res-flight-summary').innerText = 
      data.flightNo + " (" + data.aircraft + ") · " + data.phase + " · " + data.type + " · " + data.system;

    // Cache current data for saving
    window.currentAnalyzedData = {
      flightNo: data.flightNo,
      aircraft: data.aircraft,
      airline: data.airline,
      date: data.date,
      time: data.time,
      phase: data.phase,
      type: data.type,
      location: data.location,
      weather: data.weather,
      system: data.system,
      severity: data.severity,
      desc: data.desc,
      action: data.action,
      aiResult: {
        primaryCause: aiInsight.primary,
        similarity: aiInsight.similarity
      }
    };
  }

  // -------------------------------------------------------------
  // 8. SIMILAR HISTORICAL INCIDENTS TABLE (Section 5)
  // -------------------------------------------------------------
  function renderHistoricalTable() {
    var tbody = document.getElementById('historical-incidents-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    // Show top 5 similar incidents
    historicalIncidents.slice(0, 5).forEach(function(inc) {
      var tr = document.createElement('tr');
      var sevBadge = getSeverityBadge(inc.severity);

      tr.innerHTML = 
        '<td class="fw-semibold text-primary">' + inc.id + '</td>' +
        '<td>' + formatDate(inc.date) + '</td>' +
        '<td><span class="badge bg-light text-dark border">' + inc.phase + '</span></td>' +
        '<td>' + inc.type + '</td>' +
        '<td>' + inc.system + '</td>' +
        '<td>' + sevBadge + '</td>' +
        '<td class="text-secondary small">' + inc.possibleCause + '</td>' +
        '<td><span class="fw-bold text-primary">' + inc.similarity + '%</span></td>' +
        '<td><button class="btn btn-sm btn-outline-primary btn-view-detail" data-id="' + inc.id + '">View Details</button></td>';

      tbody.appendChild(tr);
    });

    // Attach modal view triggers
    attachDetailTriggers();
  }

  // -------------------------------------------------------------
  // 9. INCIDENT REPORTS ARCHIVE (Search & Filtering - Section 8)
  // -------------------------------------------------------------
  function setupReportsTable() {
    var searchInput = document.getElementById('reports-search');
    var filterType = document.getElementById('filter-type');
    var filterRisk = document.getElementById('filter-risk');
    var filterPhase = document.getElementById('filter-phase');
    var sortDate = document.getElementById('sort-date');
    var resetBtn = document.getElementById('btn-reset-filters');

    function applyFilters() {
      var q = searchInput ? searchInput.value.toLowerCase().trim() : '';
      var typeVal = filterType ? filterType.value : 'all';
      var riskVal = filterRisk ? filterRisk.value : 'all';
      var phaseVal = filterPhase ? filterPhase.value : 'all';
      var sortOrder = sortDate ? sortDate.value : 'newest';

      var filtered = historicalIncidents.filter(function(item) {
        // Query Search
        var matchesQ = !q || 
          item.id.toLowerCase().includes(q) ||
          item.flightNo.toLowerCase().includes(q) ||
          item.aircraft.toLowerCase().includes(q) ||
          item.system.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q);

        // Type filter
        var matchesType = (typeVal === 'all') || (item.type === typeVal);

        // Risk filter
        var matchesRisk = (riskVal === 'all') || (item.severity === riskVal);

        // Phase filter
        var matchesPhase = (phaseVal === 'all') || (item.phase === phaseVal);

        return matchesQ && matchesType && matchesRisk && matchesPhase;
      });

      // Sorting
      filtered.sort(function(a, b) {
        var da = new Date(a.date);
        var db = new Date(b.date);
        return sortOrder === 'newest' ? (db - da) : (da - db);
      });

      renderReportsTable(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterType) filterType.addEventListener('change', applyFilters);
    if (filterRisk) filterRisk.addEventListener('change', applyFilters);
    if (filterPhase) filterPhase.addEventListener('change', applyFilters);
    if (sortDate) sortDate.addEventListener('change', applyFilters);

    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        if (searchInput) searchInput.value = '';
        if (filterType) filterType.value = 'all';
        if (filterRisk) filterRisk.value = 'all';
        if (filterPhase) filterPhase.value = 'all';
        if (sortDate) sortDate.value = 'newest';
        applyFilters();
      });
    }
  }

  function renderReportsTable(data) {
    var tbody = document.getElementById('reports-archive-tbody');
    var countEl = document.getElementById('reports-count-label');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (countEl) {
      countEl.innerText = "Showing " + data.length + " of " + historicalIncidents.length + " reports";
    }

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No safety reports match the selected filters.</td></tr>';
      return;
    }

    data.forEach(function(item) {
      var tr = document.createElement('tr');
      var sevBadge = getSeverityBadge(item.severity);

      tr.innerHTML = 
        '<td class="fw-bold text-primary">' + item.id + '</td>' +
        '<td class="fw-semibold">' + item.flightNo + '</td>' +
        '<td>' + item.aircraft + '</td>' +
        '<td><span class="badge bg-light text-dark border">' + item.phase + '</span></td>' +
        '<td>' + item.type + '</td>' +
        '<td>' + sevBadge + '</td>' +
        '<td>' + formatDate(item.date) + '</td>' +
        '<td><span class="badge bg-secondary-subtle text-secondary border">' + item.status + '</span></td>' +
        '<td><button class="btn btn-sm btn-outline-primary btn-view-detail" data-id="' + item.id + '">View</button></td>';

      tbody.appendChild(tr);
    });

    attachDetailTriggers();
  }

  // -------------------------------------------------------------
  // 10. INCIDENT DETAIL MODAL
  // -------------------------------------------------------------
  function attachDetailTriggers() {
    var buttons = document.querySelectorAll('.btn-view-detail');
    var modalEl = document.getElementById('incidentDetailModal');
    if (!modalEl) return;

    buttons.forEach(function(btn) {
      btn.onclick = function() {
        var id = this.getAttribute('data-id');
        var item = historicalIncidents.find(function(i) { return i.id === id; });
        if (!item) return;

        // Populate Modal Fields
        document.getElementById('modal-inc-id').innerText = item.id;
        document.getElementById('modal-flight-no').innerText = item.flightNo;
        document.getElementById('modal-aircraft').innerText = item.aircraft;
        document.getElementById('modal-date-time').innerText = formatDate(item.date) + ' @ ' + (item.time || '12:00 UTC');
        document.getElementById('modal-phase').innerText = item.phase;
        document.getElementById('modal-type').innerText = item.type;
        document.getElementById('modal-system').innerText = item.system;
        document.getElementById('modal-location').innerText = item.location || 'Airspace Sector';
        document.getElementById('modal-weather').innerText = item.weather || 'Standard Meteorological Conditions';
        document.getElementById('modal-severity').innerHTML = getSeverityBadge(item.severity);
        document.getElementById('modal-desc').innerText = item.description;
        document.getElementById('modal-possible-cause').innerText = item.possibleCause;
        document.getElementById('modal-status').innerText = item.status;

        var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      };
    });
  }

  // -------------------------------------------------------------
  // 11. HELPERS
  // -------------------------------------------------------------
  function getSeverityBadge(sev) {
    if (sev === 'Critical') return '<span class="badge bg-danger">Critical</span>';
    if (sev === 'High') return '<span class="badge bg-danger">High</span>';
    if (sev === 'Medium') return '<span class="badge bg-warning text-dark">Medium</span>';
    return '<span class="badge bg-success">Low</span>';
  }

  function formatDate(dStr) {
    if (!dStr) return '—';
    var d = new Date(dStr);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (d.getDate() ? String(d.getDate()).padStart(2, '0') : '01') + ' ' +
           months[d.getMonth() || 0] + ' ' +
           (d.getFullYear() || 2026);
  }

  function showToast(msg) {
    var toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    var toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-bg-dark border-0 shadow';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = 
      '<div class="d-flex">' +
        '<div class="toast-body"><i class="bi bi-shield-check text-info me-2"></i>' + msg + '</div>' +
        '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' +
      '</div>';

    toastContainer.appendChild(toastEl);
    var toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', function() {
      toastEl.remove();
    });
  }

  return {
    init: init,
    showToast: showToast
  };

})();

// Initialize upon DOM readiness
document.addEventListener('DOMContentLoaded', function() {
  SkyShieldApp.init();
});
