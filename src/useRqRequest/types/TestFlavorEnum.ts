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
