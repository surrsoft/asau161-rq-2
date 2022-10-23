import loIsNumber from "lodash/isNumber";
import loIsArray from "lodash/isArray";

export interface Myt2Type {
  val: number;
}

export interface Myt1Type {
  values: Myt2Type[];
}

export function isMyt2Type(some: any): some is Myt2Type {
  if (!some) return false;
  return loIsNumber(some.val);
}

export function isMyt1Type(some: any): some is Myt1Type {
  if (!some) return false;
  if (!loIsArray(some.values)) return false;
  return some.values.every((el: any) => isMyt2Type(el));
}
