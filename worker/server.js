/* Runs the Instagram sign-in helper as a plain Node server (for Render, Fly, or any host with Node 18+).
   Same code as the Cloudflare Worker: it trades Instagram's one-time login code for a profile and keeps nothing.
   Env: IG_APP_ID, IG_APP_SECRET, ALLOWED_ORIGIN (comma-separated, e.g. https://keepxmeta.onrender.com), PORT. */
import http from 'node:http';
import {handle} from './instagram.js';
const env={IG_APP_ID:process.env.IG_APP_ID,IG_APP_SECRET:process.env.IG_APP_SECRET,ALLOWED_ORIGIN:process.env.ALLOWED_ORIGIN};
http.createServer(async(q,r)=>{
  try{
    const chunks=[];for await(const c of q)chunks.push(c);
    const url='http://'+(q.headers.host||'localhost')+q.url;
    const req=new Request(url,{method:q.method,headers:q.headers,body:['GET','HEAD','OPTIONS'].includes(q.method)?undefined:Buffer.concat(chunks)});
    if(q.url==='/health'){r.writeHead(200);return r.end('ok')}
    const res=await handle(req,env);
    r.writeHead(res.status,Object.fromEntries(res.headers));r.end(Buffer.from(await res.arrayBuffer()));
  }catch(e){r.writeHead(500);r.end('error')}
}).listen(process.env.PORT||8787);
