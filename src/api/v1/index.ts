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

router.get("/:id/avatar", async (handler) => {
  try {
    const userData = (await authenticatedFetch(
      `/users/${handler.params.id}`
    )) as APIUser;
    const gifAvatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.gif`;
    const pngAvatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
    if (!userData.avatar) {
      let index = 0;
      if (!parseInt(userData.discriminator)) {
        const bigIntId = BigInt(userData.id);
        index = (Number(bigIntId >> BigInt(22)) % 6);
      } else {
        const bigIntDiscriminator = userData.discriminator;
        index = parseInt(bigIntDiscriminator) % 5;
      }
      const defaultImageUrl =
        `https://cdn.discordapp.com/embed/avatars/${index}.png`;
      const defaultImageResponse = await fetch(defaultImageUrl);
      if (defaultImageResponse.ok) {
        const defaultImageBuffer = await defaultImageResponse.arrayBuffer();
        const defaultResponse = new Response(defaultImageBuffer, {
          headers: {
            "Content-Type": "image/png",
          },
        });
        return defaultResponse;
      }
    } else {
      let imageheader;
      let usedurl
      if (userData.avatar.startsWith("a_")) {
        imageheader = "image/gif"
        usedurl = gifAvatarUrl
      } else {
        imageheader = "image/png"
        usedurl = pngAvatarUrl
      }

      const defaultImageResponse = await fetch(usedurl);
      if (defaultImageResponse.ok) {
        const defaultImageBuffer = await defaultImageResponse.arrayBuffer();
        const defaultResponse = new Response(defaultImageBuffer, {
          headers: {
            "Content-Type": imageheader,
          },
        });
        return defaultResponse;
      }

    }
  } catch (_) {
    return error(500);
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

  try {
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
  } catch (_) { }

  return data;
});

export default router;
