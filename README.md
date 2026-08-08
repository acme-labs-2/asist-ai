# ACME Labs — Asist-ai → Consulta por Documento y Entidades

Interfaz web de consulta desarrollada en **HTML, CSS y JavaScript vanilla**.
La herramienta permite realizar dos tipos de consultas desde un único campo de entrada:

1. **Consulta de personas por DNI**
2. **Consulta de políticas de entidades mediante texto**

La aplicación funciona como **frontend estático** y consume APIs externas mediante `fetch()`.

---

## 1. Arquitectura

La aplicación está compuesta por tres capas principales:

```text
┌─────────────────────────────────────────────┐
│                  NAVEGADOR                  │
│                                             │
│  index.html                                 │
│      │                                      │
│      ├── styles.css                         │
│      │                                      │
│      └── script.js                          │
│              │                              │
└──────────────┼──────────────────────────────┘
               │
               │ HTTPS / fetch()
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────────┐ ┌──────────────┐
│ xfinder.php  │ │   pol.php    │
│              │ │              │
│ Consulta     │ │ Consulta de  │
│ por DNI      │ │ políticas    │
└──────────────┘ └──────────────┘
       │                │
       ▼                ▼
 Base de datos       Datos de
 de personas         entidades
```

El frontend **no contiene directamente la base de datos**. Toda consulta de información se realiza mediante endpoints HTTP.

---

# 2. Estructura del proyecto

```text
tu-proyecto/
│
├── index.html
├── styles.css
├── script.js
│
└── assets/
    ├── f12.png
    ├── f13.png
    ├── w.png
    └── t.png
```

### `index.html`

Contiene la estructura HTML de la aplicación:

* Panel principal
* Consola inicial
* Campo de búsqueda
* Botón de consulta
* Botón de copia
* Contenedor de resultados
* Referencias a CSS y JavaScript

No contiene lógica de negocio.

---

### `styles.css`

Contiene exclusivamente la presentación visual.

Incluye:

* Tema oscuro
* Estética de consola
* Bordes violetas/neón
* Animaciones
* Responsive design
* Tarjetas de resultados
* Estados de error
* Indicadores visuales
* Adaptación para dispositivos móviles

La aplicación utiliza:

```text
Lucida Console
Monaco
monospace
```

como familia tipográfica principal.

---

### `script.js`

Contiene toda la lógica de funcionamiento.

Responsabilidades:

* Comunicación con APIs
* Detección del tipo de búsqueda
* Consulta por DNI
* Consulta de políticas
* Renderizado de resultados
* Animación inicial
* Spinner de conexión
* Copiado de resultados
* Generación de enlaces WhatsApp
* Generación de enlaces Telegram
* Manejo de errores

---

# 3. Endpoints utilizados

Actualmente se utilizan dos APIs.

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

La respuesta esperada para una consulta de DNI es un objeto JSON.

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

También puede devolver:

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

# 4. API de políticas

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

# 5. Lógica de búsqueda

La aplicación utiliza una única caja de búsqueda.

El comportamiento depende del contenido ingresado.

```text
                    ENTRADA
                       │
                       ▼
                 ¿Es numérica?
                  /          \
                SÍ            NO
                │              │
                ▼              ▼
          Consulta DNI    Consulta políticas
                │              │
                ▼              ▼
        xfinder.php          pol.php
```

La detección se realiza mediante:

```javascript
const esNumero = /^\d+$/.test(query);
```

---

## 5.1 Consulta por DNI

Si la entrada contiene exclusivamente números:

```text
34340714
```

se considera una consulta de DNI.

La aplicación exige un mínimo de 6 dígitos.

```javascript
if (query.length < 6) {
    // DNI inválido
}
```

Luego realiza:

```javascript
fetch(`${API_URL}?dni=${encodeURIComponent(query)}`)
```

---

## 5.2 Consulta de entidad

Si la entrada contiene caracteres no numéricos:

```text
Creditia
```

se considera una búsqueda de entidad.

La aplicación ejecuta:

```javascript
buscarPoliticasAPI(query)
```

que realiza:

```javascript
fetch(`${POL_API_URL}?q=${encodeURIComponent(termino)}`)
```

La búsqueda requiere como mínimo 2 caracteres.

---

# 6. Interfaz de usuario

La interfaz tiene dos estados principales.

## Estado inicial

Al cargar la página aparece una consola animada.

El texto se escribe carácter por carácter mediante JavaScript.

Ejemplo:

