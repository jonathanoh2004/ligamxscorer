/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	API_LIGAMXSCORER_GRAPHQLAPIIDOUTPUT
	API_LIGAMXSCORER_GRAPHQLAPIENDPOINTOUTPUT
	APIFOOTBALL_KEY_PARAM
Amplify Params - DO NOT EDIT */

const https = require("https");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const REGION = process.env.REGION || "us-west-2";
const ENV = process.env.ENV;
const API_ID = process.env.API_LIGAMXSCORER_GRAPHQLAPIIDOUTPUT;

const MATCH_TABLE = `Match-${API_ID}-${ENV}`;
const WEEKLY_SCORE_TABLE = `WeeklyScore-${API_ID}-${ENV}`;
const SEASON_SCORE_TABLE = `SeasonScore-${API_ID}-${ENV}`;
const PREDICTION_TABLE = `Prediction-${API_ID}-${ENV}`;

const SEASON = "2025";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

// ESPN base URL for Liga MX (mex.1)
const ESPN_BASE = "site.api.espn.com";
const ESPN_PATH = "/apis/site/v2/sports/soccer/mex.1/scoreboard";

function espnRequest(queryString) {
  return new Promise((resolve, reject) => {
    const path = `${ESPN_PATH}${queryString ? "?" + queryString : ""}`;
    https.get({ hostname: ESPN_BASE, path, headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("Failed to parse ESPN response: " + data.substring(0, 200))); }
      });
    }).on("error", reject);
  });
}

// Get ISO week number and year for a date string
function getWeekId(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

// Get the date range (Mon–Sun) for the current ISO week
function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = (day === 0) ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, "");
  return `${fmt(mon)}-${fmt(sun)}`;
}

