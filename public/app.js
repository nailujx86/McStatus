function isEmptyObject(obj) {
    var name;
    for (name in obj) {
        if (obj.hasOwnProperty(name)) {
            return false;
        }
    }
    return true;
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

var socket = io();
var app = new Vue({
    el: '#app',
    data: {
      serverAdress: "",
      submittedServerAdress: "",
      serverPort: "",
      rconPassword: "",
      rconPort: "",
      messages: "",
      command: "",
      pingData: {version: {}, players: {}},
      rconEnabled: false,
      notifications: [],
      updateInterval: null
    },
    methods: {
      query: function() { 
        if(!!this.rconPassword.trim()) {
          socket.emit('rcon auth', {host: this.serverAdress, port: this.getRconPort, password: this.rconPassword});
        } else {
          this.rconEnabled = false;
          this.messages = "";
        }
        clearInterval(this.updateInterval);
        this.submittedServerAdress = this.serverAdress;
        this.submittedServerPort = this.getServerPort;
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

function update() {
  socket.emit('mcping', {server: app.submittedServerAdress, port: app.submittedServerPort});
}

socket.on('mcping result', (data) => {
  app.pingData = data;
  setTimeout(update, 1000);
});

socket.on('mcping error', (error) => {
  console.log(JSON.stringify(error));
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
  clearInterval(app.updateInterval);
  showNotification("is-warning", 7000, "Connection to socket died.. We will try to reconnect you!");
  if(app.rconEnabled) app.messages += "Disconnected from remote console.\n";
});

socket.on('reconnect', () => {
  showNotification("is-success", 4000, "Socket reconnected. :)");
  app.query();
});

if(getUrlParameter('host') != '') {
  console.log(getUrlParameter('host'));
  app.serverAdress = getUrlParameter('host');
  app.query();
}