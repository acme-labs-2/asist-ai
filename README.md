Sí. El README anterior quedó desactualizado principalmente porque ahora **Assist-AI tiene una tercera API (`crediticia.php`)**, cálculo de morosidad, detalle de deudas, comando de descargas y el acceso preparado para un futuro chat con IA. También cambió la lógica de detección de consultas.

Tomando como base tu `script.js` actualizado —incluyendo las tres APIs y las nuevas funciones— , te dejo el README completo listo para GitHub.

# Assist-AI 🤖

Interfaz web de asistencia y consulta desarrollada en **HTML, CSS y JavaScript vanilla**.

Assist-AI funciona como un **frontend estático** que centraliza diferentes herramientas de consulta desde una única interfaz:

* 🔍 Consulta de personas mediante DNI.
* 📊 Consulta de información crediticia y cálculo de nivel de morosidad.
* 📋 Consulta de políticas de entidades.
* 📥 Acceso a programas de descarga utilizados por el equipo.
* 📋 Copiado de resultados en texto plano.
* 📱 Enlaces directos a WhatsApp y Telegram.
* 🤖 Interfaz preparada para incorporar un chat con IA.

La aplicación no utiliza frameworks ni dependencias de Node.js.

---

# 1. Arquitectura

Assist-AI está compuesto por un frontend estático que se comunica directamente con APIs externas mediante `fetch()`.

```text
┌─────────────────────────────────────────────────────┐
│                    NAVEGADOR                         │
│                                                     │
│  index.html                                         │
│      │                                              │
│      ├── styles.css                                 │
│      │                                              │
│      └── script.js                                  │
│              │                                      │
└──────────────┼──────────────────────────────────────┘
               │
               │ HTTPS / fetch()
               │
       ┌───────┼───────────────┬───────────────┐
       │       │               │               │
       ▼       ▼               ▼               ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
│ xfinder  │ │   pol    │ │  crediticia  │ │  downloads   │
│   .php   │ │   .php   │ │     .php     │ │              │
├──────────┤ ├──────────┤ ├──────────────┤ ├──────────────┤
│ Personas │ │Políticas │ │ Información  │ │ Programas    │
│ por DNI  │ │entidades │ │ crediticia   │ │ descargables │
└──────────┘ └──────────┘ └──────────────┘ └──────────────┘
```

El frontend no contiene directamente la base de datos.

Las consultas se realizan mediante endpoints HTTP y los resultados son procesados y renderizados en el navegador.

---

# 2. Estructura del proyecto

```text
Assist-AI/
│
├── index.html
├── styles.css
├── script.js
│
└── assets/
    ├── f10.png
    ├── f12.png
    ├── f13.png
    ├── ai.png
    ├── w.png
    └── t.png
```

---

# 3. Archivos principales

## `index.html`

Contiene la estructura HTML de la aplicación.

Incluye:

* Panel principal.
* Consola inicial.
* Campo de búsqueda.
* Botón de consulta.
* Botón de copia.
* Contenedor de resultados.
* Referencias a CSS y JavaScript.

La estructura no contiene la lógica principal de las consultas.

Ejemplo:

```html
<input
    type="text"
    id="dniInput"
    placeholder="Ej: 34340714 o Creditia"
    maxlength="50"
>
```

El usuario puede introducir:

```text
34340714
Creditia
descargas
```

---

## `styles.css`

Contiene la presentación visual de Assist-AI.

Incluye:

* Tema oscuro.
* Estética de consola.
* Bordes violetas/neón.
* Panel principal con geometría recortada.
* Animaciones.
* Estados de carga.
* Tarjetas de resultados.
* Indicadores de riesgo.
* Responsive design.
* Adaptación para dispositivos móviles.

La tipografía principal es:

```text
Lucida Console
Monaco
monospace
```

Los colores principales se encuentran centralizados en `:root`.

```css
:root {
    --violet: #4f46e5;
    --violet-soft: #818cf8;
    --violet-neon: #4338ca;
    --green: #31db72;
    --red: #ff756f;
    --gold: #ffb530;
}
```

