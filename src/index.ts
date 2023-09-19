import { createCors, error, json, RequestLike, Router } from "itty-router";

import v1Router from "./api/v1";

const { preflight, corsify } = createCors({
  methods: ["GET", "PATCH", "POST"],
  origins: ["http://localhost:3001"],
});

const router = Router();

router.all("/v1/*", v1Router.handle);

export default {
  port: 3001,
  fetch: (request: RequestLike) =>
    router.handle(request).then(json).catch(error).then(corsify),
};
