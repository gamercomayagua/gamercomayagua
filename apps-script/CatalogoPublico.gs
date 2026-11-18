/**
 * GAMER COMAYAGUA - Catálogo público seguro para GitHub Pages.
 * Implementar como NUEVA aplicación web de Apps Script:
 * Ejecutar como: Yo. Acceso: Cualquier persona.
 * SOLO devuelve A,B,C,F,G,H,I,K de la pestaña Catalogo.
 * No publica el SKU completo ni la columna de valor mayorista.
 * Mantener el Google Sheet original PRIVADO.
 */
const GC_SHEET_ID = '1nz1_FtExSD9Z7wgZ9WKaz94_PCX1rX49bUGBuKIw8S8';
const GC_SHEET_NAME = 'Catalogo';
function doGet(e) {
  const callback = String(e && e.parameter && e.parameter.callback || '');
  if (!/^gcPublic_[a-z0-9]{4,32}$/.test(callback)) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:'callback requerido'})).setMimeType(ContentService.MimeType.JSON);
  }
  const offset = Math.max(0, Math.min(20000, Math.floor(Number(e.parameter.offset)||0)));
  const limit = Math.max(1, Math.min(400, Math.floor(Number(e.parameter.limit)||400)));
  let answer;
  try {
    const ss = SpreadsheetApp.openById(GC_SHEET_ID);
    const tab = ss.getSheetByName(GC_SHEET_NAME);
    if (!tab) throw new Error('No existe la pestaña Catalogo');
    const total = Math.max(0,tab.getLastRow()-1);
    const firstRow = offset+2;
    const available = Math.max(0,Math.min(limit,total-offset));
    const rows = available ? tab.getRange(firstRow,1,available,11).getDisplayValues() : [];
    const clean = value => String(value == null ? '' : value).trim().replace(/^["“]+|["”]+$/g,'').slice(0,1200);
    const price = value => {
      const val=clean(value).replace(/[^\d,.]/g,'');
      if(!val)return null;
      const n=Number(val.includes(',')?val.replace(/\./g,'').replace(',','.'):val);
      return isFinite(n)&&n>=0?n:null;
    };
    const products = rows.filter(r=>r[0]&&r[1]).map(r=>({
      id:clean(r[0]),name:clean(r[1]),price:price(r[2]),
      // SKU se omite por completo para evitar publicar el sufijo de costo.
      code:clean(r[5]),category:clean(r[6]),subcategory:clean(r[7]),
      description:clean(r[8]),photo:/^https:\/\//i.test(clean(r[10]))?clean(r[10]):''
    }));
    answer={ok:true,total,offset,products};
  }catch(err){answer={ok:false,error:'No se pudo cargar el catálogo'};console.error(err);}
  return ContentService.createTextOutput(callback+'('+JSON.stringify(answer)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}