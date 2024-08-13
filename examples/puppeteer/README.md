# Diffusion Studio Setup with Puppeteer and AWS S3 Integration

This README file will guide you through configuring an AWS S3 bucket, and running a Node.js script with Puppeteer to execute and interact with a development server. Follow the steps below to get everything up and running.

## Prerequisites

- **Node.js** installed on your machine.
- **AWS Account** with access to create and configure S3 buckets.

## 1. AWS S3 Bucket Setup

### 1.1 Create an S3 Bucket

1. Log in to your AWS Management Console.
2. Go to the S3 service and create a new bucket.
3. Note down the bucket name and region as you'll need these for configuration.

### 1.2 Create an IAM User

1. Go to the IAM service in the AWS Management Console.
2. Create a new IAM user with programmatic access.
3. Attach the `AmazonS3FullAccess` policy to this user to grant full access to S3.
4. Note down the Access Key ID and Secret Access Key.

### 1.3 Configure CORS for S3 Bucket

1. Go to the S3 bucket you created.
2. Navigate to the **Permissions** tab.
3. Find the **CORS configuration** section and add the following CORS rules:

    ```json
    [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
      }
    ]
    ```

    This configuration allows your application to make requests to S3 without being blocked by CORS.

## 2. Project Setup

### 2.1 Clone the Repository

Clone the repository to your local machine if you haven’t already:

```bash
git clone <repository-url>
cd ./core/examples/puppeteer
```

### 2.2 Install Dependencies

Install the required npm dependencies:

```bash
npm install
```

### 2.3 Create Environment Configuration

Create a `.env` file in the root of your project and add the following environment variables:

```
S3_ACCESS_KEY=YOUR_S3_ACCESS_KEY
S3_SECRET_KEY=YOUR_S3_SECRET_KEY
S3_REGION=YOUR_S3_BUCKET_REGION
S3_BUCKET=YOUR_S3_BUCKET_NAME
S3_FOLDER=YOUR_S3_FOLDER_NAME (default is 'output')
```

Replace the placeholders with your actual AWS credentials and S3 bucket details.

### 2.4 Start Vite Dev Server

Run the Vite development server:

```bash
npm run dev
```

This will start the Vite server and make your application available for interaction.

### 2.5 Run the Puppeteer Script

Execute the main script using `tsx` to interact with the Vite dev server, render a video, and upload the result to S3:

```bash
npm run main
```

The relevant script can be found in `index.ts`, which handles the evaluation of code on the dev server and performs the upload process.

## Summary

- **Set up** an S3 bucket and IAM user with appropriate permissions.
- **Configure** CORS settings for your S3 bucket to allow necessary HTTP methods.
- **Create** a `.env` file with your AWS credentials and bucket details.
- **Install** project dependencies using `npm install`.
- **Start** the Vite dev server with `npm run dev`.
- **Execute** the Puppeteer script with `npm run main` to render and upload content.

If you encounter any issues or have questions, refer to the documentation for Diffusion Studio, Vite, Puppeteer, or AWS S3, or feel free to reach out for support.