---

## `script.js`

Contiene toda la lógica de funcionamiento de Assist-AI.

Entre sus responsabilidades se encuentran:

* Comunicación con APIs.
* Detección automática del tipo de consulta.
* Consulta por DNI.
* Consulta crediticia.
* Cálculo de morosidad.
* Consulta de políticas.
* Detección del comando de descargas.
* Renderizado dinámico.
* Animación inicial.
* Estados de carga.
* Copiado de resultados.
* Generación de enlaces WhatsApp.
* Generación de enlaces Telegram.
* Manejo de errores.
* Preparación del futuro chat con IA.

---

# 4. APIs utilizadas

Actualmente Assist-AI utiliza tres endpoints principales.

## API de personas

```javascript
const API_URL = 'https://carover0.xyz/api/xfinder.php';
```

Consulta por DNI:

```text
GET /api/xfinder.php?dni=34340714
```

Consulta de estadísticas:

```text
GET /api/xfinder.php?stats=true
```

La consulta de estadísticas se utiliza durante la inicialización de la aplicación.

La API devuelve un objeto JSON.

Ejemplo conceptual:

```json
{
    "dni": "34340714",
    "nombre": "NOMBRE APELLIDO",
    "domicilio": "DOMICILIO",
    "localidad": "LOCALIDAD",
    "provincia": "PROVINCIA",
    "empleador": "EMPRESA",
    "cuit": "20123456789",
    "empleados": "10",
    "celular1": "1123456789",
    "celular2": "1198765432",
    "fijo1": "1144444444",
    "fijo2": "-",
    "email": "correo@example.com",
    "email2": "",
    "email3": "",
    "origen": "FUENTE",
    "timestamp": "2026-08-07"
}
```

También puede devolver un registro marcado como fallecido:

```json
{
    "fallecido": true,
    "dni": "34340714",
    "nombre": "NOMBRE APELLIDO",
    "domicilio": "DOMICILIO",
    "localidad": "LOCALIDAD",
    "provincia": "PROVINCIA"
}
```

o un error:

```json
{
    "error": "Mensaje de error"
}
```

---

# 5. API de información crediticia

Endpoint:

```javascript
const CREDIT_API_URL = 'https://carover0.xyz/api/crediticia.php';
```

Consulta:

```text
GET /api/crediticia.php?dni=34340714
```

Esta API se consulta automáticamente después de obtener los datos personales de un DNI.

La consulta crediticia solamente se realiza cuando el registro no está marcado como fallecido.

```javascript
if (!data.fallecido) {
    // consulta crediticia
}
```

La respuesta esperada es una lista de registros de deuda.

Ejemplo conceptual:

```json
[
    {
        "Entidad": "ENTIDAD",
        "Periodo": "2026-01",
        "Monto": "50000",
        "Situacion": "4",
        "SituacionDesc": "Situación de riesgo"
    }
]
```

Si la consulta crediticia produce un error, la información crediticia se ignora y se muestran igualmente los datos principales de la persona.

---

# 6. API de políticas

Endpoint:

```javascript
const POL_API_URL = 'https://carover0.xyz/api/pol.php';
```

Consulta:

```text
GET /api/pol.php?q=Creditia
```

El término introducido por el usuario se codifica mediante:

```javascript
encodeURIComponent(termino)
```

La respuesta esperada es un array JSON.

Ejemplo:

```json
[
    {
        "nombre": "Creditia",
        "lugardepago": "Banco / transferencia",
        "reasignacion": "Sí",
        "cobrodemas": "No",
        "certificado": "Disponible",
        "obs": "Observaciones adicionales",
        "pagina": "https://ejemplo.com"
    }
]
```

Si no existen resultados:

```json
[]
```

---

# 7. Sistema de búsqueda inteligente

Assist-AI utiliza una única caja de búsqueda.

La función:

```javascript
detectarComando(query)
```

determina qué operación debe ejecutarse.

