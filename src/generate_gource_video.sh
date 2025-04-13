#!/bin/bash

# === Configuration section ===
LOGO_PATH="src/assets/icons/chat_bot_green.png"               # Path to logo image
LOGO_OFFSET_X=1388                                            # Logo X offset (top-right)
LOGO_OFFSET_Y=20                                              # Logo Y offset (top)
RESOLUTION="1920x1080"                                        # Output resolution
TITLE_TEXT="frag.jetzt"                                       # Main text title
DATE_TEXT=$(date +%Y-%m-%d)                                   # Current date as watermark
FONT="/System/Library/Fonts/Supplemental/Arial Bold.ttf"      # Font file (macOS system font)
OUTPUT_PPM="gource_hq.ppm"                                    # Temporary output (PPM stream)
OUTPUT_MP4="gource_${DATE_TEXT}.mp4"                          # Final video filename with date
FPS=60                                                        # Frames per second
SECONDS_PER_DAY=0.3                                           # Timeline speed factor

# === Step 1: Generate Gource visualization (PPM stream) ===
echo "▶️ Generating PPM stream with Gource..."
gource -${RESOLUTION} \
  --logo "${LOGO_PATH}" \
  --logo-offset "${LOGO_OFFSET_X}x${LOGO_OFFSET_Y}" \
  --key \
  --seconds-per-day "${SECONDS_PER_DAY}" \
  --auto-skip-seconds 1 \                             # Skip idle periods
  --file-idle-time 0 \                                # Keep files visible
  --hide filenames \                                  # Hide filenames
  --camera-mode overview \                            # Global camera mode
  --multi-sampling \                                  # Anti-aliasing
  --bloom-intensity 0.8 \                             # Glowing effect
  -r ${FPS} \                                         # Target framerate
  --output-ppm-stream "${OUTPUT_PPM}"                 # Output to PPM stream file

# === Step 2: Convert to MP4 and overlay text ===
echo "🎞️  Converting PPM to MP4 with overlayed texts..."
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

# === Step 3: Clean up ===
echo "🧹 Cleaning up temporary file..."
rm -f "${OUTPUT_PPM}"

# === Step 4: Auto-open the final video ===
echo "📽️ Opening video: ${OUTPUT_MP4}"
open "${OUTPUT_MP4}"

# === Done ===
echo "✅ Done! Video created: ${OUTPUT_MP4}"
