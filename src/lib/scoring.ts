export interface ScoreResult {
  score: number; // 0-100
  htmlSimilarity: number; // 0-1
  cssSimilarity: number; // 0-1
  details?: string;
}

function normalizeHtml(s: string) {
  return s
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  const matrix: number[][] = [];
  for (let i = 0; i <= bl; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= al; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= bl; i++) {
    for (let j = 1; j <= al; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[bl][al];
}

function similarityFromDistance(a: string, b: string) {
  if (a.length === 0 && b.length === 0) return 1;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - dist / maxLen;
}

function extractTagSequence(html: string) {
  // remove comments and scripts/styles content
  const cleaned = html.replace(/<!--([\s\S]*?)-->/g, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const tagRegex = /<\s*([a-z0-9-]+)(?:\s|>|\/)/gi;
  const seq: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(cleaned))) {
    seq.push(m[1].toLowerCase());
  }
  return seq.join(' ');
}

export async function compareOutputs(expectedHtml: string, expectedCss: string | undefined, submittedHtml: string, submittedCss: string | undefined): Promise<ScoreResult> {
  try {
    const normExpectedHtml = normalizeHtml(expectedHtml || '');
    const normSubmittedHtml = normalizeHtml(submittedHtml || '');

    // text-based similarity
    const textSim = similarityFromDistance(normExpectedHtml, normSubmittedHtml);

    // structural similarity based on tag sequence
    const expectedTags = extractTagSequence(expectedHtml || '');
    const submittedTags = extractTagSequence(submittedHtml || '');
    const tagSim = similarityFromDistance(expectedTags, submittedTags);

    // combine text and tag similarity to better reflect structure
    const htmlSim = 0.5 * textSim + 0.5 * tagSim;

    const normExpectedCss = (expectedCss || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const normSubmittedCss = (submittedCss || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const cssSim = similarityFromDistance(normExpectedCss, normSubmittedCss);

    // Weight HTML higher than CSS
    const weightHtml = 0.75;
    const weightCss = 0.25;

    const combined = Math.max(0, Math.min(1, htmlSim * weightHtml + cssSim * weightCss));
    const score = Math.round(combined * 100);

    return {
      score,
      htmlSimilarity: Math.max(0, Math.min(1, htmlSim)),
      cssSimilarity: Math.max(0, Math.min(1, cssSim)),
      details: `htmlSim=${htmlSim.toFixed(3)} cssSim=${cssSim.toFixed(3)} combined=${combined.toFixed(3)}`,
    };
  } catch (err) {
    return {
      score: 0,
      htmlSimilarity: 0,
      cssSimilarity: 0,
      details: 'error computing similarity',
    };
  }
}