```text
                         ENTRADA
                            │
                            ▼
                    detectarComando()
                            │
             ┌──────────────┼───────────────┐
             │              │               │
             ▼              ▼               ▼
        DESCARGAS          DNI          POLÍTICAS
             │              │               │
             ▼              ▼               ▼
        Programas       xfinder.php       pol.php
                            │
                            ▼
                       crediticia.php
```

---

# 8. Consulta por DNI

Si la entrada contiene exclusivamente números:

```text
34340714
```

se considera una consulta de DNI.

La expresión utilizada es:

```javascript
/^\d+$/
```

El DNI debe tener como mínimo 6 dígitos.

Ejemplo:

```text
34340714 → DNI válido
123456   → DNI válido
12345    → DNI demasiado corto
```

El flujo es:

```text
Usuario
   │
   ▼
34340714
   │
   ▼
detectarComando()
   │
   ▼
xfinder.php
   │
   ▼
Datos personales
   │
   ▼
crediticia.php
   │
   ▼
Datos crediticios
   │
   ▼
Cálculo de morosidad
   │
   ▼
Renderizado final
```

---

# 9. Consulta de información crediticia

Cuando se obtiene un registro normal de una persona, Assist-AI intenta consultar automáticamente la API crediticia.

```javascript
const creditResponse =
    await fetch(`${CREDIT_API_URL}?dni=${encodeURIComponent(comando.valor)}`);
```

La información crediticia se incorpora al resultado principal.

El usuario puede visualizar:

```text
📊 NIVEL DE MOROSIDAD

Estado
Porcentaje
Deudas normales
En riesgo
Irrecuperables
Monto total
```

y:

```text
💳 DETALLE DE DEUDAS
```

con información individual de cada registro.

---

# 10. Cálculo del nivel de morosidad

La función:

```javascript
calcularMorosidad(deudas)
```

clasifica las deudas según el campo:

```javascript
deuda.Situacion
```

Actualmente se contemplan:

```text
Situación 1 → Normal
Situación 4 → Alto riesgo
Situación 5 → Irrecuperable
```

El cálculo utiliza un sistema de ponderación:

```text
Normal          = 0 puntos
Alto riesgo     = 2 puntos
Irrecuperable   = 3 puntos
```

El puntaje se calcula mediante:

```javascript
puntaje =
    (deudasIrrecuperables * 3) +
    (deudasRiesgo * 2);
```

El máximo posible es:

```javascript
maxPuntaje = totalDeudas * 3;
```

El porcentaje resultante se calcula como:

```javascript
porcentaje =
    Math.round((puntaje / maxPuntaje) * 100);
```

---

# 11. Clasificación de morosidad

El resultado se divide en cuatro niveles.

| Porcentaje | Nivel | Estado             |
| ---------: | ----: | ------------------ |
|         0% |     0 | 💚 Sin morosidad   |
|   1% – 33% |     1 | 🟡 Morosidad baja  |
|  34% – 66% |     2 | 🟠 Morosidad media |
| 67% – 100% |     3 | 🔴 Morosidad alta  |

La interfaz representa el resultado mediante una barra de progreso.

Ejemplo conceptual:

```text
Bajo riesgo                         Alto riesgo
     │                                  │
     ├───────────────██████─────────────┤
                     42%
```

También se muestran estadísticas:

```text
Normales
En riesgo
Irrecuperables
Total de deudas
Monto total
```

---

# 12. Detalle de deudas

La función:

```javascript
mostrarDeudas(deudas)
```

genera una sección con los registros individuales.

Cada deuda puede mostrar:

```text
Entidad
Periodo
Monto
Estado
Descripción
```

Ejemplo:

```text
💳 DETALLE DE DEUDAS

ENTIDAD A                         Alto riesgo
2026-01                           $50.000
Situación de riesgo

ENTIDAD B                         Irrecuperable
2025-12                           $120.000
Situación irrecuperable
```

---

# 13. Registros de personas fallecidas

La API de personas puede devolver:

```javascript
data.fallecido
```

Cuando el valor es verdadero, Assist-AI utiliza un diseño específico.

Se muestra:

```text
⚠️ DNI
✝ FALLECIDO
```

y los datos personales disponibles.

