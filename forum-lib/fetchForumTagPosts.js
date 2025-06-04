const fs = require("fs").promises;
const path = require("path");
const fetch = require("node-fetch");

const TAGS = ["bashkohu-ekipit", "event", "atlas"];
const CACHE_FILE = path.join(__dirname, "forum_tags.json");

async function fetchTagTopics(tag) {
  const url = `https://forum.illyrianbrains.dev/tag/${tag}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch tag: ${tag}`);
  const data = await res.json();

  const usersByUsername = {};
  for (const user of data.users) {
    usersByUsername[user.username] = {
      username: user.username,
      name: user.name || user.username,
      avatar: user.avatar_template.replace("{size}", "120"),
    };
  }

  return {
    tag,
    name: tag,
    description: data.tags?.[0]?.description || "",
    topics: (data.topic_list.topics || [])
      .slice(0, 5)
      .map((topic) => {
        const poster = usersByUsername[topic.last_poster_username] || {
          name: topic.last_poster_username,
          avatar: `/user_avatar/forum.illyrianbrains.dev/${topic.last_poster_username}/120/1.png`,
        };

        return {
          title: topic.title,
          slug: topic.slug,
          url: `https://forum.illyrianbrains.dev/t/${topic.slug}/${topic.id}`,
          created_at: topic.created_at,
          tags: topic.tags || [],
          image_url: topic.image_url || null,
          poster,
        };
      }),
  };
}
module.exports = async function () {
  const forceRefresh = process.env.REFETCH === "true";

  if (!forceRefresh) {
    try {
      const cached = await fs.readFile(CACHE_FILE, "utf8");
      return JSON.parse(cached);
    } catch {
      // Cache doesn't exist or failed to read – fall back to fetching
    }
  }

  const results = {};

  for (const tag of TAGS) {
    try {
      const tagData = await fetchTagTopics(tag);
      results[tag] = {
        name: tagData.name,
        description: tagData.description,
        topics: tagData.topics,
      };
    } catch (err) {
      console.error(`Error fetching tag "${tag}": ${err.message}`);
    }
  }

  await fs.writeFile(CACHE_FILE, JSON.stringify(results, null, 2));
  return results;
};
