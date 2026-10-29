/* Keep's Instagram sign-in helper (Cloudflare Worker).
   The app sends the one-time login code Instagram gave it; this trades it for a short-lived token using the app secret
   (which must never ship in the web app), reads the profile, and returns it. Nothing is stored or logged.
   Secrets: IG_APP_SECRET. Vars: IG_APP_ID, ALLOWED_ORIGIN (comma-separated site origins, e.g. https://you.github.io). */
const json=(o,status,h)=>new Response(JSON.stringify(o),{status:status||200,headers:Object.assign({'content-type':'application/json','cache-control':'no-store'},h)});
const b64=buf=>{const a=new Uint8Array(buf);let s='';for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s)};
export async function handle(req,env){
  const origin=req.headers.get('origin')||'',allowed=(env.ALLOWED_ORIGIN||'').split(',').map(s=>s.trim()).filter(Boolean),ok=allowed.includes(origin);
  const cors=ok?{'access-control-allow-origin':origin,vary:'origin','access-control-allow-headers':'content-type','access-control-allow-methods':'POST,OPTIONS'}:{};
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(req.method!=='POST'||new URL(req.url).pathname!=='/exchange')return json({error:'not found'},404,cors);
  if(!ok)return json({error:'forbidden'},403,cors);
  let b;try{b=await req.json()}catch(e){return json({error:'bad request'},400,cors)}
  const code=String(b.code||'').replace(/#_$/,''),redirect=String(b.redirect_uri||'');
  if(!code||!redirect.startsWith(origin))return json({error:'bad request'},400,cors);
  const t=await fetch('https://api.instagram.com/oauth/access_token',{method:'POST',body:new URLSearchParams({client_id:env.IG_APP_ID,client_secret:env.IG_APP_SECRET,grant_type:'authorization_code',redirect_uri:redirect,code})});
  if(!t.ok)return json({error:'Instagram did not accept the login'},400,cors);
  const tj=await t.json(),token=tj.access_token||(tj.data&&tj.data[0]&&tj.data[0].access_token);
  if(!token)return json({error:'no token'},502,cors);
  const m=await fetch('https://graph.instagram.com/me?'+new URLSearchParams({fields:'username,name,biography,account_type,profile_picture_url',access_token:token}));
  if(!m.ok)return json({error:'could not read the profile'},502,cors);
  const p=await m.json(),out={username:p.username||'',name:p.name||'',bio:p.biography||'',account_type:p.account_type||''};
  if(p.profile_picture_url){try{const r=await fetch(p.profile_picture_url);if(r.ok){const buf=await r.arrayBuffer();if(buf.byteLength<300000)out.picture='data:'+(r.headers.get('content-type')||'image/jpeg')+';base64,'+b64(buf)}}catch(e){}}
  return json(out,200,cors);
}
export default{fetch:(req,env)=>handle(req,env)};