También se muestra:

```text
⚠️ ESTA PERSONA SE ENCUENTRA FALLECIDA
```

En este caso no se consulta la API crediticia.

El resultado contiene:

```text
Nombre
DNI
Domicilio
Localidad
Provincia
Origen
Fecha
```

---

# 14. Consulta de políticas

Si la entrada contiene texto y no corresponde a un comando especial ni a un DNI:

```text
Creditia
```

se ejecuta:

```javascript
buscarPoliticasAPI(query)
```

que realiza:

```text
GET /api/pol.php?q=Creditia
```

La interfaz muestra:

```text
📋 POLÍTICAS: CREDITIA

🏢 Creditia

Lugar de pago
Reasignación
Cobro de más
Certificado
Observaciones
Página
```

La búsqueda requiere como mínimo 2 caracteres.

---

# 15. Comando de descargas

Assist-AI incorpora un comando especial para mostrar los programas utilizados por el equipo.

Se activa mediante palabras relacionadas con:

```text
descarga
descargas
programa
programas
software
apps
aplicaciones
download
anydesk
collector
zoiper
```

Por ejemplo:

```text
descargas
```

o:

```text
AnyDesk
```

activan el panel de programas.

---

# 16. Programas disponibles

Actualmente el panel de descargas contempla:

| Programa     | Archivo         | Descripción           |
| ------------ | --------------- | --------------------- |
| 📦 WinRAR    | `winrar.exe`    | Compresor de archivos |
| 🖥️ AnyDesk  | `anydesk.rar`   | Escritorio remoto     |
| 📊 Collector | `collector.rar` | CRM                   |
| 📞 Zoiper    | `zoiper.rar`    | Cliente VoIP          |

Los archivos se sirven desde:

```text
https://carover0.xyz/downloads/
```

Ejemplo:

```text
https://carover0.xyz/downloads/winrar.exe
```

La interfaz también muestra un orden recomendado de instalación.

---

# 17. Fondos dinámicos

Assist-AI utiliza diferentes fondos según el estado de la aplicación.

## Fondo inicial

```text
assets/f13.png
```

## Fondo de búsqueda

```text
assets/f12.png
```

## Fondo de descargas

```text
assets/f10.png
```

La función responsable de cambiar el fondo es:

```javascript
cambiarFondo(imagen)
```

Ejemplo:

```javascript
cambiarFondo('f10.png');
```

---

# 18. Consola inicial

Al cargar la aplicación aparece una consola animada.

El texto se escribe carácter por carácter mediante:

```javascript
iniciarEscritura(lines)
```

Actualmente informa al usuario sobre las funciones disponibles.

Conceptualmente:

```text
Bienvenido a asistAI 🤖
Tu asistente inteligente para búsqueda de datos.

💡 Puedo ayudarte a buscar:
   - datos de personas con su historial crediticio.
   - políticas de entidades con las que trabajamos.
   - programas de descarga.

Tengo un archivo con políticas de entidades cargado.
También una base de datos con +2M registros para búsquedas por DNI.

Mi búsqueda es inteligente.

🔍 Si ingresas un número → busco DNI en la base de datos.
📋 Si ingresas letras → busco políticas de entidades.
📥 Si ingresas 'descargas' te muestro los links de los programas que usamos.
```

El número total de registros de la API se obtiene antes de mostrar la consola.

---

# 19. Estadísticas de la base de datos

Durante la inicialización se consulta:

```text
/api/xfinder.php?stats=true
```

La función utilizada es:

```javascript
obtenerTotalRegistros()
```

La respuesta esperada:

```json
{
    "total": 2219227
}
```

El número se convierte mediante:

```javascript
Number(data.total).toLocaleString('es-AR')
```

El resultado se almacena temporalmente en:

```javascript
let totalRegistros = 'Cargando...';
```

La función utiliza cache en memoria para evitar consultas repetidas durante la misma ejecución.

---

# 20. Chat con IA

La interfaz incluye actualmente un acceso visual preparado para un futuro chat con IA.

Durante la inicialización se reemplaza la línea:

