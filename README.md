# Lakshan's Portfolio — GitHub Pages Starter

A minimal, fast personal website you can deploy on **GitHub Pages** and map to your custom domain **lakshan.info**.

## 1) Repository setup

- Create a new public repo named **`<your-username>.github.io`** (replace with your GitHub username).
- Download this ZIP and extract the contents, then **push** everything to that repo root.
- Commit a file named `CNAME` containing exactly your domain (see step 3).

> For a project site instead of a user site, create any repo (e.g., `portfolio`) and enable Pages in **Settings → Pages** (Build from branch). Put these files in the repo root.

## 2) Enable GitHub Pages

- For a **user site** repo named `<username>.github.io`, GitHub Pages is automatically enabled from the `main` branch.
- In **Settings → Pages**, ensure the Source is set to `Deploy from a branch` and the branch is `main` (or `master`) root.
- After the first push, your site should be live at `https://<username>.github.io`.

## 3) Add your custom domain (lakshan.info)

1. In your repo, create a file named **`CNAME`** at the root with the single line:
   ```
   lakshan.info
   ```
   (If you also want `www.lakshan.info`, add a DNS CNAME for `www` to `<username>.github.io`, see below.)

2. In GitHub, go to **Settings → Pages** and set **Custom domain** to `lakshan.info`. Turn on **Enforce HTTPS** once the certificate is ready.

## 4) Configure DNS on Namecheap

Go to **Namecheap → Domain List → Manage → Advanced DNS** and add these records:

- **A records** (for the apex domain `lakshan.info`):
  - `@` → `185.199.108.153`
  - `@` → `185.199.109.153`
  - `@` → `185.199.110.153`
  - `@` → `185.199.111.153`

- **CNAME record** (for `www`):
  - `www` → `<username>.github.io`

> TTL: Automatic is fine. DNS propagation can take up to a few hours.

## 5) Edit your content

- Update text in `index.html` (hero, About, Projects, Publications, Talks, Contact).
- Replace `assets/profile-placeholder.png` and `assets/favicon.png` with your own images.
- Tweak styles in `styles.css`. No build step required.
- If you need a contact form, replace the demo alert with Formspree (simple) or your backend.

## 6) Optional: analytics & SEO

- Add Google Analytics or Plausible script tag in `index.html`.
- Refine `<meta>` description and Open Graph tags in `<head>`.

## 7) Local preview

You can open `index.html` directly in your browser, or use a tiny dev server:
```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## 8) Troubleshooting

- **Domain points to GitHub but no HTTPS**: Wait for the certificate, then tick **Enforce HTTPS**.
- **404 after enabling Pages**: Check you deployed to the correct branch/root. For user sites, repo name must be exactly `<username>.github.io`.
- **Custom domain not working**: Confirm `CNAME` file is present in the repo root and DNS records are correct.

---

### Structure
```
/
├─ index.html
├─ styles.css
├─ script.js
├─ assets/
│  ├─ profile-placeholder.png
│  └─ favicon.png
└─ CNAME  (contains: lakshan.info)
```
