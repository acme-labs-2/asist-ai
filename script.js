// ============================================================
// FUNCIONES DE BÚSQUEDA
// ============================================================
const API_URL = 'https://carover0.xyz/api/xfinder.php';
const POL_API_URL = 'https://carover0.xyz/api/pol.php';
let ultimoResultado = '';

// ============================================================
// OBTENER TOTAL DE REGISTROS DESDE LA API
// ============================================================
async function obtenerTotalRegistros() {
    try {
        const response = await fetch(`${API_URL}?stats=true&_=${Date.now()}`);
        if (response.ok) {
            const data = await response.json();
            if (data.total) {
                return Number(data.total).toLocaleString('es-AR');
            }
        }
    } catch (e) {
        console.log('Error al obtener total:', e);
    }
    return '2,219,227';
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
// FUNCION PARA MOSTRAR POLITICAS
// ============================================================
function mostrarPoliticas(resultados, termino) {
    const resultDiv = document.getElementById('resultText');
    const btnCopiar = document.getElementById('btnCopiar');
    
    btnCopiar.classList.add('visible');
    
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
            <div class="badge" style="background:rgba(160,68,255,0.2);border:1px solid var(--violet);padding:4px 14px;border-radius:20px;font-size:11px;color:var(--violet-soft);text-transform:uppercase;letter-spacing:1px;">
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
// MOSTRAR RESULTADO MODERNO CON WHATSAPP Y TELEGRAM
// ============================================================
function mostrarResultado(data) {
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

        <div class="origen">
            <span>📌 Fuente: ${data.origen || '---'}</span>
            <span>📅 Fecha del dato: ${data.timestamp || '---'}</span>
        </div>
    `;

    resultDiv.innerHTML = html;
    ultimoResultado = construirTextoPlano(data);
}

// ============================================================
// CONSTRUIR TEXTO PLANO PARA COPIAR
// ============================================================
function construirTextoPlano(data) {
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

    return `🔍 INFORME DNI ${data.dni || '---'}\n` +
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
           `  Email: ${emails}\n\n` +
           `📌 ORIGEN\n` +
           `  Fecha: ${data.timestamp || '---'}\n` +
           `  Proveedor: ${data.origen || '---'}`;
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
    
    // Resetear cursor y typewriter
    cursorElement.style.display = 'block';
    typewriterElement.innerHTML = '';
    
    // Resetear último resultado
    ultimoResultado = '';
}

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
        const esNumero = /^\d+$/.test(query);
        
        if (esNumero) {
            if (query.length < 6) {
                resultText.innerHTML = `<div class="error">⚠️ Ingrese un DNI válido (mínimo 6 dígitos).</div>`;
                return;
            }
            
            const response = await fetch(`${API_URL}?dni=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                resultText.innerHTML = `<div class="error">❌ ${data.error}</div>`;
            } else {
                mostrarResultado(data);
            }
        } else {
            const resultados = await buscarPoliticasAPI(query);
            
            if (resultados.error) {
                resultText.innerHTML = `<div class="error">❌ ${resultados.error}</div>`;
            } else if (resultados.length === 0) {
                resultText.innerHTML = `<div class="error">❌ No se encontraron políticas para "${query}"</div>`;
            } else {
                mostrarPoliticas(resultados, query);
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
    
    const total = await obtenerTotalRegistros();
    
    const lines = [
        "Bienvenido a asistAI 🤖                                           ",
        "Tu asistente inteligente para búsqueda de datos.",
        "💡 Puedo ayudarte a buscar:",
	"   - datos de personas.",
	"   - políticas de entidades con las que trabajamos.",
        "",
        "Tengo un archivo con políticas de entidades cargado.",
        `Tambien una base de datos con +2M de registros para busquedas por DNI.`,
        "",
        "Mi búsqueda es inteligente.",
        "🔍 Si ingresas un número → busco DNI en la base de datos.",
        "📋 Si ingresas letras → busco políticas de entidades."
    ];
    
    typewriterElement.innerHTML = '';
    iniciarEscritura(lines);
});
