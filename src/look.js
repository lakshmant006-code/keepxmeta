/* ---------- Look: what people wore, read from the photos on this phone ---------- */
/* Keep already finds faces on the phone. Below each face it reads a patch for the top (shirt, jacket) and, when the photo shows that far, one
   for the bottom (pants, skirt), and names the colours it finds there. Nothing is uploaded. This reads colour only: it does not know a dress
   from a kurta, and it can still be wrong in strong light, so the chat says what it saw and shows the photo.
   How a colour gets its name: pixels go to CIELAB, a patch is split into its few real colours (so stripes and shadows do not blur into mud),
   and each colour is named by its nearest neighbours, by CIEDE2000, among 516 colours that people named in the xkcd colour survey (CC0). */
const LOOK_COLORS=['black','white','gray','red','orange','yellow','green','teal','blue','navy','purple','pink','brown','beige'];
const LOOK_TOP=/\b(t-?shirts?|shirts?|tops?|blouses?|jackets?|hoodies?|sweaters?|sweatshirts?|kurtas?|kurtis?|coats?|blazers?|cardigans?|tees?)\b/,LOOK_BOT=/\b(pants?|jeans|trousers?|shorts|skirts?|leggings?|bottoms?)\b/,LOOK_DRESS=/\b(dress(es)?|gowns?|sarees?|saris?|lehengas?|frocks?)\b/;
const lookDB=(()=>{let p;const open=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open('keep-looks',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
  const tx=(mode,fn)=>open().then(db=>new Promise((res,rej)=>{const t=db.transaction('photos',mode),r=fn(t.objectStore('photos'));t.oncomplete=()=>res(r&&r.result);t.onerror=t.onabort=()=>rej(t.error)}));
  return{get:k=>tx('readonly',s=>s.get(k)),put:(k,v)=>tx('readwrite',s=>s.put(v,k)),clear:()=>tx('readwrite',s=>s.clear())}})();
/*CORE*/
/* ---- colour science: sRGB -> CIELAB (D65), and the CIEDE2000 difference between two Lab colours ---- */
const lkLin=c=>{c/=255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)};
function lkLab(r,g,b){
  r=lkLin(r);g=lkLin(g);b=lkLin(b);
  const f=t=>t>.008856?Math.cbrt(t):7.787*t+16/116,
    x=f((.4124564*r+.3575761*g+.1804375*b)/.95047),y=f(.2126729*r+.7151522*g+.072175*b),z=f((.0193339*r+.119192*g+.9503041*b)/1.08883);
  return[116*y-16,500*(x-y),200*(y-z)];
}
function lkDE(A,B){
  const R=Math.PI/180,L1=A[0],a1=A[1],b1=A[2],L2=B[0],a2=B[1],b2=B[2];
  const C1=Math.hypot(a1,b1),C2=Math.hypot(a2,b2),Cb=(C1+C2)/2,G=.5*(1-Math.sqrt(Math.pow(Cb,7)/(Math.pow(Cb,7)+6103515625)));
  const p1=(1+G)*a1,p2=(1+G)*a2,c1=Math.hypot(p1,b1),c2=Math.hypot(p2,b2);
  const h=(b,a)=>{if(!a&&!b)return 0;const v=Math.atan2(b,a)/R;return v<0?v+360:v},h1=h(b1,p1),h2=h(b2,p2);
  const dL=L2-L1,dC=c2-c1;let dh=0;if(c1*c2){dh=h2-h1;if(dh>180)dh-=360;else if(dh<-180)dh+=360}
  const dH=2*Math.sqrt(c1*c2)*Math.sin(dh/2*R),Lm=(L1+L2)/2,Cm=(c1+c2)/2;
  let hm=h1+h2;if(c1*c2){hm=Math.abs(h1-h2)<=180?(h1+h2)/2:(h1+h2<360?(h1+h2+360)/2:(h1+h2-360)/2)}
  const T=1-.17*Math.cos((hm-30)*R)+.24*Math.cos(2*hm*R)+.32*Math.cos((3*hm+6)*R)-.2*Math.cos((4*hm-63)*R);
  const dt=30*Math.exp(-Math.pow((hm-275)/25,2)),Rc=2*Math.sqrt(Math.pow(Cm,7)/(Math.pow(Cm,7)+6103515625));
  const Sl=1+.015*Math.pow(Lm-50,2)/Math.sqrt(20+Math.pow(Lm-50,2)),Sc=1+.045*Cm,Sh=1+.015*Cm*T,Rt=-Math.sin(2*dt*R)*Rc;
  return Math.sqrt(Math.pow(dL/Sl,2)+Math.pow(dC/Sc,2)+Math.pow(dH/Sh,2)+Rt*(dC/Sc)*(dH/Sh));
}
const lkHex=h=>{const v=parseInt(h,16);return lkLab(v>>16,(v>>8)&255,v&255)};
/* Lab of a colour given in linear light (0..1), so light corrections can be applied before naming */
function lkLabLin(r,g,b){
  const f=t=>t>.008856?Math.cbrt(t):7.787*t+16/116,
    x=f((.4124564*r+.3575761*g+.1804375*b)/.95047),y=f(.2126729*r+.7151522*g+.072175*b),z=f((.0193339*r+.119192*g+.9503041*b)/1.08883);
  return[116*y-16,500*(x-y),200*(y-z)];
}
/* the survey colours, packed as rrggbb + a letter for the family (a=black ... n=beige), plus a few clothing anchors the survey is thin on */
const LK_TRAIN="56ae57ga8ff04g69d84fg894585k952e8fk388004g0a5f38g0c06f7i61de2ag3778bfi2242c7i05ffa6g017374hff0789l08787fha6c875ge78ea5l966ebdk983fb2kb2fba5g63b365g8ee53fgbdf8a3gd3b683m430541kffb2d0l410200m6b7c85cc8ffb0gfdde6cfffdf22ffff39an850e04d40fd14g3c4142cac4f06mc4fe82g2cfa1fg9a6200m875f42m7f8f4eg63a950gc87f89lb1fc99gf6688el53fe5cg4efd54gbcf5a6g107ab0i2138abifefcafn1d0200m247afdiffffb6n90fda9gfddc5cf9d0759ld767adl720058kffda03f014600g9900fak8e7618md1768flfdff63f95a3a6c089404g598556g3c73a8i021bf9i8fae22ge6f2a2n4b57dbid90166l015482i9d0216d4e0550kf9bc08fff073adc77986ld6fffeib2713dm699d4cgfb5581l3e82fci4f738ei5c8b15g1bfc06gcafffbib6ffbbga75e09m152effi8d5eb7k5f9e8fhfc86aal8c0034dfe86a4lfed0fckca0147ddb5856dddd618f41fdfeh21c36fgfe828cl4b6113g4da409gbeae8an0339f8ia88f59n964e02mff69aflc3fbf4iffff81fb1d27bg71aa34g4b0101d9af764ga6fbb2gffc512f0203e2ifd798flc74767la87dc2kfafe4bfc0022fd0e87cciad03dekc4fff7i33b864gf504c9l8756e4k017371hf7d560fbdf6fei75b84fg9cbb04g35ad6bgfffd37ff36196lfff4f2lfeff7ffcffdbcg0add08g87fd05g7bfdc7hbcecacg00555aha484ack548d44gc95efbk3ae57fg016795i87a922gf0944de5d1451k25ff29g01b44cgff6cb5lb7fffahaeff6egec2d01d040348j6ecb3cg5edc1fg4984b8i876e4bm58bc08g2fef10g2dfe54g0aff02g18d17bg1805dbi6258c4kff964fe3f012ck48c072ga8415bdf1da7anff0490l805b87k50a747gcfff04fffff7efff7fa7lef4026dfef69encfaf7bn3b719fifdc1c5l20c073g9b5fc0k742802ma4bf20gb8ffebhdc4d01ea2653emb1ff65gfdfdfecbefd73gaf6f09ma0025cl7f4e1emf5bf03ffffeb6nfffd74f436badi02c14dg2a7e19g490648k536267ccf0234d978a84ca66fb5k770001d7d7f7ccc071fekffc5cbl99cc04g000435j9d5783ke4cbffk5cb200gfbdd7en2a0134k044a05g0d75f8ife0002dcb9d06ffb7d07eb9cc81gedc8ffk8ab8feife02a2l65fe08g02ccfei836539m84b701gb66325m7f5112m5fa052g0bf9eahc760ffkf6cefck155084j7a5901m000133jbd6c48m26f7fdiaefd6cg9b8f55nde9dacl60460fm98f6b0g8af1fei2ee8bbh11875dgfdb0c0lf7022add5ab09fa5fbd5hfffe71ffffe40fd3494ed985e2bma6814cmff08e8l9d7651mfeffcan9e003adc5c9c7c9be5aag7b5804m276ab3i8cfd7eg6488eai056eeei0ffef9ha13905ma55af4kad0afdk004577i2b5d34gb59410fbb3f3fda87900m82cbb2hfe46a5lfe83ccl94a617ga88905f7f5f00m9e43a2k062e03g8a6e45mfdff38feedc5bf7ebd01g3b5b92i3c0008dcb00f5k002d04g658cbbi749551gb9ff66gc292a1k017b92id8863beaa23ffk08ff08gf29e8el6fc276gff5b00efdff52f8ffe09geecffek4f9153g9f2305dde0c62l916e99kffb16de3c4d03g010fcciceaefakc6fcffi01f9c6h929901g0b5509g9c6da5ka24857d90b134g01386aj75fd63g21fc0dgfec615ffffd01fdfc5fekb26400m7f5e00m048243g3b638ci84597ek411900m7b0323d04d9ffifbeeacnd7fffei4e7496i874c62kd5ffffiffbacdld1ffbdg448ee4id5869dl3d0734k4a0100m02590fg7bb274g526525gb5485dl735c12m028f1egb1916em49759cia0450em39ad48gb66a50m8cffdbha4be5cg05696bhac9362n01a049gd9544ddfa5ff7l82cafciacfffchc875c4k9a0200d030aa7ife019alf7879alff9408ee17701e0a481eg343837c6a79f7i3d1c02mbe0119d373e02ga9561emcaa0ffkca6641e88b378g980002dcb0162l5cac2dg769958ga2bffeiaf884anffa756e154406g856798k34013fk0a888ah6f7632g1e488fibc13fek7ef4cch76cd26g74a662g80013fdb1d1fci0652ffi045c5ah069af3iff000dd5170d7iacbf69g6c3461k2c6fbbid6b4fck960056l03719ciffffc2nb04e0fm87ae73gffffffb658b38g380835kfffe7af5ca904gd8dcd6c047495ib790d4k0b4008ged0dd9l8c000fdffff84fd2bd0afff474cd0485d1iffcfdcl040273j90e4c1hd5b60af363737c4b5d16ga9f971gc65102ee2ca76nb0ff9dg9ffeb0gfdaa48efe01b1lc1f80ag36013fk341c02m8eab12g02ab2egaaa662n610023d014d4eh580f41k8fff9fgdbb40cfbe03fdk840000dd0fefei3f9b0bg01153ej04d8b2hc04e01e0cff0cg0165fcicf6275lffd1dflceb301faaff32g53fca1gcb416bl677a04gc7fdb5gad8150mff028dl000000acea2fdke6daa6n6e750eg650021d01ff07g35063ekae7181k06470cg13eac9h00ffffhd1b26fn00035bjc79fefk06c2ach033500g9a0eeakbf77f6k89fe05g929591c75bbfdiffff14fc20078l96f97bgf97306e029386h95d0fcie50000d653700mff81c0l0343dfi15b01ag7e1e9ck";
const LK_EXTRA={navy:'000080 1b2a49 14213d 1f2a44 0a1f44 191970 1d2951 23395d',gray:'36454f 708090 a9a9a9 d3d3d3 4a4a4a b0b7bf',white:'fafafa f5f5f5 f8f8ff',black:'0b0b0b 1a1a1a 101418',beige:'f5f5dc e8dcc0 d9c7a7 ede0c8'};
let lkT=null;
function lkTrain(){
  if(lkT)return lkT;lkT=[];
  for(let i=0;i<LK_TRAIN.length;i+=7)lkT.push({l:lkHex(LK_TRAIN.substr(i,6)),f:LOOK_COLORS[LK_TRAIN.charCodeAt(i+6)-97]});
  for(const f in LK_EXTRA)LK_EXTRA[f].split(' ').forEach(h=>lkT.push({l:lkHex(h),f}));
  for(let L=0;L<=100;L+=4)lkT.push({l:[L,0,0],f:L<17?'black':L>91?'white':'gray'});
  return lkT;
}
/* the family of a Lab colour, and how clear the vote was (0..1) */
function lkFam(lab){
  const L=lab[0],C=Math.hypot(lab[1],lab[2]);
  if((L<13&&C<16)||(L<22&&C<9))return{f:'black',m:1};
  if(C<5)return{f:L<17?'black':L>91?'white':'gray',m:1};
  const T=lkTrain(),best=[];
  for(const t of T){const d=lkDE(lab,t.l);if(best.length<5||d<best[best.length-1][0]){best.push([d,t.f]);best.sort((a,b)=>a[0]-b[0]);if(best.length>5)best.pop()}}
  const v={};let tot=0;for(const [d,f] of best){const w=1/(d*d+4);v[f]=(v[f]||0)+w;tot+=w}
  const e=Object.entries(v).sort((a,b)=>b[1]-a[1])[0];return{f:e[0],m:e[1]/tot};
}
/* finer names people use for clothes; each keeps the family the reader gives its own colour */
const LK_FINE={maroon:'800000',burgundy:'800020 722f37',coral:'ff7f50',salmon:'fa8072',peach:'ffcba4',rust:'b7410e',mustard:'d4a017 e1ad01',olive:'808000 6b8e23','forest green':'228b22 0b6623',emerald:'50c878',mint:'98ff98 aaf0d1',sage:'9caf88',lime:'32cd32 bfff00',turquoise:'40e0d0',aqua:'5fd3d3 00ffff','sky blue':'87ceeb','royal blue':'4169e1',cobalt:'0047ab',lavender:'b57edc d8c8f0',lilac:'c8a2c8',plum:'8e4585',mauve:'b784a7',magenta:'ff00ff','hot pink':'ff69b4',tan:'d2b48c',camel:'c19a6b',khaki:'c3b091',cream:'fffdd0',charcoal:'36454f',silver:'c0c0c0'};
let lkFn=null;
const lkFine=()=>lkFn||(lkFn=Object.entries(LK_FINE).map(([n,h])=>{const p=h.split(' ').map(lkHex);return{n,p,f:lkFam(p[0]).f}}));
const lkNear=(lab,p)=>Math.min(...p.map(q=>lkDE(lab,q)));
const LK_TYP={red:45,orange:65,yellow:86,green:50,teal:55,blue:45,purple:42,pink:68,brown:45};
/* the name to show for a colour: a fine name when it sits right on one ("mustard"), else the family with its shade ("dark green") */
function lkName(lab,f){
  let b=null,bd=9;for(const x of lkFine()){if(x.f!==f)continue;const d=lkNear(lab,x.p);if(d<bd){bd=d;b=x.n}}
  if(b)return{n:b,fine:b};
  const L=lab[0],C=Math.hypot(lab[1],lab[2]);
  if(f==='black'||f==='white'||f==='navy'||f==='beige')return{n:f};
  if(f==='gray')return{n:L<38?'dark gray':L>72?'light gray':'gray'};
  const t=LK_TYP[f]||50;
  if(L<t-17)return{n:'dark '+f};if(L>t+(f==='yellow'?9:17))return{n:(f==='yellow'?'pale ':'light ')+f};if(C>72&&f!=='brown')return{n:'bright '+f};return{n:f};
}
/*END CORE*/
/* a colour name for one pixel (kept for callers that only have a pixel) */
function lookName(r,g,b){return lkFam(lkLab(r,g,b)).f}
/* The light in the photo. Two guesses at its colour (the brightest unclipped pixels, and a shades-of-gray average) must agree, and
   must both lie on the warm-cool axis that real lamps and daylight move along; then part of that cast is taken out. A lawn or a red
   wall fails the test and nothing is changed. Lw is the photo's own white level, so a white shirt in a dim room can still read white. */
