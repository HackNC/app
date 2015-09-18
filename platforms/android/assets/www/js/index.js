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
 
 var notificationCache = [{
	"subject" : "",
	"body" : "No notifications yet :D"
 }];
 
 var loading = false; 
 
var cardHTML = "";

var loadingHTML = '<div style="position:fixed;top:50%;width:100%;text-align:center;font-size:350%;visibility:hidden;" id="e">loading</div>'

var t=0;
window.setInterval("r()",33);
function r(){
	if (loading) {
		t+=2;
		document.getElementById('e').style.webkitTransform="rotate("+t+"deg) scale(" + (Math.sin(t/29)+1.3) + ")";
		document.getElementById('e').style.mozTransform="rotate("+t+"deg) scale(" + (Math.sin(t/29)+1.3) + ")";
		document.getElementById('e').style.transform="rotate("+t+"deg) scale(" + (Math.sin(t/29)+1.3) + ")";
		document.getElementById('e').style.visibility="visible";
		rr = Math.floor((Math.sin(t/100)+1)*127);
		g = Math.floor((Math.cos(2.32*t/100)+1)*127);
		b = Math.floor((Math.cos(-5.79*t/100)+1)*127);	//document.getElementById('body').style.backgroundColor="rgb("+rr+","+g+","+b+")"
		document.getElementById('e').style.color="rgb("+(255-rr)+","+(255-g)+","+(255-b)+")"
	}
}

var app = {
    initialize: function() {
        this.bind();
        //Let's hold some data on the current user
        loadUser();
        //Some things Brandon Does on initial load.
        scheduleLoad();
		updateNotifications();
        setView('notifications');
		$.get('http://159.203.73.64:9001/reg?id=' + "I AM BUTTS", function(stuff) {
			});
        $("#menu-button").on("click", function() {
					$("#menu").slideToggle(200);
        });
    },
	onResume: function() {
		updateNotifications();
	},

    deviceready: function() {
        // This is an event handler function, which means the scope is the event.
        // So, we must explicitly called `app.report()` instead of `this.report()`.
		var push = PushNotification.init({
            "android": {
                "senderID": "824858956988"
            },
            "ios": {}, 
            "windows": {} 
        });
		
		
        push.on('registration', function(data) {
            console.log(data.registrationId);
			//data.registrationId
			$.get('http://159.203.73.64:9001/reg?id=' + data.registrationId, function(stuff) {
			});
        });

        push.on('notification', function(data) {
        	console.log("notification event");
			updateNotifications();
        });

        push.on('error', function(e) {

        });    
	},
	
	bind: function() {
        document.addEventListener('deviceready', this.deviceready, true);
		document.addEventListener("resume", this.onResume, false);

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
		});
	});

	$("#menu a").each(function(idx, elm) {
		$(elm).on("click", function(event) {
			$(activeTab).removeClass("active-tab");
			setView(elm.hash.substr(1));
		});
	});
})();

function setView(name) {
    var activecolor = "#AAAAAA"

    views = ['notifications', 'schedule', 'mentors', "info", "menu", "sponsors"];
    console.log("view set " + name);
	if (name == "notifications") {
		updateNotifications();
	}

    $("#" + name ).show();
    $("." + name ).eq(0).css("fill" , activecolor);
    hideOthers(views, name);
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
function loadUser() {
    //let's see if this is a new user or an old one.
}

function scheduleLoad(){
    //alert("Load");
    //get JSON
    var url = "https://gist.githubusercontent.com/suBDavis/536179a2f8673842355a/raw/gistfile1.txt"
    $.getJSON(url , function(data) {
        for (var i =0 ; i<data.events.length ; i++){
            thisEvent = data.events[i];
            console.log(thisEvent);
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

function updateNotifications() {
	$("#notifications").html(loadingHTML);
	loading = true;
	$.getJSON("http://159.203.73.64:9001/archive" , function(data) {
		 cardHTML="";
		 loading=false;
		 for (var i = 0; i < data.length; i++) {
				cardHTML = "<div class=card> <div class='card-content black-text'> <p>" + data[i].body + "</p></div></div>" + cardHTML;
				$("#notifications").html(cardHTML);
			}
	 });
}

