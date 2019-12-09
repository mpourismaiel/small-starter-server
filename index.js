const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sass = require('node-sass');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
global.appRoot = path.resolve(__dirname);

const config = require('./config');
const compiler = require('./webpack.config');

const readFileAsync = (filePath, options = null) =>
  promisify(fs.readFile)(filePath, { encoding: 'utf-8', ...options });

const app = express();

const htmlFiles = {};
const port = process.env.PORT || 3000;
const cssOutput = path.resolve(global.appRoot, 'public/styles.css');
const jsOutDir = path.resolve(global.appRoot, 'public');
const jsOutFile = 'index.js';

fs.readdirSync(path.resolve(global.appRoot, 'assets/scripts'));

compiler(
  path.resolve(global.appRoot, 'assets/scripts/index.js'),
  jsOutDir,
  jsOutFile,
).run();
sass.renderSync({
  file: path.resolve(global.appRoot, 'assets/styles/index.scss'),
  outfile: cssOutput,
});

app.use(cors());
app.use(bodyParser.json());
app.use('/public', express.static('public'));

app.get('/', (req, res) => {
  res
    .status(200)
    .type('html')
    .send(htmlFiles.index);
});

const bootstrap = async () => {
  const templateData = await Promise.all(
    fs
      .readdirSync(path.resolve(global.appRoot, 'templates'))
      .map(template =>
        readFileAsync(
          path.resolve(global.appRoot, 'templates', template),
        ).then(file => [template.replace('.html', ''), file]),
      ),
  );

  templateData.forEach(
    ([fileName, file]) => (htmlFiles[fileName] = render(file)),
  );

  app.listen(port, () => {
    console.log(`server is running at http://localhost:${port}`);
  });
};

const render = template => {
  return Object.keys(config.variables).reduce(
    (tmp, key) =>
      tmp.replace(RegExp(`%${key.toUpperCase()}%`, 'g'), config.variables[key]),
    template
      .replace(/%PUBLIC_CSS%/g, cssOutput.replace(global.appRoot, ''))
      .replace(
        /%PUBLIC_JS%/g,
        path.resolve(jsOutDir, jsOutFile).replace(global.appRoot, ''),
      ),
  );
};

bootstrap();
