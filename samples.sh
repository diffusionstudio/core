#!/bin/bash

# Define variables
RESOLUTION="1080p" # or 2160p
INPUT_URL="http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_${RESOLUTION}_60fps_normal.mp4"
LOCAL_VIDEO="downloaded_video.mp4"
START_TIME="00:07:57"
DURATION="20"

# Output directory
OUTPUT_DIR="./outputs"
mkdir -p $OUTPUT_DIR

# Download the video
echo "Downloading video from $INPUT_URL..."
curl -o $LOCAL_VIDEO $INPUT_URL

# Check if the download was successful
if [ $? -ne 0 ]; then
  echo "Failed to download the video."
  exit 1
fi

echo "Download completed."

FPS_LIST=("24" "30" "60")
PIX_FMT="yuv420p"

# Process video with different pixel formats
for FPS in "${FPS_LIST[@]}"
do
  OUTPUT_FILE="${OUTPUT_DIR}/sample_aac_h264_${PIX_FMT}_${RESOLUTION}_${FPS}fps.mp4"
  echo "Processing with fps: $FPS"
  ffmpeg -i $LOCAL_VIDEO -ss $START_TIME -t $DURATION -c:v libx264 -c:a aac -pix_fmt $PIX_FMT -r $FPS $OUTPUT_FILE
done

echo "Processing completed. Check the $OUTPUT_DIR directory for output files."