```text
Hola, soy tu asistente 👋

Puedo ayudarte a buscar datos de personas o políticas
de entidades con las que trabajamos.

Espera mientras me conecto con mi servidor.

Archivo con politicas de entidades cargado.
Base de datos lista: 2,219,227 registros
```

Durante la inicialización también se consulta:

```text
/api/xfinder.php?stats=true
```

para obtener el número total de registros.

---

## Spinner de conexión

Durante la inicialización se ejecuta un spinner:

```text
Conectado a 45.67.217.147... -
Conectado a 45.67.217.147... \
Conectado a 45.67.217.147... |
Conectado a 45.67.217.147... /
```

Al finalizar:

```text
Conectado a 45.67.217.147... ✅
```

> El texto mostrado corresponde a una representación visual de la conexión. La comunicación real con la API se realiza mediante HTTPS utilizando `fetch()`.

---

# 7. Renderizado de resultados

Los resultados se generan dinámicamente mediante JavaScript.

El contenedor principal es:

```html
<div id="resultText" class="result-moderno"></div>
```

La función responsable de las consultas de personas es:

```javascript
mostrarResultado(data)
```

La función responsable de las políticas es:

```javascript
mostrarPoliticas(resultados, termino)
```

---

# 8. Consulta de personas

Los resultados de una persona normal se dividen en tres bloques.

## Datos personales

```text
👤 DATOS PERSONALES

Nombre
DNI
Domicilio
Localidad
Provincia
```

## Datos laborales

```text
💼 DATOS LABORALES

Empleador
CUIT
Empleados
```

## Contacto

```text
📱 CONTACTO

Celular 1
Celular 2
Fijo 1
Fijo 2
Email
```

Finalmente se muestra la fuente:

```text
📌 Fuente
📅 Fecha del dato
```

---

# 9. Registros de personas fallecidas

La API puede devolver un registro marcado mediante:

```javascript
data.fallecido
```

Cuando este valor es verdadero, la aplicación utiliza un diseño diferente.

Se muestra:

```text
⚠️ DNI
✝ FALLECIDO
```

y posteriormente los datos personales.

También se muestra explícitamente:

```text
⚠️ ESTA PERSONA SE ENCUENTRA FALLECIDA
```

En este caso no se muestran los bloques laborales ni de contacto utilizados para los registros normales.

---

# 10. Enlaces de contacto

Los números celulares detectados se convierten automáticamente en enlaces.

## WhatsApp

La función:

```javascript
whatsappLink(numero)
```

normaliza el número eliminando caracteres no numéricos.

Ejemplo:

```text
11-1234-5678
```

se transforma en:

```text
1112345678
```

Si el número no comienza con `54`, se agrega:

```text
54
```

El enlace final tiene el formato:

```text
https://wa.me/541112345678
```

---

## Telegram

La función:

```javascript
telegramLink(numero)
```

utiliza el mismo proceso de normalización.

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

# 11. Copiado de resultados

El botón:

```text
📋 COPIAR
```

permanece oculto hasta que existe un resultado.

Cuando aparece un resultado:

```javascript
btnCopiar.classList.add('visible');
```

La información se almacena en:

```javascript
let ultimoResultado = '';
```

y se copia mediante:

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

# 12. Conversión de resultados a texto plano

La función:

```javascript
construirTextoPlano(data)
```

convierte el objeto JSON recibido desde la API en texto estructurado.

Ejemplo:

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

📌 ORIGEN
  Fecha: 2026-08-07
  Proveedor: FUENTE
