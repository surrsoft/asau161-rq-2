import { useQuery, UseQueryResult, QueryKey } from "@tanstack/react-query";
import loIsString from "lodash/isString";
import { RequestMethodEnum } from "../common/requestMethodEnum";
import { YesNoMayEnum } from "../common/common";
import { isBodyHttpMethod } from "../common/isBodyHttpMethod";
import axios from "axios";

export const HTTP_CODE_UNDEF = -1;

export enum ErrCodeEnum {
  /** если невалидный URL */
  URL = "url error",
  /** ошибка при выполнении fetch */
  FETCH = "fetch error",
  /** принудительная ошибка */
  FORCED = "forced error",
  /** запрос прерван т.к. превышено время ожидания ответа */
  TIMEOUTE = "timeout error"
}

/** различные сценарии работы хука, для тестовых целей */
export enum TestFlavorAxiosEnum {
  /** по умолчанию - без применения flavor */
  UNDEF = "undef",
  /** искуственно делаем неверным {@link urlPath} */
  F1 = "f1",
  /** искуственно делаем неверным {@link urlHostname} */
  F2 = "f2",
  /** бросание ошибки сразу после {@link pauseMsc} */
  F3 = "f3"
}

/** */
export type PredicateType = (some: any) => boolean;

/**  */
export interface PredicateWithIdType {
  id: string;
  predicate: PredicateType;
}

/** тип для поля X.error, где X - стандартный результат {@link useQuery} */
export interface ErrType {
  /** err.message */
  message: string;
  /** err.code, см. также https://developer.mozilla.org/en-US/docs/Web/API/DOMException */
  code: string;
  /** err.name, см. также https://developer.mozilla.org/en-US/docs/Web/API/DOMException */
  name: string;
  /** специальный код */
  codeSpc: ErrCodeEnum;
  /** URL для которого произошла ошибка */
  url: string;
  /** HTTP-метод использовавшийся при запросе */
  method: string | RequestMethodEnum;
  /** HTTP-код. -1 если код определить нет возможности */
  httpCode: number;
}

/** один из типов для поля X.data, где X - стандартный результат {@link useQuery} */
export interface ReturnType {
  /** сами данные получуенные от fetch */
  data: any;
  /**
   * HTTP-код.
   * Будет код -1 при ошибке когда реальный код считать не удаётся.
   * Код 0 может быть если у fetch указана опция `cors: "no-code"`.
   */
  httpCode: number;
  /** текстовое описание {@link httpCode} */
  httpCodeDesc: string;
  /** фактический url использовавшийся во время запроса */
  url: string;
  /** HTTP-метод использовавшийся при запросе */
  method: string | RequestMethodEnum;
  /**
   * id предиката для которого найдено соответствие с результатом fetch.
   * Будет null если соответствия найдено не было. Предикаты проверяются на
   * соответствия до первого найденного, слева направо из параметра {@link predicates}
   */
  predicateMatchedId: string | null;
}

/** тип для поля X.data, где X - стандартный результат {@link useQuery} */
export type ReturnExtType = ReturnType | null;

/**  */
async function wait(duration) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, duration);
  });
}

export interface ParamsType {
  /** URL */
  url: string;
  /** query key для запроса */
  queryKey: string | QueryKey;
  /** тело, для запросов которым оно требуется. Если truthy то будет передано в запрос */
  body?: any;
  /** если нужно переопределить опции useQuery */
  queryOptions?: Record<string, any>;
  /** HTTP-метод. По умолчанию GET */
  method?: string | RequestMethodEnum;
  /**  */
  predicates?: PredicateWithIdType[];
  /**
   * По умолчанию 0.
   * 5 - искуственно делаем неверным {@link urlPath}
   * 6 - искуственно делаем неверным {@link urlHostname}
   * 7 - бросание ошибки сразу после {@link pauseMsc}
   */
  testFlavor?: TestFlavorAxiosEnum;
  /** искуственная задержка перед началом выполнения запроса в милисекундах */
  pauseMsc?: number;
  /** если запрос будет длится дольше этого времени (не считая задержку {@link pauseMsc}),
   * то он будет искуственно прерван с ошибкой */
  timeoutMsc?: number;
}

