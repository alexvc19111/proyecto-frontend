import { useState, useEffect } from 'react';
import axiosClient from '../axios/axios_client';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ username: '', password: '', persona_id: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerUsuarios();
    obtenerPersonas();
  }, []);

  const obtenerUsuarios = async () => {
    setCargando(true);
    try {
      const res = await axiosClient.get('/usuarios');
      setUsuarios(res.data);
      setError(null);
    } catch {
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  };

  const obtenerPersonas = async () => {
    try {
      const res = await axiosClient.get('/personas');
      setPersonas(res.data);
    } catch {
      setPersonas([]);
    }
  };

  const agregarUsuario = async () => {
    if (!nuevoUsuario.username || !nuevoUsuario.password || !nuevoUsuario.persona_id) {
      setError('Por favor completa todos los campos.');
      return;
    }
    try {
      await axiosClient.post('/usuarios', nuevoUsuario);
      setNuevoUsuario({ username: '', password: '', persona_id: '' });
      obtenerUsuarios();
      setError(null);
    } catch {
      setError('Error al agregar usuario.');
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este usuario?')) return;
    try {
      await axiosClient.delete(`/usuarios/${id}`);
      obtenerUsuarios();
    } catch {
      setError('Error al eliminar usuario.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-50 py-10 px-5 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-4xl font-extrabold mb-8 text-gray-900 border-b-2 border-blue-300 pb-2">
          Gestión de Usuarios
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg shadow-sm font-medium">
            {error}
          </div>
        )}

        {/* Formulario Agregar Usuario */}
        <section className="mb-10">
          <h3 className="text-2xl font-semibold mb-5 text-gray-800">Agregar Usuario al Sistema</h3>

          <div className="flex flex-wrap gap-5 items-center">
            <input
              type="text"
              placeholder="Username"
              value={nuevoUsuario.username}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, username: e.target.value })}
              className="flex-grow min-w-[160px] border border-gray-300 rounded-lg px-5 py-3 
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
            <input
              type="password"
              placeholder="Password"
              value={nuevoUsuario.password}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
              className="flex-grow min-w-[160px] border border-gray-300 rounded-lg px-5 py-3 
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
            <select
              value={nuevoUsuario.persona_id}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, persona_id: e.target.value })}
              className="flex-grow min-w-[160px] border border-gray-300 rounded-lg px-5 py-3 
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              <option value="">Seleccione persona</option>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombres} {p.apellidos}
                </option>
              ))}
            </select>
            <button
              onClick={agregarUsuario}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition duration-300 ease-in-out flex items-center gap-2 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M15 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zM15 14c-3.866 0-7 3.134-7 7h2c0-2.757 2.243-5 5-5s5 2.243 5 5h2c0-3.866-3.134-7-7-7z" />
                <path d="M4 11h2v2h2v2H6v2H4v-2H2v-2h2v-2z" />
              </svg>
              Agregar Usuario
            </button>
          </div>
        </section>

        {/* Tabla Usuarios */}
        <section>
          <h3 className="text-2xl font-semibold mb-5 text-gray-800">Usuarios del Sistema</h3>

          {cargando ? (
            <div className="flex justify-center items-center h-48">
                        <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                        <span className="ml-4 text-blue-700 font-medium">Cargando usuarios...</span>
                    </div>
          ) : usuarios.length === 0 ? (
            <p className="text-gray-600 text-center">No hay usuarios para mostrar.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-md border border-gray-300">
              <table className="min-w-full bg-white">
                <thead className="bg-blue-100 border-b border-blue-300">
                  <tr>
                    <th className="text-left text-gray-700 px-6 py-3 font-semibold">Username</th>
                    <th className="text-left text-gray-700 px-6 py-3 font-semibold">Nombres</th>
                    <th className="text-left text-gray-700 px-6 py-3 font-semibold">Apellidos</th>
                    <th className="text-left text-gray-700 px-6 py-3 font-semibold">DNI</th>
                    <th className="text-center text-gray-700 px-6 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="border-b border-gray-200 hover:bg-blue-50 transition"
                    >
                      <td className="px-6 py-4">{usuario.username}</td>
                      <td className="px-6 py-4">{usuario.nombres || '-'}</td>
                      <td className="px-6 py-4">{usuario.apellidos || '-'}</td>
                      <td className="px-6 py-4">{usuario.dni || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => eliminarUsuario(usuario.id)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 transition cursor-pointer"
                          aria-label={`Eliminar usuario ${usuario.username}`}
                          title="Eliminar Usuario"
                        >
                          {/* Icono basura */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4"
                            />
                          </svg>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
