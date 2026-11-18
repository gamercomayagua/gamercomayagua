# Existencias del catálogo

La ficha pública de Phone Depot carga `/server/api/e-comerce/productos-inicio-producto/{id}` desde su JavaScript. El contador «Variaciones» indica grupos de opciones. «Disponible» usa `inventarios_ecommerce[].cantidad_disponible`, agrupado por variante. La consulta privada coteja el ID y el código de barras. Si hay varias opciones, exige que la foto del catálogo identifique un único grupo. Si ese grupo todavía contiene varias tallas, pesos o agrupaciones de precio, conserva la verificación anterior hasta identificar la variante.

En `Catalogo`, X guarda unidades, Y guarda cuándo se verificaron y W conserva la decisión manual de venta. De 0 a 3 unidades se bloquea el carrito. A partir de 4 se muestra la cantidad, salvo bloqueo manual. Una cantidad desconocida se muestra como «Existencias por confirmar». El panel permite verificar una referencia a la vez. No hay una sincronización programada en tiempo real.

El conector público actualizado entrega X e Y y solo los campos de venta necesarios. Si el conector todavía está en su versión anterior, la tienda puede usar la muestra fechada de cuatro referencias durante un máximo de 24 horas. La muestra no sustituye la integración con la hoja.

Las ofertas y el permiso por artículo para pagar al recibir se guardan en Z y AA. El interruptor general, el logo y los controles de marca de agua usan `Control Tienda!A8:B13`. La fórmula de precio final U permanece intacta. El precio de una oferta se aplica al preparar la respuesta pública.
