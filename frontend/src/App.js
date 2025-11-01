import React, { useState, useEffect } from "react";
import ClientList from "./components/ClientList";
import ClientForm from "./components/ClientForm";
import api from "./services/api";

function App() {
  const [users, setUsers] = useState([]);

  // 🔹 Load users from backend when the app starts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users"); // backend route: /api/users
        setUsers(res.data);
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs :", error);
      }
    };
    fetchUsers();
  }, []);

  // 🔹 Called when a new user is added from ClientForm
  const handleUserAdded = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
  };

  return (
    <div style={{ margin: "40px" }}>
      <h1>🚀 Gestion des utilisateurs</h1>
      <ClientForm onUserAdded={handleUserAdded} />
      <ClientList users={users} />
    </div>
  );
}

export default App;
