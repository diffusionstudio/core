# XML Encoder

Since the FCPXML docs [here]() are often incomplete and do not add a lot of details, this was created to supplement the information found in the official docs. This documentations is specific to diffusion studio core and how the composition is encoded to XML.

This is for the fcpxml version 1.1.

All following elements need to be incased in a `<fcpxml version="1.10">` element.

## Resources

All the sources need to be listed here with there format. The ids of all the elements in the resources section need to be unique.

### Format

Example for a video format:

```xml
<format id="r0" width="1920" height="1080" frameDuration="1/30s" name="FFVideoFormat1080p30"/>
```

Currently all videos are given the same format of 30 fps and 1080p and the audio rate is 48000.

### Asset

Each source is translated to an asset with a mediaRep. The mediaRep has the source file path relative to the project file. 

## Library

### Sequence

All tracks of one composition are translated to a sequence.

#### Spine

Each track is translated to a spine.

#### Asset-clip

Each clip is translated to an asset-clip.

### Differences

The offset in diffusion studio core is added to the start time of the source clip. This means that if the offset is 1000/1000s, the clip will start 1 second later. if you subclip the clip, the offset will be added to the start and stop time of the clip. This means that a sublcip of 1000/1000s to 2000/1000s with an offset of 1000/1000s will start after 2 seconds.

In the XML encoding the offset defines the start time of the clip relative to the start of the timeline. This means that a sublcip of 1000/1000s to 2000/1000s with an offset of 1000/1000s will start after 1 seconds. It ingores the original source clip start and stop time.
