// ============================================================
// FUNCIONES DE BÚSQUEDA
// ============================================================
const API_URL = 'https://carover0.xyz/api/xfinder.php';
const POL_API_URL = 'https://carover0.xyz/api/pol.php';
const CREDIT_API_URL = 'https://carover0.xyz/api/crediticia.php';
let ultimoResultado = '';
let totalRegistros = 'Cargando...';

// ============================================================
// FUNCIÓN PARA CAMBIAR FONDO
// ============================================================
function cambiarFondo(imagen) {
    document.body.style.backgroundImage = `url('assets/${imagen}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
}

// ============================================================
// OBTENER TOTAL DE REGISTROS DESDE LA API (CON CACHE)
// ============================================================
async function obtenerTotalRegistros() {
    // Si ya tenemos el valor, devolverlo
    if (totalRegistros !== 'Cargando...' && totalRegistros !== 'No disponible') {
        return totalRegistros;
    }
    
    try {
        const response = await fetch(`${API_URL}?stats=true&_=${Date.now()}`);
        if (response.ok) {
            const data = await response.json();
            if (data.total) {
                totalRegistros = Number(data.total).toLocaleString('es-AR');
                return totalRegistros;
            }
        }
        console.error('No se pudo obtener el total');
        totalRegistros = 'No disponible';
        return 'No disponible';
    } catch (e) {
        console.error('Error al obtener total:', e);
        totalRegistros = 'No disponible';
        return 'No disponible';
    }
}

// ============================================================
// FUNCION PARA BUSCAR POLÍTICAS VÍA API
// ============================================================
async function buscarPoliticasAPI(termino) {
    try {
        const response = await fetch(`${POL_API_URL}?q=${encodeURIComponent(termino)}`);
        if (!response.ok) throw new Error('Error al consultar políticas');
        return await response.json();
    } catch (e) {
        console.error('Error en búsqueda de políticas:', e);
        return { error: e.message };
    }
}

// ============================================================
// FUNCION PARA BUSCAR DATOS CREDITICIOS VÍA API
// ============================================================
async function buscarCrediticiaAPI(dni) {
    try {
        const response = await fetch(`${CREDIT_API_URL}?dni=${encodeURIComponent(dni)}`);
        if (!response.ok) throw new Error('Error al consultar datos crediticios');
        return await response.json();
    } catch (e) {
        console.error('Error en búsqueda crediticia:', e);
        return { error: e.message };
    }
}

// ============================================================
// FUNCION PARA CALCULAR NIVEL DE MOROSIDAD
// ============================================================
function calcularMorosidad(deudas) {
    if (!deudas || deudas.length === 0) {
        return {
            nivel: 0,
            porcentaje: 0,
            label: 'Sin deudas registradas',
            color: '#00c896',
            totalDeudas: 0,
            deudasNormales: 0,
            deudasRiesgo: 0,
            deudasIrrecuperables: 0,
            montoTotal: 0
        };
    }

    let totalDeudas = deudas.length;
    let deudasNormales = 0;
    let deudasRiesgo = 0;
    let deudasIrrecuperables = 0;
    let montoTotal = 0;

    deudas.forEach(deuda => {
        const situacion = parseInt(deuda.Situacion) || 1;
        const monto = parseFloat(deuda.Monto) || 0;
        
        montoTotal += monto;

        if (situacion === 1) {
            deudasNormales++;
        } else if (situacion === 4) {
            deudasRiesgo++;
        } else if (situacion === 5) {
            deudasIrrecuperables++;
        }
    });

    // Calcular porcentaje de morosidad (peso: irrecuperables = 3, riesgo = 2, normales = 0)
    let puntaje = (deudasIrrecuperables * 3) + (deudasRiesgo * 2);
    let maxPuntaje = totalDeudas * 3;
    let porcentaje = maxPuntaje > 0 ? Math.round((puntaje / maxPuntaje) * 100) : 0;

    let nivel, color, label;
    if (porcentaje === 0) {
        nivel = 0;
        color = '#00c896';
        label = '💚 Sin morosidad';
    } else if (porcentaje <= 33) {
        nivel = 1;
        color = '#ffb530';
        label = '🟡 Morosidad baja';
    } else if (porcentaje <= 66) {
        nivel = 2;
        color = '#ff6b6b';
        label = '🟠 Morosidad media';
    } else {
        nivel = 3;
        color = '#ff1744';
        label = '🔴 Morosidad alta';
    }

    return {
        nivel,
        porcentaje,
        label,
        color,
        totalDeudas,
        deudasNormales,
        deudasRiesgo,
        deudasIrrecuperables,
        montoTotal
    };
}

// ============================================================
// FUNCION PARA MOSTRAR PROGRESO DE MOROSIDAD
// ============================================================
function mostrarMorosidad(deudas) {
    const morosidad = calcularMorosidad(deudas);
    
    let html = `
        <div class="seccion" style="border-left: 3px solid ${morosidad.color};">
            <div class="seccion-titulo">
                <span class="icon">📊</span> 
                NIVEL DE MOROSIDAD
                <span style="font-size:11px;color:${morosidad.color};font-weight:normal;margin-left:10px;">${morosidad.label}</span>
            </div>
            
            <!-- Barra de progreso -->
            <div style="margin:10px 0 12px 0;">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:#8a7ea0;margin-bottom:4px;">
                    <span>Bajo riesgo</span>
                    <span>${morosidad.porcentaje}%</span>
                    <span>Alto riesgo</span>
                </div>
                <div style="width:100%;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;position:relative;">
                    <div style="width:${morosidad.porcentaje}%;height:100%;background:${morosidad.color};border-radius:4px;transition:width 1s ease;box-shadow:0 0 20px ${morosidad.color}40;"></div>
                </div>
            </div>
            
            <!-- Estadísticas -->
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px;">
                <div style="background:rgba(0,200,150,0.1);border-radius:8px;padding:8px;text-align:center;">
                    <div style="font-size:10px;color:#8a7ea0;">Normales</div>
                    <div style="font-size:16px;font-weight:bold;color:#00c896;">${morosidad.deudasNormales}</div>
                </div>
                <div style="background:rgba(255,181,48,0.1);border-radius:8px;padding:8px;text-align:center;">
                    <div style="font-size:10px;color:#8a7ea0;">En riesgo</div>
                    <div style="font-size:16px;font-weight:bold;color:#ffb530;">${morosidad.deudasRiesgo}</div>
                </div>
                <div style="background:rgba(255,23,68,0.1);border-radius:8px;padding:8px;text-align:center;">
                    <div style="font-size:10px;color:#8a7ea0;">Irrecuperables</div>
                    <div style="font-size:16px;font-weight:bold;color:#ff1744;">${morosidad.deudasIrrecuperables}</div>
                </div>
            </div>
            
            <!-- Monto total -->
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(160,68,255,0.1);display:flex;justify-content:space-between;font-size:12px;">
                <span style="color:#8a7ea0;">Total de deudas</span>
                <span style="color:#fff;font-weight:bold;">${morosidad.totalDeudas}</span>
                <span style="color:#8a7ea0;">Monto total</span>
                <span style="color:#ffb530;font-weight:bold;">$${morosidad.montoTotal.toLocaleString()}</span>
            </div>
        </div>
    `;
    
    return html;
}

// ============================================================
// FUNCION PARA MOSTRAR DEUDAS DETALLADAS
// ============================================================
function mostrarDeudas(deudas) {
    if (!deudas || deudas.length === 0) return '';
    
    let html = `
        <div class="seccion">
            <div class="seccion-titulo">
                <span class="icon">💳</span> 
                DETALLE DE DEUDAS
                <span style="font-size:11px;color:#8a7ea0;font-weight:normal;margin-left:10px;">${deudas.length} registros</span>
            </div>
    `;
    
    deudas.forEach((deuda, index) => {
        const situacion = parseInt(deuda.Situacion) || 1;
        let colorSituacion = '#00c896';
        let situacionLabel = 'Normal';
        
        if (situacion === 4) {
            colorSituacion = '#ffb530';
            situacionLabel = 'Alto riesgo';
        } else if (situacion === 5) {
            colorSituacion = '#ff1744';
            situacionLabel = 'Irrecuperable';
        }
        
        const monto = parseFloat(deuda.Monto) || 0;
        
        html += `
            <div style="
                padding:8px 0;
                border-bottom: ${index < deudas.length - 1 ? '1px solid rgba(160,68,255,0.05)' : 'none'};
            ">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
                    <span style="font-size:12px;color:#f0ecf5;">${deuda.Entidad || 'Sin entidad'}</span>
                    <span style="font-size:11px;color:${colorSituacion};font-weight:bold;">${situacionLabel}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:#8a7ea0;margin-top:2px;">
                    <span>${deuda.Periodo || '-'}</span>
                    <span>$${monto.toLocaleString()}</span>
                    <span style="font-size:10px;">${deuda.SituacionDesc || ''}</span>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    return html;
}

