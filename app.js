const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => console.log('success'))
  } catch (e) {
    console.log(`Db Error ${e.message}`)
    process.exit(1)
  }
}
initialize();

const convertStateDbObjectToResponseObject = (dbObject) => {
    return {
        stateName: dbObject.state_name,
        population: dbObject.population,
        stateId: dbObject.state_id,
        
    };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
    return {
        districtId: dbObject.district_id,
        districtName: dbObject.district_name,
        stateId: dbObject.state_id,
        cases: dbObject.cases,
        cured: dbObject.cured,
        active: dbObject.active,
        deaths: dbObject.deaths,
    };
};
// API 1 Getting all state
app.get("/states/", async (request, response) => {
    const getStateQuery =`
    SELECT * FROM state ORDER BY state_id;`;

    const stateArray = await db.all(getStateQuery);
    response.send(stateArray.map((eachState) => convertStateDbObjectToResponseObject(eachState)));
});

    // API 2 Getting Particular state based on state_iD

    app.get("/states/:stateId/", async (request, response) => {
        const {stateId} = request.params;
        const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId}`;
        const state = await db.get(getStateQuery);
        response.send(convertStateDbObjectToResponseObject(state));
    });

    // API3 Creating District 

    app.post("/districts/", async (request, response) => {
        const newDistrict = request.body;
        const {districtName, stateId, cases, cured, active, deaths} = newDistrict;

        const postDistrictQuery = `INSERT INTO district ( district_name, state_id, cases, cured, active, deaths )
           VALUES(
             '${districtName}',
             ${stateId},
             ${cases},
             ${cured},
             ${active},
             ${deaths}
           ) `;

        await db.run(postDistrictQuery);
        response.send("District Successfully Added");   
    });

    //API 4 Getting District based on district_id

    app.get("/districts/:districtId/", async (request, response) => {
        const { districtId } = request.params;
        const getDistrictQuery =`SELECT * FROM district WHERE district_id = ${districtId}`;

        const district = await db.get(getDistrictQuery);
        response.send(convertDistrictDbObjectToResponseObject(district));    
    });

    // API 5 Removing district from district table

    app.delete("/districts/:districtId/", async (request, response) => {
        const {districtId} = request.params;

        const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`;

        await db.run(deleteDistrictQuery);
        response.send("District Removed");
    });

    //API 6 Update district based on the diatrict_id

    app.put("/districts/:districtId/", async (request, response) => {
        const { districtId } = request.params;
        const districtDetails = request.body;

        const {
            districtName,
            stateId,
            cases,
            cured,
            active,
            deaths,
        } = districtDetails;

        const updateDistrictQuery = `UPDATE district SET district_name = '${districtName}',
                                                            state_id = ${stateId},
                                                            cases = ${cases},
                                                            cured = ${cured},
                                                            active = ${active},
                                                            deaths = ${deaths}
                                                            WHERE district_id = ${districtId};`;
         await db.run(updateDistrictQuery);
         response.send("District Details Updated");                                                   
    });
    // API 7 Getting Statitics of particular state
    app.get("/states/:stateId/stats/", async (request, response) => {
        const { stateId } = request.params;
        const getDistrictStateQuery = `SELECT SUM(cases) as totalCases, SUM(cured) as totalCured, SUM(active) as totalActive, SUM(deaths) as totalDeaths
                FROM district WHERE state_id = ${stateId};`;
        const stateArray = await db.get(getDistrictStateQuery);
        response.send(stateArray);        
    });

    //API 8 Getting State Name based on district_id

    app.get("/districts/:districtId/details/", async (request, response) => {
        const { districtId } = request.params;
        const getDistrictIdQuery = `SELECT state_id FROM district WHERE district_id = ${districtId};`;
        const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
        const getStateNameQuery = `select state_name as stateName from state where state_id = ${getDistrictIdQueryResponse.state_id};`;
        const getStateNameQueryResponse = await db.get(getStateNameQuery)
        response.send(getStateNameQueryResponse);                      
    });

    module.exports = app;