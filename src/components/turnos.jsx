import { useEffect, useState } from 'react';
import axios from '../axios/axios_client';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


function Turnos() {

const [roles, setRoles] = useState([]);
    const [historialTurnos, setHistorialTurnos] = useState([]);
    const [loadingHistorial, setLoadingHistorial] = useState(true);
    const [atencionSeleccionada, setAtencionSeleccionada] = useState(null);

    const [turnoAtencion, setTurnoAtencion] = useState(null);
    const [atencionForm, setAtencionForm] = useState({
        presion: '',
        temperatura: '',
        frecuencia_cardiaca: '',
        frecuencia_respiratoria: '',
        peso: '',
        talla: '',
        diagnostico: '',
        observaciones: ''
    });

    const [nuevoEstado, setNuevoEstado] = useState('');
    const [cambiandoEstado, setCambiandoEstado] = useState(false);


    const ESTADO_CANCELADO = 16;
    const ESTADO_NO_ASISTIO = 17;

    const [mostrarGenerar, setMostrarGenerar] = useState(false);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [generando, setGenerando] = useState(false);

    const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
    const [turnosReservados, setTurnosReservados] = useState([]);
    const [turnosDisponibles, setTurnosDisponibles] = useState([]);
    const [loadingReservados, setLoadingReservados] = useState(true);
    const [loadingDisponibles, setLoadingDisponibles] = useState(false);
    const [medicoId, setMedicoId] = useState(null);

    // Para el desplegable de reservar turno
    const [mostrarDisponibles, setMostrarDisponibles] = useState(false);

    // Para búsqueda paciente
    const [busquedaPaciente, setBusquedaPaciente] = useState('');
    const [resultadosPaciente, setResultadosPaciente] = useState([]);
    const [buscandoPaciente, setBuscandoPaciente] = useState(false);

    // Para agendar turno
    const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
    const [motivoConsulta, setMotivoConsulta] = useState('');
    const [agendando, setAgendando] = useState(false);


    const toggleGenerar = () => {
        setMostrarGenerar((prev) => {
            const next = !prev;
            if (next) {
                const hoy = new Date();
                const yyyy = hoy.getFullYear();
                const mm = String(hoy.getMonth() + 1).padStart(2, '0');
                const dd = String(hoy.getDate()).padStart(2, '0');
                setFechaDesde(`${yyyy}-${mm}-${dd}`);
            } else {
                setFechaDesde('');
                setFechaHasta('');
            }
            return next;
        });
    };



    
    // Obtener médico y turnos reservados
    useEffect(() => {
        
        const storedRoles = localStorage.getItem('roles');
    if (storedRoles) {
      setRoles(JSON.parse(storedRoles));
    }
        const fetchMedicoYReservados = async () => {
            try {
                const { data: usuario } = await axios.get('/me', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });

                const { data: medico } = await axios.get(`/medicos/usuario/${usuario.id}`);
                recargarHistorial(medico.id);
                setMedicoId(medico.id);

                // Traer turnos reservados
                const { data: reservados } = await axios.get(`/turnos/reservados/${medico.id}`);
                const reservadosConPaciente = await Promise.all(
                    reservados.map(async (turno) => {
                        try {
                            const { data: pacientePersona } = await axios.get(`/personas/${turno.paciente.persona_id}`);
                            return { ...turno, pacienteNombre: `${pacientePersona.nombres} ${pacientePersona.apellidos}` };
                        } catch {
                            return { ...turno, pacienteNombre: 'Nombre no disponible' };
                        }
                    })
                );
                setTurnosReservados(reservadosConPaciente);
            
            } catch (error) {
                console.error('Error al obtener médico y turnos reservados:', error);
            } finally {
                setLoadingReservados(false);
            }
        };
        fetchMedicoYReservados();
    }, []);

    const generarTurnos = async () => {
        if (!fechaDesde || !fechaHasta) {
            alert('Debes seleccionar ambas fechas.');
            return;
        }
        setGenerando(true);
        try {
            await axios.post(`/turnos/generarturnos/${medicoId}`, {
                fecha_desde: fechaDesde,
                fecha_hasta: fechaHasta
            });
            alert('Turnos generados correctamente.');
            setMostrarGenerar(false);
            setFechaDesde('');
            setFechaHasta('');
            // Opcional: recargar turnos disponibles, quiero hacerlo
            // Puedes llamar aquí a toggleDisponibles() si quieres refrescar la lista
        } catch (error) {
            alert('Error al generar turnos.');
            console.error(error);
        } finally {
            setGenerando(false);
        }
    };
