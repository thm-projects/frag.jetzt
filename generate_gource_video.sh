#!/bin/bash

# === Configuration ===
LOGO_PATH="src/assets/icons/chat_bot_green.png"
LOGO_OFFSET_X=1388
LOGO_OFFSET_Y=20
RESOLUTION="1920x1080"
TITLE_TEXT="frag.jetzt"
FONT="/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FPS=60
SECONDS_PER_DAY=0.3
CURRENT_YEAR=$(date +%Y)
DEFAULT_START_DATE="${CURRENT_YEAR}-01-01"
TODAY=$(date +%Y-%m-%d)
DATE_REGEX='^[0-9]{4}-[0-9]{2}-[0-9]{2}$'

# === Fixed style mode: dark theme ===
STYLE_MODE="dark"

echo "📅 Please enter the start date in format YYYY-MM-DD (e.g. 2025-03-01)"
echo "   The end date is fixed to today: ${TODAY}"
while true; do
  read -p "   Start date [${DEFAULT_START_DATE}]: " START_DATE
  START_DATE=${START_DATE:-$DEFAULT_START_DATE}
  if [[ $START_DATE =~ $DATE_REGEX ]]; then
    break
  else
    echo "❌ Invalid date format. Please use YYYY-MM-DD (e.g. 2025-03-01)"
  fi
done

STOP_DATE=${TODAY}
DATE_TEXT="${START_DATE} to ${STOP_DATE}"
OUTPUT_PPM="gource_${STYLE_MODE}_${START_DATE}_to_${STOP_DATE}.ppm"
OUTPUT_MP4="gource_${STYLE_MODE}_${START_DATE}_to_${STOP_DATE}.mp4"

# === Ask for background music file ===
echo "🎵 Optional: Add background music (must be .mp3 or .m4a)"
read -p "Enter path to audio file or leave blank to skip: " AUDIO_FILE
ADD_MUSIC=false
if [[ -f "$AUDIO_FILE" ]]; then
  ADD_MUSIC=true
  echo "🔊 Will include audio: $AUDIO_FILE (looped and volume-adjusted)"
else
  echo "ℹ️  No valid audio file specified. Continuing without music."
fi

# === Ask for YouTube export mode ===
echo "📺 Export for YouTube? (optimized quality and compatibility)"
echo "  y = yes, n = no"
read -p "Export for YouTube? [n]: " YT_CHOICE
YT_MODE=false
if [[ "$YT_CHOICE" =~ ^[Yy]$ ]]; then
  YT_MODE=true
  echo "✅ YouTube export enabled"
else
  echo "ℹ️  Standard export selected"
fi

# === Ask for Gource camera mode ===
echo "🎥 Select camera mode:"
echo "  1) overview - whole repo activity as a map"
echo "  2) track    - follow developers closely"
read -p "Camera mode [1]: " CAMERA_MODE_INPUT

case "$CAMERA_MODE_INPUT" in
  2) CAMERA_MODE="track";;
  *) CAMERA_MODE="overview";;
esac

# === Select Gource style options ===
GOURCE_OPTIONS=(
  -${RESOLUTION}
  --logo "${LOGO_PATH}"
  --logo-offset "${LOGO_OFFSET_X}x${LOGO_OFFSET_Y}"
  --key
  --seconds-per-day "${SECONDS_PER_DAY}"
  --auto-skip-seconds 1
  --start-date "${START_DATE}"
  --stop-date "${STOP_DATE}"
  -r ${FPS}
  --output-ppm-stream "${OUTPUT_PPM}"
)

GOURCE_OPTIONS+=(
  --bloom-intensity 0.5
  --camera-mode "${CAMERA_MODE}"
  --file-idle-time 45
  --background-colour 1A1A1A
  --font-colour CCCCCC
)

# === Step 1: Generate Gource visualization ===
echo "🚀 Generating Gource visualization in '${STYLE_MODE}' mode from ${START_DATE} to ${STOP_DATE}..."
gource "${GOURCE_OPTIONS[@]}"

# Check if output file was created
if [[ ! -f "$OUTPUT_PPM" ]]; then
  echo "❌ Gource failed to generate output. Check repository status and commit range."
  exit 1
fi

# === Step 2: ffmpeg -loglevel warning conversion with styled overlays ===

# Check if output file already exists
if [[ -f "$OUTPUT_MP4" ]]; then
  read -p "⚠️ File '${OUTPUT_MP4}' already exists. Overwrite? [y/N]: " OVERWRITE_CONFIRM
  if [[ ! "$OVERWRITE_CONFIRM" =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Choose a different start date or delete the existing file."
    rm -f "${OUTPUT_PPM}"  # Clean up temporary file
    exit 1
  fi
fi
echo "🎞️  Rendering video with styled text overlays..."
FFMPEG_FLAGS=(-vcodec libx264 -preset medium -crf 18 -pix_fmt yuv420p)

if $YT_MODE; then
  FFMPEG_FLAGS=(-vcodec libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart)
fi

if $ADD_MUSIC; then
  ffmpeg -r ${FPS} \
    -f image2pipe \
    -vcodec ppm \
    -i "${OUTPUT_PPM}" \
    -stream_loop -1 -i "$AUDIO_FILE" \
    -shortest \
    -filter_complex "[0:v]\
      drawtext=fontfile='${FONT}':text='${TITLE_TEXT}':fontcolor=white:fontsize=48:x=w-text_w-40:y=40:shadowcolor=black:shadowx=2:shadowy=2,\
      drawtext=fontfile='${FONT}':text='${DATE_TEXT}':fontcolor=white:fontsize=24:x=40:y=h-text_h-40:shadowcolor=black:shadowx=2:shadowy=2[outv];[1:a]volume=0.25[outa]" \
    -map "[outv]" -map "[outa]" \
    "${FFMPEG_FLAGS[@]}" \
    -c:a aac \
    "${OUTPUT_MP4}"
else
  ffmpeg -r ${FPS} \
    -f image2pipe \
    -vcodec ppm \
    -i "${OUTPUT_PPM}" \
    -vf "drawtext=fontfile='${FONT}':text='${TITLE_TEXT}':fontcolor=white:fontsize=48:x=w-text_w-40:y=40:shadowcolor=black:shadowx=2:shadowy=2,drawtext=fontfile='${FONT}':text='${DATE_TEXT}':fontcolor=white:fontsize=24:x=40:y=h-text_h-40:shadowcolor=black:shadowx=2:shadowy=2" \
    "${FFMPEG_FLAGS[@]}" \
    "${OUTPUT_MP4}"
fi

# Check if output video was created
if [[ ! -f "$OUTPUT_MP4" ]]; then
  echo "❌ ffmpeg failed to generate the output video."
  exit 1
fi



# === Cleanup ===
echo "🧹 Cleaning up temporary file..."
rm -f "${OUTPUT_PPM}"

# === Open result ===
echo "📽️ Opening final video: ${OUTPUT_MP4}"
open "${OUTPUT_MP4}"

STYLE_UPPER="$(tr '[:lower:]' '[:upper:]' <<< ${STYLE_MODE:0:1})${STYLE_MODE:1}"
echo "✅ Done! $STYLE_UPPER video created: ${OUTPUT_MP4}"
echo "ℹ️  Note: You can upload the video to YouTube for better quality."
echo "ℹ️  If you encounter any issues, please report them on GitHub."