/**
 * Инкапсулирует react-query useQuery() запрос на указанный {@link url}.
 * Имеет дополнительные возможности, такие как прекращение запроса по таймауту, искуственная подзадержка запроса и др.
 * Возвращает стандартный результат {@link useQuery}, с особенностями в части полей `data` и `error`.
 *
 * Сами данные (результат запроса) будут располагаться в поле `X.data.data`,
 * где X - стандартный результат {@link useQuery}
 *
 * Если результат содержит `status: "success"` то поле `data` результата будет содержаться
 * объект {@link ReturnExtType}, который помимо самих результатов запроса (поле `data`) будет
 * содержать дополнительную информацию о запросе - HTTP код ответа, URL запроса и др.
 *
 * Если результат содержит `status: "error"` то в поле `error` результата будет содержаться
 * сериализованный тип {@link ErrType}, содержащий помимо текста ошибки (поле `message`), дополнительную
 * информацию о запросе. Эту строку можно десериализовать чтобы извлечть нужные данные.
 *
 * ID [[1665910570]] rev.1.0.0 2022-10-16
 */
export function useRqRequestAxios({
  url,
  queryKey,
  queryOptions = {},
  body,
  method = RequestMethodEnum.GET,
  predicates = [],
  pauseMsc = 0,
  timeoutMsc = 0,
  testFlavor = TestFlavorAxiosEnum.UNDEF
}: ParamsType): UseQueryResult<ReturnExtType, ErrType> {
  const queryKeyNext = loIsString(queryKey) ? [queryKey] : queryKey;
  const result: UseQueryResult<ReturnExtType, ErrType> = useQuery(
    queryKeyNext,
    async () => {
      if (pauseMsc > 0) {
        await wait(pauseMsc);
      }
      // ---
      if (testFlavor === TestFlavorAxiosEnum.F3) {
        throw JSON.stringify({
          message: "is forced error",
          code: "",
          name: "",
          codeSpc: ErrCodeEnum.FORCED,
          url,
          method,
          httpCode: HTTP_CODE_UNDEF
        } as ErrType);
      }
      // --- urlObj
      let urlObj: URL;
      try {
        urlObj = new URL(url);
      } catch (err) {
        throw JSON.stringify({
          message: err?.message,
          code: err?.code + "",
          name: err?.name + "",
          codeSpc: ErrCodeEnum.URL,
          url,
          method,
          httpCode: HTTP_CODE_UNDEF
        } as ErrType);
      }
      // --- искусственная порча URL в тестовых целях
      if (testFlavor === TestFlavorAxiosEnum.F1) {
        urlObj.pathname = urlObj.pathname + "err";
      }
      if (testFlavor === TestFlavorAxiosEnum.F2) {
        urlObj.hostname = "err.nn";
      }
      // ---
      const urlNext = urlObj.href;
      // --- reqMethod
      let reqMethod = {};
      // для GET и HEAD явно указывать метод не нужно
      if (
        method !== RequestMethodEnum.GET &&
        method !== RequestMethodEnum.HEAD
      ) {
        reqMethod = { method };
      }
      // --- bodyNext
      const isBodyMethod = isBodyHttpMethod(method) !== YesNoMayEnum.NO;
      const bodyNext = body && isBodyMethod ? { data: body } : {};
      // --- fetchResponse
      let fetchResponse: any = null;
      try {
        fetchResponse = await axios.request({
          url: urlNext,
          ...reqMethod,
          ...bodyNext,
          timeout: timeoutMsc
        });
      } catch (err) {
        throw JSON.stringify({
          message: err?.message,
          code: err?.code + "",
          name: err?.name + "",
          codeSpc:
            err?.name === "AbortError"
              ? ErrCodeEnum.TIMEOUTE
              : ErrCodeEnum.FETCH,
          url: urlNext,
          method,
          httpCode: HTTP_CODE_UNDEF
        } as ErrType);
      }
      // ---
      let data = fetchResponse?.data;
      // --- предикаты
      const predicateMatchedId =
        predicates.find((predicateObj) => predicateObj.predicate(data))?.id ||
        null;
      // --- результат
      return {
        data,
        httpCode: fetchResponse?.status ?? HTTP_CODE_UNDEF,
        httpCodeDesc: fetchResponse?.statusText ?? "",
        url: urlNext,
        method,
        predicateMatchedId
      } as ReturnType;
    },
    Object.assign(
      {
        refetchOnWindowFocus: false,
        enabled: true,
        retry: 0
      },
      queryOptions
    )
  );

  return result;
}
