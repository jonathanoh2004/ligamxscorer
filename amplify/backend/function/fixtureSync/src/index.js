/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	API_LIGAMXSCORER_GRAPHQLAPIIDOUTPUT
	API_LIGAMXSCORER_GRAPHQLAPIENDPOINTOUTPUT
	APIFOOTBALL_KEY_PARAM
Amplify Params - DO NOT EDIT */

const https = require("https");
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const REGION = process.env.REGION || "us-west-2";
const LIGA_MX_LEAGUE_ID = 262;  // API-Football league ID for Liga MX
const LIGA_MX_SEASON = 2025;

const ssm = new SSMClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

// Table names follow Amplify's naming convention: ModelName-apiId-env
const API_ID = process.env.API_LIGAMXSCORER_GRAPHQLAPIIDOUTPUT;
const ENV = process.env.ENV;
const MATCH_TABLE = `Match-${API_ID}-${ENV}`;
const WEEKLY_SCORE_TABLE = `WeeklyScore-${API_ID}-${ENV}`;
const SEASON_SCORE_TABLE = `SeasonScore-${API_ID}-${ENV}`;
const PREDICTION_TABLE = `Prediction-${API_ID}-${ENV}`;

async function getApiKey() {
  const param = await ssm.send(new GetParameterCommand({
    Name: process.env.APIFOOTBALL_KEY_PARAM,
    WithDecryption: true,
  }));
  return param.Parameter.Value;
}

function apiRequest(path, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "v3.football.api-sports.io",
      path,
      method: "GET",
      headers: { "x-apisports-key": apiKey },
    };
    https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

// Get ISO week number for a date
function getWeekId(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

async function syncFixtures(apiKey) {
  console.log("Fetching upcoming Liga MX fixtures...");
  const data = await apiRequest(
    `/fixtures?league=${LIGA_MX_LEAGUE_ID}&season=${LIGA_MX_SEASON}&status=NS&next=20`,
    apiKey
  );

  if (!data.response?.length) {
    console.log("No upcoming fixtures found.");
    return;
  }

  for (const fixture of data.response) {
    const matchId = String(fixture.fixture.id);
    const matchDate = fixture.fixture.date;
    const weekId = getWeekId(matchDate);

    await ddb.send(new PutCommand({
      TableName: MATCH_TABLE,
      Item: {
        id: matchId,
        weekId,
        matchId,
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        matchDate,
        result: null,
        locked: false,
        __typename: "Match",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ConditionExpression: "attribute_not_exists(id)",  // don't overwrite existing
    }).catch((e) => {
      if (e.name !== "ConditionalCheckFailedException") throw e;
    }));
  }

  console.log(`Synced ${data.response.length} upcoming fixtures.`);
}

async function syncResults(apiKey) {
  console.log("Fetching finished Liga MX matches...");
  const data = await apiRequest(
    `/fixtures?league=${LIGA_MX_LEAGUE_ID}&season=${LIGA_MX_SEASON}&status=FT&last=20`,
    apiKey
  );

  if (!data.response?.length) {
    console.log("No finished matches found.");
    return;
  }

  for (const fixture of data.response) {
    const matchId = String(fixture.fixture.id);
    const home = fixture.goals.home;
    const away = fixture.goals.away;
    const result = home > away ? "H" : away > home ? "A" : "D";

    // Update match result
    await ddb.send(new UpdateCommand({
      TableName: MATCH_TABLE,
      Key: { id: matchId },
      UpdateExpression: "SET #result = :result, locked = :locked, updatedAt = :now",
      ExpressionAttributeNames: { "#result": "result" },
      ExpressionAttributeValues: {
        ":result": result,
        ":locked": true,
        ":now": new Date().toISOString(),
      },
    })).catch((e) => console.error(`Failed to update match ${matchId}:`, e.message));

    // Score predictions for this match
    await scorePredictions(matchId, result);
  }

  console.log(`Processed results for ${data.response.length} matches.`);
}

async function scorePredictions(matchId, actualResult) {
  // Query all predictions for this match
  const result = await ddb.send(new QueryCommand({
    TableName: PREDICTION_TABLE,
    IndexName: "byWeek",
    KeyConditionExpression: "matchId = :matchId",
    ExpressionAttributeValues: { ":matchId": matchId },
  })).catch(() => ({ Items: [] }));

  for (const prediction of (result.Items || [])) {
    if (prediction.prediction !== actualResult) continue;

    const weekId = prediction.weekId;
    const username = prediction.username;

    // Upsert WeeklyScore
    await ddb.send(new UpdateCommand({
      TableName: WEEKLY_SCORE_TABLE,
      Key: { id: `${weekId}#${username}` },
      UpdateExpression: "SET weekId = :weekId, username = :username, score = if_not_exists(score, :zero) + :one, __typename = :type, createdAt = if_not_exists(createdAt, :now), updatedAt = :now",
      ExpressionAttributeValues: {
        ":weekId": weekId,
        ":username": username,
        ":zero": 0,
        ":one": 1,
        ":type": "WeeklyScore",
        ":now": new Date().toISOString(),
      },
    }));

    // Upsert SeasonScore
    await ddb.send(new UpdateCommand({
      TableName: SEASON_SCORE_TABLE,
      Key: { id: `${LIGA_MX_SEASON}#${username}` },
      UpdateExpression: "SET season = :season, username = :username, totalScore = if_not_exists(totalScore, :zero) + :one, __typename = :type, createdAt = if_not_exists(createdAt, :now), updatedAt = :now",
      ExpressionAttributeValues: {
        ":season": String(LIGA_MX_SEASON),
        ":username": username,
        ":zero": 0,
        ":one": 1,
        ":type": "SeasonScore",
        ":now": new Date().toISOString(),
      },
    }));
  }
}

exports.handler = async (event) => {
  console.log("fixtureSync triggered:", JSON.stringify(event));

  try {
    const apiKey = await getApiKey();

    // If manually invoked with action=results, only score results
    const action = event?.action;

    if (action === "results") {
      await syncResults(apiKey);
    } else if (action === "fixtures") {
      await syncFixtures(apiKey);
    } else {
      // Default: sync both (scheduled run)
      await syncFixtures(apiKey);
      await syncResults(apiKey);
    }

    return { statusCode: 200, body: "Sync complete" };
  } catch (err) {
    console.error("fixtureSync error:", err);
    throw err;
  }
};
