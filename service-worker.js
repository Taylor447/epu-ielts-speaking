const VERSION='epu-pwa-v2';
const SHELL_CACHE='epu-shell-'+VERSION;
const ASSET_CACHE='epu-pwa-assets-'+VERSION;
const SCOPE=self.registration.scope;
const APP_URL=new URL('./EPU%20IELTS%20Speaking.html',SCOPE).href;
const APP_PATH=new URL(APP_URL).pathname;
const CAMPUS_URL=new URL('./assets/campus3d/index.html',SCOPE).href;
const CAMPUS_PATH=new URL(CAMPUS_URL).pathname;
const CORE_URLS=[
 new URL('./manifest.webmanifest',SCOPE).href,
 new URL('./assets/pwa/icon-192.png',SCOPE).href,
 new URL('./assets/pwa/icon-512.png',SCOPE).href
];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(SHELL_CACHE);
 await Promise.allSettled(CORE_URLS.map(url=>cache.add(url)));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith('epu-shell-')||name.startsWith('epu-pwa-assets-')||name.startsWith('epu-offline-assets-'))if(name!==SHELL_CACHE&&name!==ASSET_CACHE)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   try{
    const response=await fetch(request);
    if(response.ok&&(url.pathname===APP_PATH||url.pathname===CAMPUS_PATH)){
      const cache=await caches.open(SHELL_CACHE);
      event.waitUntil(cache.put(url.pathname===CAMPUS_PATH?CAMPUS_URL:APP_URL,response.clone()).catch(()=>{}));
    }
    return response;
   }catch{return await caches.match(request)||await caches.match(url.pathname===CAMPUS_PATH?CAMPUS_URL:APP_URL)||Response.error()}
  })());
  return;
 }
 const campusRoot=new URL('./assets/campus3d/',SCOPE).pathname;
 if(url.pathname.startsWith(campusRoot)){
  event.respondWith((async()=>{
   const cache=await caches.open(ASSET_CACHE);
   try{
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response.clone()).catch(()=>{});
    if(response.ok)return response;
    return await cache.match(request)||response;
   }catch{return await cache.match(request)||Response.error()}
  })());
  return;
 }
 const root=new URL('./assets/',SCOPE).pathname;
 if(url.pathname.startsWith(root)||url.pathname.endsWith('/manifest.webmanifest'))event.respondWith((async()=>{
  const cache=await caches.open(ASSET_CACHE),cached=await cache.match(request);if(cached)return cached;
  const response=await fetch(request);if(response.ok)try{await cache.put(request,response.clone())}catch{}
  return response;
 })());
});
