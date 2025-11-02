import React from 'react';
import ClientList from '../components/ClientList';
import ClientForm from '../components/ClientForm';

const ClientsPage = () => {
  return (
    <div>
      <h1>Clients</h1>
      <ClientForm />
      <ClientList />
    </div>
  );
};

export default ClientsPage;

