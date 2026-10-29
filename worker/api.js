/* Keep's account server (Node on Render, or a Cloudflare Worker with a store). Sign in with Google: the app sends a Google ID token,
   this verifies it and keeps a small account (Google id, name, email, dates) plus a signed session token. Nothing else is stored.
   /google (POST), /me (GET, DELETE), /stats (GET). Secrets: SESSION_SECRET. Vars: GOOGLE_CLIENT_ID, ALLOWED_ORIGIN (comma-separated site origins). */
import {signSession,readSession} from './session.js';
import {verifyGoogle} from './google.js';
const json=(o,status,h)=>new Response(JSON.stringify(o),{status:status||200,headers:Object.assign({'content-type':'application/json','cache-control':'no-store'},h)});
const b64=buf=>{const a=new Uint8Array(buf);let s='';for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s)};
export async function handle(req,env){
  const origin=req.headers.get('origin')||'',allowed=(env.ALLOWED_ORIGIN||'').split(',').map(s=>s.trim()).filter(Boolean),ok=allowed.includes(origin);
  const cors=ok?{'access-control-allow-origin':origin,vary:'origin','access-control-allow-headers':'content-type,authorization','access-control-allow-methods':'GET,POST,DELETE,OPTIONS'}:{};
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  const path=new URL(req.url).pathname,acct=!!(env.store&&env.SESSION_SECRET);
  if(!ok)return json({error:'forbidden'},['/me','/stats','/google'].includes(path)?403:404,cors);
  if(path==='/stats'&&req.method==='GET')return acct?json({users:await env.store.count()},200,cors):json({error:'accounts are off'},404,cors);
  if(path==='/me'&&acct&&['GET','DELETE'].includes(req.method)){
    const uid=await readSession((req.headers.get('authorization')||'').replace(/^Bearer /,''),env.SESSION_SECRET);
    if(!uid)return json({error:'signed out'},401,cors);
    if(req.method==='DELETE'){await env.store.remove(uid);return json({deleted:true},200,cors)}
    const u=await env.store.get(uid);if(!u)return json({error:'no account'},404,cors);
    env.store.touch(uid);return json({username:u.username||'',name:u.name||'',provider:u.provider||'google',createdAt:u.createdAt},200,cors);
  }
  if(path==='/google'&&req.method==='POST'){
    if(!acct||!env.GOOGLE_CLIENT_ID)return json({error:'google sign-in is off'},404,cors);
    let b;try{b=await req.json()}catch(e){return json({error:'bad request'},400,cors)}
    let g;try{g=await verifyGoogle(b.credential,env.GOOGLE_CLIENT_ID)}catch(e){return json({error:'Google did not accept the sign-in'},401,cors)}
    const uid='g'+g.sub,r=await env.store.upsert(uid,{provider:'google',email:g.email,name:g.name,username:''}),out={name:g.name,email:g.email,provider:'google',created:r.isNew};
    if(g.picture.startsWith('https://')){try{const pr=await fetch(g.picture);if(pr.ok){const buf=await pr.arrayBuffer();if(buf.byteLength<300000)out.picture='data:'+(pr.headers.get('content-type')||'image/jpeg')+';base64,'+b64(buf)}}catch(e){}}
    out.session=await signSession(uid,env.SESSION_SECRET);return json(out,200,cors);
  }
  return json({error:'not found'},404,cors);
}
export default{fetch:(req,env)=>handle(req,env)};
