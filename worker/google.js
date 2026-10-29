/* Verifies a Google Sign-In ID token (a JWT signed RS256 by Google) using Google's published keys. Works in Node 18+ and Workers. */
const CERTS='https://www.googleapis.com/oauth2/v3/certs';
let cache={at:0,keys:[]};
const unb64u=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function keys(force){
  if(!force&&Date.now()-cache.at<36e5&&cache.keys.length)return cache.keys;
  const r=await fetch(CERTS);if(!r.ok)throw new Error('certs');
  cache={at:Date.now(),keys:(await r.json()).keys||[]};return cache.keys;
}
/* returns {sub,email,name,picture} or throws */
export async function verifyGoogle(idToken,clientId){
  const [h,p,s]=String(idToken||'').split('.');if(!h||!p||!s)throw new Error('format');
  const head=JSON.parse(new TextDecoder().decode(unb64u(h)));
  if(head.alg!=='RS256')throw new Error('alg');
  let jwk=(await keys()).find(k=>k.kid===head.kid);
  if(!jwk&&Date.now()-cache.at>6e4)jwk=(await keys(true)).find(k=>k.kid===head.kid); /* Google may have rotated its keys inside the cache window */
  if(!jwk)throw new Error('key');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,unb64u(s),new TextEncoder().encode(h+'.'+p)))throw new Error('signature');
  const c=JSON.parse(new TextDecoder().decode(unb64u(p)));
  if(!['https://accounts.google.com','accounts.google.com'].includes(c.iss))throw new Error('issuer');
  if(!clientId||c.aud!==clientId)throw new Error('audience');
  if(!(c.exp*1000>Date.now()))throw new Error('expired');
  if(!c.sub||c.email_verified===false)throw new Error('account');
  return{sub:String(c.sub),email:String(c.email||''),name:String(c.name||''),picture:String(c.picture||'')};
}
