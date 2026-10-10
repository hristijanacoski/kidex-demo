# Adding a KIDEX project

The public library is at `projects.html` and `mk/projects.html`. It supports project details in English and Macedonian, PDF previews, and PDF / PowerPoint downloads. No admin account or server upload system is needed.

## Publish a project

1. Prepare the final report as a PDF. If you made a PowerPoint presentation, export a PDF from PowerPoint too. Browsers preview the PDF; visitors can download the original `.pptx` or `.ppt` as well.
2. Copy the files into `documents/projects/`. Use simple filenames, for example `pizza-championship-skopje.pdf` and `pizza-championship-skopje.pptx`. Files must be nonempty and no larger than 50 MB each.
3. Copy the object in `tools/project.example.json` into the `projects` array in `data/projects.json`. Separate multiple objects with commas. Fill in the actual event date, both language versions, and the document paths. Describe KIDEX's actual contribution in `role` and `summary`. Remove the PowerPoint entry if you only have a PDF.
4. Change `published` from `false` to `true` when the information and documents are ready.
5. From the repository folder, run:

   ```powershell
   node tools/build-projects.cjs
   ```

6. Preview both language pages. Open a report, close it with Escape, and check both downloads on desktop and mobile.
7. Commit and publish the updated `projects.html`, `mk/projects.html`, and the document files together, just like other website changes. Include `data/projects.json` in Git so the project remains editable. For a full hosting archive, run `python tools/build.py`; it calls the project generator and includes the documents automatically. Node.js is required on the development computer, not the hosting server.

The first project has not been invented or pre-published. Until you add your final material, visitors see a short message that project reports are being prepared.

## Fields

| Field | Meaning |
| --- | --- |
| `id` | Unique lowercase name with hyphens. Keep it stable; a project can be linked as `projects.html#project-pizza-championship-skopje`. |
| `published` | `true` includes the project; `false` keeps its text and links out of the generated pages. |
| `date` | Actual event/project date in `YYYY-MM-DD` format. Newest projects appear first. |
| `title`, `summary`, `role` | Objects with `en` and `mk` text. Both languages are required before publishing. |
| `location` | Optional object with `en` and `mk` text. |
| `documents` | Array of `{ "file": "documents/projects/your-file.pdf" }` entries. Each appears as a download with its format and file size. |
| `preview` | Optional PDF path. By default the first PDF in `documents` is used. For a PowerPoint-only download list, set this to its PDF export. The preview is also publicly downloadable. |
| `cover` | Optional real photo or exported first-slide image, such as `images/projects/pizza-championship.webp`. Supported: WebP, PNG, JPG/JPEG. Without it, the card uses a document design with the project title. |

No HTML is needed in the project text. The generator escapes all text, checks local paths and files, and rejects missing translations, duplicate IDs, invalid dates and missing PDF previews. Drafts can retain placeholder dates and paths until ready.

## What visitors see

- Cards show the title, date, location, KIDEX's role and a short description.
- **Preview report** opens the PDF in a dialog using the browser's PDF viewer. The PDF is loaded only when requested.
- Open-in-new-tab and download links are always available if a device cannot display an embedded PDF.
- Without JavaScript, preview links open the PDF directly and downloads still work.
- Presentations are served from your own site; no third-party Office viewer receives your documents.

## Updating or removing a project

Edit the same record and rerun the generator. When replacing a document, use a new filename (for example `report-v2.pdf`) so visitors do not see a cached older copy. Keep both language versions accurate.

To remove a project card, set `published` to `false` and rebuild. This hides the card, **not the uploaded files**. If documents must no longer be public, also remove them from the hosting server and deployment package. Everything inside `documents/` is public; do not store private drafts there. The manifest, example and tooling are excluded from the hosting archive.

## Developer checks

```powershell
node tools/check-projects.cjs
node tools/qa-site.cjs playwright projects-check chromium
```

The project check uses an isolated fixture site to exercise publishing, validation, bilingual cards, preview controls, downloads and no-JavaScript behavior. It never adds test projects to the public site.
