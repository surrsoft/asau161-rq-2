import React, { useState } from "react";
import PrettyJSON from "react-json-pretty";
import { RequestMethodEnum } from "./useRqRequest/types/RequestMethodEnum";
import { isMyt1Type, isErr1Type } from "./testTypes/testTypes";

import { useRqRequest } from "./useRqRequest/useRqRequest";
import { TestFlavorEnum } from "./useRqRequest/TestFlavorEnum";

export function App0() {
  const [enabled, enabledSet] = useState(false);

  const result = useRqRequest({
    url: "http://127.0.0.1:22124/values",
    // url: "https://jsonplaceholder.typicode.com/posts",
    queryKey: "key-1665910569",
    method: RequestMethodEnum.GET,
    queryOptions: {
      retry: 0,
      enabled,
      initialData: {
        error: {
          code: "error 422"
        }
      }
    },
    initialDataHttpCode: 423,
    predicatesSuccess: [{ id: "s1", httpCode: 200, predicate: isMyt1Type }],
    predicatesError: [
      { id: "e1", httpCode: 422, predicate: isErr1Type },
      { id: "e2", httpCode: 421, predicate: isErr1Type }
    ],
    body: {
      id: 11,
      title: "title-11"
    },
    testFlavor: TestFlavorEnum.UNDEF,
    pauseMsc: 2000,
    timeoutMsc: 50000
  });

  const color =
    result.status === "error"
      ? "red"
      : result.status === "success"
      ? "green"
      : "black";

  return (
    <div>
      <button onClick={() => enabledSet(!enabled)}>click</button>
      <div>enabled: {enabled + ""}</div>
      <div style={{ color }}>status: {result.status + ""}</div>
      <div>isFetched: {result.isFetched + ""}</div>
      <div>isFetchedAfterMount: {result.isFetchedAfterMount + ""}</div>
      <div>
        <div>error:</div>
        <PrettyJSON data={result.error + ""} />
      </div>
      <hr />
      <PrettyJSON data={result} />
    </div>
  );
}
