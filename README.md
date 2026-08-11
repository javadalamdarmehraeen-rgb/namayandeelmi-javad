#   
          .
Next.js 16 (App Router) + PostgreSQL (Drizzle ORM) + PWA (      iOS).
##  
|  |   |   |    |
| --- | --- | --- | --- |
|  | `admin` | `admin1234` | `09120000000` |
|   | `rep1` | `rep1234` | `09121111111` |
>    `ADMIN_PASSWORD`  `ADMIN_PHONE`       
> (       ).      «  »    .
##   (VS Code)
```bash
npm install
#  .env
# DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
npm run dev
```
    **  **   (   migration ).
##   Render + Neon
###   «Could not find a production build» 
  Render     :
```
==> Running 'npm start'
```
 **   `npm run build`  ** →   **Build Command**    .
`next start`              `.next`  .
###   ( )
Render →   → **Settings** →  **Build & Deploy**:
|  |   |
| --- | --- |
| Root Directory |  (     ) |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm run start` |
| Health Check Path | `/api/health` |
 **Environment** →  :
| Key | Value |
| --- | --- |
| `DATABASE_URL` |   Neon  `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `APP_SECRET` |     |
| `NODE_VERSION` | `20.18.0` |
| `NPM_CONFIG_PRODUCTION` | `false` |
  **Manual Deploy → Clear build cache & deploy**.
> : `--include=dev`    Render  `NODE_ENV=production`     
> `npm install`  toolchain (typescript  tailwind)      .
###   (   Build Command   )
 `npm start`    `scripts/start.mjs`   :   `.next`  
**       `next build` **    `PORT`   Render  .
       live  (    ).
###   Blueprint

 `render.yaml`           Render 
**New → Blueprint**          `DATABASE_URL`   .
###   
 `https://<your-app>.onrender.com/api/health`   :
- `{"ok":true,"db":true}` →   .
- `{"ok":false,"reason":"DATABASE_URL   "}` →     .
- `{"ok":false,"reason":"..."}` →     Neon (  `?sslmode=require`)   .
## 
-    / +                .
-       .
-    :         .
-    +   +   (`//`).
-         /       .
-       (  )      / .
-     «»  « »   « »  .
-          (  +  )       .
-         (     /).
-   (CSV   UTF-8  Excel)   .
-          .
-    .
##    APK  PWABuilder
     :
-  `prebuild`    build     `96…1024` 
   `maskable` (  ) `apple-touch-icon`    
     SVG .     PNG    
       Render   .
-      (`/icons/[file]`, `/screenshots/[file]`,
  `/apple-touch-icon.png`)          
       .
-       `<head>`     
   PWA    .
