export enum ErrCodeEnum {
  /** если невалидный URL */
  URL = "url error",
  /** ошибка на этапе разбора полученных от fetch данных */
  JSON = "json error",
  /** ошибка при выполнении fetch */
  FETCH = "fetch error",
  /** принудительная ошибка */
  FORCED = "forced error",
  /** запрос прерван т.к. превышено время ожидания ответа */
  TIMEOUTE = "timeout error"
}
