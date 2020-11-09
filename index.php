<?php
	header("Content-type: application/json");
	use Psr\Http\Message\ServerRequestInterface as Request;
	use Psr\Http\Message\ResponseInterface as Response;


	require '/var/www/html/share/vendor/autoload.php';

	// create new slim app
	$app = new \Slim\App;

	$container = $app->getContainer();

	// initialise database
	$container['db'] = function() {
		$conn = new PDO("mysql:host=localhost;dbname=wad1903", "wad1903", "zaipaido");
		$conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
		return $conn;
	};


	$app->get('/location/{location}', function(Request $req, Response $res, array $args) {
		$stmt = $this->db->prepare("SELECT * FROM accommodation WHERE location LIKE ?");
		$search = "%" . $args["location"] . "%";
		$stmt->bindParam(1, $search);
		$stmt->execute();
		$results = $stmt->fetchAll();

		//return error code 404 if no results
		if (!$results) {
			return $res->withStatus(404);
		}
		else {
			echo json_encode($results);
			return $res->withStatus(200);
		}
	});

	$app->get('/location/{location}/type/{type}', function(Request $req, Response $res, array $args) {
		//if both location and type are "all"
		if ($args["location"] == "all" && $args["type"] == "all"){
			//select all accommodation
			$stmt = $this->db->prepare("SELECT * FROM accommodation");
			$stmt->execute();
			$results = $stmt->fetchAll();
		} else {
			$stmt = $this->db->prepare("SELECT * FROM accommodation WHERE location LIKE ? AND type LIKE ?");
			$search = "%" . $args["location"] . "%";
			$search2 = "%" . $args["type"] . "%";
			$stmt->bindParam(1, $search);
			$stmt->bindParam(2, $search2);
			$stmt->execute();
			$results = $stmt->fetchAll();
		}

		//return error code 404 if no results
		if (!$results) {
			return $res->withStatus(404);
		}
		else {
			echo json_encode($results);
			return $res->withStatus(200);
		}
	});

	$app->post('/book/create', function(Request $req, Response $res, array $args) {
		//Extract post data from request
		$data = $req->getParsedBody();

		$stmt = $this->db->prepare("SELECT * FROM acc_dates WHERE accID = ? AND thedate = ?");
		$stmt->bindParam(1, $data["id"]);
		$stmt->bindParam(2, $data["date"]);
		$stmt->execute();
		$results = $stmt->fetchAll();

		//checks if the query actually found a result (availability for that accommodation on that day)
		if (count($results) == 0) {
		    //return error code 400 to signal that is not a valid date
        return $res->withStatus(400);
		}
		else{
		    //if there is a result then check whether it had any availabilities
			if ($results[0]["availability"] != 0)
			{
			    //insert data provided into the bookings table
				$insertstmt = $this->db->prepare("INSERT INTO acc_bookings(accID, thedate, npeople)
								VALUES(?, ?, ?)");
				$insertstmt->bindParam(1, $data["id"]);
				$insertstmt->bindParam(2, $data["date"]);
				$insertstmt->bindParam(3, $data["amount"]);
				$insertstmt->execute();

				//return code 201 Created to signal the booking succeeded
				return $res->withStatus(201);
			}
			else
			{
			    //if there isn't availability then return error code 404 to signal the booking failed
          return $res->withStatus(404);
			}
		}
		return $res;
	});

	//run the slim app
	$app->run();


?>
