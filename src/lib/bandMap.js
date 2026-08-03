/**
 * Age bands (feature F04).
 *
 * The bands offered on screen 1 ARE the bands DOSM publishes, so a user is
 * never silently re-bucketed into a group they did not choose. The mapper is
 * kept because population_context remains the source of truth: if the
 * published bands ever change, the app must follow the data rather than a
 * hardcoded list, and must say so when the two differ.
 *
 * 0–14 is published but not offered — this is an adult preventive-health tool.
 */

/** The bands we offer on screen 1. Deliberately coarse — no date of birth. */
export const USER_BANDS = ['15-40', '41-59', '60+'];

/**
 * Pick the published band that best covers a user band.
 * `published` comes from population_context, so the database stays the
 * source of truth for which bands exist.
 */
export function mapToPublishedBand(userBand, published = []) {
  const bands = published.filter((b) => b.is_published_band).map((b) => b.age_band);
  const user = parseBand(userBand);
  if (!user) return null;

  let best = null;
  let bestOverlap = 0;
  for (const band of bands) {
    const p = parseBand(band);
    if (!p) continue;
    const overlap = Math.min(user.hi, p.hi) - Math.max(user.lo, p.lo) + 1;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = band;
    }
  }
  return best;
}

/** "41-59" -> {lo:41, hi:59};  "60+" -> {lo:60, hi:120} */
function parseBand(band) {
  if (!band) return null;
  if (band.endsWith('+')) {
    const lo = Number(band.slice(0, -1));
    return Number.isFinite(lo) ? { lo, hi: 120 } : null;
  }
  const [lo, hi] = band.split('-').map(Number);
  return Number.isFinite(lo) && Number.isFinite(hi) ? { lo, hi } : null;
}

/** Is this user inside the 40–60 audience the product was designed for? */
export function isTargetAudience(userBand) {
  return userBand === '41-59';
}
