const fetch = require("node-fetch");

module.exports = async function () {
  const url = "https://forum.illyrianbrains.dev/tag/event.json";

  try {
    const res = await fetch(url);
    const data = await res.json();

    return data.topic_list.topics.map(topic => ({
      title: topic.title,
      url: `https://forum.illyrianbrains.dev/t/${topic.slug}/${topic.id}`,
      image: topic.image_url || "https://forum.illyrianbrains.dev/user_avatar/forum.illyrianbrains.dev/system/240/1.png", // fallback
      created_at: topic.created_at
    }));
  } catch (err) {
    console.error("Error fetching event posts:", err);
    return [];
  }
};
