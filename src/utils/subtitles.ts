export type SubtitleCue = { start: number; end: number; text: string };

// Accepts "HH:MM:SS,mmm", "HH:MM:SS.mmm" or "MM:SS.mmm".
const timeToSeconds = (value: string): number => {
  const cleaned = value.trim().replace(',', '.');
  const parts = cleaned.split(':');

  if (parts.length === 3) {
    return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  }

  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  return Number(cleaned) || 0;
};

const TIME_TOKEN = '(\\d{1,2}:\\d{2}:\\d{2}[.,]\\d{1,3}|\\d{1,2}:\\d{2}[.,]\\d{1,3})';
const TIME_LINE = new RegExp(`${TIME_TOKEN}\\s*-->\\s*${TIME_TOKEN}`);

// Parses both SubRip (.srt) and WebVTT (.vtt); they share the cue block layout
// and differ mainly in the millisecond separator and an optional header.
export const parseSubtitles = (raw: string): SubtitleCue[] => {
  const text = raw.replace(/\r\n/g, '\n').replace(/^﻿/, '');
  const lines = text.split('\n');
  const cues: SubtitleCue[] = [];

  let index = 0;
  while (index < lines.length) {
    const match = lines[index].match(TIME_LINE);

    if (!match) {
      index += 1;
      continue;
    }

    const start = timeToSeconds(match[1]);
    const end = timeToSeconds(match[2]);
    index += 1;

    const textLines: string[] = [];
    while (index < lines.length && lines[index].trim() !== '') {
      textLines.push(lines[index]);
      index += 1;
    }

    const cueText = textLines
      .join('\n')
      .replace(/<[^>]+>/g, '') // strip simple inline markup (e.g. <i>, <b>)
      .trim();

    if (cueText && end > start) {
      cues.push({ start, end, text: cueText });
    }
  }

  cues.sort((a, b) => a.start - b.start);
  return cues;
};

export const findActiveCue = (
  cues: SubtitleCue[],
  time: number,
): string => {
  for (const cue of cues) {
    if (time >= cue.start && time <= cue.end) {
      return cue.text;
    }

    if (cue.start > time) {
      break;
    }
  }

  return '';
};
