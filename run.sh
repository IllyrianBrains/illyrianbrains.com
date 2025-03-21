#!/bin/bash

# Add --help output
if [ "$1" == "--help" ]; then
  echo "Usage: ./run.sh [options]"
  echo "Options:"
  echo "  --lang=<language code> (default: en)   Language code for the site"
  echo "  --insiders                             Enable insiders mode"
  echo '  --cmd="<base command>"                 Base command to run mkdocs'
  echo '                                         (default: "pipenv run mkdocs")'
  echo '  --cmd_flags="<flags>"                  Flags to pass to the base command'
  echo "  --build                                Build the site instead of serving it"
  echo "  --offline                              Build the site in offline mode"
  echo "  --production                           Build the site in production mode"
  echo ""
  echo "Examples:"
  echo "  $ bash run.sh"
  echo "  $ bash run.sh --lang=ru --insiders"
  echo '  $ bash run.sh --cmd="mkdocs" --cmd_flags="--dev-addr=0.0.0.0:8000"'
  echo "  $ bash run.sh --build"
  exit
fi

# Defaults
build=false
language="en"
base_cmd="pipenv run mkdocs"
offline=false
cmd_flags=()
insiders=false
export PRODUCTION=false

# Parse command-line arguments
for arg in "$@"
do
  case $arg in
    --lang=*)
    language="${arg#*=}"
    shift
    ;;
    --build)
    build=true
    shift
    ;;
    --offline)
    offline=true
    shift
    ;;
    --production)
    export PRODUCTION=true
    shift
    ;;
    --cmd_flags=*)
    cmd_flags+=("${arg#*=}")
    shift
    ;;
    *)
    shift
    ;;
  esac
done

# Set variables for offline mode
if $offline ; then
  export BUILD_EDIT_URI_TEMPLATE=''
  export BUILD_OFFLINE=true
  export BUILD_REPO_URL=''
  export CARDS=false
  export HOMEPAGE_BUTTON_GET_STARTED_LINK="basics/why-privacy-matters.html"
  export HOMEPAGE_BUTTON_TOOLS_LINK="tools.html"
fi

# Set environment variables if language is not en
if [ "$language" != "en" ]; then
  export BUILD_ABBREVIATIONS="includes/abbreviations.$language.txt"
  export BUILD_DOCS_DIR="i18n/$language"
  export BUILD_EDIT_URI_TEMPLATE="https://github.com/privacyguides/i18n/blob/main/i18n/$language/{path}?plain=1"
  export BUILD_SITE_DIR="site/$language"
  export BUILD_SITE_URL="https://www.privacyguides.org/$language"
  export BUILD_THEME_LANGUAGE="$language"
fi

# Run the command with the specified language
if $build ; then
  $base_cmd build "${cmd_flags[@]}"
else
  $base_cmd serve "${cmd_flags[@]}"
fi
