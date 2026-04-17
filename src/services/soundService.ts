/**
 * services/soundService.ts - 音效生成服务
 * 使用Web Audio API生成不同频率的音效
 */

class SoundService {
  private audioContext: AudioContext | null = null;
  private currentOscillator: OscillatorNode | null = null;
  private currentGain: GainNode | null = null;
  private isPlaying = false;

  /**
   * 初始化音频上下文
   */
  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * 停止当前正在播放的音效
   */
  private stopCurrentSound() {
    if (this.currentOscillator && this.currentGain && this.audioContext) {
      try {
        // 淡出 (fade out) 以避免刺耳声音
        const now = this.audioContext.currentTime;
        this.currentGain.gain.setValueAtTime(this.currentGain.gain.value, now);
        this.currentGain.gain.linearRampToValueAtTime(0, now + 0.05);

        setTimeout(() => {
          try {
            this.currentOscillator?.stop();
            this.currentOscillator?.disconnect();
            this.currentGain?.disconnect();
          } catch (e) {
            // 已经停止
          }
        }, 50);
      } catch (e) {
        // 已经停止
      }
    }
    this.currentOscillator = null;
    this.currentGain = null;
    this.isPlaying = false;
  }

  /**
   * 播放不同方向的音效
   * @param direction 'left' (高频) 或 'right' (低频)
   * @param duration 音效持续时间 (毫秒)
   */
  playDirectionSound(direction: 'left' | 'right', duration: number = 500) {
    // 如果已经有音效在播放，停止它
    if (this.isPlaying) {
      this.stopCurrentSound();
    }

    const ctx = this.initAudioContext();

    // 恢复音频上下文如果被挂起
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // 创建振荡器和增益节点
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 频率设置
    // 向左：高频 (1000Hz) - 尖锐的声音
    // 向右：低频 (400Hz) - 沉闷的声音
    oscillator.frequency.value = direction === 'left' ? 1000 : 400;
    oscillator.type = 'sine'; // 使用正弦波，声音更柔和

    // 音量设置
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime); // 初始音量
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (duration / 1000)); // 淡出

    // 连接节点
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 开始播放
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + (duration / 1000));

    // 保存当前状态
    this.currentOscillator = oscillator;
    this.currentGain = gainNode;
    this.isPlaying = true;

    // 播放完毕后更新状态
    setTimeout(() => {
      this.isPlaying = false;
    }, duration);
  }

  /**
   * 播放准备音效 (一段简短的高音调)
   */
  playReadySound() {
    // 如果已经有音效在播放，跳过预备音效（防止打断）
    if (this.isPlaying) {
      return;
    }

    const ctx = this.initAudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 准备音：两个短促的高音调
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);

    this.currentOscillator = oscillator;
    this.currentGain = gainNode;
    this.isPlaying = true;

    setTimeout(() => {
      this.isPlaying = false;
    }, 300);
  }

  /**
   * 检查是否有音效正在播放
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * 停止播放
   */
  stop() {
    this.stopCurrentSound();
  }
}

// 导出单例
export const soundService = new SoundService();
