import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export type SoundName = 'tap' | 'correct' | 'wrong' | 'done';

const FILES: Record<SoundName, number> = {
  tap: require('../assets/sounds/tap.wav'),
  correct: require('../assets/sounds/correct.wav'),
  wrong: require('../assets/sounds/wrong.wav'),
  done: require('../assets/sounds/done.wav'),
};

let enabled = true;
let modeSet = false;
const players: Partial<Record<SoundName, AudioPlayer>> = {};

export function setSoundsEnabled(on: boolean) {
  enabled = on;
}

export function play(name: SoundName, force = false) {
  if (!enabled && !force) return;
  try {
    if (!modeSet) {
      modeSet = true;
      // Dźwięki nie przerywają muzyki w tle; wyciszony telefon (iOS) = cisza
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    }
    let p = players[name];
    if (!p) {
      p = createAudioPlayer(FILES[name]);
      p.volume = name === 'tap' ? 0.5 : 0.8;
      players[name] = p;
    }
    const player = p;
    player.seekTo(0).then(() => player.play()).catch(() => {});
  } catch {}
}
