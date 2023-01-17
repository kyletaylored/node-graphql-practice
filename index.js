const wretch = require("wretch")
require('dotenv').config()

const query = `
{
    query TenMostPopularPlanets {
        planets(order: [population_DESC], limit: 10) {
            results {
                name
                population
                species {
                    results {
                        name
                    }
                }
                residents {
                    results {
                        name
                    }
                }
            }
        }
        }",
    "variables":null,
    "operationName":"TenMostPopularPlanets"
}`


wretch("https://parseapi.back4app.com/graphql")
  .post({query: query})
  .json(json => {
    console.log(json);
  });