```

Este texto es el que se almacena en:

```javascript
ultimoResultado
```

para ser copiado al portapapeles.

---

# 13. Consulta de estadísticas

Durante la carga inicial se ejecuta:

```javascript
obtenerTotalRegistros()
```

La función consulta:

```text
/api/xfinder.php?stats=true
```

Si la API devuelve:

```json
{
    "total": 2219227
}
```

JavaScript convierte el número mediante:

```javascript
Number(data.total).toLocaleString('es-AR')
```

Si la API no responde correctamente, se utiliza un valor fallback:

```text
2,219,227
```

---

# 14. Manejo de errores

La aplicación contempla diferentes tipos de error.

### Entrada vacía

```text
⚠️ Ingrese un DNI (mínimo 6 dígitos) o nombre de entidad
(mínimo 2 letras).
```

### DNI demasiado corto

```text
⚠️ Ingrese un DNI válido (mínimo 6 dígitos).
```

### Sin resultados

```text
❌ No se encontraron políticas para "Creditia"
```

o el mensaje de error enviado por la API.

### Error HTTP

Si el servidor responde con un estado diferente de `2xx`:

```javascript
if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
}
```

### Error general

Si ocurre una excepción durante la consulta:

```text
❌ Error al consultar la base de datos
```

y debajo se muestra el mensaje técnico de JavaScript.

---

# 15. Cambios visuales durante la búsqueda

Al comenzar una consulta se ejecuta:

```javascript
prepararBusqueda()
```

Esta función:

1. Oculta la consola inicial.
2. Mueve visualmente el buscador hacia arriba.
3. Cambia el fondo.

Concretamente:

```javascript
consoleElement.classList.add('oculto');
searchContainer.classList.add('arriba');
document.body.classList.add('fondo-busqueda');
```

El fondo inicial utiliza:

```text
assets/f13.png
```

y durante la búsqueda:

```text
assets/f12.png
```

---

# 16. Responsive design

La aplicación posee un breakpoint:

```css
@media (max-width:700px)
```

En pantallas pequeñas:

* El panel ocupa prácticamente todo el ancho.
* Los botones pasan a disposición vertical.
* El campo de búsqueda ocupa todo el ancho.
* Los campos de resultados pasan de horizontal a vertical.
* Se reducen tamaños tipográficos.
* El encabezado de resultados se centra.

Esto permite utilizar la herramienta tanto en escritorio como en dispositivos móviles.

---

# 17. Dependencias

La aplicación no utiliza frameworks externos.

No requiere:

* Node.js
* npm
* React
* Vue
* Angular
* jQuery
* Bootstrap

Utiliza exclusivamente:

```text
HTML5
CSS3
JavaScript
Fetch API
Clipboard API
```

Las únicas dependencias externas son los endpoints HTTP utilizados para obtener los datos.

---

# 18. Requisitos del servidor

El frontend puede alojarse en cualquier servidor capaz de servir archivos estáticos.

Por ejemplo:

```text
Nginx
Apache
GitLab Pages
GitHub Pages
Cloudflare Pages
Servidor HTTP simple
```

No es necesario ejecutar JavaScript en el servidor.

La estructura publicada debe conservar las rutas relativas:

```text
index.html
styles.css
script.js
assets/
```

---

# 19. Ejecución local

Puede utilizarse cualquier servidor HTTP estático.

Ejemplo con Python:

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

porque determinadas funcionalidades del navegador y las políticas CORS pueden comportarse de forma diferente bajo `file://`.

---

# 20. CORS

Como el frontend realiza solicitudes desde el navegador hacia:

```text
https://carover0.xyz
```

los endpoints deben permitir solicitudes provenientes del dominio donde esté alojada la aplicación.

El servidor de las APIs debe configurar correctamente los encabezados CORS.

Ejemplo conceptual:

```http
Access-Control-Allow-Origin: https://dominio-del-frontend.example
```

Para desarrollo puede utilizarse:

```http
Access-Control-Allow-Origin: *
```

aunque para producción es preferible restringir el origen.

---

# 21. Seguridad

El frontend **no contiene credenciales ni tokens privados**.

Las URLs de las APIs son visibles porque forman parte del código JavaScript ejecutado por el navegador:

```javascript
const API_URL = 'https://carover0.xyz/api/xfinder.php';
const POL_API_URL = 'https://carover0.xyz/api/pol.php';
```

Por lo tanto:

> Todo dato que el navegador necesita para realizar una consulta debe considerarse públicamente observable.

Si las APIs requieren autenticación, las credenciales no deben incorporarse directamente en `script.js`.

La autenticación debería realizarse mediante un backend intermedio o mediante mecanismos diseñados específicamente para clientes públicos.

---

# 22. Flujo completo de una consulta

Ejemplo:

```text
Usuario
   │
   │ Ingresa: 34340714
   ▼
buscarDNI()
   │
   ├── trim()
   │
   ├── valida longitud
   │
   ├── detectar si es numérico
   │
   ▼
API_URL
   │
   │ GET /api/xfinder.php?dni=34340714
   ▼
Servidor
   │
   ▼
JSON
   │
   ▼
mostrarResultado(data)
   │
   ├── Datos personales
   ├── Datos laborales
   ├── Contacto
   ├── WhatsApp
   ├── Telegram
   └── Fuente
   │
   ▼
construirTextoPlano()
   │
   ▼
ultimoResultado
   │
   ▼
📋 COPIAR
```

---

# 23. Flujo de búsqueda de entidad

Ejemplo:

