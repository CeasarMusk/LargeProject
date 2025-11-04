import { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function BudgetPage() {
  const [showModal, setShowModal] = useState(false);
  const [budget, setBudget] = useState("");
  const [savedBudget, setSavedBudget] = useState<string | null>(null);

  const handleSaveBudget = () => {
    if (!budget || isNaN(Number(budget))) {
      alert("Please enter a valid number for your budget.");
      return;
    }
    setSavedBudget(budget);
    setShowModal(false);
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar navbar-dark" style={{ backgroundColor: "#2d5016" }}>
        <div className="container-fluid justify-content-center">
          <span className="navbar-brand h1 mb-0">Budget Buddy</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="content-container d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
        <div className="card shadow-sm p-4 text-center" style={{ maxWidth: "400px", width: "100%" }}>
          <h3 className="mb-4">Welcome to Your Dashboard</h3>

          {savedBudget ? (
            <div className="alert alert-success">
              <strong>Your current budget:</strong> ${savedBudget}
            </div>
          ) : (
            <p className="text-muted">No budget set yet.</p>
          )}

          <Button
            style={{ backgroundColor: "#2d5016", border: "none" }}
            onClick={() => setShowModal(true)}
          >
            {savedBudget ? "Edit Budget" : "Set Budget"}
          </Button>
        </div>
      </div>

      {/* Budget Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: "#2d5016", color: "white" }}>
          <Modal.Title>Enter Your Budget</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="budget" className="form-label">Monthly Budget ($)</label>
            <input
              type="number"
              className="form-control"
              id="budget"
              placeholder="Enter your budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button
            style={{ backgroundColor: "#2d5016", border: "none" }}
            onClick={handleSaveBudget}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default BudgetPage;
