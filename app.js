// ============================================================================
// VARIABLES GLOBALES (Equivalentes a la estructura en Java)
// ============================================================================
const nombreZona = ["Puerto Bolívar", "Centro", "Las Brisas", "El Cambio", "La Primavera"];
const zonaX = [2.0, 5.0, 8.0, 10.0, 7.5];
const zonaY = [1.5, 5.0, 6.5, 9.0, 2.0];
let riesgoZona = [0, 0, 0, 0, 0];
let estadoZona = ["Seguro", "Seguro", "Seguro", "Seguro", "Seguro"];
let conteoZonas = [0, 0, 0, 0, 0];
let promedioZona = [0.0, 0.0, 0.0, 0.0, 0.0];

const nombreTipo = ["Robo", "Agresión", "Acoso", "Accidente", "Actividad sospechosa"];
const puntosTipo = [30, 40, 25, 20, 10];
let matrizIncidentes = Array(5).fill().map(() => Array(5).fill(0));
let conteoHoras = Array(24).fill(0);
let totalReportes = 0;

const patrullaNombre = ["Unidad 1", "Unidad 2", "Unidad 3", "Unidad 4", "Unidad 5", "Unidad 6", "Unidad 7", "Unidad 8", "Unidad 9", "Unidad 10"];
const patrullaX = [5.5, 2.5, 9.0, 1.0, 3.0, 7.0, 9.0, 4.0, 6.0, 8.5];
const patrullaY = [4.5, 2.0, 8.0, 2.0, 8.0, 1.0, 9.0, 5.0, 3.0, 4.0];
let patrullaLibre = Array(10).fill(true);

// Historial detallado de incidentes para la tabla tipo registro
let listaIncidentes = [];

let lastZona = -1, lastTipo = -1, lastHora = -1, lastAfectados = -1;
let lastArma = false, lastHeridos = false;
let lastObservaciones = "";
let sistemaApagado = false; 

// ============================================================================
// FUNCIONES LÓGICAS Y MATEMÁTICAS
// ============================================================================
function imprimirEnPantalla(contenidoHTML) {
    document.getElementById("panel-resultado").innerHTML = contenidoHTML;
}

function mostrarAlertaInline(mensaje, tipo = 'error') {
    let alertaExistente = document.getElementById('alerta-inline-sistema');
    if (alertaExistente) alertaExistente.remove();

    let colorBg = tipo === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)';
    let borderColor = tipo === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)';
    let textColor = tipo === 'error' ? '#f87171' : '#34d399';
    let iconClass = tipo === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check';

    let htmlAlerta = `
        <div id="alerta-inline-sistema" style="background: ${colorBg}; border: 1px solid ${borderColor}; color: ${textColor}; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; font-size: 0.9rem;">
            <i class="fa-solid ${iconClass}" style="font-size: 1.1rem;"></i>
            <div style="flex: 1;">${mensaje}</div>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: ${textColor}; cursor: pointer; font-size: 1rem;"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `;
    
    const contenedor = document.getElementById("panel-resultado");
    if (contenedor) {
        contenedor.insertAdjacentHTML('afterbegin', htmlAlerta);
    }
}

function calcularIndice(puntoBase, hora, afectados, arma) {
    let indice = puntoBase;
    if (arma) indice += 30;
    if (hora >= 19 || hora < 6) indice += 15;
    if (afectados > 1) indice += 20;
    return indice;
}

function clasificarNivel(indice) {
    if (indice <= 30) {
        return "Seguro";
    } else if (indice <= 60) {
        return "Precaución";
    } else if (indice <= 80) {
        return "Zona roja";
    } else {
        return "Crítico";
    }
}

