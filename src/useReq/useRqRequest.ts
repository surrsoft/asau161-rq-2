import { useQuery, UseQueryResult, QueryKey } from "@tanstack/react-query";
import loIsString from "lodash/isString";
import { RequestMethodEnum } from "../common/requestMethodEnum";
import { YesNoMayEnum } from "../common/common";
import { isBodyHttpMethod } from "../common/isBodyHttpMethod";

export const HTTP_CODE_UNDEF = -1;

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

/** различные сценарии работы хука, для тестовых целей */
export enum TestFlavorEnum {
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

/** идентификатор предикат-дескриптора */
export type PredicateIdType = string;

/** предикат-декскриптор */
export interface PredicateDescriptor {
  /**  */
  id: PredicateIdType;
  /** -1 означает что при сверке результата с предикатом HTTP-код сверять не нужно */
  httpCode: number;
  /**  */
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
   * id предикат-дескриптора ожидаемого ответа типа "успех" для которого найдено
   * соответствие с результатом запроса.
   * Будет null если соответствия найдено не было. Предикат-дексрипторы проверяются на
   * соответствия до первого найденного, слева направо из параметра {@link predicatesSuccess}
   */
  predicateSuccessMatchedId: PredicateIdType | null;
  /**
   * id предикат-дескриптора ожидаемого ответа типа "ошибка" для которого найдено соответствие
   * с результатом запроса.
   * Будет null если соответствия найдено не было. Предикат-дексрипторы проверяются на
   * соответствия до первого найденного, слева направо из параметра {@link predicatesError}
   */
  predicateErrorMatchedId: PredicateIdType | null;
  /** одна из констант обозначающих результат запроса см. {@link ResultSuccessEnum} */
  resultStatus: ResultSuccessEnum;
  /** TRUE если полученный ответ, это ответ с initialData */
  isInitialData: boolean;
}

/** тип для поля X.data, где X - стандартный результат {@link useQuery} */
export type ReturnExtType = ReturnType | null;

/** константы представляющие возможные результы запроса для случая когда запрос
 * вернул результат (результат useQuery() имеет status: 'success') */
export enum ResultSuccessEnum {
  /**
   * запрос вернул результат который является ожидаемым результатом вида "упех".
   * Например "список продуктов", "информацию о пользователе" и т.п.
   */
  SUCCESS = "success_expected",

  /** запрос вернул ожидаемый результат вида "ошибка", то есть вернул ошибку
   * присутствующую в списке ожидаемых возможных ошибок.
   * Например бэкенд информирует что не нашёл сущность по указанному ID и т.п. */
  ERROR_EXPECTED = "error_expected",

  /** если запрос вернул результат который нельзя отнести ни к {@link SUCCESS}
   * ни к {@link ERROR_EXPECTED} */
  ERROR_UNEXPECTED = "error_unexpected"
}

/**  */
async function wait(duration) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, duration);
  });
}

/**  */
interface PredicateHandleRestultType {
  predicateSuccessMatchedId: string | null;
  predicateErrorMatchedId: string | null;
  resultStatus: ResultSuccessEnum;
}

/**  */
function predicatesHandle(
  data: any,
  predicatesSuccess: PredicateDescriptor[],
  predicatesError: PredicateDescriptor[],
  httpCode: number
): PredicateHandleRestultType {
  const predicateSuccessMatchedId =
    predicatesSuccess.find((predicateObj) => {
      return (
        predicateObj.predicate(data) &&
        (predicateObj.httpCode === -1 || predicateObj.httpCode === httpCode)
      );
    })?.id || null;
  // --
  let predicateErrorMatchedId = null;
  if (!predicateSuccessMatchedId) {
    predicateErrorMatchedId =
      predicatesError.find((predicateObj) => {
        return (
          predicateObj.predicate(data) &&
          (predicateObj.httpCode === -1 || predicateObj.httpCode === httpCode)
        );
      })?.id || null;
  }
  // --- resultStatus
  const resultStatus = predicateSuccessMatchedId
    ? ResultSuccessEnum.SUCCESS
    : predicateErrorMatchedId
    ? ResultSuccessEnum.ERROR_EXPECTED
    : ResultSuccessEnum.ERROR_UNEXPECTED;

  // ---
  return { predicateSuccessMatchedId, predicateErrorMatchedId, resultStatus };
}

