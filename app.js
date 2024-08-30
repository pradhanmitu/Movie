const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const db = require("./db");
const app = express();

// Used to parse incoming requests with JSON payloads
app.use(express.json());

// Serving the frontend folder
app.use(express.static(path.join(__dirname, "../FrontEnd")));

// Middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Starting page
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "../FrontEnd/Index.html"));
});

// Get Production Company Name
app.get("/getProductionCompanyName", (req, res) => {
	const sql = "SELECT `Name` FROM `Production_Company`";
	db.query(sql, (err, result) => {
		if (err) throw err;
		console.log(result);
		res.send(result);
	});
});

// Get Movie Name
app.get("/getMovieName", (req, res) => {
	const sql = "SELECT `Title`, `Year` FROM `Movie`";
	db.query(sql, (err, result) => {
		if (err) throw err;
		res.send(result);
		console.log(result);
	});
});

app.get("/getMovieNameForDirector", (req, res) => {
	const sql = "SELECT Title FROM Movie"; // Adjust SQL query as per your database schema
	db.query(sql, (err, result) => {
		if (err) {
			console.error("Error executing query:", err);
			res.status(500).json({ error: "Failed to fetch movies" });
			return;
		}
		res.json(result); // Assuming result is an array of objects like [{ Title: 'Movie Title' }, ...]
	});
});

// Get Genre Type
app.get("/getGenreType", (req, res) => {
	const sql = "SELECT `Type` FROM `genre`";
	db.query(sql, (err, result) => {
		if (err) throw err;
		res.send(result);
	});
});

// Insert Movie Details
app.post("/insertMovieDetails", (req, res) => {
	const {
		movieTitle,
		movieYear,
		MoviePlotOutline,
		movieLength,
		productionCompany,
		genre,
	} = req.body;

	db.beginTransaction((err) => {
		if (err) {
			return res.status(500).json({ error: "Cannot Begin Transaction" });
		}

		const sqlInsertMovie =
			"INSERT INTO Movie (Title, Year, Length, Plot_outline, Production_Company_Name) VALUES (?,?,?,?,?)";
		db.query(
			sqlInsertMovie,
			[
				movieTitle,
				movieYear,
				movieLength,
				MoviePlotOutline,
				productionCompany,
			],
			(err, result) => {
				if (err) {
					return db.rollback(() => {
						if (err.code === "ER_DUP_ENTRY") {
							res.status(500).json({
								error: "Duplicate entry.",
							});
						} else {
							res.status(500).json({
								error: "Database error. Please try again later.",
							});
						}
					});
				}

				const sqlInsertGenre =
					"INSERT INTO Movie_Genre (Movie_Title, Movie_Year, Genre_Type) VALUES (?,?,?)";
				genre.forEach((genre) => {
					db.query(
						sqlInsertGenre,
						[movieTitle, movieYear, genre],
						(err, result) => {
							if (err) {
								return db.rollback(() => {
									res.status(500).json({
										error: "Database error. Please try again later.",
									});
								});
							}
						}
					);
				});

				db.commit((err) => {
					if (err) {
						return db.rollback(() => {
							res.status(500).json({
								error: "Database error. Please try again later.",
							});
						});
					}
					console.log("Transaction committed successfully");
					res.json({
						message: "Movie details inserted successfully",
					});
				});
			}
		);
	});
});

