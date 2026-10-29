/* Signed session tokens: base64url(payload).base64url(HMAC-SHA256). Works in Node 18+ and Cloudflare Workers (Web Crypto). */
const enc=new TextEncoder(),b64u=buf=>{const a=new Uint8Array(buf);let s='';for(const c of a)s+=String.fromCharCode(c);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const unb64u=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const key=secret=>crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
export async function signSession(uid,secret,days){
  const p=b64u(enc.encode(JSON.stringify({uid,exp:Date.now()+(days||30)*864e5})));
  return p+'.'+b64u(await crypto.subtle.sign('HMAC',await key(secret),enc.encode(p)));
}
/* returns the uid, or '' when the token is missing, forged or expired */
export async function readSession(token,secret){
  try{
    const [p,s]=String(token||'').split('.');if(!p||!s)return '';
    if(!await crypto.subtle.verify('HMAC',await key(secret),unb64u(s),enc.encode(p)))return '';
    const o=JSON.parse(new TextDecoder().decode(unb64u(p)));
    return o&&o.uid&&o.exp>Date.now()?String(o.uid):'';
  }catch(e){return ''}
}