function calcularDistancia(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function asignarPatrulla(zX, zY) {
    let patrullaIdeal = -1;
    let distMinima = 999999;

    for (let i = 0; i < patrullaLibre.length; i++) {
        if (patrullaLibre[i]) {
            let distActual = calcularDistancia(zX, zY, patrullaX[i], patrullaY[i]);
            if (distActual < distMinima) {
                distMinima = distActual;
                patrullaIdeal = i;
            }
        }
    }
    return { patrullaIdeal, distMinima };
}

// ============================================================================
// ENRUTADOR DEL MENÚ LATERAL (ORDEN CORREGIDO: 4. Patrullas, 5. Registro, 6. Salir)
// ============================================================================
function ejecutarOpcion(opcion, btnElement) {
    if (sistemaApagado && opcion !== 6) {
        mostrarAlertaInline(">> ¡El sistema está apagado, carajo! Tienes que reiniciar para continuar.", "error");
        return;
    }

    const botones = document.querySelectorAll('.menu-btn');
    botones.forEach(btn => btn.classList.remove('active'));
    
    if (btnElement) {
        btnElement.classList.add('active');
    } else if (botones[opcion - 1]) {
        botones[opcion - 1].classList.add('active');
    }

    switch (opcion) {
        case 1:
            mostrarFormularioIncidente();
            break;
        case 2:
            verEstadoZonas();
            break;
        case 3:
            verMatriz();
            break;
        case 4:
            liberarPatrullas();
            break;
        case 5:
            verRegistroIncidentes();
            break;
        case 6:
            salirSistema();
            break;
        default:
            imprimirEnPantalla(`<p style="color: red;">Opción no válida.</p>`);
    }
}

// ============================================================================
// OPCIÓN 1: REGISTRAR INCIDENTE
// ============================================================================
function mostrarFormularioIncidente() {
    let out = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="background: #2563eb; color: white; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
                <i class="fa-solid fa-file-pen"></i>
            </div>
            <h2 style="margin: 0; font-size: 1.35rem; color: #fff; font-weight: 600;">Registrar Nuevo Incidente</h2>
        </div>
        <p style="color: #94a3b8; margin-top: 5px; margin-bottom: 25px; font-size: 0.95rem;">Ingrese los datos del reporte directamente en el sistema:</p>
        
        <form onsubmit="event.preventDefault(); procesarDatosIncidente();">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 0.9rem;">Seleccione Zona (1-5):</label>
                    <div class="input-icon-wrapper" style="position: relative;">
                        <i class="fa-solid fa-location-dot" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #60a5fa; pointer-events: none;"></i>
                        <select id="input-zona" style="width: 100%; padding: 12px 14px 12px 42px; background: #0f172a; border: 1px solid #334155; color: #f8fafc; border-radius: 8px; font-size: 0.95rem; outline: none;">
                            <option value="0">1. Puerto Bolívar</option>
                            <option value="1">2. Centro</option>
                            <option value="2">3. Las Brisas</option>
                            <option value="3">4. El Cambio</option>
                            <option value="4">5. La Primavera</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 0.9rem;">Tipo de Incidente (1-5):</label>
                    <div class="input-icon-wrapper" style="position: relative;">
                        <i class="fa-solid fa-shield-halved" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #60a5fa; pointer-events: none;"></i>
                        <select id="input-tipo" style="width: 100%; padding: 12px 14px 12px 42px; background: #0f172a; border: 1px solid #334155; color: #f8fafc; border-radius: 8px; font-size: 0.95rem; outline: none;">
                            <option value="0">1. Robo (30 pts)</option>
                            <option value="1">2. Agresión (40 pts)</option>
                            <option value="2">3. Acoso (25 pts)</option>
                            <option value="3">4. Accidente (20 pts)</option>
                            <option value="4">5. Actividad sospechosa (10 pts)</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 0.9rem;">Hora del incidente (0 a 23):</label>
                    <div class="input-icon-wrapper" style="position: relative;">
                        <i class="fa-regular fa-clock" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #60a5fa; pointer-events: none;"></i>
                        <input type="number" id="input-hora" min="0" max="23" value="12" style="width: 100%; padding: 12px 14px 12px 42px; background: #0f172a; border: 1px solid #334155; color: #f8fafc; border-radius: 8px; font-size: 0.95rem; outline: none;">
                    </div>
                </div>

                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 0.9rem;">Número de personas afectadas:</label>
                    <div class="input-icon-wrapper" style="position: relative;">
                        <i class="fa-solid fa-user-group" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #60a5fa; pointer-events: none;"></i>
                        <input type="number" id="input-afectados" min="1" value="1" style="width: 100%; padding: 12px 14px 12px 42px; background: #0f172a; border: 1px solid #334155; color: #f8fafc; border-radius: 8px; font-size: 0.95rem; outline: none;">
                    </div>
                </div>

                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 0.9rem;">¿Hubo uso de arma?</label>
                    <div class="input-icon-wrapper" style="position: relative;">
                        <i class="fa-solid fa-shield-halved" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #60a5fa; pointer-events: none;"></i>
                        <select id="input-arma" style="width: 100%; padding: 12px 14px 12px 42px; background: #0f172a; border: 1px solid #334155; color: #f8fafc; border-radius: 8px; font-size: 0.95rem; outline: none;">
                            <option value="2">No</option>
                            <option value="1">Sí</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 0.9rem;">¿Hay personas heridas?</label>
                    <div class="input-icon-wrapper" style="position: relative;">
                        <i class="fa-solid fa-user-injured" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #60a5fa; pointer-events: none;"></i>
                        <select id="input-heridos" style="width: 100%; padding: 12px 14px 12px 42px; background: #0f172a; border: 1px solid #334155; color: #f8fafc; border-radius: 8px; font-size: 0.95rem; outline: none;">
                            <option value="2">No</option>
                            <option value="1">Sí</option>
                        </select>
                    </div>
                </div>

                <div class="form-group" style="grid-column: span 2;">
                    <label style="display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 0.9rem;">Observaciones (Ej: Víctima mujer, hombre adulto, etc.):</label>
                    <div class="input-icon-wrapper" style="position: relative;">
                        <i class="fa-solid fa-note-sticky" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #60a5fa; pointer-events: none;"></i>
                        <input type="text" id="input-observaciones" placeholder="Ingrese detalles específicos del evento..." value="Sin observaciones" style="width: 100%; padding: 12px 14px 12px 42px; background: #0f172a; border: 1px solid #334155; color: #f8fafc; border-radius: 8px; font-size: 0.95rem; outline: none;">
                    </div>
                </div>
            </div>

            <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 30px;">
                <button type="button" class="btn-cancel" onclick="ejecutarOpcion(1)" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; color: #e2e8f0; border-radius: 8px; cursor: pointer; font-weight: 500;"><i class="fa-solid fa-xmark"></i> Cancelar</button>
                <button type="submit" class="btn-save" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); border: none; color: white; border-radius: 8px; cursor: pointer; font-weight: 500;"><i class="fa-solid fa-floppy-disk"></i> Guardar Incidente</button>
            </div>
        </form>
    `;
    imprimirEnPantalla(out);
}

function procesarDatosIncidente() {
    let zona = parseInt(document.getElementById('input-zona').value);
    let posTipo = parseInt(document.getElementById('input-tipo').value);
    let hora = parseInt(document.getElementById('input-hora').value);
    let afectados = parseInt(document.getElementById('input-afectados').value);
    let opArma = parseInt(document.getElementById('input-arma').value);
    let opHeridos = parseInt(document.getElementById('input-heridos').value);
    let observaciones = document.getElementById('input-observaciones').value.trim();
    if (observaciones === "") observaciones = "Sin observaciones";

    let arma = (opArma === 1);
    let heridos = (opHeridos === 1);

    if (isNaN(hora) || hora < 0 || hora > 23 || isNaN(afectados) || afectados <= 0) {
        mostrarAlertaInline(">> ERROR: Verifique que la hora (0-23) y los afectados sean válidos.", "error");
        return;
    }

    if (zona === lastZona && posTipo === lastTipo && hora === lastHora && afectados === lastAfectados && arma === lastArma && heridos === lastHeridos && observaciones === lastObservaciones) {
        mostrarAlertaInline(">> ERROR: Este reporte exacto con las mismas observaciones ya fue registrado recientemente. Modifique las observaciones o libere la patrulla primero.", "error");
        return; 
    }

    lastZona = zona; lastTipo = posTipo; lastHora = hora; lastAfectados = afectados; lastArma = arma; lastHeridos = heridos; lastObservaciones = observaciones;

    matrizIncidentes[zona][posTipo]++;
    totalReportes++;
    conteoHoras[hora]++;

    let indice = calcularIndice(puntosTipo[posTipo], hora, afectados, arma);
    let nivel = clasificarNivel(indice);

    // Asignación de patrulla
    let resPatrulla = asignarPatrulla(zonaX[zona], zonaY[zona]);
    let patrullaIndexAsignada = -1;
    let estadoInicial = "En espera";

    if (resPatrulla.patrullaIdeal !== -1) {
        patrullaIndexAsignada = resPatrulla.patrullaIdeal;
        patrullaLibre[patrullaIndexAsignada] = false;
    }

    // Guardar en el registro general de incidentes
    listaIncidentes.push({
        zona: nombreZona[zona],
        tipo: nombreTipo[posTipo],
        hora: (hora < 10 ? "0" + hora : hora) + ":00",
        afectados: afectados,
        arma: arma ? "Sí" : "No",
        heridos: heridos ? "Sí" : "No",
        observaciones: observaciones,
        puntos: indice,
        patrullaIndex: patrullaIndexAsignada,
        estado: estadoInicial
    });

    let out = `
        <h2><i class="fa-solid fa-file-shield"></i> Reporte de Incidente Registrado</h2>
        
        <div class="report-meta-grid">
            <div class="meta-box">
                <span class="label">Zona Afectada</span>
                <span class="value">${nombreZona[zona]}</span>
            </div>
            <div class="meta-box">
                <span class="label">Índice de Riesgo</span>
                <span class="value">${indice} puntos</span>
            </div>
            <div class="meta-box">
                <span class="label">Clasificación</span>
                <span class="value ${nivel === 'Crítico' || nivel === 'Zona roja' ? 'critical' : ''}">${nivel}</span>
            </div>
        </div>

        <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid #334155; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; color: #cbd5e1;">
            <i class="fa-solid fa-note-sticky" style="color: #60a5fa; margin-right: 6px;"></i> <strong>Observaciones:</strong> ${observaciones}
        </div>

        <div class="math-breakdown-box">
            <h4><i class="fa-solid fa-calculator"></i> Reporte Matemático del Incidente</h4>
            <ul>
                <li>+ ${puntosTipo[posTipo]} puntos (Por ser ${nombreTipo[posTipo]})</li>
    `;
    if (arma) out += `<li>+ 30 puntos (Por uso de arma)</li>`;
    if (hora >= 19 || hora < 6) out += `<li>+ 15 puntos (Por horario nocturno/madrugada)</li>`;
    if (afectados > 1) out += `<li>+ 20 puntos (Por múltiples afectados)</li>`;
    
    out += `
            </ul>
            <div class="total-score">TOTAL = ${indice} puntos.</div>
        </div>
    `;

    if (resPatrulla.patrullaIdeal !== -1) {
        out += `
        <div class="operation-terminal">
            <div class="alert-header">
                <i class="fa-solid fa-triangle-exclamation"></i> UNIDAD ASIGNADA: ${patrullaNombre[resPatrulla.patrullaIdeal]} en camino (${resPatrulla.distMinima.toFixed(2)} km).
            </div>
            <div class="terminal-line">&gt;&gt; <strong>ESTADO DEL REPORTE:</strong> En atención / En espera de cierre de misión</div>
        </div>
        `;
    } else {
        out += `
        <div class="operation-terminal" style="background: rgba(239, 68, 68, 0.06); border-color: rgba(239, 68, 68, 0.25);">
            <div class="alert-header" style="color: #f87171;">
                <i class="fa-solid fa-triangle-exclamation"></i> ¡ALERTA! Todas las unidades están ocupadas.
            </div>
            <div class="terminal-line">&gt;&gt; <strong>ESTADO DEL REPORTE:</strong> Pendiente (En espera de unidades libres)</div>
        </div>
        `;
    }

    riesgoZona[zona] += indice;
    conteoZonas[zona]++;
    promedioZona[zona] = (riesgoZona[zona] * 1.0) / conteoZonas[zona];
    estadoZona[zona] = clasificarNivel(promedioZona[zona]);

    imprimirEnPantalla(out);
}
// ============================================================================
// OPCIÓN 2: MAPA CARTESIANO INTERACTIVO DE ZONAS
// ============================================================================
function verEstadoZonas() {
    let out = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="margin: 0; color: #f8fafc;"><i class="fa-solid fa-map-location-dot"></i> Mapa Cartesiano Interactivo de Zonas</h2>
            <span style="font-size: 0.85rem; color: #94a3b8; background: rgba(30, 41, 59, 0.8); padding: 5px 12px; border-radius: 20px; border: 1px solid #334155;">
                <i class="fa-solid fa-circle-info"></i> Haz clic en los nodos para ver detalles
            </span>
        </div>
        <hr style="margin: 0 0 20px 0; border:0; border-top:1px solid #334155;">

        <div style="display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start;">
            <div id="cartesian-map" style="position: relative; width: 100%; height: 420px; background: #090d16; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: inset 0 0 30px rgba(0,0,0,0.8);">
                <div style="position: absolute; width: 100%; height: 100%; background-image: linear-gradient(to right, rgba(51, 65, 85, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(51, 65, 85, 0.15) 1px, transparent 1px); background-size: 10% 10%;"></div>
                <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 1px; background: rgba(51, 65, 85, 0.5);"></div>
                <div style="position: absolute; top: 0; left: 50%; width: 1px; height: 100%; background: rgba(51, 65, 85, 0.5);"></div>
                <span style="position: absolute; bottom: 5px; right: 10px; color: #64748b; font-size: 0.75rem; font-family: monospace;">Eje X (0 - 10)</span>
                <span style="position: absolute; top: 5px; left: 10px; color: #64748b; font-size: 0.75rem; font-family: monospace;">Eje Y (0 - 10)</span>
    `;

    for (let i = 0; i < nombreZona.length; i++) {
        let posX = (zonaX[i] / 10) * 85 + 5;
        let posY = 90 - (zonaY[i] / 10) * 80;

        let colorGlow = "#34d399";
        let bgNode = "rgba(52, 211, 153, 0.2)";
        if (estadoZona[i] === "Precaución") { colorGlow = "#fbbf24"; bgNode = "rgba(251, 191, 36, 0.2)"; }
        else if (estadoZona[i] === "Zona roja") { colorGlow = "#f97316"; bgNode = "rgba(249, 115, 22, 0.2)"; }
        else if (estadoZona[i] === "Crítico") { colorGlow = "#ef4444"; bgNode = "rgba(239, 68, 68, 0.2)"; }

        out += `
            <div onclick="seleccionarNodoMapa(${i})" title="${nombreZona[i]}" style="position: absolute; left: ${posX}%; top: ${posY}%; transform: translate(-50%, -50%); cursor: pointer; display: flex; flex-direction: column; align-items: center; z-index: 10; transition: transform 0.2s;" onmouseover="this.style.transform='translate(-50%, -50%) scale(1.15)'" onmouseout="this.style.transform='translate(-50%, -50%) scale(1)'">
                <div style="width: 28px; height: 28px; background: ${bgNode}; border: 2px solid ${colorGlow}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${colorGlow};">
                    <div style="width: 8px; height: 8px; background: ${colorGlow}; border-radius: 50%;"></div>
                </div>
                <span style="margin-top: 4px; font-size: 0.75rem; color: #f8fafc; background: rgba(15, 23, 42, 0.85); padding: 2px 6px; border-radius: 4px; border: 1px solid #334155; white-space: nowrap; font-weight: 500;">${nombreZona[i]}</span>
            </div>
        `;
    }

    out += `
            </div>
            <div id="panel-info-zona" style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                <h3 style="margin-top: 0; color: #60a5fa; font-size: 1.1rem; border-bottom: 1px solid #334155; padding-bottom: 10px;"><i class="fa-solid fa-circle-nodes"></i> Detalles de Zona</h3>
                <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 15px;">Selecciona un nodo en el plano cartesiano izquierdo para desplegar sus métricas.</p>
                <div id="detalle-contenido-zona" style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.6;">
                    <em>Ninguna zona seleccionada.</em>
                </div>
            </div>
        </div>
    `;
    imprimirEnPantalla(out);
}

