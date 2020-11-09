function init() {
	//setup the ajax search

    document.getElementById("btnBook").addEventListener("click", sendAjax);
    document.getElementById("btnSearch").addEventListener("click", sendAjax);

}

function sendAjax() {
    // Read in the input from the form fields
    var location, type;
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

    // Set up our AJAX connection variable
    var ajaxConnection = new XMLHttpRequest();

    // Set up the callback function. Here, the callback is an arrow function.
    ajaxConnection.addEventListener("load", e => {
        var output = ""; // initialise output to blank text

          //checks specifically for confirmation
        if (e.target.status == 200) {

          var response = JSON.parse(e.target.responseText);

          // Loop through each accommodation in the list
          response.forEach(curAcc => {
              // add the details of the current accommodation to the "output" variable
              output += `<br/><input type='hidden' id='markerID' value='${curAcc.ID}'></input>
                    Name: ${curAcc.name} <br/> Type: ${curAcc.type} <br/>
                    Location: ${curAcc.location} <br/> Description: ${curAcc.description} <br/> <a onclick="openForm()">Book</a><br/>`;

            // Put the HTML output into the response div
            document.getElementById("response").innerHTML = output;
          });
        }
        else if (e.target.status == 201) {
          //if the error code is "created" signal that the booking was successful
          alert(`Your booking was successful.`);
        }
        else if (e.target.status == 400) {
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
    if (!type && bookingVisible == "none") {
        ajaxConnection.open("GET", `https://edward2.solent.ac.uk/~wad1903/location/Hampshire`);
        // Send the request.
        ajaxConnection.send();
    } else if (type && bookingVisible == "none") {
        ajaxConnection.open("GET", `https://edward2.solent.ac.uk/~wad1903/location/Hampshire/type/${type}`);
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
}

//close booking popup
function closeForm() {
  document.getElementById("book").style.display = "none";

  // allow typing in search bar after booking
  document.getElementById("type").readOnly = false;

  document.getElementById("book_resp").innerHTML.value = "";
}
