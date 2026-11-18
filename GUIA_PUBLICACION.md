# Gamer Comayagua — precios propios, carrito y sincronización

## 1. Editar precios en Google Sheets
Abre la pestaña **Catalogo** del archivo privado:
https://docs.google.com/spreadsheets/d/1nz1_FtExSD9Z7wgZ9WKaz94_PCX1rX49bUGBuKIw8S8/edit?gid=355679599

Al final de las columnas encontrarás:
- **T — MI PRECIO MANUAL (L):** escribí aquí tu precio. Dejando vacío aplicamos un aumento automático del 10 % sobre C.
- **U — PRECIO WEB FINAL (L):** muestra el precio que verá el público. Se calcula automáticamente y no se debe editar.
- **V — ENVÍO GRATIS (SI/NO):** elegí SI para los artículos que incluyen envío gratis.
- **W — ESTADO DE VENTA:** DISPONIBLE / AGOTADO. Si escribís AGOTADO, el producto queda gris y no se puede añadir al carrito.

Ejemplo: proveedor L 150 → precio automático L 165. Si escribís 190 en T, la web mostrará L 190. Ni el precio de proveedor ni el costo mayorista se publican en la web.

## 2. Carrito y comisiones
- Envío nacional: **L 110**; envío gratis si todos los productos del carrito tienen V = SI.
- En Comayagua: costo de entrega **por confirmar**; la cotización muestra el importe pendiente, sin inventar cargos.
- Retiro en tienda: **L 0**, sujeto a confirmación.
- Transferencia bancaria: **sin comisión**.
- Tigo Money: **10 %** sobre productos + envío.
- Pagar al recibir: **15 %** sobre productos + envío; mínimo **L 350** en productos. Anticipo de envío + comisión y saldo en efectivo al recibir. Las condiciones se confirman por WhatsApp.
- Carrito persistente (solo IDs y cantidades), datos de destino opcionales y cotización imprimible en PDF desde el navegador.

## 3. Habilitar actualización automática desde Google Sheets (una sola vez)
La web funciona con los 2,548 productos ya importados, pero la **sincronización en vivo aún necesita desplegar Apps Script**.

1. En Google Drive, crea **un Apps Script nuevo**. No edites la aplicación web de tu tienda anterior ni las hojas del catálogo.
2. Copiá el contenido completo del archivo [apps-script/CatalogoPublico.gs](apps-script/CatalogoPublico.gs) en el archivo Código.gs y guardá.
3. Elegí **Implementar > Nueva implementación > Aplicación web**.
4. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier persona**. Autorizá el acceso con la misma cuenta que tiene el Google Sheet privado.
5. Copiá la URL publicada que termina exactamente en **/exec**.
6. Editá [data/live-config.js](data/live-config.js) en GitHub y poné esa URL entre las comillas:
   `window.GC_LIVE_ENDPOINT = 'https://script.google.com/macros/s/TU_ID/exec';`
7. Guardá el cambio. Cuando abras la página, esta leerá primero la copia pública y luego los precios actuales de tu hoja privada.

**Comprobación:** cambia T2 en Google Sheets, espera a que U2 actualice, y recarga la web. El nuevo precio deberá aparecer. Para cambios de V o W, recarga igual.

**Seguridad:** la hoja de Google Sheets permanece privada. El Apps Script publica solo ID, producto, **precio Gamer**, categoría, subcategoría, descripción, código, foto, envío gratis y estado. Nunca expone C, D, E, T ni ninguna cifra mayorista. No pongas claves ni bancos en GitHub.

Si Apps Script no está activado, los visitantes verán la copia pública de respaldo subida a GitHub. Esa copia no se actualiza al cambiar la hoja; es necesario activar el paso 3.

## 4. Publicar GitHub Pages
En https://github.com/gamercomayagua/gamercomayagua/settings/pages seleccioná: **Deploy from a branch** → **main** → **/(root)**.

Dirección esperada:
https://gamercomayagua.github.io/gamercomayagua/

El repositorio anterior **sdcomayagua/sdcomayagua** no se modifica.
