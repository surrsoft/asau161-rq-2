import React from "react";
import { App0 } from "./App0";
// import { AppAxios } from "./AppAxios";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();

/**  */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <App0 />
        {/* <AppAxios /> */}
        <ReactQueryDevtools initialIsOpen />
      </div>
    </QueryClientProvider>
  );
}
