-- Active: 1719300559758@@127.0.0.1@3306@movie_management

-- Production_Company Table

CREATE TABLE Production_Company (
    Name VARCHAR(25) PRIMARY KEY,
    Address TEXT
);
-- Movie Table
CREATE TABLE Movie (
    Title VARCHAR(25),
    Year INT,
    Length INT,
    Plot_outline TEXT,
    Production_Company_Name VARCHAR(25),
    PRIMARY KEY (Title, Year),
    FOREIGN KEY (Production_Company_Name) REFERENCES Production_Company (Name)
);

-- Genre Table
CREATE TABLE Genre (Type VARCHAR(25) PRIMARY KEY);

-- Movie_Genre Table
CREATE TABLE Movie_Genre (
    Movie_Title VARCHAR(25),
    Movie_Year INT,
    Genre_Type VARCHAR(25),
    PRIMARY KEY (
        Movie_Title,
        Movie_Year,
        Genre_Type
    ),
    FOREIGN KEY (Movie_Title, Movie_Year) REFERENCES Movie (Title, Year),
    FOREIGN KEY (Genre_Type) REFERENCES Genre (Type)
);

-- Actor Table
CREATE TABLE Actor (
    Name VARCHAR(25),
    Date_of_Birth DATE,
    PRIMARY KEY (Name, Date_of_Birth)
);

-- Director Table
CREATE TABLE Director (
    Name VARCHAR(25),
    Date_of_Birth DATE,
    PRIMARY KEY (Name, Date_of_Birth)
);

-- Movie_Actor Table
CREATE TABLE Movie_Actor (
    Movie_Title VARCHAR(25),
    Movie_Year INT,
    Actor_Name VARCHAR(25),
    Role VARCHAR(25),
    PRIMARY KEY (
        Movie_Title,
        Movie_Year,
        Actor_Name
    ),
    FOREIGN KEY (Movie_Title, Movie_Year) REFERENCES Movie (Title, Year),
    FOREIGN KEY (Actor_Name) REFERENCES Actor (Name)
);

-- Movie_Director Table
CREATE TABLE Movie_Director (
    Movie_Title VARCHAR(25),
    Movie_Year INT,
    Director_Name VARCHAR(25),
    PRIMARY KEY (
        Movie_Title,
        Movie_Year,
        Director_Name
    ),
    FOREIGN KEY (Movie_Title, Movie_Year) REFERENCES Movie (Title, Year),
    FOREIGN KEY (Director_Name) REFERENCES Director (Name)
);

-- Quotes Table
CREATE TABLE Quotes (
    Movie_Title VARCHAR(25),
    Movie_Year INT,
    Movie_Quotation TEXT,
    Actor_Name VARCHAR(25),
    PRIMARY KEY (
        Movie_Title,
        Movie_Year,
        Actor_Name
    ),
    FOREIGN KEY (Movie_Title, Movie_Year) REFERENCES Movie (Title, Year),
    FOREIGN KEY (Actor_Name) REFERENCES Actor (Name)
);

-- Director_Actor Table
CREATE TABLE Director_Actor (
    Director_Name VARCHAR(25),
    PRIMARY KEY (Director_Name),
    FOREIGN KEY (Director_Name) REFERENCES Director (Name),
    FOREIGN KEY (Director_Name) REFERENCES Actor (Name)
);

-- Populating Production Company table
INSERT INTO
    Production_Company (Name, Address)
VALUES (
        'Paramount Pictures',
        '5555 Melrose Avenue, Los Angeles, CA 90038'
    ),
    (
        'Warner Bros. Pictures',
        '4000 Warner Blvd., Burbank, CA 91522'
    ),
    (
        'Universal Pictures',
        '100 Universal City Plaza, Universal City, CA 91608'
    ),
    (
        'Walt Disney Pictures',
        '500 S Buena Vista St, Burbank, CA 91521'
    ),
    (
        '20th Century Studios',
        '10201 W Pico Blvd, Los Angeles, CA 90064'
    );

-- Populating Genre table
INSERT INTO
    Genre (Type)
VALUES ('Action'),
    ('Adventure'),
    ('Comedy'),
    ('Drama'),
    ('Fantasy'),
    ('Horror'),
    ('Mystery'),
    ('Romance'),
    ('Science Fiction'),
    ('Thriller');

INSERT INTO
    Movie (
        Title,
        Year,
        Length,
        Plot_outline,
        Production_Company_Name
    )
VALUES (
        'The Dark Knight',
        2008,
        152,
        'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        'Warner Bros. Pictures'
    ),
    (
        'Inception',
        2010,
        148,
        'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        'Warner Bros. Pictures'
    ),
    (
        'The Godfather',
        1972,
        175,
        'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
        'Paramount Pictures'
    );

    INSERT INTO Movie_Genre (Movie_Title, Movie_Year, Genre_Type) VALUES
('The Dark Knight', 2008, 'Action'),
('Inception', 2010, 'Drama'),
('Inception', 2010, 'Mystery'),
('The Godfather', 1972, 'Action'),
('The Godfather', 1972, 'Drama');


SELECT 
    m.Title, 
    m.Year, 
    m.Length, 
    m.Plot_outline, 
    mg.Genre_Type, 
    md.Director_Name 
FROM 
    Movie m
JOIN 
    Movie_Genre mg ON m.Title = mg.Movie_Title AND m.Year = mg.Movie_Year
JOIN 
    Movie_Director md ON m.Title = md.Movie_Title AND m.Year = md.Movie_Year
WHERE 
    m.Year BETWEEN 1950 AND 2010
ORDER BY 
    m.`Title`ASC,
    m.Year ASC, 
    mg.Genre_Type ASC;

SELECT 
    m.Title, 
    m.Year, 
    m.Length,
    m.Production_Company_Name,  
    GROUP_CONCAT(mg.Genre_Type ORDER BY mg.Genre_Type ASC SEPARATOR ', ') AS All_Genre_Types,
    md.Director_Name 
FROM 
    Movie m
JOIN 
    Movie_Genre mg ON m.Title = mg.Movie_Title AND m.Year = mg.Movie_Year
JOIN 
    Movie_Director md ON m.Title = md.Movie_Title AND m.Year = md.Movie_Year
WHERE 
    m.Year BETWEEN 1950 AND 2010
GROUP BY 
    m.Title, m.Year, m.Length, m.Production_Company_Name, md.Director_Name
ORDER BY 
    m.Title ASC, 
    m.Year ASC, 
    All_Genre_Types ASC;