function seleccionarNodoMapa(index) {
    let colorBadge = "#34d399";
    if (estadoZona[index] === "Precaución") colorBadge = "#fbbf24";
    else if (estadoZona[index] === "Zona roja") colorBadge = "#f97316";
    else if (estadoZona[index] === "Crítico") colorBadge = "#ef4444";

    let contenido = `
        <div style="animation: fadeIn 0.3s ease;">
            <p style="margin: 5px 0;"><strong>Zona:</strong> ${nombreZona[index]}</p>
            <p style="margin: 5px 0;"><strong>Coordenadas (X, Y):</strong> (${zonaX[index]}, ${zonaY[index]})</p>
            <p style="margin: 5px 0;"><strong>Riesgo Promedio:</strong> ${promedioZona[index].toFixed(2)} pts</p>
            <p style="margin: 5px 0;"><strong>Incidentes Totales:</strong> ${conteoZonas[index]}</p>
            <p style="margin: 10px 0 0 0;"><strong>Estado Actual:</strong> <span style="background: ${colorBadge}; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem;">${estadoZona[index]}</span></p>
        </div>
    `;
    document.getElementById("detalle-contenido-zona").innerHTML = contenido;
}

// ============================================================================
// OPCIÓN 3: VER MATRIZ Y ESTADÍSTICAS
// ============================================================================
function verMatriz() {
    let out = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="margin: 0; color: #f8fafc; font-size: 1.35rem;"><i class="fa-solid fa-table-cells"></i> Matriz de Incidentes y Estadísticas Operativas</h2>
            <span style="font-size: 0.85rem; color: #94a3b8; background: rgba(30, 41, 59, 0.8); padding: 5px 12px; border-radius: 20px; border: 1px solid #334155;">
                <i class="fa-solid fa-chart-pie"></i> Análisis Global de Zonas
            </span>
        </div>
        <hr style="margin: 0 0 20px 0; border:0; border-top:1px solid #334155;">

        <div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; overflow: hidden; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: rgba(30, 41, 59, 0.7); color: #94a3b8; border-bottom: 1px solid #334155;">
                            <th style="padding: 14px 16px; font-weight: 600;">ZONA</th>
                            <th style="padding: 14px 12px; text-align: center; font-weight: 600;"><i class="fa-solid fa-mask"></i> Robo</th>
                            <th style="padding: 14px 12px; text-align: center; font-weight: 600;"><i class="fa-solid fa-hand-fist"></i> Agresión</th>
                            <th style="padding: 14px 12px; text-align: center; font-weight: 600;"><i class="fa-solid fa-user-shield"></i> Acoso</th>
                            <th style="padding: 14px 12px; text-align: center; font-weight: 600;"><i class="fa-solid fa-car-burst"></i> Accidente</th>
                            <th style="padding: 14px 12px; text-align: center; font-weight: 600;"><i class="fa-solid fa-eye"></i> Act. Sosp.</th>
                            <th style="padding: 14px 16px; text-align: right; font-weight: 600;">PROMEDIO</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    for (let i = 0; i < nombreZona.length; i++) {
        let rowBg = i % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.2)';
        out += `<tr style="background: ${rowBg}; border-bottom: 1px solid #1e293b; transition: background 0.2s;" onmouseover="this.style.background='rgba(37, 99, 235, 0.1)'" onmouseout="this.style.background='${rowBg}'">`;
        out += `<td style="padding: 14px 16px; color: #f8fafc; font-weight: 500;"><i class="fa-solid fa-location-dot" style="color: #60a5fa; margin-right: 8px;"></i>${nombreZona[i]}</td>`;
        for (let j = 0; j < matrizIncidentes[i].length; j++) {
            let val = matrizIncidentes[i][j];
            let valColor = val > 0 ? '#f8fafc' : '#64748b';
            let valWeight = val > 0 ? '600' : 'normal';
            out += `<td style="padding: 14px 12px; text-align: center; color: ${valColor}; font-weight: ${valWeight};">${val}</td>`;
        }
        out += `<td style="padding: 14px 16px; text-align: right; font-weight: bold; color: #60a5fa; font-family: monospace;">${promedioZona[i].toFixed(2)} pts</td></tr>`;
    }

    out += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    if (totalReportes > 0) {
        let maxDelito = -1, tipoFrecuente = 0;
        let porcentajesDelitos = [];
        for (let j = 0; j < nombreTipo.length; j++) {
            let sumaDelito = 0;
            for (let i = 0; i < matrizIncidentes.length; i++) {
                sumaDelito += matrizIncidentes[i][j];
            }
            if (sumaDelito > maxDelito) {
                maxDelito = sumaDelito;
                tipoFrecuente = j;
            }
            let porc = (sumaDelito * 100.0) / totalReportes;
            porcentajesDelitos.push(porc);
        }

        let maxHora = -1, horaFrecuente = 0;
        for (let i = 0; i < conteoHoras.length; i++) {
            if (conteoHoras[i] > maxHora) {
                maxHora = conteoHoras[i];
                horaFrecuente = i;
            }
        }

        out += `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                    <h3 style="margin-top: 0; color: #60a5fa; font-size: 1.05rem; border-bottom: 1px solid #334155; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-chart-column"></i> Distribución Porcentual por Delito
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
        `;

        for (let j = 0; j < nombreTipo.length; j++) {
            let p = porcentajesDelitos[j];
            out += `
                <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px; color: #cbd5e1;">
                        <span>${nombreTipo[j]}</span>
                        <span style="font-weight: bold; color: #38bdf8;">${p.toFixed(1)}%</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${p}%; height: 100%; background: linear-gradient(90deg, #2563eb, #7c3aed); border-radius: 3px;"></div>
                    </div>
                </div>
            `;
        }

        out += `
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                        <h4 style="margin: 0 0 8px 0; color: #60a5fa; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-fire"></i> Pico de Delincuencia Detectado
                        </h4>
                        <p style="margin: 0; color: #f8fafc; font-size: 0.95rem; font-weight: 500;">
                            <strong>${nombreTipo[tipoFrecuente]}</strong> lidera la estadística con <strong>${maxDelito}</strong> casos registrados en la red.
                        </p>
                    </div>

                    <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                        <h4 style="margin: 0 0 8px 0; color: #f87171; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-clock-rotate-left"></i> Franja Horaria Más Crítica
                        </h4>
                        <p style="margin: 0; color: #f8fafc; font-size: 0.95rem; font-weight: 500;">
                            Mayor concentración de eventos a las <strong>${horaFrecuente}:00 hrs</strong> con un total de <strong>${maxHora}</strong> incidentes.
                        </p>
                    </div>
                </div>
            </div>
        `;
    } else {
        out += `
            <div style="text-align: center; padding: 40px; background: rgba(30, 41, 59, 0.4); border: 1px dashed #334155; border-radius: 12px; margin-top: 20px;">
                <i class="fa-solid fa-folder-open" style="font-size: 40px; color: #64748b; margin-bottom: 10px;"></i>
                <h3 style="color: #94a3b8; margin: 0 0 5px 0;">Sin datos estadísticos suficientes</h3>
                <p style="color: #64748b; margin: 0; font-size: 0.9rem;">Registra algunos incidentes para visualizar los gráficos porcentuales y picos operativos.</p>
            </div>
        `;
    }

    imprimirEnPantalla(out);
}

