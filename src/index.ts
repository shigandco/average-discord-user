import { createCors, error, json, RequestLike, Router } from "itty-router";
import { UserFlags, type APIUser } from "discord-api-types/v10";
import config from "../config.json";
import { flagToImage } from "./enums";

interface ModifiedUser extends APIUser {
  flag_images: { [key: string]: string };
  client_mod_badges: { [key: string]: string };
}
interface objResponse {
  badge: string;
  name: string;
}
interface iClientModBadge {
  name: string;
  badge: string;
}
interface badgeApiResponse {
  [key: string]: string[] | objResponse[];
}

const baseurl = "https://discord.com/api/v10/users/";
const { preflight, corsify } = createCors({
  methods: ["GET", "PATCH", "POST"],
  origins: ["http://localhost:3001"],
});

const router = Router();

function fetchData(id: string) {
  const url = baseurl + id;
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
    return response.json() as Promise<APIUser>;
  });
}

router.all("*", preflight).get("/v1/:id/avatar.png", async (handler) => {
  try {
    const userData = await fetchData(handler.params.id); 
    const avatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
    const imageResponse = await fetch(avatarUrl);
    if (imageResponse.ok) {
      const imageBuffer = await imageResponse.arrayBuffer();
      const response = new Response(imageBuffer, {
        headers: {
          "Content-Type": "image/png",
        },
      });

      return response;
    } else {
      return "fuck you"
    }
  } catch (error) {
    return "no image?"
  }
});

router.all("*", preflight).get("/v1/:id/default.json", (handler) => {
  return fetchData(handler.params.id);
});

router.all("*", preflight).get("/v1/:id.json", async (handler) => {
  const data = (await fetchData(handler.params.id)) as ModifiedUser;
  data.flag_images = {};

  if (data.flags) {
    Object.keys(UserFlags)
      .filter((key) => data.flags! & UserFlags[key])
      .map(
        (image) =>
          (data.flag_images[
            image
          ] = `https://raw.githubusercontent.com/efeeozc/discord-badges/main/png/${flagToImage[image]}.png`)
      );
  }

  const modBadges = (await fetch(
    `https://clientmodbadges-api.herokuapp.com/users/${data.id}`
  ).then((res) => res.json())) as badgeApiResponse;
  Object.entries(modBadges).forEach((badgeData) => {
    badgeData[1].forEach((badge: string | iClientModBadge) => {
      if (typeof badge === "string") {
        data.client_mod_badges[
          badge
        ] = `https://clientmodbadges-api.herokuapp.com/badges/${data[0]}/${badge}`;
      } else {
        data.client_mod_badges[badge.name] = badge.badge;
      }
    });
  });
});

export default {
  port: 3001,
  fetch: (request: RequestLike) =>
    router.handle(request).then(json).catch(error).then(corsify),
};
