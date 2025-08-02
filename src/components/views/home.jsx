import React, { useEffect, useState } from "react";
import axiosClient from "../../axios/axios_client";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [user, setUser] = useState(null);
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
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-48">
                        <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                        <span className="ml-4 text-blue-700 font-medium">Cargando...</span>
                    </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0eafc] to-[#cfdef3] flex flex-col items-center py-12 px-4 font-sans">
      <h1 className="text-3xl font-bold text-[#2c3e50] mb-6 animate-fadeIn">
        Bienvenido al sistema, {user.persona.nombres} {user.persona.apellidos}!
      </h1>

      <p className="text-lg text-gray-600">
        Aquí puedes navegar por las diferentes secciones del sistema desde el menú lateral.
      </p>
    </div>
  );
}