function lookLight(cv,faces){
  const N=40,t=document.createElement('canvas');t.width=N;t.height=N;const c=t.getContext('2d');c.drawImage(cv,0,0,N,N);
  const d=c.getImageData(0,0,N,N).data,P=[];let s=[0,0,0],n=0;
  /* the people themselves are left out of the guess: their clothes are what is being named, so they cannot also be the proof */
  const body=(faces||[]).map(f=>{const [x,y,w]=f.b;return[x-w,x+w*2,y]}),inBody=(px,py)=>body.some(b=>px>=b[0]&&px<=b[1]&&py>=b[2]);
  for(let i=0;i<d.length;i+=4){const r=lkLin(d[i]),g=lkLin(d[i+1]),b=lkLin(d[i+2]),mx=Math.max(r,g,b),y=.2126*r+.7152*g+.0722*b,q=i/4,out=!inBody((q%N+.5)/N,(Math.floor(q/N)+.5)/N);
    P.push([y,r,g,b,mx,out]);if(!out||mx>.985||mx<.03)continue;s[0]+=Math.pow(r,6);s[1]+=Math.pow(g,6);s[2]+=Math.pow(b,6);n++}
  let gain=null;
  /* second guess: the brightest of the pixels that are already close to neutral (walls, paper, cloud, white cloth) */
  const nn=P.filter(p=>p[5]&&p[4]<=.985&&p[4]>=.08&&p[4]/(Math.min(p[1],p[2],p[3])+.004)<1.9).sort((a,b)=>b[0]-a[0]);
  if(n>N*N*.25&&nn.length>=N*N*.05){
    const e1=s.map(v=>Math.pow(v/n,1/6)),br=nn.slice(0,Math.max(8,Math.round(nn.length*.25)));
    const e2=[1,2,3].map(k=>br.reduce((a,p)=>a+p[k],0)/br.length);
    const uv=e=>[Math.log((e[0]+1e-4)/(e[1]+1e-4)),Math.log((e[2]+1e-4)/(e[1]+1e-4))],a=uv(e1),b2=uv(e2);
    const axis=q=>q[0]*q[1]<0&&Math.abs(q[0]-q[1])>.14&&Math.abs(q[0]-q[1])<.85; /* a cast a lamp or the sky could really make */
    if(axis(a)&&axis(b2)&&a[0]*b2[0]>0){
      const u=Math.sign(a[0])*Math.min(Math.abs(a[0]),Math.abs(b2[0])),v=Math.sign(a[1])*Math.min(Math.abs(a[1]),Math.abs(b2[1])),S=.7;
      let gr=Math.min(1.45,Math.max(.7,Math.exp(-u*S))),gb=Math.min(1.45,Math.max(.7,Math.exp(-v*S)));const k=1/(.2126*gr+.7152+.0722*gb);
      gain=[gr*k,k,gb*k];
    }
  }
  const Ls=P.map(p=>{const g=gain||[1,1,1];return p[4]>.985?100:lkLabLin(Math.min(1,p[1]*g[0]),Math.min(1,p[2]*g[1]),Math.min(1,p[3]*g[2]))[0]}).sort((a,b)=>a-b);
  return{gain,Lw:Ls[Math.floor(Ls.length*.97)]};
}
/* a colour as the photo's light would have it read: the cast taken out, and lightness measured against the photo's own white */
function lookAdjust(lin,light){
  const g=light.gain||[1,1,1];let lab=lkLabLin(Math.min(1,lin[0]*g[0]),Math.min(1,lin[1]*g[1]),Math.min(1,lin[2]*g[2]));
  if(light.Lw<75){const k=92/Math.max(light.Lw,58);lab=[Math.min(100,lab[0]*k),lab[1]*k,lab[2]*k]} /* a clearly dim photo: dim light fades colour as well as brightness */
  return lab;
}
/* the skin tone of this face, from the middle of it (cheeks and nose), as Lab */
function lookSkin(ctx,W,H,f){
  const [x,y,w,h]=f.b,x0=Math.max(0,Math.floor((x+w*.28)*W)),y0=Math.max(0,Math.floor((y+h*.38)*H)),pw=Math.max(2,Math.round(w*.44*W)),ph=Math.max(2,Math.round(h*.34*H));
  if(x0+pw>W||y0+ph>H)return null;
  const d=ctx.getImageData(x0,y0,pw,ph).data,st=Math.max(1,Math.floor(Math.sqrt(pw*ph/150))),A=[[],[],[]];
  for(let j=0;j<ph;j+=st)for(let i=0;i<pw;i+=st){const k=(j*pw+i)*4,l=lkLab(d[k],d[k+1],d[k+2]);A[0].push(l[0]);A[1].push(l[1]);A[2].push(l[2])}
  if(A[0].length<6)return null;
  return A.map(a=>{a.sort((p,q)=>p-q);return a[a.length>>1]});
}
/* The colours of a rectangle of the photo (fractions of its size). Pixels near the middle count most, this person's skin is set aside,
   and what is left is split into up to three real colours. The biggest is the answer; a clear second one is kept too (stripes, prints). */
