# Use an x86_64 Node.js image as a parent image
FROM --platform=linux/amd64 node:14

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of your project files into the container
COPY . .

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Ensure the Rhubarb binary is executable
RUN chmod +x ./node_modules/rhubarb-lip-sync/.tools/rhubarb-Lip-Sync-1.13.0-Linux/rhubarb

# Run the visemes.js script
CMD ["node", "visemes.js"]
