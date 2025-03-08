#!/bin/bash

DATE_CMD="date"

# Check if the script is running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  DATE_CMD="gdate"
fi

# Defaults
source="https://forum.illyrianbrains.dev/top.json?period=monthly"
tag="## 🌍 Ndër diskutimet e fundit!"

destination="./docs/index.base.md"  # Base Markdown file for MkDocs
destination_final="./docs/index.md"  # Final updated file

count=6

for arg in "$@"
do
  case $arg in
    --source=*)
    source="${arg#*=}"
    shift
    ;;
    --tag=*)
    tag="${arg#*=}"
    shift
    ;;
    --destination=*)
    destination="${arg#*=}"
    shift
    ;;
    --count=*)
    count="${arg#*=}"
    shift
    ;;
  esac
done

# URL of the Discourse top.json
DISCOURSE_URL="$source"

# Fetch the JSON data
json_data=$(curl -s "$DISCOURSE_URL")

# Extract topics and users
topics=$(echo "$json_data" | jq -c ".topic_list.topics[:$count]")
users=$(echo "$json_data" | jq -c ".users")

# Initialize markdown output
markdown_output="\n<div class=\"grid cards\" markdown>\n"

# Loop through topics safely
echo "$topics" | jq -c '.[]' | while read -r row; do
  title=$(echo "$row" | jq -r '.title')
  id=$(echo "$row" | jq -r '.id')
  like_count=$(echo "$row" | jq -r '.like_count')
  reply_count=$(echo "$row" | jq -r '.posts_count')
  views=$(echo "$row" | jq -r '.views')
  author_id=$(echo "$row" | jq -r '.posters[0].user_id')

  # Get author username safely
  author_username=$(echo "$users" | jq -r --argjson id "$author_id" '.[] | select(.id==$id) | .username')

  markdown_output+="\n<div class=\"card\" markdown>\n"
  markdown_output+="### [$title](https://forum.illyrianbrains.dev/t/${id})\n"
  markdown_output+="**👤 Author:** $author_username  \n"
  markdown_output+="**👀 Views:** $views  ❤️ Likes: $like_count   💬 Replies: $reply_count\n"
  markdown_output+="</div>\n"
done

markdown_output+="\n</div>\n"

echo "$markdown_output"

# Ensure a backup exists
if [ ! -f "$destination" ]; then
  echo "Error: $destination does not exist!"
  exit 1
fi

# Insert new content after "## Ndër diskutimet e fundit!"
awk -v new_content="$markdown_output" '
  BEGIN {inside_section=0}
  /^## 🌍 Ndër diskutimet e fundit!/ {
    print; print new_content; inside_section=1; next
  }
  inside_section && /^<br><br>/ {inside_section=0} 
  !inside_section {print}
' "$destination" > "$destination_final"

# DEBUG: Show final index.md
echo "✅ Updated index.md."
cat "$destination_final"
