import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../axios/axios_client";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    console.log("handleSubmit invoked");

    e.preventDefault();
    setError(false);
    try {
      const response = await axiosClient.post("/login", formData);
      console.log("Login response:", response.data);

      const token = response.data.token;

      localStorage.setItem("token", response.data.token);

      const meResponse = await axiosClient.get("/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const roles = meResponse.data.roles ?? []; // si no hay roles, será un array vacío
      localStorage.setItem("roles", JSON.stringify(roles));
            console.log("Login response:", response.data);

      navigate("/");
    } catch {
      setError(true);
      setFormData({ username: "", password: "" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 to-indigo-300 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm animate-fadeIn"
      >
        <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Iniciar Sesión
        </h1>

        {/* Usuario */}
        <div className="relative mb-5">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.1 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.5-4.8-9.6-4.8z" />
          </svg>
          <input
            type="text"
            name="username"
            placeholder="Usuario"
            value={formData.username}
            onChange={handleChange}
            required
            autoComplete="username"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contraseña */}
        <div className="relative mb-6">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-5 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
          </svg>
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Botón */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors"
        >
          Entrar
        </button>

        {/* Error */}
        {error && (
          <p className="mt-4 text-center text-red-600 font-semibold">
            Credenciales inválidas
          </p>
        )}
      </form>
    </div>
  );
}
