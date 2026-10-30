"""Builds the app into dist/.

Config comes from the environment or a local .env file (never committed):
  GM_KEY     Google Maps JavaScript API key (restrict it to your site's referrer in Google Cloud)
  FIREBASE_CONFIG  optional, Firebase web app config as JSON (App Check)
  RECAPTCHA_KEY    optional, reCAPTCHA Enterprise site key (App Check)
  IG_API, GOOGLE_CLIENT_ID  optional, accounts: the URL of the deployed worker/server.js, and the Google OAuth web client ID
  GTAG_ID    Google tag ID for page-view analytics (default: the Keep site's own; "off" disables). Not added to the demo build or on localhost
  KEEP_DEMO  1 = sample memories, fixed demo date and a simulated keyboard (default: off, a real app)
Usage: python3 build.py            real app
       KEEP_DEMO=1 python3 build.py   demo build
"""
import os,json,hashlib,shutil,re

def env_file(path='.env'):
    out={}
    if os.path.exists(path):
        for ln in open(path):
            m=re.match(r'\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$',ln)
            if m and not ln.lstrip().startswith('#'):out[m.group(1)]=m.group(2).strip('"\'')
    return out
E_=env_file();get=lambda k,d='':os.environ.get(k) or E_.get(k) or d
demo=get('KEEP_DEMO')=='1'
r=lambda f:open(f).read()
imgs=r('src/sample-images.json').strip() if demo else '{}'
body=(r('src/app.src.html').replace('__IMGS__',imgs).replace('__AR_CSS__',r('src/ar.css')).replace('__AR_JS__',r('src/ar.js'))
  .replace('__MAPS_CSS__',r('src/maps.css')).replace('__MAPS_JS__',r('src/maps.js')).replace('__THREE__',r('src/vendor/three.min.js')).replace('__GLTF__',r('src/vendor/gltf.min.js'))
  .replace('__AV_CSS__',r('src/avatars.css')).replace('__AV_JS__',r('src/avatars.js'))
  .replace('__FACE_CSS__',r('src/faces.css')).replace('__FACE_JS__',r('src/faces.js'))
  .replace('__FR_CSS__',r('src/friends.css')).replace('__FR_JS__',r('src/friends.js'))
  .replace('__INS_CSS__',r('src/insights.css')).replace('__INS_JS__',r('src/insights.js'))
  .replace('__INV_CSS__',r('src/invite.css')).replace('__INV_JS__',r('src/invite.js')).replace('__NT_CSS__',r('src/notify.css')).replace('__NEAR_JS__',r('src/nearby.js')).replace('__NT_JS__',r('src/notify.js')).replace('__TAG_CSS__',r('src/tagging.css')).replace('__TAG_JS__',r('src/tagging.js')).replace('__INTRO_CSS__',r('src/intro.css')).replace('__INTRO_JS__',r('src/intro.js'))
  .replace('__CHAT_CSS__',r('src/chat.css')).replace('__CHAT_JS__',r('src/chat.js')).replace('__PROF_CSS__',r('src/profile.css')).replace('__PROF_JS__',r('src/profile.js'))
  .replace('__MOTION__',r('src/vendor/motion.min.js')).replace('__MOT_CSS__',r('src/motion.css')).replace('__MOT_JS__',r('src/motion.js')).replace('__BULK_JS__',r('src/bulk.js')).replace('__SEL_CSS__',r('src/select.css')).replace('__SEL_JS__',r('src/select.js')).replace('__FLOW_CSS__',r('src/flow.css')).replace('__FLOW_JS__',r('src/flow.js')).replace('__PAGES_JS__',r('src/pages.js')))
ver=hashlib.sha1(body.encode()).hexdigest()[:10]
def jget(k):
    v=get(k)
    try:return json.loads(v) if v else None
    except ValueError:raise SystemExit(k+' must be valid JSON (the Firebase web app config object)')
cfg={'demo':demo,'gmKey':get('GM_KEY'),'firebase':jget('FIREBASE_CONFIG'),'recaptcha':get('RECAPTCHA_KEY'),'igApi':get('IG_API'),'googleClientId':get('GOOGLE_CLIENT_ID'),'build':ver}
SITE=get('SITE_URL','https://keepxmeta.onrender.com').rstrip('/')
head=('<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">'
 '<title>Keep: a private place for your photos, voice notes and memories</title>'
 '<meta name="description" content="Keep gathers photos, voice notes, quotes and places into one calendar you can search in plain words. Everything you keep stays on your phone.">'
 '<link rel="canonical" href="'+SITE+'/"><meta name="robots" content="index,follow">'
 '<meta property="og:type" content="website"><meta property="og:site_name" content="Keep"><meta property="og:title" content="Keep: your memories, kept private"><meta property="og:description" content="One calendar for photos, voice notes, quotes and places. Ask for a memory in plain words. Stays on your phone."><meta property="og:url" content="'+SITE+'/"><meta property="og:image" content="'+SITE+'/icons/icon-512.png">'
 '<meta name="twitter:card" content="summary">'
 '<script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@type':'SoftwareApplication','name':'Keep','applicationCategory':'LifestyleApplication','operatingSystem':'iOS, Android, Web','description':'A private calendar of photos, voice notes, quotes and places you can search in plain words.','url':SITE+'/','offers':{'@type':'Offer','price':'0','priceCurrency':'USD'}})+'</script>'
 '<meta name="theme-color" content="#E9EEF9" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#0b0b0d" media="(prefers-color-scheme: dark)"><meta name="mobile-web-app-capable" content="yes">'
 '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Keep">'
 '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><link rel="manifest" href="manifest.webmanifest">'
 '<link rel="icon" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/apple-touch-icon.png">'
 '<script>window.KEEP='+json.dumps(cfg)+'</script>')
gt=get('GTAG_ID','' if demo else 'G-LR0ZL46FF6')  # a tag ID is public (it is in the page source); set GTAG_ID=off to build without it
if gt=='off':gt=''
if gt and not re.fullmatch(r'(G|GT|AW|DC)-[A-Za-z0-9]{4,20}',gt):raise SystemExit('GTAG_ID must look like G-XXXXXXXXXX (or "off")')
if gt:head+=("<script>(function(){var h=location.hostname;if(h==='localhost'||h==='127.0.0.1')return;window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};"
 "var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id="+gt+"';document.head.appendChild(s);"
 "gtag('js',new Date());gtag('config','"+gt+"',{page_location:location.origin+location.pathname,page_referrer:'',allow_google_signals:false,allow_ad_personalization_signals:false})})()</script>")
shutil.rmtree('dist',ignore_errors=True);shutil.copytree('public','dist')
open('dist/index.html','w').write('<!doctype html><html lang="en"><head>'+head+'</head><body>'+body+'<noscript><main style="font-family:system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 20px"><h1>Keep</h1><p>Keep gathers your photos, voice notes, quotes and places into one calendar you can search in plain words. Everything you keep stays on your phone.</p><p>Turn on JavaScript to use Keep, and add it to your Home Screen to use it like an app.</p></main></noscript></body></html>')
open('dist/robots.txt','w').write('User-agent: *\nAllow: /\nSitemap: '+SITE+'/sitemap.xml\n')
open('dist/sitemap.xml','w').write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+SITE+'/</loc></url></urlset>')
open('dist/sw.js','w').write(r('src/sw.js').replace('__VERSION__',ver))
print('built dist/ · build',ver,'· demo' if demo else '· real app','· maps key' if cfg['gmKey'] else '· no maps key (set GM_KEY)','· app check' if cfg['firebase'] and cfg['recaptcha'] else '')
