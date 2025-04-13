#!/bin/bash

# === Configuration section ===
LOGO_PATH="src/assets/icons/chat_bot_green.png"               # Path to logo image
LOGO_OFFSET_X=1388                                            # Logo X offset (top-right)
LOGO_OFFSET_Y=20                                              # Logo Y offset from top
RESOLUTION="1920x1080"                                        # Output resolution
TITLE_TEXT="frag.jetzt"                                       # Main title text
FONT="/System/Library/Fonts/Supplemental/Arial Bold.ttf"      # macOS system font
FPS=60                                                        # Frame rate
SECONDS_PER_DAY=0.3                                           # Timeline speed factor

# === Date setup ===
CURRENT_YEAR=$(date +%Y)
DEFAULT_START_DATE="${CURRENT_YEAR}-01-01"
TODAY=$(date +%Y-%m-%d)
DATE_REGEX='^[0-9]{4}-[0-9]{2}-[0-9]{2}$'

echo "📅 Please enter the start date in format YYYY-MM-DD (e.g. 2025-03-01)"
echo "   The end date is fixed to today: ${TODAY}"

# === Read and validate start date ===
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

# === Dynamic filenames and text overlays ===
DATE_TEXT="${START_DATE} to ${STOP_DATE}"                    # Text shown in bottom-left corner
OUTPUT_PPM="gource_${START_DATE}_to_${STOP_DATE}.ppm"       # Temp file
OUTPUT_MP4="gource_${START_DATE}_to_${STOP_DATE}.mp4"       # Final output file

# === Step 1: Generate Gource visualization as PPM stream ===
echo "▶️ Generating PPM stream from ${START_DATE} to ${STOP_DATE}..."
gource -${RESOLUTION} \
  --logo "${LOGO_PATH}" \
  --logo-offset "${LOGO_OFFSET_X}x${LOGO_OFFSET_Y}" \
  --key \
  --seconds-per-day "${SECONDS_PER_DAY}" \
  --auto-skip-seconds 1 \
  --file-idle-time 0 \
  --hide filenames \
  --camera-mode overview \
  --multi-sampling \
  --bloom-intensity 0.8 \
  --start-date "${START_DATE}" \
  --stop-date "${STOP_DATE}" \
  -r ${FPS} \
  --output-ppm-stream "${OUTPUT_PPM}"

# === Step 2: Convert to MP4 and overlay texts ===
echo "🎞️  Converting to MP4 with overlayed texts..."
ffmpeg -r ${FPS} \
  -f image2pipe \
  -vcodec ppm \
  -i "${OUTPUT_PPM}" \
  -vf "drawtext=fontfile='${FONT}':\
text='${TITLE_TEXT}':\
fontcolor=white:fontsize=48:\
x=w-text_w-40:y=40:\
shadowcolor=black:shadowx=2:shadowy=2,\
drawtext=fontfile='${FONT}':\
text='${DATE_TEXT}':\
fontcolor=white:fontsize=24:\
x=40:y=h-text_h-40:\
shadowcolor=black:shadowx=2:shadowy=2" \
  -vcodec libx264 \
  -preset medium \
  -crf 18 \
  -pix_fmt yuv420p \
  "${OUTPUT_MP4}"

# === Step 3: Clean up temporary file ===
echo "🧹 Cleaning up temporary file..."
rm -f "${OUTPUT_PPM}"

# === Step 4: Automatically open the final video ===
echo "📽️ Opening video: ${OUTPUT_MP4}"
open "${OUTPUT_MP4}"

# === Done ===
echo "✅ Done! Video created: ${OUTPUT_MP4}"
