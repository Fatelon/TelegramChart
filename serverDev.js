const express = require('express');
const app = express();

app.use(express.static(__dirname + '/tCharts'));

app.get('/chart_data.json/', (req, resp) => {
    resp.send(require(`./chart_data.json`));
});

app.listen(process.env.PORT || 8080);