// src/routes/router.jsx
import { createBrowserRouter } from "react-router-dom";
import Login from "../components/views/login.jsx";
import Home from "../components/views/home.jsx";
import Dashboard from "../components/views/dashboard.jsx";
import Layout from "../components/layout.jsx";

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
      // { path: "usuarios", element: <Usuarios /> },
    ],
  },
]);

export default router;
