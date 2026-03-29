import React, { useState } from "react";

export default function ClientRegister({ onRegister, onSearch }) {
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    identificacion: "",
    direccion: "",
    genero: "",
    telefono: ""
  });
  const [searchTerm, setSearchTerm] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    onRegister(form);
    setForm({ nombres: "", apellidos: "", identificacion: "", direccion: "", genero: "", telefono: "" });
  };

  const handleSearch = e => {
    e.preventDefault();
    onSearch(searchTerm);
    setSearchTerm("");
  };

  return (
    <div className="client-register-container">
      <h2>Buscar Cliente</h2>
      <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o teléfono"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button type="submit">Buscar</button>
      </form>
      <h2>Registrar Nuevo Cliente</h2>
      <form onSubmit={handleSubmit} className="client-form">
        <input name="nombres" placeholder="Nombres" value={form.nombres} onChange={handleChange} required />
        <input name="apellidos" placeholder="Apellidos" value={form.apellidos} onChange={handleChange} required />
        <input name="identificacion" placeholder="Identificación" value={form.identificacion} onChange={handleChange} required />
        <input name="direccion" placeholder="Dirección" value={form.direccion} onChange={handleChange} required />
        <select name="genero" value={form.genero} onChange={handleChange} required>
          <option value="">Género</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
          <option value="Otro">Otro</option>
        </select>
        <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} required />
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}
