import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import voice from "elevenlabs-node";
import express from "express";
import session from "express-session";
import crypto from "crypto";
import { promises as fs } from "fs";
import OpenAI from "openai";
dotenv.config();
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";


// const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-gen-ai-roEigZRkddmJb3IVO8zMT3BlbkFJGM6ythHXbuuEyRHW6wTw",
});

const elevenLabsApiKey = "sk_eecdffdebd510466e4b3e339d406f4597ecf1a6da8e68686";
const voiceID = "FGY2WhTYpPnrIDTdsKH5";

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

// Generate a random secret key
const generateSecretKey = () => {
  return crypto.randomBytes(64).toString('hex');
};

app.use(session({
  secret: generateSecretKey(),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/voices", async (req, res) => {
  res.send(await voice.getVoices(elevenLabsApiKey));
});

ffmpeg.setFfmpegPath(ffmpegPath);

const convertMp3ToWav = (inputFilePath, outputFilePath) => {
  return new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
          .toFormat('wav')
          .on('end', () => {
              console.log('Conversion to WAV completed');
              resolve();
          })
          .on('error', (err) => {
              console.error('Error converting to WAV:', err);
              reject(err);
          })
          .save(outputFilePath);
  });
}

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error); // Rejects the promise if there is an error
      } else if (stderr) {
        resolve(stderr); // Resolves with stderr if present
      } else {
        resolve(stdout); // Resolves with stdout if successful
      }
    });
  });
};

async function generateLipSyncJson(message) {
  try {
    const result = await execCommand(
      `./Rhubarb-Lip-Sync/rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`
    );
    // console.log("json generated");
    // console.log("heyaa");
    // console.log("Command output:", result); // Optional: log the command output
  } catch (error) {
    console.error("Execution failed:", error.message);
  }
}

const lipSyncMessage = async (message) => {
  const time = new Date().getTime();
  console.log(`Starting conversion for message ${message}`);
  //converting mp3 to wav file
  await convertMp3ToWav(`audios/message_${message}.mp3`, `audios/message_${message}.wav`)
    .then(() => console.log('Conversion done!'))
    .catch((err) => console.error('Conversion failed:', err));
  console.log(`Conversion done in ${new Date().getTime() - time}ms`)
  // wav to visemes in json file
  await generateLipSyncJson(message);
  console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
};

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  // Initialize session messages if they don't exist
  const previousMessages = req.session.messages || [];

  if (!userMessage) {
    res.send({
      messages: [
        {
          text: "Hey dear... How was your day?",
          audio: await audioFileToBase64("audios/intro_0.wav"),
          lipsync: await readJsonTranscript("audios/intro_0.json"),
          facialExpression: "smile",
          animation: "Talking_1",
        },
        {
          text: "I missed you so much... Please don't go for so long!",
          audio: await audioFileToBase64("audios/intro_1.wav"),
          lipsync: await readJsonTranscript("audios/intro_1.json"),
          facialExpression: "sad",
          animation: "Crying",
        },
      ],
    });
    return;
  }
  if (!elevenLabsApiKey || openai.apiKey === "-") {
    res.send({
      messages: [
        {
          text: "Please my dear, don't forget to add your API keys!",
          audio: await audioFileToBase64("audios/api_0.wav"),
          lipsync: await readJsonTranscript("audios/api_0.json"),
          facialExpression: "angry",
          animation: "Angry",
        },
        {
          text: "You don't want to ruin KuKu FM with a crazy ChatGPT and ElevenLabs bill, right?",
          audio: await audioFileToBase64("audios/api_1.wav"),
          lipsync: await readJsonTranscript("audios/api_1.json"),
          facialExpression: "smile",
          animation: "Standing",
        },
      ],
    });
    return;
  }

  // Add the user's message to the session messages
  previousMessages.push({
    role: "user",
    content: userMessage,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    max_tokens: 1000,
    temperature: 0.6,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: `
        You are a virtual girlfriend, Who is seductive and flirty, try to give longer answers.
        You will always reply with a JSON array of messages. With a maximum of 3 messages.
        Each message has a text, facialExpression, and animation property.
        The different facial expressions are: smile, sad, angry, surprised, and happy.
        The different animations are: Yes, No, Sad, Happy, Dance, Standing, and Angry. 
        `,
      },
      ...previousMessages,
    ],
  });

  let messages = JSON.parse(completion.choices[0].message.content);
  if (messages.messages) {
    messages = messages.messages; // ChatGPT is not 100% reliable, sometimes it directly returns an array and sometimes a JSON object with a messages property
  }

  console.log(messages);
  
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const fileName = `audios/message_${i}.mp3`;
    const textInput = message.text;
    await voice.textToSpeech(elevenLabsApiKey, voiceID, fileName, textInput);
    await lipSyncMessage(i);
    message.audio = await audioFileToBase64(fileName);
    message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
  }

  // Add the assistant's messages to the session messages
  previousMessages.push(...messages.map(msg => ({
    role: "assistant",
    content: msg.text,
  })));

  // Save the updated messages in the session
  req.session.messages = previousMessages;

  res.send({ messages });
});

const readJsonTranscript = async (file) => {
  const data = await fs.readFile(file, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString("base64");
};

app.listen(port, () => {
  console.log(`Virtual Girlfriend listening on port ${port}`);
});
