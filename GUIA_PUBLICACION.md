# Publicación y sincronización | Gamer Comayagua

## Sitio web
La tienda está preparada para alojarse en **GitHub Pages** desde el repositorio público gamercomayagua/gamercomayagua. En GitHub > Settings > Pages > Build and deployment: Deploy from a branch, seleccioná main y /(root). Dirección esperada: https://gamercomayagua.github.io/gamercomayagua/

## Datos importados
La copia pública se encuentra en data/catalogo-1.json ... data/catalogo-6.json. Solo incluye nombre, precio **publicado**, código, categoría, subcategoría, descripción y foto. El valor mayorista y el SKU con sufijo de costo NO se publicaron. La hoja original es privada. El stock no figura en la hoja y por eso se debe consultar por WhatsApp.

## Activar sincronización automática de la página con Google Sheets
La tienda funciona ya con su copia pública. Para que cada visitante vea los cambios de Google Sheets sin actualizar manualmente los archivos de GitHub, hay que configurar una sola vez un servidor de lectura pública segura en Apps Script:

1. En Google Drive: Nuevo > Más > Google Apps Script; creá un proyecto NUEVO. No modifiques el proyecto de la tienda anterior.
2. Copiá íntegro el contenido de apps-script/CatalogoPublico.gs en Codigo.gs y guardalo.
3. Implementar > Nueva implementación > Aplicación web.
4. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier persona**. Autorizá el script con tu cuenta propietaria de la hoja. Si tu organización no permite "Cualquier persona", este método no funcionará; usá un entorno con autorización adecuada.
5. Copiá la URL del despliegue que termina en /exec.
6. En data/live-config.js, reemplazá las comillas vacías por la URL /exec (sin parámetros). Guardá el cambio en GitHub.

Después de esto, al abrir la tienda se cargará primero la copia de respaldo y se actualizará desde la hoja. Si el servidor de Google no responde, se conservará la copia local y se mostrará un aviso. Es una sincronización de **lectura pública limitada**: no modifica la hoja, no necesita darle acceso público a la hoja de cálculo y jamás debe exponer campos mayoristas o datos privados.

Para probar: cambiá un nombre o precio publicado en la pestaña Catalogo y recargá la tienda; debería verse actualizado. Para el mayor catálogo puede tardar unos segundos en consultar las páginas.

Importante: cualquiera que tenga la URL de Apps Script puede consultar la información pública del catálogo. No añadas costos, cuentas, claves ni inventario privado al servidor.

## Mantenimiento
Si la hoja cambia de columnas, actualizá el mapeo en apps-script/CatalogoPublico.gs. No pegues claves ni tokens personales en archivos del repositorio. La copia pública de respaldo no se actualiza hasta que se vuelva a exportar desde el Sheet. El sitio no permite editar productos; los cambios se hacen en Google Sheets.