const hasRole = (role) => roles.includes(role);
    const recargarHistorial = async (medicoIdParam = medicoId) => {
        if (!medicoIdParam) return;
        setLoadingHistorial(true);
        try {
            const { data: historial } = await axios.get(`/turnos/historial/${medicoIdParam}`);
            // Filtrar por estados 16, 17, 18
            const filtrados = historial.filter(t => [16, 17, 18].includes(t.estado_turno_id));
            const historialConPaciente = await Promise.all(
                filtrados.map(async (turno) => {
                    try {
                        const { data: pacientePersona } = await axios.get(`/personas/${turno.paciente.persona_id}`);
                        return { ...turno, pacienteNombre: `${pacientePersona.nombres} ${pacientePersona.apellidos}` };
                    } catch {
                        return { ...turno, pacienteNombre: 'Nombre no disponible' };
                    }
                })
            );
            setHistorialTurnos(historialConPaciente);
        } catch (error) {
            setHistorialTurnos([]);
        } finally {
            setLoadingHistorial(false);
        }
    };
    // Función para abrir/cerrar desplegable y cargar turnos disponibles
    const toggleDisponibles = async () => {
        setMostrarDisponibles(!mostrarDisponibles);

        if (!mostrarDisponibles && medicoId) {
            setLoadingDisponibles(true);
            try {
                // Fecha actual + 30 días en formato ISO YYYY-MM-DD
                const fechaHasta = new Date();
                fechaHasta.setDate(fechaHasta.getDate() + 30);
                const fechaHastaStr = fechaHasta.toISOString().slice(0, 10);


                const { data: disponibles } = await axios.get(`/turnos/disponibles/${medicoId}`, {
                    params: { fecha_hasta: fechaHastaStr }
                });

                setTurnosDisponibles(disponibles);
            } catch (error) {
                console.error('Error al obtener turnos disponibles:', error);
            } finally {
                setLoadingDisponibles(false);
            }
        } else {
            setTurnosDisponibles([]);
            setBusquedaPaciente('');
            setResultadosPaciente([]);
            setTurnoSeleccionado(null);
            setMotivoConsulta('');
        }
        
    };

    // Buscar pacientes
    const buscarPacientes = async () => {
        if (busquedaPaciente.trim().length === 0) {
            setResultadosPaciente([]);
            return;
        }
        setBuscandoPaciente(true);
        try {
            const res = await axios.get(`/pacientes/buscar?q=${encodeURIComponent(busquedaPaciente)}`);
            setResultadosPaciente(res.data);
        } catch (error) {
            console.error('Error buscando pacientes:', error);
            setResultadosPaciente([]);
        } finally {
            setBuscandoPaciente(false);
        }
    };

    // Agendar turno
    const agendarTurno = async () => {
        if (!turnoSeleccionado) {
            alert('Selecciona un turno para agendar.');
            return;
        }
        if (!motivoConsulta.trim()) {
            alert('Por favor ingresa un motivo de consulta.');
            return;
        }
        if (!turnoSeleccionado.paciente_id) {
            alert('Selecciona un paciente.');
            return;
        }

        setAgendando(true);
        try {
            await axios.put(`/turnos/${turnoSeleccionado.id}/agendar`, {
                paciente_id: turnoSeleccionado.paciente_id,
                motivo_consulta: motivoConsulta,
                estado_turno_id: 14, // Asumo 14 es el id para "Reservado"
            });

            alert('Turno agendado correctamente.');

            // Recargar turnos reservados y disponibles
            // Actualizamos listas sin recargar toda la página:
            // Removemos el turno agendado de disponibles:
            setTurnosDisponibles((prev) => prev.filter((t) => t.id !== turnoSeleccionado.id));

            // Recargamos turnos reservados
            const { data: reservados } = await axios.get(`/turnos/reservados/${medicoId}`);
            const reservadosConPaciente = await Promise.all(
                reservados.map(async (turno) => {
                    try {
                        const { data: pacientePersona } = await axios.get(`/personas/${turno.paciente.persona_id}`);
                        return { ...turno, pacienteNombre: `${pacientePersona.nombres} ${pacientePersona.apellidos}` };
                    } catch {
                        return { ...turno, pacienteNombre: 'Nombre no disponible' };
                    }
                })
            );
            setTurnosReservados(reservadosConPaciente);

            // Limpiar formulario y selección
            setTurnoSeleccionado(null);
            setBusquedaPaciente('');
            setResultadosPaciente([]);
            setMotivoConsulta('');
        } catch (error) {
            console.error('Error al agendar turno:', error);
            alert('Error al agendar turno. Revisa la consola.');
        } finally {
            setAgendando(false);
        }
    };

    // Seleccionar paciente en la búsqueda
    const seleccionarPaciente = (paciente) => {
        setTurnoSeleccionado((prev) => ({ ...prev, paciente_id: paciente.id, pacienteNombre: `${paciente.persona.nombres} ${paciente.persona.apellidos}` }));
        setResultadosPaciente([]);
        setBusquedaPaciente('');
        setPacienteSeleccionado(paciente);
        setResultadosPaciente([]);
    };

    const generarPDFAtencion = (atencion) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Atención realizada", 14, 18);
    doc.setFontSize(12);
    doc.text(`Fecha: ${atencion.turno?.fecha || ""}`, 14, 28);
    doc.text(`Hora: ${atencion.turno?.hora || ""}`, 14, 36);
    doc.text(`Paciente: ${atencion.turno?.pacienteNombre || ""}`, 14, 44);

    autoTable(doc, {
        startY: 54,
        head: [["Campo", "Valor"]],
        body: [
            ["Presión", atencion.presion || ""],
            ["Temperatura", atencion.temperatura || ""],
            ["Frecuencia cardíaca", atencion.frecuencia_cardiaca || ""],
            ["Frecuencia respiratoria", atencion.frecuencia_respiratoria || ""],
            ["Peso", atencion.peso || ""],
            ["Talla", atencion.talla || ""],
            ["Diagnóstico", atencion.diagnostico || ""],
            ["Observaciones", atencion.observaciones || ""],
        ],
    });

    doc.save(`atencion_${atencion.turno?.fecha || ""}_${atencion.turno?.hora || ""}.pdf`);
};


    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-50 py-10 px-6 font-sans max-w-4xl mx-auto">

            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Gestión de Turnos</h1>

            {/* Carta Turnos reservados (tu diseño compacto anterior) */}
            {hasRole("medico" ) && (
            <div className="bg-white rounded-xl shadow-lg p-5 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 0a2 2 0 100-4H7a2 2 0 000 4m0 0v4m0 0H6a2 2 0 000 4h12a2 2 0 000-4h-1" />
                    </svg>
                    Turnos Reservados
                </h2>

                {loadingReservados ? (
                    <div className="flex justify-center items-center h-24">
                        <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                        <span className="ml-3 text-blue-700 font-semibold">Cargando turnos...</span>
                    </div>
                ) : turnosReservados.length === 0 ? (
                    <p className="text-center text-gray-600 text-lg">No hay turnos reservados.</p>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        <ul className="space-y-3">
                            {turnosReservados.map((turno) => (
                                <li
                                    key={turno.id}
                                    className="border border-blue-300 rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer bg-blue-50 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                                    onClick={() => {
                                        setTurnoAtencion(turno);
                                        setNuevoEstado(turno.estado_turno_id);
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-1 sm:mb-0 flex-wrap">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-blue-600 flex-shrink-0"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A7.5 7.5 0 0112 15a7.5 7.5 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="font-semibold text-blue-700">{turno.pacienteNombre}</span>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-gray-700 text-sm font-medium max-w-xs sm:max-w-none">
                                        <div className="flex items-center gap-1">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 text-blue-500 flex-shrink-0"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z" />
                                            </svg>
                                            <span>{turno.fecha}</span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 text-green-600 flex-shrink-0"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} fill="none" />
                                            </svg>
                                            <span>{turno.hora}</span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 text-yellow-500 flex-shrink-0"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>{turno.estado_turno?.nombre_estado}</span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 text-indigo-500 flex-shrink-0"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h8M8 15h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                            </svg>
                                            <span>{turno.agenda_medica?.dia_semana}</span>
                                        </div>
                                    </div>

                                    <div className="mt-2 sm:mt-0 text-sm text-gray-600 truncate max-w-xs">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="inline h-4 w-4 text-purple-600 mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-6-8h6" />
                                        </svg>
                                        {turno.motivo_consulta}
                                    </div>
                                    
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            )}
            {turnoAtencion && (
    <div className="mt-6 bg-blue-50 border border-blue-300 rounded-lg p-4 shadow-inner">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-blue-700">
                Atención para turno del {turnoAtencion.fecha} - {turnoAtencion.hora}
            </h3>
            <button
                className="text-red-500 hover:underline"
                onClick={() => setTurnoAtencion(null)}
            >
                Cerrar
            </button>
        </div>
        {/* Select de estado habilitado */}
        <div className="mb-3">
            <label className="block font-medium mb-1">Estado del turno:</label>
            <select
                value={nuevoEstado}
                onChange={e => setNuevoEstado(Number(e.target.value))}
                className="border rounded px-2 py-1"
            >
                <option value={18}>Finalizado</option>
                <option value={16}>Cancelado</option>
                <option value={17}>No asistió</option>
            </select>
        </div>
        {/* Mostrar botón solo si se selecciona Cancelado o No asistió */}
        {(nuevoEstado === ESTADO_CANCELADO || nuevoEstado === ESTADO_NO_ASISTIO) ? (
            <button
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 mb-3"
                onClick={async () => {
                    try {
                        await axios.put(`/turnos/${turnoAtencion.id}/estado`, { estado_turno_id: nuevoEstado });
                        alert('Estado del turno actualizado');
                        setTurnoAtencion(null);
                        // Opcional: recargar turnos reservados
                    } catch (err) {
                        alert('Error al cambiar estado');
                    }
                }}
            >
                Cambiar estado
            </button>
        ) : null}
        {/* Formulario de atención solo si NO está cancelado o no asistió */}
        {nuevoEstado !== ESTADO_CANCELADO && nuevoEstado !== ESTADO_NO_ASISTIO ? (
            <form
                onSubmit={async e => {
                    e.preventDefault();
                    try {
                        await axios.post('/atenciones', {
                            turno_id: turnoAtencion.id,
                            ...atencionForm
                        });
                        // Cambiar estado a Finalizado al guardar atención
                        await axios.put(`/turnos/${turnoAtencion.id}/estado`, { estado_turno_id: 18 });
                        alert('Atención guardada y turno finalizado');
                        setTurnoAtencion(null);
                        setAtencionForm({
                            presion: '',
                            temperatura: '',
                            frecuencia_cardiaca: '',
                            frecuencia_respiratoria: '',
                            peso: '',
                            talla: '',
                            diagnostico: '',
                            observaciones: ''
                        });
                        // Opcional: recargar turnos reservados
                    } catch (err) {
                        alert('Error al guardar atención');
                    }
                }}
                className="space-y-2"
            >
                <div className="grid grid-cols-2 gap-2">
                    <input className="border rounded px-2 py-1" placeholder="Presión" value={atencionForm.presion} onChange={e => setAtencionForm(f => ({ ...f, presion: e.target.value }))} />
                    <input className="border rounded px-2 py-1" placeholder="Temperatura" value={atencionForm.temperatura} onChange={e => setAtencionForm(f => ({ ...f, temperatura: e.target.value }))} />
                    <input className="border rounded px-2 py-1" placeholder="Frecuencia cardíaca" value={atencionForm.frecuencia_cardiaca} onChange={e => setAtencionForm(f => ({ ...f, frecuencia_cardiaca: e.target.value }))} />
                    <input className="border rounded px-2 py-1" placeholder="Frecuencia respiratoria" value={atencionForm.frecuencia_respiratoria} onChange={e => setAtencionForm(f => ({ ...f, frecuencia_respiratoria: e.target.value }))} />
                    <input className="border rounded px-2 py-1" placeholder="Peso" value={atencionForm.peso} onChange={e => setAtencionForm(f => ({ ...f, peso: e.target.value }))} />
                    <input className="border rounded px-2 py-1" placeholder="Talla" value={atencionForm.talla} onChange={e => setAtencionForm(f => ({ ...f, talla: e.target.value }))} />
                </div>
                <textarea className="border rounded px-2 py-1 w-full" placeholder="Diagnóstico" value={atencionForm.diagnostico} onChange={e => setAtencionForm(f => ({ ...f, diagnostico: e.target.value }))} />
                <textarea className="border rounded px-2 py-1 w-full" placeholder="Observaciones" value={atencionForm.observaciones} onChange={e => setAtencionForm(f => ({ ...f, observaciones: e.target.value }))} />
                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" type="submit">
                    Guardar atención
                </button>
            </form>
        ) : (
            <div className="text-red-600 font-semibold mt-2">
                El turno está cancelado o el paciente no asistió. No se puede registrar atención.
            </div>
        )}
    </div>
)}
{hasRole("medico" ) && (
<div className="bg-white rounded-xl shadow-lg p-5 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h8M8 15h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                    </svg>
                    Historial Turnos
                </h2>
                {loadingHistorial ? (
                    <div className="flex justify-center items-center h-24">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-dashed rounded-full animate-spin"></div>
                        <span className="ml-3 text-indigo-700 font-semibold">Cargando historial...</span>
                    </div>
                ) : historialTurnos.length === 0 ? (
                    <p className="text-center text-gray-600 text-lg">No hay historial de atenciones.</p>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        <ul className="space-y-3">
                            {historialTurnos.map((turno) => (
    <li
        key={turno.id}
        className={`border rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between
            ${turno.estado_turno_id === 18 ? 'border-green-400 bg-green-50' : turno.estado_turno_id === 16 ? 'border-red-400 bg-red-50' : 'border-yellow-400 bg-yellow-50'}`}
        onClick={async () => {
            if (turno.estado_turno_id === 18) {
                try {
                    const { data: atencion } = await axios.get(`/atenciones/turno/${turno.id}`);
                    setAtencionSeleccionada({ ...atencion, turno });
                } catch {
                    setAtencionSeleccionada({ error: 'No se encontró la atención para este turno.' });
                }
            }
        }}
    >
        <div className="flex items-center gap-2 mb-1 sm:mb-0 flex-wrap">
            {/* Icono según estado */}
            {turno.estado_turno_id === 18 ? (
                // Finalizado: verde
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            ) : turno.estado_turno_id === 16 ? (
                // Cancelado: rojo
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            ) : (
                // No asistió: amarillo
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                </svg>
            )}
            <span className="font-semibold text-indigo-700">{turno.pacienteNombre}</span>
        </div>
        <div className="flex flex-wrap gap-4 text-gray-700 text-sm font-medium max-w-xs sm:max-w-none">
            <div className="flex items-center gap-1">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-blue-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z" />
                </svg>
                <span>{turno.fecha}</span>
            </div>
            <div className="flex items-center gap-1">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-green-600 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} fill="none" />
                </svg>
                <span>{turno.hora}</span>
            </div>
            <div className="flex items-center gap-1">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-yellow-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{turno.estado_turno?.nombre_estado}</span>
            </div>
            <div className="flex items-center gap-1">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-indigo-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h8M8 15h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
                <span>{turno.agenda_medica?.dia_semana}</span>
            </div>
        </div>
        <div className="mt-2 sm:mt-0 text-sm text-gray-600 truncate max-w-xs">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="inline h-4 w-4 text-purple-600 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-6-8h6" />
            </svg>
            {turno.motivo_consulta}
        </div>
    </li>
))}

                        </ul>
                    </div>
                )}
            </div>
            )}

            {/* Modal o sección para mostrar la atención realizada */}
            {atencionSeleccionada && (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Fondo difuminado y transparente */}
        <div
            className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-all"
            style={{ zIndex: 51 }}
            onClick={() => setAtencionSeleccionada(null)}
        />
        <div className="relative bg-white rounded-xl shadow-lg p-6 max-w-lg w-full z-60 animate-fade-in">
            <button
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                onClick={() => setAtencionSeleccionada(null)}
            >
                Cerrar
            </button>
            <h3 className="text-xl font-bold mb-4 text-green-700">
                Atención realizada - {atencionSeleccionada.turno?.fecha} {atencionSeleccionada.turno?.hora}
            </h3>
            {atencionSeleccionada.error ? (
                <div className="text-red-600">{atencionSeleccionada.error}</div>
            ) : (
                <div className="space-y-2">
                    <div><b>Paciente:</b> {atencionSeleccionada.turno?.pacienteNombre}</div>
                    <div><b>Presión:</b> {atencionSeleccionada.presion}</div>
                    <div><b>Temperatura:</b> {atencionSeleccionada.temperatura}</div>
                    <div><b>Frecuencia cardíaca:</b> {atencionSeleccionada.frecuencia_cardiaca}</div>
                    <div><b>Frecuencia respiratoria:</b> {atencionSeleccionada.frecuencia_respiratoria}</div>
                    <div><b>Peso:</b> {atencionSeleccionada.peso}</div>
                    <div><b>Talla:</b> {atencionSeleccionada.talla}</div>
                    <div><b>Diagnóstico:</b> {atencionSeleccionada.diagnostico}</div>
                    <div><b>Observaciones:</b> {atencionSeleccionada.observaciones}</div>
                </div>
            )}
            {/* Botón para generar PDF */}
            {!atencionSeleccionada.error && (
                <button
                    className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
                    onClick={() => generarPDFAtencion(atencionSeleccionada)}
                >
                    Descargar PDF
                </button>
            )}
        </div>
    </div>
)}


            {/* Carta Reservar turno */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
                <button
                    onClick={toggleDisponibles}
                    className="flex items-center justify-between w-full text-blue-700 font-bold text-xl px-4 py-3 border border-blue-400 rounded-lg hover:bg-blue-100 transition"
                    aria-expanded={mostrarDisponibles}
                    aria-controls="lista-turnos-disponibles"
                >
                    Reservar turno
                    <svg
                        className={`h-6 w-6 transform transition-transform ${mostrarDisponibles ? 'rotate-180' : 'rotate-0'}`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {mostrarDisponibles && (
                    <div id="lista-turnos-disponibles" className="mt-4">
                        {loadingDisponibles ? (
                            <div className="flex justify-center items-center py-6">
                                <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                                <span className="ml-3 text-blue-700 font-semibold">Cargando turnos disponibles...</span>
                            </div>
                        ) : turnosDisponibles.length === 0 ? (
                            <p className="text-center text-gray-600">No hay turnos disponibles en los próximos 3 meses.</p>
                        ) : (
                            <ul className="flex space-x-4 overflow-x-auto py-2">

                                {turnosDisponibles.map((turno) => (
                                    <li
                                        key={turno.id}
                                        className="min-w-[300px] border border-blue-300 rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer bg-blue-50 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex items-center gap-2 mb-1 sm:mb-0 flex-wrap">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 text-blue-600 flex-shrink-0"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A7.5 7.5 0 0112 15a7.5 7.5 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="font-semibold text-blue-700">Disponible</span>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-gray-700 text-sm font-medium max-w-xs sm:max-w-none">
                                            <div className="flex items-center gap-1">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 text-blue-500 flex-shrink-0"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z" />
                                                </svg>
                                                <span>{turno.fecha}</span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 text-green-600 flex-shrink-0"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} fill="none" />
                                                </svg>
                                                <span>{turno.hora}</span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 text-yellow-500 flex-shrink-0"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>{turno.estado_turno?.nombre_estado}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setTurnoSeleccionado(turno)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition whitespace-nowrap mt-2 sm:mt-0"
                                        >
                                            Seleccionar
                                        </button>

                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Formulario para agendar */}
                        {turnoSeleccionado && (
                            <div className="mt-6 bg-blue-50 border border-blue-300 rounded-lg p-4 shadow-inner">
                                <h3 className="text-lg font-semibold mb-3 text-blue-700 flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Agendar turno para {turnoSeleccionado.fecha} - {turnoSeleccionado.hora}
                                </h3>

                                {/* Buscar paciente */}
                                <div className="mb-3">
                                    <label className="block mb-1 font-medium text-gray-700">Buscar paciente:</label>
                                    {pacienteSeleccionado ? (
                                        <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded">
                                            <span className="font-semibold text-blue-700">
                                                Paciente: {pacienteSeleccionado.persona.nombres} {pacienteSeleccionado.persona.apellidos}
                                            </span>
                                            <button
                                                type="button"
                                                className="ml-2 text-red-500 hover:text-red-700 text-sm"
                                                onClick={() => {
                                                    setPacienteSeleccionado(null);
                                                    setTurnoSeleccionado((prev) => ({ ...prev, paciente_id: null, pacienteNombre: '' }));
                                                }}
                                            >
                                                Cambiar
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={busquedaPaciente}
                                                    onChange={(e) => setBusquedaPaciente(e.target.value)}
                                                    className="flex-grow px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Nombre, apellido, DNI..."
                                                />
                                                <button
                                                    onClick={buscarPacientes}
                                                    disabled={buscandoPaciente}
                                                    className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                                                    type="button"
                                                >
                                                    {buscandoPaciente ? (
                                                        <svg
                                                            className="animate-spin h-5 w-5 text-white"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth={2}
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8v8H4z"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        'Buscar'
                                                    )}
                                                </button>
                                            </div>
                                            {/* Resultados */}
                                            {resultadosPaciente.length > 0 && (
                                                <ul className="border border-gray-300 rounded mt-2 max-h-48 overflow-y-auto bg-white">
                                                    {resultadosPaciente.map((paciente) => (
                                                        <li
                                                            key={paciente.id}
                                                            onClick={() => seleccionarPaciente(paciente)}
                                                            className="cursor-pointer hover:bg-blue-100 px-3 py-2"
                                                        >
                                                            {paciente.persona.nombres} {paciente.persona.apellidos}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Motivo de consulta */}
                                <div className="mb-3">
                                    <label className="block mb-1 font-medium text-gray-700">Motivo de consulta:</label>
                                    <textarea
                                        value={motivoConsulta}
                                        onChange={(e) => setMotivoConsulta(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Describe el motivo de consulta..."
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setTurnoSeleccionado(null);
                                            setBusquedaPaciente('');
                                            setResultadosPaciente([]);
                                            setMotivoConsulta('');
                                        }}
                                        className="px-4 py-2 border border-blue-600 rounded text-blue-600 hover:bg-blue-100 transition"
                                        type="button"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={agendarTurno}
                                        disabled={agendando || !turnoSeleccionado?.paciente_id || !motivoConsulta.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                                        type="button"
                                    >
                                        {agendando ? 'Agendando...' : 'Agendar'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {hasRole("medico" ) && (
            <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
                <button
                    onClick={toggleGenerar}
                    className="flex items-center justify-between w-full text-blue-700 font-bold text-xl px-4 py-3 border border-blue-400 rounded-lg hover:bg-blue-100 transition"
                    aria-expanded={mostrarGenerar}
                    aria-controls="generar-turnos-disponibles"
                >
                    Generar turnos disponibles
                    <svg
                        className={`h-6 w-6 transform transition-transform ${mostrarGenerar ? 'rotate-180' : 'rotate-0'}`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {mostrarGenerar && (
                    <div id="generar-turnos-disponibles" className="mt-4">
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="flex-1">
                                <label className="block mb-1 font-medium text-gray-700">Fecha desde:</label>
                                <input
                                    type="date"
                                    value={fechaDesde}
                                    onChange={e => setFechaDesde(e.target.value)}
                                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min={new Date().toISOString().slice(0, 10)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block mb-1 font-medium text-gray-700">Fecha hasta:</label>
                                <input
                                    type="date"
                                    value={fechaHasta}
                                    onChange={e => setFechaHasta(e.target.value)}
                                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min={fechaDesde || new Date().toISOString().slice(0, 10)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setMostrarGenerar(false);
                                    setFechaDesde('');
                                    setFechaHasta('');
                                }}
                                className="px-4 py-2 border border-blue-600 rounded text-blue-600 hover:bg-blue-100 transition"
                                type="button"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={generarTurnos}
                                disabled={generando || !fechaDesde || !fechaHasta}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                                type="button"
                            >
                                {generando ? 'Generando...' : 'Generar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>)}
        </div>
           

    );
}

export default Turnos;
