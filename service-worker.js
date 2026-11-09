const VERSION='epu-offline-v2';
const SHELL_CACHE='epu-shell-'+VERSION;
const ASSET_CACHE='epu-offline-assets-'+VERSION;
const SCOPE=self.registration.scope;
const APP_URL=new URL('./EPU%20IELTS%20Speaking.html',SCOPE).href;
const SHELL_URLS=[APP_URL];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(SHELL_CACHE);await cache.addAll(SHELL_URLS);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('epu-shell-')||name.startsWith('epu-pwa-assets-')||name.startsWith('epu-offline-assets-'))if(name!==SHELL_CACHE&&name!==ASSET_CACHE)await caches.delete(name);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{try{const response=await fetch(request);if(response.ok){const cache=await caches.open(SHELL_CACHE);event.waitUntil(cache.put(APP_URL,response.clone()).catch(()=>{}))}return response}catch{return await caches.match(request)||await caches.match(APP_URL)||Response.error()}})());return;
 }
 const root=new URL('./assets/',SCOPE).pathname;
 if(url.pathname.startsWith(root))event.respondWith((async()=>{const cache=await caches.open(ASSET_CACHE);const cached=await cache.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok)try{await cache.put(request,response.clone())}catch{}return response})());
});