// ============================================================================
// OPCIÓN 4: LIBERAR PATRULLAS (ORIGINAL INTACTO)
// ============================================================================
function liberarPatrullas() {
    let out = `<h2><i class="fa-solid fa-truck-fast"></i> Gestión y Cierre de Misiones de Patrullaje</h2>`;
    out += `<p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 20px;">Marque como completada la misión para liberar unidades específicas enviadas a campo:</p>`;
    out += `<hr style="margin: 0 0 20px 0; border:0; border-top:1px solid #334155;">`;

    let ocupadasCount = 0;
    out += `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">`;

    for (let i = 0; i < patrullaLibre.length; i++) {
        if (!patrullaLibre[i]) {
            ocupadasCount++;
            out += `
                <div style="background: #0f172a; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                    <div>
                        <h4 style="margin: 0 0 5px 0; color: #f87171;"><i class="fa-solid fa-car-rear"></i> ${patrullaNombre[i]}</h4>
                        <p style="margin: 0; font-size: 0.85rem; color: #94a3b8;">Estado: En misión (Atendiendo incidente)</p>
                        <span style="font-size: 0.75rem; color: #64748b; font-family: monospace;">Coord: (${patrullaX[i]}, ${patrullaY[i]})</span>
                    </div>
                    <button onclick="liberarPatrullaIndividual(${i})" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);">
                        <i class="fa-solid fa-check"></i> Completar Misión
                    </button>
                </div>
            `;
        }
    }
    out += `</div>`;

    if (ocupadasCount === 0) {
        out += `
            <div style="text-align: center; padding: 40px; background: rgba(52, 211, 153, 0.05); border: 1px dashed rgba(52, 211, 153, 0.3); border-radius: 12px;">
                <i class="fa-solid fa-shield-cat" style="font-size: 40px; color: #34d399; margin-bottom: 10px;"></i>
                <h3 style="color: #34d399; margin: 0 0 5px 0;">Todas las unidades en base</h3>
                <p style="color: #94a3b8; margin: 0; font-size: 0.9rem;">No hay patrullas en misiones activas en este momento.</p>
            </div>
        `;
    }

    imprimirEnPantalla(out);
}

