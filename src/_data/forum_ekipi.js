const fetch = require("node-fetch");

module.exports = async function () {
  const url = "https://forum.illyrianbrains.dev/tag/bashkohu-ekipit.json";

  try {
    const res = await fetch(url);
    const data = await res.json();

    return data.topic_list.topics.map(topic => ({
      title: topic.title,
      url: `https://forum.illyrianbrains.dev/t/${topic.slug}/${topic.id}`,
      created_at: new Date(topic.created_at).toISOString(), // Ensures valid date parsing
      username: topic.last_poster_username
    }));
  } catch (err) {
    console.error("Failed to fetch bashkohu-ekipit data:", err);
    return [];
  }
};