###   APK
1.    Render   (Build Command: `npm install --include=dev && npm run build`).
2.  [PWABuilder.com](https://www.pwabuilder.com)  ** **     ( `/login`).
3.  Retest    Action Items   .
4. `Package For Stores → Android`  `Download Test Package`  .
##       ()
** :**   `force-dynamic`          
  .    (   Render      )
       .
** :**
1. **   ** (`○ Prerendered`).        .
2. ** ** —  (v8)          .
3. **Cache-First  ** +     →      .
4. **   ** ( )     .
5. ** **  IndexedDB    +  .
6. ** ** ( )       .
7. **`/api/ping`**  ( )     +    .
##    ( )
    **     **.   
        **  (OTP)** :
1.   /   .
2.       **   **  .
3.           →    **    **.
4.        →   .
5.              .
6.     «»   ****  ( ).
###   
 «» →  « »:  SMS.ir    .
      : `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER`, `SMS_PATTERN`.
>           ** **   
>           .
##       
###   «    »

   HTML     **  (. )  **.
    React  HTML   JS     
        →  .
**:**  `scripts/build-sw.mjs`    build    
  `/_next/static`       .  ** 
 +  **    .
###  
 `/diagnostics` —   :      
        GPS   .
 «   »  « »  .
##    —  
  **  **   «»       :
|  |  |
|---|---|
| ` ` |     |
| ` ` |          |
| ` ` () |             |
| ` ` | :           |
   « »     .
##       
### ) Keep-Alive —    
         :
```
GET /ping        → 200 "OK"        (  ~ms)
GET /ping?json   → {"status":"OK","uptimeMs":...}
GET /api/ping    → 
HEAD /ping       → 200
```
** UptimeRobot:** New Monitor → HTTP(s) → URL: `https://<app>.onrender.com/ping`
→ Interval: ** **.      Render   .
### ) Retry  Exponential Backoff + Jitter
 `src/lib/retry.ts`:
| API |  |
|---|---|
| `withRetry(fn, opts)` |       |
| `withRetrySafe(fn, fallback)` |      |
| `fetchWithRetry(url, init)` |  HTTP  (  ) |
| `dbRetry(fn, label)` |      |
| `dbTransaction(fn)` |   BEGIN/COMMIT/ROLLBACK  retry |
**  (Full Jitter):** `s → s → s → s → s`   ** **
                .
**  :** `ECONNRESET`, `ETIMEDOUT`, `ECONNREFUSED`, `EAI_AGAIN`, `EPIPE` …
 PostgreSQL `08xxx` () `53xxx` () `57Pxx` () `40001/40P01` ()
 HTTP `5xx`, `429`, `408`   «endpoint is disabled»  Neon.
**   (  ):** `4xx`    `23505` `AbortError`.
### )   Neon
`src/db/index.ts`      :
```
 : postgresql://u:p@ep-cool-fire-123.eu-central-1.aws.neon.tech/neondb
 : postgresql://u:p@ep-cool-fire-123-pooler.eu-central-1.aws.neon.tech/neondb
        ?sslmode=require&connect_timeout=15&application_name=sabt-etelaat-kol
```
-    endpoint  **`-pooler`** (PgBouncer)
- **`connect_timeout=15`**     
- `statement_timeout`  `query_timeout`   
- `keepAlive`  `max=8`, `min=0`, `idleTimeout=30s`
-  `pool.on("error")`         
`GET /api/health`    :
`{"ok":true,"db":true,"latencyMs":8,"pooler":true,"connectTimeoutSec":15}`
##   «This page couldn't load»    
###  
   **-**         
           .

### ) HTML   
 `next.config.ts`   :
`Cache-Control: no-cache, no-store, must-revalidate, max-age=0` + `Pragma: no-cache` + `Expires: 0`
  `/_next/static/*`  `immutable`  (  ).
### )     
 `ConnectionStatus`:     
**«     —       »**
  « » «»  «».       .
   **  **   ( `navigator.onLine`     )
        .
### ) :  «-»
```js
if (req.mode === "navigate") {
         cache: "no-store"
      →     (   )
     →   (/panel  /)     
     →      
}
```
 RSC (  Next)          .
### )   +  
-     (  ).
-  /  **IndexedDB**    
  «          »   .
-  «N    »   **« »**   .
-    Background Sync        .
-  `/offline`   :        
  «   »     .
##       
> **  Laravel:**  `bot-generator-bale-telegram-laravel-10`  PHP/MySQL  
>   « »     .    PHP   
>        .    (Bot API / + )
>    TypeScript         .
###   —  `messengers`
|  |  |
|---|---|
| `platform` | telegram / bale / eitaa / whatsapp |
| `label` |     |
| `targetType` | group / channel / phone |
| `target` | chat_id      |
| `token` |     API |
| `provider` |   : whatsiplus / ultramsg / cloudapi / custom |
| `apiUrl` |    `{phone}`  `{text}`  `{token}` |
| `enabled` | /    |
| `lastStatus`, `lastOkAt`, `lastErrorAt` |        |
 `message_logs`     (/ +  )   .
###   (`src/lib/messaging.ts`)
```ts
formatOrderMessage(order)      //   
sendOne(target, text)          //     ( → )
dispatchText(text, orderId?)   //     
dispatchOrder(order)           //   
fetchUpdates(platform, token)  //   chat_id
```
###  
-    ** **    →  →   (Full Jitter)  .
-   `Promise.allSettled`    **     **.
-        ** Cloudflare**  .
-          ( whatsiplus)   ****  .
###   
|  |  |  |
|---|---|---|
| **** | @BotFather → `/newbot` | chat_id    `-100…` |
| **** | @BotFather   → `/newbot` | chat_id  |
| **** |   `eitaayar.ir` |    `@` |
| **** |  API  `whatsiplus.ir` ( UltraMsg / Cloud API) |   |
     **«   chat_id»**    :     
               .
##       
> ** :** `getLine1Number()`  MSISDN        
>       →  `null` .  iOS   API  .
>     .

###  API
|  |  |
|---|---|
| `POST /api/mobile/nonce` |  nonce  ( Replay) |
| `POST /api/mobile/login-with-phone` |     +  HMAC |
| `POST /api/auth/otp` |      |
### 
1. **HMAC-SHA256**  `nonce|timestamp|deviceId|phone|simFingerprint`  `MOBILE_APP_SECRET`
2. **nonce **     —    
3. ** **      
4. ICCID/IMSI      ** SHA-256** 
###   ()
```
200 TOKEN                    ←  
401 BAD_SIGNATURE            ←  
401 BAD_NONCE                ← Replay Attack
404 PHONE_NOT_REGISTERED     ←    
422 SIM_NUMBER_UNAVAILABLE   ←     →   
403 DEVICE_MISMATCH          ←    
403 SIM_CHANGED              ←    
403 PASSWORD_LOGIN_REQUIRED  ←       
```
###  
 `mobile/`  `App.tsx` `src/simAuth.ts` (React Native)   Flutter
       .  `MOBILE_APP_SECRET`  
Render    .
##        
### )      
 `targets`   `userId`, `period` ( ), `productKey`,
`quantity`, `priceDistributor`, `pricePharmacy`.
-  ** →   **:         /
           «    ».
- `GET /api/targets`   :     (  
  )      .
- **     **           
      .
-  « »       .
### )   
`GET /api/records/lookup?type=pharmacies|doctors&name=…&phone=…`
   ( «/»  / ) 
« »  «»    .      
                .
### )    
      :
-   «  »        
        .
-  **«   »**      
          .
##    : Render  NdcoHub.ir
          ****  :
|  |  |  |
|---|---|---|
| NdcoHub () | `https://ndcohub.ir` |    —     |
| Render | `https://namayandeelmi-javad.onrender.com` |      |
### )      
`src/lib/endpoints.ts` —          
      **     **.
      .
### )  
     :
- `uid` —   (UUID)       
- `updated_at` —     
- `origin` —        
**:**    (   )      `pull`  
  `push` .  : **Last-Write-Wins**   `updated_at`.
** :**      `sek.sync=on`   
           « »
 .  `updated_at < excluded.updated_at`      .

### )  
|  |  |
|---|---|
| `POST /api/sync/pull` |      (  HMAC) |
| `POST /api/sync/push` |      |
| `POST /api/sync/run` |  / (`x-sync-key`) |
| `GET /api/sync/status` |     |
 ** →   **:     /
 « » « »  «  ».
### )  
** Render:**
```
NODE_NAME=render
SYNC_SECRET=<     >
SYNC_PEERS=ndcohub|https://ndcohub.ir
SYNC_INTERVAL_MINUTES=5
NEXT_PUBLIC_ENDPOINTS=https://ndcohub.ir,https://namayandeelmi-javad.onrender.com
PUBLIC_BASE_URL=https://namayandeelmi-javad.onrender.com
```
** NdcoHub** ( `.env.ndcohub.example`   ):
```
NODE_NAME=ndcohub
SYNC_SECRET=< >
SYNC_PEERS=render|https://namayandeelmi-javad.onrender.com
NEXT_PUBLIC_ENDPOINTS=https://ndcohub.ir,https://namayandeelmi-javad.onrender.com
PUBLIC_BASE_URL=https://ndcohub.ir
```
### ) CI/CD    
- `.github/workflows/deploy.yml` —   **  GitLab**     
- `.gitlab-ci.yml` —    **  GitHub**
 : `GITLAB_REPO_URL`, `GITLAB_TOKEN`, `RENDER_DEPLOY_HOOK`,
`NDCOHUB_DEPLOY_HOOK`, `SYNC_SECRET`.
##       GitHub / GitLab
 `git status`    «nothing to commit»     
    (         ).
### :     
1.   ****  .
2.  ** →   ** .
3.  **«    (ZIP)»**  .
4.  ZIP         (  ).
5. :
```bash
git add -A
git status                       #       
git commit -m "  "
git push origin main
git push gitlab main             #   GitLab  
```
>   `node_modules` `.next`  `.env`  (    ).
>     `HOW-TO-UPDATE.md`   ZIP  .
 API: `GET /api/source` ( ) —  `GET /api/source?list=1`    .
##    
### )    /
       .   
( «»)          
   .
**:**        ****
          (   
    ).
### )    
 `/api/geocode`   (    CORS    ):
-       +  « » +  Enter
-         ( / + )
-     : `35.7219, 51.4089`
-  «    » ( )
-      (Photon  Nominatim)    

>  : `Number(null)`    ****   
>    «    »     
> .      .
##    +   
###  
         :
|  |  |
|---|---|
| `src/lib/geo.ts` |           +  `resolveArea`, `provinceOf`, `distanceKm` |
| `src/components/screens/MapExplorer.tsx` |     ///   |
| `src/app/panel/map`  `src/app/admin/map` |  «  » |
`fetchJson`  `fetchRows`   `src/lib/useLive.ts`    `MapBox`
  `MapArea`   (    ).
###    
**) `Custom Cache-Control headers detected for /_next/static`**
   `/_next/static`   ( Next.js   `immutable`  )
  `no-store`   `/:path((?!_next/).*)`     .
**) `Encountered unexpected file in NFT list`**
 `/api/source`  `fs`  `path`   import    
  Turbopack      .   
 **     **  .
: `npm run build`       .
