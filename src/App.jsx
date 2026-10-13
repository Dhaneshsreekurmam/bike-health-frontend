import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Wrench,
  Gauge,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit3,
  RefreshCw,
  Activity,
  DollarSign,
  ShieldCheck,
  Check,
  X,
  ChevronRight,
  Info
} from "lucide-react";
import "./App.css";

const API_BASE = "http://localhost:8080";

const SERVICE_PRESETS = [
  { name: "Engine Oil & Filter Change", cost: 1200, intervalMonths: 6, desc: "High performance synthetic oil and OEM oil filter replacement" },
  { name: "Chain Lube & Tension Adjustment", cost: 350, intervalMonths: 2, desc: "Degrease, clean, lube chain and adjust slack to manufacturer spec" },
  { name: "Brake Pads & Fluid Inspection", cost: 850, intervalMonths: 6, desc: "Inspect front/rear pad thickness and brake fluid moisture level" },
  { name: "Air Filter Replacement", cost: 600, intervalMonths: 12, desc: "Replace high-flow air filter element and clean airbox" },
  { name: "Spark Plug Renewal", cost: 450, intervalMonths: 12, desc: "Inspect and replace spark plug with proper electrode gap" },
  { name: "Tire Pressure & Wear Check", cost: 200, intervalMonths: 1, desc: "Check tread depth and adjust cold tire psi" },
  { name: "Comprehensive Annual Service", cost: 3500, intervalMonths: 12, desc: "Full 32-point inspection, fluid flushes, cables, and diagnostics" }
];

const BRAND_PRESETS = [
  "Honda", "Yamaha", "Kawasaki", "Royal Enfield", "Suzuki", "Ducati", "BMW", "KTM", "Triumph", "Harley-Davidson"
];

