/**
 * ทำชื่อบริษัทให้เทียบกันได้ เช่น
 * "บริษัท ออโตเมชั่นเซอร์วิส จำกัด" = "ออโตเมชั่นเซอร์วิส" และ "Kiwi Studio Co., Ltd." = "kiwi studio"
 */
export function companyKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFC")
    .replace(/\(มหาชน\)|มหาชน|บริษัท|บจก\.?|บมจ\.?|ห้างหุ้นส่วนจำกัด|หจก\.?|จำกัด/g, " ")
    .replace(/\b(co\.?,?\s*ltd\.?|company\s+limited|limited|ltd\.?|inc\.?|corp\.?|corporation|plc\.?|public company|\(thailand\)|thailand)\b/g, " ")
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "")
    .trim();
}
