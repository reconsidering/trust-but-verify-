import { storyBytes, verifyStory, type ReviewSource } from './review-batch-data';

export async function loadReviewFics(
  files: Iterable<{name: string; arrayBuffer(): Promise<ArrayBuffer>}>,
  sources: ReviewSource[],
  accept: (file: string, paragraphs: string[]) => void,
): Promise<{ loaded: number; skipped: number; errors: string[] }> {
  let loaded = 0, skipped = 0;
  const errors: string[] = [];
  for (const file of files) {
    try {
      for await (const bytes of storyBytes(file)) {
        try {
          const match = await verifyStory(bytes, sources);
          if (!match) { skipped++; continue; }
          accept(match.source.file, match.paras);
          loaded++;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : 'A story could not be checked.');
        }
      }
    } catch (error) {
      errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Could not read this file.'}`);
    }
  }
  return { loaded, skipped, errors };
}

export function mountReviewFicLoader() {
  const input = document.getElementById('fic-files') as HTMLInputElement | null;
  const status = document.getElementById('fic-status');
  const data = document.getElementById('review-data');
  if (!input || !status || !data) return;
  const batches = JSON.parse(data.textContent ?? '') as {comparison:{sources:ReviewSource[]};claims:{sources:ReviewSource[]}};
  const sources = [...new Map([...batches.comparison.sources,...batches.claims.sources].map(s=>[s.file,s])).values()];
  input.disabled = false;
  input.onchange = async () => {
    input.disabled = true;
    status.textContent = 'Checking the selected files on this device…';
    const result = await loadReviewFics(input.files ?? [], sources, (file, paragraphs) => {
      window.dispatchEvent(new CustomEvent('review-fic-loaded', {detail:{file,paragraphs}}));
    });
    status.textContent = `${result.loaded} matching ${result.loaded===1?'story':'stories'} loaded. ${result.skipped} HTML files were not part of this review or did not match its saved source. ${result.errors.join(' ')}`;
    input.disabled = false;
    input.value = '';
  };
}
mountReviewFicLoader();
