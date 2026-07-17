import { ENDPOINT } from '../config';

export interface RecordingResult {
  samples: Float32Array;
  sampleRate: number;
}

/**
 * Microphone recorder with live level metering and silence-based auto-stop.
 *
 * Uses a ScriptProcessorNode to collect raw PCM. (It's deprecated but universally
 * supported and simple; migrating to an AudioWorklet is a clean future upgrade.)
 * The processor is routed through a muted gain node so the mic is never echoed
 * back to the speakers.
 *
 * Consumers `await recorder.done` — it resolves on auto-stop, or when `stop()`
 * is called manually (e.g. the user taps the button again).
 */
export class Recorder {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private recording = false;

  private startedSpeech = false;
  private trailingSilenceMs = 0;

  private donePromise: Promise<RecordingResult> = Promise.resolve({
    samples: new Float32Array(0),
    sampleRate: 16_000,
  });
  private resolveDone: ((r: RecordingResult) => void) | null = null;

  /** Called on each processed buffer with a 0–1 level, for UI metering. */
  onLevel?: (level: number) => void;

  get done(): Promise<RecordingResult> {
    return this.donePromise;
  }

  async start(): Promise<void> {
    this.chunks = [];
    this.startedSpeech = false;
    this.trailingSilenceMs = 0;
    this.recording = true;
    this.donePromise = new Promise<RecordingResult>((resolve) => {
      this.resolveDone = resolve;
    });

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.ctx = new AudioContext();
    this.source = this.ctx.createMediaStreamSource(this.stream);

    const bufferSize = 2048;
    this.processor = this.ctx.createScriptProcessor(bufferSize, 1, 1);
    const frameMs = (bufferSize / this.ctx.sampleRate) * 1000;

    this.processor.onaudioprocess = (e: AudioProcessingEvent) => {
      if (!this.recording) return;
      const input = e.inputBuffer.getChannelData(0);
      const copy = new Float32Array(input.length);
      copy.set(input);
      this.chunks.push(copy);

      let sum = 0;
      for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
      const rms = Math.sqrt(sum / input.length);
      this.onLevel?.(Math.min(1, rms * 4));

      if (rms > ENDPOINT.vadGate) {
        this.startedSpeech = true;
        this.trailingSilenceMs = 0;
      } else if (this.startedSpeech) {
        this.trailingSilenceMs += frameMs;
      }

      const totalMs = this.chunks.length * frameMs;
      const autoStop =
        (this.startedSpeech && this.trailingSilenceMs >= ENDPOINT.trailingSilenceMs) ||
        totalMs >= ENDPOINT.maxRecordingMs;
      if (autoStop) this.finish();
    };

    // Route through a silent sink so onaudioprocess fires without audible monitoring.
    const sink = this.ctx.createGain();
    sink.gain.value = 0;
    this.source.connect(this.processor);
    this.processor.connect(sink);
    sink.connect(this.ctx.destination);
  }

  /** Manually stop recording; resolves `done`. */
  stop(): Promise<RecordingResult> {
    this.finish();
    return this.donePromise;
  }

  private finish(): void {
    if (!this.recording) return;
    this.recording = false;
    const result = this.collect();
    this.cleanup();
    const resolve = this.resolveDone;
    this.resolveDone = null;
    resolve?.(result);
  }

  private collect(): RecordingResult {
    const total = this.chunks.reduce((n, c) => n + c.length, 0);
    const samples = new Float32Array(total);
    let offset = 0;
    for (const c of this.chunks) {
      samples.set(c, offset);
      offset += c.length;
    }
    return { samples, sampleRate: this.ctx?.sampleRate ?? 48_000 };
  }

  private cleanup(): void {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.ctx = null;
  }
}
