export function formatTime(seconds: number): string {
  if (!seconds || seconds === 0) return "0:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "0:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function parseAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.addEventListener("loadedmetadata", () => {
      resolve(audio.duration);
    });
    audio.addEventListener("error", reject);
    audio.src = URL.createObjectURL(file);
  });
}

export function generateWaveformData(audioBuffer: AudioBuffer, samples = 100): number[] {
  const data = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(data.length / samples);
  const waveform: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = start + blockSize;
    let sum = 0;
    
    for (let j = start; j < end; j++) {
      sum += Math.abs(data[j]);
    }
    
    waveform.push(sum / blockSize);
  }
  
  return waveform;
}

export function validateAudioFile(file: File): { isValid: boolean; error?: string } {
  const validTypes = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/flac", "audio/ogg"];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Please upload a valid audio file (MP3, WAV, FLAC, or OGG)",
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size must be less than 50MB",
    };
  }
  
  return { isValid: true };
}

export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Please upload a valid image file (JPEG, PNG, or WebP)",
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "Image size must be less than 10MB",
    };
  }
  
  return { isValid: true };
}
