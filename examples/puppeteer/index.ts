import * as dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

// Configure the AWS region and credentials
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  region: process.env.S3_REGION!,
});

// Function to generate a presigned URL
async function generatePresignedUrl() {
  const bucketName = process.env.S3_BUCKET!;
  const objectKey = `${process.env.S3_FOLDER ?? 'output'}/${Date.now()}.mp4`;
  const expiresIn = 3600; // URL expiration time in seconds (1 hour)

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: 'video/mp4',
  });

  return await getSignedUrl(s3, command, { expiresIn });
};

/**
 * Define a function that will be executed
 * in the Browser
 */
async function main(presignedUrl: string) {
  try {
    // or 'comp' for short
    const composition = new core.Composition();

    // fetch the video
    const source = await core.VideoSource // convenience function for fetch -> blob -> file
      .from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4');

    // create a video clip and trim it
    const video = new core.VideoClip(source) // compatible with the File API
      .subclip(0, 150); // The base unit is frames at 30 FPS

    // create a text clip and stylize it
    const text = new core.TextClip('Bunny - Our Brave Hero')
      .set({ position: 'center', stop: 90, stroke: { color: '#000000' } })

    // this is how to compose your clips
    await composition.appendClip(video);
    await composition.appendClip(text);

    // export video using webcodecs at 25 FPS
    await new core.WebcodecsEncoder(composition, { fps: 25 }).export(presignedUrl);

    return 'SUCCESS';
  } catch (e) {
    return String(e)
  }
}

// run function with puppeteer
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // make sure to run `npm run dev` first
  await page.goto('http://localhost:5173');

  const presignedUrl = await generatePresignedUrl();

  const res = await page.evaluate(main, presignedUrl);
  console.log(res)
  await browser.close();
})();