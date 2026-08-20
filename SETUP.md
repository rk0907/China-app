# KAYA — Connect requests to Google Sheets (shared backend)

Follow these steps **in order**. When done, any customer phone can submit a request and it will appear in your admin panel.

---

## STEP 1 — Create the Google Sheet

1. Go to [https://sheets.google.com](https://sheets.google.com)
2. Click **Blank** spreadsheet
3. Rename it to: **KAYA Requests**
4. Rename the first tab (bottom left) to exactly: **Requests**
5. In row 1, paste these headers in columns A–M (one per cell):

```
id | created | status | name | whatsapp | location | category | item | description | quantity | budget | size | colour
```

6. Add a second tab named exactly: **Orders**
7. In Orders row 1, paste these headers in columns A–N:

```
id | created | request_id | customer | whatsapp | item | quantity | amount | product_ghs | commission_ghs | airfreight_ghs | cost_china | cost_currency | payment_status
```

*(You can leave both sheets empty after the header row — the script will write data.)*

---

## STEP 2 — Paste the Apps Script

1. In the same Sheet: **Extensions → Apps Script**
2. Delete any code in `Code.gs`
3. Open the file **`Code.gs`** from this project folder and **copy everything**
4. Paste it into the Apps Script editor
5. Click the disk icon **Save** (name the project e.g. `KAYA API`)

---

## STEP 3 — Deploy as Web App

1. In Apps Script: click **Deploy → New deployment**
2. Click the gear ⚙️ next to “Select type” → choose **Web app**
3. Settings:
   - **Description:** `KAYA v1`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**
5. Authorize when asked (Review permissions → your Google account → Advanced → Go to KAYA → Allow)
6. **Copy the Web App URL**  
   It looks like:  
   `https://script.google.com/macros/s/AKfycb.../exec`

> If you change the script later: **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**, then use the same URL (or copy the new one).

---

## STEP 4 — Paste the URL into your website (2 places)

### A) `request.html`

Find this line near the bottom:

```js
const API = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

Replace with **your** Web App URL:

```js
const API = 'https://script.google.com/macros/s/PASTE_YOUR_ID_HERE/exec';
```

### B) `admin.html`

Find the same line (near the top of the `<script>` section):

```js
const API = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

Replace with the **same** Web App URL.

---

## STEP 5 — Test

1. Open **request.html** on any phone → submit a test request  
2. Open the **Google Sheet** → you should see a new row under Requests  
3. Open **admin.html** → log in (`admin123`) → Requests → the same request should appear  

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Admin shows no requests | Check API URL is identical in both files; hard-refresh admin |
| Submit says failed | Redeploy script as **Anyone**; confirm Sheet tab names are `Requests` and `Orders` |
| “Authorization required” | Deploy → Who has access = **Anyone** (not “Anyone with Google account”) |
| Old data still shows | Clear browser cache or use an incognito window |

---

## Optional: test the API in the browser

Open this in a new tab (replace with your URL):

```
https://script.google.com/macros/s/YOUR_ID/exec?action=ping
```

You should see: `{"success":true,"message":"KAYA API is live"}`
