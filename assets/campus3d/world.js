/* Original procedural scenery. Three.js is distributed under the adjacent MIT license. */
window.createEPUWorld = function (host, buildings, callbacks) {
  const T = window.THREE;
  const renderer = new T.WebGLRenderer({antialias:true, alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
  renderer.outputEncoding = T.sRGBEncoding;
  host.append(renderer.domElement);
  const scene = new T.Scene();
  scene.fog = new T.Fog(0xc4dae1, 115, 315);
  const camera = new T.PerspectiveCamera(54, 1, .15, 420);
  const ambient = new T.HemisphereLight(0xf3f8fc, 0x766a5a, 1);
  const sun = new T.DirectionalLight(0xffedcf, 1.05);
  sun.position.set(-65, 92, 36);
  scene.add(ambient, sun);
  const materials = new Map(), geometries = {
    box:new T.BoxGeometry(), round:new T.CylinderGeometry(.5,.5,1,14), octagon:new T.CylinderGeometry(.5,.5,1,8),
    pole:new T.CylinderGeometry(.5,.66,1,7), leaf:new T.IcosahedronGeometry(.5,1)
  };
  const scratch = new T.Object3D();
  const ray = new T.Raycaster();
  function paint(color, luminous=false) {
    const key = color + ':' + luminous;
    if (!materials.has(key)) materials.set(key, new T.MeshLambertMaterial({
      color, emissive:luminous ? color : 0, emissiveIntensity:.12
    }));
    return materials.get(key);
  }
  function builder(root) {
    const groups = new Map(), picks = [];
    function piece(x,y,z,w,h,d,color,rotation=0,shape='box',glow=false) {
      const key = [color,shape,glow].join(':');
      if (!groups.has(key)) groups.set(key,{color,shape,glow,matrices:[]});
      scratch.position.set(x,y,z); scratch.rotation.set(0,rotation,0); scratch.scale.set(w,h,d); scratch.updateMatrix();
      groups.get(key).matrices.push(scratch.matrix.clone());
    }
    function hit(x,y,z,w,h,d,info) {
      const mesh = new T.Mesh(geometries.box, paint('#ffffff'));
      mesh.position.set(x,y,z); mesh.scale.set(w,h,d); mesh.updateMatrixWorld();
      mesh.userData = info; picks.push(mesh);
    }
    function sign(label,x,y,z,w,h,angle=0,bg='#173a56',ink='#fffaf0') {
      const canvas = document.createElement('canvas');
      canvas.width = 768; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bg; ctx.fillRect(0,0,768,128);
      ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 68px system-ui'; ctx.fillText(label,384,66,714);
      const texture = new T.CanvasTexture(canvas);
      texture.encoding = T.sRGBEncoding;
      const material = new T.MeshBasicMaterial({map:texture,side:T.DoubleSide});
      const mesh = new T.Mesh(new T.PlaneGeometry(w,h),material);
      mesh.position.set(x,y,z); mesh.rotation.y = angle;
      root.add(mesh);
      return {canvas,ctx,texture};
    }
    function finish() {
      for (const {color,shape,glow,matrices} of groups.values()) {
        const mesh = new T.InstancedMesh(geometries[shape],paint(color,glow),matrices.length);
        matrices.forEach((matrix,index) => mesh.setMatrixAt(index,matrix));
        mesh.instanceMatrix.needsUpdate = true;
        root.add(mesh);
      }
      return picks;
    }
    return {piece,hit,sign,finish};
  }
  const exterior = new T.Group();
  const outdoor = builder(exterior);
  const {piece, sign, hit} = outdoor;
  const palette = {classroom:'#dddacb',office:'#ded2bc',hall:'#c9aa83',library:'#c7c4ad',workshop:'#bcc9cc',lab:'#d9e0df',dorm:'#e6d8b8',showroom:'#c1d1d4',food:'#d2b68d',gate:'#e4ded0'};
  const glass = ['#4788a0','#375e79','#6598ae','#7caaba'];
  const darkGlass = '#203750';
  const obstacles = buildings.filter(b => !['yard','gate'].includes(b.id));
  const height = b => b.floors * 3.8 + .8;
  piece(0,-.38,0,280,.55,246,'#819675');
  piece(0,-.16,5,145,.32,112,'#a9b69b');
  piece(0,-.02,67,172,.2,10,'#bfbbae');
  piece(0,-.1,77,280,.18,16,'#4e606c');
  for (let x=-107;x<=107;x+=9) piece(x,.012,77,4,.025,.18,'#eee4bb');
  for (let i=0;i<7;i++) piece(-9,.018,71+i*1.45,6,.025,.67,'#f4efde');
  sign('HOÀNG QUỐC VIỆT',-34,1.85,64,16,.92,0,'#4e606c');
  for(const x of [-51,-9,17,49]) {
    piece(x,1.65,63,.15,3.3,.15,'#52606c');
    piece(x,3.14,63,.44,.48,.42,'#f9e2ad',0,'box',true);
  }
  const walks = [[-12,38,100,6],[-17,13,92,5],[8,-29,118,5],[-15,-.5,6,74],[15,33,5,29],[71,8,4,107],[-64,1,4,103]];
  walks.forEach(([x,z,w,d]) => piece(x,.02,z,w,.13,d,'#cdbda5'));
  piece(-9,.035,-5,20,.18,15,'#d5c3ad');
  for (let i=0;i<9;i++) piece(-18+i*2.35,.13,-5,.035,.018,14,'#b29c88');
  for (let i=0;i<6;i++) piece(-9,.135,-11+i*2.3,19,.018,.035,'#b29c88');
  piece(-9,.19,-7,12,.22,5,'#7f9b66');
  piece(-9,.35,-7,12.4,.3,5.3,'#b57e58');
  piece(-9,.52,-7,11.8,.09,4.9,'#7d9c62');
  for (const x of [-15,-3]) {
    piece(x,.64,-11,3,.13,.65,'#966b4c');
    for(const d of [-1,1]) piece(x+d,.3,-11,.18,.6,.45,'#526163');
    hit(x,.45,-11,3,.9,.65,{term:'bench',meaning:'ghế dài'});
  }
  // The central teaching block and east wing are linked by a covered walkway.
  for (const [x,z,w,d] of [[-35,24,12,3],[35,24,21,3]]) {
    piece(x,3.25,z,w,.46,d,'#b1b7af');
    for(let col=x-w/2+1;col<x+w/2;col+=3.6) piece(col,1.6,z-1,.29,3.2,.29,'#e0d8bd');
  }
  function facade(b) {
    const {id,x,z,w,d,floors,kind} = b, h = height(b), face = z+d/2;
    if (kind==='yard') {sign('SÂN TRƯỜNG',x,2.25,z-7,8,1.05,0,'#486343'); hit(x,.25,z,w,.5,d,{id});return;}
    // The entrance already has a freestanding gate; keep its location selectable without a blocking booth/building.
    if (id==='gate') {hit(-9,.45,62,8,.9,1.4,{id});return;}
    const skin = palette[kind];
    if (kind==='hall') piece(x,h/2,z,w,h,d,skin,Math.PI/8,'octagon');
    else piece(x,h/2,z,w,h,d,skin);
    piece(x,.27,z,w+.9,.54,d+.9,'#a59c8c');
    if(kind==='hall') piece(x,h+.36,z,w+.65,.7,d+.7,'#4a6b73',Math.PI/8,'octagon');
    else {
      piece(x,h+.12,z,w+.65,.38,d+.65,kind==='dorm'?'#815a47':'#536f75');
      piece(x+w*.27,h+.65,z-d*.25,w*.26,1,.25*d,'#718489');
    }
    for (let f=0;f<floors;f++) {
      const y=2+f*3.8;
      if (kind!=='hall') {
        piece(x,y+1.7,face+.11,w-.25,.28,.3,'#f0e8d7');
        for(let wx=x-w/2+2;wx<x+w/2-1.2;wx+=3.45) {
          if (f===0 && Math.abs(wx-x)<3) continue;
          piece(wx,y,face+.05,2.48,1.67,.17,darkGlass);
          piece(wx,y+.02,face+.15,2.29,1.49,.06,glass[(f+Math.round(wx+90))%glass.length],0,'box',true);
          piece(wx+.28,y,face+.21,.075,1.5,.045,'#c9d8d9');
        }
        if (kind==='dorm') {
          piece(x,y-.8,face+.58,w-.4,.18,.95,'#eee2c6');
          for(let wx=x-w/2+.7;wx<x+w/2;wx+=1.1) piece(wx,y-.52,face+1.02,.05,.54,.07,'#7e8173');
          piece(x,y-.24,face+1.02,w-.4,.055,.06,'#697677');
        }
        for(let wz=z-d/2+1.7;wz<face-1.2;wz+=3.35) {
          for(const side of [-1,1]) {
            piece(x+side*(w/2+.075),y,wz,.15,1.55,2.08,darkGlass);
            piece(x+side*(w/2+.17),y,wz,.08,1.37,1.9,glass[(f+2)%4],0,'box',true);
            piece(x+side*(w/2+.23),y,wz,.05,1.38,.07,'#c9d8d9');
          }
        }
      }
    }
    if(id==='A') {
      piece(x,h*.57,face+.24,8,h*.77,.45,'#f4f0e7');
      piece(x,h*.54,face+.50,4.9,h*.65,.18,'#4c839d',0,'box',true);
      for(let i=1;i<4;i++)piece(x,i*3.8+.4,face+.63,5.1,.12,.12,'#d0e5e7');
      sign('ĐẠI HỌC ĐIỆN LỰC',x,h-.6,face+.78,15,1.48,0,'#eee8dc','#ad3e37');
      for(const dx of [-3.7,3.7]) piece(x+dx,h*.48,face+.61,.55,h*.66,.55,'#f6f1e4');
    }
    const door = kind==='workshop' ? 4 : 2.4;
    const entryFace=kind==='hall'?z+d/2*Math.cos(Math.PI/8):face;
    piece(x,1.18,entryFace+.14,door,2.36,.32,'#203a50',0,'box',true);
    piece(x,2.85,entryFace+.85,Math.max(4.8,door+1.2),.22,1.8,kind==='food'?'#597c54':'#718995');
    piece(x,.2,entryFace+1.24,Math.max(4.8,door+1.2),.36,2.2,'#bcb29f');
    piece(x,.09,entryFace+2.14,Math.max(4.8,door+1.2),.16,.72,'#a99e89');
    sign((id==='K'?'CĂNG TIN · TẦNG 1':id==='gate'?'BẢO VỆ':b.name.toUpperCase()),x,3.43,entryFace+.30,Math.min(w-1,id==='K'?10:6.5),.85,0,id==='K'?'#486343':'#214760');
    hit(x,h*.5,z,w,h,d,{id});
  }
  buildings.forEach(facade);
  for (const x of [-18,0]) piece(x,2.1,62,.75,4.2,.75,'#ded7c4');
  piece(-9,4.16,62,19,.7,.8,'#d3cab6');
  sign('CỔNG TRƯỜNG',-9,4.16,62.46,12,.78,0,'#264d64');
  function tree(x,z,size,palm=false) {
    const bark = '#685a48';
    piece(x,size*.43,z,size*.10,size*.86,size*.10,bark,0,'pole');
    if(palm) {
      for(let i=0;i<6;i++) {
        const angle=i*Math.PI/3;
        piece(x+Math.cos(angle)*size*.32,size*(.98+i%2*.07),z+Math.sin(angle)*size*.32,size*.88,size*.18,size*.31,i%2?'#466d41':'#647f44',-angle,'leaf');
      }
    } else {
      for (let i=0;i<4;i++) {
        const angle=i*Math.PI/2;
        piece(x+Math.cos(angle)*size*.20,size*(.86+i%2*.13),z+Math.sin(angle)*size*.20,size*.85,size*.67,size*.8,['#3d654a','#54784c','#668650','#79945a'][i],angle,'leaf');
      }
    }
  }
  [[-57,43,6],[-17,55,6],[18,53,6],[29,53,4.3],[64,54,6],[-60,12,6],[-20,1,5],[2,1,5],[-19,-13,5],[-5,-14,6],[9,-10,5],[13,39,6],[17,37,5],[-62,-31,5],[-17,-38,4.8],[27,-38,5],[62,-38,6],[68,-7,5],[68,20,4]].forEach(([x,z,s],i)=>tree(x,z,s,i===10||i===11||i===12));
  for(const [x,z] of [[-38,37],[-16,39],[7,38],[29,37],[66,33],[69,-11],[0,-23],[-27,-29],[-55,60],[26,62]]) {
    piece(x,2.1,z,.12,4.2,.12,'#3a4854',0,'round');
    piece(x+.34,4.08,z,.8,.16,.35,'#465667');
    piece(x+.62,3.98,z,.32,.10,.30,'#fee3a8',0,'box',true);
    hit(x+.22,2.1,z,.65,4.2,.45,{term:'lamp post',meaning:'cột đèn'});
  }
  for(let i=0;i<14;i++) {
    const x=-116+i*17;
    const z=i%2?-71:-85;
    piece(x,5+i%5,z,12,(5+i%5)*2,10,['#a4ada5','#afbbb8','#beb8aa'][i%3]);
  }
  for(const [x,z,c] of [[22,48,'#667888'],[27,48,'#d0c6b0'],[67,47,'#784950'],[-55,49,'#39677a']]) {
    piece(x,.55,z,3.7,.84,1.76,c);
    piece(x,.97,z,1.95,.48,1.60,'#466476');
    for(const dx of [-1.05,1.05]) for(const dz of [-.84,.84]) piece(x+dx,.31,z+dz,.6,.58,.13,'#363940');
  }
  const exteriorPicks = outdoor.finish();
  scene.add(exterior);

  let night = false, walking = false, dirty = true, frameId = null, contextLost = false;
  let previousTime = null, drag = null, pointerIntent = null;
  let heading = Math.PI, pitch = -.06, orbitAngle = .12, orbitTilt = .83, orbitRadius = 139;
  const player = new T.Vector3(-9,1.67,63);
  const keys = new Set();
  const screen = new T.Vector2();
  const center = new T.Vector3(0,0,2);
  let path = [], goal = null;
  const pedestrian = new T.Group();
  const avatar = builder(pedestrian);
  avatar.piece(0,.95,0,.58,.67,.36,'#f1ae4d');
  avatar.piece(0,1.53,0,.43,.43,.43,'#d4aa80',0,'leaf');
  for(const s of [-1,1]) avatar.piece(s*.16,.37,0,.18,.66,.19,'#233d58');
  avatar.finish();scene.add(pedestrian);
  function applyLighting() {
    const sky = night ? 0x213750 : 0xaecfdf;
    scene.background = new T.Color(sky); scene.fog.color.setHex(sky);
    ambient.intensity = night ? .53 : 1;
    sun.intensity = night ? .32 : 1.06;
    sun.color.setHex(night?0xb1cbf2:0xffedcf);
    for(const material of materials.values()) if(material.emissive.getHex())material.emissiveIntensity=night?.7:.1;
    dirty=true;
  }
  function resize() {
    const w=host.clientWidth,h=host.clientHeight;
    if(!w||!h)return; camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);dirty=true;
  }
  const observer = new ResizeObserver(resize); observer.observe(host);resize();
  function near(x,z){return buildings.find(b=>Math.hypot(x-b.x,z-(b.z+b.d/2+2.75))<5);}
  function free(x,z){
    return x>-72&&x<75&&z>-56&&z<70&&!obstacles.some(b=>Math.abs(x-b.x)<b.w/2+.6&&Math.abs(z-b.z)<b.d/2+.6);
  }
  function planRoute(x,z) {
    const step=2, key=(ix,iz)=>ix+','+iz;
    const start=[Math.round(player.x/step),Math.round(player.z/step)],end=[Math.round(x/step),Math.round(z/step)];
    if(!free(end[0]*step,end[1]*step))return [];
    const queue=[start],seen=new Map([[key(...start),null]]);
    for(let i=0;i<queue.length;i++) {
      const cell=queue[i],name=key(...cell);
      if(name===key(...end)) {
        const result=[[x,z]];
        for(let at=cell;at;at=seen.get(key(...at))) result.unshift(at.map(v=>v*step));
        return result.slice(1);
      }
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const next=[cell[0]+dx,cell[1]+dz],id=key(...next);
        if(seen.has(id)||!free(next[0]*step,next[1]*step))continue;
        seen.set(id,cell);queue.push(next);
      }
    }
    return [];
  }
  function travel(b,immediate=false) {
    const z=b.z+b.d/2+2.75;
    const target = [[b.x,z],[b.x,z+2],[b.x-b.w/2-2,b.z],[b.x+b.w/2+2,b.z]].find(([x,z])=>free(x,z)&&free(Math.round(x/2)*2,Math.round(z/2)*2));
    if (!target){callbacks.routeFailed();return;}
    if (immediate||matchMedia('(prefers-reduced-motion: reduce)').matches) {
      clearRoute();
      player.x=target[0];player.z=target[1];dirty=true;callbacks.arrive(b);
      return;
    }
    path=planRoute(...target);
    if(!path.length && Math.hypot(player.x-target[0],player.z-target[1])>2) {
      callbacks.routeFailed();return;
    }
    goal=b;
    if(!path.length){goal=null;callbacks.arrive(b);}
  }
  function clearRoute(){path=[];goal=null;}
  function updatePosition(dt) {
    let dx=Number(keys.has('d'))-Number(keys.has('a')),dz=Number(keys.has('w'))-Number(keys.has('s'));
    if(walking&&(dx||dz)) {
      if(path.length)dirty=true;
      clearRoute();const distance=dt*(keys.has('shift')?10:6)/Math.hypot(dx,dz);
      const x=(Math.sin(heading)*dz-Math.cos(heading)*dx)*distance;
      const z=(Math.cos(heading)*dz+Math.sin(heading)*dx)*distance;
      if(free(player.x+x,player.z))player.x+=x;
      if(free(player.x,player.z+z))player.z+=z;
    } else if(path.length){
      const [x,z]=path[0],vx=x-player.x,vz=z-player.z,length=Math.hypot(vx,vz);
      const speed=dt*(walking?10:21);
      if(length>speed && length>.002){
        player.x+=vx*speed/length;player.z+=vz*speed/length;
        if(walking) {
          const target=Math.atan2(vx,vz);
          heading+=Math.atan2(Math.sin(target-heading),Math.cos(target-heading))*Math.min(1,dt*8);
        }
      } else {
        player.x=x;player.z=z;path.shift();
        if(!path.length&&goal){const selected=goal;goal=null;callbacks.arrive(selected);}
      }
    }
  }
  function point(dest) {
    if(dest.term){callbacks.term(dest.term,dest.meaning);return;}
    if(dest.id) callbacks.select(dest.id);
  }
  function cast(x,y) {
    ray.setFromCamera(screen.set(x,y),camera);
    return ray.intersectObjects(exteriorPicks)[0]?.object.userData;
  }
  function updateCamera() {
    pedestrian.visible=!walking;
    pedestrian.position.set(player.x,0,player.z);
    if(walking) {
      camera.position.copy(player);
      camera.lookAt(player.x+Math.sin(heading)*Math.cos(pitch),player.y+Math.sin(pitch),player.z+Math.cos(heading)*Math.cos(pitch));
    } else {
      // Narrow screens pull back enough to keep the campus in view.
      const r=orbitRadius*Math.max(1,1.22/Math.max(.25,camera.aspect));
      camera.position.set(center.x+Math.sin(orbitAngle)*Math.cos(orbitTilt)*r,r*Math.sin(orbitTilt),center.z+Math.cos(orbitAngle)*Math.cos(orbitTilt)*r);
      camera.lookAt(center);
    }
    camera.updateMatrixWorld();
  }
  function frame(time){
    if(contextLost)return;
    const dt = previousTime===null ? 0 : Math.min((time-previousTime)/1000,.045);
    previousTime=time;
    const prevX=player.x,prevZ=player.z,wasMoving=path.length>0;
    updatePosition(dt);
    const moved=player.x!==prevX||player.z!==prevZ;
    if(dirty||moved)updateCamera();
    if(pointerIntent){const intent=pointerIntent;pointerIntent=null;const dest=cast(intent.x,intent.y);if(dest)point(dest);}
    if(dirty||moved||wasMoving!==Boolean(path.length)){
      const close = walking ? near(player.x,player.z) : null;
      callbacks.position(player.x,player.z,close,Boolean(path.length));
      renderer.render(scene,camera);
      dirty=false;
    }
    frameId=requestAnimationFrame(frame);
  }
  const canvas = renderer.domElement, listeners=new AbortController(), options={signal:listeners.signal};
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0||drag)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
    canvas.setPointerCapture(event.pointerId);
  },options);
  canvas.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.moved&&Math.abs(dx)+Math.abs(dy)<5)return;
    drag.moved=true;drag.x=event.clientX;drag.y=event.clientY;
    if(walking){heading-=dx*.006;pitch=T.MathUtils.clamp(pitch+dy*.005,-1.22,1.06);}
    else {orbitAngle-=dx*.005;orbitTilt=T.MathUtils.clamp(orbitTilt+dy*.004,.26,1.31);}
    dirty=true;
  },options);
  canvas.addEventListener('pointerup',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    if(!drag.moved){const rect=canvas.getBoundingClientRect();pointerIntent={x:2*(event.clientX-rect.left)/rect.width-1,y:1-2*(event.clientY-rect.top)/rect.height};}
    drag=null;
  },options);
  canvas.addEventListener('pointercancel',()=>{drag=null;},options);
  canvas.addEventListener('wheel',event=>{
    if(walking)return;
    event.preventDefault();orbitRadius=T.MathUtils.clamp(orbitRadius+event.deltaY*.07,61,208);dirty=true;
  },{...options,passive:false});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;cancelAnimationFrame(frameId);callbacks.lost();},options);
  canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;dirty=true;previousTime=null;callbacks.restored();frameId=requestAnimationFrame(frame);},options);
  applyLighting();frameId=requestAnimationFrame(frame);
  return {
    travel,
    walk(value){walking=value;keys.clear();dirty=true;},
    night(value){night=value;applyLighting();},
    key(key,down){if(down)keys.add(key);else keys.delete(key);},
    resetKeys(){keys.clear();},
    interact(){
      const dest=walking&&cast(0,0);
      if(dest){point(dest);return;}
      const building=near(player.x,player.z);
      if(building)callbacks.select(building.id);
    }
  };
};
