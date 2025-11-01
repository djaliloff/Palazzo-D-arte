import React, { useState } from "react";
import api from "../services/api";

const UserForm = ({ onUserAdded }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return alert("Please fill all fields");

    try {
      const res = await api.post("/users", { name, email });
      onUserAdded(res.data);
      setName("");
      setEmail("");
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>➕ Add User</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Add</button>
    </form>
  );
};

export default UserForm;
