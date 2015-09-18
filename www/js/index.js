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

var app = {
    initialize: function() {
        this.bind();
        //Some things Brandon Does on initial load.
        scheduleLoad();
        setView('notifications');

        $("#menu-button").on("click", this.toggleMenu);

				// needs to be recomputed for window resize
				$("#map").css("top", $(".navbar-fixed").height()+"px");

        $("body").on('click', function(ev) {
					if ($("#menu").hasClass("menu-open")) {
						app.toggleMenu(ev);
					}
        });

        $("#map-controls-zoom-in").on('click', function() {
        	var s = Math.min(this.zoomer.scale+MAP_ZOOM_DELTA, MAP_ZOOM_MAX);
        	this.zoomer.zoom(s);
        }.bind(this));
        $("#map-controls-zoom-out").on('click', function() {
        	var s = Math.max(this.zoomer.scale-MAP_ZOOM_DELTA, MAP_ZOOM_MIN);
        	this.zoomer.zoom(s);
        }.bind(this));
    },

    toggleMenu: function(ev) {
    		if (ev) {
					ev.preventDefault();
					ev.stopPropagation();
				}
        $("#menu").removeClass("transition");
        $("#menu").addClass("transition").toggleClass("menu-close").toggleClass("menu-open");
    },

    bind: function() {
        document.addEventListener('deviceready', this.deviceready, false);
    },
    deviceready: function() {
        // This is an event handler function, which means the scope is the event.
        // So, we must explicitly called `app.report()` instead of `this.report()`.
        app.report('deviceready');
    },
};

// handles primary view switches
(function() {
	var activeTab = $("a[href='#notifications']").parent();
	$("#tab-row li.tab > a").each(function(idx, elm) {
		$(elm).on("click", function(event) {
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
		$(elm).on("click", function(event) {
			event.preventDefault();
			event.stopPropagation();
			$(activeTab).removeClass("active-tab");
			setView(elm.hash.substr(1));
		});
	});
})();

function setView(name) {
    var activecolor = "#AAAAAA"

    views = ['notifications', 'schedule', 'mentors', "info", "sponsors", "map"];
    console.log("view set " + name);

    $("#" + name ).show();
    $("." + name ).eq(0).css("fill" , activecolor);
    hideOthers(views, name);

		if (name == "map") {
			app.zoomer = new IScroll("#map-view", {
				zoom: true,
				scrollbars: true,
				scrollX: true,
				scrollY: true,
				freeScroll: true,
				mouseWheel: true,
				wheelAction: 'zoom',
				zoomMin: MAP_ZOOM_MIN,
				zoomMax: MAP_ZOOM_MAX,
			});
			app.zoomer.zoom(MAP_ZOOM_MIN, undefined, undefined, 0);
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
    var url = "http://hacknc.com/schedule/json/student.json"
    $.getJSON(url , function(data) {
        //console.log(data);
        for (var i =0 ; i<data.events.length ; i++){
            thisEvent = data.events[i];
            //console.log(thisEvent);
            if (data.events[i].day.toLowerCase() == "friday"){
                //console.log("friday");
                var fritable = $("#fritable tr:last");
                fritable.after("<tr><td class='schedule-first'>" + thisEvent.starttime + "  " + thisEvent.endtime +  "</td><td>" + thisEvent.title + "</td></tr>");
            } else if (thisEvent.day.toLowerCase() == "saturday"){
                var sattable = $("#sattable tr:last");
                sattable.after("<tr><td class='schedule-first'>"+ thisEvent.starttime + "  " + thisEvent.endtime + "</td><td>" + thisEvent.title + "</td></tr>");
            } else {
                var sntable = $("#sntable tr:last");
                sntable.after("<tr><td class='schedule-first'>"+ thisEvent.starttime + "  " + thisEvent.endtime +  "</td><td>" + thisEvent.title + "</td></tr>");
            }
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
      alert(event.data);
    }

function onOpen(event){
      console.log(intro);
      ws.send(JSON.stringify(intro));
    }
