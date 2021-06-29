export default function splitAltTitles(titles: string): string[] {
  let titles_array: string[];

  if (titles.match(/,+/g)) titles_array = titles.split(',');
  else titles_array = titles.split(';');

  /** Trim each array element */
  return titles_array.map((title) => title.trim());
}
