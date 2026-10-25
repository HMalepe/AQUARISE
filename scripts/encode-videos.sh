#!/usr/bin/env bash
# Re-encode the desktop clips for smooth scrolling: short GOP (-g 30) so decode resumes fast, no audio,
# faststart so playback begins before the download ends. Phone variants (*-m) are made by tools/footage/.
# Usage: scripts/encode-videos.sh   (reads/writes assets/video/, keeps the originals as *.orig.mp4)
set -euo pipefail
cd "$(dirname "$0")/../assets/video"
enc() {   # name width
  local n=$1 w=$2 src=$1.orig.mp4
  [ -f "$src" ] || cp "$n.mp4" "$src"   # keep the master once; re-runs always encode from it
  ffmpeg -y -v error -i "$src" -an -vf "scale=$w:-2:flags=lanczos" -c:v libx264 -preset slow -crf 28 -g 30 -pix_fmt yuv420p -movflags +faststart "$n.mp4"
  ffmpeg -y -v error -i "$src" -an -vf "scale=$w:-2:flags=lanczos" -c:v libvpx-vp9 -b:v 0 -crf 38 -g 30 -row-mt 1 "$n.webm"
  ls -la "$n.mp4" "$n.webm"
}
enc hero 1280
enc waterfall 960
enc sip 960
enc mist 960
