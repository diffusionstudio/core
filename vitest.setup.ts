// resolve circular deps
import './src/index';
import 'vitest-canvas-mock';
import { vi } from 'vitest';
import * as mocks from './vitest.mocks';

Object.assign(navigator, {
  storage: {
    getDirectory: async () => mocks.opfs
  }
});
Object.assign(globalThis, { URL: mocks.URLMock });
vi.stubGlobal('FontFace', mocks.FontFaceMock);
vi.stubGlobal('File', mocks.FileMock);
vi.stubGlobal('FileSystemFileHandle', mocks.FileSystemFileHandleMock);
vi.stubGlobal('FileSystemWritableFileStream', mocks.FileSystemWritableFileStreamMock);
Object.assign(globalThis, { queryLocalFonts: mocks.queryLocalFonts });
Object.assign(globalThis, {
  AudioEncoder: mocks.AudioEncoderMock,
  AudioData: mocks.AudioDataMock,
  VideoEncoder: mocks.VideoEncoderMock,
  VideoFrame: mocks.VideoFrameMock
});
vi.mock('pixi.js', async (importOriginal) => {
  class Renderer {
    height: undefined | number;
    width: undefined | number;

    async init(args: any) {
      this.height = args.height;
      this.width = args.width;
    }

    get canvas() {
      return document.createElement('canvas');
    }

    render = vi.fn();
  }

  return {
    ...await importOriginal<typeof import('pixi.js')>(),

    autoDetectRenderer: async (args: any) => {
      const renderer = new Renderer()
      await renderer.init(args);
      return renderer;
    },
    WebGPURenderer: Renderer,
    WebGLRenderer: Renderer,
    CanvasRenderer: Renderer,
  }
});

export const fetchMock = vi.fn();
fetchMock.mockResolvedValue(mocks.defaultFetchMockReturnValue);

Object.assign(globalThis, { fetch: fetchMock });
