/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var wsuri = "ws://lmc.redspin.net:9000";
var intro = null;
var MAP_ZOOM_MIN = 0.2;
var MAP_ZOOM_MAX = 1;
var MAP_ZOOM_DELTA = 0.4;
var notificationCache = [{
  "subject" : "",
  "body" : "No notifications yet :D"
}];
var cardHTML = "";
var t=0;
var currentView = "notifications";
// force rotation on ios
window.shouldRotateToOrientation = function(deg) {
	return true;
};
var app = {
  initialize: function() {
    FastClick.attach(document.body);
    this.bind();
    if (window['device'] === undefined) {
      this.deviceready();

      app.socket = io.connect('tv.hacknc.com');
      app.socket.on('message', function(msg) {
      	updateNotifications();
      });
    }

    document.getElementById('menu-button')
        .addEventListener('click', this.toggleMenu);
		// needs to be recomputed for window resize
		$("#map").css("top", $(".navbar-fixed").height()+"px");
    $("body").on('click', function(ev) {
      if ($("#menu").hasClass("menu-open")) {
        app.toggleMenu(ev);
      }
    });

    document.getElementById("map-controls-zoom-in")
        .addEventListener('click', function() {
        	var s = Math.min(this.zoomer.scale+MAP_ZOOM_DELTA, MAP_ZOOM_MAX);
        	this.zoomer.zoom(s);
        }.bind(this));
    document.getElementById("map-controls-zoom-out")
        .addEventListener('click', function() {
        	var s = Math.max(this.zoomer.scale-MAP_ZOOM_DELTA, MAP_ZOOM_MIN);
        	this.zoomer.zoom(s);
        }.bind(this));
		// handlesprimary view switches
		var activeTab = $("a[href='#notifications']").parent();
		$("#tab-row li.tab > a").each(function(idx, elm) {
			elm.addEventListener("click", function(event) {
				$(activeTab).removeClass("active-tab");
				$(elm).parent().addClass("active-tab");
				activeTab = $(elm).parent();
				setView(elm.hash.substr(1));
				event.preventDefault();
				event.stopPropagation();
				window.scroll(0,0);
			});
		});
		$("#menu a").each(function(idx, elm) {
			elm.addEventListener('click', function(event) {
				event.preventDefault();
				event.stopPropagation();
				$(activeTab).removeClass("active-tab");
				setView(elm.hash.substr(1));
			});
		});
		$("#mreq_email, #mreq_name").on('blur', function(ev) {
			$("#footer").show();
		});
		$("#mreq_email, #mreq_name").on('focus', function(ev) {
			$("#footer").hide();
		});
		$("#mreq_issue").on('blur', function(ev) {
			$("#footer").show();
		});
		$("#mreq_issue").on('focus', function(ev) {
			$("#footer").hide();
		});
		document.addEventListener('hidekeyboard', function(ev) {
			$("#footer").show();
		});
		document.addEventListener('showkeyboard', function(ev) {
			$("#footer").hide();
		});

		var maps = [
      'sitterson0',
      'phillips2',
      'phillips3',
      'carroll0',
      'carroll1',
      'chapman',
      'outside'
    ];
    $("#map-list-select").on("change", function() {
      var map = maps[this.selectedIndex];
      $("#map-view > img").attr("src", "img/" + map + ".png");
    });

    $("#map-view > img").on("load", resetMap);
  },
  toggleMenu: function(ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    $("#menu").removeClass("transition");
    $("#menu").addClass("transition").toggleClass("menu-close").toggleClass("menu-open");
  },
  onResume: function() {
    updateNotifications();
  },
  deviceready: function() {
		// set number of alerts to zero
		if (localStorage.unreadAlerts == undefined)
			localStorage.unreadAlerts = "0";
		// set seen latest seen alert id to -1
		if (localStorage.latestSeenAlert == undefined)
			localStorage.latestSeenAlert = "-1";
		// init alert cache
		if (localStorage.alertCache == undefined)
			localStorage.alertCache = JSON.stringify([]);
		//Some things Brandon Does on initial load.
		scheduleLoad();
		updateNotifications();
		setView('notifications');
		////////////////////////////////////////
		// phone specific things past this point.
		////////////////////////////////////////
		if (window['device'] == undefined) return;
    // This is an event handler function, which means the scope is the event.
    // So, we must explicitly called `app.report()` instead of `this.report()`.
    window.push = PushNotification.init({
      "android": {
        "senderID": "824858956988"
      },
      "ios": {
        "alert": "true",
        "badge": "true",
        "sound": "true"
      },
      "windows": {}
    });
    push.on('registration', function(data) {
	  //data.registrationId
	  $.get('http://tv.hacknc.com/reg?id=' + data.registrationId + "&platform=" + device.platform + "&uuid=" + device.uuid,
        function(stuff) {});
    });
    push.on('registration', function(data) {
  	  //data.registrationId
    	$.get('http://tv.hacknc.com/reg?id=' + data.registrationId + "&platform=" + device.platform,
          function(stuff) {});
    });
    push.on('notification', function(data) {
    	var id = data.additionalData.id;
    	if (parseInt(localStorage.latestSeenAlert) == id + 1) {
        JSON.parse(localStorage.alertCache).push({
          message: data.message,
          subject: data.title,
          id: id
        });
      }
      addUnreadAlerts();
      updateNotifications();
    });
    push.on('error', function(e) {
      console.log("push error", e);
    });
  },
  bind: function() {
    document.addEventListener('deviceready', this.deviceready, true);
    document.addEventListener("resume", this.onResume, false);
  },
};

