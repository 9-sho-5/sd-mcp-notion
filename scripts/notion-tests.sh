#!/usr/bin/env bash
set -euo pipefail

# BASE_URL を上書きしたい場合: BASE_URL=http://127.0.0.1:3000 ./scripts/notion-tests.sh create
BASE_URL="${BASE_URL:-http://localhost:3000}"
EP="$BASE_URL/notion/pages"

# jq があれば整形、無ければそのまま出力
json() { command -v jq >/dev/null 2>&1 && jq . || cat; }

ts=$(date +%s)

usage() {
  cat >&2 <<USAGE
Usage: $0 {create|upsert|props|children}

  create    : タイトルのみで新規作成
  upsert    : slug 付きで作成→同じ slug でもう一度叩いて更新
  props     : プロパティ（原始値）を含めて作成
  children  : 子ブロック（見出し・段落）付きで作成

Env:
  BASE_URL  : デフォルト http://localhost:3000
USAGE
}

case "${1:-}" in
  create)
    curl -sS -X POST "$EP" -H 'Content-Type: application/json' \
      -d "{\"title\":\"Hello Notion $ts\"}" | json
    ;;

  upsert)
    slug="post-$ts"
    echo "Using slug: $slug" >&2

    echo "# create"
    curl -sS -X POST "$EP" -H 'Content-Type: application/json' \
      -d "{\"title\":\"Post A (v1)\",\"slug\":\"$slug\"}" | json

    echo "# update (same slug)"
    curl -sS -X POST "$EP" -H 'Content-Type: application/json' \
      -d "{\"title\":\"Post A (v2)\",\"slug\":\"$slug\"}" | json
    ;;

  props)
    slug="props-$ts"
    cat <<EOF | curl -sS -X POST "$EP" -H 'Content-Type: application/json' -d @- | json
{
  "title": "With props $ts",
  "slug": "$slug",
  "properties": {
    "Published": true,
    "Views": 123,
    "Url": "https://example.com",
    "Summary": "rich text sample"
  }
}
EOF
    ;;

  children)
    slug="children-$ts"
    cat <<EOF | curl -sS -X POST "$EP" -H 'Content-Type: application/json' -d @- | json
{
  "title": "With children $ts",
  "slug": "$slug",
  "children": [
    {
      "type": "heading_2",
      "heading_2": {
        "rich_text": [{ "type": "text", "text": { "content": "Section" } }]
      }
    },
    {
      "type": "paragraph",
      "paragraph": {
        "rich_text": [{ "type": "text", "text": { "content": "Body text" } }]
      }
    }
  ]
}
EOF
    ;;

  *)
    usage
    exit 1
    ;;
esac
