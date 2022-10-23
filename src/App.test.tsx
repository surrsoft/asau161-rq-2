import "@testing-library/jest-dom";

import * as React from "react";
import { render } from "@testing-library/react";

import { App } from "./App";

test("it renders", async () => {
  render(<App />);
});
