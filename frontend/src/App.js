import React, { useState } from "react";
import UserList from "./components/UserList";
import UserForm from "./components/UserForm";

function App() {
  const [users, setUsers] = useState([]);

  const handleUserAdded = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
  };

  return (
    <div style={{ margin: "40px" }}>
      <h1>🚀 User Management</h1>
      <UserForm onUserAdded={handleUserAdded} />
      <UserList users={users} />
    </div>
  );
}

export default App;
