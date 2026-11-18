/**
 * GAMER COMAYAGUA: API pública de solo lectura para GitHub Pages.
 *
 * Hoja privada: pestaña Catalogo. Lee columnas:
 * A ID, B Producto, C Precio proveedor, F Código, G Categoría,
 * H Subcategoría, I Descripción, K Foto, T Precio manual,
 * U Precio web final, V Envío gratis y W Estado.
 *
 * JAMÁS devuelve: precio del proveedor (C), precio mayorista (E),
 * SKU completo (D), ni otras columnas internas.
 *
 * Desplegar como NUEVA aplicación web: Ejecutar como YO, acceso CUALQUIERA.
 * Copiar la URL /exec al archivo data/live-config.js del repositorio.
 * La hoja NO debe compartirse públicamente.
 */
var GC_SOURCE_ID='1nz1_FtExSD9Z7wgZ9WKaz94_PCX1rX49bUGBuKIw8S8';
var GC_TAB='Catalogo';
var GC_DEFAULT_MARKUP=0.10;
function doGet(e){
  var p=e&&e.parameter||{};
  var cb=String(p.callback||'');
  if(!/^gcPublic_[a-z0-9]{4,32}$/.test(cb)){
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:'Solicitud inválida'})).setMimeType(ContentService.MimeType.JSON);
  }
  var result;
  try{
    var ss=SpreadsheetApp.openById(GC_SOURCE_ID);
    var sheet=ss.getSheetByName(GC_TAB);
    if(!sheet)throw new Error('No se encontró Catalogo');
    var last=sheet.getRange(sheet.getMaxRows(),1).getNextDataCell(SpreadsheetApp.Direction.UP).getRow();
    var total=Math.max(0,last-1);
    var offset=Math.max(0,Math.min(20000,Math.floor(Number(p.offset)||0)));
    var limit=Math.max(1,Math.min(400,Math.floor(Number(p.limit)||400)));
    var length=Math.max(0,Math.min(limit,total-offset));
    var rows=length?sheet.getRange(offset+2,1,length,23).getValues():[];
    var clean=function(v,max){return String(v==null?'':v).trim().replace(/^["“]+|["”]+$/g,'').slice(0,max||800);};
    var positive=function(v){if(v==null||v==='')return null;var n=Number(v);return isFinite(n)&&n>0?n:null;};
    var records=rows.filter(function(r){return r[0]&&r[1];}).map(function(r){
      var explicit=positive(r[19]);
      var effective=positive(r[20]);
      var published=positive(r[2]);
      var price=effective!==null?effective:explicit!==null?explicit:published===null?null:Math.ceil(published*(1+GC_DEFAULT_MARKUP)-1e-8);
      return {
        id:clean(r[0],80),
        name:clean(r[1],260),
        price:price,
        code:clean(r[5],120),
        category:clean(r[6],120),
        subcategory:clean(r[7],140),
        description:clean(r[8],1000),
        photo:/^https:\/\//i.test(clean(r[10],900))?clean(r[10],900):'',
        freeShipping:/^si$/i.test(clean(r[21])),
        soldOut:/^agotado$/i.test(clean(r[22]))
      };
    });
    result={ok:true,total:total,offset:offset,products:records};
  }catch(err){console.error(err);result={ok:false,error:'No fue posible consultar el catálogo público'};}
  return ContentService.createTextOutput(cb+'('+JSON.stringify(result)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}