/* Keep's Instagram sign-in helper (Cloudflare Worker).
   The app sends the one-time login code Instagram gave it; this trades it for a short-lived token using the app secret
   (which must never ship in the web app), reads the profile, and returns it. Nothing is stored or logged.
   With env.store and SESSION_SECRET it also keeps a small account (Instagram id, username, name, dates) and returns a signed session
   token; /me and /stats serve that account. Secrets: IG_APP_SECRET, SESSION_SECRET. Vars: IG_APP_ID, ALLOWED_ORIGIN (comma-separated site origins, e.g. https://you.github.io). */
import {signSession,readSession} from './session.js';
import {verifyGoogle} from './google.js';
const json=(o,status,h)=>new Response(JSON.stringify(o),{status:status||200,headers:Object.assign({'content-type':'application/json','cache-control':'no-store'},h)});
const b64=buf=>{const a=new Uint8Array(buf);let s='';for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s)};
export async function handle(req,env){
  const origin=req.headers.get('origin')||'',allowed=(env.ALLOWED_ORIGIN||'').split(',').map(s=>s.trim()).filter(Boolean),ok=allowed.includes(origin);
  const cors=ok?{'access-control-allow-origin':origin,vary:'origin','access-control-allow-headers':'content-type,authorization','access-control-allow-methods':'GET,POST,DELETE,OPTIONS'}:{};
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  const path=new URL(req.url).pathname,acct=!!(env.store&&env.SESSION_SECRET);
  if(!ok)return json({error:'forbidden'},['/exchange','/me','/stats','/google'].includes(path)?403:404,cors);
  if(path==='/stats'&&req.method==='GET')return acct?json({users:await env.store.count()},200,cors):json({error:'accounts are off'},404,cors);
  if(path==='/me'&&acct&&['GET','DELETE'].includes(req.method)){
    const uid=await readSession((req.headers.get('authorization')||'').replace(/^Bearer /,''),env.SESSION_SECRET);
    if(!uid)return json({error:'signed out'},401,cors);
    if(req.method==='DELETE'){await env.store.remove(uid);return json({deleted:true},200,cors)}
    const u=await env.store.get(uid);if(!u)return json({error:'no account'},404,cors);
    env.store.touch(uid);return json({username:u.username||'',name:u.name||'',provider:u.provider||'instagram',createdAt:u.createdAt},200,cors);
  }
  if(path==='/google'&&req.method==='POST'){
    if(!acct||!env.GOOGLE_CLIENT_ID)return json({error:'google sign-in is off'},404,cors);
    let b;try{b=await req.json()}catch(e){return json({error:'bad request'},400,cors)}
    let g;try{g=await verifyGoogle(b.credential,env.GOOGLE_CLIENT_ID)}catch(e){return json({error:'Google did not accept the sign-in'},401,cors)}
    const uid='g'+g.sub,r=await env.store.upsert(uid,{provider:'google',email:g.email,name:g.name,username:''}),out={name:g.name,email:g.email,provider:'google',created:r.isNew};
    if(g.picture.startsWith('https://')){try{const pr=await fetch(g.picture);if(pr.ok){const buf=await pr.arrayBuffer();if(buf.byteLength<300000)out.picture='data:'+(pr.headers.get('content-type')||'image/jpeg')+';base64,'+b64(buf)}}catch(e){}}
    out.session=await signSession(uid,env.SESSION_SECRET);return json(out,200,cors);
  }
  if(req.method!=='POST'||path!=='/exchange')return json({error:'not found'},404,cors);
  let b;try{b=await req.json()}catch(e){return json({error:'bad request'},400,cors)}
  const code=String(b.code||'').replace(/#_$/,''),redirect=String(b.redirect_uri||'');
  if(!code||!redirect.startsWith(origin))return json({error:'bad request'},400,cors);
  const t=await fetch('https://api.instagram.com/oauth/access_token',{method:'POST',body:new URLSearchParams({client_id:env.IG_APP_ID,client_secret:env.IG_APP_SECRET,grant_type:'authorization_code',redirect_uri:redirect,code})});
  if(!t.ok)return json({error:'Instagram did not accept the login'},400,cors);
  const tj=await t.json(),token=tj.access_token||(tj.data&&tj.data[0]&&tj.data[0].access_token);
  if(!token)return json({error:'no token'},502,cors);
  const m=await fetch('https://graph.instagram.com/me?'+new URLSearchParams({fields:'user_id,username,name,biography,account_type,profile_picture_url',access_token:token}));
  if(!m.ok)return json({error:'could not read the profile'},502,cors);
  const p=await m.json(),out={username:p.username||'',name:p.name||'',bio:p.biography||'',account_type:p.account_type||''};
  if(p.profile_picture_url){try{const r=await fetch(p.profile_picture_url);if(r.ok){const buf=await r.arrayBuffer();if(buf.byteLength<300000)out.picture='data:'+(r.headers.get('content-type')||'image/jpeg')+';base64,'+b64(buf)}}catch(e){}}
  const uid=String(p.user_id||p.id||tj.user_id||(tj.data&&tj.data[0]&&tj.data[0].user_id)||'');
  if(acct&&uid){
    const r=await env.store.upsert(uid,{username:out.username,name:out.name});
    out.session=await signSession(uid,env.SESSION_SECRET);out.created=r.isNew;
  }
  return json(out,200,cors);
}
export default{fetch:(req,env)=>handle(req,env)};
