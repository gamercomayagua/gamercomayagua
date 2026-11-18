# Panel privado Gamer Comayagua

Este código es para crear una **segunda aplicación web de Google Apps Script**, independiente del conector público.

**No publiques estos archivos como una página GitHub Pages**; GitHub es público y NO proporciona privacidad por esconder una URL. El panel debe ejecutarse en Apps Script con autorización de Google.

## Instalación
1. Abre https://script.google.com/home/projects/create con la cuenta **rguerrero9303922@educatrachos.hn**, propietaria de Google Sheets.
2. Crea un proyecto nuevo: **Gamer Comayagua — Panel Privado**.
3. Sustituye Código.gs por el contenido de **Codigo.gs** de esta carpeta.
4. Crea un archivo HTML llamado exactamente **Panel** y pega el contenido de **Panel.html**.
5. Guarda. Implementar > Nueva implementación > Aplicación web.
6. **Ejecutar como: Yo**. **Quién tiene acceso: Solo yo**. No selecciones "Cualquier persona".
7. Autoriza el acceso a Google Sheets con la cuenta propietaria. Abre el URL /exec que genere la instalación.
8. Si aparece "Acceso restringido" incluso con la cuenta correcta, la identidad no pudo verificarse con Session.getActiveUser(); el panel bloquea el acceso por seguridad. No desactives la verificación ni lo publiques a todo el mundo.

## Funciones
- Aumento automático configurable, con reducción en puntos porcentuales. Datos persistentes en **Control Tienda!B2:B4**.
- Precio manual y estado de cada producto en Catalogo!T / V / W.
- Activar/desactivar envío gratis para cada producto o para todos (la opción global solicita confirmación).
- Búsqueda de productos por texto, código, SKU y modelo; diseño táctil para móvil.
- El precio final público se calcula en Catalogo!U por fórmula; la página de clientes lee esta columna.

## Seguridad
Cada acción de lectura y escritura requiere Session.getActiveUser() igual al email propietario. Además la aplicación web debe estar desplegada SOLO YO. El acceso público al repositorio NO da acceso a las operaciones de edición: Google ejecuta las comprobaciones en el servidor.

La tienda y su catálogo público permanecen en el proyecto separado del Apps Script de lectura. NO agregues funciones de administración al código de ese proyecto.

## Precauciones
- Cambiar aumento o reducción aplica a TODOS los productos sin precio manual.
- Un precio manual tiene prioridad sobre el porcentaje.
- "Envío gratis para TODOS" reemplaza las marcas individuales y se confirma antes de escribir.
- Las modificaciones se sincronizan con la tienda cuando la página de clientes consulta el servidor público.