var resetMap = function() {
  if (app.zoomer) {
    app.zoomer.destroy();
    app.zoomer = null;
  }
  var $img = $("#map-view > img");
  var minMapScale = Math.min(($("body").width()-10)/$img.width(), MAP_ZOOM_MAX);
  app.zoomer = new IScroll("#map-view", {
    zoom: true,
    scrollbars: true,
    scrollX: true,
    scrollY: true,
    freeScroll: true,
    mouseWheel: true,
    wheelAction: 'zoom',
    zoomMin: minMapScale,
    zoomMax: MAP_ZOOM_MAX
  });
  app.zoomer.zoom(minMapScale, undefined, undefined, 0);
};

var setView = function(name) {
  var activecolor = "#AAAAAA";

  views = ['notifications', 'schedule', 'mentors', "info", "sponsors", "map"];
  if (name == "notifications") {
    updateNotifications();
    window.addEventListener('scroll', windowScrollUnreadAlerts);
    windowScrollUnreadAlerts();
  }
  else {
    window.removeEventListener('scroll', windowScrollUnreadAlerts);
  }

  $("#" + name ).show();
  $("." + name ).eq(0).css("fill" , activecolor);
  hideOthers(views, name);
  currentView = name;

  if (name == "map") {
   resetMap();
 }
 else {
   if (app.zoomer) {
    app.zoomer.destroy();
    app.zoomer = null;
  }
}
	// close menu when switching windows
  if ($("#menu").hasClass("menu-open")) {
  	app.toggleMenu();
  }
};

var hideOthers = function(views, name) {
  var passivecolor = "#212121";
  delete views[views.indexOf(name)];
  for (i = 0; i< views.length; i++){
    $("#" + views[i]).hide();
    $("." + views[i]).each( function () {
      $(this).css("fill" , passivecolor);
      $(this).css("color", passivecolor);
    });
  }
};

var scheduleLoad = function() {
  var url = "http://hacknc.com/schedule/json/student.json";
  var scheduleJson;
  var setSchedule = function(data) {
    var fritable = "";
    var sattable = "";
    var sntable = "";
    for (var i =0 ; i<data.events.length ; i++) {
      thisEvent = data.events[i];
      var elem = "<tr><td class='schedule-first'>" + thisEvent.starttime + (thisEvent.endtime ? "<br>" + thisEvent.endtime : " " ) +  "</td><td>" + thisEvent.room + "</td><td>" + thisEvent.title + "</td></tr>";
      if (data.events[i].day.toLowerCase() == "friday") {
        fritable += elem;
      } else if (thisEvent.day.toLowerCase() == "saturday") {
        sattable += elem;
      } else {
        sntable += elem;
      }
    }
    $("#fritable > tbody").html(fritable);
    $("#sattable > tbody").html(sattable);
    $("#sntable > tbody").html(sntable);
  };

  if (localStorage.schedule) {
    setSchedule(JSON.parse(localStorage.schedule));
  }

  $.getJSON(url , function(data) {
      scheduleJson = data;
      localStorage.schedule = JSON.stringify(data);
      setSchedule(data);
  });
};

