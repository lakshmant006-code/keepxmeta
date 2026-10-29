/* Runs the Keep server as a plain Node server (for Render, Fly, or any host with Node 18+).
   Same code as the Cloudflare Worker: Instagram sign-in, plus (when FIREBASE_SERVICE_ACCOUNT and SESSION_SECRET are set) a small
   account store. Env: IG_APP_ID, IG_APP_SECRET, ALLOWED_ORIGIN (comma-separated, e.g. https://keepxmeta.onrender.com)
   SESSION_SECRET (long random string), FIREBASE_SERVICE_ACCOUNT (service account key JSON), PORT. */
import http from 'node:http';
import {handle} from './instagram.js';
import {makeStore,memoryStore} from './store.js';
const env={IG_APP_ID:process.env.IG_APP_ID,IG_APP_SECRET:process.env.IG_APP_SECRET,ALLOWED_ORIGIN:process.env.ALLOWED_ORIGIN,SESSION_SECRET:process.env.SESSION_SECRET};
if(env.SESSION_SECRET){
  try{env.store=await makeStore(process.env);console.log('accounts on ('+env.store.kind+')')}
  catch(e){console.error('could not start the account store:',e.message);env.store=memoryStore();console.log('accounts on (memory fallback)')}
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
