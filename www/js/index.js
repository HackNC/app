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
var MAP_ZOOM_MAX = 4;
var MAP_ZOOM_DELTA = 0.4;
 
 var notificationCache = [{
	"subject" : "",
	"body" : "No notifications yet :D"
 }];
 
var cardHTML = "";

var t=0;

// force rotation on ios
window.shouldRotateToOrientation = function(deg) {
	return true;
};

var app = {
    initialize: function() {
        FastClick.attach(document.body);
        this.bind();
        //Some things Brandon Does on initial load.
        scheduleLoad();
		updateNotifications();
        setView('notifications');

		var uuid = window['device'] == undefined ? 'undefined' : device.uuid;
		$.get('http://159.203.73.64:9001/reg?id=' + uuid, function(stuff) {
			});

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

				// handles primary view switches
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

				document.getElementById('mreq_name')
						.addEventListener('focus', function(ev) {
					$("#footer").hide();
				});
				document.getElementById('mreq_name')
						.addEventListener('blur', function(ev) {
					$("#footer").show();
				});
				document.getElementById('mreq_issue')
						.addEventListener('focus', function(ev) {
					$("#footer").hide();
				});
				document.getElementById('mreq_issue')
						.addEventListener('blur', function(ev) {
					$("#footer").show();
				});
				document.addEventListener('hidekeyboard', function(ev) {
					$("#footer").show();
				});
				document.addEventListener('showkeyboard', function(ev) {
					$("#footer").hide();
				});
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
        // This is an event handler function, which means the scope is the event.
        // So, we must explicitly called `app.report()` instead of `this.report()`.
		window.push = PushNotification.init({
            "android": {
                "senderID": "824858956988"
            },
            "ios": {}, 
            "windows": {} 
        });
		
        push.on('registration', function(data) {
            console.log("register", data.registrationId);
			//data.registrationId
			$.get('http://159.203.73.64:9001/reg?id=' + data.registrationId, function(stuff) {
			});
        });

        push.on('notification', function(data) {
        	console.log("notification event", data);
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


function setView(name) {
    var activecolor = "#AAAAAA";

    views = ['notifications', 'schedule', 'mentors', "info", "sponsors", "map"];
    console.log("view set " + name);
	if (name == "notifications") {
		updateNotifications();
	}

    $("#" + name ).show();
    $("." + name ).eq(0).css("fill" , activecolor);
    hideOthers(views, name);

		if (name == "map") {
			var minMapScale = ($("body").width()-10)/$("#map-view > img").width();
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
}

function hideOthers(views, name){
    var passivecolor = "#212121";

    delete views[views.indexOf(name)];
    for (i = 0; i< views.length; i++){
        $("#" + views[i]).hide();
        $("." + views[i]).each( function () {
            $(this).css("fill" , passivecolor);
            $(this).css("color", passivecolor);
        });
    }
}
function scheduleLoad(){
    //alert("Load");
    //get JSON
    var url = "http://hacknc.com/schedule/json/student.json";

    var scheduleJson;

    var setSchedule = function(data) {
            for (var i =0 ; i<data.events.length ; i++){
            thisEvent = data.events[i];
            //console.log(thisEvent);
            var elem = "<tr><td class='schedule-first'>" + thisEvent.starttime + (thisEvent.endtime ? " - " + thisEvent.endtime : " " ) +  "</td><td>" + thisEvent.title + "</td></tr>";

            if (data.events[i].day.toLowerCase() == "friday"){
                //console.log("friday");
                var fritable = $("#fritable tr:last");
                fritable.after(elem);
            } else if (thisEvent.day.toLowerCase() == "saturday"){
                var sattable = $("#sattable tr:last");
                sattable.after(elem);
            } else {
                var sntable = $("#sntable tr:last");
                sntable.after(elem);
            }
        }
    };
    


    $.getJSON(url , function(data) {
        scheduleJson = data;
        localStorage.schedule = data;
        console.log(data);
        setSchedule(data);
    })
    .fail(function(d, textStats, error) {
        setSchedule(localStorage.schedule);
        console.log("1done" + error);
    });

    
	
}

function updateNotifications() {
	$.getJSON("http://159.203.73.64:9001/archive" , function(data) {
		console.log('notification data', data);
		 cardHTML="";
		 for (var i = 0; i < data.length; i++) {
				cardHTML = "<div class=card> <div class='card-content black-text'><span class='card-title black-text'>" + data[i].subject + "</span><div>" + data[i].message + "</div></div></div>" + cardHTML;
				$("#notifications-internal").html(cardHTML);
			}
	 });
}
function getMentor(){
    intro = {};
    intro.type = "help";
    intro.uid = getUserID();
    intro.name = $("#mreq_name").val();
    intro.issue = $("#mreq_issue").val();
    initWS();

    //Fake it for now
    requestUiUpdate(false);
}

function cancelMentor() {
    requestUiUpdate(true);
}

function requestUiUpdate(showForm){
    //Remove the request form
    if(!showForm){
        $("#request-form-card").hide();
        $("#submitted").show();
    } else {
        $("#request-form-card").show();
        $("#submitted").hide();
    }


}

function getUserID(){
    // this should always return the same value for the same device client.
    // Cookies for web.
    // Storing to memory if
    if (localStorage.muid){
        //It's already set.  Leave it alone
        return localStorage.muid;
    } else{
        localStorage.muid = createGuid();
        return localStorage.muid;
    }
}
function createGuid(){
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
function initWS(){
      ws = new WebSocket(wsuri);
      ws.onopen = function(evt){onOpen(evt);};
      ws.onmessage = function(evt){onMessage(evt);};
    }

function onMessage(event){
    var msg = JSON.parse(event.data);
    console.log(msg);
    if(msg.type == "helpack"){
        $("#submitted-response").text(msg.body);
        //alert(msg.body);
    }
}

function onOpen(event){
      console.log(intro);
      ws.send(JSON.stringify(intro));
    }
