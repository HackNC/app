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
        });
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

function setView(name) {

    var activecolor = "#AAAAAA"

    views = ['notifications', 'schedule', 'mentors', "info", "menu", "sponsors"];
    console.log("view set " + name);

    $("#" + name ).show();
    $("." + name ).eq(0).css("fill" , activecolor);
    hideOthers(views, name);
}

function hideOthers(views, name){
    var passivecolor = "#212121"

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
                fritable.after("<tr><td>" + thisEvent.starttime + " - " + thisEvent.endtime +  "</td><td>" + thisEvent.title + "</td></tr>");
            } else if (thisEvent.day.toLowerCase() == "saturday"){
                var sattable = $("#sattable tr:last");
                sattable.after("<tr><td>" + thisEvent.starttime + "</td><td>" + thisEvent.title + "</td></tr>");
            } else {
                var sntable = $("#sattable tr:last");
                sntable.after("<tr><td>" + thisEvent.starttime + "</td><td>" + thisEvent.title + "</td></tr>");
            }
        }
    });
}