// ============================================================
// FUNCION PARA MOSTRAR PROGRAMAS DE DESCARGA
// ============================================================
function mostrarDescargas() {
    const resultDiv = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    
    btnCopiar.classList.add('visible');
    
    // Cambiar fondo a f10.png para descargas
    cambiarFondo('f10.png');
    
    const programas = [
        { 
            nombre: 'WinRAR', 
            archivo: 'winrar.exe', 
            icono: '📦', 
            descripcion: 'Compresor de archivos',
            prioridad: 1,
            mensaje: 'Descarga e instala WinRAR.exe para actualizar si tu versión es muy antigua'
        },
        { 
            nombre: 'AnyDesk', 
            archivo: 'anydesk.rar', 
            icono: '🖥️', 
            descripcion: 'Escritorio remoto',
            prioridad: 2,
            mensaje: 'AnyDesk por si necesitas asistencia'
        },
        { 
            nombre: 'Collector', 
            archivo: 'collector.rar', 
            icono: '📊', 
            descripcion: 'CRM',
            prioridad: 3,
            mensaje: 'Collector para gestión de clientes'
        },
        { 
            nombre: 'Zoiper', 
            archivo: 'zoiper.rar', 
            icono: '📞', 
            descripcion: 'Cliente VoIP',
            prioridad: 4,
            mensaje: 'Zoiper para llamadas VoIP'
        }
    ];
    
    let html = `
        <div class="header-card">
            <div class="dni-number">📥 DESCARGAS</div>
            <div class="badge" style="background:rgba(79,70,229,0.2);border:1px solid var(--violet);padding:4px 14px;border-radius:20px;font-size:11px;color:var(--violet-soft);text-transform:uppercase;letter-spacing:1px;">
                ${programas.length} aplicaciones
            </div>
        </div>
    `;
    
    // Grid de 2 columnas para las tarjetas
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">`;
    
    programas.forEach((prog, index) => {
        const link = `https://carover0.xyz/downloads/${prog.archivo}`;
        
        // Colores para el borde izquierdo de cada sección
        const borderColors = ['var(--violet)', 'var(--green)', 'var(--gold)', 'var(--red)'];
        
        html += `
            <div class="seccion" style="border-left: 3px solid ${borderColors[index % 4]};margin-bottom:0;padding:12px 14px;">
                <div class="seccion-titulo" style="font-size:10px;margin-bottom:6px;">
                    <span class="icon">${prog.icono}</span> 
                    ${prog.nombre}
                    <span style="font-size:10px;color:#8a7ea0;font-weight:normal;margin-left:6px;">${prog.descripcion}</span>
                </div>
                <div class="campo" style="padding:2px 0;">
                    <span class="label" style="font-size:11px;min-width:60px;">Archivo</span>
                    <span class="valor" style="font-size:11px;">${prog.archivo}</span>
                </div>
                <div class="campo" style="padding:2px 0;border-bottom:none;">
                    <span class="label" style="font-size:11px;min-width:60px;">Descargar</span>
                    <span class="valor">
                        <a href="${link}" download style="
                            display:inline-block;
                            background:var(--violet);
                            color:white;
                            padding:4px 14px;
                            border-radius:12px;
                            text-decoration:none;
                            font-size:12px;
                            font-weight:500;
                            transition: all 0.3s ease;
                            box-shadow: 0 2px 10px rgba(79,70,229,0.3);
                            font-family: 'Lucida Console', Monaco, monospace;
                        " onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 5px 20px rgba(79,70,229,0.4)'" 
                        onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 10px rgba(79,70,229,0.3)'">
                            ⬇️ Descargar
                        </a>
                    </span>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    
    // Mensajes adicionales con estilo de consola
    html += `
        <div style="
            background:rgba(0,0,0,0.4);
            border:1px solid rgba(79,70,229,0.2);
            border-radius:12px;
            padding:14px 18px;
            margin-top:5px;
            font-family: 'Lucida Console', Monaco, monospace;
            font-size:13px;
            color:#b8a8d0;
            line-height:1.8;
        ">
            <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:4px;">
                <span style="color:var(--violet-soft);">$</span>
                <span>Orden recomendado de instalación:</span>
            </div>
            <div style="padding-left:20px;">
                <div style="display:flex;align-items:center;gap:8px;padding:2px 0;">
                    <span style="color:var(--green);">▶</span>
                    <span>1. Descarga e instala <strong style="color:var(--violet-soft);">winrar.exe</strong> para actualizar si tu versión es muy antigua</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;padding:2px 0;">
                    <span style="color:var(--green);">▶</span>
                    <span>2. <strong style="color:var(--violet-soft);">AnyDesk</strong> por si necesitas asistencia remota</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;padding:2px 0;">
                    <span style="color:var(--gold);">▶</span>
                    <span>Los demás programas no importa el orden de instalación</span>
                </div>
            </div>
            <div style="
                margin-top:8px;
                padding-top:8px;
                border-top:1px solid rgba(79,70,229,0.1);
                display:flex;
                align-items:center;
                gap:8px;
                font-size:12px;
                color:#6a7a90;
            ">
            </div>
        </div>
    `;
    
    resultDiv.innerHTML = html;
    
    // Construir texto para copiar
    let texto = `📥 PROGRAMAS DE DESCARGA\n`;
    texto += `${'─'.repeat(40)}\n\n`;
    programas.forEach(prog => {
        texto += `${prog.icono} ${prog.nombre} - ${prog.descripcion}\n`;
        texto += `  Archivo: ${prog.archivo}\n`;
        texto += `  Descarga: https://carover0.xyz/downloads/${prog.archivo}\n\n`;
    });
    texto += `📂 Ubicación: /opt/soporte/apps/\n\n`;
    texto += `💡 Recomendaciones:\n`;
    texto += `  1. Descarga e instala winrar.exe para actualizar si tu versión es muy antigua\n`;
    texto += `  2. AnyDesk por si necesitas asistencia remota\n`;
    texto += `  Los demás programas no importa el orden de instalación`;
    ultimoResultado = texto;
}

