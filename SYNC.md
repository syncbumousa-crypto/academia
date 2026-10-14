# How saving and sharing work

One page. Read this before touching anything that saves, uploads, or decides
who owns what.

---

## The three places a contribution can live

| Where | What it is | Who can see it |
|---|---|---|
| **The drawer** | this browser's copy, in `localStorage` | only this browser |
| **The server** | the real copy, in the `posts` table | the owner always; everyone if it is published |
| **The screen** | drawn from the drawer | — |

The drawer is a cache. The server is the truth. The drawer keeps only what
has not reached the server yet, plus whatever was just pulled down to draw.

---

## Two identities, one browser

This is the thing that caused almost every bug this project has had.

- The **admin page** always acts as the **site account** (`u-academia`).
- The **main site** acts as **whoever signed in**, or nobody.
- They are the same website, so they share **one login cookie** and **one
  drawer**. Opening one page can replace the other's login.

So "is this mine?" cannot be answered by "was I signed in when I saved it".
It has to be answered by comparing owners.

---

## The five rules

They are written out in full, with their history, at the top of
`platform/app/01.js` under **OWNERSHIP**. In short:

1. **A contribution records its owner the moment it is created.**
   Not when it is uploaded — by then the login may have changed.
2. **Each page knows who it acts as.** `actingAs()`.
3. **"Mine" is a question, not a stored fact.** `isMine(post)` compares the
   owner with who we act as. The `me` field is only a cached answer, and
   `refreshOwnership()` is the only thing allowed to write it.
4. **Only the owner may upload.** The browser refuses, and the server checks
   again and answers `403` if the declared owner is not the session.
5. **Before uploading, make the login cookie match who we act as.**
   `fixSession()`. The admin page can repair its own session; a reader whose
   session went missing has to sign in again.

Contributions written before accounts existed have no owner field. If one
carries the site's name it belongs to the site — that is how the shipped book
covers and starter card decks were written. Anything else without an owner is
a local draft, and it keeps whatever flag it already had.

---

## Going up: saving

```
you type
  → save()                       writes the drawer, then schedules an upload
  → srvPushSoon()                waits for you to stop typing
  → srvPush(post)                one contribution
      fixSession()               rule 5: is the cookie who we act as?
      refuse if not mine         rule 4
      medPrep()                  pasted images become /api/media/<hash>
      PUT /api/posts             body says which owner we believe
      403 → fix the session, try once more. Never latch it shut.
      on success: store the owner the server reports
```

Images are uploaded first and replaced by a link. If an image cannot be
uploaded, **the whole contribution waits** — text is never sent without its
picture, because the server copy would then overwrite the local one and the
picture would vanish.

---

## Coming down: reading

Two trips, because they answer different questions.

```
GET /api/posts?covers=1       every pinned book cover, all courses, once at start
GET /api/posts?code=MIS 250   everything in one course, when that course opens
```

The covers trip exists because the library shows sixty-odd books at once and
we are not going to make sixty-odd requests. Without it, a cover pinned in the
admin page never appeared on the main site until you opened that exact course.

**Absence is an answer.** If the covers reply does not mention a course, the
site's cover for it is removed locally. Otherwise unpinning would never take
effect.

Merging a pull:
1. Learn owners from the server, then let rule 3 decide what is mine.
2. Drop local copies that the reply replaces.
3. Insert what came down.
4. If a course has no slot in the drawer yet, **make one** — a course whose
   contributions all live on the server has nothing left in the drawer, and
   the pull used to give up right there.

---

## Book covers

> **A cover is the picture on a pinned contribution. No pin, no cover.**

That is the whole rule. There is no separate cover setting. Deleting the
contribution, or unpinning it, removes the cover — with nothing special
written anywhere to make that happen.

Lecture and lab are two separate subjects (`ICS 104` and `ICS 104::معمل`).
Pinning in one does not touch the other.

---

## What the browser stores

Only what has not reached the server, plus the session. Everything else is
trimmed away on save. Two exceptions that must never be trimmed:

- an image still in `data:` form — the server has never seen it
- anything belonging to a visitor with no account

---

## The guards

Run `bash _vercel.sh --dry` to run them all without deploying.

| Guard | Asks |
|---|---|
| `_boot-check.mjs` | **Does it even start?** Runs the real engine on the real page against the live server. |
| `_ownership.mjs` | The five rules above, on the real functions. |
| `_covers.mjs` | Covers arrive, and unpinning removes them. |
| `_visit.mjs` | A visitor's first pull, with the real server reply. |
| `_nkbox.mjs` | The four nook boxes in both sizes. |
| `_bin-check.mjs` | Uploaded images are stored as bytes, not as `{}`. |
| `_img-check.mjs` | Upload, read back, and speed. |
| `_port-check.py` | The Vercel copy of each endpoint still matches its original. |
| `_book.py` | Only one function draws a book. |
| `_actkey.py` | Lecture and lab keys are never mixed up. |
| `_pg-words.py` | Reserved words are quoted for Postgres. |
| `_css-lint.py` | The stylesheet's blocks and comments are balanced. |
| `_ids.py` | Every element the admin page asks for exists. |
| `_graft.py` | The site's course panel inside the admin page matches the original. |

`node --check` is **not** one of these. It only asks whether the file is valid
JavaScript. It happily accepted `const postsURL = q = (...)` — a lost arrow,
valid JavaScript, and the engine died on the first line that ran with every
other guard still green. That is why `_boot-check.mjs` runs first.

---

## Things that were true and are not any more

Old comments in the source may still say these. They are wrong now.

- ~~`me` is a stored fact read in 58 places and must not be wrapped~~ — it is
  a cached answer now, written in one place.
- ~~The main site hands the site's contributions back on its own~~ — one rule
  does that for every page.
- ~~The owner is written when the upload succeeds~~ — it is written at birth.
- ~~`POST /api/auth/site` is open~~ — it needs the admin password lock.
