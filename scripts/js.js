const KEY='trae_students_v1';
let currentStudentId = null;
let scanner = null;
let photoData = '';

const $ = id => document.getElementById(id);
const getStudents = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const saveStudents = arr => localStorage.setItem(KEY, JSON.stringify(arr));

function uid(){
  const d=new Date(); const r=Math.random().toString(36).slice(2,8).toUpperCase();
  return `TRAE-${d.getFullYear()}-${r}`;
}
function go(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  $('page-'+page).classList.add('active');
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  if(page==='carnet') renderCard(currentStudentId || getStudents()[0]?.id);
  if(page==='admin') renderAdmin();
}
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));

$('photo').addEventListener('change', e=>{
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{photoData=reader.result; $('photoPreview').innerHTML=`<img src="${photoData}" alt="Foto del estudiante">`;};
  reader.readAsDataURL(file);
});

$('studentForm').addEventListener('submit', e=>{
  e.preventDefault();
  const student={
    id: uid(),
    firstName: $('firstName').value.trim(),
    lastName: $('lastName').value.trim(),
    code: $('studentCode').value.trim(),
    school: $('school').value.trim(),
    grade: $('grade').value.trim(),
    route: $('route').value.trim(),
    guardianName: $('guardianName').value.trim(),
    guardianPhone: $('guardianPhone').value.trim(),
    guardianEmail: $('guardianEmail').value.trim(),
    photo: photoData || '',
    status: 'Activo',
    createdAt: new Date().toISOString()
  };
  const arr=getStudents(); arr.unshift(student); saveStudents(arr);
  currentStudentId=student.id;
  $('regSuccess').style.display='block'; $('regError').style.display='none';
  e.target.reset(); photoData=''; $('photoPreview').innerHTML='<span>Sin foto</span>';
  renderCard(student.id); renderAdmin(); go('carnet');
});

function renderCard(id){
  const student=getStudents().find(s=>s.id===id);
  const box=$('idCardContainer');
  if(!student){
    box.innerHTML='<div class="card empty">Aún no hay un carnet. Registra un estudiante primero.</div>'; return;
  }
  box.innerHTML=`
    <div class="id-card">
      <div class="topline"><div>TRAE ID · CARNET ESTUDIANTIL</div><span class="status">${student.status}</span></div>
      <div class="id-main">
        <div class="id-photo">${student.photo?`<img src="${student.photo}" alt="Foto">`:'Sin foto'}</div>
        <div class="id-info">
          <div class="name">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</div>
          <div><b>Identificación:</b> ${escapeHtml(student.code)}</div>
          <div><b>Escuela:</b> ${escapeHtml(student.school)}</div>
          <div><b>Grado:</b> ${escapeHtml(student.grade)}</div>
          <div><b>Ruta:</b> ${escapeHtml(student.route)}</div>
        </div>
        <div class="qr-wrap"><div class="qr-box" id="cardQR"></div><small class="muted" style="margin-top:6px">Escanear para validar</small></div>
      </div>
      <div class="emergency">
        <div><div class="muted" style="font-size:12px">CONTACTO DE EMERGENCIA</div><div style="font-weight:900">${escapeHtml(student.guardianName)}</div><div class="phone">${escapeHtml(student.guardianPhone)}</div></div>
        <a class="btn primary" href="tel:${encodeURIComponent(student.guardianPhone)}">📞 Llamar</a>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap">
        <button class="btn secondary" onclick="downloadCard()">Imprimir / guardar</button>
        <button class="btn ghost" onclick="go('admin')">Volver al panel</button>
      </div>
    </div>`;
  new QRCode($('cardQR'),{text:qrPayload(student),width:102,height:102,correctLevel:QRCode.CorrectLevel.M});
}
function miniQR(){
  const el=$('miniQr'); if(el) new QRCode(el,{text:'TRAE-DEMO-001',width:78,height:78});
}
miniQR();

