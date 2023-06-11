const NodeMediaServer = require('node-media-server');
const speech = require('@google-cloud/speech');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

// Google Cloud credentials setup
const client = new speech.SpeechClient({
  keyFilename: '../sylvan-airship-389408-089d136be36d.json',
});

// Initialize NodeMediaServer
const config = {
  rtmp: {
    port: 1935, // RTMP port number
    chunk_size: 4000,
  },
};

const nms = new NodeMediaServer(config);
nms.run();

// Event handler when a new RTMP stream starts
nms.on('prePublish', async (id, streamPath) => {
  console.log(`New stream started: ${streamPath}`);

  // Speech-to-Text configuration
  const speechConfig = {
    encoding: 'LINEAR16',
    sampleRateHertz: 44100,
    languageCode: 'en-US',
  };

  // Create a new streaming recognition request
  const request = {
    config: speechConfig,
    interimResults: true, // Set to true to receive interim results
  };

  let recognizeStream;

  // Create a new streaming recognition session
  client
    .streamingRecognize(request)
    .on('error', (err) => {
      console.error('Error in speech recognition:', err);
    })
    .on('data', (data) => {
      // Process the speech recognition data
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        if (result.isFinal) {
          console.log('Final Transcript:', result.alternatives[0].transcript);
        } else {
          console.log('Interim Transcript:', result.alternatives[0].transcript);
        }
      }
    })
    .on('end', () => {
      console.log('Streaming recognition ended');
    })
    .on('close', () => {
      console.log('Streaming recognition closed');
    })
    .then((stream) => {
      recognizeStream = stream;

      // Create a write stream to save the audio chunks to a file
      const audioStream = fs.createWriteStream('audio_chunks.wav');

      // Extract audio from the RTMP stream and process it
      ffmpeg()
        .input(`rtmp://localhost:1935${streamPath}`)
        .outputOptions('-f wav')
        .output(audioStream)
        .on('start', () => {
          console.log('FFmpeg started');
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
        })
        .on('end', () => {
          console.log('FFmpeg processing finished');

          // Close the audio stream
          audioStream.end();

          // Close the streaming recognition session
          recognizeStream.end();
        })
        .run();

      // Event handler when data is received from the RTMP stream
      nms.on('postPublish', async (id, streamPath) => {
        // Get the audio data from the RTMP stream
        const audioData = await nms.getSession(id).getAudio(streamPath);

        // Send the audio data to the streaming recognition session
        recognizeStream.write(audioData);
      });

      // Event handler when the RTMP stream ends
      nms.on('donePublish', (id, streamPath) => {
        console.log(`Stream ended: ${streamPath}`);
      });
    });
});
