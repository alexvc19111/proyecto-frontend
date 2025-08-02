import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import collaps from '../assets/img.png';
import agenda from '../assets/calendar-day-solid.svg';
import calendario from '../assets/Calendar.png';
import user from '../assets/User.png';
import logout from '../assets/logout.svg';
import axiosClient from "../axios/axios_client";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';


export default function Navbar() {
  const [open, setOpen] = useState(true);
    const [roles, setRoles] = useState([]);
  const handleOnClick = () => setOpen(!open);
  const navigate = useNavigate();

  useEffect(() => {
    const storedRoles = localStorage.getItem('roles');
    if (storedRoles) {
      setRoles(JSON.parse(storedRoles));
    }
  }, []);

  const handleLogout = async () => {
  try {
    await axiosClient.post('/logout');
    localStorage.removeItem('roles'); // Elimina el token del almacenamiento local
    localStorage.removeItem('token'); // Elimina el token inmediatamente
  navigate('/login');
  } catch (error) {
    console.error("Error al cerrar sesión", error);
  }
};

  const hasRole = (role) => roles.includes(role);

  return (
    <div className="h-screen bg-slate-500 flex">
      {/* Sidebar */}
      <div className={`duration-300 ${open ? 'w-64' : 'w-20'} bg-slate-900 p-5 pt-8 relative`}>
        {/* Botón de colapsar */}
        <img
          src={collaps}
          alt="collapse"
          onClick={handleOnClick}
          className={`absolute cursor-pointer rounded-full -right-3 top-9 w-7 border-2 bg-cyan-500 transition-transform ${!open && 'rotate-180'}`}
        />

        {/* Logo */}
        <div className="flex gap-x-4 items-center">
          <Link to='/'>
          <img
            src={logo}
            alt="Logo"
            className={`cursor-pointer transition-transform duration-500 ${open && 'rotate-[360deg]'}`}
          />
          </Link>
          
          <h1 className={`text-white font-medium text-xl origin-left transition-all duration-300 ${!open && 'scale-0'}`}>
            S.A.C
          </h1>
        </div>

        {/* Menú */}
        <ul className="menu mt-6 space-y-2">
            {hasRole("medico" ) && (
          <li>
            <Link to='/agenda-medica' className="flex items-center gap-4 text-white hover:bg-slate-100 hover:text-slate-900 p-2 rounded-md">
              <img src={calendario} alt="Agenda" className="w-5 h-5" />
              <span className={`${!open && 'hidden'} transition-all`}>Agenda</span>
            </Link>
          </li>
        )}
            {hasRole("medico") && (
          <li>
            <Link to='/turnos' className="flex items-center gap-4 text-white hover:bg-slate-100 hover:text-slate-900 p-2 rounded-md">
              <img src={calendario} alt="Agendar cita" className="w-5 h-5" />
              <span className={`${!open && 'hidden'} transition-all`}>Gestión de turnos</span>
            </Link>
          </li>
          )}
          {hasRole("recepcionista") && (
          <li>
            <Link to='/reserva' className="flex items-center gap-4 text-white hover:bg-slate-100 hover:text-slate-900 p-2 rounded-md">
              <img src={calendario} alt="Agendar cita" className="w-5 h-5" />
              <span className={`${!open && 'hidden'} transition-all`}>Agendar cita</span>
            </Link>
          </li>
          )}
          {hasRole("Administrador") && (
          <li>
            <Link to='/Usuarios'  className="flex items-center gap-4 text-white hover:bg-slate-100 hover:text-slate-900 p-2 rounded-md">
              <img src={user} alt="Gestionar usuarios" className="w-5 h-5" />
              <span className={`${!open && 'hidden'} transition-all`}>Gestionar usuarios</span>
            </Link>
          </li>
           )}
           {hasRole("Administrador") && (
          <li>
            <Link to='/Empleados'  className="flex items-center gap-4 text-white hover:bg-slate-100 hover:text-slate-900 p-2 rounded-md">
              <img src={user} alt="Gestionar Empleados" className="w-5 h-5" />
              <span className={`${!open && 'hidden'} transition-all`}>Gestionar empleados</span>                                    
            </Link>
          </li>
           )}
          <li>
            <Link to='/Pacientes' className="flex items-center gap-4 text-white hover:bg-slate-100 hover:text-slate-900 p-2 rounded-md">
              <img src={user} alt="Gestionar pacientes" className="w-5 h-5" />
              <span className={`${!open && 'hidden'} transition-all`}>Gestionar pacientes</span>
            </Link>
          </li>
          <li>
            <Link to='/Perfil' className="flex items-center gap-4 text-white hover:bg-slate-100 hover:text-slate-900 p-2 rounded-md">
              <img src={user} alt="Perfil" className="w-5 h-5" />
              <span className={`${!open && 'hidden'} transition-all`}>Perfil</span>
            </Link>
          </li>
          <li>
            <button
            onClick={handleLogout}
             className="flex items-center gap-4 text-white hover:bg-red-100 hover:text-red-800 p-2 rounded-md cursor-pointer">
              <img src={logout} alt="Cerrar sesión" className="w-5 h-5" />
              <span className={`${!open && 'hidden'} transition-all`}>Cerrar sesión</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
