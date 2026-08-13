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
            // Token inválido - limpiar todo
            localStorage.removeItem('asistAI_token');
            localStorage.removeItem('asistAI_user');
            localStorage.removeItem('asistAI_logged');
            return false;
        }
    } catch (e) {
        console.warn('Error al verificar sesión:', e);
        // ERROR DE RED - NO LIMPIAR, solo mostrar login con mensaje
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
const EMPRESAS_API_URL = 'https://carover0.xyz/api/empresas.php'; // NUEVO
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
// FUNCIÓN PARA BUSCAR EMPRESAS POR CUIT (NUEVO)
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
// FUNCIÓN PARA MOSTRAR EMPRESAS (NUEVO)
// ============================================================
function mostrarEmpresas(resultado) {
    const resultDiv = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    
    btnCopiar.classList.add('visible');
    cambiarFondo('f15.png');
    
    if (resultado.error) {
        resultDiv.innerHTML = `
            <div class="error">❌ ${resultado.error}</div>
        `;
        ultimoResultado = `❌ ${resultado.error}`;
        return;
    }
    
    if (!resultado.resultados || resultado.resultados.length === 0) {
        resultDiv.innerHTML = `
            <div class="error">❌ No se encontraron empresas con CUIT: ${resultado.cuit_buscado}</div>
        `;
        ultimoResultado = `❌ No se encontraron empresas con CUIT: ${resultado.cuit_buscado}`;
        return;
    }
    
    let html = `
        <div class="header-card">
            <div class="dni-number">🏢 EMPRESAS</div>
            <div class="badge" style="background:rgba(79,70,229,0.2);border:1px solid var(--violet);padding:4px 14px;border-radius:20px;font-size:11px;color:var(--violet-soft);text-transform:uppercase;letter-spacing:1px;">
                ${resultado.total} resultado${resultado.total > 1 ? 's' : ''}
            </div>
        </div>
    `;
    
    resultado.resultados.forEach((empresa, index) => {
        const borderColors = ['var(--violet)', 'var(--green)', 'var(--gold)', 'var(--red)'];
        
        // Limpiar y formatear datos
        const cuit = empresa.EMPLEADOR_CUIT || '-';
        const razonSocial = empresa.EMPLEADOR_RAZONSOC || 'Sin nombre';
        const empleados = empresa.CANT_EMPLEADOS || '-';
        const domicilio = empresa.EMPLEADOR_DOMICILIO || 'Sin domicilio';
        
        // Teléfonos
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
        
        // Función para crear links de WhatsApp y Telegram
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
                
                ${fijo ? `
                <div class="campo">
                    <span class="label">Teléfono fijo</span>
                    <span class="valor">${fijo}</span>
                </div>
                ` : ''}
                
                ${celulares.length > 0 ? `
                <div class="campo" style="border-bottom:none;">
                    <span class="label">Celulares</span>
                    <span class="valor" style="font-size:12px;">
                        ${celulares.map((cel, i) => `
                            ${cel} ${linkContacto(cel)}
                            ${i < celulares.length - 1 ? ' / ' : ''}
                        `).join('')}
                    </span>
                </div>
                ` : ''}
                
                ${emails.length > 0 ? `
                <div class="campo" style="border-bottom:none;margin-top:2px;">
                    <span class="label">Emails</span>
                    <span class="valor" style="font-size:12px;word-break:break-all;">
                        ${emails.join(' / ')}
                    </span>
                </div>
                ` : ''}
            </div>
        `;
    });
    
    resultDiv.innerHTML = html;
    
    // Construir texto plano para copiar
    let texto = `🏢 EMPRESAS ENCONTRADAS\n`;
    texto += `${'─'.repeat(40)}\n\n`;
    texto += `🔍 CUIT buscado: ${resultado.cuit_buscado}\n`;
    texto += `📊 Total: ${resultado.total}\n\n`;
    
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
// FUNCION PARA CALCULAR NIVEL DE MOROSIDAD (CORREGIDA)
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
// FUNCION PARA MOSTRAR DEUDAS DETALLADAS (CORREGIDA)
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
    cambiarFondo('f10.png');
    
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
            <div class="badge" style="background:rgba(79,70,229,0.2);border:1px solid var(--violet);padding:4px 14px;border-radius:20px;font-size:11px;color:var(--violet-soft);text-transform:uppercase;letter-spacing:1px;">
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
// FUNCION PARA MOSTRAR POLITICAS
// ============================================================
function mostrarPoliticas(resultados, termino) {
    const resultDiv = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    
    btnCopiar.classList.add('visible');
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
            
            if (!botonAgregado) {
                botonAgregado = true;
                agregarBotonChatMini();
            }
        }
    }

    typeWriter();
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
    consoleElement.classList.add('oculto');
    const searchContainer = document.getElementById('searchContainer');
    searchContainer.classList.add('arriba');
    document.body.classList.add('fondo-busqueda');
}

// ============================================================
// REINICIAR ESTADO - CORREGIDO PARA NO BLOQUEAR LA APP
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
    
    // Limpiar solo lo necesario, no ocultar la consola si ya está visible
    dniInput.value = '';
    resultContent.className = 'result';
    resultText.innerHTML = '';
    btnCopiar.classList.remove('visible');
    btnCopiar.textContent = '📋 COPIAR';
    btnCopiar.classList.remove('copiado');
    // No ocultar consoleElement, no remover clases de searchContainer
    // No cambiar fondo si no es necesario
    // No resetear typewriterElement si no es necesario
    ultimoResultado = '';
}

// ============================================================
// DETECTAR COMANDOS ESPECIALES - ACTUALIZADO
// ============================================================
function detectarComando(query) {
    const queryLower = query.toLowerCase().trim();
    const descargasKeywords = ['descarga', 'descargas', 'programa', 'programas', 'software', 'apps', 'aplicaciones', 'download', 'anydesk', 'collector', 'zoiper'];
    
    for (let keyword of descargasKeywords) {
        if (queryLower.includes(keyword)) {
            return { tipo: 'descargas' };
        }
    }
    
    // 🔴 IMPORTANTE: DETECTAR CUIT PRIMERO (10 dígitos o más)
    if (/^\d{10,}$/.test(query)) {
        return { tipo: 'empresa', valor: query };
    }
    
    // Luego DNI (6-9 dígitos)
    if (/^\d+$/.test(query)) {
        if (query.length >= 6 && query.length <= 9) {
            return { tipo: 'dni', valor: query };
        } else {
            return { tipo: 'error', mensaje: '⚠️ Ingrese un DNI válido (6-9 dígitos) o CUIT (10 dígitos).' };
        }
    }
    
    // Políticas
    if (query.length >= 2) {
        return { tipo: 'politicas', valor: query };
    }
    
    return { tipo: 'error', mensaje: '⚠️ Ingrese un DNI (6-9 dígitos), CUIT (10 dígitos) o nombre de entidad (mínimo 2 letras).' };
}

// ============================================================
// BUSCAR DNI, CUIT O POLÍTICAS - ACTUALIZADO Y CORREGIDO
// ============================================================
let buscando = false;

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
        resultContent.className = 'result visible';
        btnCopiar.classList.remove('visible');
        resultText.innerHTML = `<div class="error">⚠️ Ingrese un DNI (6-9 dígitos), CUIT (10 dígitos) o nombre de entidad (mínimo 2 letras).</div>`;
        return;
    }

    buscando = true;

    prepararBusqueda();
    resultContent.className = 'result visible';
    btnCopiar.classList.remove('visible');
    
    const comando = detectarComando(query);
    
    if (comando.tipo === 'descargas') {
        mostrarDescargas();
        buscando = false;
        return;
    }
    
    if (comando.tipo === 'error') {
        resultText.innerHTML = `<div class="error">${comando.mensaje}</div>`;
        buscando = false;
        return;
    }
    
    // Mostrar loading
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
                Buscando en base de datos<span style="display:inline-block;animation: dots 1.5s steps(4) infinite;">...</span>
            </div>
        </div>
    `;
    
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        // ===== EMPRESA (CUIT) =====
        if (comando.tipo === 'empresa') {
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
                        🏢 Buscando empresas por CUIT<span style="display:inline-block;animation: dots 1.5s steps(4) infinite;">...</span>
                    </div>
                </div>
            `;
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const resultado = await buscarEmpresaPorCUIT(comando.valor);
            mostrarEmpresas(resultado);
            
        // ===== DNI =====
        } else if (comando.tipo === 'dni') {
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
                        📋 Buscando datos personales<span style="display:inline-block;animation: dots 1.5s steps(4) infinite;">...</span>
                    </div>
                </div>
            `;
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const response = await fetch(`${API_URL}?dni=${encodeURIComponent(comando.valor)}`);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            
            if (data.error) {
                resultText.innerHTML = `<div class="error">❌ ${data.error}</div>`;
                buscando = false;
                return;
            }
            
            mostrarResultadoXfinder(data);
            
            if (!data.fallecido) {
                const oldContainer = document.getElementById('creditContainer');
                if (oldContainer) {
                    oldContainer.remove();
                }
                
                const creditContainer = document.createElement('div');
                creditContainer.id = 'creditContainer';
                creditContainer.innerHTML = `
                    <div style="text-align:center;padding:20px;color:var(--violet-soft);font-size:14px;border:1px solid rgba(160,68,255,0.1);border-radius:12px;margin-top:10px;">
                        <div style="margin-bottom:12px;display:flex;justify-content:center;gap:8px;font-size:28px;">
                            <span style="display:inline-block;animation: pulseBox 1s ease-in-out infinite;animation-delay:0s;">🟪</span>
                            <span style="display:inline-block;animation: pulseBox 1s ease-in-out infinite;animation-delay:0.15s;">🟪</span>
                            <span style="display:inline-block;animation: pulseBox 1s ease-in-out infinite;animation-delay:0.3s;">⬛</span>
                            <span style="display:inline-block;animation: pulseBox 1s ease-in-out infinite;animation-delay:0.45s;">⬛</span>
                            <span style="display:inline-block;animation: pulseBox 1s ease-in-out infinite;animation-delay:0.6s;">🟪</span>
                        </div>
                        <div style="letter-spacing:2px;color:var(--violet-soft);font-size:13px;">
                            💳 Buscando historial crediticio<span style="display:inline-block;animation: dots 1.5s steps(4) infinite;">...</span>
                        </div>
                    </div>
                `;
                resultText.appendChild(creditContainer);
                
                await new Promise(resolve => setTimeout(resolve, 50));
                
                try {
                    const creditResponse = await fetch(`${CREDIT_API_URL}?dni=${encodeURIComponent(comando.valor)}`);
                    if (creditResponse.ok) {
                        const creditData = await creditResponse.json();
                        
                        const container = document.getElementById('creditContainer');
                        
                        if (creditData && !creditData.error && creditData.length > 0) {
                            if (container) {
                                const morosidadHTML = mostrarMorosidad(creditData);
                                const deudasHTML = mostrarDeudas(creditData);
                                container.outerHTML = morosidadHTML + deudasHTML;
                            }
                            ultimoResultado = construirTextoPlano(data, creditData);
                        } else {
                            if (container) {
                                container.remove();
                            }
                            const sinDatosHTML = `
                                <div style="text-align:center;padding:12px;color:#8a7ea0;font-size:13px;border:1px solid rgba(160,68,255,0.1);border-radius:12px;margin-top:10px;">
                                    📭 Sin historial crediticio registrado
                                </div>
                            `;
                            resultText.innerHTML += sinDatosHTML;
                            ultimoResultado = construirTextoPlano(data, null);
                        }
                    } else {
                        const container = document.getElementById('creditContainer');
                        if (container) {
                            container.remove();
                        }
                        const errorHTML = `
                            <div style="text-align:center;padding:12px;color:#ff6b6b;font-size:13px;border:1px solid rgba(255,107,107,0.2);border-radius:12px;margin-top:10px;">
                                ⚠️ No se pudo consultar el historial crediticio
                            </div>
                        `;
                        resultText.innerHTML += errorHTML;
                        ultimoResultado = construirTextoPlano(data, null);
                    }
                } catch (e) {
                    console.warn('Error al obtener datos crediticios:', e);
                    const container = document.getElementById('creditContainer');
                    if (container) {
                        container.remove();
                    }
                    const errorHTML = `
                        <div style="text-align:center;padding:12px;color:#ff6b6b;font-size:13px;border:1px solid rgba(255,107,107,0.2);border-radius:12px;margin-top:10px;">
                            ⚠️ Error al consultar historial crediticio
                        </div>
                    `;
                    resultText.innerHTML += errorHTML;
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
            
        // ===== POLÍTICAS =====
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
    
    buscando = false;
}



// ============================================================
// MOSTRAR RESULTADO XFINDER (SOLO DATOS PERSONALES)
// ============================================================
function mostrarResultadoXfinder(data) {
    const resultDiv = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    
    btnCopiar.classList.add('visible');
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
        `;
        
        resultDiv.innerHTML = html;
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

    resultDiv.innerHTML = html;
}

// ============================================================
// INICIAR APP - CORREGIDO PARA MANEJAR RECARGA
// ============================================================
async function iniciarApp() {
    // Verificar si la consola ya está visible (para evitar reiniciar en F5)
    const consoleElement = document.getElementById('consoleOutput');
    const searchContainer = document.getElementById('searchContainer');
    
    // Si ya hay contenido visible, no reiniciar
    if (consoleElement.classList.contains('oculto') === false && 
        typewriterElement.innerHTML.length > 0) {
        return;
    }
    
    // Si estamos en estado de búsqueda, no reiniciar
    if (searchContainer.classList.contains('visible')) {
        return;
    }
    
    reiniciarEstado();
    typewriterElement.textContent = 'Cargando...';
    const total = await obtenerTotalRegistros();
    
    const lines = [
        "Bienvenido a asistAI 🤖                                           ",
        "Tu asistente inteligente para búsqueda de datos.",
        "💡 Puedo ayudarte a buscar:",
        "   - Personas: ingresa un DNI (6-9 dígitos).",
        "   - Empresas: ingresa un CUIT (10 dígitos).",
        "   - Políticas: ingresa el nombre de una entidad.",
        "   - Programas: ingresa 'descargas'.",
        "",
        "Tengo un archivo con políticas de entidades cargado.",
        `Tambien una base de datos con +2M registros para busquedas por DNI.`,
        "Y un registro de empresas para búsquedas por CUIT.",
        "",
        "Mi búsqueda es inteligente.",
        "🔍 Si ingresas un número de 6-9 dígitos → busco DNI.",
        "🔢 Si ingresas 10 dígitos o más → busco CUIT de empresa.",
        "📋 Si ingresas letras → busco políticas de entidades.",
        "📥 Si ingresas 'descargas' te muestro los links de los programas que usamos"
    ];
    
    typewriterElement.innerHTML = '';
    iniciarEscritura(lines);
}

// ===== NUEVO: Verificar sesión al cargar =====
document.addEventListener('DOMContentLoaded', async function() {
    const logged = await verificarSesion();
    if (!logged) {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('loginUser').focus();
    } else {
        // Si ya está logueado, iniciar la app (pero solo si no hay búsqueda activa)
        setTimeout(() => {
            iniciarApp();
        }, 500);
    }
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

// Prevenir comportamiento por defecto de F5 (recargar)
document.addEventListener('keydown', function(e) {
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        // En lugar de recargar, limpiar la búsqueda actual
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

// ============================================================
// CHAT FLOTANTE - ASISTENTE INTELIGENTE
// ============================================================

// ============================================================
// BASE DE DATOS DE LÍNEAS ENTRANTES
// ============================================================

const LINEAS_ENTRANTES = [
    '1152633965',
    '1152639134',
    '1170780169',
    '1152637012',
    '1152630447',
    '1152633093'
];

// ============================================================
// BASE DE CONOCIMIENTO
// ============================================================

const conocimientosIA = {
    saludos: ['hola', 'buenas', 'que tal', 'hey', 'hello', 'buen día', 'buenas tardes', 'buenas noches', 'holi', 'holis', 'que onda', 'alo'],
    despedidas: ['chau', 'adiós', 'hasta luego', 'nos vemos', 'bye', 'gracias', 'muchas gracias', 'gracias!', 'chao', 'me voy'],
    ayuda: ['ayuda', 'help', 'como se usa', 'que podes hacer', 'funciones', 'comandos', 'que sabes hacer', 'que haces', 'servicios'],
    presentacion: ['quien sos', 'quien eres', 'que sos', 'presentate', 'presentación'],
    lineas: ['lineas entrantes', 'líneas entrantes', 'cuales son las lineas', 'cuales son las líneas', 'que lineas', 'listado de lineas', 'lista de lineas', 'mostrar lineas', 'ver lineas', 'entrantes', 'lineas disponibles', 'líneas disponibles']
};

// ============================================================
// RESPUESTAS
// ============================================================

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

// ============================================================
// MEMORIA
// ============================================================

let memoriaChat = {
    ultimoDNI: null,
    ultimoGenero: null,
    generoPreferido: null,
    mensajes: [],
    conversaciones: 0
};

// ============================================================
// FUNCIONES DEL CHAT
// ============================================================

function toggleChat() {
    const window = document.getElementById('chatWindow');
    const toggle = document.getElementById('chatToggle');
    if (window.style.display === 'none') {
        window.style.display = 'flex';
        toggle.textContent = '✕';
        setTimeout(() => document.getElementById('chatInput').focus(), 300);
    } else {
        window.style.display = 'none';
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

// ============================================================
// FUNCIÓN: MOSTRAR LÍNEAS ENTRANTES
// ============================================================

function mostrarLineasEntrantes() {
    let respuesta = `📞 <strong>LÍNEAS ENTRANTES</strong><br><br>`;
    respuesta += `📋 <strong>Total:</strong> ${LINEAS_ENTRANTES.length} líneas<br><br>`;
    respuesta += `<div style="background:#1a1a2e;border-radius:8px;padding:12px;">`;
    
    LINEAS_ENTRANTES.forEach((linea, index) => {
        respuesta += `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2d2d4a;">`;
        respuesta += `<span style="color:#a78bfa;">${index + 1}.</span>`;
        respuesta += `<span style="color:#fbbf24;font-weight:bold;">${linea}</span>`;
        respuesta += `<span style="color:#34d399;font-size:12px;">✅ Activa</span>`;
        respuesta += `</div>`;
    });
    
    respuesta += `</div>`;
    respuesta += `<br><span style="font-size:11px;color:#8a7ea0;">💡 ¿Querés generar un CUIL? Decime tu DNI.</span>`;
    
    return respuesta;
}

// ============================================================
// FUNCIÓN: GENERAR CUIL
// ============================================================

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

// ============================================================
// EXTRACCIÓN DE DATOS
// ============================================================

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

// ============================================================
// PROCESAMIENTO DEL CHAT
// ============================================================

function procesarChat(mensaje) {
    const texto = mensaje.toLowerCase().trim();
    const dni = extraerDNI(mensaje);
    const sexo = extraerSexo(mensaje);
    
    // 1. PRESENTACIÓN
    if (conocimientosIA.presentacion.some(p => texto.includes(p))) {
        return obtenerRespuestaAleatoria(respuestasIA.presentacion);
    }
    
    // 2. SALUDO
    if (conocimientosIA.saludos.some(p => texto.includes(p))) {
        const saludo = obtenerRespuestaAleatoria(respuestasIA.saludo);
        if (memoriaChat.ultimoDNI) {
            return saludo + `<br><br>📝 Recuerdo tu último DNI: <strong>${memoriaChat.ultimoDNI}</strong>. ¿Queres generar otro CUIL o ver las líneas entrantes?`;
        }
        return saludo;
    }
    
    // 3. DESPEDIDA
    if (conocimientosIA.despedidas.some(p => texto.includes(p))) {
        return obtenerRespuestaAleatoria(respuestasIA.despedida);
    }
    
    // 4. AYUDA
    if (conocimientosIA.ayuda.some(p => texto.includes(p))) {
        return obtenerRespuestaAleatoria(respuestasIA.ayuda);
    }
    
    // 5. MOSTRAR LÍNEAS ENTRANTES
    if (conocimientosIA.lineas.some(p => texto.includes(p))) {
        return mostrarLineasEntrantes();
    }
    
    // 6. RECORDAR GÉNERO (sin DNI)
    if (sexo && !dni) {
        memoriaChat.generoPreferido = sexo;
        const generoTexto = sexo === 'F' ? 'femenino' : 'masculino';
        return `✅ ¡Entendido! Usaré género <strong>${generoTexto}</strong> para futuros CUIL. 😊<br><br>📌 Ahora decime un DNI (6-9 dígitos) para generar tu CUIL.`;
    }
    
    // 7. GENERAR CUIL (si hay DNI)
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
    
    // 8. RESPUESTA POR DEFECTO
    return obtenerRespuestaAleatoria(respuestasIA.default);
}

// ============================================================
// ENVIAR MENSAJE
// ============================================================

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

// ============================================================
// ENVIAR CON ENTER
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    iniciarChat();
    
    const input = document.getElementById('chatInput');
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarChat();
        }
    });
});

// ============================================================
// INICIALIZAR CHAT
// ============================================================

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
