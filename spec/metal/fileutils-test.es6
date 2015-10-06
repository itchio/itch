jest.dontMock('../../app/metal/fileutils');

describe('fileutils.ext', () => {
  let fileutils = require('../../app/metal/fileutils');

  it('works on a lowercase path', () => {
    expect(fileutils.ext('path/to/some/file.zip')).toBe('.zip');
  });

  it('works on an uppercase path', () => {
    expect(fileutils.ext('path/to/some/file.ZIP')).toBe('.zip');
  });

  it('returns null when no extension', () => {
    expect(fileutils.ext('path/to/some/file')).toBe(null);
  });

  it('returns last extension when have several', () => {
    expect(fileutils.ext('path/to/some/file.tar.gz')).toBe('.gz');
  });
});
