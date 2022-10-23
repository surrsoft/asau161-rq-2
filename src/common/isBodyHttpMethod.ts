import { RequestMethodEnum } from "./requestMethodEnum";
import { YesNoMayEnum } from "./common";

/**
 * Возвращает информацию о том является ли для метода {@link method}
 * тело (payload) нужным, не нужным, или опциональным
 *
 * ЗАВИСИМОСТИ
 * -- RequestMethodEnum [1665908139]
 * -- YesNoMayEnum [1665947520]
 *
 * ID [[1665947520]] rev.1.1.0 2022-10-18
 */
export function isBodyHttpMethod(
  method: RequestMethodEnum | string
): YesNoMayEnum {
  switch (method) {
    case RequestMethodEnum.GET:
    case RequestMethodEnum.HEAD:
    case RequestMethodEnum.CONNECT:
    case RequestMethodEnum.OPTIONS:
    case RequestMethodEnum.TRACE:
      return YesNoMayEnum.NO;
    case RequestMethodEnum.POST:
    case RequestMethodEnum.PUT:
    case RequestMethodEnum.PATCH:
      return YesNoMayEnum.YES;
    case RequestMethodEnum.DELETE:
      return YesNoMayEnum.MAY;
    default:
      return YesNoMayEnum.YES;
  }
}
