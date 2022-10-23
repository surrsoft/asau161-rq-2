import { hijackEffects } from "stop-runaway-react-effects";

//@ts-ignore
if (process.env.NODE_ENV === "development") {
  hijackEffects();
}

//@ts-ignore
require("./index.app");
