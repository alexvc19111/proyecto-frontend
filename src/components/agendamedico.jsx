import { useEffect, useState } from 'react';
import axios from '../axios/axios_client';

const AgendaMedica = () => {
    const [agenda, setAgenda] = useState([]);
    const [loading, setLoading] = useState(true);
    const [medicoId, setMedicoId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [horas, setHoras] = useState({});

    function formatoHora(hora) {
        if (!hora) return '';
        const [h, m] = hora.split(':');
        return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    }


    // Obtener el ID del médico usando /me
    useEffect(() => {
        const obtenerIdMedico = async () => {
            try {
                const { data: usuario } = await axios.get('/me', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const { data: medico } = await axios.get(`/medicos/usuario/${usuario.id}`);
                setMedicoId(medico.id);
            } catch (error) {
                console.error('Error al obtener el médico:', error);
            }
            
            
        };

        obtenerIdMedico();
    }, []);

    // Obtener la agenda del médico
    useEffect(() => {
        setLoading(true);
        if (!medicoId) return;

        const obtenerAgenda = async () => {
            try {
                const { data } = await axios.get(`/agenda/medico/${medicoId}`);
                const ordenDias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

                const agendaOrdenada = data.sort((a, b) => {
                    return ordenDias.indexOf(a.dia_semana.toLowerCase()) - ordenDias.indexOf(b.dia_semana.toLowerCase());
                });

                setAgenda(agendaOrdenada);
                setAgenda(data);
            } catch (error) {
                console.error('Error al obtener la agenda:', error);
            }
            setLoading(false);
        };

        obtenerAgenda();
    }, [medicoId]);

    const handleChange = (e, id) => {
        setHoras({
            ...horas,
            [id]: {
                ...horas[id],
                [e.target.name]: e.target.value
            }
        });
    };

    const handleEdit = (id) => {
        setEditingId(id);
        const fila = agenda.find((a) => a.id === id);
        setHoras({
            ...horas,
            [id]: {
                hora_inicio: fila.hora_inicio,
                hora_fin: fila.hora_fin,
                almuerzo_inicio: fila.almuerzo_inicio || '',
                almuerzo_fin: fila.almuerzo_fin || ''
            }
        });
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    const handleSave = async (id) => {
        try {
            const actual = agenda.find((a) => a.id === id);

            await axios.put(`/agenda/${id}`, {
                medico_id: medicoId,
                dia_semana: actual.dia_semana,
                hora_inicio: formatoHora(horas[id].hora_inicio),
                hora_fin: formatoHora(horas[id].hora_fin),
                almuerzo_inicio: formatoHora(horas[id].almuerzo_inicio),
                almuerzo_fin: formatoHora(horas[id].almuerzo_fin)
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            const actualizada = agenda.map((a) =>
                a.id === id
                    ? {
                        ...a,
                        hora_inicio: horas[id].hora_inicio,
                        hora_fin: horas[id].hora_fin,
                        almuerzo_inicio: horas[id].almuerzo_inicio,
                        almuerzo_fin: horas[id].almuerzo_fin
                    }
                    : a
            );

            setAgenda(actualizada);
            setEditingId(null);
        } catch (error) {
            if (error.response && error.response.status === 422) {
                const errores = error.response.data.errors;
                const mensajes = Object.values(errores).flat().join('\n');
                alert('Errores de validación:\n' + mensajes);
            } else if (error.response?.data?.error) {
                alert('Error: ' + error.response.data.error);
            } else {
                alert('Error desconocido');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#e0eafc] to-[#cfdef3] py-8 px-4 font-sans">
            <div className="p-6 max-w-6xl mx-auto">
                <h2 className="text-3xl font-semibold mb-6 text-gray-800">Mi Agenda Médica:</h2>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                        <span className="ml-4 text-blue-700 font-medium">Cargando agenda...</span>
                    </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-sm">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wider">
                                <th className="px-6 py-3 text-left">Día</th>
                                <th className="px-6 py-3 text-left">Hora Inicio</th>
                                <th className="px-6 py-3 text-left">Hora Fin</th>
                                <th className="px-6 py-3 text-left">Almuerzo Inicio</th>
                                <th className="px-6 py-3 text-left">Almuerzo Fin</th>
                                <th className="px-6 py-3 text-left">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="text-gray-700 text-sm">
                            {agenda.map((item) => (
                                <tr key={item.id} className="border-t hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">{item.dia_semana}</td>

                                    <td className="px-6 py-4">
                                        {editingId === item.id ? (
                                            <input
                                                type="time"
                                                name="hora_inicio"
                                                value={horas[item.id]?.hora_inicio || ''}
                                                onChange={(e) => handleChange(e, item.id)}
                                                className="border border-gray-300 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            item.hora_inicio
                                        )}
                                    </td>

                                    <td className="px-6 py-4">
                                        {editingId === item.id ? (
                                            <input
                                                type="time"
                                                name="hora_fin"
                                                value={horas[item.id]?.hora_fin || ''}
                                                onChange={(e) => handleChange(e, item.id)}
                                                className="border border-gray-300 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            item.hora_fin
                                        )}
                                    </td>

                                    <td className="px-6 py-4">
                                        {editingId === item.id ? (
                                            <input
                                                type="time"
                                                name="almuerzo_inicio"
                                                value={horas[item.id]?.almuerzo_inicio || ''}
                                                onChange={(e) => handleChange(e, item.id)}
                                                className="border border-gray-300 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            item.almuerzo_inicio || "-"
                                        )}
                                    </td>

                                    <td className="px-6 py-4">
                                        {editingId === item.id ? (
                                            <input
                                                type="time"
                                                name="almuerzo_fin"
                                                value={horas[item.id]?.almuerzo_fin || ''}
                                                onChange={(e) => handleChange(e, item.id)}
                                                className="border border-gray-300 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            item.almuerzo_fin || "-"
                                        )}
                                    </td>

                                    <td className="px-6 py-4 flex space-x-2">
                                        {editingId === item.id ? (
                                            <>
                                                <button
                                                    onClick={() => handleSave(item.id)}
                                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md transition"
                                                >
                                                    Guardar
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded-md transition"
                                                >
                                                    Cancelar
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleEdit(item.id)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition"
                                            >
                                                Editar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             )}
            </div>
           

        </div>
    );
};

export default AgendaMedica;
