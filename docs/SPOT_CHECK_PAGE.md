# Found in the Upside Down spot-check page

The interactive review lives at `public/review/found-in-the-upside-down.html`. Vite serves it at `/review/found-in-the-upside-down.html` and copies it, with its adjacent review metadata JSON, into the production build. The existing GitHub Pages workflow publishes both files after this change is merged into `main`.

On an iPhone, open the deployed page in Safari and choose your original `Found_in_the_Upside_Down.html` from Files. The story is read locally; it is not included in Git, uploaded, or saved with your feedback. The page verifies that the file and paragraph layout match the copy used for the review. Select the file again after reopening the page.

Start with **Suggested 20**, or choose another filter to inspect all 144 cards. Mark **Correct**, **Wrong**, or **Not sure** for the claim shown. Add common-error checkboxes and context as needed. My provisional assessment stays hidden until expanded. The collection distinguishes detected readings, missing correctly attributed acts, partial coverage, and activities outside the app's scope.

Answers save in the current browser. Use **Export my answers**, or **Share / save answers** on supported iPhones, to save the JSON feedback file. Import that file to continue on another device. Browser answers do not sync automatically. Send the exported file back for reconciliation; the page does not automatically update accepted repository labels.

The page records review judgments from engine commit `863027c68279ce7506aefe7990a79943f0c45ae7`. It does not rerun the detector, and newer engine revisions may differ. Its metadata contains paraphrased claims, review notes, paragraph references, and file/paragraph checksums; it contains no story paragraphs. A retrospective paragraph is omitted from displayed excerpts.

For local development, run `npm run dev` from the repository and visit the review path through the development server. Run `npm test` and `npm run build` before merging. A page-only change does not require corpus regression runs; it does not change the engine or generated model tables.
