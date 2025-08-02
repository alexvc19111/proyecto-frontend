import React, { useState, useEffect } from 'react';
import axiosClient from '../axios/axios_client';
import iconMinus from '../assets/minus-user.svg';
import iconPlus from '../assets/add-user.svg';

function Empleados() {
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        dni: '',
        fecha_nacimiento: '',
        direccion: '',
        telefono: '',
        username: '',
        password: '',
        especialidad_id: '',
    });

    const [especialidades, setEspecialidades] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [rol, setRol] = useState('medico');
    const [cargando, setCargando] = useState(false);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    useEffect(() => {
        obtenerEspecialidades();
        obtenerEmpleados();
    }, []);

    const eliminarEmpleado = async (usuarioId) => {
        if (!window.confirm('¿Estás seguro de eliminar este empleado?')) return;

        try {
            setCargando(true);

            const resUsuario = await axiosClient.get(`/usuarios/${usuarioId}`);
            const personaId = resUsuario.data.persona_id;


            await axiosClient.delete(`/usuarios/${usuarioId}`);

            await axiosClient.delete(`/personas/${personaId}`);
            await obtenerEmpleados();
            alert('Empleado eliminado correctamente');
        } catch (error) {
            console.error('Error al eliminar empleado:', error.response?.data || error);
            alert('Error al eliminar empleado. Revisa la consola.');
        } finally {
            setCargando(false);
        }
    };




    const obtenerEspecialidades = async () => {
        try {
            const response = await axiosClient.get('/especialidades');
            setEspecialidades(response.data);
        } catch (error) {
            console.error('Error al obtener especialidades', error);
        }
    };

    const obtenerEmpleados = async () => {
        setCargando(true);
        try {
            const response = await axiosClient.get('/usuarios');
            const filtrados = response.data.filter(u =>
                u.roles.includes('medico') || u.roles.includes('recepcionista')
            );
            setEmpleados(filtrados);
        } catch (error) {
            console.error('Error al obtener empleados', error);
        } finally {
            setCargando(false);
        }
    };

    const handleChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validarDatos = async () => {
        const errores = [];

        if (!formData.nombres.trim()) errores.push('Nombres es obligatorio.');
        if (!formData.apellidos.trim()) errores.push('Apellidos es obligatorio.');
        if (!formData.dni.trim()) errores.push('DNI es obligatorio.');
        if (!formData.username.trim()) errores.push('Nombre de usuario es obligatorio.');
        if (!formData.password.trim()) errores.push('Contraseña es obligatoria.');
        else if (formData.password.length < 6) {
            errores.push('La contraseña debe tener al menos 6 caracteres.');
        }
        if (rol === 'medico' && !formData.especialidad_id) errores.push('Especialidad es obligatoria para médicos.');

        try {
            const response = await axiosClient.get('/usuarios');
            const usuarios = response.data;

            if (usuarios.some(u => u.persona?.dni === formData.dni)) {
                errores.push(`El DNI ${formData.dni} ya está registrado.`);
            }
            if (usuarios.some(u => u.username === formData.username)) {
                errores.push(`El nombre de usuario "${formData.username}" ya está registrado.`);
            }
        } catch (error) {
            errores.push('Error al validar duplicados en el servidor.');
            console.error('Error validando duplicados:', error);
        }

        return errores;
    };


    const handleSubmit = async e => {
        e.preventDefault();

        setCargando(true);

        try {
            const errores = await validarDatos();
            if (errores.length > 0) {
                alert('Errores encontrados:\n' + errores.join('\n'));
                return; // ⚠️ Abortar envío
            }

            // Extraer datos
            const {
                nombres, apellidos, dni, fecha_nacimiento,
                direccion, telefono, username, password, especialidad_id
            } = formData;

            // Crear persona
            const personaRes = await axiosClient.post('/personas', {
                nombres,
                apellidos,
                dni,
                fecha_nacimiento,
                direccion,
                telefono,
            });

            const persona_id = personaRes.data.persona?.id;

            // Crear usuario
            const userRes = await axiosClient.post('/usuarios', {
                username,
                password,
                persona_id
            });

            const usuario_id = userRes.data.usuario?.id;

            // Asignar rol
            await axiosClient.post('/usuario-roles', {
                usuario_id,
                rol_id: rol === 'medico' ? 5 : 6
            });

            // Si es médico, asignar especialidad
            if (rol === 'medico') {
                await axiosClient.post('/medicos', {
                    usuario_id,
                    especialidad_id,
                });
            }

            alert('Empleado registrado exitosamente');

            // Limpiar formulario
            setFormData({
                nombres: '',
                apellidos: '',
                dni: '',
                fecha_nacimiento: '',
                direccion: '',
                telefono: '',
                username: '',
                password: '',
                especialidad_id: '',
            });

            obtenerEmpleados();
            setMostrarFormulario(false);
        } catch (error) {
            console.error('Error al registrar empleado', error.response?.data || error);

            const erroresApi = error.response?.data?.errors;
            if (erroresApi) {
                const mensajes = Object.values(erroresApi).flat();
                alert('Errores del servidor:\n' + mensajes.join('\n'));
            } else if (error.response?.data?.message) {
                alert('Error: ' + error.response.data.message);
            } else {
                alert('Ocurrió un error al registrar el empleado. Revisa la consola.');
            }
        } finally {
            setCargando(false);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-[#e0eafc] to-[#cfdef3] py-8 px-4 font-sans">

            <div className="max-w-7xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Gestión de Empleados</h1>

                <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Agregar Empleado</h2>
                        <button
                            onClick={() => setMostrarFormulario(!mostrarFormulario)}
                            aria-label={mostrarFormulario ? 'Ocultar formulario' : 'Mostrar formulario'}
                            className={`text-white rounded-full w-10 h-10 flex items-center justify-center focus:outline-none transition cursor-pointer
    ${mostrarFormulario ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            <img
                                src={mostrarFormulario ? iconMinus : iconPlus}
                                alt={mostrarFormulario ? 'Ocultar formulario' : 'Mostrar formulario'}
                                className="w-5 h-5"
                            />
                        </button>

                    </div>

                    {mostrarFormulario && (
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium text-gray-700">Nombres</label>
                                <input
                                    type="text"
                                    name="nombres"
                                    value={formData.nombres}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium text-gray-700">Apellidos</label>
                                <input
                                    type="text"
                                    name="apellidos"
                                    value={formData.apellidos}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium text-gray-700">DNI</label>
                                <input
                                    type="text"
                                    name="dni"
                                    value={formData.dni}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium text-gray-700">Fecha de nacimiento</label>
                                <input
                                    type="date"
                                    name="fecha_nacimiento"
                                    value={formData.fecha_nacimiento}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium text-gray-700">Dirección</label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={formData.direccion}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium text-gray-700">Teléfono</label>
                                <input
                                    type="text"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium text-gray-700">Nombre de usuario</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium text-gray-700">Contraseña</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium text-gray-700">Rol</label>
                                <select
                                    value={rol}
                                    onChange={e => setRol(e.target.value)}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="medico">Médico</option>
                                    <option value="recepcionista">Recepcionista</option>
                                </select>
                            </div>

                            {rol === 'medico' && (
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700">Especialidad</label>
                                    <select
                                        name="especialidad_id"
                                        value={formData.especialidad_id}
                                        onChange={handleChange}
                                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required={rol === 'medico'}
                                    >
                                        <option value="">Seleccione una especialidad</option>
                                        {especialidades.map(esp => (
                                            <option key={esp.id} value={esp.id}>
                                                {esp.nombre_especialidad}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="md:col-span-2 flex justify-end mt-4">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition "
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Lista de empleados */}
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-semibold mb-4">Lista de Empleados</h2>
                    <div className="overflow-x-auto rounded shadow">
                        <table className="min-w-full bg-white divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">ID</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Nombre</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Rol</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">DNI</th>
                                    <th className="py-3 px-4 text-center font-medium text-gray-700">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-6 text-gray-600">
                                            <div className="flex justify-center items-center h-48">
                        <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                        <span className="ml-4 text-blue-700 font-medium">Cargando empleados...</span>
                    </div>
                                        </td>
                                    </tr>
                                ) : empleados.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-6 text-gray-600">
                                            No hay empleados para mostrar.
                                        </td>
                                    </tr>
                                ) : (
                                    empleados
                                        .filter(emp => emp.roles.includes('medico') || emp.roles.includes('recepcionista'))
                                        .map(emp => (
                                            <tr key={emp.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-4 border">{emp.id}</td>
                                                <td className="py-3 px-4 border">{emp.nombres} {emp.apellidos}</td>
                                                <td className="py-3 px-4 border capitalize">
                                                    {emp.roles.includes('medico') ? 'Médico' : 'Recepcionista'}
                                                </td>
                                                <td className="py-3 px-4 border">{emp.dni}</td>
                                                <td className="py-3 px-4 border text-center">
                                                    <button
                                                        onClick={() => eliminarEmpleado(emp.id)}
                                                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 transition cursor-pointer"
                                                        title="Eliminar empleado"
                                                    >
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
                                                        </svg>Eliminar


                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Empleados;