function App() {
  const [activeTab, setActiveTab] = useState("overview"); // overview, maintenance, reminders
  const [bikes, setBikes] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBikeFilter, setSelectedBikeFilter] = useState("ALL");

  // Modals
  const [bikeModalOpen, setBikeModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState(null);
  const [bikeForm, setBikeForm] = useState({
    name: "",
    brand: "Honda",
    model: "",
    manufacturingYear: new Date().getFullYear(),
    currentKm: "",
    purchaseDate: new Date().toISOString().split("T")[0]
  });

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    bikeId: "",
    taskName: "",
    description: "",
    serviceDate: new Date().toISOString().split("T")[0],
    nextDueDate: "",
    cost: "",
    status: "COMPLETED"
  });

  const [diagnosticModalOpen, setDiagnosticModalOpen] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'bike' | 'service', id: number, name: string }

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  // Load All System Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [bikesRes, recordsRes, remindersRes, overviewRes] = await Promise.all([
        axios.get(`${API_BASE}/api/bikes`),
        axios.get(`${API_BASE}/api/maintenance`),
        axios.get(`${API_BASE}/api/reminders`),
        axios.get(`${API_BASE}/api/health/overview`)
      ]);

      setBikes(bikesRes.data);
      setMaintenanceRecords(recordsRes.data);
      setReminders(remindersRes.data);
      setOverview(overviewRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
      showToast("Cloud sync failed. Make sure backend is running.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Bike CRUD
  const handleOpenBikeModal = (bike = null) => {
    if (bike) {
      setEditingBike(bike);
      setBikeForm({
        name: bike.name,
        brand: bike.brand,
        model: bike.model,
        manufacturingYear: bike.manufacturingYear,
        currentKm: bike.currentKm,
        purchaseDate: bike.purchaseDate || ""
      });
    } else {
      setEditingBike(null);
      setBikeForm({
        name: "",
        brand: "Honda",
        model: "",
        manufacturingYear: new Date().getFullYear(),
        currentKm: "",
        purchaseDate: new Date().toISOString().split("T")[0]
      });
    }
    setBikeModalOpen(true);
  };

  const handleSaveBike = async (e) => {
    e.preventDefault();
    if (!bikeForm.name || !bikeForm.model || !bikeForm.currentKm) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const payload = {
      ...bikeForm,
      manufacturingYear: Number(bikeForm.manufacturingYear),
      currentKm: Number(bikeForm.currentKm)
    };

    try {
      if (editingBike) {
        await axios.put(`${API_BASE}/api/bikes/${editingBike.id}`, payload);
        showToast(`Updated ${payload.name} successfully`);
      } else {
        await axios.post(`${API_BASE}/api/bikes`, payload);
        showToast(`Added ${payload.name} to garage`);
      }
      setBikeModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Save bike error:", err);
      showToast("Failed to save motorcycle", "error");
    }
  };

  const handleDeleteBike = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/bikes/${id}`);
      showToast("Motorcycle and history deleted successfully");
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      console.error("Delete bike error:", err);
      showToast("Failed to delete motorcycle", "error");
    }
  };

  // Maintenance CRUD
  const handleOpenServiceModal = (service = null, preselectedBikeId = null) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        bikeId: service.bikeId,
        taskName: service.taskName,
        description: service.description || "",
        serviceDate: service.serviceDate || "",
        nextDueDate: service.nextDueDate || "",
        cost: service.cost,
        status: service.status || "COMPLETED"
      });
    } else {
      setEditingService(null);
      const defaultBikeId = preselectedBikeId || (bikes.length > 0 ? bikes[0].id : "");
      const today = new Date();
      const nextDue = new Date();
      nextDue.setMonth(today.getMonth() + 6);

      setServiceForm({
        bikeId: defaultBikeId,
        taskName: "Engine Oil & Filter Change",
        description: "Routine maintenance and inspection",
        serviceDate: today.toISOString().split("T")[0],
        nextDueDate: nextDue.toISOString().split("T")[0],
        cost: 1200,
        status: "COMPLETED"
      });
    }
    setServiceModalOpen(true);
  };

  const applyPresetService = (preset) => {
    const today = new Date();
    const nextDue = new Date();
    nextDue.setMonth(today.getMonth() + preset.intervalMonths);

    setServiceForm((prev) => ({
      ...prev,
      taskName: preset.name,
      description: preset.desc,
      cost: preset.cost,
      serviceDate: today.toISOString().split("T")[0],
      nextDueDate: nextDue.toISOString().split("T")[0]
    }));
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.bikeId || !serviceForm.taskName) {
      showToast("Please choose a motorcycle and task", "error");
      return;
    }

    const payload = {
      ...serviceForm,
      bikeId: Number(serviceForm.bikeId),
      cost: Number(serviceForm.cost) || 0
    };

    try {
      if (editingService) {
        await axios.put(`${API_BASE}/api/maintenance/${editingService.id}`, payload);
        showToast("Maintenance record updated");
      } else {
        await axios.post(`${API_BASE}/api/maintenance`, payload);
        showToast("Service successfully recorded");
      }
      setServiceModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Save service error:", err);
      showToast("Failed to record maintenance", "error");
    }
  };

  const handleDeleteService = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/maintenance/${id}`);
      showToast("Maintenance record removed");
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      console.error("Delete service error:", err);
      showToast("Failed to delete record", "error");
    }
  };

  const handleToggleServiceStatus = async (record) => {
    const nextStatusMap = {
      PENDING: "IN_PROGRESS",
      IN_PROGRESS: "COMPLETED",
      COMPLETED: "PENDING"
    };
    const newStatus = nextStatusMap[record.status] || "COMPLETED";

    try {
      await axios.put(`${API_BASE}/api/maintenance/${record.id}`, {
        ...record,
        status: newStatus
      });
      showToast(`Status updated to ${newStatus}`);
      await loadData();
    } catch (err) {
      console.error("Status toggle error:", err);
      showToast("Could not update status", "error");
    }
  };

  const handleMarkReminderCompleted = async (reminder) => {
    try {
      await axios.put(`${API_BASE}/api/maintenance/${reminder.id}`, {
        ...reminder,
        status: "COMPLETED",
        serviceDate: new Date().toISOString().split("T")[0]
      });
      showToast(`Completed: ${reminder.taskName}`);
      await loadData();
    } catch (err) {
      console.error("Reminder complete error:", err);
      showToast("Could not complete task", "error");
    }
  };

  // Diagnostics Modal
  const handleOpenDiagnostic = async (bikeId) => {
    setDiagnosticLoading(true);
    setDiagnosticModalOpen(true);
    try {
      const res = await axios.get(`${API_BASE}/api/health/${bikeId}`);
      setDiagnosticData(res.data);
    } catch (err) {
      console.error("Diagnostic error:", err);
      showToast("Failed to load health diagnostic", "error");
      setDiagnosticModalOpen(false);
    } finally {
      setDiagnosticLoading(false);
    }
  };

  // Filtered Bikes
  const filteredBikes = useMemo(() => {
    return bikes.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBrand = selectedBikeFilter === "ALL" || b.brand === selectedBikeFilter;
      return matchesSearch && matchesBrand;
    });
  }, [bikes, searchQuery, selectedBikeFilter]);

  // Filtered Maintenance
  const filteredMaintenance = useMemo(() => {
    return maintenanceRecords.filter((m) => {
      const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
      const matchesBike = selectedBikeFilter === "ALL" || String(m.bikeId) === String(selectedBikeFilter);
      const matchesSearch =
        m.taskName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesBike && matchesSearch;
    });
  }, [maintenanceRecords, statusFilter, selectedBikeFilter, searchQuery]);

  // Map bike names for quick display
  const bikeNameMap = useMemo(() => {
    const map = {};
    bikes.forEach((b) => {
      map[b.id] = b;
    });
    return map;
  }, [bikes]);

  // Find health summary for a bike from overview
  const getBikeHealthSummary = (bikeId) => {
    if (!overview?.bikeHealthSummaries) return null;
    return overview.bikeHealthSummaries.find((s) => s.bikeId === bikeId);
  };

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="brand-section">
          <div className="brand-logo-icon">
            <Gauge size={26} strokeWidth={2.4} />
          </div>
          <div className="brand-titles">
            <h1>
              BikeHealth Pro <span className="brand-badge">Enterprise v2.4</span>
            </h1>
            <p className="brand-sub">Intelligent Motorcycle Health Diagnostics & Fleet Maintenance</p>
          </div>
        </div>

        <div className="nav-actions">
          <div className="status-indicator">
            <span className="status-dot"></span>
            Cloud DB Connected (Aiven MySQL)
          </div>

          <button className="btn-icon" onClick={loadData} title="Refresh System Data">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>

          <button className="btn-secondary" onClick={() => handleOpenServiceModal()}>
            <Wrench size={16} /> Log Service
          </button>

          <button className="btn-primary" onClick={() => handleOpenBikeModal()}>
            <Plus size={17} /> Add Motorcycle
          </button>
        </div>
      </header>

      {/* KPI Overview Grid */}
      <section className="kpi-grid">
        <div className="kpi-card emerald">
          <div className="kpi-info">
            <h3>Active Garage</h3>
            <div className="kpi-value">{bikes.length}</div>
            <div className="kpi-subtext">Registered Motorcycles</div>
          </div>
          <div className="kpi-icon-wrap">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="kpi-card cyan">
          <div className="kpi-info">
            <h3>Fleet Health Index</h3>
            <div className="kpi-value">{overview ? `${overview.averageFleetScore}%` : "100%"}</div>
            <div className="kpi-subtext">Optimal Diagnostic Score</div>
          </div>
          <div className="kpi-icon-wrap">
            <Activity size={24} />
          </div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-info">
            <h3>Schedule Due (30d)</h3>
            <div className="kpi-value">{reminders.length}</div>
            <div className="kpi-subtext">
              {overview?.overdueTasks > 0 ? (
                <span style={{ color: "var(--accent-rose)", fontWeight: 700 }}>
                  {overview.overdueTasks} Overdue Urgent
                </span>
              ) : (
                "All services on schedule"
              )}
            </div>
          </div>
          <div className="kpi-icon-wrap">
            <Clock size={24} />
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-info">
            <h3>Total Service Cost</h3>
            <div className="kpi-value">
              {overview
                ? `₹${Number(overview.totalMaintenanceExpenditure).toLocaleString()}`
                : "₹0"}
            </div>
            <div className="kpi-subtext">{maintenanceRecords.length} Lifetime Service Logs</div>
          </div>
          <div className="kpi-icon-wrap">
            <DollarSign size={24} />
          </div>
        </div>
      </section>

      {/* Tab Switcher */}
      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Gauge size={17} /> Garage & Diagnostics
          <span className="tab-badge">{bikes.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "maintenance" ? "active" : ""}`}
          onClick={() => setActiveTab("maintenance")}
        >
          <Wrench size={17} /> Maintenance Log
          <span className="tab-badge">{maintenanceRecords.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "reminders" ? "active" : ""}`}
          onClick={() => setActiveTab("reminders")}
        >
          <Calendar size={17} /> Reminders & Radar
          <span className={`tab-badge ${reminders.length > 0 ? "alert" : ""}`}>{reminders.length}</span>
        </button>
      </nav>

      {/* TAB 1: GARAGE & MOTORCYCLES OVERVIEW */}
      {activeTab === "overview" && (
        <section>
          <div className="section-header">
            <div className="section-title-group">
              <h2>Motorcycles Fleet</h2>
              <p>Real-time telemetry, mileage tracking, and health status indicators</p>
            </div>

            <div className="section-controls">
              <div className="search-input-wrap">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search brand, model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <select
                value={selectedBikeFilter}
                onChange={(e) => setSelectedBikeFilter(e.target.value)}
                className="search-input"
                style={{ width: "auto" }}
              >
                <option value="ALL">All Brands</option>
                {BRAND_PRESETS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredBikes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <Gauge size={32} />
              </div>
              <h3>No Motorcycles In Garage</h3>
              <p>Add your motorcycle profile with mileage and model to monitor its ongoing health and service alerts.</p>
              <button className="btn-primary" onClick={() => handleOpenBikeModal()}>
                <Plus size={16} /> Add First Motorcycle
              </button>
            </div>
          ) : (
            <div className="bike-grid">
              {filteredBikes.map((bike) => {
                const health = getBikeHealthSummary(bike.id);
                const score = health?.healthScore ?? 100;
                const statusColor = health?.statusColor ?? "#10B981";
                const strokeDashoffset = 188 - (188 * score) / 100;

                return (
                  <div className="bike-card" key={bike.id}>
                    <div className="bike-card-top">
                      <div>
                        <span className="bike-brand-badge">{bike.brand}</span>
                        <h3 className="bike-name">{bike.name}</h3>
                        <div className="bike-model-year">
                          {bike.model} • Year {bike.manufacturingYear}
                        </div>
                      </div>

                      {/* Circular Gauge */}
                      <div className="health-score-ring">
                        <svg width="72" height="72">
                          <circle
                            cx="36"
                            cy="36"
                            r="30"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="5"
                            fill="transparent"
                          />
                          <circle
                            cx="36"
                            cy="36"
                            r="30"
                            stroke={statusColor}
                            strokeWidth="5"
                            fill="transparent"
                            strokeDasharray="188"
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="score-center-text">
                          <div className="score-number">{score}</div>
                          <div className="score-percent">HEALTH</div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="bike-stats-row">
                      <div className="stat-item">
                        <span className="stat-label">Odometer</span>
                        <span className="stat-val">{Number(bike.currentKm).toLocaleString()} km</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Services</span>
                        <span className="stat-val">{health?.totalMaintenanceRecords ?? 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Status</span>
                        <span className="stat-val" style={{ color: statusColor }}>
                          {health?.healthStatus ?? "Good"}
                        </span>
                      </div>
                    </div>

                    {/* Subsystem Health Preview */}
                    <div className="subsystems-preview">
                      <div className="subsystem-bar-group">
                        <span className="subsystem-name">Powertrain & Engine</span>
                        <span className="subsystem-pct">{health?.engineHealth ?? 95}%</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${health?.engineHealth ?? 95}%`,
                            background: "linear-gradient(90deg, #10b981, #34d399)"
                          }}
                        ></div>
                      </div>

                      <div className="subsystem-bar-group">
                        <span className="subsystem-name">Brakes & Hydraulics</span>
                        <span className="subsystem-pct">{health?.brakeHealth ?? 92}%</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${health?.brakeHealth ?? 92}%`,
                            background: "linear-gradient(90deg, #06b6d4, #38bdf8)"
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="bike-actions">
                      <button
                        className="btn-card-action primary-subtle"
                        onClick={() => handleOpenDiagnostic(bike.id)}
                      >
                        <Activity size={15} /> Diagnose
                      </button>

                      <button
                        className="btn-card-action"
                        onClick={() => handleOpenServiceModal(null, bike.id)}
                      >
                        <Wrench size={15} /> Log Service
                      </button>

                      <button
                        className="btn-card-action"
                        onClick={() => handleOpenBikeModal(bike)}
                        title="Edit bike details"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        className="btn-card-action danger"
                        onClick={() => setDeleteConfirm({ type: "bike", id: bike.id, name: bike.name })}
                        title="Delete bike"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: MAINTENANCE SERVICE LOG */}
      {activeTab === "maintenance" && (
        <section>
          <div className="table-card">
            {/* Quick 1-Click Service Presets */}
            <div className="quick-presets-bar">
              <span className="presets-label">⚡ Quick Presets:</span>
              {SERVICE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  className="preset-btn"
                  onClick={() => {
                    handleOpenServiceModal();
                    setTimeout(() => applyPresetService(preset), 50);
                  }}
                >
                  <Plus size={13} /> {preset.name}
                </button>
              ))}
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="filter-chips">
                {["ALL", "COMPLETED", "PENDING", "IN_PROGRESS"].map((s) => (
                  <button
                    key={s}
                    className={`filter-chip ${statusFilter === s ? "active" : ""}`}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="section-controls">
                <select
                  value={selectedBikeFilter}
                  onChange={(e) => setSelectedBikeFilter(e.target.value)}
                  className="search-input"
                  style={{ width: "auto" }}
                >
                  <option value="ALL">All Motorcycles</option>
                  {bikes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.model})
                    </option>
                  ))}
                </select>

                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>

                <button className="btn-primary" onClick={() => handleOpenServiceModal()}>
                  <Plus size={16} /> Log Service
                </button>
              </div>
            </div>

            {/* Table */}
            {filteredMaintenance.length === 0 ? (
              <div className="empty-state" style={{ margin: "20px" }}>
                <div className="empty-icon-wrap">
                  <Wrench size={30} />
                </div>
                <h3>No Service Records Found</h3>
                <p>Log your oil changes, chain adjustments, and inspections to keep track of maintenance history.</p>
                <button className="btn-primary" onClick={() => handleOpenServiceModal()}>
                  <Plus size={16} /> Record Service Now
                </button>
              </div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Motorcycle</th>
                      <th>Service Task & Details</th>
                      <th>Service Date</th>
                      <th>Next Due Date</th>
                      <th>Status (Click to toggle)</th>
                      <th>Cost</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaintenance.map((record) => {
                      const bike = bikeNameMap[record.bikeId];
                      const statusClass = (record.status || "PENDING").toLowerCase();

                      return (
                        <tr key={record.id}>
                          <td>
                            <strong>{bike ? bike.name : `Bike #${record.bikeId}`}</strong>
                            <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                              {bike ? `${bike.brand} ${bike.model}` : ""}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: "#fff" }}>{record.taskName}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                              {record.description || "Routine maintenance"}
                            </div>
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>
                            {record.serviceDate || "—"}
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>
                            {record.nextDueDate || "—"}
                          </td>
                          <td>
                            <button
                              className={`status-badge ${statusClass}`}
                              onClick={() => handleToggleServiceStatus(record)}
                              title="Click to toggle status"
                            >
                              {record.status === "COMPLETED" && <Check size={12} />}
                              {record.status === "PENDING" && <Clock size={12} />}
                              {record.status === "IN_PROGRESS" && <Activity size={12} />}
                              {record.status}
                            </button>
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                            ₹{Number(record.cost).toLocaleString()}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                className="btn-icon"
                                style={{ width: "30px", height: "30px" }}
                                onClick={() => handleOpenServiceModal(record)}
                                title="Edit record"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                className="btn-icon"
                                style={{ width: "30px", height: "30px", color: "var(--accent-rose)" }}
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: "service",
                                    id: record.id,
                                    name: record.taskName
                                  })
                                }
                                title="Delete record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: REMINDERS & RADAR */}
      {activeTab === "reminders" && (
        <section>
          <div className="section-header">
            <div className="section-title-group">
              <h2>Maintenance Radar & Due Schedule</h2>
              <p>Upcoming milestones and overdue tasks within the next 45 days</p>
            </div>
            <button className="btn-secondary" onClick={loadData}>
              <RefreshCw size={15} /> Refresh Schedule
            </button>
          </div>

          {reminders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap" style={{ color: "var(--accent-emerald)" }}>
                <CheckCircle2 size={36} />
              </div>
              <h3>All Scheduled Services Up To Date!</h3>
              <p>No motorcycles currently have pending or overdue tasks. Schedule your next service below.</p>
              <button className="btn-primary" onClick={() => handleOpenServiceModal()}>
                <Plus size={16} /> Schedule Next Service
              </button>
            </div>
          ) : (
            <div className="reminders-grid">
              {reminders.map((rem) => {
                const days = rem.daysRemaining;
                const isOverdue = rem.isOverdue;

                return (
                  <div className={`reminder-card ${isOverdue ? "overdue" : "upcoming"}`} key={rem.id}>
                    <div className="reminder-header">
                      <div>
                        <h3 className="reminder-task-title">{rem.taskName}</h3>
                        <div className="reminder-bike-name">
                          {rem.bikeName} ({rem.bikeModel})
                        </div>
                      </div>

                      <span className={`countdown-pill ${isOverdue ? "urgent" : "normal"}`}>
                        {isOverdue ? `${Math.abs(days)}d Overdue` : `Due in ${days}d`}
                      </span>
                    </div>

                    <div className="reminder-body">
                      <p>{rem.description || "Scheduled preventive maintenance"}</p>
                      <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-muted)" }}>
                        Due Date: <strong style={{ color: "#fff" }}>{rem.nextDueDate}</strong> • Estimated:{" "}
                        <strong style={{ color: "#fff" }}>₹{Number(rem.cost).toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="reminder-footer">
                      <button
                        className="btn-primary"
                        style={{ fontSize: "12px", padding: "7px 14px" }}
                        onClick={() => handleMarkReminderCompleted(rem)}
                      >
                        <CheckCircle2 size={15} /> Mark Completed
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ fontSize: "12px", padding: "7px 12px" }}
                        onClick={() => handleOpenServiceModal(rem)}
                      >
                        <Edit3 size={14} /> Reschedule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* MODAL: ADD / EDIT MOTORCYCLE */}
      {bikeModalOpen && (
        <div className="modal-overlay" onClick={() => setBikeModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>{editingBike ? "Edit Motorcycle" : "Add Motorcycle to Garage"}</h3>
                <p>Register specs and current mileage to calculate health score</p>
              </div>
              <button className="btn-close" onClick={() => setBikeModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBike}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label>Motorcycle Name / Nickname *</label>
                    <input
                      type="text"
                      placeholder="e.g. My Honda CB350"
                      value={bikeForm.name}
                      onChange={(e) => setBikeForm({ ...bikeForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Brand *</label>
                    <select
                      value={bikeForm.brand}
                      onChange={(e) => setBikeForm({ ...bikeForm, brand: e.target.value })}
                      required
                    >
                      {BRAND_PRESETS.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Model *</label>
                    <input
                      type="text"
                      placeholder="e.g. H'ness CB350 / Ninja 400"
                      value={bikeForm.model}
                      onChange={(e) => setBikeForm({ ...bikeForm, model: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Manufacturing Year *</label>
                    <input
                      type="number"
                      min="1970"
                      max={new Date().getFullYear() + 1}
                      value={bikeForm.manufacturingYear}
                      onChange={(e) => setBikeForm({ ...bikeForm, manufacturingYear: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Current Odometer (km) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="e.g. 8500"
                      value={bikeForm.currentKm}
                      onChange={(e) => setBikeForm({ ...bikeForm, currentKm: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group form-full">
                    <label>Purchase / Registration Date</label>
                    <input
                      type="date"
                      value={bikeForm.purchaseDate}
                      onChange={(e) => setBikeForm({ ...bikeForm, purchaseDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setBikeModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingBike ? "Save Changes" : "Register Motorcycle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG / EDIT MAINTENANCE SERVICE */}
      {serviceModalOpen && (
        <div className="modal-overlay" onClick={() => setServiceModalOpen(false)}>
          <div className="modal-dialog wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>{editingService ? "Edit Maintenance Record" : "Log Maintenance Service"}</h3>
                <p>Record service details, cost, and set next due date for reminders</p>
              </div>
              <button className="btn-close" onClick={() => setServiceModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveService}>
              <div className="modal-body">
                {/* Quick Presets inside modal */}
                <div style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                    Select Preset Service:
                  </label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                    {SERVICE_PRESETS.map((p) => (
                      <button
                        type="button"
                        key={p.name}
                        className="preset-btn"
                        onClick={() => applyPresetService(p)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group form-full">
                    <label>Motorcycle *</label>
                    <select
                      value={serviceForm.bikeId}
                      onChange={(e) => setServiceForm({ ...serviceForm, bikeId: e.target.value })}
                      required
                    >
                      <option value="">Select a bike...</option>
                      {bikes.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.brand} {b.model})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group form-full">
                    <label>Service / Task Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Engine Oil Change"
                      value={serviceForm.taskName}
                      onChange={(e) => setServiceForm({ ...serviceForm, taskName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group form-full">
                    <label>Description & Notes</label>
                    <textarea
                      rows="2"
                      placeholder="Details about parts, oil grade (e.g. 10W-40 Synthetic), mechanic remarks..."
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Service Date</label>
                    <input
                      type="date"
                      value={serviceForm.serviceDate}
                      onChange={(e) => setServiceForm({ ...serviceForm, serviceDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Next Due Date (Reminder Schedule)</label>
                    <input
                      type="date"
                      value={serviceForm.nextDueDate}
                      onChange={(e) => setServiceForm({ ...serviceForm, nextDueDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Service Cost (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 1200"
                      value={serviceForm.cost}
                      onChange={(e) => setServiceForm({ ...serviceForm, cost: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={serviceForm.status}
                      onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value })}
                    >
                      <option value="COMPLETED">COMPLETED (Serviced)</option>
                      <option value="PENDING">PENDING (Scheduled)</option>
                      <option value="IN_PROGRESS">IN_PROGRESS (At Workshop)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setServiceModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingService ? "Update Record" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DEEP DIVE DIAGNOSTIC REPORT */}
      {diagnosticModalOpen && (
        <div className="modal-overlay" onClick={() => setDiagnosticModalOpen(false)}>
          <div className="modal-dialog wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Diagnostic Health Report</h3>
                <p>Telemetry inspection and AI-assisted preventive recommendations</p>
              </div>
              <button className="btn-close" onClick={() => setDiagnosticModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {diagnosticLoading || !diagnosticData ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <RefreshCw size={30} className="animate-spin" style={{ color: "var(--accent-emerald)" }} />
                  <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>
                    Computing diagnostics & analyzing service history...
                  </p>
                </div>
              ) : (
                <>
                  <div className="diagnostic-hero">
                    <div className="health-score-ring" style={{ width: "90px", height: "90px" }}>
                      <svg width="90" height="90">
                        <circle
                          cx="45"
                          cy="45"
                          r="38"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="7"
                          fill="transparent"
                        />
                        <circle
                          cx="45"
                          cy="45"
                          r="38"
                          stroke={diagnosticData.statusColor}
                          strokeWidth="7"
                          fill="transparent"
                          strokeDasharray="238"
                          strokeDashoffset={238 - (238 * diagnosticData.healthScore) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="score-center-text">
                        <div className="score-number" style={{ fontSize: "20px" }}>
                          {diagnosticData.healthScore}
                        </div>
                        <div className="score-percent">SCORE</div>
                      </div>
                    </div>

                    <div className="diagnostic-hero-details">
                      <h4>
                        {diagnosticData.bikeName} ({diagnosticData.brand} {diagnosticData.model})
                      </h4>
                      <div
                        className="diagnostic-status-tag"
                        style={{
                          background: `${diagnosticData.statusColor}22`,
                          color: diagnosticData.statusColor,
                          border: `1px solid ${diagnosticData.statusColor}55`
                        }}
                      >
                        <ShieldCheck size={14} /> Health Rating: {diagnosticData.healthStatus}
                      </div>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
                        Odometer: <strong>{Number(diagnosticData.currentKm).toLocaleString()} km</strong> • Total
                        Invested: <strong>₹{Number(diagnosticData.totalSpent).toLocaleString()}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Subsystems Breakdown */}
                  <div className="subsystem-cards-grid">
                    <div className="subsystem-stat-card">
                      <div className="subsystem-stat-title">Powertrain & Engine</div>
                      <div className="subsystem-stat-val" style={{ color: "var(--accent-emerald)" }}>
                        {diagnosticData.engineHealth}%
                      </div>
                      <div className="progress-track" style={{ height: "4px" }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${diagnosticData.engineHealth}%`,
                            background: "var(--accent-emerald)"
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="subsystem-stat-card">
                      <div className="subsystem-stat-title">Braking & Hydraulics</div>
                      <div className="subsystem-stat-val" style={{ color: "var(--accent-cyan)" }}>
                        {diagnosticData.brakeHealth}%
                      </div>
                      <div className="progress-track" style={{ height: "4px" }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${diagnosticData.brakeHealth}%`,
                            background: "var(--accent-cyan)"
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="subsystem-stat-card">
                      <div className="subsystem-stat-title">Drive & Tires</div>
                      <div className="subsystem-stat-val" style={{ color: "var(--accent-purple)" }}>
                        {diagnosticData.driveHealth}%
                      </div>
                      <div className="progress-track" style={{ height: "4px" }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${diagnosticData.driveHealth}%`,
                            background: "var(--accent-purple)"
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Actionable Recommendations */}
                  <div className="recommendations-box">
                    <div className="recommendations-title">
                      <Info size={16} /> Diagnostic Insights & Recommendations
                    </div>
                    <ul className="recommendation-list">
                      {diagnosticData.recommendations?.map((rec, idx) => (
                        <li className="recommendation-item" key={idx}>
                          <ChevronRight size={14} className="recommendation-bullet" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  setDiagnosticModalOpen(false);
                  handleOpenServiceModal(null, diagnosticData?.bikeId);
                }}
              >
                <Wrench size={14} /> Log Service For This Bike
              </button>
              <button className="btn-primary" onClick={() => setDiagnosticModalOpen(false)}>
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-dialog" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3 style={{ color: "var(--accent-rose)" }}>Confirm Deletion</h3>
                <p>This action cannot be undone</p>
              </div>
              <button className="btn-close" onClick={() => setDeleteConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "14px", color: "var(--text-main)" }}>
                Are you sure you want to permanently delete{" "}
                <strong style={{ color: "#fff" }}>"{deleteConfirm.name}"</strong>
                {deleteConfirm.type === "bike" ? " and all of its associated maintenance history?" : "?"}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}
                onClick={() => {
                  if (deleteConfirm.type === "bike") {
                    handleDeleteBike(deleteConfirm.id);
                  } else {
                    handleDeleteService(deleteConfirm.id);
                  }
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Drawer */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div className={`toast ${toast.type}`} key={toast.id}>
            {toast.type === "success" ? (
              <CheckCircle2 size={18} style={{ color: "var(--accent-emerald)" }} />
            ) : (
              <AlertTriangle size={18} style={{ color: "var(--accent-rose)" }} />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;