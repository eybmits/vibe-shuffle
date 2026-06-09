# Deployment

The project uses two repositories:

- Source repository: `eybmits/vibe_shuffle`
- Static GitHub Pages repository: `eybmits/vibe_shuffle_site`

Live site:

https://eybmits.github.io/vibe_shuffle_site/

## Build

```bash
npm install --cache ./.npm-cache
npm run lookup:catalog   # regenerates public/feature-lookup.json (gitignored);
                         # downloads the Kaggle 1.2M-songs dataset on first run
npm run build
```

The build output is written to `dist/` (including the ~59 MB feature lookup).

## Deploy To GitHub Pages Repo

From a clean source checkout:

```bash
npm run build
rm -rf /tmp/vibe_shuffle_site_deploy
git clone https://github.com/eybmits/vibe_shuffle_site.git /tmp/vibe_shuffle_site_deploy
find /tmp/vibe_shuffle_site_deploy -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R dist/. /tmp/vibe_shuffle_site_deploy/
cd /tmp/vibe_shuffle_site_deploy
touch .nojekyll
git add -A
git commit -m "Deploy Vibe Shuffle update"
git push origin main
```

## Verification

```bash
curl -I -L https://eybmits.github.io/vibe_shuffle_site/
```

Expected result: `HTTP/2 200`.

If GitHub Pages still shows the previous build, wait for cache propagation or
hard-refresh the browser.
