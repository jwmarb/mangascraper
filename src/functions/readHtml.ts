import cheerio, { CheerioAPI } from 'cheerio';
import axios from 'axios';

export default async function readHtml(url: string): Promise<CheerioAPI> {
  try {
    const { data } = await axios.get(url);
    return cheerio.load(data);
  } catch (e) {
    throw Error(e);
  }
}
