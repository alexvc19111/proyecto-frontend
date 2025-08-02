import React, { useState, useEffect } from "react";
import axiosClient from "../axios/axios_client";

const ReservarTurno = () => {
  const [turnos, setTurnos] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [turnoSeleccionadoId, setTurnoSeleccionadoId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [pacientes, setPacientes] = useState([]);

  useEffect(() => {
    axiosClient.get("/turnos/disponibles").then((res) => {
      // Ordenar por fecha y hora
      const ordenados = [...res.data].sort((a, b) => {
        if (a.fecha < b.fecha) return -1;
        if (a.fecha > b.fecha) return 1;
        if (a.hora < b.hora) return -1;
        if (a.hora > b.hora) return 1;
        return 0;
      });
      setTurnos(ordenados);
      setLoading(false);
    });

    axiosClient.get("/pacientes").then((res) => setPacientes(res.data));
  }, []);

  const reservarTurno = (turnoId) => {
    if (!pacienteSeleccionado || !motivoConsulta) {
      alert("Debe seleccionar paciente y escribir el motivo.");
      return;
    }

    const turno = turnos.find((t) => t.id === turnoId);
    if (!turno?.medico?.id) {
      alert("El turno no tiene médico asignado.");
      return;
    }

    axiosClient
      .put(`/turnos/${turnoId}/agendar`, {
        medico_id: turno.medico.id,
        paciente_id: pacienteSeleccionado.id,
        estado_turno_id: 14, // reservado
        motivo_consulta: motivoConsulta,
      })
      .then(() => {
        alert("Turno reservado con éxito");
        setTurnos((prev) => prev.filter((t) => t.id !== turnoId));
        setMotivoConsulta("");
        setPacienteSeleccionado(null);
        setTurnoSeleccionadoId(null);
      })
      .catch((error) => {
        console.error("Error al reservar turno:", error);
        alert("Error al reservar turno.");
      });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-blue-700">Reservar Turno</h2>
      {loading ? (<div className="flex justify-center items-center h-24">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-dashed rounded-full animate-spin"></div>
                        <span className="ml-3 text-indigo-700 font-semibold">Cargando historial...</span>
                    </div>):(

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {turnos.map((turno) => (
          <div
            key={turno.id}
            className="p-4 border rounded shadow-sm bg-white space-y-2"
          >
            {/* Información básica del turno */}
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.121 17.804A7.5 7.5 0 0112 15a7.5 7.5 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="font-semibold text-blue-700">Disponible</span>
            </div>

            <div className="flex flex-wrap gap-3 text-gray-700 text-sm font-medium">
              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z"
                  />
                </svg>
                <span>{turno.fecha}</span>
              </div>

              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth={2}
                    fill="none"
                  />
                </svg>
                <span>{turno.hora}</span>
              </div>

              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-yellow-500"
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

            <div className="mt-2 text-sm text-gray-600">
              <strong>Médico:</strong>{" "}
              {turno.medico?.persona
                ? `${turno.medico.persona.nombres} ${turno.medico.persona.apellidos}`
                : "No asignado"}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <strong>Especialidad:</strong>{" "}
              {turno.medico?.persona
                ? `${turno.medico.nombre_especialidad} `
                : "No asignado"}
            </div>

            <button
              onClick={() =>
                setTurnoSeleccionadoId(
                  turnoSeleccionadoId === turno.id ? null : turno.id
                )
              }
              className="mt-2 w-full bg-indigo-600 text-white py-1 rounded hover:bg-indigo-700"
            >
              {turnoSeleccionadoId === turno.id ? "Cancelar" : "Seleccionar turno"}
            </button>

            {turnoSeleccionadoId === turno.id && (
              <>
                <select
                  onChange={(e) =>
                    setPacienteSeleccionado(
                      pacientes.find((p) => p.id === parseInt(e.target.value))
                    )
                  }
                  className="w-full mt-2 border px-2 py-1 rounded"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecciona paciente
                  </option>
                  {pacientes.map((paciente) => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.persona?.nombres} {paciente.persona?.apellidos}
                    </option>
                  ))}
                </select>

                <textarea
                  className="w-full border px-2 py-1 rounded mt-2"
                  placeholder="Motivo de consulta"
                  value={motivoConsulta}
                  onChange={(e) => setMotivoConsulta(e.target.value)}
                ></textarea>

                <button
                  onClick={() => reservarTurno(turno.id)}
                  className="w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700 mt-2"
                >
                  Reservar
                </button>
              </>
            )}
          </div>
        ))}
      </div>
                    )}
    </div>
  );
};

export default ReservarTurno;