// ============================================================
// FUNCION PARA MOSTRAR POLITICAS
// ============================================================
function mostrarPoliticas(resultados, termino) {
    const resultDiv = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    
    btnCopiar.classList.add('visible');
    
    // Cambiar fondo a f12.png para búsqueda de políticas (letras)
    cambiarFondo('f12.png');
    
    if (!resultados || resultados.length === 0) {
        resultDiv.innerHTML = `
            <div class="error">❌ No se encontraron políticas para "${termino}"</div>
        `;
        ultimoResultado = `❌ No se encontraron políticas para "${termino}"`;
        return;
    }
    
    let html = `
        <div class="header-card">
            <div class="dni-number">📋 POLÍTICAS: ${termino.toUpperCase()}</div>
            <div class="badge" style="background:rgba(79,70,229,0.2);border:1px solid var(--violet);padding:4px 14px;border-radius:20px;font-size:11px;color:var(--violet-soft);text-transform:uppercase;letter-spacing:1px;">
                ${resultados.length} entidad${resultados.length > 1 ? 'es' : ''}
            </div>
        </div>
    `;
    
    resultados.forEach(item => {
        html += `
            <div class="seccion">
                <div class="seccion-titulo"><span class="icon">🏢</span> ${item.nombre || 'Sin nombre'}</div>
                <div class="campo"><span class="label">Lugar de pago</span><span class="valor">${item.lugardepago || '-'}</span></div>
                <div class="campo"><span class="label">Reasignación</span><span class="valor">${item.reasignacion || '-'}</span></div>
                <div class="campo"><span class="label">Cobro de más</span><span class="valor">${item.cobrodemas || '-'}</span></div>
                <div class="campo"><span class="label">Certificado</span><span class="valor">${item.certificado || '-'}</span></div>
                ${item.obs ? `<div class="campo"><span class="label">Observaciones</span><span class="valor" style="font-size:12px;">${item.obs}</span></div>` : ''}
                ${item.pagina ? `<div class="campo"><span class="label">Página</span><span class="valor"><a href="${item.pagina}" target="_blank" style="color:var(--violet-soft);text-decoration:underline;">${item.pagina}</a></span></div>` : ''}
            </div>
        `;
    });
    
    resultDiv.innerHTML = html;
    
    // Construir texto para copiar
    let texto = `📋 POLÍTICAS: ${termino.toUpperCase()}\n`;
    texto += `${'─'.repeat(40)}\n\n`;
    resultados.forEach(item => {
        texto += `🏢 ${item.nombre || 'Sin nombre'}\n`;
        texto += `  Lugar de pago: ${item.lugardepago || '-'}\n`;
        texto += `  Reasignación: ${item.reasignacion || '-'}\n`;
        texto += `  Cobro de más: ${item.cobrodemas || '-'}\n`;
        texto += `  Certificado: ${item.certificado || '-'}\n`;
        if (item.obs) texto += `  Observaciones: ${item.obs}\n`;
        if (item.pagina) texto += `  Página: ${item.pagina}\n`;
        texto += '\n';
    });
    ultimoResultado = texto;
}

