import React, { useState } from 'react';
import axiosClient from '../axios/axios_client';

function Pacientes() {
    const [busqueda, setBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [cargandoBusqueda, setCargandoBusqueda] = useState(false);

    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        dni: '',
        fecha_nacimiento: '',
        direccion: '',
        telefono: '',
    });

    const [cargandoForm, setCargandoForm] = useState(false);

    // Buscar pacientes por término
    const buscarPacientes = async () => {
        if (busqueda.trim().length === 0) {
            setResultados([]);
            return;
        }
        setCargandoBusqueda(true);
        try {
            const res = await axiosClient.get(`/pacientes/buscar?q=${encodeURIComponent(busqueda)}`);
            setResultados(res.data);
        } catch (error) {
            console.error('Error buscando pacientes:', error);
            setResultados([]);
        } finally {
            setCargandoBusqueda(false);
        }
    };

    // Eliminar paciente
    const eliminarPaciente = async (pacienteId, personaId) => {
        if (!window.confirm('¿Seguro que quieres eliminar este paciente y su persona asociada?')) return;

        try {
            // 1. Eliminar paciente
            await axiosClient.delete(`/pacientes/${pacienteId}`);

            // 2. Eliminar persona asociada
            await axiosClient.delete(`/personas/${personaId}`);

            alert('Paciente y persona eliminados correctamente');
            setResultados(prev => prev.filter(p => p.id !== pacienteId));
        } catch (error) {
            console.error('Error al eliminar paciente o persona:', error);
            alert('Error al eliminar paciente o su persona asociada');
        }
    };

    // Manejo de inputs formulario
    const handleChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Validar datos mínimos del formulario
    const validarDatos = () => {
        const errores = [];
        if (!formData.nombres.trim()) errores.push('Nombres es obligatorio.');
        if (!formData.apellidos.trim()) errores.push('Apellidos es obligatorio.');
        if (!formData.dni.trim()) errores.push('DNI es obligatorio.');
        if (!formData.fecha_nacimiento.trim()) errores.push('Fecha de nacimiento es obligatoria.');
        return errores;
    };

    // Guardar nuevo paciente: crea persona y paciente
    const handleSubmit = async e => {
        e.preventDefault();

        const errores = validarDatos();
        if (errores.length > 0) {
            alert('Errores:\n' + errores.join('\n'));
            return;
        }

        setCargandoForm(true);
        try {
            const resPersona = await axiosClient.post('/personas', {
                nombres: formData.nombres,
                apellidos: formData.apellidos,
                dni: formData.dni,
                fecha_nacimiento: formData.fecha_nacimiento,
                direccion: formData.direccion,
                telefono: formData.telefono,
            });

            const persona_id = resPersona.data.id || resPersona.data.persona?.id || resPersona.data.persona_id || null;

            if (!persona_id) throw new Error('No se pudo obtener el ID de la persona creada');

            await axiosClient.post('/pacientes', { persona_id });

            alert('Paciente creado correctamente');
            setFormData({
                nombres: '',
                apellidos: '',
                dni: '',
                fecha_nacimiento: '',
                direccion: '',
                telefono: '',
            });

            buscarPacientes();

        } catch (error) {
            console.error('Error al crear paciente:', error);
            alert('Error al crear paciente. Revisa la consola.');
        } finally {
            setCargandoForm(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-50 py-10 px-5 font-sans">
            <div className="min-h-screen bg-gray-100 p-6 font-sans max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Pacientes</h1>

                {/* Buscador */}
                <div className="mb-8">
                    <label htmlFor="buscar" className="block mb-2 font-semibold text-gray-700 flex items-center gap-2">
                        Buscar paciente:
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="buscar"
                            type="text"
                            placeholder="Ingresa nombre, apellido, dni, etc."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            className="flex-grow px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={buscarPacientes}
                            disabled={cargandoBusqueda}
                            className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                        >
                            {cargandoBusqueda ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8z"
                                        />
                                    </svg>
                                    Buscando...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 640 640" stroke="currentColor" strokeWidth={2}>
                                        <path fill="#ffffff" strokeLinecap="round" strokeLinejoin="round" d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z" />
                                    </svg>
                                    Buscar
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Resultados */}
                <div className="mb-12 bg-white rounded shadow p-4">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                        </svg>
                        Resultados de búsqueda
                    </h2>
                    {cargandoBusqueda ? (
                        <div className="flex justify-center items-center h-48">
                        <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                        <span className="ml-4 text-blue-700 font-medium">Cargando pacientes ...</span>
                    </div>
                    ) : resultados.length === 0 ? (
                        <p className="text-center text-gray-600">No se encontraron pacientes.</p>
                    ) : (
                        <table className="w-full text-left border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-300 px-3 py-2">Nombres</th>
                                    <th className="border border-gray-300 px-3 py-2">Apellidos</th>
                                    <th className="border border-gray-300 px-3 py-2">DNI</th>
                                    <th className="border border-gray-300 px-3 py-2">Fecha Nac.</th>
                                    <th className="border border-gray-300 px-3 py-2">Teléfono</th>
                                    <th className="border border-gray-300 px-3 py-2 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resultados.map(paciente => {
                                    const persona = paciente.persona || {};
                                    return (
                                        <tr key={paciente.id} className="hover:bg-gray-100">
                                            <td className="border border-gray-300 px-3 py-2">{persona.nombres || '-'}</td>
                                            <td className="border border-gray-300 px-3 py-2">{persona.apellidos || '-'}</td>
                                            <td className="border border-gray-300 px-3 py-2">{persona.dni || '-'}</td>
                                            <td className="border border-gray-300 px-3 py-2">{persona.fecha_nacimiento || '-'}</td>
                                            <td className="border border-gray-300 px-3 py-2">{persona.telefono || '-'}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-center">
                                                <button
                                                    onClick={() => eliminarPaciente(paciente.id, paciente.persona?.id)}
                                                    className="text-red-600 hover:text-red-800 font-semibold cursor-pointer flex items-center gap-1 justify-center"
                                                    title="Eliminar paciente"
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
                                                    </svg>
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Formulario agregar paciente */}
                <div className="bg-white rounded shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Agregar Paciente
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Nombres *</label>
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
                            <label className="block mb-1 font-medium text-gray-700">Apellidos *</label>
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
                            <label className="block mb-1 font-medium text-gray-700">DNI *</label>
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
                            <label className="block mb-1 font-medium text-gray-700">Fecha de nacimiento *</label>
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

                        <div className="md:col-span-2 flex justify-end mt-4">
                            <button
                                type="submit"
                                disabled={cargandoForm}
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition duration-300 ease-in-out flex items-center gap-2 cursor-pointer"            >
                                {cargandoForm ? (
                                    <>
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v8z"
                                            />
                                        </svg>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-white"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M15 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zM15 14c-3.866 0-7 3.134-7 7h2c0-2.757 2.243-5 5-5s5 2.243 5 5h2c0-3.866-3.134-7-7-7z" />
                                            <path d="M4 11h2v2h2v2H6v2H4v-2H2v-2h2v-2z" />
                                        </svg>
                                        Agregar Paciente
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Pacientes;
