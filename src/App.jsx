
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:8080";

function App() {
  const [bikes, setBikes] = useState([]);
  const [health, setHealth] = useState(null);
  const [reminders, setReminders] = useState([]);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [manufacturingYear, setManufacturingYear] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

  // Load bikes and maintenance reminders
  async function loadData() {
    try {
      const bikeResponse = await axios.get(`${API}/api/bikes`);
      setBikes(bikeResponse.data);

      const reminderResponse = await axios.get(
        `${API}/api/reminders`
      );
      setReminders(reminderResponse.data);
    } catch (error) {
      console.error(
        "Error loading data:",
        error.response?.data || error.message
      );
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Add a new bike
  async function addBike(event) {
    event.preventDefault();

    const newBike = {
      name: name.trim(),
      brand: brand.trim(),
      model: model.trim(),
      manufacturingYear: Number(manufacturingYear),
      currentKm: Number(currentKm),
      purchaseDate: purchaseDate
    };

    try {
      await axios.post(`${API}/api/bikes`, newBike);

      alert("Bike added successfully!");

      setName("");
      setBrand("");
      setModel("");
      setManufacturingYear("");
      setCurrentKm("");
      setPurchaseDate("");

      await loadData();
    } catch (error) {
      console.error("Error adding bike:", error);

      const status = error.response?.status || "Connection error";
      const details = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;

      alert(
        "Could not add bike.\nStatus: " +
        status +
        "\nDetails: " +
        details
      );
    }
  }

  // Check bike health
  async function checkHealth(bikeId) {
    try {
      const response = await axios.get(
        `${API}/api/health/${bikeId}`
      );
      setHealth(response.data);
    } catch (error) {
      console.error(
        "Health error:",
        error.response?.data || error.message
      );

      alert(
        "Could not load health score: " +
        (error.response?.status || error.message)
      );
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Bike Health Maintenance System</h1>
        <p>Manage your bike, maintenance and health score.</p>
      </header>

      {/* Add Bike Form */}
      <section className="card">
        <h2>Add Bike</h2>

        <form onSubmit={addBike} className="bike-form">
          <label>
            Bike Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: My Honda"
              required
            />
          </label>

          <label>
            Brand
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Example: Honda"
              required
            />
          </label>

          <label>
            Model
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Example: CB350"
              required
            />
          </label>

          <label>
            Manufacturing Year
            <input
              type="number"
              value={manufacturingYear}
              onChange={(e) =>
                setManufacturingYear(e.target.value)
              }
              min="1900"
              max={new Date().getFullYear() + 1}
              required
            />
          </label>

          <label>
            Current Kilometers
            <input
              type="number"
              value={currentKm}
              onChange={(e) => setCurrentKm(e.target.value)}
              min="0"
              step="any"
              required
            />
          </label>

          <label>
            Purchase Date
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </label>

          <button type="submit">Add Bike</button>
        </form>
      </section>

      {/* Bike Profiles */}
      <section className="card">
        <h2>Bike Profile</h2>

        {bikes.length === 0 ? (
          <p>No bikes found. Add your first bike above.</p>
        ) : (
          <div className="bike-list">
            {bikes.map((bike) => (
              <div className="bike-item" key={bike.id}>
                <h3>{bike.name}</h3>
                <p>Brand: {bike.brand}</p>
                <p>Model: {bike.model}</p>
                <p>Year: {bike.manufacturingYear}</p>
                <p>Current KM: {bike.currentKm}</p>

                <button onClick={() => checkHealth(bike.id)}>
                  Check Health
                </button>
              </div>
            ))}
          </div>
        )}

        {health && (
          <div className="health-result">
            <h2>Bike Health Score</h2>
            <p>Bike ID: {health.bikeId}</p>
            <p>Score: {health.healthScore}/100</p>
            <p>Status: {health.healthStatus}</p>
            <p>
              Total Maintenance Records:{" "}
              {health.totalMaintenanceRecords}
            </p>
          </div>
        )}
      </section>

      {/* Maintenance Reminders */}
      <section className="card">
        <h2>Maintenance Reminders</h2>

        {reminders.length === 0 ? (
          <p>No upcoming or overdue reminders.</p>
        ) : (
          reminders.map((item) => (
            <div className="reminder-item" key={item.id}>
              <h3>{item.taskName}</h3>
              <p>Bike ID: {item.bikeId}</p>
              <p>Next Due Date: {item.nextDueDate}</p>
              <p>Status: {item.status}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default App;