// ============================================================
// EFECTO DE ESCRITURA TIPO CONSOLA
// ============================================================
const typewriterElement = document.getElementById('typewriter');
const cursorElement = document.getElementById('cursor');
const consoleElement = document.getElementById('consoleOutput');

// ============================================================
// EFECTO DE ESCRITURA TIPO CONSOLA (SIN SPINNER)
// ============================================================
async function iniciarEscritura(lines) {
    let lineIndex = 0;
    let charIndex = 0;
    let botonAgregado = false;

    function typeWriter() {
        if (lineIndex < lines.length) {
            const line = lines[lineIndex];
            
            if (charIndex === 0 && lineIndex > 0) {
                typewriterElement.innerHTML += '<br>';
            }

            if (charIndex < line.length) {
                const char = line.charAt(charIndex);
                if (char === ' ') {
                    typewriterElement.innerHTML += '&nbsp;';
                } else {
                    typewriterElement.innerHTML += char;
                }
                charIndex++;
                setTimeout(typeWriter, 5);
            } else {
                lineIndex++;
                charIndex = 0;
                setTimeout(typeWriter, 200);
            }
        } else {
            cursorElement.style.display = 'none';
            const searchContainer = document.getElementById('searchContainer');
            searchContainer.classList.add('visible');
            document.getElementById('dniInput').focus();
            
            // Agregar el botón mini después de que termine la escritura
            if (!botonAgregado) {
                botonAgregado = true;
                agregarBotonChatMini();
            }
        }
    }

    typeWriter();
}

