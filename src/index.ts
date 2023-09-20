import { createCors, error, json, RequestLike, Router } from "itty-router";

import v1Router from "./api/v1";
import { join } from "path";
import { notfound, serve } from "./utils";
import config from "../config.json"


const { preflight, corsify } = createCors({
  methods: ["GET", "PATCH", "POST"],
  origins: ["*"],
});

const router = Router();

router
  .all("*", preflight)

  .all("/v1/*", v1Router.handle)

  .get("/*", serve("public"))

  .all("*", () => error(404));

export default {
  port: config.port,
  fetch: (request: RequestLike) =>
    router.handle(request).then(json).catch(error).then(corsify),
};
