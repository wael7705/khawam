/** عنوان الشركة ورابط Google Maps الموحّد */
export const COMPANY_ADDRESS_AR = 'دمشق - البرامكة، خلف الهجرة والجوازات';

export const COMPANY_MAPS_URL =
  'https://www.google.com/maps/place/%D8%AE%D9%88%D8%A7%D9%85+%D9%84%D8%B5%D9%86%D8%A7%D8%B9%D8%A9%D8%A7%D9%84%D8%A5%D8%B9%D9%84%D8%A7%D9%86%E2%80%AD/@33.5091675,36.288471,19z/data=!4m12!1m5!3m4!2zMzPCsDMwJzMzLjciTiAzNsKwMTcnMTYuNCJF!8m2!3d33.509361!4d36.287889!3m5!1s0x1518e15142d015bf:0x86082f24d34712ce!8m2!3d33.509339!4d36.2878016!16s%2Fg%2F11rkj7wkhg?entry=ttu';

export function isGoogleMapsUrl(url: string): boolean {
  return /google\.com\/maps|maps\.google/i.test(url);
}