// ============================================================
// AGREGAR BOTÓN CHAT MINI (estilo WhatsApp/Telegram)
// ============================================================
function agregarBotonChatMini() {
    const consoleDiv = document.getElementById('consoleOutput');
    
    // Buscar la línea que contiene "🤖 [  CHAT CON IA  ]"
    const lines = consoleDiv.innerHTML.split('<br>');
    let lastLineIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('🤖 [  CHAT CON IA  ]')) {
            lastLineIndex = i;
        }
    }
    
    if (lastLineIndex !== -1) {
        // Reemplazar con el botón mini (exactamente como los de WhatsApp)
        const botonHTML = `
            🤖 <a href="#" onclick="abrirChatIA(); return false;" style="
                display: inline-block;
                margin-left: 4px;
                text-decoration: none;
                vertical-align: middle;
                transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'" title="Chat con IA">
                <img src="assets/ai.png" alt="Chat IA" style="width:20px;height:20px;display:inline-block;vertical-align:middle;border-radius:4px;">
            </a> ← Pregúntame lo que quieras
        `;
        
        lines[lastLineIndex] = botonHTML;
        consoleDiv.innerHTML = lines.join('<br>');
    }
}

// ============================================================
// FUNCIÓN PARA ABRIR CHAT IA (mini)
// ============================================================
function abrirChatIA() {
    alert('🤖 Próximamente: Chat con IA en vivo!\n\nMientras tanto, puedes usar la búsqueda inteligente.');
}

// ============================================================
// MOSTRAR RESULTADO MODERNO CON WHATSAPP Y TELEGRAM + DATOS CREDITICIOS
// ============================================================
function mostrarResultado(data, creditData) {
    const resultDiv = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    
    btnCopiar.classList.add('visible');
    
    // Cambiar fondo a f12.png para búsqueda de DNI (números)
    cambiarFondo('f12.png');
    
    function whatsappLink(numero) {
        if (!numero || numero === '-' || numero === '---') return '';
        const clean = numero.replace(/\D/g, '');
        if (clean.length < 6) return '';
        const fullNumber = clean.startsWith('54') ? clean : '54' + clean;
        return `https://wa.me/${fullNumber}`;
    }
    
    function telegramLink(numero) {
        if (!numero || numero === '-' || numero === '---') return '';
        const clean = numero.replace(/\D/g, '');
        if (clean.length < 6) return '';
        const fullNumber = clean.startsWith('54') ? clean : '54' + clean;
        return `https://t.me/+${fullNumber}`;
    }
    
    function campoContacto(label, valor) {
        if (!valor || valor === '-' || valor === '---') {
            return `<div class="campo"><span class="label">${label}</span><span class="valor">-</span></div>`;
        }
        const clean = valor.replace(/\D/g, '');
        if (clean.length < 6) return `<div class="campo"><span class="label">${label}</span><span class="valor">${valor}</span></div>`;
        
        const waLink = whatsappLink(valor);
        const tgLink = telegramLink(valor);
        
        return `<div class="campo">
            <span class="label">${label}</span>
            <span class="valor">
                ${valor}
                <a href="${waLink}" target="_blank" style="display:inline-block;margin-left:8px;text-decoration:none;vertical-align:middle;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'" title="WhatsApp">
                    <img src="assets/w.png" alt="WhatsApp" style="width:20px;height:20px;display:inline-block;vertical-align:middle;border-radius:4px;">
                </a>
                <a href="${tgLink}" target="_blank" style="display:inline-block;margin-left:6px;text-decoration:none;vertical-align:middle;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'" title="Telegram">
                    <img src="assets/t.png" alt="Telegram" style="width:20px;height:20px;display:inline-block;vertical-align:middle;border-radius:4px;">
                </a>
            </span>
        </div>`;
    }

    let html = '';

    if (data.fallecido) {
        html = `
            <div class="header-card">
                <div class="dni-number">⚠️ ${data.dni || '---'}</div>
                <div class="badge fallecido">✝ FALLECIDO</div>
            </div>
            <div class="seccion">
                <div class="seccion-titulo"><span class="icon">👤</span> DATOS PERSONALES</div>
                <div class="campo"><span class="label">Nombre</span><span class="valor">${data.nombre || '---'}</span></div>
                <div class="campo"><span class="label">DNI</span><span class="valor">${data.dni || '---'}</span></div>
                <div class="campo"><span class="label">Domicilio</span><span class="valor">${data.domicilio || 'Sin domicilio en padrón'}</span></div>
                <div class="campo"><span class="label">Localidad</span><span class="valor">${data.localidad || '-'}</span></div>
                <div class="campo"><span class="label">Provincia</span><span class="valor">${data.provincia || '-'}</span></div>
            </div>
            <div class="seccion" style="border-color: rgba(255,117,111,0.3);">
                <div class="seccion-titulo"><span class="icon">⚠️</span> ESTA PERSONA SE ENCUENTRA FALLECIDA</div>
            </div>
            <div class="origen">
                <span>Origen: ${data.origen || '---'}</span>
                <span>Fecha: ${data.timestamp || '---'}</span>
            </div>
        `;
        
        resultDiv.innerHTML = html;
        ultimoResultado = construirTextoPlano(data);
        return;
    }

    const emails = [data.email, data.email2, data.email3].filter(Boolean).join(', ') || '-';

    html = `
        <div class="header-card">
            <div class="dni-number">🔍 ${data.dni || '---'}</div>
        </div>

        <div class="seccion">
            <div class="seccion-titulo"><span class="icon">👤</span> DATOS PERSONALES</div>
            <div class="campo"><span class="label">Nombre</span><span class="valor">${data.nombre || '---'}</span></div>
            <div class="campo"><span class="label">DNI</span><span class="valor">${data.dni || '---'}</span></div>
            <div class="campo"><span class="label">Domicilio</span><span class="valor">${data.domicilio || 'Sin domicilio en padrón'}</span></div>
            <div class="campo"><span class="label">Localidad</span><span class="valor">${data.localidad || '-'}</span></div>
            <div class="campo"><span class="label">Provincia</span><span class="valor">${data.provincia || '-'}</span></div>
        </div>

        <div class="seccion">
            <div class="seccion-titulo"><span class="icon">💼</span> DATOS LABORALES</div>
            <div class="campo"><span class="label">Empleador</span><span class="valor">${data.empleador || 'Sin empleo conocido'}</span></div>
            <div class="campo"><span class="label">CUIT</span><span class="valor">${data.cuit || '-'}</span></div>
            <div class="campo"><span class="label">Empleados</span><span class="valor">${data.empleados || '-'}</span></div>
        </div>

        <div class="seccion">
            <div class="seccion-titulo"><span class="icon">📱</span> CONTACTO</div>
            ${campoContacto('Celular 1', data.celular1)}
            ${campoContacto('Celular 2', data.celular2)}
            <div class="campo"><span class="label">Fijo 1</span><span class="valor">${data.fijo1 || '-'}</span></div>
            <div class="campo"><span class="label">Fijo 2</span><span class="valor">${data.fijo2 || '-'}</span></div>
            <div class="campo"><span class="label">Email</span><span class="valor" style="font-size:12px;">${emails}</span></div>
        </div>
    `;

    // Agregar sección de morosidad si hay datos crediticios
    if (creditData && creditData.length > 0) {
        html += mostrarMorosidad(creditData);
        html += mostrarDeudas(creditData);
    }

    html += `
        <div class="origen">
            <span>📌 Fuente: ${data.origen || '---'}</span>
            <span>📅 Fecha del dato: ${data.timestamp || '---'}</span>
        </div>
    `;

    resultDiv.innerHTML = html;
    ultimoResultado = construirTextoPlano(data, creditData);
}

