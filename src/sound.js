/** A quiet, locally synthesized sea. Sound starts only after a user gesture. */
export function createAmbience() {
  let context;
  let master;
  let rainGain;
  let weather = 'clear';
  let enabled = false;

  async function toggle() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return { enabled: false, supported: false };
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0;
      master.connect(context.destination);

      const buffer = context.createBuffer(1, context.sampleRate * 7, context.sampleRate);
      const channel = buffer.getChannelData(0);
      let previous = 0;
      for (let index = 0; index < channel.length; index += 1) {
        previous = (previous + (Math.random() * 2 - 1) * 0.022) / 1.022;
        channel[index] = previous * 3.2;
      }
      const sea = context.createBufferSource();
      sea.buffer = buffer;
      sea.loop = true;
      const lowpass = context.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 780;
      const waves = context.createGain();
      waves.gain.value = 0.33;
      sea.connect(lowpass).connect(waves).connect(master);

      const swell = context.createOscillator();
      const swellDepth = context.createGain();
      swell.frequency.value = 0.095;
      swellDepth.gain.value = 0.12;
      swell.connect(swellDepth).connect(waves.gain);
      swell.start();
      sea.start();

      const rainBuffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
      const rainChannel = rainBuffer.getChannelData(0);
      for (let index = 0; index < rainChannel.length; index += 1) rainChannel[index] = (Math.random() * 2 - 1) * 0.1;
      const rainfall = context.createBufferSource();
      rainfall.buffer = rainBuffer;
      rainfall.loop = true;
      const rainFilter = context.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.value = 2600;
      rainGain = context.createGain();
      rainGain.gain.value = weather === 'rain' ? 0.45 : 0;
      rainfall.connect(rainFilter).connect(rainGain).connect(master);
      rainfall.start();
    }
    await context.resume();
    enabled = !enabled;
    master.gain.setTargetAtTime(enabled ? 0.48 : 0, context.currentTime, 0.28);
    return { enabled, supported: true };
  }

  function quiet(visible) {
    if (master && context) master.gain.setTargetAtTime(enabled && visible ? 0.48 : 0, context.currentTime, 0.2);
  }

  function setWeather(nextWeather) {
    weather = nextWeather;
    if (rainGain && context) rainGain.gain.setTargetAtTime(weather === 'rain' ? 0.45 : 0, context.currentTime, 0.7);
  }

  return { toggle, quiet, setWeather };
}
