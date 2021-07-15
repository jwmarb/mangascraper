export default function splitAltTitles(titles: string): string[] {
  let titlesArray: string[];

  if (titles.match(/,+/g)) titlesArray = titles.split(',');
  else titlesArray = titles.split(';');

  /** Trim each array element */
  return titlesArray.map((title) => title.trim());
}