// Insert Actor Details and Quotes
app.post("/insertActorDetails", (req, res) => {
	const { actorName, actorDOB, movies, movieQuotes } = req.body;

	db.beginTransaction((err) => {
		if (err) {
			console.error("Error beginning transaction:", err);
			return res
				.status(500)
				.json({ error: "Database error. Please try again later." });
		}

		const sqlInsertActor =
			"INSERT INTO actor (name, date_of_birth) VALUES (?, ?)";
		db.query(sqlInsertActor, [actorName, actorDOB], (err, result) => {
			if (err) {
				return db.rollback(() => {
					if (err.code === "ER_DUP_ENTRY") {
						res.status(500).json({ error: "Duplicate entry." });
					} else {
						console.error("Error inserting actor:", err);
						res.status(500).json({
							error: "Database error. Please try again later.",
						});
					}
				});
			}

			const insertPromises = [];

			movies.forEach((movie, index) => {
				const movieTitle = movie.split(" (")[0];
				const movieYear = movie.split("(")[1].replace(")", "");
				const movieQuotesForMovie = movieQuotes[index]; // Ensure correct indexing

				if (Array.isArray(movieQuotesForMovie)) {
					movieQuotesForMovie.forEach((quote) => {
						const sqlInsertQuotes =
							"INSERT INTO Quotes (Movie_Title, Movie_Year, Movie_Quotation, Actor_Name) VALUES (?, ?, ?, ?)";
						insertPromises.push(
							new Promise((resolve, reject) => {
								db.query(
									sqlInsertQuotes,
									[movieTitle, movieYear, quote, actorName],
									(err, result) => {
										if (err) {
											console.error(
												"Error inserting quote:",
												err
											);
											reject(err);
										} else {
											resolve(result);
										}
									}
								);
							})
						);
					});
				}

				const sqlMovieActor =
					"INSERT INTO movie_actor (Movie_Title, Movie_Year, Actor_Name) VALUES (?, ?, ?)";
				db.query(
					sqlMovieActor,
					[movieTitle, movieYear, actorName],
					(err, result) => {
						if (err) {
							console.error("Error inserting movie_actor:", err);
						}
					}
				);
			});

			Promise.all(insertPromises)
				.then(() => {
					db.commit((err) => {
						if (err) {
							console.error("Error committing transaction:", err);
							return db.rollback(() => {
								res.status(500).json({
									error: "Database error. Please try again later.",
								});
							});
						}
						console.log("Transaction committed successfully");
						res.json({
							message:
								"Actor details and quotes inserted successfully",
						});
					});
				})
				.catch((err) => {
					console.error("Error inserting actor details:", err);
					db.rollback(() => {
						res.status(500).json({
							error: "Database error. Please try again later.",
						});
					});
				});
		});
	});
});

// Insert Director Detailsradio
app.post("/Director_page", (req, res) => {
	const { name, dob, movies } = req.body;
	console.log(name); // Director's name
	console.log(dob); // Director's date of birth
	console.log(movies); // Array of movies with details

	const sqlInsertDirector =
		"INSERT INTO Director (Name, Date_of_Birth) VALUES (?, ?)";
	db.query(sqlInsertDirector, [name, dob], (err, result) => {
		if (err) {
			console.error("Error inserting director:", err);
			return res
				.status(500)
				.json({ error: "Database error. Please try again later." });
		} else {
			console.log("inserted into director table");
		}

		// Prepare queries for movies
		const insertPromises = [];
		movies.forEach((movie) => {
			const { m_name, isActed, isDirected, role } = movie;
			const movieName = m_name.split(",")[0];
			const movieYear = m_name.split(",")[1];
			// Insert into 'Movie_Director' table if directed
			if (isDirected) {
				const sqlMovieDirector =
					"INSERT INTO Movie_Director (Movie_Title, Movie_Year, Director_Name) VALUES (?, ?, ?)";
				// Assuming you have movie year and title properly set in frontend
				db.query(
					sqlMovieDirector,
					[movieName, movieYear, name],
					(err, result) => {
						if (err) {
							console.error(
								"Error inserting movie director:",
								err
							);
						} else {
							console.log("inserted into movie director table");
						}
					}
				);
			}

			// Insert into 'Movie_Actor' table if acted
			if (isActed) {
				const sqlActor =
					"INSERT INTO Actor (Name, Date_of_Birth) Values (?, ?)";
				db.query(sqlActor, [name, dob], (err, result) => {
					if (err) {
						console.error("Error inserting actor:", err);
					} else {
						console.log("inserted into Actor table");
					}
				});
				const sqlMovieActor =
					"INSERT INTO Movie_Actor (Movie_Title, Movie_Year, Actor_Name, Role) VALUES (?, ?, ?, ?)";
				// Assuming you have movie year and title properly set in frontend
				db.query(
					sqlMovieActor,
					[movieName, movieYear, name, role],
					(err, result) => {
						if (err) {
							console.error("Error inserting movie actor:", err);
						} else {
							console.log("inserted into movie actor table");
						}
					}
				);

				// Insert into 'Director_Actor' table if both acted and directed
				if (isDirected) {
					const sqlDirectorActor =
						"INSERT INTO Director_Actor (Director_Name) VALUES (?)";
					db.query(sqlDirectorActor, [name], (err, result) => {
						if (err) {
							console.error(
								"Error inserting director actor:",
								err
							);
						} else {
							console.log("inserted into director actor table");
						}
					});
				}
			}
		});

		// Respond with success message
		res.json({
			message: "Director details and movies inserted successfully",
		});
	});
});