function qrPayload(s){
  // Solo un identificador/token. En producción: token firmado + URL de validación.
  return `TRAE|${s.id}`;
}
function handleScan(decoded){
  const parts=decoded.split('|'); const id=parts.length===2?parts[1]:decoded;
  const student=getStudents().find(s=>s.id===id);
  if(!student){
    $('scanResult').innerHTML='<div class="result-card"><div class="pill red">QR no reconocido</div><h3>Sin coincidencias</h3><p class="muted">El identificador no pertenece a un estudiante registrado en este dispositivo.</p></div>';
    return;
  }
  $('scanResult').innerHTML=`
    <div class="result-card">
      <div class="pill green">✓ Carnet válido</div>
      <div class="result-head" style="margin-top:14px">
        <div class="result-avatar">${student.photo?`<img src="${student.photo}" alt="Foto">`:'👤'}</div>
        <div><h3 style="margin:0">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</h3><div class="muted">${escapeHtml(student.school)} · ${escapeHtml(student.grade)}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px">
        <div><div class="muted" style="font-size:12px">MATRÍCULA</div><strong>${escapeHtml(student.code)}</strong></div>
        <div><div class="muted" style="font-size:12px">RUTA</div><strong>${escapeHtml(student.route)}</strong></div>
      </div>
      <div class="emergency" style="margin-top:18px"><div><div class="muted" style="font-size:12px">CONTACTO AUTORIZADO</div><strong>${escapeHtml(student.guardianName)}</strong><div>${escapeHtml(student.guardianPhone)}</div></div><a class="btn primary" href="tel:${encodeURIComponent(student.guardianPhone)}">📞 Llamar</a></div>
    </div>`;
}
$('startScan').addEventListener('click',async()=>{
  try{
    if(scanner) return;
    scanner=new Html5Qrcode("reader");
    const config={fps:10,qrbox:{width:240,height:240}};
    await scanner.start({facingMode:"environment"},config,(decoded)=>handleScan(decoded),()=>{});
  }catch(err){
    $('scanResult').innerHTML=`<div class="result-card"><div class="pill red">No se pudo activar la cámara</div><p class="muted">${escapeHtml(String(err))}</p><p class="muted">Puedes probar la aplicación en localhost o HTTPS y conceder permisos de cámara.</p></div>`;
  }
});
$('stopScan').addEventListener('click',async()=>{
  if(scanner){try{await scanner.stop();scanner.clear();}catch(e){}scanner=null;}
});

function renderAdmin(){
  const arr=getStudents();
  $('statStudents').textContent=arr.length;
  $('statActive').textContent=arr.filter(s=>s.status==='Activo').length;
  $('statSchools').textContent=new Set(arr.map(s=>s.school)).size;
  $('statRoutes').textContent=new Set(arr.map(s=>s.route)).size;
  $('studentsTable').innerHTML=arr.length?arr.map(s=>`
    <tr>
      <td><strong>${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</strong><br><span class="muted">${escapeHtml(s.code)}</span></td>
      <td>${escapeHtml(s.school)}</td><td>${escapeHtml(s.route)}</td>
      <td>${escapeHtml(s.guardianName)}<br><span class="muted">${escapeHtml(s.guardianPhone)}</span></td>
      <td><span class="pill green">${s.status}</span></td>
      <td><button class="btn secondary" onclick="openStudent('${s.id}')">Ver carnet</button></td>
    </tr>`).join(''):'<tr><td colspan="6"><div class="empty">No hay estudiantes todavía.</div></td></tr>';
}
function openStudent(id){currentStudentId=id;go('carnet')}
function clearStudents(){if(confirm('¿Borrar todos los estudiantes guardados en este navegador?')){localStorage.removeItem(KEY);currentStudentId=null;renderAdmin();renderCard();}}
function loadDemo(){
  const demo=[{
    id:'TRAE-2026-DEMO01',firstName:'Juan',lastName:'Pérez',code:'TRAE-2026-001',school:'Liceo Modelo',grade:'3ro Secundaria',route:'R-024',guardianName:'María Pérez',guardianPhone:'+1 809 555 0101',guardianEmail:'maria@example.com',photo:'',status:'Activo',createdAt:new Date().toISOString()
  },{
    id:'TRAE-2026-DEMO02',firstName:'Sofía',lastName:'Ramírez',code:'TRAE-2026-002',school:'Colegio Central',grade:'2do Secundaria',route:'R-018',guardianName:'Carlos Ramírez',guardianPhone:'+1 829 555 0110',guardianEmail:'carlos@example.com',photo:'',status:'Activo',createdAt:new Date().toISOString()
  }];
  saveStudents(demo);currentStudentId=demo[0].id;renderAdmin();renderCard(currentStudentId);
}
function downloadCard(){window.print();}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
renderAdmin();


function irARegistro() {

    const pantalla = document.getElementById("pantallaRegistro");

    // Mostrar pantalla de carga
    pantalla.style.display = "flex";

    // Esperar y entrar a la aplicación
    setTimeout(function() {
        window.location.href = "registro_update.html";
    }, 1800);
}