var updateNotifications = function() {
  var cardHTML = '';
  var cache = JSON.parse(localStorage.alertCache);
  for (var i = 0; i < cache.length; i++) {
    cardHTML = "<div class=card> <div class='card-content black-text'><span class='card-title black-text'>" + cache[i].subject + "</span><div>" + cache[i].message + "</div></div></div>" + cardHTML;
  }
  $("#notifications-internal").html(cardHTML);
  $.getJSON("http://tv.hacknc.com/archive" , function(data) {
    var maxid = -1;
    var newAlertCache = [];
    cardHTML="";
    for (var i = 0; i < data.length; i++) {
      maxid = Math.max(maxid, parseInt(data[i].id));
      newAlertCache.push({
        message: data[i].message,
        subject: data[i].subject,
        id: parseInt(data[i].id)
      });
      cardHTML = "<div class=card> <div class='card-content black-text'><span class='card-title black-text'>" + data[i].subject + "</span><div>" + data[i].message + "</div></div></div>" + cardHTML;
    }
    $("#notifications-internal").html(cardHTML);
    localStorage.latestSeenAlert = maxid.toString();
    localStorage.alertCache = JSON.stringify(newAlertCache);
  });
};

var getMentor = function() {
  intro = {};
  intro.type = "help";
  intro.uid = getUserID();
  intro.name = $("#mreq_name").val();
  intro.issue = $("#mreq_issue").val();
  intro.email = $("#mreq_email").val();
  intro.skills = [];
  $('#checkboxes input:checked').each(function () {
    intro.skills.push($(this).attr('name'));
  });
  initWS();
  requestUiUpdate(false);
};

var cancelMentor = function() {
  //send a server message saying we want to cancel the request
  var cancel = {
    "type" : "remove",
    "uid" : getUserID()
  };
  ws.send(JSON.stringify(cancel));
  requestUiUpdate(true);
};

var requestUiUpdate = function(showForm){
  //Remove the request form
  if(!showForm){
    $("#request-form-card").hide();
    $("#submitted").show();
  } else {
    $("#request-form-card").show();
    $("#submitted").hide();
  }
};

var getUserID = function() {
  // this should always return the same value for the same device client.
  // Cookies for web.
  // Storing to memory if
  if (localStorage.muid) {
    //It's already set.  Leave it alone
    return localStorage.muid;
  } else{
    localStorage.muid = createGuid();
    return localStorage.muid;
  }
};

var createGuid = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
};

var initWS = function() {
  ws = new WebSocket(wsuri);
  ws.onopen = function(evt){onOpen(evt);};
  ws.onmessage = function(evt){onMessage(evt);};
};

var onMessage = function(event){
  var msg = JSON.parse(event.data);
  if(msg.type == "response"){
    $("#submitted-waiting").show();
    $("#submitted-response").text(msg.body);
  } else if (msg.type == "respond"){
    var name = "<p>Name: "+ msg.body.name + "</p>";
    var location = "<p>Location "+ msg.body.location + " </p>";
    var message = "<p>Message: " + msg.body.message + "</p>";
    var email = "<p>Email: " + msg.body.email + "</p>";
    $("#submitted-mentor-response").show();
    $("#submitted-response-2").empty();
    $("#submitted-response-2").append(name);
    $("#submitted-response-2").append(location);
    $("#submitted-response-2").append(message);
    $("#submitted-response-2").append(email);
    $("#submitted-waiting").hide();
  }
};

var newRequest = function() {
  $("#submitted").hide();
  $("#submitted-mentor-response").hide();
  $("#request-form-card").show();
};

var onOpen = function(event){
  ws.send(JSON.stringify(intro));
};

var addUnreadAlerts = function() {
  if (localStorage.unreadAlerts) {
    if (currentView != 'notifications' || window.scrollY > 0) {
      localStorage.unreadAlerts = "" + (parseInt(localStorage.unreadAlerts) + 1);
      $("#notification-count").text(localStorage.unreadAlerts);
      $("#notification-count").show();
    }
  }
};

var resetUnreadAlerts = function() {
  localStorage.unreadAlerts = "0";
  $("#notification-count").hide();
};

var windowScrollUnreadAlerts = function() {
  if (window.scrollY == 0)
    resetUnreadAlerts();
};
