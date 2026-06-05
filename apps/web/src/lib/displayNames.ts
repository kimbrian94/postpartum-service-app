type DoulaNameParts = {
  name_preferred?: string | null;
  name_korean?: string | null;
  name_english?: string | null;
};

export function formatDoulaName(doula?: DoulaNameParts | null, fallback = 'Unknown') {
  if (!doula) return fallback;

  const preferred = doula.name_preferred?.trim();
  const korean = doula.name_korean?.trim();
  const english = doula.name_english?.trim();

  if (preferred && korean) return `${preferred} (${korean})`;
  return preferred || korean || english || fallback;
}
