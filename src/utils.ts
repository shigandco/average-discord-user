import { IRequest } from "itty-router";
import { join } from "path";

import config from "../config.json";

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

const baseurl = "https://discord.com/api/v10";

export function authenticatedFetch(path: string) {
  const url = baseurl + path;
  const headers = {
    Authorization: `Bot ${config.token}`,
  };

  return fetch(url, {
    method: "GET",
    headers: headers,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  });
}
