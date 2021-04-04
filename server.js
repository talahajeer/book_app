'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

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

// Catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

// HELPER FUNCTIONS
// Only show part of this to get students started
function Book(info) {
  console.log(info.imageLinks);
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  this.image = info.imageLinks || placeholderImage;
  this.title = info.title || 'No title available';
  this.authors = info.authors;
  this.description = info.description;
}

// Note that .ejs file extension is not required

function renderHomePage(request, response) {
  response.render('pages/index');
}

function showForm(request, response) {
  // console.log("inside of searches!!")
  response.render('pages/searches/new');
}

// No API key required
// Console.log request.body and request.body.search
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  // console.log(request.body);
  // console.log(request.body.search);

  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  console.log({ url });

  superagent.get(url)
    .then(apiResponse => {
      // console.log("apiResponse.body", apiResponse.body);
      return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))
    })
    .then(results => response.render('pages/show', { searchResults: results })).catch((err) => {
      console.log("ERROR!!!!!");
      response.render('pages/error', { error: err });
    });
};