```text
Usuario
   │
   │ Ingresa: Creditia
   ▼
buscarDNI()
   │
   ├── trim()
   │
   ├── detectar que NO es numérico
   │
   ▼
buscarPoliticasAPI("Creditia")
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

# 24. Funciones principales de `script.js`

| Función                   | Responsabilidad                     |
| ------------------------- | ----------------------------------- |
| `obtenerTotalRegistros()` | Obtiene estadísticas de la API      |
| `buscarPoliticasAPI()`    | Consulta políticas de entidades     |
| `mostrarPoliticas()`      | Renderiza políticas                 |
| `iniciarSpinnerEnLinea()` | Ejecuta spinner de conexión         |
| `iniciarEscritura()`      | Ejecuta animación de consola        |
| `mostrarResultado()`      | Renderiza resultados de personas    |
| `construirTextoPlano()`   | Genera texto para copiar            |
| `copiarResultado()`       | Copia información al portapapeles   |
| `prepararBusqueda()`      | Cambia la interfaz al modo búsqueda |
| `buscarDNI()`             | Controlador principal de búsqueda   |

---

# 25. Variables globales

### URLs de API

```javascript
const API_URL
const POL_API_URL
```

Definen los endpoints utilizados por el frontend.

### Resultado actual

```javascript
let ultimoResultado = '';
```

Contiene el último resultado convertido a texto plano.

### Spinner

```javascript
let spinnerInterval = null;
let spinnerIndex = 0;
let spinnerActive = false;
let spinnerResolve = null;
```

Controlan el estado de la animación de conexión.

### Caracteres del spinner

```javascript
const spinnerChars = ['-', '\\', '|', '/'];
```

---

# 26. Personalización

## Cambiar API de personas

Modificar:

```javascript
const API_URL = 'https://carover0.xyz/api/xfinder.php';
```

## Cambiar API de políticas

Modificar:

```javascript
const POL_API_URL = 'https://carover0.xyz/api/pol.php';
```

## Cambiar colores

Los colores principales están centralizados en:

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

## Cambiar fondos

Modificar:

```css
background: #020105 url("assets/f13.png");
```

y:

```css
body.fondo-busqueda {
    background-image: url("assets/f12.png");
}
```

---

# 27. Consideraciones técnicas

## Validación del tipo de consulta

Actualmente la lógica diferencia:

```text
Solo números → DNI
Cualquier otro carácter → Entidad
```

Por lo tanto:

```text
34340714        → DNI
123456          → DNI
Creditia        → Entidad
creditia 2026  → Entidad
ABC123          → Entidad
```

La validación del DNI se limita actualmente a la longitud mínima y al contenido numérico.

---

## Normalización telefónica

La aplicación elimina todos los caracteres que no sean números:

```javascript
numero.replace(/\D/g, '')
```

Esto permite procesar formatos como:

```text
11-1234-5678
11 1234 5678
+54 11 1234-5678
```

Sin embargo, la normalización implementada es deliberadamente simple y no constituye una validación completa de numeración telefónica argentina.

---

# 28. Estado actual del proyecto

La herramienta está diseñada como un **frontend liviano para consulta de información mediante APIs**, con una interfaz orientada a operadores que necesitan realizar búsquedas rápidamente.

Características principales:

```text
✓ Frontend estático
✓ HTML / CSS / JavaScript vanilla
✓ Una única caja de búsqueda
✓ Detección automática DNI / entidad
✓ Consulta mediante HTTPS
✓ Renderizado dinámico
✓ Animación de consola
✓ Indicador de carga
✓ Copiado de resultados
✓ Enlaces WhatsApp
✓ Enlaces Telegram
✓ Manejo de errores
✓ Responsive
✓ Sin frameworks
✓ Sin dependencias npm
✓ Sin credenciales en frontend
```

---

# 29. Mantenimiento

Para modificar la aplicación se recomienda respetar la separación de responsabilidades:

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

Los cambios en los endpoints deben realizarse únicamente en las constantes:

```javascript
API_URL
POL_API_URL
```

La modificación de la estructura de los datos provenientes de las APIs debe acompañarse con cambios en:

```javascript
mostrarResultado()
mostrarPoliticas()
construirTextoPlano()
```

---

# 30. Licencia

Definir aquí la licencia correspondiente al proyecto.

Ejemplo:

```text
Copyright © ACME Labs

Todos los derechos reservados.
```

Si el repositorio se publica bajo una licencia open source, reemplazar esta sección por la licencia correspondiente.
