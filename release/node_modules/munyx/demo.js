
process.env.BUILD_TAG = "v1.2.3"

const $ = require('.');

async function main () {
  $.benchmark = true;

  await $.show_versions(['node']);

  const input = await $.prompt('type something');
  $.putln(`had output: ${input}`);

  await $.yesno('continue demo?');
  $.putln(`continuing!`);

  await $.sh('echo hi');
  await $.sh('echa hi');
  const out = await $.get_output('ls');
  $.putln(`had output:\n${out}`);

  const files = await $.ls('.');
  $.putln(`files: ${files.length} total, first ${files[0]}`);

  const all_files = await $.find_all_files('.');
  $.putln(`all files: ${all_files.length} total, first ${all_files[0]}`);

  $.putln('npm list');
  await $.npm('list');

  $.putln(`lstat demo.js`);
  const stats = await $.lstat('demo.js');
  $.putln(`stats for demo.js: ${JSON.stringify(stats, null, 2)}`);

  $.putln(`read_file demo.js`);
  const contents = await $.read_file('demo.js');
  $.putln(`characters in demo.js: ${contents.length}`);

  await $.cd(`node_modules`, async () => {
    await $.sh('pwd');
  });
  await $.sh('pwd');
}

main();
