'use strict';

// Application Dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);


// Application Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));
app.use(methodOverride('_method'));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// API Routes
// Renders the home page
app.get('/', renderHomePage);

// Renders the search form
app.get('/searches/new', showForm);

// Creates a new search to the Google Books API
app.post('/searches', createSearch);

// Renders the required book with certain id
app.get('/book/:id', getOneBook);

// Add book to the server
app.post('/books', addBook);



// Edit a book data in the server
app.get('/edit/:id', handleData);
app.put('/edit/:id', handleUpdate);

// Delete a book from server
app.delete('/books/:id', handleDelete);

// Catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist'));


// HELPER FUNCTIONS
function Book(info) {

  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  this.image = info.imageLinks ? info.imageLinks.smallThumbnail : placeholderImage;
  this.title = info.title ? info.title : 'No title available';
  this.authors = info.authors ? info.authors.join(" ") : 'No authors-names available';
  this.description = info.description ? info.description : 'No description available';
  this.isbn = info.industryIdentifiers ? info.industryIdentifiers[0].identifier : 'No isbn available';
  // console.log(this.isbn)
}

// Note that .ejs file extension is not required

function renderHomePage(request, response) {
  let SQL = 'SELECT * FROM books;';
  client.query(SQL).then(result => {
    console.log(result.rows);
    response.render('./pages/index', { count: result.rowCount, booksList: result.rows });
  }).catch((error => {
    console.log(`ERROR IN HOME PAGE`, error);
  }));
}

function showForm(request, response) {
  response.render('pages/searches/new');
}

// No API key required
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';


  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => {
      return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))
    })
    .then((results) => {
      console.log(results);
      response.render('pages/books/show', { searchResults: results })
    })
    .catch((err) => {
      console.log("ERROR!!!!!");
      response.render('pages/error', { error: err });
    });
};


function getOneBook(request, response) {

  // console.log(request.params);
  let SQL = `SELECT * FROM books WHERE id = $1;`;
  let val = [request.params.id];
  client.query(SQL, val).then(results => {
    {console.log(results);
      response.render(`pages/books/detail`, { results: results.rows })};
  }).catch((err) => {
    response.render('pages/error', { error: err });
  });
};

function addBook(request, response) {
  let { image_url, title, author, description, isbn } = request.body;
  // console.log(request.body)

  // insert into my database
  const SQL1 = `SELECT * FROM author WHERE name =$1;`;
  let values1 = [author];

  client.query(SQL1, values1).then((result) => {

    if (result.rowCount) {
      let id = result.rows[0].id;

      const SQL = `INSERT INTO books (title, description,isbn,image_url,author_id) VALUES ($1, $2, $3, $4,$5) RETURNING *;`;
      const values = [title, description, isbn, image_url, id];

      client.query(SQL, values).then(() => {
        response.redirect('/');
      });

    } else {
      const SQLInsertion = `INSERT INTO author (name) VALUES ($1) RETURNING *;`;
      let value = [author];
      client.query(SQLInsertion, value).then((result) => {
        let id = result.rows[0].id;
        const SQL = `INSERT INTO books (title, description,isbn,image_url,author_id) VALUES ($1, $2, $3, $4,$5) RETURNING *;`;
        const values = [title, description, isbn, image_url, id];
        client.query(SQL, values).then(() => {
          response.redirect('/');
        });
      });
    }
  })
};



function handleData(request, response) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let id = request.params.id;
  let vals = [id];
  client.query(SQL, vals).then(result => {
    response.render('pages/books/edit', { results: result.rows[0] });
  });
};

function handleUpdate(request, response) {
  let SQL = 'UPDATE books SET author=$1 , title=$2, isbn=$3, image_url=$4, description=$5 WHERE id=$6';
  let { author, title, isbn, image_url, description } = request.body;
  let id = request.params.id;
  let vals = [author, title, isbn, image_url, description, id];

  client.query(SQL, vals).then(() => {
    console.log('success!!!');
    response.redirect(`/book/${id}`);
  });
};

function handleDelete(request, response) {
  const id = request.params.id;
  // console.log('deleting',id);
  let SQL = 'DELETE FROM books WHERE id=$1;';
  let vals = [id];
  client.query(SQL, vals).then(() => {
    response.redirect('/');
  });
};

// connect with the data base
client.connect().then(() => {
  app.listen(PORT, () => console.log(`App is running on Server on port: ${PORT}`))
});