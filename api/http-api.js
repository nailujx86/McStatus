const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const ping = require('mc-hermes');
const guid = require('../guid');
const Rcon = require('rcon');

router.use(bodyParser.json());
var rconConnections = {}

router.post("/ping", (req, res, next) => {
  var reqObj = req.body;
  if(!reqObj.type.trim() || !reqObj.server.trim()) res.sendStatus(400);
  ping(reqObj).then((data) => {
    res.json(data);
  }).catch((error) => {
    res.sendStatus(500);
  });
});

router.post("/rcon/auth", (req, res, next) => {
  var authObj = req.body;
  if(!authObj.host.trim() || !authObj.port.trim() || authObj.password == undefined) res.sendStatus(400);
  var rconGuid = guid();
  var rcon = new Rcon(authObj.host, authObj.port, authObj.password);
  rcon.on('auth', () => {
    var id = guid();
    rcon.connId = id;
    rcon.messages = [];
    rconConnections[id] = rcon;
    var retobj = {id: id};
    res.json(retobj);
  });
  rcon.on('response', (str) => {
    rcon.messages.push(str);
  });
  rcon.on('end', () => {
    delete rconConnections[rcon.connId];
  });
  rcon.on('error', (error) => {
    res.sendStatus(400);
  });
  rcon.connect();
});

router.get("/rcon/console", (req, res, next) => {
  var id = req.query.id;
  if(id == undefined || rconConnections[id] == undefined) res.sendStatus(400);
  var retObj = {messages: rconConnections[id].messages};
  res.json(retObj);
});

router.post("/rcon/send", (req, res, next) => {
  var sendObj = req.body;
  if(!sendObj.id.trim() || sendObj.cmd == undefined || rconConnections[sendObj.id] == undefined) res.sendStatus(400);
  rconConnections[sendObj.id].send(sendObj.cmd);
  res.sendStatus(200);
});

module.exports = router;