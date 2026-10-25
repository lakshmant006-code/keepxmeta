"""Builds the app into dist/.

Config comes from the environment or a local .env file (never committed):
  GM_KEY     Google Maps JavaScript API key (restrict it to your site's referrer in Google Cloud)
  FIREBASE_CONFIG  optional, Firebase web app config as JSON (App Check)
  RECAPTCHA_KEY    optional, reCAPTCHA Enterprise site key (App Check)
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
  .replace('__MAPS_CSS__',r('src/maps.css')).replace('__MAPS_JS__',r('src/maps.js')).replace('__THREE__',r('src/vendor/three.min.js')))
ver=hashlib.sha1(body.encode()).hexdigest()[:10]
def jget(k):
    v=get(k)
    try:return json.loads(v) if v else None
    except ValueError:raise SystemExit(k+' must be valid JSON (the Firebase web app config object)')
cfg={'demo':demo,'gmKey':get('GM_KEY'),'firebase':jget('FIREBASE_CONFIG'),'recaptcha':get('RECAPTCHA_KEY'),'build':ver}
head=('<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
 '<title>Keep</title><meta name="theme-color" content="#ffffff"><meta name="mobile-web-app-capable" content="yes">'
 '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Keep">'
 '<meta name="apple-mobile-web-app-status-bar-style" content="default"><link rel="manifest" href="manifest.webmanifest">'
 '<link rel="icon" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/apple-touch-icon.png">'
 '<script>window.KEEP='+json.dumps(cfg)+'</script>')
shutil.rmtree('dist',ignore_errors=True);shutil.copytree('public','dist')
open('dist/index.html','w').write('<!doctype html><html lang="en"><head>'+head+'</head><body>'+body+'</body></html>')
open('dist/sw.js','w').write(r('src/sw.js').replace('__VERSION__',ver))
print('built dist/ · build',ver,'· demo' if demo else '· real app','· maps key' if cfg['gmKey'] else '· no maps key (set GM_KEY)','· app check' if cfg['firebase'] and cfg['recaptcha'] else '')
