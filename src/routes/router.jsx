// src/routes/router.jsx
import { createBrowserRouter } from "react-router-dom";
import Login from "../components/views/login.jsx";
import Home from "../components/views/home.jsx";
import Dashboard from "../components/views/dashboard.jsx";
import Layout from "../components/layout.jsx";
import Usuarios from "../components/usuarios.jsx";
import Empleados from "../components/empleados.jsx";
import Perfil from "../components/perfil.jsx";
import Pacientes from "../components/pacientes.jsx";
import AgendaMedico from "../components/agendamedico.jsx";
import Turnos from "../components/turnos.jsx";
import Reserva from "../components/reservar.jsx"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <Layout />, // Navbar + Outlet
    children: [
      {path : "/", element: <Home />}, // Home component
      { path: "/usuarios", element: <Usuarios /> },
      { path: "/empleados", element: <Empleados /> },
      { path: "/perfil", element: <Perfil /> },
      { path: "/pacientes", element: <Pacientes /> },
      { path: "/agenda-medica", element: <AgendaMedico /> },
      { path: "/turnos", element: <Turnos /> },
      { path: "/reserva", element: <Reserva /> },

    ],
  },
]);

export default router;