function liberarPatrullaIndividual(index) {
    patrullaLibre[index] = true;
    
    // Cambiar el estatus de los incidentes asociados a esta patrulla a "Atendido"
    for (let i = 0; i < listaIncidentes.length; i++) {
        if (listaIncidentes[i].patrullaIndex === index && listaIncidentes[i].estado === "En espera") {
            listaIncidentes[i].estado = "Atendido";
        }
    }

    // Reseteamos el bloqueo de duplicados para permitir reportar de nuevo si el incidente vuelve a ocurrir
    lastZona = -1;
    lastTipo = -1;
    lastHora = -1;
    lastAfectados = -1;
    lastArma = false;
    lastHeridos = false;
    lastObservaciones = "";

    liberarPatrullas();
    mostrarAlertaInline(`>> ¡Misión completada! ${patrullaNombre[index]} ha retornado a la base. Los incidentes asignados pasaron a estado "Atendido" y el bloqueo fue restablecido.`, "success");
}

// ============================================================================
// OPCIÓN 5: REGISTRO DE INCIDENTES (La tabla que pediste)
// ============================================================================
function verRegistroIncidentes() {
    let out = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="margin: 0; color: #f8fafc; font-size: 1.35rem;"><i class="fa-solid fa-clipboard-list"></i> Registro de Incidentes Atendidos y en Espera</h2>
            <span style="font-size: 0.85rem; color: #94a3b8; background: rgba(30, 41, 59, 0.8); padding: 5px 12px; border-radius: 20px; border: 1px solid #334155;">
                <i class="fa-solid fa-list-check"></i> Total: ${listaIncidentes.length} registros
            </span>
        </div>
        <hr style="margin: 0 0 20px 0; border:0; border-top:1px solid #334155;">
    `;

    if (listaIncidentes.length > 0) {
        out += `
        <div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: rgba(30, 41, 59, 0.7); color: #94a3b8; border-bottom: 1px solid #334155;">
                            <th style="padding: 14px 16px; font-weight: 600;">Zona</th>
                            <th style="padding: 14px 12px; font-weight: 600;">Tipo de Incidente</th>
                            <th style="padding: 14px 12px; font-weight: 600;">Hora</th>
                            <th style="padding: 14px 12px; font-weight: 600;">Personas</th>
                            <th style="padding: 14px 12px; font-weight: 600;">Arma</th>
                            <th style="padding: 14px 12px; font-weight: 600;">Heridos</th>
                            <th style="padding: 14px 12px; font-weight: 600;">Prioridad</th>
                            <th style="padding: 14px 16px; font-weight: 600;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (let i = 0; i < listaIncidentes.length; i++) {
            let inc = listaIncidentes[i];
            let rowBg = i % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.2)';
            
            let badgeColor = "#34d399";
            if (inc.puntos > 30 && inc.puntos <= 60) badgeColor = "#fbbf24";
            else if (inc.puntos > 60 && inc.puntos <= 80) badgeColor = "#f97316";
            else if (inc.puntos > 80) badgeColor = "#ef4444";

            let estadoBadge = inc.estado === "Atendido" 
                ? `<span style="background: rgba(52, 211, 153, 0.15); color: #34d399; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; border: 1px solid rgba(52, 211, 153, 0.3);"><i class="fa-solid fa-circle-check"></i> Atendido</span>`
                : `<span style="background: rgba(251, 191, 36, 0.15); color: #fbbf24; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; border: 1px solid rgba(251, 191, 36, 0.3);"><i class="fa-solid fa-hourglass-half"></i> En espera</span>`;

            out += `
                <tr style="background: ${rowBg}; border-bottom: 1px solid #1e293b;">
                    <td style="padding: 14px 16px; color: #f8fafc; font-weight: 500;">${inc.zona}</td>
                    <td style="padding: 14px 12px; color: #cbd5e1;">${inc.tipo}</td>
                    <td style="padding: 14px 12px; color: #cbd5e1; font-family: monospace;">${inc.hora}</td>
                    <td style="padding: 14px 12px; color: #cbd5e1;">${inc.afectados}</td>
                    <td style="padding: 14px 12px; color: #cbd5e1;">${inc.arma}</td>
                    <td style="padding: 14px 12px; color: #cbd5e1;">${inc.heridos}</td>
                    <td style="padding: 14px 12px; font-weight: bold; color: ${badgeColor};"><span style="width: 8px; height: 8px; display: inline-block; background: ${badgeColor}; border-radius: 50%; margin-right: 6px;"></span>${inc.puntos} pts</td>
                    <td style="padding: 14px 16px;">${estadoBadge}</td>
                </tr>
                <tr style="background: rgba(15, 23, 42, 0.5); border-bottom: 1px solid #334155;">
                    <td colspan="8" style="padding: 8px 16px; font-size: 0.8rem; color: #94a3b8;">
                        <i class="fa-solid fa-note-sticky" style="color: #60a5fa; margin-right: 4px;"></i> <strong>Obs:</strong> ${inc.observaciones}
                    </td>
                </tr>
            `;
        }

        out += `
                    </tbody>
                </table>
            </div>
        </div>
        `;
    } else {
        out += `
            <div style="text-align: center; padding: 40px; background: rgba(30, 41, 59, 0.4); border: 1px dashed #334155; border-radius: 12px; margin-top: 20px;">
                <i class="fa-solid fa-folder-open" style="font-size: 40px; color: #64748b; margin-bottom: 10px;"></i>
                <h3 style="color: #94a3b8; margin: 0 0 5px 0;">No hay incidentes registrados</h3>
                <p style="color: #64748b; margin: 0; font-size: 0.9rem;">Usa la opción 1 para registrar nuevos reportes de patrullaje.</p>
            </div>
        `;
    }

    imprimirEnPantalla(out);
}

// ============================================================================
// OPCIÓN 6: SALIR DEL SISTEMA
// ============================================================================
function salirSistema() {
    sistemaApagado = true; 
    
    const sidebar = document.querySelector('.sidebar') || document.querySelector('aside') || document.querySelector('.menu-lateral');
    if (sidebar) sidebar.style.display = 'none';

    let out = `
        <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #070a13; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 99999; text-align: center; padding: 2rem;">
            <i class="fa-solid fa-power-off" style="font-size: 65px; color: #ef4444; margin-bottom: 20px; filter: drop-shadow(0 0 15px rgba(239, 68, 68, 0.5));"></i>
            <h2 style="color: #f87171; font-size: 2rem; margin-bottom: 10px;">SISTEMA APAGADO</h2>
            <p style="color: #94a3b8; font-size: 1.05rem; margin-bottom: 25px;">Sesión de OrenseGuard finalizada de forma segura. Protocolos de patrullaje desarmados.</p>
            <button onclick="location.reload()" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; border: none; padding: 0.9rem 2.2rem; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 20px rgba(220, 38, 38, 0.5);">
                <i class="fa-solid fa-rotate-right"></i> Reiniciar Sistema
            </button>
        </div>
    `;
    imprimirEnPantalla(out);
}
