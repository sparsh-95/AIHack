import speech_recognition as sr
import datetime



def transcribe_speech(duration, listening_time):
    # Initialize the recognizer
    r = sr.Recognizer()
    transcriptions = []


    # Use the default system microphone as the audio source
    with sr.Microphone() as source:
        print("Speak now:")

        # Adjust for ambient noise
        r.adjust_for_ambient_noise(source)

        # Set the initial time
        start_time = datetime.datetime.now()

        # Loop until the desired duration is reached
        while (datetime.datetime.now() - start_time).seconds < duration:
            audio = r.listen(source, phrase_time_limit=listening_time)  # Listen for audio input


            try:
                # Transcribe the speech input
                text = r.recognize_google(audio)
                transcriptions.append(text)
                print(text)
                #print("Transcription:", text)

            except sr.UnknownValueError:
                print("Unable to recognize speech")

            except sr.RequestError as e:
                print("Error occurred: {0}".format(e))


# Call the function to start real-time transcription for 10 minutes

transcribe_speech(duration=180,listening_time = 30)



