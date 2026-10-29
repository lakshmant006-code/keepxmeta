/* Runs the Keep server as a plain Node server (for Render, Fly, or any host with Node 18+).
   Sign in with Google plus (when FIREBASE_SERVICE_ACCOUNT and SESSION_SECRET are set) a small
   account store. Env: ALLOWED_ORIGIN (comma-separated, e.g. https://keepxmeta.onrender.com)
   SESSION_SECRET (long random string), GOOGLE_CLIENT_ID (for Google sign-in), FIREBASE_SERVICE_ACCOUNT (service account key JSON; or ALLOW_MEMORY_STORE=1 to try accounts without a database), PORT. */
import http from 'node:http';
import {handle} from './api.js';
import {makeStore} from './store.js';
const env={ALLOWED_ORIGIN:process.env.ALLOWED_ORIGIN,SESSION_SECRET:process.env.SESSION_SECRET,GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID};
if(env.SESSION_SECRET){
  try{env.store=await makeStore(process.env);console.log('accounts on ('+env.store.kind+')')}
  catch(e){console.error('could not start the account store:',e.message);console.log('accounts off: the account store did not start')}
}else console.log('accounts off: set SESSION_SECRET to turn them on');
http.createServer(async(q,r)=>{
  try{
    const chunks=[];for await(const c of q)chunks.push(c);
    const url='http://'+(q.headers.host||'localhost')+q.url;
    const req=new Request(url,{method:q.method,headers:q.headers,body:['GET','HEAD','OPTIONS','DELETE'].includes(q.method)?undefined:Buffer.concat(chunks)});
    if(q.url==='/health'){r.writeHead(200);return r.end('ok')}
    const res=await handle(req,env);
    r.writeHead(res.status,Object.fromEntries(res.headers));r.end(Buffer.from(await res.arrayBuffer()));
  }catch(e){r.writeHead(500);r.end('error')}
}).listen(process.env.PORT||8787);