function lookPatch(cv,ctx,x0,y0,x1,y1,skin,light){
  const W=cv.width,H=cv.height,cx0=Math.max(0,x0),cy0=Math.max(0,y0),cx1=Math.min(1,x1),cy1=Math.min(1,y1);
  if(cx1<=cx0||cy1<=cy0||(cx1-cx0)*(cy1-cy0)<.55*(x1-x0)*(y1-y0))return null; /* mostly outside the photo */
  const px=Math.floor(cx0*W),py=Math.floor(cy0*H),pw=Math.max(2,Math.min(W-px,Math.round((cx1-cx0)*W))),ph=Math.max(2,Math.min(H-py,Math.round((cy1-cy0)*H)));
  const d=ctx.getImageData(px,py,pw,ph).data,st=Math.max(1,Math.floor(Math.sqrt(pw*ph/900)));
  let P=[],all=[],wAll=0,wNs=0;
  for(let j=0;j<ph;j+=st)for(let i=0;i<pw;i+=st){
    const k=(j*pw+i)*4,r=d[k],g=d[k+1],b=d[k+2],l=lkLab(r,g,b),u=((px+i)/W-(x0+x1)/2)/((x1-x0)/2),v=(j/ph-.5)*2,w=Math.exp(-u*u*1.3)*(1-.2*Math.abs(v));
    let sk;if(skin)sk=Math.hypot((l[0]-skin[0])*.45,l[1]-skin[1],l[2]-skin[2])<8;
    else{const n=r>90&&g>40&&b>20&&r>g&&g>b&&r-b>18&&r-g<75&&r-b<130;sk=n}
    const p={l,w,lin:[lkLin(r),lkLin(g),lkLin(b)]};all.push(p);wAll+=w;if(!sk){P.push(p);wNs+=w}
  }
  if(wNs<wAll*.35){P=all;wNs=wAll} /* the clothes are close to the skin tone: read everything */
  if(P.length<6)return null;
  /* k-means in Lab with lightness counting for less, so a fold or a shadow stays with its colour */
  const F=p=>[p.l[0]*.55,p.l[1],p.l[2]],X=P.map(F),K=Math.min(3,P.length);
  let m=[0,0,0];P.forEach((p,i)=>{for(let c=0;c<3;c++)m[c]+=X[i][c]*p.w/wNs});
  const D=(a,b)=>(a[0]-b[0])*(a[0]-b[0])+(a[1]-b[1])*(a[1]-b[1])+(a[2]-b[2])*(a[2]-b[2]);
  const cen=[];let far=0,fd=-1;X.forEach((x,i)=>{const q=D(x,m);if(q>fd){fd=q;far=i}});cen.push(X[far].slice());
  while(cen.length<K){let bi=0,bd=-1;X.forEach((x,i)=>{const q=Math.min(...cen.map(c=>D(x,c)));if(q>bd){bd=q;bi=i}});cen.push(X[bi].slice())}
  const as=new Array(P.length).fill(0);
  for(let it=0;it<8;it++){
    X.forEach((x,i)=>{let b=0,bd=1e18;cen.forEach((c,k)=>{const q=D(x,c);if(q<bd){bd=q;b=k}});as[i]=b});
    cen.forEach((c,k)=>{let s=[0,0,0],sw=0;X.forEach((x,i)=>{if(as[i]===k){const w=P[i].w;s[0]+=x[0]*w;s[1]+=x[1]*w;s[2]+=x[2]*w;sw+=w}});if(sw)cen[k]=[s[0]/sw,s[1]/sw,s[2]/sw]});
  }
  /* each cluster's own colour: the mean light of its members, leaving out the darkest third (folds and shadow) */
  let cl=cen.map((c,k)=>{const mem=P.filter((p,i)=>as[i]===k);if(!mem.length)return null;
    const Ls=mem.map(p=>p.l[0]).sort((a,b)=>a-b),cut=Ls[Math.floor(Ls.length*.33)],use=mem.filter(p=>p.l[0]>=cut),sw=use.reduce((a,p)=>a+p.w,0);
    const lin=[0,1,2].map(q=>use.reduce((a,p)=>a+p.lin[q]*p.w,0)/sw),hi=mem.slice().sort((a,b)=>a.l[0]-b.l[0])[Math.floor(mem.length*.85)].lin;return{w:mem.reduce((a,p)=>a+p.w,0),lin,hi,lab:lkLabLin(lin[0],lin[1],lin[2])}}).filter(Boolean);
  /* shades of one colour that were split apart go back together */
  for(let a=0;a<cl.length;a++)for(let b=cl.length-1;b>a;b--)if(lkDE(cl[a].lab,cl[b].lab)<9){const A=cl[a],B=cl[b],w=A.w+B.w;A.lin=[0,1,2].map(q=>(A.lin[q]*A.w+B.lin[q]*B.w)/w);if(B.hi[1]>A.hi[1])A.hi=B.hi;A.w=w;A.lab=lkLabLin(A.lin[0],A.lin[1],A.lin[2]);cl.splice(b,1)}
  cl.sort((a,b)=>b.w-a.w);
  const top=cl[0],share=top.w/wNs;if(share<.3)return null;
  /* shading only ever darkens cloth, so whether a neutral is white or gray is judged from its bright end */
  const read=c=>{const raw=lkFam(c.lab);let adj=lookAdjust(c.lin,light),fa=lkFam(adj);
    if(raw.f==='black'&&c.lab[0]<14&&Math.hypot(c.lab[1],c.lab[2])<8&&fa.f!=='gray'){fa=raw;adj=c.lab.slice()} /* a correction must not paint colour onto black */
    if(fa.f==='gray'&&Math.hypot(adj[1],adj[2])<7&&lookAdjust(c.hi,light)[0]>=86){fa={f:'white',m:.8};adj[0]=Math.max(adj[0],92)}
    const nm=lkName(adj,fa.f);return{c:fa.f,cr:raw.f,n:nm.n,fine:nm.fine||null,l:adj.map(v=>Math.round(v)),m:fa.m}};
  const R=read(top),out={c:R.c,cr:R.cr,n:R.n,fine:R.fine,l:R.l,p:+(Math.min(1,share*(.55+.45*R.m))*(R.c===R.cr?1:.7)).toFixed(2)};
  const s2=cl[1];
  if(s2&&s2.w/wNs>=.24&&lkDE(top.lab,s2.lab)>=20){const R2=read(s2);if(R2.c!==R.c){out.c2=R2.c;out.n2=R2.n;out.l2=R2.l}}
  return out;
}
/* "dark blue", "light gray", "bright red": the shade of a colour from its average pixel (kept for callers that have a pixel) */
function lookShade(c,r,g,b){return lkName(lkLab(r,g,b),c).n}
/* the outfit for each face (same order) */
function lookRead(cv,faces){
  const ctx=cv.getContext('2d',{willReadFrequently:true}),light=lookLight(cv,faces);
  return faces.map(f=>{
    const [x,y,w,h]=f.b,ar=cv.height/cv.width,fb=y+h,cx=x+w/2;
    const fw=w,fh=h,half=Math.max(fw*.95,fh/ar*.7),skin=lookSkin(ctx,cv.width,cv.height,f);
    const top=lookPatch(cv,ctx,cx-half*.7,fb+fh*.55,cx+half*.7,fb+fh*1.5,skin,light),bottom=lookPatch(cv,ctx,cx-half*.55,fb+fh*3.3,cx+half*.55,fb+fh*4.5,skin,light);
    const o={top:top&&top.c,bottom:bottom&&bottom.c,topN:top&&top.n,bottomN:bottom&&bottom.n,topP:top&&top.p,bottomP:bottom&&bottom.p};
    if(top)o.t=top;if(bottom)o.b=bottom;return o;
  });
}
/* the looks for one photo, read once and kept */
async function lookOf(m){
  const c=await lookDB.get(m.id);if(c&&c.v===3)return c;
  const rec=await facesOf(m),img=await loadImg(src(m)),k=Math.min(1,500/Math.max(img.naturalWidth,img.naturalHeight)),cv=document.createElement('canvas');
  cv.width=Math.round(img.naturalWidth*k);cv.height=Math.round(img.naturalHeight*k);cv.getContext('2d',{willReadFrequently:true}).drawImage(img,0,0,cv.width,cv.height);
  const out={v:3,people:lookRead(cv,rec.faces)};await lookDB.put(m.id,out);return out;
}
/* ---- the chat side ---- */
/* words people use for colours that are not family or fine names themselves */
const LOOK_ALIAS={grey:'gray',wine:'burgundy',crimson:'red',scarlet:'red',gold:'yellow',golden:'yellow',ivory:'white','off white':'white','off-white':'white',cyan:'teal',fuchsia:'magenta',rose:'pink',blush:'pink',indigo:'blue',violet:'purple',terracotta:'rust','burnt orange':'rust','navy blue':'navy','baby blue':'sky blue','bottle green':'forest green','olive green':'olive','mint green':'mint','sage green':'sage','lime green':'lime','neon green':'lime',nude:'beige',sand:'beige',chocolate:'brown',coffee:'brown'};
/* the colours asked about: each is a family, perhaps a fine name ("maroon") and perhaps a shade ("dark", "light", "bright") */
function lookParse(q){
  let s=' '+q.toLowerCase().replace(/[^a-z0-9\- ]/g,' ').replace(/\s+/g,' ')+' ';const qs=[],cols=[];
  let pe=null;try{pe=chatPeople()}catch(e){}
  const words=Object.keys(LOOK_ALIAS).concat(Object.keys(LK_FINE),LOOK_COLORS).sort((a,b)=>b.length-a.length);
  for(const w of words){
    const re=new RegExp('\\b(?:(dark|deep|light|pale|bright|neon) )?'+w.replace('-','[- ]')+'\\b'),m=s.match(re);if(!m)continue;
    if(pe&&pe.has(w))continue; /* "Rose", "Olive", "Violet": a person you know, not a colour */
    s=s.replace(re,' ');
    const name=LOOK_ALIAS[w]||w,fine=LK_FINE[name]?name:null,fam=fine?lkFine().find(x=>x.n===fine).f:name;
    const mod=m[1]?({deep:'dark',pale:'light',neon:'bright'})[m[1]]||m[1]:null;
    if(!qs.some(x=>x.fam===fam&&x.fine===fine&&x.mod===mod)){qs.push({fam,fine,mod});cols.push((mod?mod+' ':'')+(fine||fam))}
  }
  s=' '+q.toLowerCase().replace(/[^a-z0-9\- ]/g,' ')+' ';
  const dress=LOOK_DRESS.test(s),top=LOOK_TOP.test(s),bot=LOOK_BOT.test(s);
  if(!qs.length&&!dress)return null;
  if(!top&&!bot&&!dress&&!/\b(wearing|wore|dressed|outfit|clothes|colou?r)\b/.test(s))return null; /* just "a blue sky" is not about clothes */
  return{cols,qs,part:top&&!bot?'top':bot&&!top?'bottom':null,dress};
}
/* how well one read colour answers one asked colour: 2 = that colour, 1 = close (same family for a fine name, or the second colour of a print), 0 = no */
function lookHit1(r,q){
  if(!r)return 0;
  const L=r.l?r.l[0]:50,C=r.l?Math.hypot(r.l[1],r.l[2]):30;
  const shade=!q.mod||(q.mod==='dark'?(L<=42||r.c==='navy'||/^dark /.test(r.n||'')):q.mod==='light'?L>=64:C>=52);
  const fam=f=>!!f&&(f===q.fam||(q.fam==='blue'&&f==='navy')||(q.fam==='navy'&&f==='blue'&&L<30));
  let sc=0;
  if(q.fine){if(r.fine===q.fine||(r.l&&lkNear(r.l,lkFine().find(x=>x.n===q.fine).p)<=12))sc=2;else if(fam(r.c)||fam(r.cr))sc=1}
  else if(fam(r.c)||fam(r.cr))sc=2;
  if(sc&&!shade)sc=0;
  if(!sc&&fam(r.c2))sc=1;
  return sc;
}
const lookPart=(p,k)=>p[k==='top'?'t':'b']||(p[k]?{c:p[k],cr:p[k],n:p[k+'N']||p[k]}:null);
/* best score and which part of the outfit gave it */
function lookHit(p,L){
  let best=0,part=null;
  for(const k of (L.part?[L.part]:['top','bottom'])){const r=lookPart(p,k);for(const q of L.qs){const sc=lookHit1(r,q);if(sc>best){best=sc;part=k}}}
  return{sc:best,part};
}
const lookSay=r=>r?(r.n||r.c)+(r.n2?' and '+r.n2:''):'';
/* "what was Kalyan wearing", "what did Mina wear last Friday": ask about a person, not a colour */
function lookWearParse(q){
  const s=' '+q.toLowerCase().replace(/[^a-z0-9\- ]/g,' ')+' ';
  if(!/\b(wearing|wore|wear|dressed in|had on|outfit)\b/.test(s))return null;
  const pe=chatPeople(),toks=s.split(/\s+/).filter(t=>t.length>2);const hit=toks.map(t=>pe.get(t)).find(Boolean);
  return hit?{name:hit}:null;
}
window.lookIs=q=>!!(lookParse(q)||lookWearParse(q));
const lookOutfit=p=>{const T=lookPart(p,'top'),B=lookPart(p,'bottom'),t=lookSay(T),b=lookSay(B);if(t&&b)return T.c===B.c&&!T.n2&&!B.n2?`an all-${T.n===B.n?T.n:T.c} outfit`:`a ${t} top and ${b} bottoms`;return t?`a ${t} top`:b?`${b} bottoms`:'something I could not read'};
async function lookWear(q,W){
  const P=chatParse(q),people=await peopleAll().catch(()=>[]),first=chFirstOf(W.name);
  const photos=all().filter(m=>m.type==='photo'&&src(m)&&(!P.range||(m.ts>=P.range[0]&&m.ts<=P.range[1]))).sort((a,b)=>b.ts-a.ts);
  if(!photos.length)return{text:`You have not kept any photos${P.label?' '+P.label:''} to look through yet.`,more:[],cards:[],chips:[{t:'Keep something now',act:'add'}]};
  let f=null;try{f=await faceLoad()}catch(e){}
  if(!f)return{text:'I need the on-phone photo reader to look at clothes, and it did not load. Check your connection once and ask again.',more:[],cards:[],chips:[]};
  const got=[];let seen=0;
  for(const m of photos.slice(0,P.range?120:200)){
    let r;try{r=await lookOf(m)}catch(e){continue}seen++;
    const rec=await faceDB.get('photos',m.id)||{faces:[]};
    r.people.forEach((p,i)=>{const fc=rec.faces[i],w=fc&&faceWho(fc.d,people);if(w&&w.name&&chFirstOf(w.name)===first&&(p.top||p.bottom))got.push({m,p})});
    if(got.length>=4)break;if(seen%6===0)await fsleep(20);
  }
  {const seenD=new Set();for(let i=got.length-1;i>=0;i--){const k=dk(new Date(got[i].m.ts));if(seenD.has(k)&&i>0&&got.findIndex(g=>dk(new Date(g.m.ts))===k)!==i){got.splice(i,1)}seenD.add(k)}}
  const nm=chPN(W.name);
  if(!got.length)return{text:`I could not spot ${esc(nm)} in a photo${P.label?' '+P.label:''}.`,more:['I only know faces you have named. If '+esc(nm)+' is in a photo but not tagged, tag them once and I will find them everywhere.'],cards:[],chips:[{t:'Try last week',s:'What was '+nm+' wearing last week?'}]};
  const one=g=>{const d=new Date(g.m.ts),rel=chRel(d);return{rel,out:lookOutfit(g.p),sure:Math.min(g.p.topP||1,g.p.bottomP||1)>=.5}};
  const a=one(got[0]);
  const lead=/^(Today|Yesterday)$/.test(a.rel)?`${a.rel}, ${esc(nm)} had on ${a.out}.`:`On ${a.rel}, ${esc(nm)} had on ${a.out}.`;
  const more=got.slice(1,3).map(g=>{const o=one(g);return `${esc(o.rel)}: ${o.out}.`});
  more.push(a.sure?'I read colours only, so check the photo.':'I am not fully sure of that colour: the light or a pattern may be fooling me. Check the photo.');
  const cards=got.slice(0,3).map(g=>{const k=dk(new Date(g.m.ts));return`<button class="mc" data-d="${k}"><div class="mts"><span class="mt" style="background-image:url(${src(g.m)})"></span></div><div class="mtm">${chRel(new Date(g.m.ts))} · ${tstr(g.m.ts)}</div><div class="mti">${esc(nm)} · ${esc(lookOutfit(g.p))}</div></button>`});
  useTrack('chat_look');
  return{text:lead,more,cards,chips:[{t:'What happened that day',s:'What happened '+(/^(Today|Yesterday)$/.test(a.rel)?a.rel.toLowerCase():'on '+a.rel)}]};
}
async function lookAnswer(q){
  const W=lookWearParse(q);if(W&&!lookParse(q))return lookWear(q,W);
  const L=lookParse(q),P=chatParse(q),Y=TODAY.getFullYear();
  /* "on the 26th" with no month: the latest such day that has photos */
  if(!P.range){const dm=q.toLowerCase().match(/\b(\d{1,2})(st|nd|rd|th)\b/);
    if(dm){for(let i=0;i<14&&!P.range;i++){const d=new Date(Y,TODAY.getMonth()-i,+dm[1]);if(d.getDate()===+dm[1]&&d<=TODAY&&byDay[dk(d)]){P.range=[+d,+d+864e5-1];P.label='on '+fullDay(d)}}}}
  const photos=all().filter(m=>m.type==='photo'&&src(m)&&(!P.range||(m.ts>=P.range[0]&&m.ts<=P.range[1]))).sort((a,b)=>b.ts-a.ts);
  const cw=L.cols.join(' or '),what=L.dress?'a '+(cw?cw+' ':'')+'dress':L.part==='bottom'?(cw?cw+' ':'')+'pants or skirt':L.part==='top'?'a '+(cw?cw+' ':'')+'top':cw||'that';
  if(!photos.length)return{text:`You have not kept any photos${P.label?' '+P.label:''} to look through yet.`,more:[],cards:[],chips:[{t:'Keep something now',act:'add'}]};
  let f=null;try{f=await faceLoad()}catch(e){}
  if(!f)return{text:'I need the on-phone photo reader to look at clothes, and it did not load. Check your connection once and ask again.',more:[],cards:[],chips:[]};
  const found=[],tally={},cap=Math.min(photos.length,P.range?120:200);let seen=0,people=[];try{people=await peopleAll()}catch(e){}
  for(const m of photos.slice(0,cap)){
    let r;try{r=await lookOf(m)}catch(e){continue}
    seen++;
    const rec=await faceDB.get('photos',m.id)||{faces:[]};
    r.people.forEach(p=>{[p.top,p.bottom].forEach(c=>{if(c)tally[c]=(tally[c]||0)+1})});
    r.people.forEach((p,i)=>{if(L.dress){const T=lookPart(p,'top'),B=lookPart(p,'bottom');
        if(T&&B&&T.c===B.c){const sc=L.qs.length?Math.max(...L.qs.map(q=>Math.min(lookHit1(T,q),lookHit1(B,q)))):2;if(sc)found.push({m,p,i,rec,dress:true,sc,part:'top'})}return}
      const h=lookHit(p,L);if(h.sc)found.push({m,p,i,rec,sc:h.sc,part:h.part})});
    if(seen%6===0)await fsleep(20);
  }
  /* exact matches if there are any; otherwise the close ones, and the answer says so */
  const exact=found.some(x=>x.sc===2),ms=[...new Map(found.filter(x=>!exact||x.sc===2).map(x=>[x.m.id,x])).values()];
  const cards=ms.slice(0,4).map(x=>{
    const fc=rec=>rec&&rec.faces[x.i],w=fc(x.rec)?faceWho(fc(x.rec).d,people):null,nm=w&&w.name,k=dk(new Date(x.m.ts));
    const pt=x.part||'top',shade=lookSay(lookPart(x.p,pt));
    const desc=x.dress?`Looks like a ${lookSay(lookPart(x.p,'top'))} outfit in one piece`:`${nm?esc(chPN(nm))+' · ':''}${shade} ${pt==='bottom'?'on the bottom':'on top'}`;
    return`<button class="mc" data-d="${k}"><div class="mts"><span class="mt" style="background-image:url(${src(x.m)})"></span></div><div class="mtm">${chRel(new Date(x.m.ts))} · ${tstr(x.m.ts)}</div><div class="mti">${esc(desc)}</div></button>`});
  const scope=seen<photos.length?` I looked through the ${seen} newest of ${photos.length} photos${P.label?' '+P.label:''}.`:` I looked through ${seen===1?'the one photo':'all '+seen+' photos'}${P.label?' '+P.label:''}.`;
  const more=[];
  if(!ms.length){
    useTrack('chat_look');
    const near=Object.entries(tally).filter(([c])=>!L.qs.some(q=>q.fam===c)).sort((a,b)=>b[1]-a[1]).slice(0,3);
    const more=[near.length?`The colours I did see on people were ${chList(near.map(([c,n])=>c+' ('+n+')'))}.`:'I did not find any people I could read colours from.','I read colours from the people I can see in each photo, so someone turned away, cropped or in dim light can be missed.'];
    return{text:`I could not find anyone wearing ${esc(what)}.${scope}`,more,cards:[],chips:near.map(([c])=>({t:'Who wore '+c+'?',s:'Who was wearing '+c+(L.part==='bottom'?' pants':L.part==='top'?' top':'')+'?'}))};
  }
  const days=[...new Set(ms.map(x=>dk(new Date(x.m.ts))))];
  const names=[...new Set(ms.map(x=>{const fc=x.rec.faces[x.i],w=fc&&faceWho(fc.d,people);return w&&w.name}).filter(Boolean))];
  more.push('I only read colours, and busy patterns or strong light can fool me, so check the photo.');
  if(L.dress)more.unshift('I cannot tell a dress from a long top, so these are people whose top and bottom look like one colour.');
  const chips=[];if(days.length===1)chips.push({t:'Open that day',d:days[0]});if(names.length===1)chips.push({s:'What happened with '+chPN(names[0])+'?'});
  useTrack('chat_look');
  const lead0=ms.length===1?`Yes, I found it${names.length?`: ${chList(names.slice(0,2).map(n=>esc(chPN(n))))} in ${esc(what)}`:`: someone in ${esc(what)}`} on ${esc(chRel(new Date(ms[0].m.ts)))}.`:`I found <b>${ms.length}</b> photos with someone in ${esc(what)}${days.length>1?`, across ${days.length} days`:''}${names.length?`. I think that includes ${chList(names.slice(0,3).map(n=>esc(chPN(n))))}`:''}.${scope}`;
  const lead=exact||L.dress&&!L.qs.length?lead0:`I did not find exactly ${esc(what)}, but ${ms.length===1?'one photo comes':'<b>'+ms.length+'</b> photos come'} close.`;
  return{text:lead,more,cards,chips};
}
