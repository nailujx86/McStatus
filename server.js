const express = require('express')
const app = express()
const server = require('http').Server(app);
const io = require('socket.io')(server);
require('./api/socket-api')(io);

app.use(express.static('public'))

app.get("/", (request, response) => {
  response.sendFile(__dirname + '/views/index.html')
})

app.use("/api", require('./api/http-api'));

const listener = server.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`)
})
