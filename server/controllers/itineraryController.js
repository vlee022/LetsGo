const db = require('../model/databaseModel');
const axios = require('axios');

// bring in our YelpAPIKey
const { yelpAPIKey } = require('../../config');

const itineraryController = {};

// set header info for our API request
let yelpREST = axios.create({
  baseURL: 'https://api.yelp.com/v3/',
  headers: {
    Authorization: `Bearer ${yelpAPIKey}`,
    'Content-type': 'application/json',
  },
});

itineraryController.yelpInfo = (req, res, next) => {
  const { location, radius, budget } = req.body;
  const options = [];

  for (let el in req.body) {
    if (req.body[el] === true) options.push(el);
  }

  console.log('LINE 26 OPTIONS:', options);

  const fetchYelp = async (arr) => {
    const request = arr.map((el) =>
      yelpREST('/businesses/search', {
        params: {
          location: location,
          radius: radius,
          budget: budget,
          limit: 20,
          term: el,
        },
      }).then(({ data }) => {
        return data;
      })
    );
    return Promise.all(request);
  };
  fetchYelp(options).then((a) => {
    a.forEach((el, i) => {
      req.body[options[i]] = JSON.stringify(
        el.businesses[Math.floor(Math.random() * el.businesses.length)]
      );
    });
    next();
  });
};

itineraryController.dbStore = (req, res, next) => {
  console.log('Line 54 REQUEST BODY', req.body);
  const {
    location,
    date,
    radius,
    budget,
    Breakfast,
    Lunch,
    Dinner,
    Hotels,
    Nightlife,
    Shopping,
  } = req.body;
  const arts = req.body['Arts & Entertainment'];
  const active = req.body['Active Life'];
  const user_id = req.cookies.user_id;

  const string =
    'INSERT INTO itinerary(date, radius, location, budget, breakfast, lunch, dinner, hotel, active, arts, nightlife, shopping, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *';
  db.query(string, [
    date,
    radius,
    location,
    budget,
    Breakfast,
    Lunch,
    Dinner,
    Hotels,
    active,
    arts,
    Nightlife,
    Shopping,
    user_id,
  ])
    .then((data) => next())
    .catch((err) => next(err)); // catch for dbQuery;
};

itineraryController.getItinerary = (req, res, next) => {
  const str = 'SELECT * FROM itinerary WHERE user_id =$1';
  db.query(str, [req.cookies.user_id]).then((data) => {
    res.locals.yelp = data.rows;
    return next();
  });
};

module.exports = itineraryController;
