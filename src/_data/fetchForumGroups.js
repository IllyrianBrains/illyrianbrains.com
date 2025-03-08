const fs = require("fs").promises;
const path = require("path");
const fetch = require("node-fetch");

const GROUPS = [
  "Mentorimi",
  "Atlas",
  "Meso-Deutsch", 
  "Dizajni",
  "Eventet",
  "Komunikimi",
  "Teknologet",
  "AllStaff",
  "perfaqesia",
  "ruajtesit",
  "IB-Tech",
  "IB-Social",
];
const CACHE_FILE = path.join(__dirname, "forum_groups.json");

async function fetchGroupInfo(slug) {
  try {
    const [groupInfoRes, membersRes] = await Promise.all([
      fetch(`https://forum.illyrianbrains.dev/groups/${slug}.json`),
      fetch(`https://forum.illyrianbrains.dev/g/${slug}/members.json`)
    ]);

    if (!groupInfoRes.ok || !membersRes.ok) {
      throw new Error(`Failed to fetch data for group: ${slug}`);
    }

    const groupInfo = await groupInfoRes.json();
    const membersData = await membersRes.json();

    return {
      name: groupInfo.group.full_name || groupInfo.group.name,
      slug,
      description: groupInfo.group.bio_excerpt,
      flair: groupInfo.group.flair_url,
      members: membersData.members.map(member => ({
        name: member.name || member.username,
        username: member.username,
        avatar: member.avatar_template.replace("{size}", "240"),
        lastSeen: member.last_seen_at?.split("T")[0] || "n/a"
      }))
    };
  } catch (err) {
    console.error(`Error fetching group "${slug}":`, err.message);
    return null;
  }
}
module.exports = async function () {
  try {
    // Try to load from cache
    const data = await fs.readFile(CACHE_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    // If cache missing or error, fetch fresh
    const results = {};

    for (const groupSlug of GROUPS) {
      const group = await fetchGroupInfo(groupSlug);
      if (group) {
        results[group.slug] = {
          name: group.name,
          description: group.description,
          flair: group.flair,
          members: group.members,
        };
      }
    }

    // Save to disk
    await fs.writeFile(CACHE_FILE, JSON.stringify(results, null, 2));
    return results;
  }
};
