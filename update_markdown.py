import requests
import json
import argparse
import re

# File Paths
DEFAULT_SOURCE = "https://forum.illyrianbrains.dev/top.json?period=yearly"
DEFAULT_TAG = "## 🌍 Ndër diskutimet e fundit!"
DEFAULT_DEST = "./docs/index.base.md"
DEFAULT_DEST_FINAL = "./docs/index.md"
DEFAULT_COUNT = 6

def fetch_json(url):
    """Fetch JSON data from a URL."""
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    print(f"Error fetching data: {response.status_code}")
    return None

def extract_topics_and_users(json_data, count):
    """Extract topics and users from JSON response."""
    topics = json_data.get("topic_list", {}).get("topics", [])[:count]
    users = {user["id"]: user["username"] for user in json_data.get("users", [])}
    return topics, users

def generate_markdown(topics, users):
    """Generate Markdown/HTML for the topics."""
    markdown_output = "\n<div class=\"grid cards\" markdown>\n"
    for topic in topics:
        title = topic.get("title", "Unknown Title")
        topic_id = topic.get("id", "#")
        like_count = topic.get("like_count", 0)
        reply_count = topic.get("posts_count", 0)
        views = topic.get("views", 0)
        author_id = topic.get("posters", [{}])[0].get("user_id", None)
        author_username = users.get(author_id, "Unknown")

        markdown_output += f"""
<div class="card" markdown>
### [{title}](https://forum.illyrianbrains.dev/t/{topic_id})
**👤 Author:** {author_username}  
**👀 Views:** {views}  ❤️ Likes: {like_count}   💬 Replies: {reply_count}
</div>
"""
    markdown_output += "\n</div>\n"
    return markdown_output

def update_markdown_file(destination, final_destination, tag, new_content):
    """Insert new content after a given tag in a Markdown file."""
    try:
        with open(destination, "r", encoding="utf-8") as file:
            content = file.read()
        
        # Replace the section after the specified tag
        updated_content = re.sub(
            rf"({re.escape(tag)}\n)(.*?)(\n<br><br>)",
            rf"\1{new_content}\3",
            content,
            flags=re.DOTALL
        )

        with open(final_destination, "w", encoding="utf-8") as file:
            file.write(updated_content)

        print("✅ Updated index.md.")

    except FileNotFoundError:
        print(f"Error: {destination} does not exist!")
        exit(1)

def main():
    parser = argparse.ArgumentParser(description="Fetch and update forum topics in markdown.")
    parser.add_argument("--source", default=DEFAULT_SOURCE, help="URL of the Discourse JSON source")
    parser.add_argument("--tag", default=DEFAULT_TAG, help="Markdown tag to insert content after")
    parser.add_argument("--destination", default=DEFAULT_DEST, help="Base markdown file path")
    parser.add_argument("--destination_final", default=DEFAULT_DEST_FINAL, help="Final markdown file path")
    parser.add_argument("--count", type=int, default=DEFAULT_COUNT, help="Number of topics to fetch")

    args = parser.parse_args()

    # Fetch data
    json_data = fetch_json(args.source)
    if not json_data:
        return

    # Extract relevant info
    topics, users = extract_topics_and_users(json_data, args.count)

    # Generate Markdown content
    markdown_content = generate_markdown(topics, users)

    # Update Markdown file
    update_markdown_file(args.destination, args.destination_final, args.tag, markdown_content)

if __name__ == "__main__":
    main()
