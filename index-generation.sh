#!/bin/bash

DATE_CMD="date"

# Check if the script is running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  DATE_CMD="gdate"
fi

# Defaults
source="https://forum.illyrianbrains.dev/top.json?period=monthly"
tag="## Ndër diskutimet e fundit!"

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

# Extract topics
topics=$(echo "$json_data" | jq -r ".topic_list.topics[:$count]")
users=$(echo "$json_data" | jq -r ".users")

# Initialize markdown output
markdown_output="\n<div class=\"grid cards\" markdown>\n"
for row in $(echo "${topics}" | jq -r '.[] | @base64'); do
  _jq() {
    echo "$row" | base64 --decode | jq -r "${1}"
  }

  title=$(_jq '.title')
  id=$(_jq '.id')
  like_count=$(_jq '.like_count')
  reply_count=$(_jq '.posts_count')
  views=$(_jq '.views')

  author_id=$(_jq '.posters[0].user_id')
  author_info=$(echo "$users" | jq -r ".[] | select(.id==$author_id)")
  author_username=$(echo "$author_info" | jq -r ".username")

  markdown_output+="\n<div class=\"card\" markdown>\n"
  markdown_output+="### [$title](https://forum.illyrianbrains.dev/t/${id})\n"
  markdown_output+="**👤 Author:** $author_username  \n"
  markdown_output+="**👀 Views:** $views  ❤️ Likes: $like_count   💬 Replies: $reply_count\n"
  markdown_output+="</div>\n"
done

markdown_output+="\n</div>\n"

# Ensure a backup exists
if [ ! -f "$destination" ]; then
  echo "Error: $destination does not exist!"
  exit 1
fi


# Insert new content after "## Ndër diskutimet e fundit!"
awk -v new_content="$markdown_output" '
  BEGIN {inside_section=0}
  /^## Ndër diskutimet e fundit!/ {
    print; print new_content; inside_section=1; next
  }
  inside_section && /^<br><br>/ {inside_section=0} 
  !inside_section {print}
' "$destination" > "$destination_final"

# DEBUG: Show final index.md
echo "✅ Updated index.md Preview:"
