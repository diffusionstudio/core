/**
 * Get the array buffer for silence detection
 * 
 * @param audioBuffer - The audio buffer to process
 * @param subSample - The number of samples to process at a time
 * @param minSilenceDuration - The minimum duration of silence to detect
 * @param silenceThreshold - The threshold for silence detection (in decibels < 0)
 * @param offsetSeconds - The offset in seconds to apply to the detected silences
 */
export function getSilenceArrayBuffer(
    audioBuffer: AudioBuffer,
    subSample: number,
    minSilenceDuration: number,
    silenceThreshold: number,
    offsetSeconds: number
) {
    if (audioBuffer.sampleRate === undefined) {
        throw new Error("Audio buffer has no sample rate");
    }

    const channelData = audioBuffer.getChannelData(0);
    console.log("max", channelData.reduce((max, val) => Math.max(max, val), 0));
    console.log("min", channelData.reduce((min, val) => Math.min(min, val), 0));

    // Process samples in chunks
    const sampleSize = subSample;
    const numChunks = Math.floor(channelData.length / sampleSize);
    const minSilenceChunks = Math.floor(
        (minSilenceDuration * audioBuffer.sampleRate) / subSample
    );

    const decibelValues: number[] = [];
    const silences: { start: number; stop: number }[] = [];

    for (let i = 0; i < numChunks; i++) {
        const chunk = channelData.slice(i * sampleSize, (i + 1) * sampleSize);
        const rms = Math.sqrt(
            chunk.reduce((sum, val) => sum + val * val, 0) / chunk.length
        );
        const db = 20 * Math.log10(Math.max(rms, 1e-10));
        decibelValues.push(db);
    }

    console.log("decibel", decibelValues);

    // Find silence periods in this clip
    let silenceStart: number | null = null;

    for (let i = 0; i < decibelValues.length; i++) {
        if (decibelValues[i] > silenceThreshold) {
            if (silenceStart === null) {
                silenceStart = i;
            }
        } else if (silenceStart !== null) {
            const silenceDuration = i - silenceStart;
            if (silenceDuration >= minSilenceChunks) {
                // Convert chunk indices to seconds and adjust for clip offset
                const silenceStartTime =
                    (silenceStart * sampleSize) / audioBuffer.sampleRate;
                const silenceStopTime =
                    (i * sampleSize) / audioBuffer.sampleRate;

                silences.push({
                    start: silenceStartTime + offsetSeconds,
                    stop: silenceStopTime + offsetSeconds,
                });
            }
            silenceStart = null;
        }
    }

    // Handle silence at end of clip
    if (silenceStart !== null) {
        const silenceDuration = decibelValues.length - silenceStart;
        if (
            silenceDuration >= minSilenceChunks ||
            silenceDuration == decibelValues.length
        ) {
            silences.push({
                start:
                    (silenceStart * sampleSize) / audioBuffer.sampleRate +
                    offsetSeconds,
                stop:
                    (channelData.length) / audioBuffer.sampleRate +
                    offsetSeconds,
            });
        }
    }

    return silences;
}
