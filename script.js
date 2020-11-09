//global map variable for use in multiple functions
var map;
var markerGroup;

function init() {
	//setup the ajax search

    document.getElementById("btnBook").addEventListener("click", sendAjax);


    document.getElementById("location").addEventListener("keyup", sendAjax);
    document.getElementById("type").addEventListener("keyup", sendAjax);
    //setup leaflet map
    map = L.map ("map1");

    var attrib="Map data copyright OpenStreetMap contributors, Open Database Licence";

    L.tileLayer
    ("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: attrib } ).addTo(map);

	//create a layer group for all markers allowing easy clearing of the markers after every search
    markerGroup = L.layerGroup().addTo(map);

    //on initial setup of the map, check if the user has location on
    if(navigator.geolocation)
    {
    	//only set the map to look at their position on setup
        navigator.geolocation.getCurrentPosition (

            gpspos=> {
				//set map view to their position
                map.setView([gpspos.coords.latitude, gpspos.coords.longitude], 14);
            },
            err=> {
            	//display error message
                alert(`You must enable location in order to fully utilise the map.`);
                //default map location if the user denies location
                map.setView([50.908,-1.4], 14);
            }
        );
    }
    else
    {
        //default map location if the user turns off GPS
        map.setView([50.908,-1.4], 14);
    }
}

function sendAjax() {
    // Read in the input from the form fields
    var location, type;
    location = document.getElementById('location').value;
    type = document.getElementById('type').value;

    var amount, id, day, month, year, year_split, date;

    //checks whether the page is in booking mode
    var bookingVisible = document.getElementById("book").style.display;
    if (bookingVisible == "block") {
        amount = document.getElementById('amount').value;
        day = document.getElementById('day').value;
        if (day.length !== 2) {
            day = "0" + day;
        }
        month = document.getElementById('month').value;
        if (month.length !== 2) {
            month = "0" + month;
        }
        year = document.getElementById('year').value;
        //get end 2 digits of year
        if (year.length === 4) {
            year_split = year.substr(-2);
        } else {
            year_split = year;
        }

        //convert date into YYMMDD format like in the db
        date = year_split + month + day;
    }

    // if the text box is empty then clear all markers and output info
    if (location == ""){
      markerGroup.clearLayers();
      document.getElementById("response").innerHTML = "";
    }

    // Set up our AJAX connection variable
    var ajaxConnection = new XMLHttpRequest();

    // Set up the callback function. Here, the callback is an arrow function.
    ajaxConnection.addEventListener("load", e => {
        var output = ""; // initialise output to blank text

          //checks specifically for confirmation
        if (e.target.status == 200){
          var response = JSON.parse(e.target.responseText);
          //remove all markers from the map so user will only see their search results rather than all previous searches
          // 	(also stops the same search from creating overlapping markers)
          // only as long there are markers to clear
          if (markerGroup.length !== 0) {
              markerGroup.clearLayers();
          }
          // Loop through each accommodation in the list
          response.forEach(curAcc => {
              // add the details of the current accommodation to the "output" variable
              output += `<br/><input type='hidden' id='markerID' value='${curAcc.ID}'></input>
                    Name: ${curAcc.name} <br/> Type: ${curAcc.type} <br/>
                    Location: ${curAcc.location} <br/> Description: ${curAcc.description} <br/> <a onclick="openForm()">Book</a><br/>`;

              //set up array variable for lat + lon
              var pos = [curAcc.latitude, curAcc.longitude];

              //add it as a marker on the marker layer
              var marker = L.marker(pos).addTo(markerGroup);

              //add a popup to each marker that has all the info of that accommodation
              marker.bindPopup(`<input type='hidden' id='markerID' value='${curAcc.ID}'></input>
                            Name: ${curAcc.name} <br/> Type: ${curAcc.type} <br/> Location: ${curAcc.location} <br/>
						                 Description: ${curAcc.description} <br/> <a onclick="openForm()">Book</a>`);

            // Put the HTML output into the response div
            document.getElementById("response").innerHTML = output;
          });

        }
        else if (e.target.status == 201){
          //if the error code is "created" signal that the booking was successful
          alert(`Your booking was successful.`);
        }
        else if (e.target.status == 400){
          //if the error code is "error" then signal the date is invalid
          alert(`${day}/${month}/${year} is not a valid date for booking.\nPlease enter a valid date.`);
        }
        else if (e.target.status == 404) {
          if (bookingVisible == "block") {
            //if the error code isnt "created" signal that the booking failed
            alert(`Your booking has failed.`);
          }
          else {
            //if the code is "error" and the user is not booking signal there are not results
            document.getElementById("response").innerHTML = "No results, sorry!";
          }
        }
    });

    // Open the connection to web server route based on what form is being submitted
    if (!type && location && bookingVisible == "none") {
        ajaxConnection.open("GET", `https://edward2.solent.ac.uk/~wad1903/location/${location}`);
        // Send the request.
        ajaxConnection.send();
    } else if (location && type && bookingVisible == "none") {
        ajaxConnection.open("GET", `https://edward2.solent.ac.uk/~wad1903/location/${location}/type/${type}`);
        // Send the request.
        ajaxConnection.send();
    //catch all possibilities of empty values that should lead to showing all results
    } else if ((location == "" && !type) || (location == "" && type == "") && bookingVisible == "none") {
        //if both type and location are empty then show all markers
        ajaxConnection.open("GET", `https://edward2.solent.ac.uk/~wad1903/location/all/type/all`);
        // Send the request.
        ajaxConnection.send();
    } else if (bookingVisible == "block") {
        id = document.getElementById("markerID").value;
        //create post data variable
        var dataToPost = new FormData();
        //add all data to variable
    		dataToPost.append("id", id);
    		dataToPost.append("amount", amount);
    		dataToPost.append("date", date);
        ajaxConnection.open("POST", `https://edward2.solent.ac.uk/~wad1903/book/create`);
        // Send the request.
        ajaxConnection.send(dataToPost);
        //after posting, auto close the booking form
        closeForm();
    }

}

//open booking popup
function openForm() {
  document.getElementById("book").style.display = "block";

  //disable typing in search bar while booking
  document.getElementById("type").readOnly = true;
  document.getElementById("location").readOnly = true;
}

//close booking popup
function closeForm() {
  document.getElementById("book").style.display = "none";

  // allow typing in search bar after booking
  document.getElementById("type").readOnly = false;
  document.getElementById("location").readOnly = false;
}