```text
🤖 [  CHAT CON IA  ]
```

por un pequeño botón con:

```text
assets/ai.png
```

La función utilizada es:

```javascript
agregarBotonChatMini()
```

Actualmente el botón ejecuta:

```javascript
abrirChatIA()
```

que muestra:

```text
🤖 Próximamente: Chat con IA en vivo!
```

La funcionalidad de chat todavía no está implementada.

---

# 21. Enlaces de contacto

Los números celulares detectados en los resultados se convierten automáticamente en enlaces.

## WhatsApp

La función:

```javascript
whatsappLink(numero)
```

normaliza el número eliminando caracteres no numéricos:

```javascript
numero.replace(/\D/g, '')
```

Si el número no comienza con:

```text
54
```

se agrega automáticamente.

Ejemplo:

```text
11-1234-5678
```

se transforma en:

```text
541112345678
```

y genera:

```text
https://wa.me/541112345678
```

---

## Telegram

La función:

```javascript
telegramLink(numero)
```

utiliza la misma normalización.

El enlace generado tiene el formato:

```text
https://t.me/+541112345678
```

Los iconos utilizados son:

```text
assets/w.png
assets/t.png
```

---

# 22. Copiado de resultados

El botón:

```text
📋 COPIAR
```

permanece oculto hasta que existe un resultado disponible.

Los resultados se almacenan en:

```javascript
let ultimoResultado = '';
```

La copia principal utiliza:

```javascript
navigator.clipboard.writeText(ultimoResultado)
```

Si Clipboard API no está disponible, se utiliza un método alternativo mediante:

```javascript
document.execCommand('copy')
```

Después de copiar, el botón cambia temporalmente a:

```text
✅ COPIADO
```

y vuelve automáticamente a:

```text
📋 COPIAR
```

después de 3 segundos.

---

# 23. Texto plano

Assist-AI convierte los resultados visuales en texto estructurado para facilitar su copia.

La función principal es:

```javascript
construirTextoPlano(data, creditData)
```

Un resultado puede incluir:

```text
🔍 INFORME DNI 34340714
────────────────────────────────────────

👤 DATOS PERSONALES
  Nombre: NOMBRE APELLIDO
  DNI: 34340714
  Domicilio: DOMICILIO
  Localidad: LOCALIDAD
  Provincia: PROVINCIA

💼 DATOS LABORALES
  Empleador: EMPRESA
  CUIT: 20123456789
  Empleados: 10

📱 CONTACTO
  Celular 1: 1112345678
  Celular 2: -
  Fijo 1: -
  Fijo 2: -
  Email: correo@example.com

📊 NIVEL DE MOROSIDAD
  Estado: 🟠 Morosidad media
  Porcentaje: 42%
  Deudas normales: 1
  En riesgo: 2
  Irrecuperables: 1
  Monto total: $250.000

💳 DETALLE DE DEUDAS
  1. ENTIDAD
     Periodo: 2026-01
     Monto: $50.000
     Estado: Alto riesgo

📌 ORIGEN
  Fecha: 2026-08-07
  Proveedor: FUENTE
```

---

# 24. Manejo de errores

La aplicación contempla diferentes tipos de error.

## Entrada vacía

```text
⚠️ Ingrese un DNI (mínimo 6 dígitos) o nombre de entidad
(mínimo 2 letras).
```

## DNI demasiado corto

```text
⚠️ Ingrese un DNI válido (mínimo 6 dígitos).
```

## Sin políticas

```text
❌ No se encontraron políticas para "Creditia"
```

## Error HTTP

Si una API responde con un estado diferente de `2xx`:

```javascript
if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
}
```

## Error general

Si ocurre una excepción:

```text
❌ Error al consultar la base de datos
```

y se muestra debajo el mensaje técnico correspondiente.

---

# 25. Estados de carga

Durante una consulta se muestra un indicador visual.

```text
🟪 🟪 ⬛ ⬛ 🟪

Buscando...
```

Los bloques utilizan animaciones CSS para indicar que la consulta se encuentra en proceso.