app.post("/displayMovies", async (req, res) => {
    const [yearRange] = req.body.range;
    console.log("Received year range:", yearRange);

    const years = yearRange.split("-");
    if (years.length !== 2) {
        console.error("Invalid year range format:", yearRange);
        return res.status(400).send("Invalid year range format. Please use the format YYYY-YYYY.");
    }

    const [year1, year2] = years.map(year => parseInt(year.trim(), 10));
    console.log("Parsed years:", year1, year2);

    if (isNaN(year1) || isNaN(year2)) {
        console.error("Invalid year values:", year1, year2);
        return res.status(400).send("Invalid year values. Please enter valid numbers.");
    }

    const sqlGetMovie = `SELECT 
                            m.Title, 
                            m.Year, 
                            m.Length,
                            m.Production_Company_Name,  
                            m.Genre,
                            md.Director_Name 
                        FROM 
                            Movie m
                        JOIN 
                            Movie_Director md ON m.Title = md.Movie_Title AND m.Year = md.Movie_Year
                        WHERE 
                            m.Year BETWEEN ? AND ?
                        GROUP BY 
                            m.Title, m.Year, m.Length, m.Production_Company_Name, md.Director_Name
                        ORDER BY 
                            m.Title ASC, 
                            m.Year ASC;`;

    db.query(sqlGetMovie, [year1, year2], (err, result) => {
        if (err) {
            console.error("Error getting movie details:", err);
            return res.status(500).send("Error fetching movie details.");
        } else {
            console.log("Query result:", result);
            res.json(result);
        }
    });
});


app.post("/moviesByProductionCompany", (req, res) => {
    const { productionCompany } = req.body;

    if (!productionCompany) {
        return res.status(400).send("Production Company is required.");
    }

    const sqlGetMovies = `SELECT 
                            m.Title, 
                            m.Year, 
                            m.Length,
                            m.Production_Company_Name,  
                            m.Genre,
                            md.Director_Name
                        FROM 
                            Movie m
                        JOIN 
                            Movie_Director md ON m.Title = md.Movie_Title AND m.Year = md.Movie_Year
                        WHERE 
                            m.Production_Company_Name = ?
                        ORDER BY 
                            m.Genre ASC, 
                            md.Director_Name ASC;`;

    db.query(sqlGetMovies, [productionCompany], (err, result) => {
        if (err) {
            console.error("Error fetching movie details:", err);
            return res.status(500).send("Error fetching movie details.");
        }
        res.json(result);
    });
});


app.get('/genres', (req, res) => {
	const genrename = 'SELECT Type FROM genre;';
	db.query(genrename, (err, result) => {
		if (err) {
			console.error('Database query error:', err);
			return res.status(500).json({ error: 'Database query error' });
		}
		res.json(result);
	});
  });
  

app.get('/productions', (req, res) => {
	const pcompanies = 'SELECT Name FROM production_company;';
	db.query(pcompanies, (err, result) => {
		if (err) {
			console.error('Database query error:', err);
			return res.status(500).json({ error: 'Database query error' });
		}
		res.json(result);
	});
  });
  
  // Endpoint to add a new movie
  app.get('/insertmovie', (req, res) => {
  
	const {title, year, length, genre, plot_outline, pcompany} = req.query;
	db.beginTransaction((err)=>{
	const checkMovie = 'SELECT Title FROM movie WHERE Title = ? AND Year = ?;';
	db.query(checkMovie,[title,parseInt(year)],(e,result)=>{
		if(e){
			return db.rollback(()=>{
				throw e;
			});
		}
		
		if(result.length>0){
			return db.rollback(()=>{
				res.status(400).send('Movie already exist');
			}); 
		}
		const insertMovie = 'INSERT INTO movie (Title, Year,Length, Plot_outline,Genre, Production_Company_Name) VALUES (?, ?, ?, ?, ?, ?)';
		db.query(insertMovie,[title, year, length, plot_outline, genre, pcompany ],(error,res1)=>{
			if(error){
				return db.rollback(()=>{
					throw error;
				});
			}
			db.commit((error)=>{
				if(error){
					return db.rollback(()=>{
						throw error;
					});
				}
				console.log('Success');
				res.redirect('../success.html');
			});
		});
	});
  })
  });

// Start listening on port 5000
app.listen(5000, () => {
	console.log(
		`Mysql Server with user name ${db.config.user} is running on port 5000 using ${db.config.database}`
	);
	console.log(`http://${db.config.host}:5000`);
});
