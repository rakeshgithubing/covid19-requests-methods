const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express(); // instanceof express.
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(59111, () => {
      console.log("Server Running at http://localhost:59111/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// API-1 Returns a list of all states in the state table

const convertStatesInCamelCase = (stateObject) => {
  return {
    stateId: stateObject.state_id,
    stateName: stateObject.state_name,
    population: stateObject.population,
  };
};
app.get("/states/", async (request, response) => {
  const statesQuery1 = `SELECT * FROM state`;
  const statesResult = await db.all(statesQuery1);
  response.send(
    statesResult.map((stateObject) => convertStatesInCamelCase(stateObject))
  );
});

// API-2 to Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery2 = `SELECT * FROM state WHERE state_id=${stateId}`;
  const stateResult = await db.get(stateQuery2);
  const stateConvertCamelCaseObject = {
    stateId: stateResult.state_id,
    stateName: stateResult.state_name,
    population: stateResult.population,
  };
  response.send(stateConvertCamelCaseObject);
});

//API-3 Create a district in the district table, `district_id` is auto-incremented

app.post("/districts/", async (request, response) => {
  const districtBodyDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtBodyDetails;
  const districtCreateQuery3 = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
    VALUES
    ( '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
        );`;
  await db.run(districtCreateQuery3);
  response.send("District Successfully Added");
});

// API-4 Returns a district based on the district ID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery4 = `SELECT * FROM district WHERE district_id=${districtId}`;
  const districtResult = await db.get(districtQuery4);
  const districtResultObject = {
    districtId: districtResult.district_id,
    districtName: districtResult.district_name,
    stateId: districtResult.state_id,
    cases: districtResult.cases,
    cured: districtResult.cured,
    active: districtResult.active,
    deaths: districtResult.deaths,
  };
  response.send(districtResultObject);
});

// API-5 Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtRemoveQuery5 = `DELETE FROM district WHERE district_id=${districtId}`;
  await db.run(districtRemoveQuery5);
  response.send("District Removed");
});

// API-6 Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtBodyUpdateData = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtBodyUpdateData;
  const districtUpdatedQuery6 = `UPDATE district 
    SET district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE district_id=${districtId};`;
  await db.run(districtUpdatedQuery6);
  response.send("District Details Updated");
});

// API-7 Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stateIdGetQuery7 = `SELECT SUM(cases) AS totalCases,
  SUM(cured) AS totalCured,
  SUM(active) AS totalActive,
  SUM(deaths) AS totalDeaths
  FROM district WHERE state_id=${stateId}`;
  const stateIdResult = await db.get(stateIdGetQuery7);
  response.send(stateIdResult);
});

// API-8 Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params; // path parameter;
  const getDistrictStateNameQuery8 = `SELECT * FROM state INNER JOIN district ON state.state_id=district.state_id 
    WHERE district_id=${districtId};`;
  const getStateNameResult = await db.get(getDistrictStateNameQuery8);
  const getStateNameObject = {
    stateName: getStateNameResult.state_name,
  };
  response.send(getStateNameObject);
});

module.exports = app; // exports a app data in common Js modules.
