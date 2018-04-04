const ping = require('mc-hermes');
const Rcon = require('rcon');
const guid = require('../guid');

function socketLogic(io) {
  io.on('connection', (socket) => {
    
    
    socket.on('mcping', (args) => {
      ping(args).then((data) => {
        socket.emit('mcping result', data);
      }).catch((error) => {
        socket.emit('mcping error', error);
      });
    });
    
    socket.on('rcon auth', (args) => {
      socket.rcon = new Rcon(args.host, args.port, args.password);
      socket.rcon.on('auth', () => {
        socket.emit('rcon authed');
      });
      socket.rcon.on('response', (str) => {
        socket.emit('rcon message', {message: str});
      });
      socket.rcon.on('end', () => {
        socket.emit('rcon end');
      });
      socket.rcon.on('error', () => {
        socket.emit('rcon error');
      });
      socket.rcon.connect();
    });
    
    socket.on('rcon send', (args) => {
      if(socket["rcon"] !== undefined) {
        socket.rcon.send(args.cmd);
      } else {
        socket.emit('rcon unauthed');
      }
    });
  }); 
}


module.exports = socketLogic;