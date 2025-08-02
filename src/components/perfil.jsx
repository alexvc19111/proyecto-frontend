import React, { useEffect, useState } from 'react';
import axiosClient from '../axios/axios_client';

function Perfil() {
  const [user, setUser] = useState(null);
  const [especialidad, setEspecialidad] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPerfil() {
      try {
        const res = await axiosClient.get('/me');
        setUser(res.data);

        if (res.data.roles.includes('medico')) {
          const medicoRes = await axiosClient.get(`/medicos/usuario/${res.data.id}`);
          setEspecialidad(medicoRes.data.especialidad_nombre || medicoRes.data.especialidad?.nombre_especialidad);
        }

      } catch (err) {
        setError('Error al cargar los datos del perfil.');
        console.error(err);
      } finally {
        setCargando(false);
      }
    }

    fetchPerfil();
  }, []);

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-48">
                        <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                        <span className="ml-4 text-blue-700 font-medium">Cargando perfil...</span>
                    </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4 font-semibold">
        {error}
      </div>
    );
  }

  if (!user) {
    return null; // O algún mensaje de "no hay usuario"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0eafc] to-[#cfdef3] py-8 px-4 font-sans">
    <div className="max-w-xl mx-auto mt-10 bg-white rounded-lg shadow p-6 font-sans">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Perfil de Usuario</h1>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c3.866 0 7.367 1.567 9.879 4.104M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <h2 className="text-lg font-semibold">{user.persona.nombres} {user.persona.apellidos}</h2>
            <p className="text-gray-600 text-sm">Username: {user.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-gray-700">
          <div>
            <strong>DNI:</strong> {user.persona.dni}
          </div>
          <div>
            <strong>Fecha de nacimiento:</strong> {user.persona.fecha_nacimiento}
          </div>
          <div>
            <strong>Dirección:</strong> {user.persona.direccion || 'No especificada'}
          </div>
          <div>
            <strong>Teléfono:</strong> {user.persona.telefono || 'No especificado'}
          </div>
        </div>

        <div className="mt-4">
          <strong>Roles:</strong> {user.roles.join(', ')}
        </div>

        {user.roles.includes('medico') && (
          <div className="mt-6 p-4 border rounded bg-blue-50 text-blue-700">
            <h3 className="font-semibold mb-2">Especialidad</h3>
            {especialidad ? (
              <p>{especialidad}</p>
            ) : (
              <p className="italic text-gray-500">Cargando especialidad...</p>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

export default Perfil;
