# Estado de la integración de existencias (18 noviembre 2026)

## Cambios ya instalados en GitHub y Google Sheets

Se añadieron las columnas **X: UNIDADES DISPONIBLES** e **Y: STOCK VERIFICADO EL** en la pestaña `Catalogo`.
Las existencias desconocidas permanecen **vacías**: no se presenta un número inventado.

La página web usa la lógica:
- Stock de 0 a 3 unidades: **AGOTADO / No disponible**, tarjeta y foto en gris, carrito desactivado.
- Stock de 4 unidades en adelante: **Disponible: N**, carrito habilitado salvo estado de venta manual AGOTADO.
- Stock vacío: **Existencias por confirmar**, sin fingir disponibilidad en tiempo real.
- La columna W **ESTADO DE VENTA** puede bloquear manualmente la venta.

Los productos de las capturas del usuario con ID **4256** y **6545** se marcaron en W como AGOTADO, sin asignarles una cantidad inventada. Los seis archivos JSON de respaldo reflejan ese estado.

## Estado actual del dato vivo

**No existe aún una sincronización automática de cantidades verificada con Phone Depot**.
La hoja de Google Sheets original no tenía columna de unidades y no se pudo acceder desde este entorno a los datos vivos de la web original o su API.
Por seguridad no se muestra el inventario completo como si fuera actual.

El archivo `apps-script/CatalogoPublico.gs` ahora lee X e Y y transmite `stock` y `stockVerifiedAt` junto con el resto de datos públicos.
El proyecto de Apps Script ya publicado necesita una **nueva versión de implementación** para que esos campos lleguen a la web.
La copia de respaldo de GitHub ya aplica las dos alertas de AGOTADO.

El panel privado incluye la opción de actualizar X manualmente o consultar la ficha original del proveedor para **un producto** con `gcRefreshSupplierStock(id)`.
Esa función solo guarda un número si encuentra una cantidad legible `Disponible: N` en la página. Si no encuentra el dato, no escribe valores.
Puede fallar si el sitio bloquea la consulta o entrega stock mediante JavaScript; en tal caso es necesaria una integración de API autorizada o una fuente JSON/CSV del proveedor.

## Activación en Apps Script

1. **Proyecto público existente:** abrir el proyecto del conector de catálogo, sustituir `Codigo.gs` por el archivo actualizado `apps-script/CatalogoPublico.gs`; en **Implementar → Administrar implementaciones → Editar → Versión nueva**, guardar.
2. **Proyecto privado existente:** sustituir `Codigo.gs` por `admin-private/Codigo.gs` y el archivo HTML `Panel` por `admin-private/Panel.html`. Publicar **Versión nueva** manteniendo **Ejecutar como Yo / Acceso Solo yo**.
3. En el panel privado, buscar referencia 4256: se mostrará AGOTADO. Cuando existan cantidades confirmadas de un producto, escribirlas en la edición y guardar.
4. Si el proveedor confirma stock, comprobar que la página pública muestra **Disponible: N** para N≥4, y AGOTADO para N≤3.

**No activar acceso público al panel privado ni subir costos mayoristas a GitHub.**