// Parse ESPN event into our match shape
function parseEvent(event) {
  const comp = event.competitions[0];
  const home = comp.competitors.find(t => t.homeAway === "home");
  const away = comp.competitors.find(t => t.homeAway === "away");
  const status = comp.status.type.name; // STATUS_SCHEDULED, STATUS_IN_PROGRESS, STATUS_FINAL
  const matchDate = event.date;
  const weekId = getWeekId(matchDate);

  const FINAL_STATUSES = ["STATUS_FINAL", "STATUS_FULL_TIME", "STATUS_FT"];
  const isFinal = FINAL_STATUSES.includes(status);

  let result = null;
  if (isFinal) {
    const hScore = parseInt(home.score || "0", 10);
    const aScore = parseInt(away.score || "0", 10);
    result = hScore > aScore ? "H" : aScore > hScore ? "A" : "D";
  }

  return {
    id: String(event.id),
    matchId: String(event.id),
    weekId,
    homeTeam: home.team.displayName,
    awayTeam: away.team.displayName,
    matchDate,
    result,
    locked: status !== "STATUS_SCHEDULED",
    status,
    __typename: "Match",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function syncFixtures() {
  console.log("Fetching current week Liga MX fixtures from ESPN...");
  const weekRange = getCurrentWeekRange();
  console.log("Week range:", weekRange);

  const data = await espnRequest(`dates=${weekRange}`);
  const events = data.events || [];

  if (!events.length) {
    console.log("No fixtures found for this week.");
    return 0;
  }

  let inserted = 0;
  for (const event of events) {
    const match = parseEvent(event);
    await ddb.send(new PutCommand({
      TableName: MATCH_TABLE,
      Item: match,
      ConditionExpression: "attribute_not_exists(id)",
    })).catch(e => {
      if (e.name !== "ConditionalCheckFailedException") throw e;
      console.log(`Match ${match.matchId} already exists, skipping.`);
    });
    inserted++;
  }

  console.log(`Synced ${inserted} fixtures.`);
  return inserted;
}

async function syncResults() {
  console.log("Fetching finished Liga MX results from ESPN...");
  const weekRange = getCurrentWeekRange();
  const data = await espnRequest(`dates=${weekRange}`);
  const FINAL_STATUSES = ["STATUS_FINAL", "STATUS_FULL_TIME", "STATUS_FT"];
  const events = (data.events || []).filter(e =>
    FINAL_STATUSES.includes(e.competitions[0].status.type.name)
  );

  if (!events.length) {
    console.log("No finished matches found.");
    return 0;
  }

  let scored = 0;
  for (const event of events) {
    const match = parseEvent(event);

    // Update match result in DynamoDB
    await ddb.send(new UpdateCommand({
      TableName: MATCH_TABLE,
      Key: { id: match.matchId },
      UpdateExpression: "SET #result = :result, locked = :locked, updatedAt = :now",
      ExpressionAttributeNames: { "#result": "result" },
      ExpressionAttributeValues: {
        ":result": match.result,
        ":locked": true,
        ":now": new Date().toISOString(),
      },
    })).catch(e => console.error(`Failed to update match ${match.matchId}:`, e.message));

    await scorePredictions(match.matchId, match.result, match.weekId);
    scored++;
  }

  console.log(`Scored ${scored} finished matches.`);
  return scored;
}

async function scorePredictions(matchId, actualResult, weekId) {
  const result = await ddb.send(new QueryCommand({
    TableName: PREDICTION_TABLE,
    IndexName: "byWeek",
    KeyConditionExpression: "weekId = :weekId",
    FilterExpression: "matchId = :matchId",
    ExpressionAttributeValues: { ":weekId": weekId, ":matchId": matchId },
  })).catch(() => ({ Items: [] }));

  for (const prediction of (result.Items || [])) {
    if (prediction.prediction !== actualResult) continue;
    const username = prediction.username;
    const now = new Date().toISOString();

    // Only award point if this match hasn't been scored for this user yet (idempotent)
    await ddb.send(new UpdateCommand({
      TableName: WEEKLY_SCORE_TABLE,
      Key: { id: `${weekId}#${username}` },
      ConditionExpression: "attribute_not_exists(scoredMatches) OR NOT contains(scoredMatches, :matchId)",
      UpdateExpression: "SET weekId = :weekId, username = :username, score = if_not_exists(score, :zero) + :one, #typename = :type, createdAt = if_not_exists(createdAt, :now), updatedAt = :now ADD scoredMatches :matchIdSet",
      ExpressionAttributeNames: { "#typename": "__typename" },
      ExpressionAttributeValues: {
        ":weekId": weekId, ":username": username, ":zero": 0, ":one": 1,
        ":type": "WeeklyScore", ":now": now,
        ":matchId": matchId, ":matchIdSet": new Set([matchId]),
      },
    })).catch(e => {
      if (e.name !== "ConditionalCheckFailedException") throw e;
      console.log(`Match ${matchId} already scored for ${username}, skipping.`);
    });

    await ddb.send(new UpdateCommand({
      TableName: SEASON_SCORE_TABLE,
      Key: { id: `${SEASON}#${username}` },
      ConditionExpression: "attribute_not_exists(scoredMatches) OR NOT contains(scoredMatches, :matchId)",
      UpdateExpression: "SET season = :season, username = :username, totalScore = if_not_exists(totalScore, :zero) + :one, #typename = :type, createdAt = if_not_exists(createdAt, :now), updatedAt = :now ADD scoredMatches :matchIdSet",
      ExpressionAttributeNames: { "#typename": "__typename" },
      ExpressionAttributeValues: {
        ":season": SEASON, ":username": username, ":zero": 0, ":one": 1,
        ":type": "SeasonScore", ":now": now,
        ":matchId": matchId, ":matchIdSet": new Set([matchId]),
      },
    })).catch(e => {
      if (e.name !== "ConditionalCheckFailedException") throw e;
    });
  }
}

exports.handler = async (event) => {
  console.log("fixtureSync triggered:", JSON.stringify(event));
  // Handle both direct invocation and AppSync resolver invocation
  const isAppSync = event?.typeName !== undefined;
  const action = event?.arguments?.action || event?.action;
  try {
    if (action === "results") {
      await syncResults();
    } else if (action === "fixtures") {
      await syncFixtures();
    } else {
      await syncFixtures();
      await syncResults();
    }
    if (isAppSync) return "Sync complete";
    return { statusCode: 200, body: "Sync complete" };
  } catch (err) {
    console.error("fixtureSync error:", err);
    throw err;
  }
};
