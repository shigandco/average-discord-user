import { createCors, error, json, RequestLike, Router } from "itty-router";
import { UserFlags, type APIUser } from "discord-api-types/v10";
import { authenticatedFetch } from "../../utils";

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

const router = Router({
  base: "/v1",
});

router.get("/:id/avatar.png", async (handler) => {
  try {
    const userData = (await authenticatedFetch(
      `/users/${handler.params.id}`
    )) as APIUser;
    const gifAvatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.gif`;
    const pngAvatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;

    const gifImageResponse = await fetch(gifAvatarUrl);

    if (gifImageResponse.ok) {
      const gifImageBuffer = await gifImageResponse.arrayBuffer();
      const gifResponse = new Response(gifImageBuffer, {
        headers: {
          "Content-Type": "image/gif",
        },
      });
      return gifResponse;
    } else {
      const pngImageResponse = await fetch(pngAvatarUrl);
      if (pngImageResponse.ok) {
        const pngImageBuffer = await pngImageResponse.arrayBuffer();
        const pngResponse = new Response(pngImageBuffer, {
          headers: {
            "Content-Type": "image/png",
          },
        });
        return pngResponse;
      } else {
        const defaultImageUrl =
          "https://discord.com/assets/c09a43a372ba81e3018c3151d4ed4773.png";
        const defaultImageResponse = await fetch(defaultImageUrl);
        if (defaultImageResponse.ok) {
          const defaultImageBuffer = await defaultImageResponse.arrayBuffer();
          const defaultResponse = new Response(defaultImageBuffer, {
            headers: {
              "Content-Type": "image/png",
            },
          });
          return defaultResponse;
        } else {
          return "internal error";
        }
      }
    }
  } catch (error) {
    return "internal error";
  }
});

router.get("/:id/default.json", (handler) => {
  return authenticatedFetch(`/users/${handler.params.id}`);
});

router.get("/:id.json", async (handler) => {
  const data = (await authenticatedFetch(
    `/users/${handler.params.id}`
  )) as ModifiedUser;
  data.flag_images = {};
  data.client_mod_badges = {};

  if (data.flags) {
    Object.keys(UserFlags)
      .filter((key) => data.flags! & UserFlags[key])
      .map(
        (image) =>
          (data.flag_images[image] = `/badges/${image.toLowerCase()}.png`)
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
        ] = `https://clientmodbadges-api.herokuapp.com/badges/${badgeData[0]}/${badge}`;
      } else {
        data.client_mod_badges[badge.name] = badge.badge;
      }
    });
  });

  return data;
});

export default router;
