const fs = require("fs").promises;
const path = require("path");
const fetch = require("node-fetch");

async function fetchCategorySummary(id, override_name) {
  const url = `https://forum.illyrianbrains.dev/c/${id}/show.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch category summary for ${id}`);
  const data = await res.json();

  return {
    name: override_name || data.category.name,
    description: data.category.description || "",
  };
}

async function fetchCategoryTopics(id) {
  const url = `https://forum.illyrianbrains.dev/c/${id}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch category topics for ${id}`);
  const data = await res.json();

  const usersById = {};
  for (const user of data.users) {
    usersById[user.id] = {
      username: user.username,
      name: user.name || user.username,
      avatar: user.avatar_template.replace("{size}", "120"),
    };
  }

  return (data.topic_list.topics || []).slice(0, 12).map((topic) => {
    const poster = usersById[topic.posters?.[0]?.user_id] || {
      name: topic.last_poster_username,
      avatar: `https://forum.illyrianbrains.dev/user_avatar/forum.illyrianbrains.dev/${topic.last_poster_username}/120/1.png`,
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
  });
}

const CATEGORIES = [
  // Qytetet

  { slug: "qytetet/germanics", id: 149, override_name: "Gjermanikët"},
  { slug: "qytetet/north-america", id: 146, override_name: "Amerika e Veriut"},
  { slug: "qytetet/nordics", id: 147, override_name: "Europa Veriore" },
  { slug: "qytetet/southern-europe", id: 148, override_name: "Europa Jugore" },
  { slug: "qytetet/western-europe", id: 150, override_name: "Europa Perëndimore" },

  { slug: "qytetet/qytetet-e-reja", id: 27, override_name: "Qytetet e reja" },

  // Eventet
  { slug: "eventet/happyhours", id: 145, override_name: "HappyHours" },
  { slug: "eventet/webinare", id: 155, override_name: "Webinare" },
  { slug: "eventet/ndryshe", id: 156, override_name: "Ndryshe" },
  { slug: "eventet/njoftime", id: 99, override_name: "Njoftime" },

  // Nismat
  { slug: "nismat/atlas", id: 144, override_name: "Atlas" },
  { slug: "mentorimi", id: 111, override_name: "Mentorimi" },
  { slug: "nismat/meso-deutsch", id: 158, override_name: "Meso-Deutsch" },
  { slug: "nismat/sociale", id: 103, override_name: "IB-Social" },
  { slug: "ib-tech", id: 94, override_name: "IB-Tech" },

  { slug: "nismat/propozime", id: 66, override_name: "Propozime" },

  // Orga
  { slug: "orga/njoftime", id: 70, override_name: "Njoftime" },
  { slug: "orga/udhezime", id: 153, override_name: "Udhëzime" },
];

const CACHE_FILE = path.join(__dirname, "forum_posts.json");

module.exports = async function () {
  const forceRefresh = process.env.REFETCH === "true";

  if (!forceRefresh) {
    try {
      const cached = await fs.readFile(CACHE_FILE, "utf8");
      return JSON.parse(cached);
    } catch {
      // continue to fetch if cache missing
    }
  }


  const results = {};

    for (const category of CATEGORIES) {
    try {
        const [meta, topics] = await Promise.all([
            fetchCategorySummary(category.id, category.override_name),
            fetchCategoryTopics(category.id),
        ]);

        results[category.override_name] = {
            slug: category.slug,
            id: category.id,
            name: meta.name,
            description: meta.description,
            topics,
        };
    } catch (err) {
        console.error(`Error fetching category "${category.slug}": ${err.message}`);
    }
  };


  await fs.writeFile(CACHE_FILE, JSON.stringify(results, null, 2));
  return results;
};