Las animaciones utilizadas son:

```css
pulseBox
dots
fadeIn
blink
```

---

# 26. Preparación de búsqueda

Al ejecutar una consulta se utiliza:

```javascript
prepararBusqueda()
```

Esta función:

1. Oculta la consola inicial.
2. Mueve el buscador hacia arriba.
3. Cambia el fondo de la interfaz.

Se aplican las clases:

```javascript
consoleElement.classList.add('oculto');
searchContainer.classList.add('arriba');
document.body.classList.add('fondo-busqueda');
```

---

# 27. Reinicio del estado

La función:

```javascript
reiniciarEstado()
```

restablece el estado visual de la aplicación.

Se utiliza al cargar la página.

Restablece:

* Campo de búsqueda.
* Resultados.
* Botón de copia.
* Consola.
* Cursor.
* Animación inicial.
* Fondo.
* Resultado almacenado.

El fondo inicial vuelve a:

```text
assets/f13.png
```

---

# 28. Responsive design

La aplicación posee un breakpoint principal:

```css
@media (max-width:700px)
```

En dispositivos móviles:

* El panel ocupa prácticamente todo el ancho.
* El campo de búsqueda ocupa todo el ancho.
* Los botones pasan a disposición vertical.
* Los resultados cambian de estructura horizontal a vertical.
* Se reducen los tamaños tipográficos.
* El encabezado de los resultados se centra.

La interfaz está diseñada para utilizarse tanto desde escritorio como desde dispositivos móviles.

---

# 29. Dependencias

Assist-AI no utiliza frameworks externos.

No requiere:

```text
Node.js
npm
React
Vue
Angular
jQuery
Bootstrap
```

Utiliza exclusivamente:

```text
HTML5
CSS3
JavaScript
Fetch API
Clipboard API
```

No existe un proceso de compilación.

---

# 30. Requisitos del servidor

El frontend puede alojarse en cualquier servidor capaz de servir archivos estáticos.

Por ejemplo:

```text
Nginx
Apache
GitHub Pages
GitLab Pages
Cloudflare Pages
Servidor HTTP simple
```

La estructura publicada debe conservar:

```text
index.html
styles.css
script.js
assets/
```

Las APIs utilizadas por el frontend deben estar disponibles mediante HTTPS.

---

# 31. Ejecución local

Puede utilizarse cualquier servidor HTTP estático.

Por ejemplo, con Python:

```bash
python3 -m http.server 8080
```

Luego abrir:

```text
http://localhost:8080
```

No se recomienda abrir directamente:

```text
file:///ruta/index.html
```

porque algunas funcionalidades del navegador y las políticas CORS pueden comportarse de forma diferente bajo `file://`.

---

# 32. CORS

Como Assist-AI realiza solicitudes desde el navegador hacia:

```text
https://carover0.xyz
```

los endpoints deben permitir solicitudes desde el dominio donde esté alojado el frontend.

Ejemplo conceptual:

```http
Access-Control-Allow-Origin: https://dominio-del-frontend.example
```

Para desarrollo puede utilizarse:

```http
Access-Control-Allow-Origin: *
```

En producción es preferible restringir el origen al dominio autorizado.

---

# 33. Seguridad

El frontend no contiene credenciales privadas ni tokens de autenticación.

Las URLs de las APIs son visibles porque forman parte del código JavaScript ejecutado por el navegador:

```javascript
const API_URL = 'https://carover0.xyz/api/xfinder.php';
const POL_API_URL = 'https://carover0.xyz/api/pol.php';
const CREDIT_API_URL = 'https://carover0.xyz/api/crediticia.php';
```

Por este motivo:

> Todo dato que el navegador necesita para realizar una consulta debe considerarse públicamente observable.

Si en el futuro las APIs requieren autenticación, las credenciales no deben incorporarse directamente en `script.js`.

La autenticación debería gestionarse mediante un backend intermedio o mediante mecanismos específicamente diseñados para clientes públicos.

---

# 34. Flujo completo de una consulta por DNI

Ejemplo:

