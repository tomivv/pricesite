const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const api = require('./api/api');

const app = express();
const port = 3001;


app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.send(`hahah`);
});

app.use('/api', api)

app.listen(port, () => console.log(`App running on http://localhost:${port}`));