// ============================================================
// CONSTRUIR TEXTO PLANO PARA COPIAR (CON DATOS CREDITICIOS)
// ============================================================
function construirTextoPlano(data, creditData) {
    const emails = [data.email, data.email2, data.email3].filter(Boolean).join(', ') || '-';
    
    let texto = '';
    
    if (data.fallecido) {
        texto = `⚠️ REGISTRO FALLECIDO\n\n` +
               `Nombre: ${data.nombre || '---'}\n` +
               `DNI: ${data.dni || '---'}\n` +
               `Domicilio: ${data.domicilio || 'Sin domicilio en padrón'}\n` +
               `Localidad: ${data.localidad || '-'}\n` +
               `Provincia: ${data.provincia || '-'}\n\n` +
               `⚠️ ESTA PERSONA SE ENCUENTRA FALLECIDA\n\n` +
               `Origen: ${data.origen || '---'} · Fecha: ${data.timestamp || '---'}`;
        return texto;
    }

    texto = `🔍 INFORME DNI ${data.dni || '---'}\n` +
           `${'─'.repeat(40)}\n\n` +
           `👤 DATOS PERSONALES\n` +
           `  Nombre: ${data.nombre || '---'}\n` +
           `  DNI: ${data.dni || '---'}\n` +
           `  Domicilio: ${data.domicilio || 'Sin domicilio en padrón'}\n` +
           `  Localidad: ${data.localidad || '-'}\n` +
           `  Provincia: ${data.provincia || '-'}\n\n` +
           `💼 DATOS LABORALES\n` +
           `  Empleador: ${data.empleador || 'Sin empleo conocido'}\n` +
           `  CUIT: ${data.cuit || '-'}\n` +
           `  Empleados: ${data.empleados || '-'}\n\n` +
           `📱 CONTACTO\n` +
           `  Celular 1: ${data.celular1 || '-'}\n` +
           `  Celular 2: ${data.celular2 || '-'}\n` +
           `  Fijo 1: ${data.fijo1 || '-'}\n` +
           `  Fijo 2: ${data.fijo2 || '-'}\n` +
           `  Email: ${emails}\n\n`;

    // Agregar datos crediticios si existen
    if (creditData && creditData.length > 0) {
        const morosidad = calcularMorosidad(creditData);
        texto += `📊 NIVEL DE MOROSIDAD\n` +
                `  Estado: ${morosidad.label}\n` +
                `  Porcentaje: ${morosidad.porcentaje}%\n` +
                `  Deudas normales: ${morosidad.deudasNormales}\n` +
                `  En riesgo: ${morosidad.deudasRiesgo}\n` +
                `  Irrecuperables: ${morosidad.deudasIrrecuperables}\n` +
                `  Monto total: $${morosidad.montoTotal.toLocaleString()}\n\n` +
                `💳 DETALLE DE DEUDAS\n`;
        
        creditData.forEach((deuda, index) => {
            const situacion = parseInt(deuda.Situacion) || 1;
            let situacionLabel = 'Normal';
            if (situacion === 4) situacionLabel = 'Alto riesgo';
            else if (situacion === 5) situacionLabel = 'Irrecuperable';
            
            texto += `  ${index + 1}. ${deuda.Entidad || 'Sin entidad'}\n`;
            texto += `     Periodo: ${deuda.Periodo || '-'}\n`;
            texto += `     Monto: $${(parseFloat(deuda.Monto) || 0).toLocaleString()}\n`;
            texto += `     Estado: ${situacionLabel}\n`;
            texto += `     Descripción: ${deuda.SituacionDesc || ''}\n`;
        });
        texto += `\n`;
    }

    texto += `📌 ORIGEN\n` +
            `  Fecha: ${data.timestamp || '---'}\n` +
            `  Proveedor: ${data.origen || '---'}`;

    return texto;
}

