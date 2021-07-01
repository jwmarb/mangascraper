export default function numberSeperator(number: number | string): string {
  return typeof number === 'string'
    ? number.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
