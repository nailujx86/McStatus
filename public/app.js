function isEmptyObject(obj) {
    var name;
    for (name in obj) {
        if (obj.hasOwnProperty(name)) {
            return false;
        }
    }
    return true;
}

var socket = io();
var app = new Vue({
    el: '#app',
    data: {
      serverAdress: "",
      serverPort: "",
      rconPassword: "",
      rconPort: "",
      messages: "",
      command: "",
      pingData: {version: {}, players: {}},
      rconEnabled: false,
      notifications: []
    },
    methods: {
      query: function() { 
        if(!!this.rconPassword.trim()) {
          socket.emit('rcon auth', {host: this.serverAdress, port: this.getRconPort, password: this.rconPassword});
        } else {
          this.rconEnabled = false;
          this.messages = "";
        }
        socket.emit('mcping', {server: this.serverAdress, port: this.getServerPort});
      },
      send_command: function() {
        socket.emit('rcon send', {cmd: this.command});
        this.command = "";
      }
    },
    computed: {
      disableButton: function() {
        return !this.serverAdress.trim();
      },
      getServerPort: function() {
        if(!this.serverPort.trim()) {
          return 25565;
        }
        return this.serverPort;
      },
      getRconPort: function() {
        if(!this.rconPort.trim()) {
          return 25575;
        }
        return this.rconPort;
      }
    }
});

function showNotification(color, timeout, message) {
  var notificationObj = {color: color, message: message, show: true};
  app.notifications.push(notificationObj);
  setTimeout(() => {
    notificationObj.show = false;  
  }, timeout);
}

socket.on('mcping result', (data) => {
  console.log(data);
  app.pingData = data;
});

socket.on('mcping error', (error) => {
  showNotification("is-danger", 4000, "Error pinging " + app.serverAdress + ":" + app.getServerPort);
});

socket.on('rcon error', (error) => {
  app.rconEnabled = false;
  showNotification("is-warning", 4000, "Error while trying to establish an rcon connection to " + app.serverAdress + ":" + app.getRconPort);
});

socket.on('rcon authed', () => {
  app.rconEnabled = true;
  app.messages += "Connected to remote console.\n";
});

socket.on('rcon message', (data) => {
  app.messages += data.message + "\n";
});

socket.on('error', () => {
  showNotification("is-warning", 4000, "Socket died.. We will try to reconnect you!");
});

socket.on('reconnect', () => {
  showNotification("is-success", 4000, "Socket reconnected. :)");
  app.query();
});