// ============================================================
// COPIAR RESULTADO
// ============================================================
function copiarResultado() {
    const btn = document.getElementById('btnCopiar');
    
    navigator.clipboard.writeText(ultimoResultado).then(() => {
        btn.textContent = '✅ COPIADO';
        btn.classList.add('copiado');
        setTimeout(() => {
            btn.textContent = '📋 COPIAR';
            btn.classList.remove('copiado');
        }, 3000);
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = ultimoResultado;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        btn.textContent = '✅ COPIADO';
        btn.classList.add('copiado');
        setTimeout(() => {
            btn.textContent = '📋 COPIAR';
            btn.classList.remove('copiado');
        }, 3000);
    });
}

// ============================================================
// PREPARAR BÚSQUEDA Y CONSULTAR (INTELIGENTE)
// ============================================================
function prepararBusqueda() {
    consoleElement.classList.add('oculto');
    const searchContainer = document.getElementById('searchContainer');
    searchContainer.classList.add('arriba');
    document.body.classList.add('fondo-busqueda');
}

// ============================================================
// REINICIAR ESTADO COMPLETO (al recargar la página)
// ============================================================
function reiniciarEstado() {
    // Resetear elementos visuales
    const consoleElement = document.getElementById('consoleOutput');
    const typewriterElement = document.getElementById('typewriter');
    const cursorElement = document.getElementById('cursor');
    const searchContainer = document.getElementById('searchContainer');
    const resultContent = document.getElementById('resultContent');
    const resultText = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    const dniInput = document.getElementById('dniInput');
    
    // Limpiar input
    dniInput.value = '';
    
    // Ocultar resultados
    resultContent.className = 'result';
    resultText.innerHTML = '';
    btnCopiar.classList.remove('visible');
    btnCopiar.textContent = '📋 COPIAR';
    btnCopiar.classList.remove('copiado');
    
    // Resetear consola
    consoleElement.classList.remove('oculto');
    searchContainer.classList.remove('visible', 'arriba');
    document.body.classList.remove('fondo-busqueda');
    
    // Restaurar el fondo original (f13.png)
    cambiarFondo('f13.png');
    
    // Resetear cursor y typewriter
    cursorElement.style.display = 'block';
    typewriterElement.innerHTML = '';
    
    // Resetear último resultado
    ultimoResultado = '';
}

// ============================================================
// DETECTAR COMANDOS ESPECIALES
// ============================================================
function detectarComando(query) {
    const queryLower = query.toLowerCase().trim();
    
    // Palabras clave para descargas
    const descargasKeywords = ['descarga', 'descargas', 'programa', 'programas', 'software', 'apps', 'aplicaciones', 'download', 'anydesk', 'collector', 'zoiper'];
    
    // Verificar si la consulta coincide con alguna palabra clave de descargas
    for (let keyword of descargasKeywords) {
        if (queryLower.includes(keyword)) {
            return { tipo: 'descargas' };
        }
    }
    
    // Verificar si es número (DNI)
    if (/^\d+$/.test(query)) {
        if (query.length >= 6) {
            return { tipo: 'dni', valor: query };
        } else {
            return { tipo: 'error', mensaje: '⚠️ Ingrese un DNI válido (mínimo 6 dígitos).' };
        }
    }
    
    // Es texto (búsqueda de políticas)
    if (query.length >= 2) {
        return { tipo: 'politicas', valor: query };
    }
    
    return { tipo: 'error', mensaje: '⚠️ Ingrese un DNI (mínimo 6 dígitos) o nombre de entidad (mínimo 2 letras).' };
}

