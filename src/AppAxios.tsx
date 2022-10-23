import React from "react";
import PrettyJSON from "react-json-pretty";
import { RequestMethodEnum } from "./useRqRequest/types/RequestMethodEnum";
import { isMyt1Type } from "./testTypes/testTypes";

import {
  TestFlavorAxiosEnum,
  useRqRequestAxios
} from "./useRqRequest/useRqRequestAxios";

export function AppAxios() {
  const result = useRqRequestAxios({
    // url: "http://127.0.0.1:22124/values",
    url: "https://jsonplaceholder.typicode.com/posts",
    queryKey: "key-1665910570",
    method: RequestMethodEnum.GET,
    queryOptions: { retry: 0 },
    predicates: [{ id: "p1", predicate: isMyt1Type }],
    body: {
      id: 11,
      title: "title-11"
    },
    testFlavor: TestFlavorAxiosEnum.UNDEF,
    pauseMsc: 0,
    timeoutMsc: 5000
  });

  const { refetch } = result;

  return (
    <div>
      <button onClick={() => refetch()}>refetch</button>
      <div>status: {result.status + ""}</div>
      <div>fetchStatus: {result.fetchStatus + ""}</div>
      <div>isLoading: {result.isLoading + ""}</div>
      <div>isFetching: {result.isFetching + ""}</div>
      <div>isError: {result.isError + ""}</div>
      <div>isSuccess: {result.isSuccess + ""}</div>
      <div>
        <div>error:</div>
        <PrettyJSON data={result.error + ""} />
      </div>
      <div>isLoadingError: {result.isLoadingError + ""}</div>
      <div>isRefetchError: {result.isRefetchError + ""}</div>
      <div>dataUpdatedAt: {result.dataUpdatedAt + ""}</div>
      <div>errorUpdatedAt: {result.errorUpdatedAt + ""}</div>
      <div>isPlaceholderData: {result.isPlaceholderData + ""}</div>
      <div>isPreviousData: {result.isPreviousData + ""}</div>
      <div>isFetched: {result.isFetched + ""}</div>
      <div>isFetchedAfterMount: {result.isFetchedAfterMount + ""}</div>
      <div>isRefetching: {result.isRefetching + ""}</div>
      <div>isStale: {result.isStale + ""}</div>
      <div>failureCount: {result.failureCount + ""}</div>
      <div>errorUpdateCount: {result.errorUpdateCount + ""}</div>
      <hr />
      <PrettyJSON data={result.data} />
      <hr />
      <PrettyJSON data={result} />
    </div>
  );
}
