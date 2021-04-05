'use strict';

// Application Dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');


// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);


// Application Middleware
app.use(express.urlencoded({ extended: true }));

app.use(express.static('./public'));

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

// Catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist'));


// HELPER FUNCTIONS
function Book(info) {
  
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  this.image = info.imageLinks || placeholderImage;
  this.title = info.title || 'No title available';
  this.authors = info.authors || 'No authors-names available';
  this.description = info.description || 'No description available';
  this.isbn = info.industryIdentifiers[0].identifier || 'No isbn available';
  console.log(this.isbn)
}

// Note that .ejs file extension is not required

function renderHomePage(request, response) {
  let SQL = 'SELECT * FROM books;';
  client.query(SQL).then(result => {
    console.log(result.rows);
    response.render('pages/index', { count: result.rowCount });
  })
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
    .then(results => response.render('pages/show', { searchResults: results }))
    .catch((err) => {
      console.log("ERROR!!!!!");
      response.render('pages/error', { error: err });
    });
};


function getOneBook(request, response) {
  let book=request.body;
  console.log(request.body);
  let SQL='INSERT INTO book (title,author,isbn,image_url,description) VALUES ($1, $2, $3, $4, $5) RETURNING id;';
  let val=[book.title,book.author,book.isbn,book.image_url,book.description];
  client.query(SQL,val).then(results=>{
    response.redirect(`/books/${results.rows[0].id}`);
  }) .catch((err)=> {
    response.render('pages/error', { error: err });
  });
};


// connect with the data base
client.connect().then(() => {
  app.listen(PORT, () => console.log(`App is running on Server on port: ${PORT}`))
});