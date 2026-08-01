import { isUploadAllowed, UPLOAD_ALLOWLIST } from './upload-allowlist';

describe('upload-allowlist', () => {
  it('keeps the committed allowlist empty so emails are not on GitHub', () => {
    expect(UPLOAD_ALLOWLIST).toEqual([]);
  });

  it('allows any email when the allowlist is empty (open mode)', () => {
    expect(isUploadAllowed('anyone@example.com', [])).toBe(true);
    expect(isUploadAllowed(null, [])).toBe(true);
  });

  it('restricts to listed emails when the allowlist is non-empty', () => {
    const list = ['allowlisted@example.com'];
    expect(isUploadAllowed('allowlisted@example.com', list)).toBe(true);
    expect(isUploadAllowed('AllowListed@Example.com', list)).toBe(true);
    expect(isUploadAllowed('other@example.com', list)).toBe(false);
    expect(isUploadAllowed(null, list)).toBe(false);
  });
});
