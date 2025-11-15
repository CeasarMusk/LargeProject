// src/pages/profile/Profile.tsx

import { useEffect, useState } from "react";
import { getCurrentUser, updateUserProfile } from "../../api/usersApi";
import { useAuth } from "../../context/AuthContext";

function Profile() {
  const { logout } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // load user info on mount
  useEffect(() => {
    const load = async () => {
      try {
        const result = await getCurrentUser();
        setFirstName(result.item.firstName || "");
        setLastName(result.item.lastName || "");
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      await updateUserProfile({ firstName, lastName });
      setMessage("Profile updated");
    } catch (err: any) {
      setError(err.message || "Update failed");
    }

    setSaving(false);
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "auto" }}>
      <h2>Profile</h2>

      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ color: "green", marginBottom: 10 }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 15 }}>
          <label>First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            marginRight: 10
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={logout}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            background: "red",
            color: "white"
          }}
        >
          Logout
        </button>
      </form>
    </div>
  );
}

export default Profile;
