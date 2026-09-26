# ndimensionalgames.com

Static site for N Dimensional Games, hosted on GitHub Pages (deploy from the `main` branch, root folder).

| URL | Source |
|---|---|
| `/` | `index.html` |
| `/ndvdb/` | NDVDB documentation, **generated** from the Unity package. Don't edit by hand. |
| `/customer-support/` | `customer-support/index.html`, a form that emails you through Web3Forms |
| anything else | `404.html` |

Shared styles and scripts live in `assets/`.

## Update the NDVDB docs

After changing `Documentation.html` in the Unity project:

```
node tools/build-docs.mjs
git add -A
git commit -m "Update NDVDB docs"
git push
```

The script reads the Unity copy (path at the top of `tools/build-docs.mjs`, or pass one as an argument), moves its embedded images into `ndvdb/img/`, and adds the site navigation. The Unity copy is not modified. GitHub Pages redeploys within a minute or two of the push.

## Update logos or marketing images

The logos, favicons, home banner, NDVDB cover and link-preview images in `assets/` are made from the originals in `D:\N Dimensional Games\Company\Logos` and `E:\NDVDBTest\Marketing`. After changing those:

```
py tools/make-images.py
```

## Preview locally

```
node tools/serve.mjs
```

Then open http://localhost:4173. It serves folders and 404s the same way GitHub Pages does.

## Support form

`customer-support/index.html` posts to [Web3Forms](https://web3forms.com), which emails each message to the address the access key was created with. Replies go straight to the customer, because Reply-To is set to their address. To send messages to a different address, create a new key at web3forms.com and replace the `access_key` value in that file. The key is meant to be public.

## Add a product

Copy the `<article class="product">` block in `index.html`, and add a folder for its docs next to `ndvdb/`.
