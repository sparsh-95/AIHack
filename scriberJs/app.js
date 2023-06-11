const fs = require('fs');
const http = require('http');
const speech = require('@google-cloud/speech');

const PORT = 8000;
const CHUNK_DURATION = 0.5 * 60 * 1000; // 0.5 minutes in milliseconds

// Configure Google Cloud Speech-to-Text client
const client = new speech.SpeechClient({
  keyFilename: '../sylvan-airship-389408-089d136be36d.json',
});

// Create an HTTP server
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/audio') {
    let audioData = [];
    let audioDuration = 0;

    req.on('data', (chunk) => {
      audioData.push(chunk);
      audioDuration += chunk.length;
    });

    req.on('end', () => {
      console.log('Audio stream received');

      const audioBuffer = Buffer.concat(audioData);
      const numChunks = Math.ceil(audioDuration / CHUNK_DURATION);

      // Process the audio chunks
      for (let i = 0; i < numChunks; i++) {
        const start = i * CHUNK_DURATION;
        const end = start + CHUNK_DURATION;
        const chunk = audioBuffer.slice(start, end);

        processAudioChunk(chunk)
          .then((transcription) => {
            console.log(`Chunk ${i + 1}:`, transcription);
          })
          .catch((error) => {
            console.error(`Error processing chunk ${i + 1}:`, error);
          });
      }

      res.statusCode = 200;
      res.end('Audio stream received');
    });
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Function to process each audio chunk
async function processAudioChunk(chunk) {
  // Configure the audio settings
  const audio = {
    content: chunk.toString('base64'),
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Transcribe the audio using Google Cloud Speech-to-Text
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map((result) => result.alternatives[0].transcript)
    .join(' ');

  return transcription;
}
