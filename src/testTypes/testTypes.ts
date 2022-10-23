import loIsNumber from "lodash/isNumber";
import loIsArray from "lodash/isArray";
import loIsString from "lodash/isString";

export interface Myt2Type {
  val: number;
}

export interface Myt1Type {
  values: Myt2Type[];
}

export interface Err1Type {
  error: {
    code: string;
  };
}

export function isErr1Type(data: any): data is Err1Type {
  return loIsString(data?.error?.code);
}

export function isMyt2Type(some: any): some is Myt2Type {
  if (!some) return false;
  return loIsNumber(some.val);
}

export function isMyt1Type(data: any): data is Myt1Type {
  if (!data) return false;
  if (!loIsArray(data.values)) return false;
  return data.values.every((el: any) => isMyt2Type(el));
}
