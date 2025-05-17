const fetch = require("node-fetch");

module.exports = async function () {
  const url = "https://forum.illyrianbrains.dev/g/perfaqesia/members.json";

  try {
    const res = await fetch(url);
    const data = await res.json();

    return data.members.map(member => ({
      name: member.name || member.username,
      username: member.username,
      avatar: member.avatar_template.replace("{size}", "240"),
      country: member.timezone?.split("/")[1]?.replace(/_/g, " ") || "n/a",
      flair: "Përfaqësia",
      lastSeen: member.last_seen_at?.split("T")[0] || "n/a"
    }));
  } catch (err) {
    console.error("Error fetching përfaqësia members:", err);
    return [];
  }
};
