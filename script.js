// ============================================================
// SISTEMA DE AUTENTICACIÓN (LOGIN CON SERVIDOR)
// ============================================================

// ===== VERIFICACIÓN PERIÓDICA DE SESIÓN (CADA 5 MINUTOS) =====
let verificacionInterval;

function iniciarVerificacionPeriodica() {
    if (verificacionInterval) clearInterval(verificacionInterval);
    
    verificacionInterval = setInterval(async () => {
        const token = localStorage.getItem('asistAI_token');
        if (!token) {
            clearInterval(verificacionInterval);
            return;
        }
        
        try {
            const response = await fetch(`https://carover0.xyz/api/verificar_sesion.php?token=${encodeURIComponent(token)}`);
            const data = await response.json();
            
            if (!data.valid) {
                console.warn('Sesión expirada, cerrando sesión...');
                logout();
            }
        } catch (e) {
            console.warn('Error verificando sesión:', e);
        }
    }, 300000);
}

// Llamar a soporte por telegram
function soporteTelegram() {
    const telegramUser = 'xsoportedyf';
    const message = encodeURIComponent('Hola, necesito asistencia con el sistema AssistAI');
    window.open(`https://t.me/${telegramUser}?text=${message}`, '_blank');
}

// ===== FUNCIÓN DE LOGIN =====
async function loginSubmit() {
    const user = document.getElementById('loginUser').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value.trim();
    const errorEl = document.getElementById('loginError');
    const loginBtn = document.querySelector('.login-box button');
    
    if (!user || !pass) {
        errorEl.textContent = '❌ Ingresa usuario y contraseña';
        errorEl.style.display = 'block';
        return;
    }
    
    loginBtn.disabled = true;
    loginBtn.textContent = '⏳ Verificando...';
    
    try {
        const response = await fetch('https://carover0.xyz/api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pass })
        });
        
        const data = await response.json();
        
        if (data.success) {
            errorEl.style.display = 'none';
            localStorage.setItem('asistAI_token', data.token);
            localStorage.setItem('asistAI_user', data.user);
            localStorage.setItem('asistAI_logged', 'true');
            
            document.getElementById('loginOverlay').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            document.getElementById('userDisplay').textContent = '👤 ' + data.user;
            
            iniciarApp();
            iniciarVerificacionPeriodica();
        } else {
            errorEl.textContent = '❌ ' + (data.error || 'Credenciales incorrectas');
            errorEl.style.display = 'block';
            document.getElementById('loginPass').value = '';
            document.getElementById('loginUser').focus();
        }
    } catch (e) {
        errorEl.textContent = '❌ Error al conectar con el servidor';
        errorEl.style.display = 'block';
        console.error('Login error:', e);
    }
    
    loginBtn.disabled = false;
    loginBtn.textContent = '🔓 INGRESAR';
}

