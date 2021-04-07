DROP TABLE IF EXISTS author;
CREATE TABLE IF NOT EXISTS author (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);
INSERT INTO author (name) SELECT DISTINCT author FROM books; 
 ALTER TABLE books ADD COLUMN author_id INT;
UPDATE books SET author_id=author.id FROM (SELECT * FROM author) AS author WHERE books.author = author.name;
 ALTER TABLE books DROP COLUMN author;
ALTER TABLE books ADD CONSTRAINT fk_author FOREIGN KEY (author_id) REFERENCES author(id);