// ============================================================
// BUSCAR DNI O POLÍTICAS
// ============================================================
async function buscarDNI() {
    const input = document.getElementById('dniInput');
    const resultDiv = document.getElementById('resultContent');
    const resultText = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    const query = input.value.trim();

    if (!query || query.length < 2) {
        resultDiv.className = 'result visible';
        btnCopiar.classList.remove('visible');
        resultText.innerHTML = `<div class="error">⚠️ Ingrese un DNI (mínimo 6 dígitos) o nombre de entidad (mínimo 2 letras).</div>`;
        return;
    }

    prepararBusqueda();
    resultDiv.className = 'result visible';
    btnCopiar.classList.remove('visible');
    
    // Detectar el tipo de consulta
    const comando = detectarComando(query);
    
    // Manejar comandos especiales
    if (comando.tipo === 'descargas') {
        mostrarDescargas();
        return;
    }
    
    if (comando.tipo === 'error') {
        resultText.innerHTML = `<div class="error">${comando.mensaje}</div>`;
        return;
    }
    
    // Mostrar loading para búsquedas normales
    resultText.innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--violet-soft);font-size:14px;">
            <div style="margin-bottom:12px;display:flex;justify-content:center;gap:8px;font-size:28px;">
                <span style="display:inline-block;animation: pulseBox 1s ease-in-out infinite;animation-delay:0s;">🟪</span>
                <span style="display:inline-block;animation: pulseBox 1s ease-in-out infinite;animation-delay:0.15s;">🟪</span>
                <span style="display:inline-block;animation: pulseBox 1s ease-in-out infinite;animation-delay:0.3s;">⬛</span>
                <span style="display:inline-block;animation: pulseBox 1s ease-in-out infinite;animation-delay:0.45s;">⬛</span>
                <span style="display:inline-block;animation: pulseBox 1s ease-in-out infinite;animation-delay:0.6s;">🟪</span>
            </div>
            <div style="letter-spacing:2px;color:var(--violet-soft);font-size:13px;">
                Buscando<span style="display:inline-block;animation: dots 1.5s steps(4) infinite;">...</span>
            </div>
        </div>
    `;

    try {
        if (comando.tipo === 'dni') {
            // Buscar datos personales
            const response = await fetch(`${API_URL}?dni=${encodeURIComponent(comando.valor)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                resultText.innerHTML = `<div class="error">❌ ${data.error}</div>`;
                return;
            }
            
            // Buscar datos crediticios (si no está fallecido)
            let creditData = null;
            if (!data.fallecido) {
                try {
                    const creditResponse = await fetch(`${CREDIT_API_URL}?dni=${encodeURIComponent(comando.valor)}`);
                    if (creditResponse.ok) {
                        creditData = await creditResponse.json();
                        // Si la respuesta tiene error, ignorar
                        if (creditData && creditData.error) {
                            creditData = null;
                        }
                    }
                } catch (e) {
                    console.warn('Error al obtener datos crediticios:', e);
                }
            }
            
            mostrarResultado(data, creditData);
        } else if (comando.tipo === 'politicas') {
            const resultados = await buscarPoliticasAPI(comando.valor);
            
            if (resultados.error) {
                resultText.innerHTML = `<div class="error">❌ ${resultados.error}</div>`;
            } else if (resultados.length === 0) {
                resultText.innerHTML = `<div class="error">❌ No se encontraron políticas para "${comando.valor}"</div>`;
            } else {
                mostrarPoliticas(resultados, comando.valor);
            }
        }
    } catch (e) {
        console.error('Error:', e);
        resultText.innerHTML = `
            <div class="error">
                ❌ Error al consultar la base de datos
                <br><br>
                <span style="color:#8a7ea0;font-size:12px;">${e.message}</span>
            </div>
        `;
    }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    // REINICIAR ESTADO COMPLETO AL CARGAR LA PÁGINA
    reiniciarEstado();
    
    typewriterElement.textContent = 'Cargando...';
    
    // PRIMERO: Obtener el total (espera a que termine)
    const total = await obtenerTotalRegistros();
    
    // SEGUNDO: Mostrar la consola con el total ya cargado
    const lines = [
        "Bienvenido a asistAI 🤖                                           ",
        "Tu asistente inteligente para búsqueda de datos.",
        "💡 Puedo ayudarte a buscar:",
        "   - datos de personas con su historial crediticio.",
        "   - políticas de entidades con las que trabajamos.",
        "   - programas de descarga.",
        "",
        "Tengo un archivo con políticas de entidades cargado.",
        `Tambien una base de datos con +2M registros para busquedas por DNI.`,
        "",
        "Mi búsqueda es inteligente.",
        "🔍 Si ingresas un número → busco DNI en la base de datos.",
        "📋 Si ingresas letras → busco políticas de entidades.",
        "📥 Si ingresas 'descargas' te muestro los links de los programas que usamos",
        "",
        "💡 Pronto voy a tener mas herramientas, si mi desarrollador tiene ganas..."
    ];
    
    typewriterElement.innerHTML = '';
    iniciarEscritura(lines);
});

// Agregar listener para la tecla Enter
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('dniInput');
        if (document.activeElement === input) {
            buscarDNI();
        }
    }
});
