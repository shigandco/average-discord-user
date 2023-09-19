import { IRequest } from "itty-router";
import { join } from "path";

export function notfound() {
  return new Response("Not Found", { status: 404 });
}

export function serve(path: string) {
  return async (request: IRequest) => {
    const fileName = new URL(request.url).pathname.slice(1);
    const file = Bun.file(join(path, fileName));
    if (await file.exists()) return new Response(file);
  };
}
