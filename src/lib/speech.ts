/**
 * Text-to-speech with the browser's built-in Web Speech API (speechSynthesis).
 * It is free and needs no server or API key. The voice comes from the user's device,
 * so quality varies and some devices have no Romanian voice installed.
 */

export type SpeechSupport = 'unsupported' | 'no-romanian-voice' | 'ready';

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function findRomanianVoice(): SpeechSynthesisVoice | undefined {
  if (!speechSupported()) return undefined;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase() === 'ro-ro') ??
    voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('ro'))
  );
}

export function getSupport(): SpeechSupport {
  if (!speechSupported()) return 'unsupported';
  return findRomanianVoice() ? 'ready' : 'no-romanian-voice';
}

/** Placeholders like [your name] should not be read aloud letter by letter; leave a pause instead. */
export function speakableText(text: string): string {
  return text.replace(/\[[^\]]*\]/g, ', ').replace(/\s+/g, ' ').trim();
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}

/** Speak Romanian text. Calls onEnd when finished, stopped or failed. */
export function speakRomanian(text: string, opts: { slow?: boolean; onEnd?: () => void }): boolean {
  if (!speechSupported()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(speakableText(text));
  utterance.lang = 'ro-RO';
  const voice = findRomanianVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = opts.slow ? 0.7 : 0.95;
  utterance.onend = () => opts.onEnd?.();
  utterance.onerror = () => opts.onEnd?.();
  synth.speak(utterance);
  return true;
}
