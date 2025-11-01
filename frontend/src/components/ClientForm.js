import React, { useState } from "react";
import api from "../services/api";

function ClientForm() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    type: "SIMPLE"
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/clients", formData);
    alert("Client ajouté !");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="nom" placeholder="Nom" onChange={handleChange} />
      <input name="prenom" placeholder="Prénom" onChange={handleChange} />
      <input name="email" placeholder="Email" onChange={handleChange} />
      <input name="telephone" placeholder="Téléphone" onChange={handleChange} />
      <input name="adresse" placeholder="Adresse" onChange={handleChange} />
      <select name="type" onChange={handleChange}>
        <option value="SIMPLE">SIMPLE</option>
        <option value="PEINTRE">PEINTRE</option>
      </select>
      <button type="submit">Ajouter</button>
    </form>
  );
}

export default ClientForm;
