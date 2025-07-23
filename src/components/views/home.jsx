import React, { useEffect, useState } from "react";
import axiosClient from "../../axios/axios_client";
import Navbar from "../../components/navbar";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [user, setUser] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    persona_id: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axiosClient
      .get("/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setUser(data);
        const isAdmin = data.roles.includes("Administrador");

        if (isAdmin) {
          return axiosClient.get("/personas", {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          return [];
        }
      })
      .then(({ data }) => {
        if (Array.isArray(data)) setPersonas(data);
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");

    try {
      await axiosClient.post("/usuarios", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      alert("Usuario creado exitosamente");
      setFormData({ username: "", password: "", persona_id: "" });
    } catch (err) {
      setError(
        err.response?.data?.mensaje || "No se pudo crear usuario, intenta de nuevo."
      );
    }
  };


  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#e0eafc] to-[#cfdef3]">
        <p className="text-xl text-gray-700 animate-pulse">Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#e0eafc] to-[#cfdef3] flex flex-col items-center py-12 px-4 font-sans">
        <h1 className="text-3xl font-bold text-[#2c3e50] mb-6 animate-fadeIn">
          Bienvenido al sistema, {user.username}
        </h1>

        {user.username === "Administrador" && (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md animate-fadeIn"
          >
            <h2 className="text-xl font-semibold mb-4 text-center">Crear nuevo usuario</h2>

            <div className="mb-4 relative">
              <input
                type="text"
                name="username"
                placeholder="Usuario"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 pointer-events-none"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM2 18a8 8 0 1116 0H2z" />
              </svg>
            </div>

            <div className="mb-4 relative">
              <input
                type="password"
                name="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 pointer-events-none"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 8V6a5 5 0 1110 0v2h1a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1h1zm2-2a3 3 0 116 0v2H7V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="mb-4">
              <select
                name="persona_id"
                value={formData.persona_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Selecciona una persona</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombres} {p.apellidos}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-red-500 font-semibold text-center mb-4">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-semibold transition duration-300"
            >
              Crear Usuario
            </button>
          </form>
        )}
      </div>

      <style>
        {`
          .animate-fadeIn {
            animation: fadeIn 0.6s ease-in-out;
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-15px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
    
  );
}
