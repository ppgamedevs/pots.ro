# Video Optimization Guide

## Hero Banner Video Requirements

### File Specifications:
- **Format**: MP4 (H.264 codec)
- **Resolution**: 1920x1080 (Full HD) or 1280x720 (HD)
- **Duration**: 10-30 seconds (recommended: 15-20 seconds)
- **File Size**: Maximum 5MB for fast loading
- **Frame Rate**: 24-30 fps
- **Bitrate**: 2-4 Mbps for good quality/size balance

### Content Guidelines:
- **Loop-friendly**: Video should loop seamlessly
- **Muted**: No audio required (auto-muted for autoplay)
- **Floristry theme**: Show flowers, arrangements, products, or marketplace activity
- **Professional**: Clean, modern aesthetic matching the site design

### Optimization Commands:

#### Using FFmpeg (recommended):
```bash
# Basic optimization
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart hero-banner.mp4

# For smaller file size (lower quality)
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset fast -vf "scale=1280:720" -c:a aac -b:a 96k -movflags +faststart hero-banner.mp4

# For better quality (larger file)
ffmpeg -i input.mp4 -c:v libx264 -crf 20 -preset slow -c:a aac -b:a 128k -movflags +faststart hero-banner.mp4
```

#### Using HandBrake (GUI):
1. Open HandBrake
2. Load your video
3. Preset: "Web - Gmail Large 3 Minutes 720p30"
4. Video tab: H.264, RF 23, Encoder Preset: Medium
5. Audio tab: AAC, 128 kbps
6. Start encoding

### Performance Tips:
- Use `movflags +faststart` for progressive download
- Keep file size under 5MB for mobile users
- Test on various devices and connections
- Consider WebM format for even better compression (add WebM source to component)

### Fallback Image:
- Create a high-quality poster image (`hero-poster.jpg`)
- Should represent the video content
- Size: 1920x1080 or 1280x720
- Format: JPEG, optimized for web (quality 85-90%)

### Testing:
- Test video loading on slow connections
- Verify autoplay works on mobile devices
- Check that fallback image displays correctly
- Ensure video loops smoothly without gaps
