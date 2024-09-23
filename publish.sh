#!/bin/bash

# Step 1: Run Vitest for unit testing in "run" mode to avoid waiting for changes
echo "Running unit tests with Vitest..."
npx vitest run

# Check if the tests were successful
if [ $? -ne 0 ]; then
  echo "Tests failed. Aborting publish."
  exit 1
fi

echo "Tests passed. Proceeding with build and publish..."

# Step 2: Remove the dist folder
echo "Removing dist folder..."
rm -rf dist

# Step 3: Build the library
echo "Building the library..."
npm run build

# Check if the build was successful
if [ $? -ne 0 ]; then
  echo "Build failed. Aborting publish."
  exit 1
fi

echo "Build successful."

# Step 4: Publish the package
echo "Publishing the package..."
npm publish

# Check if the publish was successful
if [ $? -ne 0 ]; then
  echo "Publish failed."
  exit 1
fi

echo "Package published successfully!"
