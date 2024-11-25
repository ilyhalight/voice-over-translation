export type ChunkRange = {
  start: number;
  end: number;
  mustExist: boolean;
};

export type fetchAudioWithMetaOpts = {
  audioUrl: string;
  chunkRange: ChunkRange;
  fetchOpts: Record<string, unknown>;
  isUrlChanged?: boolean;
};

export type AudioObject = {
  audio: ArrayBuffer;
  url: string | null;
  isAcceptableLast: boolean;
};
