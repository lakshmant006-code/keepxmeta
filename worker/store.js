/* Where accounts live. Firestore when FIREBASE_SERVICE_ACCOUNT is set (JSON of a service account key), otherwise memory
   (fine for trying it out; accounts vanish on restart). Only identity is stored: Instagram id, username, name, dates.
   Memories, photos and voice notes never reach the server. */
const newGen=()=>[...crypto.getRandomValues(new Uint8Array(12))].map(b=>b.toString(16).padStart(2,'0')).join('');
export function memoryStore(){
  const m=new Map();
  return{
    async upsert(uid,d){const o=m.get(uid),now=Date.now(),n=Object.assign({},o,d,{createdAt:o?o.createdAt:now,gen:o?o.gen:newGen(),lastSeen:now});m.set(uid,n);return{isNew:!o,user:n}},
    async get(uid){return m.get(uid)||null},
    async touch(uid){const o=m.get(uid);if(o)o.lastSeen=Date.now()},
    async remove(uid){return m.delete(uid)},
    async count(){return m.size},
    kind:'memory'};
}
export async function makeStore(env){
  if(!env.FIREBASE_SERVICE_ACCOUNT){
    if(env.ALLOW_MEMORY_STORE==='1')return memoryStore(); /* trying it out only: accounts vanish on restart */
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not set (set ALLOW_MEMORY_STORE=1 to try accounts without a database)');
  }
  const {initializeApp,cert,getApps}=await import('firebase-admin/app'),{getFirestore}=await import('firebase-admin/firestore');
  const app=getApps()[0]||initializeApp({credential:cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT))}),db=getFirestore(app),col=db.collection('keepUsers');
  return{
    async upsert(uid,d){const ref=col.doc(uid);let isNew=false,user;
      await db.runTransaction(async t=>{const s=await t.get(ref),now=Date.now();isNew=!s.exists;user=Object.assign({},s.data(),d,{createdAt:isNew?now:s.data().createdAt,gen:isNew?newGen():s.data().gen,lastSeen:now});t.set(ref,user)});
      return{isNew,user}},
    async get(uid){const s=await col.doc(uid).get();return s.exists?s.data():null},
    async touch(uid){await col.doc(uid).update({lastSeen:Date.now()}).catch(()=>{})},
    async remove(uid){await col.doc(uid).delete();return true},
    async count(){const s=await col.count().get();return s.data().count},
    kind:'firestore'};
}