```text
Usuario
   │
   │ 34340714
   ▼
buscarDNI()
   │
   ▼
detectarComando()
   │
   ▼
¿Es DNI?
   │
   ▼
xfinder.php
   │
   ▼
JSON
   │
   ├── Datos personales
   ├── Datos laborales
   ├── Contacto
   └── Estado
   │
   ▼
¿Está fallecido?
   │
   ├── SÍ ──► Mostrar registro fallecido
   │
   └── NO
        │
        ▼
   crediticia.php
        │
        ▼
   Registros de deuda
        │
        ▼
   calcularMorosidad()
        │
        ├── Nivel
        ├── Porcentaje
        ├── Estadísticas
        └── Monto total
        │
        ▼
   mostrarResultado()
        │
        ▼
   construirTextoPlano()
        │
        ▼
   📋 COPIAR
```

---

# 35. Flujo de búsqueda de entidad

Ejemplo:

```text
Usuario
   │
   │ Creditia
   ▼
buscarDNI()
   │
   ▼
detectarComando()
   │
   ▼
¿Es texto?
   │
   ▼
buscarPoliticasAPI()
   │
   ▼
GET /api/pol.php?q=Creditia
   │
   ▼
JSON[]
   │
   ▼
mostrarPoliticas()
   │
   ├── Entidad
   ├── Lugar de pago
   ├── Reasignación
   ├── Cobro de más
   ├── Certificado
   ├── Observaciones
   └── Página
   │
   ▼
ultimoResultado
   │
   ▼
📋 COPIAR
```

---

# 36. Flujo del comando de descargas

Ejemplo:

```text
Usuario
   │
   │ descargas
   ▼
buscarDNI()
   │
   ▼
detectarComando()
   │
   ▼
tipo = descargas
   │
   ▼
mostrarDescargas()
   │
   ├── WinRAR
   ├── AnyDesk
   ├── Collector
   └── Zoiper
   │
   ▼
Links de descarga
   │
   ▼
ultimoResultado
   │
   ▼
📋 COPIAR
```

---

# 37. Funciones principales de `script.js`

| Función                   | Responsabilidad                     |
| ------------------------- | ----------------------------------- |
| `obtenerTotalRegistros()` | Obtiene estadísticas de la API      |
| `buscarPoliticasAPI()`    | Consulta políticas de entidades     |
| `buscarCrediticiaAPI()`   | Consulta información crediticia     |
| `calcularMorosidad()`     | Calcula el nivel de morosidad       |
| `mostrarMorosidad()`      | Renderiza el indicador de morosidad |
| `mostrarDeudas()`         | Renderiza el detalle de deudas      |
| `mostrarDescargas()`      | Renderiza los programas disponibles |
| `mostrarPoliticas()`      | Renderiza políticas                 |
| `iniciarEscritura()`      | Ejecuta la animación inicial        |
| `agregarBotonChatMini()`  | Inserta el acceso al futuro chat    |
| `abrirChatIA()`           | Punto de entrada del futuro chat IA |
| `mostrarResultado()`      | Renderiza resultados de personas    |
| `construirTextoPlano()`   | Genera texto para copiar            |
| `copiarResultado()`       | Copia información al portapapeles   |
| `prepararBusqueda()`      | Cambia la interfaz al modo búsqueda |
| `reiniciarEstado()`       | Restablece el estado inicial        |
| `detectarComando()`       | Determina el tipo de consulta       |
| `buscarDNI()`             | Controlador principal de búsqueda   |

---

# 38. Variables principales

## URLs de API

```javascript
const API_URL
const POL_API_URL
const CREDIT_API_URL
```

Definen los endpoints utilizados por el frontend.

---

## Resultado actual

```javascript
let ultimoResultado = '';
```

Contiene el último resultado convertido a texto plano.

---

## Total de registros

```javascript
let totalRegistros = 'Cargando...';
```

Almacena temporalmente el número de registros obtenido desde la API.

---

# 39. Personalización

## Cambiar API de personas

Modificar:

```javascript
const API_URL =
    'https://carover0.xyz/api/xfinder.php';
```

