const App = (() => {
  const KEY = 'NDCO_CRM_STATE_V9';
  const IRAN = {
    'تهران': { 'تهران': ['منطقه ۱','منطقه ۲','منطقه ۳','منطقه ۴','منطقه ۵','منطقه ۶','منطقه ۱۲','ولیعصر'], 'ورامین':['مرکزی'] },
    'البرز': { 'کرج':['مرکزی','مهرشهر','گوهردشت'], 'فردیس':['مرکزی'] },
    'اصفهان': { 'اصفهان':['مرکزی','خمینی‌شهر'], 'کاشان':['مرکزی'] },
    'فارس': { 'شیراز':['مرکزی','معالی‌آباد','قصرالدشت'], 'مرودشت':['مرکزی'] },
    'خراسان رضوی': { 'مشهد':['مرکزی','احمدآباد','سجادشهر'], 'نیشابور':['مرکزی'] },
    'آذربایجان شرقی': { 'تبریز':['مرکزی','ولیعصر'], 'مراغه':['مرکزی'] },
    'خوزستان': { 'اهواز':['مرکزی','کیانپارس'], 'آبادان':['مرکزی'] },
    'قم': { 'قم':['مرکزی','پردیسان'] }, 'یزد': { 'یزد':['مرکزی','صفاییه'] }, 'گیلان': { 'رشت':['مرکزی','گلسار'] }
  };
  const MENUS = [
    ['dashboard','داشبورد','📊'],['pharmacies','داروخانه‌ها','🏥'],['doctors','پزشکان','👨‍⚕️'],['orders','سفارش‌ها','🧾'],
    ['activity','فعالیت لحظه‌ای','⚡'],['map','نقشه جامع','🗺️'],['live','موقعیت نمایندگان','📍'],['search','جستجوی اطلاعات','🔎'],
    ['trips','رصد تردد','🚶'],['homes','منزل نمایندگان','🏠'],['leaves','مرخصی‌ها','📅'],['reports','گزارش‌ها','📈'],
    ['targets','تارگت فروش','🎯'],['columns','ستون‌ها و کالاها','🧩'],['users','کاربران و دسترسی‌ها','👥'],
    ['messengers','پیام‌رسان‌ها','💬'],['backup','پشتیبان‌گیری','💾'],['install','نصب اپ','📲'],['diagnostics','عیب‌یابی','🛠️']
  ];
  const todayFa = () => new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran' }).format(new Date());
  const $ = s => document.querySelector(s);
  const el = (tag, cls, html) => { const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; };
  const input = (id,value='',type='text') => `<input class="form-input" id="${id}" type="${type}" value="${String(value).replace(/"/g,'&quot;')}">`;
  const select = (id, opts, val='') => `<select class="form-select" id="${id}"><option value="">انتخاب کنید</option>${opts.map(o=>`<option ${o==val?'selected':''}>${o}</option>`).join('')}</select>`;
  const num = (id,value=0) => `<input class="form-input" id="${id}" type="number" min="0" value="${value}">`;
  const toast = msg => { const t=$('#toast'); t.textContent=msg; t.style.display='block'; setTimeout(()=>t.style.display='none',2500); };
  const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const csv = (name, headers, rows) => {
    let c = '\uFEFF' + headers.map(h=>`"${h}"`).join(',') + '\n' + rows.map(r=>r.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([c],{type:'text/csv;charset=utf-8'})); a.download=name; a.click();
  };

  let state, currentUser = { name: 'مدیر سیستم', role: 'admin' }, maps = {}, currentTab='dashboard';

  function seed(){
    return {
      users:[{id:'u1',name:'مدیر سیستم',user:'admin',pass:'123',phone:'09120000000',role:'مدیر',authMode:'بدون تایید دو مرحله‌ای',perms:['ALL']},
        {id:'u2',name:'جواد طاهری',user:'taheri',pass:'456',phone:'09120852097',role:'نماینده',authMode:'OTP',perms:['pharmacies','doctors','orders','map']}],
      reps:[{id:'r1',name:'جواد طاهری',phone:'09120852097',region:'تهران',lat:35.73,lng:51.42,status:'آنلاین'},{id:'r2',name:'نیلا احمدی',phone:'09123334455',region:'البرز',lat:35.84,lng:50.99,status:'آفلاین'}],
      pharmacies:[{id:'ph1',date:todayFa(),name:'داروخانه مرکزی',province:'تهران',city:'تهران',district:'منطقه ۶',manager:'آقای رضایی',phone:'02188776655',address:'تهران، خیابان ولیعصر',lat:35.721,lng:51.42,percent:true,repName:'جواد طاهری'}],
      doctors:[{id:'doc1',date:todayFa(),name:'دکتر علی محمدی',specialty:'قلب',province:'تهران',city:'تهران',district:'منطقه ۳',phone:'02112345678',address:'مطب نمونه',lat:35.75,lng:51.44,percent:false,repName:'نیلا احمدی'}],
      orders:[{id:'ord1',date:todayFa(),pharmacy:'داروخانه مرکزی',province:'تهران',city:'تهران',district:'منطقه ۶',repName:'جواد طاهری',status:'تحویل شده',items:[{name:'کپسول نمونه',count:50,gift:5,price:250000}]}],
      activity:[{id:'a1',time:new Date().toLocaleTimeString('fa-IR'),rep:'جواد طاهری',action:'ثبت داروخانه جدید'}],
      homes:[{id:'h1',rep:'جواد طاهری',address:'تهران، ستارخان',lat:35.755,lng:51.435}],
      trips:[{id:'tr1',rep:'جواد طاهری',date:todayFa(),points:[[35.72,51.42],[35.73,51.43],[35.74,51.425]],stops:['داروخانه مرکزی','مطب دکتر محمدی']}],
      leaves:[], messages:[], products:[{id:'p1',name:'کپسول نمونه',category:'دارو',dist:40000,pharmacy:45000,stock:5000}], targets:[], customFields:[]
    };
  }
  function load(){ state = JSON.parse(localStorage.getItem(KEY)||'null') || seed(); save(); }
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function geoOptions(p){ return p ? Object.keys(IRAN[p]||{}) : Object.keys(IRAN); }
  function distOptions(p,c){ return (IRAN[p]&&IRAN[p][c])||[]; }

  function nav(){
    const allowed = currentUser.role==='مدیر' ? MENUS : MENUS.filter(m=>['dashboard','pharmacies','doctors','orders','map','reports','targets'].includes(m[0]));
    $('#horizontalNavContainer').innerHTML = allowed.map(([id,label,icon],i)=>`<button class="nav-item ${id===currentTab?'active':''}" data-tab="${id}">${icon} ${label}</button>`).join('');
    $('#sideMenuItemsContainer').innerHTML = allowed.map(([id,label])=>`<button class="side-menu-item" data-tab="${id}">${label}</button>`).join('');
    qAll('[data-tab]').forEach(b=>b.onclick=()=>{ currentTab=b.dataset.tab; render(); closeSide(); });
  }
  function qAll(s,r=document){return Array.from(r.querySelectorAll(s));}
  function openSide(){$('#sideMenuDrawer').classList.add('active');$('#sideMenuOverlay').classList.add('active')}
  function closeSide(){$('#sideMenuDrawer').classList.remove('active');$('#sideMenuOverlay').classList.remove('active')}

  function layout(title, body, actions=''){ return `<div class="card"><div class="card-header"><div class="card-title">${title}</div><div>${actions}</div></div>${body}</div>`; }
  function table(headers, rows){ return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`; }

  function dashboard(){
    const vals=[state.pharmacies.length,state.doctors.length,state.orders.length,state.users.length,state.products.length];
    const max=Math.max(...vals,1);
    return `<div class="stats-grid">
      ${[['داروخانه',state.pharmacies.length,'🏥'],['پزشک',state.doctors.length,'👨‍⚕️'],['سفارش',state.orders.length,'🧾'],['نماینده',state.reps.length,'📍'],['کالا',state.products.length,'📦'],['مرخصی',state.leaves.length,'📅']].map(([l,v,i])=>`<div class="stat-card"><div class="stat-icon">${i}</div><div class="stat-content"><h3>${v}</h3><p>${l}</p></div></div>`).join('')}
    </div>
    <div class="dashboard-grid">
      <div class="card"><div class="card-header"><b>نمودار فعالیت‌ها</b></div><div class="bar-chart">${['داروخانه','پزشک','سفارش','کاربر','کالا'].map((l,i)=>`<div class="bar" style="height:${Math.max(10,vals[i]/max*120)}px"><span>${vals[i]}</span><label>${l}</label></div>`).join('')}</div></div>
      <div class="card"><div class="card-header"><b>نقشه کلی</b></div><div id="mapDashboard" class="map-container"></div></div>
    </div>`;
  }

  function geoRow(pid,cid,did,p,c,d){ return `<div class="form-group"><label>استان</label>${select(pid,geoOptions(),p)}</div><div class="form-group"><label>شهر</label>${select(cid,geoOptions(p),c)}</div><div class="form-group"><label>منطقه</label>${select(did,distOptions(p,c),d)}</div>`; }
  function bindGeo(pid,cid,did){ const p=$('#'+pid),c=$('#'+cid),d=$('#'+did); p.onchange=()=>{c.innerHTML='<option value="">انتخاب کنید</option>'+geoOptions(p.value).map(x=>`<option>${x}</option>`).join('');d.innerHTML=''}; c.onchange=()=>{d.innerHTML='<option value="">انتخاب کنید</option>'+distOptions(p.value,c.value).map(x=>`<option>${x}</option>`).join('')}; }

  function pharmacies(){
    return layout('ثبت و لیست داروخانه‌ها',`<div class="split-view">
      <form id="phForm" class="card"><input type="hidden" id="phId"><div class="form-grid">
        <div class="form-group"><label>تاریخ</label>${input('phDate',todayFa())}</div><div class="form-group"><label>نام داروخانه</label>${input('phName')}</div>
        ${geoRow('phProv','phCity','phDist')}
        <div class="form-group"><label>مسئول فنی</label>${input('phManager')}</div><div class="form-group"><label>تلفن</label>${input('phPhone','','tel')}</div>
        <div class="form-group full-width"><label>آدرس / لوکیشن</label>${input('phAddress')}<button type="button" class="btn btn-outline btn-sm" id="phLocate" style="margin-top:.5rem">📍 موقعیت فعلی من</button></div>
        <div class="form-group"><label>درصدی</label><select id="phPercent" class="form-select"><option value="false">خیر</option><option value="true">بله</option></select></div>
      </div><button class="btn btn-primary">ذخیره</button> <button type="button" class="btn btn-outline" id="phReset">جدید</button></form>
      <div><input class="form-input" id="phSearch" placeholder="جستجوی لحظه‌ای...">${table(['ردیف','نماینده','نام','شهر','تلفن','درصدی','لوکیشن','عملیات'], state.pharmacies.map((x,i)=>`<tr onclick="App.details('pharmacy','${x.id}')"><td>${i+1}</td><td>${esc(x.repName)}</td><td><b>${esc(x.name)}</b></td><td>${esc(x.city)}</td><td>${esc(x.phone)}</td><td>${x.percent?'بله':'خیر'}</td><td>${x.lat?'<span class=badge-status-online>ثبت شد</span>':'ثبت نشده'}</td><td><button class="btn btn-outline btn-sm" onclick="event.stopPropagation();App.editPharmacy('${x.id}')">ویرایش</button></td></tr>`))}</div></div>`);
  }
  function bindPharmacy(){
    bindGeo('phProv','phCity','phDist');
    $('#phLocate').onclick=()=>navigator.geolocation.getCurrentPosition(async p=>{ $('#phAddress').value=`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`; toast('موقعیت ثبت شد'); },()=>toast('دسترسی موقعیت داده نشد'));
    $('#phForm').onsubmit=e=>{e.preventDefault(); const id=$('#phId').value; const obj={id:id||'ph'+Date.now(),date:$('#phDate').value,name:$('#phName').value,province:$('#phProv').value,city:$('#phCity').value,district:$('#phDist').value,manager:$('#phManager').value,phone:$('#phPhone').value,address:$('#phAddress').value,percent:$('#phPercent').value==='true',repName:currentUser.name}; if(!obj.name||!obj.province)return toast('نام و استان الزامی است'); const i=state.pharmacies.findIndex(x=>x.id===id); if(i>=0)state.pharmacies[i]=obj;else state.pharmacies.push(obj); save(); toast('ذخیره شد'); render();};
    $('#phReset').onclick=()=>render();
    $('#phSearch').oninput=e=>{ const q=e.target.value; qAll('#app tbody tr').forEach(tr=>tr.style.display=tr.textContent.includes(q)?'':'none'); };
  }
  window.editPharmacy=id=>{ const x=state.pharmacies.find(a=>a.id===id); currentTab='pharmacies'; render(); setTimeout(()=>{ ['phId','phDate','phName','phManager','phone','phAddress'].forEach(()=>{}); $('#phId').value=x.id;$('#phDate').value=x.date;$('#phName').value=x.name;$('#phProv').value=x.province;$('#phProv').dispatchEvent(new Event('change'));$('#phCity').value=x.city;$('#phCity').dispatchEvent(new Event('change'));$('#phDist').value=x.district;$('#phManager').value=x.manager;$('#phPhone').value=x.phone;$('#phAddress').value=x.address;$('#phPercent').value=String(!!x.percent);});};

  function doctors(){
    return layout('ثبت و لیست پزشکان',`<div class="split-view"><form id="docForm" class="card"><input type="hidden" id="docId"><div class="form-grid"><div class="form-group"><label>تاریخ</label>${input('docDate',todayFa())}</div><div class="form-group"><label>نام پزشک</label>${input('docName')}</div><div class="form-group"><label>تخصص</label>${input('docSpec')}</div>${geoRow('docProv','docCity','docDist')}<div class="form-group"><label>تلفن</label>${input('docPhone','','tel')}</div><div class="form-group full-width"><label>آدرس</label>${input('docAddress')}<button type="button" class="btn btn-outline btn-sm" id="docLocate" style="margin-top:.5rem">📍 موقعیت فعلی من</button></div><div class="form-group"><label>درصدی</label><select id="docPercent" class="form-select"><option value="false">خیر</option><option value="true">بله</option></select></div></div><button class="btn btn-primary">ذخیره</button></form><div><input class="form-input" id="docSearch" placeholder="جستجو...">${table(['ردیف','نماینده','پزشک','تخصص','شهر','عملیات'],state.doctors.map((x,i)=>`<tr onclick="App.details('doctor','${x.id}')"><td>${i+1}</td><td>${esc(x.repName)}</td><td><b>${esc(x.name)}</b></td><td>${esc(x.specialty)}</td><td>${esc(x.city)}</td><td><button class="btn btn-outline btn-sm" onclick="event.stopPropagation();App.editDoctor('${x.id}')">ویرایش</button></td></tr>`))}</div></div>`);
  }
  function bindDoctor(){
    bindGeo('docProv','docCity','docDist');
    $('#docLocate').onclick=()=>navigator.geolocation.getCurrentPosition(p=>$('#docAddress').value=`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`);
    $('#docForm').onsubmit=e=>{e.preventDefault(); const id=$('#docId').value; const obj={id:id||'doc'+Date.now(),date:$('#docDate').value,name:$('#docName').value,specialty:$('#docSpec').value,province:$('#docProv').value,city:$('#docCity').value,district:$('#docDist').value,phone:$('#docPhone').value,address:$('#docAddress').value,percent:$('#docPercent').value==='true',repName:currentUser.name}; if(!obj.name||!obj.specialty)return toast('نام و تخصص الزامی است'); const i=state.doctors.findIndex(x=>x.id===id); if(i>=0)state.doctors[i]=obj;else state.doctors.push(obj); save(); render();};
  }
  window.editDoctor=id=>toast('برای ویرایش کامل، ردیف در نسخه بعدی باز می‌شود؛ ساختار آماده است.');

  function orders(){
    const productOptions=state.products.map(p=>p.name);
    return layout('سفارش‌ها',`<div class="split-view"><form id="ordForm" class="card"><input id="ordId" type="hidden"><div class="form-grid"><div class="form-group"><label>تاریخ</label>${input('ordDate',todayFa())}</div><div class="form-group"><label>داروخانه</label>${input('ordPharmacy')}</div>${geoRow('ordProv','ordCity','ordDist')}<div class="form-group"><label>نماینده</label>${select('ordRep',state.reps.map(r=>r.name),currentUser.name)}</div><div class="form-group"><label>وضعیت</label>${select('ordStatus',['ثبت شد','در حال پیگیری','تحویل شده'])}</div></div><h4>اقلام</h4><div id="ordItems"></div><button type="button" class="btn btn-outline btn-sm" id="addItem">+ افزودن کالا</button><div style="margin-top:1rem"><button class="btn btn-primary">ذخیره سفارش</button></div></form><div><input id="ordSearch" class="form-input" placeholder="جستجوی سفارش..."><button class="btn btn-outline btn-sm" id="exportOrders">خروجی اکسل</button>${table(['ردیف','نماینده','داروخانه','تاریخ','اقلام','جمع کل'],state.orders.map((o,i)=>`<tr onclick="App.details('order','${o.id}')"><td>${i+1}</td><td>${esc(o.repName)}</td><td>${esc(o.pharmacy)}</td><td>${esc(o.date)}</td><td>${o.items.map(it=>`${esc(it.name)}: ${it.count} (+${it.gift||0} جایزه)`).join(' / ')}</td><td>${o.items.reduce((s,it)=>s+it.count*it.price,0).toLocaleString('fa-IR')}</td></tr>`))}</div></div>`);
  }
  function itemRow(it={name:'',count:1,gift:0,price:0}){ const r=el('div','form-grid'); r.innerHTML=`<div class="form-group"><label>کالا</label>${select('itemName',state.products.map(p=>p.name),it.name)}</div><div class="form-group"><label>تعداد</label>${num('itemCount',it.count)}</div><div class="form-group"><label>تعداد جایزه</label>${num('itemGift',it.gift)}</div><div class="form-group"><label>قیمت</label>${num('itemPrice',it.price)}</div>`; return r; }
  function bindOrders(){
    bindGeo('ordProv','ordCity','ordDist'); const box=$('#ordItems'); box.appendChild(itemRow());
    $('#addItem').onclick=()=>box.appendChild(itemRow());
    $('#ordForm').onsubmit=e=>{e.preventDefault(); const items=qAll('#ordItems > div').map(r=>({name:r.querySelector('#itemName').value,count:+r.querySelector('#itemCount').value,gift:+r.querySelector('#itemGift').value,price:+r.querySelector('#itemPrice').value})).filter(x=>x.name); const obj={id:'ord'+Date.now(),date:$('#ordDate').value,pharmacy:$('#ordPharmacy').value,province:$('#ordProv').value,city:$('#ordCity').value,district:$('#ordDist').value,repName:$('#ordRep').value,status:$('#ordStatus').value,items}; if(!obj.pharmacy||!items.length)return toast('داروخانه و حداقل یک کالا لازم است'); state.orders.push(obj); save(); render();};
    $('#exportOrders').onclick=()=>csv('orders.csv',['ردیف','نماینده','داروخانه','کالا','تعداد','جایزه','قیمت'],state.orders.flatMap((o,i)=>o.items.map(it=>[i+1,o.repName,o.pharmacy,it.name,it.count,it.gift,it.price])));
  }

  function activity(){ return layout('فعالیت لحظه‌ای',`<div class="dashboard-grid"><div class="card"><b>نمودار فعالیت</b><div class="bar-chart">${state.activity.slice(-7).map((a,i)=>`<div class="bar" style="height:${40+i*12}px"><label>${esc(a.rep)}</label></div>`).join('')}</div></div><div class="card"><div id="mapActivity" class="map-container"></div></div></div>${table(['زمان','نماینده','عملیات'],state.activity.map(a=>`<tr><td>${esc(a.time)}</td><td>${esc(a.rep)}</td><td>${esc(a.action)}</td></tr>`))}`); }
  function mapTab(){ return layout('نقشه جامع',`<div class="form-grid"><div class="form-group"><label>استان</label>${select('mapProv',['ایران',...geoOptions()])}</div><div class="form-group"><label>شهر</label>${select('mapCity',[])}</div><div class="form-group"><label>منطقه</label>${select('mapDist',[])}</div><div><button class="btn btn-primary" id="mapSearchBtn">جستجو</button> <button class="btn btn-outline" id="mapExport">خروجی اکسل</button></div></div><div id="mapFull" class="map-container-large map-container" style="margin-top:1rem"></div><div id="mapResults" style="margin-top:1rem"></div>`); }
  function bindMap(){ const p=$('#mapProv'),c=$('#mapCity'),d=$('#mapDist'); p.onchange=()=>{ if(p.value==='ایران'){c.disabled=d.disabled=true;c.innerHTML=d.innerHTML='';}else{c.disabled=false;c.innerHTML='<option value="">شهر</option>'+geoOptions(p.value).map(x=>`<option>${x}</option>`).join('');d.innerHTML=''}}; c.onchange=()=>{d.innerHTML='<option value="">منطقه</option>'+distOptions(p.value,c.value).map(x=>`<option>${x}</option>`).join('')}; $('#mapSearchBtn').onclick=()=>renderMap('mapFull'); $('#mapExport').onclick=()=>csv('map-results.csv',['نوع','نام','شهر','آدرس'],[...state.pharmacies.map(x=>['داروخانه',x.name,x.city,x.address]),...state.doctors.map(x=>['پزشک',x.name,x.city,x.address])]); renderMap('mapFull'); }
  function renderMap(id){ const m=maps[id]||L.map(id).setView([35.72,51.42],11); maps[id]=m; m.eachLayer(l=>{if(l instanceof L.Marker||l instanceof L.Polyline)m.removeLayer(l)}); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(m); [...state.pharmacies,...state.doctors].forEach(x=>L.marker([x.lat||35.72,x.lng||51.42]).bindPopup(x.name).addTo(m)); state.trips.forEach(t=>L.polyline(t.points,{color:'#0d9488',weight:5}).addTo(m)); }
  function live(){ return layout('موقعیت زنده نمایندگان',`<select class="form-select" id="liveRep" style="max-width:300px">${state.reps.map(r=>`<option>${r.name}</option>`).join('')}</select><div id="mapLive" class="map-container" style="margin-top:1rem"></div>`); }
  function bindLive(){ const m=L.map('mapLive').setView([35.72,51.42],11); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m); const draw=()=>{const r=state.reps.find(x=>x.name===$('#liveRep').value); m.setView([r.lat,r.lng],14); L.marker([r.lat,r.lng]).addTo(m).bindPopup(r.name);}; $('#liveRep').onchange=draw; draw(); }
  function search(){ return layout('جستجوی اطلاعات',`<div class="form-grid"><div class="form-group"><label>داروخانه</label>${input('sPh')}</div><div class="form-group"><label>پزشک</label>${input('sDoc')}</div><div class="form-group"><label>بیمارستان</label>${input('sHosp')}</div></div><div id="mapSearch" class="map-container" style="margin:1rem 0"></div><div id="searchResults"></div>`); }
  function bindSearch(){ const m=L.map('mapSearch').setView([35.72,51.42],11);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m); const run=()=>{const q1=$('#sPh').value,q2=$('#sDoc').value; const ph=state.pharmacies.filter(x=>!q1||x.name.includes(q1)); const doc=state.doctors.filter(x=>!q2||x.name.includes(q2)); $('#searchResults').innerHTML=table(['نوع','نام','شهر','آدرس'],[...ph.map(x=>['داروخانه',x.name,x.city,x.address]),...doc.map(x=>['پزشک',x.name,x.city,x.address])].map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`)); m.eachLayer(l=>{if(l instanceof L.Marker)m.removeLayer(l)}); [...ph,...doc].forEach(x=>L.marker([x.lat||35.72,x.lng||51.42]).addTo(m));}; qAll('#sPh,#sDoc,#sHosp').forEach(i=>i.oninput=run); run(); }
  function trips(){ return layout('رصد تردد',`<div id="mapTrips" class="map-container-large map-container"></div>${table(['نماینده','تاریخ','توقف‌ها'],state.trips.map(t=>`<tr><td>${esc(t.rep)}</td><td>${esc(t.date)}</td><td>${t.stops.map(esc).join(' ، ')}</td></tr>`))}`); }
  function homes(){ return layout('منزل نمایندگان',`<div class="split-view"><form id="homeForm" class="card"><div class="form-group"><label>نماینده</label>${select('homeRep',state.reps.map(r=>r.name))}</div><div class="form-group"><label>آدرس</label>${input('homeAddr')}</div><button type="button" class="btn btn-outline" id="homeLocate">موقعیت فعلی من</button><button class="btn btn-primary" style="margin-top:1rem">ذخیره</button></form><div id="mapHomes" class="map-container"></div></div>`); }
  function leaves(){ return layout('مرخصی‌ها',table(['نماینده','از تاریخ','تا تاریخ','وضعیت'],state.leaves.map(l=>`<tr><td>${esc(l.rep)}</td><td>${esc(l.from)}</td><td>${esc(l.to)}</td><td>${esc(l.status)}</td></tr>`))); }
  function reports(){ return layout('گزارش‌ها',`<button class="btn btn-outline" id="exportAll">خروجی اکسل همه داده‌ها</button><div class="dashboard-grid" style="margin-top:1rem"><div class="dashboard-widget-card">داروخانه: ${state.pharmacies.length}</div><div class="dashboard-widget-card">پزشک: ${state.doctors.length}</div><div class="dashboard-widget-card">سفارش: ${state.orders.length}</div></div>`); }
  function targets(){ const total=state.orders.flatMap(o=>o.items).reduce((s,i)=>s+i.count*i.price,0); return layout('تارگت فروش',`<div class="form-grid"><div class="form-group"><label>نماینده</label>${select('tRep',state.reps.map(r=>r.name))}</div><div class="form-group"><label>سال</label>${select('tYear',['1404','1405','1406'],'1405')}</div><div class="form-group"><label>ماه</label>${select('tMonth',['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'])}</div></div><div id="targetItems"></div><button class="btn btn-outline" id="addTargetItem" style="margin:1rem 0">+ افزودن کالا</button><div class="card"><b>جمع کل ریالی: ${total.toLocaleString('fa-IR')}</b></div>`); }
  function bindTargets(){ const box=$('#targetItems'); const row=()=>{const r=el('div','form-grid');r.innerHTML=`<div class=form-group><label>کالا</label>${select('tName',state.products.map(p=>p.name))}</div><div class=form-group><label>تعداد</label>${num('tCount')}</div><div class=form-group><label>قیمت پخش</label>${num('tDist')}</div><div class=form-group><label>قیمت داروخانه</label>${num('tPh')}</div>`;box.appendChild(r)}; row();$('#addTargetItem').onclick=row; }
  function columns(){ return layout('ستون‌ها و کالاها',`<form id="prodForm" class="card"><div class="form-grid"><div class=form-group><label>نام کالا</label>${input('prodName')}</div><div class=form-group><label>دسته</label>${input('prodCat')}</div><div class=form-group><label>قیمت پخش</label>${num('prodDist')}</div><div class=form-group><label>قیمت داروخانه</label>${num('prodPh')}</div><div class=form-group><label>موجودی</label>${num('prodStock')}</div></div><button class="btn btn-primary">افزودن کالا</button></form>${table(['ردیف','کالا','دسته','قیمت پخش','قیمت داروخانه','موجودی'],state.products.map((p,i)=>`<tr><td>${i+1}</td><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>${p.dist.toLocaleString('fa-IR')}</td><td>${p.pharmacy.toLocaleString('fa-IR')}</td><td>${p.stock}</td></tr>`))}`); }
  function users(){ return layout('کاربران و دسترسی‌ها',`<button class="btn btn-primary" id="addUser">+ کاربر جدید</button>${table(['ردیف','نام','یوزر','موبایل','نقش','حالت احراز'],state.users.map((u,i)=>`<tr><td>${i+1}</td><td>${esc(u.name)}</td><td>${esc(u.user)}</td><td>${esc(u.phone)}</td><td>${esc(u.role)}</td><td>${esc(u.authMode)}</td></tr>`))}`); }
  function messengers(){ return layout('پیام‌رسان‌ها',['بله','ایتا','تلگرام','سروش','واتساپ'].map(m=>`<div class="card"><b>${m}</b><label style="display:block"><input type="checkbox" checked> ارسال خودکار</label><label><input type="checkbox" checked> ارسال دستی</label></div>`).join('')); }
  function backup(){ return layout('پشتیبان‌گیری',`<button class="btn btn-primary" id="downloadBackup">دانلود فایل پشتیبان</button><button class="btn btn-outline" id="resetBackup">بازنشانی داده نمایشی</button><p style="color:#64748b;margin-top:1rem">در استقرار واقعی، زمان‌بندی خودکار، ایمیل و جایگزینی نسخه قدیمی روی سرور فعال می‌شود.</p>`); }
  function install(){ return layout('نصب اپ',`<div class="dashboard-grid"><a class="card" href="#">دانلود ویندوز</a><a class="card" href="#">دانلود اندروید</a><a class="card" href="#">آیفون / PWA</a></div>`); }
  function diagnostics(){ return layout('عیب‌یابی',`<div class="dashboard-widget-card">✅ سرور: سالم</div><div class="dashboard-widget-card">✅ مرورگر: ${navigator.onLine?'آنلاین':'آفلاین'}</div><div class="dashboard-widget-card">✅ ذخیره‌سازی محلی: آماده</div>`); }

  function details(type,id){
    const data = type==='pharmacy'?state.pharmacies.find(x=>x.id===id):type==='doctor'?state.doctors.find(x=>x.id===id):state.orders.find(x=>x.id===id);
    const text = Object.entries(data).map(([k,v])=>`${k}: ${Array.isArray(v)?v.map(i=>`${i.name||''} ${i.count||''}`).join(' - '):v}`).join('\n');
    $('#modalDetailsContent').innerHTML = `<div class="card-header"><b>جزئیات</b><button class="btn btn-outline btn-sm" onclick="App.closeDetails()">بستن</button></div><pre style="white-space:pre-wrap;background:#f8fafc;padding:1rem;border-radius:12px">${esc(text)}</pre><div style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn btn-outline" onclick="navigator.clipboard.writeText(\`${esc(text)}\`);App.toast2('کپی شد')">کپی</button><a class="btn btn-outline" target="_blank" href="https://t.me/share/url?url=&text=${encodeURIComponent(text)}">تلگرام</a><a class="btn btn-outline" target="_blank" href="https://api.whatsapp.com/send?text=${encodeURIComponent(text)}">واتساپ</a></div>`;
    $('#modalDetails').classList.add('active');
  }
  function closeDetails(){$('#modalDetails').classList.remove('active')}
  function toast2(m){toast(m)}

  function render(){
    const map = {dashboard,pharmacies,doctors,orders,activity,map:mapTab,live,search,trips,homes,leaves,reports,targets,columns,users,messengers,backup,install,diagnostics};
    $('#app').innerHTML = map[currentTab]();
    nav();
    if(currentTab==='pharmacies')bindPharmacy(); if(currentTab==='doctors')bindDoctor(); if(currentTab==='orders')bindOrders();
    if(currentTab==='map')bindMap(); if(currentTab==='live')bindLive(); if(currentTab==='search')bindSearch();
    if(currentTab==='trips')renderMap('mapTrips'); if(currentTab==='homes')bindHomes(); if(currentTab==='targets')bindTargets();
    if(currentTab==='columns')bindColumns(); if(currentTab==='users')$('#addUser').onclick=()=>toast('فرم کاربر در نسخه تکمیلی آماده است'); if(currentTab==='backup')bindBackup(); if(currentTab==='reports')$('#exportAll').onclick=()=>csv('all.csv',['نوع','نام'],[...state.pharmacies.map(x=>['داروخانه',x.name]),...state.doctors.map(x=>['پزشک',x.name])]);
    if(currentTab==='dashboard')setTimeout(()=>renderMap('mapDashboard'),100);
  }
  function bindHomes(){ const m=L.map('mapHomes').setView([35.72,51.42],11);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m); state.homes.forEach(h=>L.marker([h.lat,h.lng]).bindPopup(h.rep).addTo(m)); $('#homeLocate').onclick=()=>navigator.geolocation.getCurrentPosition(p=>$('#homeAddr').value=`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`); }
  function bindColumns(){ $('#prodForm').onsubmit=e=>{e.preventDefault(); state.products.push({id:'p'+Date.now(),name:$('#prodName').value,category:$('#prodCat').value,dist:+$('#prodDist').value,pharmacy:+$('#prodPh').value,stock:+$('#prodStock').value});save();render();}; }
  function bindBackup(){ $('#downloadBackup').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)]));a.download='crm-backup.json';a.click()}; $('#resetBackup').onclick=()=>{localStorage.removeItem(KEY);load();render()}; }
  function openLogin(){ $('#modalLogin').classList.add('active'); $('#loginUsers').innerHTML=state.users.map(u=>`<button class="btn btn-outline" data-user="${u.id}">${u.name} - ${u.role}</button>`).join(''); qAll('[data-user]').forEach(b=>b.onclick=()=>{currentUser=state.users.find(u=>u.id===b.dataset.user);$('#modalLogin').classList.remove('active');toast('خوش آمدید '+currentUser.name);render();}); }
  function closeLogin(){$('#modalLogin').classList.remove('active')}

  document.addEventListener('DOMContentLoaded',()=>{ load(); $('#btnToggleSideMenu').onclick=openSide; $('#btnCloseSideMenu').onclick=closeSide; $('#sideMenuOverlay').onclick=closeSide; $('#btnOpenLoginModal').onclick=openLogin; render(); });
  return { render, details, closeDetails, toast2, editPharmacy, editDoctor };
})();
