#!/usr/bin/env bash
# Yangi tur videosini sayt uchun tayyorlaydi.
#   bash scripts/prepare-video.sh <video.mp4> [video2.mp4 ...]
# Bir nechta klip berilsa — ketma-ket bitta videoga ulanadi (masalan, Veo 8s'lik bo'laklar).
# Natija: public/media/tour-hd.mp4 (1080p), tour.mp4 (720p) + scripts/contact-sheet.jpg (vaqtlarni topish uchun)
set -euo pipefail
[ $# -ge 1 ] || { echo "Foydalanish: bash scripts/prepare-video.sh <video.mp4> [video2.mp4 ...]"; exit 1; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${OUT:-$ROOT/public/media}"  # test uchun: OUT=/boshqa/papka bash ...
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 1) Kliplarni bitta 24fps videoga ulash (har xil o'lcham/fps bo'lsa ham)
inputs=(); filters=""
for i in $(seq 0 $(($# - 1))); do
  inputs+=(-i "${@:$((i + 1)):1}")
  filters+="[$i:v]scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440,fps=24,setsar=1[v$i];"
done
concat=""; for i in $(seq 0 $(($# - 1))); do concat+="[v$i]"; done
ffmpeg -v error -y "${inputs[@]}" -filter_complex "${filters}${concat}concat=n=$#:v=1:a=0[v]" \
  -map "[v]" -c:v libx264 -crf 12 -preset fast -pix_fmt yuv420p "$TMP/master.mp4"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/master.mp4")
echo "Umumiy davomiylik: ${DUR}s"

# 2) All-intra (har kadr keyframe) — kamera orqaga/oldinga bir zumda yurishi uchun shart
enc() { # $1 kenglik  $2 crf  $3 fayl
  ffmpeg -v error -y -i "$TMP/master.mp4" -an -vf "scale=$1:-2:flags=lanczos" \
    -c:v libx264 -preset slow -crf "$2" -tune film -g 1 -keyint_min 1 \
    -pix_fmt yuv420p -movflags +faststart "$OUT/$3"
}
enc 1920 19 tour-hd.mp4
enc 1280 21 tour.mp4

# 3) Bo'limlar to'xtash nuqtalarini topish uchun kontakt-varaq (har 0.5s, 8 ustun)
ffmpeg -v error -y -i "$TMP/master.mp4" -vf "fps=2,scale=320:-2,tile=8x$(( ( ${DUR%.*} * 2 + 7 ) / 8 + 1 ))" \
  -frames:v 1 "$ROOT/scripts/contact-sheet.jpg"

ls -la "$OUT"
echo
echo "Keyingi qadam: scripts/contact-sheet.jpg ga qarab lib/departments.ts dagi time qiymatlarini"
echo "va public/media/posters/*.jpg ni yangilash kerak (har bir katak = 0.5 soniya)."