## Cambiar API de políticas

Modificar:

```javascript
const POL_API_URL =
    'https://carover0.xyz/api/pol.php';
```

## Cambiar API crediticia

Modificar:

```javascript
const CREDIT_API_URL =
    'https://carover0.xyz/api/crediticia.php';
```

## Cambiar colores

Modificar las variables de `:root`:

```css
:root {
    --violet: #4f46e5;
    --violet-soft: #818cf8;
    --violet-neon: #4338ca;
    --green: #31db72;
    --red: #ff756f;
    --gold: #ffb530;
}
```

## Cambiar fondo inicial

Modificar:

```css
background:
    #020105 url("assets/f13.png")
    center top/cover fixed no-repeat;
```

## Cambiar fondo de búsqueda

Modificar:

```css
body.fondo-busqueda {
    background-image: url("assets/f12.png");
}
```

El fondo de descargas se cambia desde JavaScript:

```javascript
cambiarFondo('f10.png');
```

---

# 40. Consideraciones técnicas

## Detección de comandos

La lógica actual sigue este orden:

```text
1. Comando de descargas
2. DNI numérico
3. Búsqueda de políticas
4. Error
```

Por lo tanto:

```text
descargas      → Programas
AnyDesk        → Programas
34340714       → DNI
Creditia       → Políticas
creditia 2026  → Políticas
ABC123         → Políticas
```

---

## Validación de DNI

La validación actual comprueba:

```text
Solo números
Mínimo 6 dígitos
```

No realiza una validación adicional sobre la estructura o existencia del DNI.

---

## Normalización telefónica

Los teléfonos se normalizan eliminando caracteres no numéricos:

```javascript
numero.replace(/\D/g, '')
```

Esto permite procesar formatos como:

```text
11-1234-5678
11 1234 5678
+54 11 1234-5678
```

La implementación es deliberadamente simple y no constituye una validación completa de numeración telefónica argentina.

---

# 41. Estado actual del proyecto

Assist-AI funciona actualmente como una interfaz unificada para diferentes consultas y herramientas internas.

Características principales:

```text
✓ Frontend estático
✓ HTML / CSS / JavaScript vanilla
✓ Una única caja de búsqueda
✓ Detección automática de comandos
✓ Consulta por DNI
✓ Consulta de información crediticia
✓ Cálculo de nivel de morosidad
✓ Detalle de deudas
✓ Consulta de políticas
✓ Comando de descargas
✓ Links de programas
✓ Renderizado dinámico
✓ Consola animada
✓ Indicador de carga
✓ Copiado de resultados
✓ Enlaces WhatsApp
✓ Enlaces Telegram
✓ Registros de personas fallecidas
✓ Fondos dinámicos
✓ Responsive
✓ Sin frameworks
✓ Sin dependencias npm
✓ Sin credenciales en frontend
✓ Interfaz preparada para futuro chat con IA
```

---

# 42. Mantenimiento

Para modificar Assist-AI se recomienda mantener la separación de responsabilidades:

```text
index.html
    ↓
estructura

styles.css
    ↓
presentación

script.js
    ↓
lógica + APIs
```

No se recomienda colocar lógica de negocio dentro de `index.html` ni estilos extensos dentro de `script.js`.

Los cambios en los endpoints deben realizarse en:

```javascript
API_URL
POL_API_URL
CREDIT_API_URL
```

La modificación de la estructura de datos provenientes de las APIs debe acompañarse con cambios en las funciones correspondientes:

```javascript
mostrarResultado()
mostrarPoliticas()
mostrarMorosidad()
mostrarDeudas()
construirTextoPlano()
```

La lógica de comandos debe modificarse en:

```javascript
detectarComando()
```

La interfaz de descargas se modifica principalmente dentro de:

```javascript
mostrarDescargas()
```

---

# 43. Licencia

Copyright © ACME Labs

Todos los derechos reservados.



También corregí la arquitectura respecto del README viejo: ahora **no son solamente dos APIs**, sino tres, y la búsqueda de DNI dispara una segunda consulta crediticia cuando corresponde. 
