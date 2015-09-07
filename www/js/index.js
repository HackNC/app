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
var app = {
    initialize: function() {
        this.bind();
        //Let's hold some data on the current user
        loadUser();
        //Some things Brandon Does on initial load.
        scheduleLoad();
        setView('notifications');

        $("#menu-button").on("click", function() {
					$("#menu").slideToggle(200);
					alert("wow!3");
        });
    },

    deviceready: function() {
        // This is an event handler function, which means the scope is the event.
        // So, we must explicitly called `app.report()` instead of `this.report()`.
		alert("readay");
		var push = PushNotification.init({
            "android": {
                "senderID": "824858956988"
            },
            "ios": {
                "badge":"true",
                "sound":"true",
                "alert":"true",
                "ecb":"onNotificationAPN"
            }, 
            "windows": {} 
        });
		
        alert("it worked");
		
        push.on('registration', function(data) {
            console.log("registration event");
            alert(data.registrationId);

        });

        push.on('notification', function(data) {
        	console.log("notification event");
            alert(JSON.stringify(data));
        });

        push.on('error', function(e) {
            alert("push error");
        });    
	},
	
	bind: function() {
        document.addEventListener('deviceready', this.deviceready, true);
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
        console.log(data);
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

function onNotificationAPN(e) {
    if (e.alert) {
         $("#app-status-ul").append('<li>push-notification: ' + e.alert + '</li>');
         // showing an alert also requires the org.apache.cordova.dialogs plugin
         navigator.notification.alert(e.alert);
    }
        
    if (e.sound) {
        // playing a sound also requires the org.apache.cordova.media plugin
        var snd = new Media(e.sound);
        snd.play();
    }
    
    if (e.badge) {
        pushNotification.setApplicationIconBadgeNumber(successHandler, e.badge);
    }
}


