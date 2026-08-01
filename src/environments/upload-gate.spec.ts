import { UPLOAD_GATE_ACTIVE } from './upload-gate';

describe('upload-gate', () => {
  it('defaults to gated in committed source', () => {
    expect(UPLOAD_GATE_ACTIVE).toBe(true);
  });
});
