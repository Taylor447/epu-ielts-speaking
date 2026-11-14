(() => {
  const data = window.EPUCampusData;
  const byId = new Map(data.buildings.map(building => [building.id,building]));
  const $ = selector => document.querySelector(selector);
  const worldHost = $('#world'), map = $('#map'), chooser = $('#destination');
  const details = $('#place-content'), locationLabel = $('#location'), hint = $('#hint');
  const status = $('#status'), pointer = $('#marker'), touch = $('.touch');
  const money = new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'});
  const menuKey = 'epu-campus3d-menu-v1';
  const escape = text => String(text ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const inFrame = window.parent !== window;
  const parentOrigin = location.protocol === 'file:' ? '*' : location.origin;
  let world, walking = false, night = false, help = '', travelTarget = null;
  let selected = byId.get('gate'), reached = selected, nearby = null;
  let editMenu = false, menuMessage = '';
  const defaults = () => data.menu.map(([vi,en,price])=>({vi,en,price}));
  function validMenu(rows) {
    return Array.isArray(rows)&&rows.length>0&&rows.length<=24&&rows.every(item =>
      typeof item?.vi==='string'&&item.vi.trim().length>0&&item.vi.length<=55
      &&typeof item.en==='string'&&item.en.trim().length>0&&item.en.length<=65
      &&Number.isInteger(item.price)&&item.price>=0&&item.price<=10000000);
  }
  let menu = defaults(), customMenu = false;
  try {
    const saved = JSON.parse(localStorage.getItem(menuKey));
    if(validMenu(saved)){menu=saved;customMenu=true;}
  } catch { /* Defaults remain available when storage is disabled. */ }
  function syncEmbeddedHeight() {
    if(inFrame)window.parent.postMessage({type:'epu-campus-height',height:document.body.offsetHeight},parentOrigin);
  }
  new ResizeObserver(syncEmbeddedHeight).observe(document.body);
  function announce(text){status.textContent=text;}
  const mapX = x => 50 + x/1.55;
  const mapZ = z => 48 + z/1.40;
  const mapButtons = new Map();
  const road = document.createElement('div');
  road.className = 'map-road';map.append(road);
  const dot = document.createElement('div');dot.className='map-dot';dot.setAttribute('aria-hidden','true');map.append(dot);
  function moveDot(x,z){dot.style.left=mapX(x)+'%';dot.style.top=mapZ(z)+'%';}
  moveDot(-9,63);
  for(const building of data.buildings){
    const opt=document.createElement('option');
    opt.value=building.id;opt.textContent=building.name+' · '+building.role;chooser.append(opt);
    const button=document.createElement('button');
    button.type='button';button.className='map-block';
    button.textContent={gate:'Cổng',yard:'Sân',K:'K · 🍽'}[building.id]||building.id;
    button.title=building.name+' · '+building.role;button.setAttribute('aria-label',button.title);
    button.style.left=mapX(building.x)+'%';button.style.top=mapZ(building.z)+'%';
    button.addEventListener('click',()=>choose(building.id)); mapButtons.set(building.id,button);map.append(button);
  }
  chooser.addEventListener('change',()=>choose(chooser.value));
  function menuSection(){
    if(!editMenu)return `<section id="menu" class="lesson"><h3>Thực đơn căng tin</h3><p class="subtle">${customMenu?'Bảng giá đã chỉnh trên thiết bị này.':'Món và giá mẫu để luyện gọi món.'}</p>
      <table><thead><tr><th scope="col">Món ăn</th><th scope="col">Giá</th></tr></thead><tbody>${menu.map(item=>`<tr><td>${escape(item.vi)}<br><small lang="en">${escape(item.en)}</small></td><td>${money.format(item.price)}</td></tr>`).join('')}</tbody></table>
      <p role="status" id="menu-msg">${escape(menuMessage)}</p><button type="button" data-do="edit-menu">Sửa món và giá</button></section>`;
    return `<section id="menu" class="lesson"><h3>Sửa thực đơn</h3><p class="subtle">Thay đổi lưu trong trình duyệt này.</p>
      <form class="menu-form"><div id="menu-editor">${menu.map(item=>editRow(item)).join('')}</div>
      <div class="actions"><button type="button" data-do="add-menu">+ Thêm món</button><button type="submit" class="primary">Lưu</button><button type="button" data-do="cancel-menu">Hủy</button><button type="button" data-do="reset-menu">Dùng giá mẫu</button></div><p role="status" id="menu-msg"></p></form></section>`;
  }
  function editRow(item){
    return `<fieldset><legend>Món ăn</legend><label>Tên tiếng Việt<input name="vi" type="text" required maxlength="55" value="${escape(item.vi)}"></label>
      <label>Tên tiếng Anh<input name="en" type="text" required maxlength="65" value="${escape(item.en)}"></label>
      <label>Giá (đồng)<input name="price" type="number" required min="0" max="10000000" step="1" value="${item.price}"></label>
      <button type="button" data-do="remove-menu">Xóa món</button></fieldset>`;
  }
  function lesson(){
    return data.lessons[selected.id==='K'?'food':selected.kind] || data.lessons.gate;
  }
  function drawInfo(){
    const [title,question,answer,words] = lesson();
    details.innerHTML = `<h2 id="place-title">${escape(selected.name)}</h2>
      <p>${escape(selected.role)}</p>
      ${selected.id==='K'?'<p class="subtle">Căng tin nằm ở tầng 1 Nhà K. Khu bên trong chưa mô phỏng.</p>':''}
      <p class="subtle">Đang hoàn thiện mô hình bên ngoài; khu vực bên trong sẽ được bổ sung sau.</p>
      ${selected.id==='K'?menuSection():''}
      <section class="lesson"><h3>${escape(title)}</h3>
      <div class="words">${words.split(';').map((pair,index)=>{const [word,vi]=pair.split('|');return `<button type="button" data-word="${index}"><span lang="en">${escape(word)}</span><small>${escape(vi)}</small></button>`;}).join('')}</div>
      <blockquote lang="en">${escape(question)}</blockquote>
      <div class="actions"><button type="button" data-do="question">Nghe câu hỏi</button><button type="button" data-do="practice">Luyện trong IELTS Speaking</button></div>
      <details><summary>Nghe câu trả lời mẫu</summary><p lang="en">${escape(answer)}</p><button type="button" data-do="answer">Phát mẫu</button></details></section>`;
    chooser.value = selected.id;
    for(const [id,button] of mapButtons){
      if(id===selected.id)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');
    }
  }
  function speak(text){
    if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){announce('Trình duyệt chưa có giọng đọc tiếng Anh.');return;}
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang='en-US';utterance.rate=.88;
    const voice = speechSynthesis.getVoices().find(item=>item.localService&&/^en(-|_)/i.test(item.lang));
    if(voice)utterance.voice=voice;
    speechSynthesis.cancel();speechSynthesis.speak(utterance);
  }
  function sayWord(index){
    const pair=lesson()[3].split(';')[index];
    if(!pair)return;
    const [word,vi]=pair.split('|');
    announce(word+' · '+vi);speak(word);
  }
  function arrive(building){
    reached=building;travelTarget=null;locationLabel.textContent=building.name;
    hint.textContent='Đã đến khu vực bên ngoài. Chọn một vị trí trên mô hình hoặc bản đồ để xem thông tin.';
    announce('Đã đến '+building.name);drawInfo();
  }
  function choose(id,immediate=false){
    const building=byId.get(id);if(!building)return;
    if(travelTarget===building)return;
    selected=building;editMenu=false;menuMessage='';
    reached=null;travelTarget=building;
    locationLabel.textContent='Đang đến '+building.name;
    hint.textContent='Đang đi đến '+building.name+'…';drawInfo();
    if(world)world.travel(building,immediate);else arrive(building);
  }
  function showMenu(){
    $('#menu')?.scrollIntoView({block:'nearest'});
    $('#menu button')?.focus({preventScroll:true});
    announce('Bảng giá căng tin');
  }
  const launchPractice = () => {
    const part = selected.id==='C'?2:1;
    const [,question,answer]=lesson();
    if(inFrame)window.parent.postMessage({type:'epu-campus-practice',topic:selected.topic,part,place:selected.id,question,answer},parentOrigin);
    else {
      const url=new URL('../../EPU IELTS Speaking.html',location.href);
      url.searchParams.set('campus-topic',selected.topic);url.searchParams.set('campus-part',part);
      url.searchParams.set('campus-place',selected.id);
      url.searchParams.set('campus-question',question);url.searchParams.set('campus-answer',answer);
      location.assign(url);
    }
  };
  function saveMenu(rows){
    if(!validMenu(rows)){const target=$('#menu-msg');if(target)target.textContent='Nhập ít nhất một món đầy đủ tên và giá hợp lệ.';return;}
    menu=rows;customMenu=true;editMenu=false;menuMessage='Đã lưu thực đơn trên thiết bị.';
    try{localStorage.setItem(menuKey,JSON.stringify(menu));}
    catch{menuMessage='Trình duyệt không cho lưu. Bảng giá chỉ giữ trong phiên này.';}
    drawInfo();
  }
  details.addEventListener('submit',event=>{
    if(!event.target.matches('.menu-form'))return;
    event.preventDefault();
    const rows = [...event.target.querySelectorAll('fieldset')].map(row=>({
      vi:row.querySelector('[name="vi"]').value.trim(),
      en:row.querySelector('[name="en"]').value.trim(),
      price:row.querySelector('[name="price"]').valueAsNumber
    }));
    saveMenu(rows);
  });
  details.addEventListener('click',event=>{
    const button = event.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-word')){sayWord(Number(button.dataset.word));return;}
    switch(button.dataset.do){
      case 'question': speak(lesson()[1]);break;
      case 'answer': speak(lesson()[2]);break;
      case 'practice': launchPractice();break;
      case 'edit-menu': editMenu=true;drawInfo();$('#menu-editor input')?.focus();break;
      case 'cancel-menu': editMenu=false;drawInfo();$('#menu button')?.focus();break;
      case 'remove-menu': button.closest('fieldset')?.remove();break;
      case 'add-menu': {
        const editor=$('#menu-editor');
        if(editor.children.length>=24){$('#menu-msg').textContent='Tối đa 24 món.';break;}
        editor.insertAdjacentHTML('beforeend',editRow({vi:'',en:'',price:0}));
        editor.lastElementChild.querySelector('input').focus();
        break;
      }
      case 'reset-menu':
        menu=defaults();customMenu=false;editMenu=false;menuMessage='Đã trở về bảng giá mẫu.';
        try {localStorage.removeItem(menuKey);} catch {menuMessage='Đã dùng bảng giá mẫu trong phiên này.';}
        drawInfo();
        break;
    }
  });
  const keyMap = {arrowup:'w',arrowdown:'s',arrowleft:'a',arrowright:'d',w:'w',a:'a',s:'s',d:'d',shift:'shift'};
  window.addEventListener('keydown',event=>{
    if(!world||!walking||event.ctrlKey||event.altKey||event.metaKey||event.target.closest?.('button,input,select,textarea,a,summary'))return;
    const key=event.key.toLowerCase();
    if(keyMap[key]){event.preventDefault();world.key(keyMap[key],true);}
    if(key==='e'&&!event.repeat)world.interact();
  });
  window.addEventListener('keyup',event=>{const key=keyMap[event.key.toLowerCase()];if(key)world?.key(key,false);});
  window.addEventListener('blur',()=>world?.resetKeys());
  touch.querySelectorAll('button').forEach(button=>{
    const down=event=>{button.setPointerCapture(event.pointerId);world?.key(button.dataset.key,true);};
    const up=()=>world?.key(button.dataset.key,false);
    button.addEventListener('pointerdown',down);
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,up);
  });
  $('#camera').addEventListener('click',event=>{
    if(!world)return;
    walking=!walking;world.walk(walking);event.currentTarget.setAttribute('aria-pressed',walking);
    event.currentTarget.textContent=walking?'Nhìn từ trên':'Đi bộ';pointer.hidden=!walking;touch.hidden=!walking;
    hint.textContent=walking?'WASD hoặc mũi tên để đi. Kéo để nhìn. Nhấn E gần một tòa để xem thông tin bên ngoài.':'Kéo để xoay. Cuộn để thu phóng. Chọn một địa điểm để đi tới.';
    worldHost.tabIndex=0;worldHost.focus({preventScroll:true});
  });
  $('#night').addEventListener('click',event=>{
    night=!night;world?.night(night);event.currentTarget.setAttribute('aria-pressed',night);
    event.currentTarget.textContent=night?'Bật cảnh ngày':'Bật cảnh đêm';
  });
  const full=$('#full');
  full.hidden=!document.documentElement.requestFullscreen;
  full.addEventListener('click',async()=>{
    try {if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
    catch{announce('Trình duyệt hiện chưa cho phép mở toàn màn hình.');}
  });
  document.addEventListener('fullscreenchange',()=>{full.textContent=document.fullscreenElement?'Thoát toàn màn hình':'Toàn màn hình';});
  try {
    world = window.createEPUWorld(worldHost,data.buildings,{
      select:choose,arrive,word:sayWord,menu:showMenu,
      term(word,meaning){hint.textContent=word+' · '+meaning;announce(hint.textContent);speak(word);},
      routeFailed(){travelTarget=null;hint.textContent='Chưa tìm được đường tới vị trí này. Thử chọn lại địa điểm.';},
      lost(){help=hint.textContent;hint.textContent='Đang khôi phục hiển thị 3D. Bạn vẫn có thể dùng danh sách địa điểm.';},
      restored(){hint.textContent=help;},
      position(x,z,close,moving){
        moveDot(x,z);
        nearby=close;
        if(travelTarget&&!moving&&walking){
          if(locationLabel.textContent.startsWith('Đang đến')){
            travelTarget=null;locationLabel.textContent='Đang khám phá';
            hint.textContent='Bạn đang ở ngoài khu vực. Chạm một tòa nhà để xem thông tin.';
          }
        }
      }
    });
  } catch {
    worldHost.innerHTML='<div class="fallback"><div><h2>Không mở được cảnh 3D</h2><p>Bạn vẫn có thể chọn địa điểm, xem thông tin khu vực và thực đơn từ bảng bên cạnh.</p></div></div>';
    $('#camera').disabled=true;$('#night').disabled=true;
  }
  drawInfo();
  const place=new URLSearchParams(location.search).get('place');
  if(place&&place!=='gate'&&byId.has(place))choose(place,true);
})();