/** входные параметры хука */
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
  /** предикат-дескрипторы ожидаемых ответов вида "успех" */
  predicatesSuccess?: PredicateDescriptor[];
  /** предикат-дескриптоы ожидаемых ответов вида "ошибка" */
  predicatesError?: PredicateDescriptor[];
  /** используется если указана опция initialData. Используется при сверке initialData с предикат-дексрипторами */
  initialDataHttpCode?: number;
  /**
   * По умолчанию 0.
   * 5 - искуственно делаем неверным {@link urlPath}
   * 6 - искуственно делаем неверным {@link urlHostname}
   * 7 - бросание ошибки сразу после {@link pauseMsc}
   */
  testFlavor?: TestFlavorEnum;
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
 * ID [[1665910569]] rev.1.0.0 2022-10-16
 */
export function useRqRequest({
  url,
  queryKey,
  queryOptions = {},
  body,
  method = RequestMethodEnum.GET,
  predicatesSuccess = [],
  predicatesError = [],
  initialDataHttpCode = -1,
  pauseMsc = 0,
  timeoutMsc = 0,
  testFlavor = TestFlavorEnum.UNDEF
}: ParamsType): UseQueryResult<ReturnExtType, ErrType> {
  // --- queryOptionsNext
  let initialDataObj: any = {};
  if (queryOptions.initialData) {
    initialDataObj = {
      initialData: {
        data: queryOptions.initialData
      }
    };
  }
  console.log("0610- initialDataObj", initialDataObj);
  const queryOptionsNext = Object.assign(
    {
      refetchOnWindowFocus: false,
      enabled: true,
      retry: 0
    },
    queryOptions,
    initialDataObj
  );
  console.log("0610- queryOptionsNext", queryOptionsNext);
  // ---
  const queryKeyNext = loIsString(queryKey) ? [queryKey] : queryKey;
  // ---
  let urlNext = "";
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
  if (testFlavor === TestFlavorEnum.F1) {
    urlObj.pathname = urlObj.pathname + "err";
  }
  if (testFlavor === TestFlavorEnum.F2) {
    urlObj.hostname = "err.nn";
  }
  // ---
  urlNext = urlObj.href;

  // ---
  const result: UseQueryResult<ReturnExtType, ErrType> = useQuery(
    queryKeyNext,
    async () => {
      if (pauseMsc > 0) {
        await wait(pauseMsc);
      }
      // ---
      if (testFlavor === TestFlavorEnum.F3) {
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

      // --- signal; прерываем запрос если он длится дольше чем {@link timeoutMsc}
      const abort = new AbortController();
      setTimeout(() => {
        abort.abort();
      }, timeoutMsc);
      const signal = timeoutMsc > 0 ? abort.signal : undefined;

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
      const bodyNext = body && isBodyMethod ? { body } : {};
      // --- fetchResponse
      let fetchResponse: any = null;
      try {
        // <=== <=== <=== FETCH
        fetchResponse = await fetch(urlNext, {
          signal,
          ...reqMethod,
          ...bodyNext
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
      const httpCode = fetchResponse?.status ?? HTTP_CODE_UNDEF;
      // ---
      let data = null;
      try {
        data = await fetchResponse.json();
      } catch (err) {
        // если данные в результате fetch не похожи на json
        throw JSON.stringify({
          message: err?.message,
          code: err?.code + "",
          name: err?.name + "",
          codeSpc: ErrCodeEnum.JSON,
          url: urlNext,
          method,
          httpCode
        } as ErrType);
      }
      // --- предикаты
      const predicateHandlerResult = predicatesHandle(
        data,
        predicatesSuccess,
        predicatesError,
        httpCode
      );
      // --- результат
      return {
        data,
        httpCode: fetchResponse?.status ?? HTTP_CODE_UNDEF,
        httpCodeDesc: fetchResponse?.statusText ?? "",
        url: urlNext,
        method,
        isInitialData: false,
        ...predicateHandlerResult
      } as ReturnType;
    },
    queryOptionsNext
  );

  // ---
  if (queryOptions.initialData && !result.isFetched && result.data) {
    // --- предикаты
    const {
      predicateSuccessMatchedId,
      predicateErrorMatchedId,
      resultStatus
    } = predicatesHandle(
      queryOptions.initialData,
      predicatesSuccess,
      predicatesError,
      initialDataHttpCode
    );
    // ---
    result.data.httpCode = initialDataHttpCode;
    result.data.httpCodeDesc = "initial data";
    result.data.url = urlNext;
    result.data.method = method;
    result.data.predicateSuccessMatchedId = predicateSuccessMatchedId;
    result.data.predicateErrorMatchedId = predicateErrorMatchedId;
    result.data.resultStatus = resultStatus;
    result.data.isInitialData = true;
  }

  // ---
  return result;
}
