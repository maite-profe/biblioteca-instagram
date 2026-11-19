/** Punta Galea — Biblioteca de Redes.
 * Pegar en Extensiones > Apps Script de la hoja existente.
 * Publicar como aplicación web: ejecutar como USUARIO QUE ACCEDE;
 * acceso: usuarios del dominio (si Workspace lo permite).
 * No publicar como "cualquiera" ejecutando como propietario.
 */
const TAB = 'Redes';
const DOMAIN = 'colegio-puntagalea.com';
const WEB = 'https://maite-profe.github.io/biblioteca-instagram/';
const HEADERS = ['id','titulo','categoria','subcategoria','curso','tema','descripcion','url','estado','fecha_limite','imagen','icono','fecha_realizacion','observaciones'];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Formulario')
    .setTitle('Añadir idea · Punta Galea')
    .addMetaTag('viewport','width=device-width,initial-scale=1');
}
function saveIdea(input) {
  const email = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!email.endsWith('@' + DOMAIN)) throw new Error('Accede con tu cuenta del colegio. Si tu identidad no está disponible, contacta con el responsable.');
  const url = String(input.url || '').trim();
  if (!/^https:\/\/(www\.)?(instagram\.com|facebook\.com|fb\.watch|tiktok\.com|vm\.tiktok\.com)\//i.test(url)) throw new Error('Introduce un enlace de Instagram, Facebook o TikTok.');
  if (url.length > 1500) throw new Error('El enlace es demasiado largo.');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB);
  if (!sheet) throw new Error('No existe la pestaña Redes.');
  const rows = sheet.getDataRange().getValues();
  const header = rows[0].map(String);
  if (HEADERS.some((h,i)=>header[i]!==h)) throw new Error('Las columnas de Redes no coinciden con la configuración.');
  const normalized = url.replace(/[?#].*$/,'').replace(/\/$/,'').toLowerCase();
  if (rows.slice(1).some(r=>String(r[7]||'').replace(/[?#].*$/,'').replace(/\/$/,'').toLowerCase()===normalized)) throw new Error('Este enlace ya está en la biblioteca.');
  const lock = LockService.getDocumentLock(); lock.waitLock(15000);
  try {
    const all = sheet.getDataRange().getValues();
    if (all.slice(1).some(r=>String(r[7]||'').replace(/[?#].*$/,'').replace(/\/$/,'').toLowerCase()===normalized)) throw new Error('Este enlace ya está en la biblioteca.');
    const id = Math.max(0,...all.slice(1).map(r=>Number(r[0])||0))+1;
    const note = String(input.descripcion||'').trim().slice(0,600);
    const title = String(input.titulo||'').trim().slice(0,110) || ('Idea de '+(url.includes('instagram')?'Instagram':url.includes('tiktok')?'TikTok':'Facebook'));
    const kind = /graduaci[oó]n/i.test(note+' '+title)?'Graduación':/festival/i.test(note+' '+title)?'Festivales':'Reels';
    sheet.appendRow([id,title,'Redes sociales',kind,'','',note,url,'Pendiente','','','💡','', 'Añadido por '+email+' · '+new Date().toLocaleString('es-ES')]);
    return {ok:true,id:id,url:WEB};
  } finally { lock.releaseLock(); }
}