// ===== VERIFICAR SESIÓN EXISTENTE =====
async function verificarSesion() {
    const token = localStorage.getItem('asistAI_token');
    const user = localStorage.getItem('asistAI_user');
    const logged = localStorage.getItem('asistAI_logged');
    
    if (!token || !user || logged !== 'true') {
        return false;
    }
    
    try {
        const response = await fetch(`https://carover0.xyz/api/verificar_sesion.php?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        
        if (data.valid) {
            document.getElementById('loginOverlay').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            document.getElementById('userDisplay').textContent = '👤 ' + data.user;
            iniciarVerificacionPeriodica();
            return true;
        } else {
            localStorage.removeItem('asistAI_token');
            localStorage.removeItem('asistAI_user');
            localStorage.removeItem('asistAI_logged');
            return false;
        }
    } catch (e) {
        console.warn('Error al verificar sesión:', e);
        return false;
    }
}

// ===== CERRAR SESIÓN =====
function logout() {
    if (verificacionInterval) {
        clearInterval(verificacionInterval);
        verificacionInterval = null;
    }
    
    if (confirm('¿Estás seguro de que queres cerrar sesión?')) {
        localStorage.removeItem('asistAI_token');
        localStorage.removeItem('asistAI_user');
        localStorage.removeItem('asistAI_logged');
        location.reload();
    }
}

// ============================================================
// FUNCIONES DE BÚSQUEDA
// ============================================================
const API_URL = 'https://carover0.xyz/api/xfinder.php';
const POL_API_URL = 'https://carover0.xyz/api/pol.php';
const CREDIT_API_URL = 'https://carover0.xyz/api/crediticia.php';
const EMPRESAS_API_URL = 'https://carover0.xyz/api/empresas.php';
const MACRO_API_URL = 'https://carover0.xyz/api/macro.php';
let ultimoResultado = '';
let totalRegistros = 'Cargando...';
let buscando = false;

// ===== ELEMENTOS GLOBALES =====
const typewriterElement = document.getElementById('typewriter');
const cursorElement = document.getElementById('cursor');
const consoleElement = document.getElementById('consoleOutput');

// ============================================================
// OBTENER TOTAL DE REGISTROS DESDE LA API (CON CACHE)
// ============================================================
async function obtenerTotalRegistros() {
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
// FUNCIÓN PARA BUSCAR EMPRESAS POR CUIT
// ============================================================
async function buscarEmpresaPorCUIT(cuit) {
    try {
        const response = await fetch(`${EMPRESAS_API_URL}?cuit=${encodeURIComponent(cuit)}`);
        if (!response.ok) throw new Error('Error al consultar empresas');
        return await response.json();
    } catch (e) {
        console.error('Error en búsqueda de empresas:', e);
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
        } else {
            deudasRiesgo++;
        }
    });

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
        } else if (situacion !== 1) {
            colorSituacion = '#ffb530';
            situacionLabel = 'En riesgo';
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
    
    const programas = [
        { 
            nombre: 'WinRAR', 
            archivo: 'winrar.exe', 
            icono: '📦', 
            descripcion: 'Compresor de archivos'
        },
        { 
            nombre: 'AnyDesk', 
            archivo: 'anydesk.rar', 
            icono: '🖥️', 
            descripcion: 'Escritorio remoto'
        },
        { 
            nombre: 'Collector', 
            archivo: 'collector.rar', 
            icono: '📊', 
            descripcion: 'CRM'
        },
        { 
            nombre: 'Zoiper', 
            archivo: 'zoiper.rar', 
            icono: '📞', 
            descripcion: 'Cliente VoIP'
        }
    ];
    
    let html = `
        <div class="header-card">
            <div class="dni-number">📥 DESCARGAS</div>
            <div class="badge">
                ${programas.length} aplicaciones
            </div>
        </div>
    `;
    
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">`;
    
    programas.forEach((prog, index) => {
        const link = `https://carover0.xyz/downloads/${prog.archivo}`;
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
    
    html += `
        <div style="
            background:rgba(0,0,0,0.2);
            border:1px solid rgba(79,70,229,0.15);
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
        </div>
    `;
    
    resultDiv.innerHTML = html;
    
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
// CONSTRUIR TEXTO PLANO PARA COPIAR
// ============================================================
function construirTextoPlano(data, creditData) {
    const emails = [data.email, data.email2, data.email3].filter(Boolean).join(', ') || '-';
    
    if (data.fallecido) {
        return `⚠️ REGISTRO FALLECIDO\n\n` +
               `Nombre: ${data.nombre || '---'}\n` +
               `DNI: ${data.dni || '---'}\n` +
               `Domicilio: ${data.domicilio || 'Sin domicilio en padrón'}\n` +
               `Localidad: ${data.localidad || '-'}\n` +
               `Provincia: ${data.provincia || '-'}\n\n` +
               `⚠️ ESTA PERSONA SE ENCUENTRA FALLECIDA\n\n` +
               `Origen: ${data.origen || '---'} · Fecha: ${data.timestamp || '---'}`;
    }

    let texto = `🔍 INFORME DNI ${data.dni || '---'}\n` +
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
// PREPARAR BÚSQUEDA
// ============================================================
function prepararBusqueda() {
    const consoleElement = document.getElementById('consoleOutput');
    consoleElement.classList.add('oculto');
    const consoleSection = document.querySelector('.console-section');
    if (consoleSection) {
        consoleSection.style.display = 'none';
    }
    const searchContainer = document.getElementById('searchContainer');
    searchContainer.classList.add('arriba');
}

// ============================================================
// REINICIAR ESTADO
// ============================================================
function reiniciarEstado() {
    const consoleElement = document.getElementById('consoleOutput');
    const typewriterElement = document.getElementById('typewriter');
    const cursorElement = document.getElementById('cursor');
    const searchContainer = document.getElementById('searchContainer');
    const resultContent = document.getElementById('resultContent');
    const resultText = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    const dniInput = document.getElementById('dniInput');
    const consoleSection = document.querySelector('.console-section');
    if (consoleSection) {
        consoleSection.classList.remove('oculto');
    }
    
    dniInput.value = '';
    resultContent.className = 'results-section';
    resultText.innerHTML = '';
    btnCopiar.classList.remove('visible');
    btnCopiar.textContent = '📋 COPIAR';
    btnCopiar.classList.remove('copiado');
    ultimoResultado = '';
}

// ============================================================
// DETECTAR COMANDOS ESPECIALES
// ============================================================
function detectarComando(query) {
    const queryLower = query.toLowerCase().trim();
    
    // Comando: descargas
    const descargasKeywords = ['descarga', 'descargas', 'programa', 'programas', 'software', 'apps', 'aplicaciones', 'download', 'anydesk', 'collector', 'zoiper'];
    for (let keyword of descargasKeywords) {
        if (queryLower.includes(keyword)) {
            return { tipo: 'descargas' };
        }
    }
    
    // Comando: macro-XXXXXXXX (con guión)
    const macroMatch = query.match(/^macro-?(\d{6,9})$/i);
    if (macroMatch) {
        return { tipo: 'macro', valor: macroMatch[1] };
    }
    
    // Comando: macro XXXXXXXX (con espacio)
    const macroMatchSpace = query.match(/^macro\s+(\d{6,9})$/i);
    if (macroMatchSpace) {
        return { tipo: 'macro', valor: macroMatchSpace[1] };
    }
    
    // CUIT (10 dígitos o más)
    if (/^\d{10,}$/.test(query)) {
        return { tipo: 'empresa', valor: query };
    }
    
    // DNI (6-9 dígitos)
    if (/^\d+$/.test(query)) {
        if (query.length >= 6 && query.length <= 9) {
            return { tipo: 'dni', valor: query };
        } else {
            return { tipo: 'error', mensaje: '⚠️ Ingrese un DNI válido (6-9 dígitos) o CUIT (10 dígitos).' };
        }
    }
    
    // Políticas (mínimo 2 letras)
    if (query.length >= 2) {
        return { tipo: 'politicas', valor: query };
    }
    
    return { tipo: 'error', mensaje: '⚠️ Ingrese un DNI (6-9 dígitos), CUIT (10 dígitos) o nombre de entidad (mínimo 2 letras).' };
}

// ============================================================
// MOSTRAR XFINDER CON ESTADÍSTICAS (AGREGA CONTENIDO)
// ============================================================
function mostrarResultadoXfinder(data) {
    const resultDiv = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    
    btnCopiar.classList.add('visible');
    
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
                <a href="${waLink}" target="_blank" style="display:inline-block;margin-left:6px;text-decoration:none;vertical-align:middle;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'" title="WhatsApp">
                    <img src="assets/w.png" alt="WhatsApp" style="width:18px;height:18px;display:inline-block;vertical-align:middle;border-radius:4px;">
                </a>
                <a href="${tgLink}" target="_blank" style="display:inline-block;margin-left:4px;text-decoration:none;vertical-align:middle;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'" title="Telegram">
                    <img src="assets/t.png" alt="Telegram" style="width:18px;height:18px;display:inline-block;vertical-align:middle;border-radius:4px;">
                </a>
            </span>
        </div>`;
    }

    const emails = [data.email, data.email2, data.email3].filter(Boolean).join(', ') || '-';

    let html = '';

    html += `
        <div class="seccion">
            <div class="seccion-titulo"><span class="icon">👤</span> DATOS PERSONALES</div>
            <div class="campo"><span class="label">Nombre</span><span class="valor">${data.nombre || '---'}</span></div>
            <div class="campo"><span class="label">DNI</span><span class="valor">${data.dni || '---'}</span></div>
            <div class="campo"><span class="label">Domicilio</span><span class="valor">${data.domicilio || 'Sin domicilio en padrón'}</span></div>
            <div class="campo"><span class="label">Localidad</span><span class="valor">${data.localidad || '-'}</span></div>
            <div class="campo"><span class="label">Provincia</span><span class="valor">${data.provincia || '-'}</span></div>
        </div>
    `;

    html += `
        <div class="seccion">
            <div class="seccion-titulo"><span class="icon">💼</span> DATOS LABORALES</div>
            <div class="campo"><span class="label">Empleador</span><span class="valor">${data.empleador || 'Sin empleo conocido'}</span></div>
            <div class="campo"><span class="label">CUIT</span><span class="valor">${data.cuit || '-'}</span></div>
            <div class="campo"><span class="label">Empleados</span><span class="valor">${data.empleados || '-'}</span></div>
        </div>
    `;

    html += `
        <div class="seccion">
            <div class="seccion-titulo"><span class="icon">📱</span> CONTACTO</div>
            ${campoContacto('Celular 1', data.celular1)}
            ${campoContacto('Celular 2', data.celular2)}
            <div class="campo"><span class="label">Fijo 1</span><span class="valor">${data.fijo1 || '-'}</span></div>
            <div class="campo"><span class="label">Fijo 2</span><span class="valor">${data.fijo2 || '-'}</span></div>
            <div class="campo"><span class="label">Email</span><span class="valor" style="font-size:11px;">${emails}</span></div>
        </div>
    `;

    resultDiv.insertAdjacentHTML('beforeend', html);
}

// ============================================================
// MOSTRAR EMPRESAS CON ESTADÍSTICAS
// ============================================================
function mostrarEmpresasConEstadisticas(resultado, tiempo, total) {
    const resultDiv = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    
    btnCopiar.classList.add('visible');
    
    if (resultado.error) {
        resultDiv.innerHTML = `<div class="error">❌ ${resultado.error}</div>`;
        ultimoResultado = `❌ ${resultado.error}`;
        return;
    }
    
    if (!resultado.resultados || resultado.resultados.length === 0) {
        resultDiv.innerHTML = `<div class="error">❌ No se encontraron empresas con CUIT: ${resultado.cuit_buscado}</div>`;
        ultimoResultado = `❌ No se encontraron empresas con CUIT: ${resultado.cuit_buscado}`;
        return;
    }
    
    let html = `
        <div class="header-card">
            <div class="dni-number">🏢 EMPRESAS</div>
            <div class="badge">
                ${resultado.total} resultado${resultado.total > 1 ? 's' : ''}
            </div>
        </div>
    `;
    
    resultado.resultados.forEach((empresa, index) => {
        const borderColors = ['var(--violet)', 'var(--green)', 'var(--gold)', 'var(--red)'];
        
        const cuit = empresa.EMPLEADOR_CUIT || '-';
        const razonSocial = empresa.EMPLEADOR_RAZONSOC || 'Sin nombre';
        const empleados = empresa.CANT_EMPLEADOS || '-';
        const domicilio = empresa.EMPLEADOR_DOMICILIO || 'Sin domicilio';
        
        const celulares = [
            empresa.EMPLEADOR_CELULAR1,
            empresa.EMPLEADOR_CELULAR2,
            empresa.EMPLEADOR_CELULAR3,
            empresa.EMPLEADOR_CELULAR4
        ].filter(Boolean);
        
        const fijo = empresa.EMPLEADOR_FIJO1 || '';
        const emails = [
            empresa.EMPLEADOR_MAIL1,
            empresa.EMPLEADOR_MAIL2
        ].filter(Boolean);
        
        function linkContacto(numero) {
            if (!numero) return '';
            const clean = numero.replace(/\D/g, '');
            if (clean.length < 6) return '';
            const fullNumber = clean.startsWith('54') ? clean : '54' + clean;
            
            return `
                <a href="https://wa.me/${fullNumber}" target="_blank" style="display:inline-block;margin-left:6px;text-decoration:none;vertical-align:middle;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'" title="WhatsApp">
                    <img src="assets/w.png" alt="WhatsApp" style="width:18px;height:18px;display:inline-block;vertical-align:middle;border-radius:4px;">
                </a>
                <a href="https://t.me/+${fullNumber}" target="_blank" style="display:inline-block;margin-left:4px;text-decoration:none;vertical-align:middle;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'" title="Telegram">
                    <img src="assets/t.png" alt="Telegram" style="width:18px;height:18px;display:inline-block;vertical-align:middle;border-radius:4px;">
                </a>
            `;
        }
        
        html += `
            <div class="seccion" style="border-left: 3px solid ${borderColors[index % 4]};">
                <div class="seccion-titulo" style="font-size:13px;">
                    <span class="icon">🏢</span> 
                    ${razonSocial}
                    <span style="font-size:11px;color:#8a7ea0;font-weight:normal;margin-left:8px;">CUIT: ${cuit}</span>
                </div>
                
                <div class="campo">
                    <span class="label">Empleados</span>
                    <span class="valor">${empleados}</span>
                </div>
                
                <div class="campo">
                    <span class="label">Domicilio</span>
                    <span class="valor" style="font-size:12px;">${domicilio}</span>
                </div>
                
                ${fijo ? `<div class="campo"><span class="label">Teléfono fijo</span><span class="valor">${fijo}</span></div>` : ''}
                
                ${celulares.length > 0 ? `
                <div class="campo" style="border-bottom:none;">
                    <span class="label">Celulares</span>
                    <span class="valor" style="font-size:12px;">
                        ${celulares.map((cel, i) => `
                            ${cel} ${linkContacto(cel)}
                            ${i < celulares.length - 1 ? ' / ' : ''}
                        `).join('')}
                    </span>
                </div>` : ''}
                
                ${emails.length > 0 ? `
                <div class="campo" style="border-bottom:none;margin-top:2px;">
                    <span class="label">Emails</span>
                    <span class="valor" style="font-size:12px;word-break:break-all;">
                        ${emails.join(' / ')}
                    </span>
                </div>` : ''}
            </div>
        `;
    });
    
    html += `
        <div class="estadisticas-busqueda">
            <span>⏱️ <strong>${tiempo}s</strong></span>
            <span>🏢 <strong>${total}</strong> empresas encontradas</span>
            <span>🔍 <strong>${resultado.cuit_buscado}</strong></span>
        </div>
    `;
    
    resultDiv.innerHTML = html;
    
    let texto = `🏢 EMPRESAS ENCONTRADAS\n`;
    texto += `${'─'.repeat(40)}\n\n`;
    texto += `🔍 CUIT buscado: ${resultado.cuit_buscado}\n`;
    texto += `📊 Total: ${resultado.total}\n`;
    texto += `⏱️ Tiempo: ${tiempo}s\n\n`;
    
    resultado.resultados.forEach((empresa, index) => {
        texto += `${index + 1}. ${empresa.EMPLEADOR_RAZONSOC || 'Sin nombre'}\n`;
        texto += `   CUIT: ${empresa.EMPLEADOR_CUIT || '-'}\n`;
        texto += `   Empleados: ${empresa.CANT_EMPLEADOS || '-'}\n`;
        texto += `   Domicilio: ${empresa.EMPLEADOR_DOMICILIO || 'Sin domicilio'}\n`;
        
        const celulares = [
            empresa.EMPLEADOR_CELULAR1,
            empresa.EMPLEADOR_CELULAR2,
            empresa.EMPLEADOR_CELULAR3,
            empresa.EMPLEADOR_CELULAR4
        ].filter(Boolean);
        
        if (celulares.length > 0) {
            texto += `   Celulares: ${celulares.join(' / ')}\n`;
        }
        
        if (empresa.EMPLEADOR_FIJO1) {
            texto += `   Fijo: ${empresa.EMPLEADOR_FIJO1}\n`;
        }
        
        const emails = [
            empresa.EMPLEADOR_MAIL1,
            empresa.EMPLEADOR_MAIL2
        ].filter(Boolean);
        
        if (emails.length > 0) {
            texto += `   Emails: ${emails.join(' / ')}\n`;
        }
        
        texto += '\n';
    });
    
    ultimoResultado = texto;
}

// ============================================================
// MOSTRAR POLÍTICAS CON ESTADÍSTICAS
// ============================================================
function mostrarPoliticasConEstadisticas(resultados, termino, tiempo, total) {
    const resultDiv = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    
    btnCopiar.classList.add('visible');
    
    if (!resultados || resultados.length === 0) {
        resultDiv.innerHTML = `<div class="error">❌ No se encontraron políticas para "${termino}"</div>`;
        ultimoResultado = `❌ No se encontraron políticas para "${termino}"`;
        return;
    }
    
    let html = `
        <div class="header-card">
            <div class="dni-number">📋 POLÍTICAS: ${termino.toUpperCase()}</div>
            <div class="badge">
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
    
    html += `
        <div class="estadisticas-busqueda">
            <span>⏱️ <strong>${tiempo}s</strong></span>
            <span>📋 <strong>${total}</strong> políticas encontradas</span>
            <span>🔍 <strong>${termino}</strong></span>
        </div>
    `;
    
    resultDiv.innerHTML = html;
    
    let texto = `📋 POLÍTICAS: ${termino.toUpperCase()}\n`;
    texto += `${'─'.repeat(40)}\n\n`;
    texto += `⏱️ Tiempo: ${tiempo}s\n`;
    texto += `📊 Total: ${resultados.length}\n\n`;
    
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
// FUNCIÓN PARA MOSTRAR PLANES DE PAGO (MACRO)
// ============================================================
async function buscarMacro(dni) {
    const resultDiv = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    
    btnCopiar.classList.remove('visible');
    
    try {
        const response = await fetch(`${MACRO_API_URL}?dni=${encodeURIComponent(dni)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            resultDiv.innerHTML = `<div class="error">❌ ${data.error || 'Error al consultar los planes de pago'}</div>`;
            ultimoResultado = `❌ ${data.error || 'Error al consultar los planes de pago'}`;
            return;
        }
        
        if (data.total_registros === 0) {
            resultDiv.innerHTML = `
                <div class="header-card">
                    <div class="dni-number">🍀 PLANES DE PAGO</div>
                </div>
                <div class="seccion" style="border-color: rgba(255,181,48,0.3);">
                    <div style="text-align:center;padding:20px;color:#fbbf24;">
                        📭 No se encontraron planes de pago para el DNI <strong>${dni}</strong>
                    </div>
                </div>
            `;
            ultimoResultado = `🍀 PLANES DE PAGO\n${'─'.repeat(40)}\n\nDNI: ${dni}\nNo se encontraron registros.`;
            return;
        }
        
        mostrarPlanesPago(data);
        ultimoResultado = construirTextoMacro(data);
        btnCopiar.classList.add('visible');
        
    } catch (e) {
        console.error('Error en buscarMacro:', e);
        resultDiv.innerHTML = `<div class="error">❌ Error al consultar los planes de pago: ${e.message}</div>`;
        ultimoResultado = `❌ Error al consultar los planes de pago: ${e.message}`;
    }
}

// ============================================================
// MOSTRAR PLANES DE PAGO (VERSIÓN CONSOLIDADA - SIMPLIFICADA)
// ============================================================
function mostrarPlanesPago(data) {
    const resultDiv = document.getElementById('resultText');
    
    const formatearMonto = (valor) => {
        if (!valor && valor !== 0) return '-';
        return '$' + Number(valor).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    };
    
    const totalRegistros = data.total_registros || 0;
    const totalMinimo = data.total_minimo_cancelatorio || 0;
    const totalSaldo = data.total_saldo_exigible || 0;
    
    const planesKeys = ['3_CUOTAS', '6_CUOTAS', '9_CUOTAS', '12_CUOTAS', '18_CUOTAS', '24_CUOTAS'];
    const planesPromedio = {};
    
    planesKeys.forEach(key => {
        let valores = [];
        data.resultados.forEach(row => {
            const val = parseFloat(row[key] || 0);
            if (val > 0) valores.push(val);
        });
        
        if (valores.length > 0) {
            const sum = valores.reduce((a, b) => a + b, 0);
            planesPromedio[key] = sum / valores.length;
        } else {
            planesPromedio[key] = 0;
        }
    });
    
    let mejorPlan = null;
    const planesOrdenados = ['3_CUOTAS', '6_CUOTAS', '9_CUOTAS', '12_CUOTAS', '18_CUOTAS', '24_CUOTAS'];
    for (let key of planesOrdenados) {
        if (planesPromedio[key] > 0) {
            const cuotas = parseInt(key.replace('_CUOTAS', ''));
            mejorPlan = { cuotas, monto: planesPromedio[key] };
            break;
        }
    }
    
    let html = `
        <div class="header-card">
            <div class="dni-number">🍀 PLANES DE PAGO</div>
            <div class="badge">
                ${totalRegistros} deudas
            </div>
        </div>
        
        <div class="seccion" style="border-left: 3px solid var(--violet);">
            <div class="seccion-titulo">
                <span class="icon">👤</span> 
                ${data.cliente.nombre || 'Sin nombre'}
                <span style="font-size:12px;color:#8a7ea0;font-weight:normal;margin-left:10px;">DNI: ${data.dni}</span>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
                <div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:10px;text-align:center;border:1px solid rgba(79,70,229,0.1);">
                    <div style="font-size:10px;color:#8a7ea0;">💰 Total Mínimo Cancelatorio</div>
                    <div style="font-size:18px;font-weight:bold;color:#fbbf24;">${formatearMonto(totalMinimo)}</div>
                </div>
                <div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:10px;text-align:center;border:1px solid rgba(79,70,229,0.1);">
                    <div style="font-size:10px;color:#8a7ea0;">💰 Total Saldo Exigible</div>
                    <div style="font-size:18px;font-weight:bold;color:#a78bfa;">${formatearMonto(totalSaldo)}</div>
                </div>
            </div>
            
            ${Object.keys(data.productos).length > 0 ? `
            <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">
                ${Object.entries(data.productos).map(([tipo, cantidad]) => `
                    <span style="background:rgba(79,70,229,0.1);padding:4px 12px;border-radius:12px;font-size:11px;color:#a78bfa;">
                        ${tipo}: ${cantidad}
                    </span>
                `).join('')}
            </div>` : ''}
        </div>
        
        <div class="seccion" style="border-left: 3px solid #fbbf24;margin-top:10px;">
            <div class="seccion-titulo">
                <span class="icon">🍀</span> 
                PLANES DE PAGO - PROMEDIOS
                <span style="font-size:10px;color:#8a7ea0;font-weight:normal;margin-left:10px;">(promedio de todas las deudas)</span>
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;">
                ${planesKeys.map(key => {
                    const cuotas = parseInt(key.replace('_CUOTAS', ''));
                    const promedio = planesPromedio[key];
                    if (promedio > 0) {
                        return `
                            <div style="background:rgba(0,0,0,0.2);border-radius:6px;padding:8px;text-align:center;border:1px solid rgba(251,191,36,0.15);">
                                <div style="color:#8a7ea0;font-size:9px;">${cuotas} cuotas</div>
                                <div style="color:#fbbf24;font-weight:bold;font-size:14px;">${formatearMonto(promedio)}</div>
                            </div>
                        `;
                    }
                    return '';
                }).filter(Boolean).join('')}
            </div>
            
            ${mejorPlan ? `
            <div style="margin-top:10px;padding:8px 12px;background:rgba(251,191,36,0.08);border-radius:6px;border:1px solid rgba(251,191,36,0.2);text-align:center;">
                <span style="color:#8a7ea0;font-size:12px;">🏆 Mejor plan promedio:</span>
                <span style="color:#fbbf24;font-weight:bold;font-size:16px;">${mejorPlan.cuotas} cuotas - ${formatearMonto(mejorPlan.monto)}</span>
                <span style="color:#8a7ea0;font-size:10px;margin-left:8px;">(el más corto)</span>
            </div>
            ` : `
            <div style="margin-top:10px;padding:8px 12px;background:rgba(255,0,0,0.04);border-radius:6px;border:1px solid rgba(255,0,0,0.08);text-align:center;">
                <span style="color:#8a7ea0;font-size:12px;">⚠️ No hay planes de pago disponibles</span>
            </div>
            `}
        </div>`;
    
    html += `
        <div style="margin-top:10px;">
            <div class="seccion-titulo" style="font-size:13px;margin-bottom:8px;padding:0 4px;color:#27A17C;">
                <span class="icon">📋</span> 
                DETALLE POR DEUDA
                <span style="font-size:11px;color:#8a7ea0;font-weight:normal;margin-left:10px;">${totalRegistros} registros</span>
            </div>
    `;
    
    data.resultados.forEach((row, index) => {
        const minimo = parseFloat(row.MINIMO_CANCELATORIO || 0);
        const saldo = parseFloat(row.SALDO_EXIGIBLE || 0);
        const fecha = row.FECHA_MORA || '-';
        const tipo = row.TIPO_PROD || 'Otros';
        const codProd = row.COD_PROD || '-';
        
        const planesDeuda = planesKeys.map(key => ({
            cuotas: parseInt(key.replace('_CUOTAS', '')),
            valor: parseFloat(row[key] || 0)
        })).filter(p => p.valor > 0);
        
        html += `
            <div class="seccion" style="border-left: 3px solid #27A17C;margin-top:6px;padding:10px 12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
                    <div style="font-size:12px;font-weight:bold;color:#f0ecf5;">
                        <span class="icon">📄</span> Deuda #${index + 1}
                        <span style="font-size:10px;color:#8a7ea0;font-weight:normal;margin-left:8px;">${tipo}</span>
                    </div>
                    <div style="font-size:10px;color:#8a7ea0;">Código: ${codProd}</div>
                </div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:11px;margin-top:4px;">
                    <div><span style="color:#8a7ea0;">Fecha Mora:</span> <span style="color:#f0ecf5;">${fecha}</span></div>
                    <div><span style="color:#8a7ea0;">Mínimo:</span> <span style="color:#fbbf24;">${formatearMonto(minimo)}</span></div>
                    <div><span style="color:#8a7ea0;">Saldo:</span> <span style="color:#a78bfa;">${formatearMonto(saldo)}</span></div>
                </div>
                
                ${planesDeuda.length > 0 ? `
                <div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(39,161,124,0.15);">
                    <div style="display:grid;grid-template-columns:repeat(${Math.min(planesDeuda.length, 6)},1fr);gap:4px;font-size:10px;">
                        ${planesDeuda.map(p => `
                            <div style="background:rgba(39,161,124,0.1);border-radius:4px;padding:3px 4px;text-align:center;border:1px solid rgba(39,161,124,0.1);">
                                <div style="color:#8a7ea0;">${p.cuotas}c</div>
                                <div style="color:#27A17C;font-weight:bold;font-size:11px;">${formatearMonto(p.valor)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : `
                <div style="margin-top:4px;font-size:10px;color:#8a7ea0;text-align:center;padding:4px;border-top:1px solid rgba(39,161,124,0.1);">
                    Sin planes de pago disponibles
                </div>
                `}
            </div>
        `;
    });
    
    html += `</div>`;
    
    html += `
        <div class="estadisticas-busqueda">
            <span>📊 <strong>${totalRegistros}</strong> deudas</span>
            <span>💳 <strong>${Object.keys(data.productos).length}</strong> tipos</span>
            <span>🔍 <strong>${data.dni}</strong></span>
        </div>
    `;
    
    resultDiv.innerHTML = html;
}

// ============================================================
// CONSTRUIR TEXTO PLANO PARA MACRO
// ============================================================
function construirTextoMacro(data) {
    const formatear = (v) => {
        if (!v && v !== 0) return '-';
        return '$' + Number(v).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    };
    
    const planesKeys = ['3_CUOTAS', '6_CUOTAS', '9_CUOTAS', '12_CUOTAS', '18_CUOTAS', '24_CUOTAS'];
    const planesPromedio = {};
    
    planesKeys.forEach(key => {
        let valores = [];
        data.resultados.forEach(row => {
            const val = parseFloat(row[key] || 0);
            if (val > 0) valores.push(val);
        });
        
        if (valores.length > 0) {
            const sum = valores.reduce((a, b) => a + b, 0);
            planesPromedio[key] = sum / valores.length;
        } else {
            planesPromedio[key] = 0;
        }
    });
    
    let mejorPlan = null;
    const planesOrdenados = ['3_CUOTAS', '6_CUOTAS', '9_CUOTAS', '12_CUOTAS', '18_CUOTAS', '24_CUOTAS'];
    for (let key of planesOrdenados) {
        if (planesPromedio[key] > 0) {
            const cuotas = parseInt(key.replace('_CUOTAS', ''));
            mejorPlan = { cuotas, monto: planesPromedio[key] };
            break;
        }
    }
    
    let texto = `🍀 PLANES DE PAGO\n`;
    texto += `${'─'.repeat(50)}\n\n`;
    texto += `👤 ${data.cliente.nombre || 'Sin nombre'}\n`;
    texto += `📌 DNI: ${data.dni}\n`;
    texto += `📊 Total de deudas: ${data.total_registros}\n`;
    texto += `💰 Mínimo Cancelatorio total: ${formatear(data.total_minimo_cancelatorio)}\n`;
    texto += `💰 Saldo Exigible total: ${formatear(data.total_saldo_exigible)}\n\n`;
    
    texto += `📦 PRODUCTOS:\n`;
    Object.entries(data.productos).forEach(([tipo, cantidad]) => {
        texto += `  ${tipo}: ${cantidad}\n`;
    });
    texto += `\n`;
    
    texto += `🍀 PLANES DE PAGO - PROMEDIOS\n`;
    planesKeys.forEach(key => {
        const cuotas = parseInt(key.replace('_CUOTAS', ''));
        if (planesPromedio[key] > 0) {
            texto += `  ${cuotas} cuotas: ${formatear(planesPromedio[key])}\n`;
        }
    });
    
    if (mejorPlan) {
        texto += `\n🏆 Mejor plan: ${mejorPlan.cuotas} cuotas - ${formatear(mejorPlan.monto)} (el más corto)\n`;
    }
    texto += `\n`;
    
    texto += `${'─'.repeat(50)}\n`;
    texto += `📋 DETALLE POR DEUDA\n\n`;
    
    data.resultados.forEach((row, index) => {
        texto += `📄 DEUDA #${index + 1}\n`;
        texto += `  Tipo: ${row.TIPO_PROD || '-'}\n`;
        texto += `  Código: ${row.COD_PROD || '-'}\n`;
        texto += `  Fecha Mora: ${row.FECHA_MORA || '-'}\n`;
        texto += `  Mínimo: ${formatear(row.MINIMO_CANCELATORIO)}\n`;
        texto += `  Saldo: ${formatear(row.SALDO_EXIGIBLE)}\n`;
        
        let tienePlan = false;
        planesKeys.forEach(key => {
            const cuotas = parseInt(key.replace('_CUOTAS', ''));
            const val = parseFloat(row[key] || 0);
            if (val > 0) {
                if (!tienePlan) {
                    texto += `  Planes:\n`;
                    tienePlan = true;
                }
                texto += `    ${cuotas} cuotas: ${formatear(val)}\n`;
            }
        });
        if (!tienePlan) {
            texto += `  Planes: Sin planes disponibles\n`;
        }
        texto += '\n';
    });
    
    return texto;
}

// ============================================================
// LOADING CON FRUTAS (BARRA DE PROGRESO CON EMOJIS DE FRUTAS)
// ============================================================
function mostrarLoadingFrutas(mensajePersonalizado = null, dni = null) {
    const frutas = ['🍋', '🍊', '🍎', '🍇', '🍉', '🍑', '🍒', '🍓'];
    const etiquetas = [
        '🍋 Limpiando...',
        '🍊 Organizando...',
        '🍎 Procesando...',
        '🍇 Analizando...',
        '🍉 Casi listo...',
        '🍑 Ultimando...',
        '🍒 Preparando...',
        '🍓 ¡Casi!'
    ];
    
    let frutaActual = 0;
    let progreso = 0;
    
    let loadingDiv = document.getElementById('frutaLoading');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'frutaLoading';
        loadingDiv.style.cssText = `
            text-align: center;
            padding: 30px 20px;
            color: var(--violet-soft);
            font-size: 13px;
            border: 1px solid rgba(160,68,255,0.06);
            border-radius: 16px;
            background: var(--bg-card);
            margin: 10px 0;
            transition: all 0.3s ease;
        `;
        document.getElementById('resultText').innerHTML = '';
        document.getElementById('resultText').appendChild(loadingDiv);
    }
    
    const dniText = dni ? ` para DNI ${dni}` : '';
    const titulo = mensajePersonalizado || `📋 Buscando${dniText}`;
    
    loadingDiv.innerHTML = `
        <div style="margin-bottom:6px;font-size:13px;color:#8a7ea0;letter-spacing:1px;font-weight:300;">
            ${titulo}
        </div>
        <div style="margin:12px 0 8px 0;display:flex;justify-content:center;align-items:center;font-size:48px;min-height:60px;">
            <span id="frutaEmoji" style="display:inline-block;transition:all 0.6s ease;">🍋</span>
        </div>
        <div style="margin-top:12px;width:100%;height:4px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden;position:relative;">
            <div id="barraFruta" style="width:0%;height:100%;background:linear-gradient(90deg, #fbbf24, #f97316, #ef4444, #8b5cf6, #22c55e, #f472b6, #ec4899, #ef4444);border-radius:3px;transition:width 0.8s ease;box-shadow:0 0 30px rgba(251,191,36,0.2);"></div>
        </div>
        <div style="margin-top:10px;font-size:10px;color:#6b5b8a;letter-spacing:1px;display:flex;justify-content:space-between;align-items:center;padding:0 4px;">
            <span id="estadoFruta" style="color:#8a7ea0;">🍋 Limpiando...</span>
            <span id="porcentajeFruta">0%</span>
        </div>
    `;
    
    const avanzarFruta = () => {
        if (frutaActual < frutas.length - 1) {
            frutaActual++;
            const emojiSpan = document.getElementById('frutaEmoji');
            if (emojiSpan) {
                emojiSpan.style.transition = 'all 0.1s ease';
                emojiSpan.style.transform = 'scale(1.4)';
                emojiSpan.textContent = frutas[frutaActual];
                setTimeout(() => {
                    emojiSpan.style.transform = 'scale(1)';
                }, 400);
            }
            const estadoSpan = document.getElementById('estadoFruta');
            if (estadoSpan) {
                estadoSpan.textContent = etiquetas[frutaActual] || '🍉 Cargando...';
            }
        }
    };
    
    const intervalFrutas = setInterval(() => {
        avanzarFruta();
    }, 1800);
    
    const intervalBarra = setInterval(() => {
        const incremento = Math.random() * 3 + 1.5;
        progreso = Math.min(progreso + incremento, 98);
        const barra = document.getElementById('barraFruta');
        const porcentaje = document.getElementById('porcentajeFruta');
        if (barra) barra.style.width = progreso + '%';
        if (porcentaje) porcentaje.textContent = Math.round(progreso) + '%';
    }, 400);
    
    loadingDiv._intervalFrutas = intervalFrutas;
    loadingDiv._intervalBarra = intervalBarra;
    loadingDiv._frutaActual = 0;
    
    return {
        actualizarMensaje: (nuevoMensaje) => {
            const tituloDiv = loadingDiv.querySelector('div:first-child');
            if (tituloDiv) {
                tituloDiv.textContent = nuevoMensaje;
                tituloDiv.style.transition = 'opacity 0.3s ease';
                tituloDiv.style.opacity = '0.5';
                setTimeout(() => {
                    tituloDiv.style.opacity = '1';
                }, 200);
            }
        },
        completar: () => {
            const barra = document.getElementById('barraFruta');
            const porcentaje = document.getElementById('porcentajeFruta');
            const emojiSpan = document.getElementById('frutaEmoji');
            const estadoSpan = document.getElementById('estadoFruta');
            
            if (barra) {
                barra.style.width = '100%';
                barra.style.background = 'linear-gradient(90deg, #22c55e, #22c55e)';
            }
            if (porcentaje) porcentaje.textContent = '100% ✅';
            if (emojiSpan) {
                emojiSpan.textContent = '✅';
                emojiSpan.style.transition = 'all 0.6s ease';
                emojiSpan.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    emojiSpan.style.transform = 'scale(1)';
                }, 400);
            }
            if (estadoSpan) {
                estadoSpan.textContent = '✅ ¡Completado!';
                estadoSpan.style.color = '#22c55e';
            }
            
            clearInterval(loadingDiv._intervalFrutas);
            clearInterval(loadingDiv._intervalBarra);
            
            setTimeout(() => {
                const loading = document.getElementById('frutaLoading');
                if (loading) {
                    loading.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    loading.style.opacity = '0';
                    loading.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        if (loading.parentNode) {
                            loading.remove();
                        }
                    }, 600);
                }
            }, 800);
        }
    };
}

// ============================================================
// BUSCAR DNI, CUIT O POLÍTICAS CON TIEMPO Y CONTADOR
// ============================================================
async function buscarDNI() {
    if (buscando) {
        console.log('Búsqueda en progreso, ignorando...');
        return;
    }
    
    const input = document.getElementById('dniInput');
    const resultContent = document.getElementById('resultContent');
    const resultText = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    const query = input.value.trim();

    if (!query || query.length < 2) {
        resultContent.className = 'results-section visible';
        btnCopiar.classList.remove('visible');
        resultText.innerHTML = `<div class="error">⚠️ Ingrese un DNI (6-9 dígitos), CUIT (10 dígitos) o nombre de entidad (mínimo 2 letras).</div>`;
        return;
    }

    buscando = true;
    const tiempoInicio = performance.now();

    prepararBusqueda();
    resultContent.className = 'results-section visible';
    btnCopiar.classList.remove('visible');
    
    const comando = detectarComando(query);
    
    if (comando.tipo === 'descargas') {
        mostrarDescargas();
        buscando = false;
        return;
    }
    
    if (comando.tipo === 'macro') {
        const loading = mostrarLoadingFrutas('🍀 Buscando planes de pago', comando.valor);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        loading.actualizarMensaje('📋 Consultando servidor de planes');
        await new Promise(resolve => setTimeout(resolve, 1200));
        loading.actualizarMensaje('📊 Procesando deudas');
        await new Promise(resolve => setTimeout(resolve, 1000));
        loading.actualizarMensaje('🧮 Calculando promedios');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        await buscarMacro(comando.valor);
        loading.completar();
        buscando = false;
        return;
    }
    
    if (comando.tipo === 'error') {
        resultText.innerHTML = `<div class="error">${comando.mensaje}</div>`;
        buscando = false;
        return;
    }
    
    const loading = mostrarLoadingFrutas('🔍 Buscando en base de datos');

    let totalRegistrosEncontrados = 0;
    let registrosCrediticios = 0;

    try {
        if (comando.tipo === 'empresa') {
            loading.actualizarMensaje('🏢 Buscando empresas por CUIT');
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            const resultado = await buscarEmpresaPorCUIT(comando.valor);
            const tiempoFin = performance.now();
            const tiempoTotal = ((tiempoFin - tiempoInicio) / 1000).toFixed(2);
            
            if (resultado.resultados) {
                totalRegistrosEncontrados = resultado.resultados.length;
            }
            
            loading.completar();
            await new Promise(resolve => setTimeout(resolve, 400));
            mostrarEmpresasConEstadisticas(resultado, tiempoTotal, totalRegistrosEncontrados);
            
        } else if (comando.tipo === 'dni') {
            loading.actualizarMensaje('📋 Buscando datos personales');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const response = await fetch(`${API_URL}?dni=${encodeURIComponent(comando.valor)}`);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            
            if (data.error) {
                loading.completar();
                await new Promise(resolve => setTimeout(resolve, 400));
                resultText.innerHTML = `<div class="error">❌ ${data.error}</div>`;
                buscando = false;
                return;
            }
            
            totalRegistrosEncontrados = 1;
            
            resultText.innerHTML = '';
            
            const headerHTML = `
                <div class="header-card">
                    <div class="dni-number">🔍 ${data.dni || '---'}</div>
                    <div class="badge">${data.origen || 'xFinder'}</div>
                </div>
            `;
            resultText.innerHTML = headerHTML;
            
            mostrarResultadoXfinder(data);
            
            if (!data.fallecido) {
                const oldContainer = document.getElementById('creditContainer');
                if (oldContainer) {
                    oldContainer.remove();
                }
                
                const creditContainer = document.createElement('div');
                creditContainer.id = 'creditContainer';
                creditContainer.style.marginTop = '10px';
                
                // CREDITICIO CON FRUTAS QUE AVANZAN
                const frutasCredit = ['🍋', '🍊', '🍎', '🍇', '🍉', '🍑', '🍒', '🍓'];
                const etiquetasCredit = [
                    '🍋 Limpiando historial...',
                    '🍊 Organizando deudas...',
                    '🍎 Analizando registros...',
                    '🍇 Verificando situaciones...',
                    '🍉 Procesando montos...',
                    '🍑 Ultimando detalles...',
                    '🍒 Preparando informe...',
                    '🍓 ¡Casi listo!'
                ];
                let frutaCreditActual = 0;
                
                creditContainer.innerHTML = `
                    <div style="text-align:center;padding:20px;color:var(--violet-soft);font-size:13px;border:1px solid rgba(160,68,255,0.06);border-radius:16px;background:var(--bg-card);">
                        <div style="margin-bottom:6px;font-size:13px;color:#8a7ea0;letter-spacing:1px;font-weight:300;">
                            💳 Buscando historial crediticio
                        </div>
                        <div style="margin:12px 0 8px 0;display:flex;justify-content:center;align-items:center;font-size:48px;min-height:60px;">
                            <span id="frutaCreditEmoji" style="display:inline-block;transition:all 0.6s ease;">🍋</span>
                        </div>
                        <div style="margin-top:12px;width:100%;height:4px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden;position:relative;">
                            <div id="barraCredit" style="width:0%;height:100%;background:linear-gradient(90deg, #fbbf24, #f97316, #ef4444, #8b5cf6, #22c55e, #f472b6, #ec4899, #ef4444);border-radius:3px;transition:width 0.8s ease;box-shadow:0 0 30px rgba(251,191,36,0.2);"></div>
                        </div>
                        <div style="margin-top:10px;font-size:10px;color:#6b5b8a;letter-spacing:1px;display:flex;justify-content:space-between;align-items:center;padding:0 4px;">
                            <span id="estadoCredit" style="color:#8a7ea0;">🍋 Limpiando historial...</span>
                            <span id="porcentajeCrediticio">0%</span>
                        </div>
                    </div>
                `;
                resultText.appendChild(creditContainer);
                
                const intervalCreditFrutas = setInterval(() => {
                    if (frutaCreditActual < frutasCredit.length - 1) {
                        frutaCreditActual++;
                        const emojiSpan = document.getElementById('frutaCreditEmoji');
                        if (emojiSpan) {
                            emojiSpan.style.transition = 'all 0.6s ease';
                            emojiSpan.style.transform = 'scale(1.4)';
                            emojiSpan.textContent = frutasCredit[frutaCreditActual];
                            setTimeout(() => {
                                emojiSpan.style.transform = 'scale(1)';
                            }, 400);
                        }
                        const estadoSpan = document.getElementById('estadoCredit');
                        if (estadoSpan) {
                            estadoSpan.textContent = etiquetasCredit[frutaCreditActual] || '🍉 Procesando...';
                        }
                    }
                }, 1800);
                
                let progresoCrediticio = 0;
                const intervalCreditBarra = setInterval(() => {
                    const incremento = Math.random() * 5 + 2;
                    progresoCrediticio = Math.min(progresoCrediticio + incremento, 95);
                    const barra = document.getElementById('barraCredit');
                    const pct = document.getElementById('porcentajeCrediticio');
                    if (barra) barra.style.width = progresoCrediticio + '%';
                    if (pct) pct.textContent = Math.round(progresoCrediticio) + '%';
                }, 400);
                
                loading.actualizarMensaje('💳 Buscando historial crediticio');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                try {
                    const creditResponse = await fetch(`${CREDIT_API_URL}?dni=${encodeURIComponent(comando.valor)}`);
                    if (creditResponse.ok) {
                        const creditData = await creditResponse.json();
                        
                        const container = document.getElementById('creditContainer');
                        
                        clearInterval(intervalCreditFrutas);
                        clearInterval(intervalCreditBarra);
                        const barra = container ? document.getElementById('barraCredit') : null;
                        const pct = container ? document.getElementById('porcentajeCrediticio') : null;
                        const emojiSpan = container ? document.getElementById('frutaCreditEmoji') : null;
                        const estadoSpan = container ? document.getElementById('estadoCredit') : null;
                        
                        if (barra) {
                            barra.style.width = '100%';
                            barra.style.background = 'linear-gradient(90deg, #22c55e, #22c55e)';
                        }
                        if (pct) pct.textContent = '100% ✅';
                        if (emojiSpan) {
                            emojiSpan.textContent = '✅';
                            emojiSpan.style.transition = 'all 0.6s ease';
                            emojiSpan.style.transform = 'scale(1.3)';
                            setTimeout(() => {
                                emojiSpan.style.transform = 'scale(1)';
                            }, 400);
                        }
                        if (estadoSpan) {
                            estadoSpan.textContent = '✅ ¡Completado!';
                            estadoSpan.style.color = '#22c55e';
                        }
                        
                        if (creditData && !creditData.error && creditData.length > 0) {
                            registrosCrediticios = creditData.length;
                            totalRegistrosEncontrados += registrosCrediticios;
                            
                            if (container) {
                                const morosidadHTML = mostrarMorosidad(creditData);
                                const deudasHTML = mostrarDeudas(creditData);
                                container.outerHTML = morosidadHTML + deudasHTML;
                            }
                            ultimoResultado = construirTextoPlano(data, creditData);
                        } else {
                            if (container) {
                                container.outerHTML = `
                                    <div style="text-align:center;padding:12px;color:#8a7ea0;font-size:12px;border:1px solid rgba(160,68,255,0.06);border-radius:12px;background:var(--bg-card);margin-top:10px;">
                                        📭 Sin historial crediticio registrado
                                    </div>
                                `;
                            }
                            ultimoResultado = construirTextoPlano(data, null);
                        }
                    } else {
                        clearInterval(intervalCreditFrutas);
                        clearInterval(intervalCreditBarra);
                        const container = document.getElementById('creditContainer');
                        if (container) {
                            container.outerHTML = `
                                <div style="text-align:center;padding:12px;color:#ff6b6b;font-size:12px;border:1px solid rgba(255,107,107,0.08);border-radius:12px;background:var(--bg-card);margin-top:10px;">
                                    ⚠️ No se pudo consultar el historial crediticio
                                </div>
                            `;
                        }
                        ultimoResultado = construirTextoPlano(data, null);
                    }
                } catch (e) {
                    console.warn('Error al obtener datos crediticios:', e);
                    clearInterval(intervalCreditFrutas);
                    clearInterval(intervalCreditBarra);
                    const container = document.getElementById('creditContainer');
                    if (container) {
                        container.outerHTML = `
                            <div style="text-align:center;padding:12px;color:#ff6b6b;font-size:12px;border:1px solid rgba(255,107,107,0.08);border-radius:12px;background:var(--bg-card);margin-top:10px;">
                                ⚠️ Error al consultar historial crediticio
                            </div>
                        `;
                    }
                    ultimoResultado = construirTextoPlano(data, null);
                }
            } else {
                const origenHTML = `
                    <div class="origen">
                        <span>📌 Fuente: ${data.origen || '---'}</span>
                        <span>📅 Fecha del dato: ${data.timestamp || '---'}</span>
                    </div>
                `;
                resultText.innerHTML += origenHTML;
                ultimoResultado = construirTextoPlano(data);
            }
            
            const tiempoFin = performance.now();
            const tiempoTotal = ((tiempoFin - tiempoInicio) / 1000).toFixed(2);
            
            const estadisticasHTML = `
                <div class="estadisticas-busqueda">
                    <span>⏱️ <strong>${tiempoTotal}s</strong></span>
                    <span>📊 <strong>${totalRegistrosEncontrados}</strong> registros encontrados</span>
                    ${registrosCrediticios > 0 ? `<span>💳 <strong>${registrosCrediticios}</strong> deudas</span>` : ''}
                    <span>🔍 <strong>${comando.valor}</strong></span>
                </div>
            `;
            
            const origenElement = resultText.querySelector('.origen');
            if (origenElement) {
                origenElement.insertAdjacentHTML('beforebegin', estadisticasHTML);
            } else {
                resultText.innerHTML += estadisticasHTML;
            }
            
            loading.completar();
            
        } else if (comando.tipo === 'politicas') {
            loading.actualizarMensaje('📋 Buscando políticas de entidades');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const resultados = await buscarPoliticasAPI(comando.valor);
            const tiempoFin = performance.now();
            const tiempoTotal = ((tiempoFin - tiempoInicio) / 1000).toFixed(2);
            
            loading.completar();
            await new Promise(resolve => setTimeout(resolve, 400));
            
            if (resultados.error) {
                resultText.innerHTML = `<div class="error">❌ ${resultados.error}</div>`;
            } else if (resultados.length === 0) {
                resultText.innerHTML = `<div class="error">❌ No se encontraron políticas para "${comando.valor}"</div>`;
            } else {
                totalRegistrosEncontrados = resultados.length;
                mostrarPoliticasConEstadisticas(resultados, comando.valor, tiempoTotal, totalRegistrosEncontrados);
            }
        }
    } catch (e) {
        console.error('Error:', e);
        loading.completar();
        await new Promise(resolve => setTimeout(resolve, 400));
        resultText.innerHTML = `
            <div class="error">
                ❌ Error al consultar la base de datos
                <br><br>
                <span style="color:#8a7ea0;font-size:11px;">${e.message}</span>
            </div>
        `;
    }
    
    buscando = false;
}

// ============================================================
// EFECTO REVELADO CON DESTELLO
// ============================================================
function iniciarEfectoScan() {
    if (cursorElement) cursorElement.style.display = 'none';
    
    const mensajes = [
        { text: "asistAI v2.0", style: "font-size:20px;font-weight:bold;color:var(--violet-soft);display:block;margin-bottom:6px;letter-spacing:2px;" },
        { text: "🔍 Búsqueda inteligente", style: "display:block;margin-top:2px;font-size:13px;" },
        { text: "   • DNI (6-9 dígitos)", style: "display:block;padding-left:6px;font-size:12.5px;color:var(--text-secondary);" },
        { text: "   • CUIT (10 dígitos)", style: "display:block;padding-left:6px;font-size:12.5px;color:var(--text-secondary);" },
        { text: "   • Políticas de entidades", style: "display:block;padding-left:6px;font-size:12.5px;color:var(--text-secondary);" },
        { text: "   • Calculador Macro (macro-DNI - macro DNI)", style: "display:block;padding-left:6px;font-size:12.5px;color:var(--text-secondary);" },
        { text: "", style: "display:block;height:6px;" },
        { text: "Sistema listo", style: "color:var(--green);display:block;margin-top:4px;font-size:13px;font-weight:bold;" }
    ];
    
    let index = 0;
    
    typewriterElement.innerHTML = '';
    
    function showNextLine() {
        if (index < mensajes.length) {
            const msg = mensajes[index];
            
            const el = document.createElement('div');
            el.innerHTML = msg.text;
            el.style.cssText = msg.style;
            el.style.opacity = '0';
            el.style.transform = 'translateY(8px)';
            el.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            if (index === 0) {
                typewriterElement.appendChild(el);
                void el.offsetHeight;
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                
                let glowCount = 0;
                const glowInterval = setInterval(() => {
                    if (glowCount < 3) {
                        el.style.textShadow = glowCount % 2 === 0 
                            ? '0 0 30px rgba(129, 140, 248, 0.6), 0 0 60px rgba(129, 140, 248, 0.3)' 
                            : '0 0 10px rgba(129, 140, 248, 0.2)';
                        glowCount++;
                    } else {
                        clearInterval(glowInterval);
                        el.style.textShadow = '0 0 20px rgba(129, 140, 248, 0.2)';
                    }
                }, 300);
                
                setTimeout(() => {
                    index++;
                    setTimeout(showNextLine, 200);
                }, 800);
            } else if (msg.text === '') {
                typewriterElement.appendChild(el);
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                index++;
                setTimeout(showNextLine, 50);
            } else {
                typewriterElement.appendChild(el);
                void el.offsetHeight;
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                
                if (msg.text.includes('Sistema listo')) {
                    setTimeout(() => {
                        el.style.transition = 'all 0.6s ease';
                        let pulseCount = 0;
                        const pulseInterval = setInterval(() => {
                            if (pulseCount < 2) {
                                el.style.color = pulseCount % 2 === 0 ? 'var(--green)' : 'var(--green)';
                                pulseCount++;
                            } else {
                                clearInterval(pulseInterval);
                                el.style.color = 'var(--green)';
                            }
                        }, 400);
                    }, 300);
                }
                
                index++;
                const delay = msg.text.includes('Base de datos') ? 400 : 
                             msg.text.includes('Sistema listo') ? 500 : 150;
                setTimeout(showNextLine, delay);
            }
        } else {
            const cursorSpan = document.createElement('span');
            cursorSpan.className = 'cursor';
            cursorSpan.id = 'cursor';
            cursorSpan.style.display = 'inline-block';
            typewriterElement.appendChild(cursorSpan);
            
            const searchContainer = document.getElementById('searchContainer');
            searchContainer.classList.add('visible');
            document.getElementById('dniInput').focus();
            
            agregarBotonChatMini();
        }
    }
    
    setTimeout(showNextLine, 300);
}

// ============================================================
// AGREGAR BOTÓN CHAT MINI
// ============================================================
function agregarBotonChatMini() {
    const consoleDiv = document.getElementById('consoleOutput');
    
    const lines = consoleDiv.innerHTML.split('<br>');
    let lastLineIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('🤖 [  CHAT CON IA  ]')) {
            lastLineIndex = i;
        }
    }
    
    if (lastLineIndex !== -1) {
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
// FUNCIÓN PARA ABRIR CHAT IA
// ============================================================
function abrirChatIA() {
    alert('🤖 Próximamente: Chat con IA en vivo!\n\nMientras tanto, puedes usar la búsqueda inteligente.');
}

// ============================================================
// INICIAR APP
// ============================================================
async function iniciarApp() {
    const consoleElement = document.getElementById('consoleOutput');
    const searchContainer = document.getElementById('searchContainer');
    
    if (consoleElement.classList.contains('oculto') === false && 
        typewriterElement.innerHTML.length > 0) {
        return;
    }
    
    if (searchContainer.classList.contains('visible')) {
        return;
    }
    
    reiniciarEstado();
    typewriterElement.textContent = 'Cargando...';
    const total = await obtenerTotalRegistros();
    
    typewriterElement.innerHTML = '';
    iniciarEfectoScan();
}

// ============================================================
// CHAT FLOTANTE - ASISTENTE INTELIGENTE
// ============================================================

const LINEAS_ENTRANTES = [
    '1152633965',
    '1152639134',
    '1170780169',
    '1152637012',
    '1152630447',
    '1152633093'
];

const conocimientosIA = {
    saludos: ['hola', 'buenas', 'que tal', 'hey', 'hello', 'buen día', 'buenas tardes', 'buenas noches', 'holi', 'holis', 'que onda', 'alo'],
    despedidas: ['chau', 'adiós', 'hasta luego', 'nos vemos', 'bye', 'gracias', 'muchas gracias', 'gracias!', 'chao', 'me voy'],
    ayuda: ['ayuda', 'help', 'como se usa', 'que podes hacer', 'funciones', 'comandos', 'que sabes hacer', 'que haces', 'servicios'],
    presentacion: ['quien sos', 'quien eres', 'que sos', 'presentate', 'presentación'],
    lineas: ['lineas entrantes', 'líneas entrantes', 'cuales son las lineas', 'cuales son las líneas', 'que lineas', 'listado de lineas', 'lista de lineas', 'mostrar lineas', 'ver lineas', 'entrantes', 'lineas disponibles', 'líneas disponibles']
};

const respuestasIA = {
    saludo: [
        '¡Hola! 👋 Soy tu asistente.<br><br>📌 <strong>¿Qué puedo hacer?</strong><br>• Mostrar líneas entrantes<br>• Generar CUIL con DNI<br><br>💡 <span style="font-size:12px;color:#8a7ea0;">Escribí "ayuda" para ver los comandos.</span>',
        '¡Buenas! 🤖 ¿En qué te ayudo?<br><br>✅ <strong>Funciones:</strong><br>• Ver líneas entrantes<br>• Generar CUIL<br><br>🔢 <span style="font-size:12px;color:#8a7ea0;">Probá con "líneas entrantes" o un DNI.</span>',
        '¡Hey! 😊 Listo para ayudar.<br><br>📋 <strong>Podés:</strong><br>• Ver el listado de líneas entrantes<br>• Calcular tu CUIL<br><br>💡 <span style="font-size:12px;color:#8a7ea0;">Ejemplo: "líneas entrantes" o "12345678"</span>'
    ],
    despedida: [
        '¡Hasta luego! 👋 Volvé cuando necesites algo.',
        '¡Chau! 😊 ¡Qué tengas lindo día!',
        '¡Gracias a vos! 🙌 ¡Nos vemos!'
    ],
    ayuda: [
        '🤖 <strong>Comandos disponibles:</strong><br><br>' +
        '📞 <strong>Líneas entrantes</strong><br>' +
        '• "líneas entrantes" → Muestra todas<br>' +
        '• "entrantes" → Muestra todas<br><br>' +
        '🪪 <strong>Generar CUIL</strong><br>' +
        '• Escribí tu DNI (6-9 dígitos)<br>' +
        '• Agregá "F" si sos mujer<br><br>' +
        '💡 <span style="font-size:12px;color:#8a7ea0;">Ejemplos: "líneas entrantes" o "12345678 F"</span>'
    ],
    presentacion: [
        '🤖 Soy tu <strong>Asistente</strong>.<br><br>' +
        '✅ <strong>Lo que sé hacer:</strong><br>' +
        '• Mostrar líneas entrantes<br>' +
        '• Generar CUIL con DNI<br><br>' +
        '🚀 <span style="font-size:12px;color:#8a7ea0;">Probá con "ayuda" para ver cómo usar.</span>'
    ],
    default: [
        '🤔 No entendí bien...<br><br>📌 <strong>Probá con:</strong><br>• "líneas entrantes" para ver el listado<br>• Un DNI para generar CUIL<br>• "Ayuda" para ver comandos<br><br>💡 <span style="font-size:12px;color:#8a7ea0;">Ejemplo: "líneas entrantes" o "12345678"</span>',
        '📋 ¿Podés ser más específico?<br><br>✅ <strong>Lo que sé:</strong><br>• Mostrar líneas entrantes<br>• Generar CUIL<br><br>🎯 <span style="font-size:12px;color:#8a7ea0;">Probá con "líneas entrantes" o un DNI.</span>'
    ],
    error: [
        '❌ Ese DNI no parece válido.<br><br>📌 Debe tener entre <strong>6 y 9 dígitos</strong>.<br><br>💡 Ejemplo: "12345678"',
        '❌ Revisá ese DNI...<br><br>📌 Debe ser un número de <strong>6 a 9 dígitos</strong>.',
        '❌ No reconozco ese DNI.<br><br>📌 Asegurate que tenga entre <strong>6 y 9 dígitos</strong>.'
    ]
};

let memoriaChat = {
    ultimoDNI: null,
    ultimoGenero: null,
    generoPreferido: null,
    mensajes: [],
    conversaciones: 0
};

function toggleChat() {
    const window = document.getElementById('chatWindow');
    const toggle = document.getElementById('chatToggle');
    if (window.style.display === 'none' || window.style.display === '') {
        window.style.display = 'flex';
        window.classList.add('open');
        toggle.textContent = '✕';
        setTimeout(() => document.getElementById('chatInput').focus(), 300);
    } else {
        window.style.display = 'none';
        window.classList.remove('open');
        toggle.textContent = '💬';
    }
}

function agregarMensaje(texto, tipo) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-message ${tipo}`;
    div.innerHTML = texto;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    
    if (tipo === 'user') {
        memoriaChat.mensajes.push({ rol: 'usuario', contenido: texto });
        memoriaChat.conversaciones++;
    } else {
        memoriaChat.mensajes.push({ rol: 'asistente', contenido: texto });
    }
}

function obtenerRespuestaAleatoria(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
}

function mostrarLineasEntrantes() {
    let respuesta = `📞 <strong>LÍNEAS ENTRANTES</strong><br><br>`;
    respuesta += `📋 <strong>Total:</strong> ${LINEAS_ENTRANTES.length} líneas<br><br>`;
    respuesta += `<div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:12px;">`;
    
    LINEAS_ENTRANTES.forEach((linea, index) => {
        respuesta += `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(160,68,255,0.05);">`;
        respuesta += `<span style="color:#a78bfa;">${index + 1}.</span>`;
        respuesta += `<span style="color:#fbbf24;font-weight:bold;">${linea}</span>`;
        respuesta += `<span style="color:#34d399;font-size:12px;">✅ Activa</span>`;
        respuesta += `</div>`;
    });
    
    respuesta += `</div>`;
    respuesta += `<br><span style="font-size:11px;color:#8a7ea0;">💡 ¿Querés generar un CUIL? Decime tu DNI.</span>`;
    
    return respuesta;
}

function calcularCUIL(dni, sexo) {
    const dniStr = String(dni).replace(/\D/g, '');
    if (dniStr.length < 6 || dniStr.length > 9) return null;
    
    const dniCompleto = dniStr.padStart(8, '0');
    const genero = sexo && sexo.toUpperCase() === 'F' ? 'F' : 'M';
    const prefijo = genero === 'F' ? '27' : '20';
    const base = prefijo + dniCompleto;
    
    const coeficientes = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 10; i++) {
        suma += parseInt(base.charAt(i)) * coeficientes[i];
    }
    
    const resto = suma % 11;
    let digito;
    if (resto === 0) {
        digito = 0;
    } else if (resto === 1) {
        if (genero === 'F') {
            return '23' + dniCompleto + '4';
        } else {
            return '23' + dniCompleto + '9';
        }
    } else {
        digito = 11 - resto;
    }
    return base + digito;
}

function formatearCUIL(cuil) {
    if (!cuil) return 'Error';
    const cuilStr = String(cuil).replace(/\D/g, '');
    if (cuilStr.length !== 11) return cuilStr;
    return cuilStr.substring(0, 2) + '-' + cuilStr.substring(2, 10) + '-' + cuilStr.substring(10);
}

function extraerDNI(texto) {
    const match = texto.match(/\b\d{6,9}\b/);
    return match ? match[0] : null;
}

function extraerSexo(texto) {
    const textoLower = texto.toLowerCase();
    if (textoLower.includes('femenino') || textoLower.includes(' mujer') || /\bf\b/.test(textoLower) || textoLower.includes(' femenino')) {
        return 'F';
    }
    if (textoLower.includes('masculino') || textoLower.includes(' hombre') || /\bm\b/.test(textoLower) || textoLower.includes(' masculino')) {
        return 'M';
    }
    return null;
}

function procesarChat(mensaje) {
    const texto = mensaje.toLowerCase().trim();
    const dni = extraerDNI(mensaje);
    const sexo = extraerSexo(mensaje);
    
    if (conocimientosIA.presentacion.some(p => texto.includes(p))) {
        return obtenerRespuestaAleatoria(respuestasIA.presentacion);
    }
    
    if (conocimientosIA.saludos.some(p => texto.includes(p))) {
        const saludo = obtenerRespuestaAleatoria(respuestasIA.saludo);
        if (memoriaChat.ultimoDNI) {
            return saludo + `<br><br>📝 Recuerdo tu último DNI: <strong>${memoriaChat.ultimoDNI}</strong>. ¿Queres generar otro CUIL o ver las líneas entrantes?`;
        }
        return saludo;
    }
    
    if (conocimientosIA.despedidas.some(p => texto.includes(p))) {
        return obtenerRespuestaAleatoria(respuestasIA.despedida);
    }
    
    if (conocimientosIA.ayuda.some(p => texto.includes(p))) {
        return obtenerRespuestaAleatoria(respuestasIA.ayuda);
    }
    
    if (conocimientosIA.lineas.some(p => texto.includes(p))) {
        return mostrarLineasEntrantes();
    }
    
    if (sexo && !dni) {
        memoriaChat.generoPreferido = sexo;
        const generoTexto = sexo === 'F' ? 'femenino' : 'masculino';
        return `✅ ¡Entendido! Usaré género <strong>${generoTexto}</strong> para futuros CUIL. 😊<br><br>📌 Ahora decime un DNI (6-9 dígitos) para generar tu CUIL.`;
    }
    
    if (dni) {
        let sexoFinal = sexo || memoriaChat.generoPreferido || 'M';
        const cuil = calcularCUIL(dni, sexoFinal);
        
        if (!cuil) {
            return obtenerRespuestaAleatoria(respuestasIA.error);
        }
        
        memoriaChat.ultimoDNI = dni;
        memoriaChat.ultimoGenero = sexoFinal;
        if (!memoriaChat.generoPreferido) {
            memoriaChat.generoPreferido = sexoFinal;
        }
        
        const cuilFormateado = formatearCUIL(cuil);
        const generoTexto = sexoFinal === 'F' ? 'femenino' : 'masculino';
        const prefijo = sexoFinal === 'F' ? '27' : '20';
        
        const intro = [
            '✅ ¡Listo! Acá tenés tu CUIL:',
            '🔢 Ya lo tengo. Tu CUIL es:',
            '📋 ¡Calculado! Este es tu CUIL:',
            '🎯 ¡Perfecto! Tu CUIL es:'
        ];
        
        let respuesta = `${obtenerRespuestaAleatoria(intro)}<br>`;
        respuesta += `<span class="cuil-result">${cuilFormateado}</span><br><br>`;
        respuesta += `📊 <strong>Detalle:</strong><br>`;
        respuesta += `• DNI: <span class="dni-number">${dni}</span><br>`;
        respuesta += `• Prefijo: ${prefijo}<br>`;
        respuesta += `• Género: ${generoTexto}`;
        respuesta += `<br><br>💡 <span style="font-size:11px;color:#8a7ea0;">¿Necesitas otro CUIL? Decime otro DNI.</span>`;
        respuesta += `<br><span style="font-size:11px;color:#8a7ea0;">📞 Escribí "líneas entrantes" para ver el listado.</span>`;
        
        return respuesta;
    }
    
    return obtenerRespuestaAleatoria(respuestasIA.default);
}

function enviarChat() {
    const input = document.getElementById('chatInput');
    const mensaje = input.value.trim();
    
    if (!mensaje) return;
    
    agregarMensaje(mensaje, 'user');
    input.value = '';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '🤔 <span style="opacity:0.6;">Procesando...</span>';
    document.getElementById('chatMessages').appendChild(typingDiv);
    document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    
    const respuesta = procesarChat(mensaje);
    
    setTimeout(() => {
        document.getElementById('typingIndicator').remove();
        agregarMensaje(respuesta, 'bot');
        document.getElementById('chatInput').focus();
    }, 400 + Math.random() * 600);
}

function iniciarChat() {
    const messages = document.getElementById('chatMessages');
    
    messages.innerHTML = '';
    
    const mensajeBienvenida = `🎯 <strong>¡Bienvenido al Asistente!</strong><br><br>` +
        `📌 <strong>¿Qué puedo hacer?</strong><br>` +
        `📞 <strong>Ver líneas entrantes</strong><br>` +
        `• Escribí "líneas entrantes"<br>` +
        `• Te muestro todas las líneas<br><br>` +
        `🪪 <strong>Generar CUIL</strong><br>` +
        `• Escribí tu DNI (6-9 dígitos)<br>` +
        `• Agregá "F" si sos mujer<br><br>` +
        `💡 <span style="font-size:12px;color:#8a7ea0;">Ejemplos: "líneas entrantes" o "12345678 F"</span><br>` +
        `📋 <span style="font-size:11px;color:#6b5b8a;">Escribí "ayuda" para ver los comandos.</span>`;
    
    const div = document.createElement('div');
    div.className = 'chat-message bot';
    div.innerHTML = mensajeBienvenida;
    messages.appendChild(div);
    
    memoriaChat = {
        ultimoDNI: null,
        ultimoGenero: null,
        generoPreferido: null,
        mensajes: [],
        conversaciones: 0
    };
}

// ============================================================
// EVENT LISTENERS
// ============================================================

document.addEventListener('DOMContentLoaded', async function() {
    const logged = await verificarSesion();
    if (!logged) {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('loginUser').focus();
    } else {
        setTimeout(() => {
            iniciarApp();
        }, 500);
    }
    
    iniciarChat();
    
    document.getElementById('chatWindow').style.display = 'none';
    
    const input = document.getElementById('chatInput');
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarChat();
        }
    });
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('dniInput');
        if (document.activeElement === input) {
            buscarDNI();
        }
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        const dniInput = document.getElementById('dniInput');
        if (dniInput) {
            dniInput.value = '';
            dniInput.focus();
        }
        const resultText = document.getElementById('resultText');
        if (resultText) {
            resultText.innerHTML = '';
        }
        const btnCopiar = document.getElementById('btnCopiar');
        if (btnCopiar) {
            btnCopiar.classList.remove('visible');
        }
    }
});
