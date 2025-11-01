import React, { useEffect, useState } from "react";
import api from "../services/api";

function ClientList() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    api.get("/clients")
      .then((res) => setClients(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2>Liste des clients</h2>
      <ul>
        {clients.map((client) => (
          <li key={client.id}>{client.nom} — {client.email}</li>
        ))}
      </ul>
    </div>
  );
}

export default ClientList;
