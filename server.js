const express = require('express');
const app = express();
const path = require('path');

const PORT = process.env.PORT || 4000;

const morgan = require('morgan');
app.use(morgan('dev'));

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const apiRouter = require('./server/api');
app.use('/api', apiRouter);

app.use('/public', express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});

module.exports = app;
