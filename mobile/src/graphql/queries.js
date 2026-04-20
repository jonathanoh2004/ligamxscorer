/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getMatch = /* GraphQL */ `
  query GetMatch($id: ID!) {
    getMatch(id: $id) {
      weekId
      matchId
      homeTeam
      awayTeam
      matchDate
      result
      locked
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listMatches = /* GraphQL */ `
  query ListMatches(
    $filter: ModelMatchFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMatches(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        weekId
        matchId
        homeTeam
        awayTeam
        matchDate
        result
        locked
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getPrediction = /* GraphQL */ `
  query GetPrediction($id: ID!) {
    getPrediction(id: $id) {
      username
      weekMatchId
      weekId
      matchId
      prediction
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listPredictions = /* GraphQL */ `
  query ListPredictions(
    $filter: ModelPredictionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPredictions(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        username
        weekMatchId
        weekId
        matchId
        prediction
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getWeeklyScore = /* GraphQL */ `
  query GetWeeklyScore($id: ID!) {
    getWeeklyScore(id: $id) {
      weekId
      username
      score
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listWeeklyScores = /* GraphQL */ `
  query ListWeeklyScores(
    $filter: ModelWeeklyScoreFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWeeklyScores(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        weekId
        username
        score
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getSeasonScore = /* GraphQL */ `
  query GetSeasonScore($id: ID!) {
    getSeasonScore(id: $id) {
      season
      username
      totalScore
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listSeasonScores = /* GraphQL */ `
  query ListSeasonScores(
    $filter: ModelSeasonScoreFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSeasonScores(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        season
        username
        totalScore
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getGroup = /* GraphQL */ `
  query GetGroup($id: ID!) {
    getGroup(id: $id) {
      name
      joinCode
      createdBy
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listGroups = /* GraphQL */ `
  query ListGroups(
    $filter: ModelGroupFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGroups(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        name
        joinCode
        createdBy
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getGroupMember = /* GraphQL */ `
  query GetGroupMember($id: ID!) {
    getGroupMember(id: $id) {
      groupId
      username
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listGroupMembers = /* GraphQL */ `
  query ListGroupMembers(
    $filter: ModelGroupMemberFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGroupMembers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        groupId
        username
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const matchesByWeek = /* GraphQL */ `
  query MatchesByWeek(
    $weekId: String!
    $sortDirection: ModelSortDirection
    $filter: ModelMatchFilterInput
    $limit: Int
    $nextToken: String
  ) {
    matchesByWeek(
      weekId: $weekId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        weekId
        matchId
        homeTeam
        awayTeam
        matchDate
        result
        locked
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const predictionsByUser = /* GraphQL */ `
  query PredictionsByUser(
    $username: String!
    $sortDirection: ModelSortDirection
    $filter: ModelPredictionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    predictionsByUser(
      username: $username
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        username
        weekMatchId
        weekId
        matchId
        prediction
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const predictionsByWeek = /* GraphQL */ `
  query PredictionsByWeek(
    $weekId: String!
    $sortDirection: ModelSortDirection
    $filter: ModelPredictionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    predictionsByWeek(
      weekId: $weekId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        username
        weekMatchId
        weekId
        matchId
        prediction
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const scoresByWeek = /* GraphQL */ `
  query ScoresByWeek(
    $weekId: String!
    $sortDirection: ModelSortDirection
    $filter: ModelWeeklyScoreFilterInput
    $limit: Int
    $nextToken: String
  ) {
    scoresByWeek(
      weekId: $weekId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        weekId
        username
        score
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const scoresBySeason = /* GraphQL */ `
  query ScoresBySeason(
    $season: String!
    $sortDirection: ModelSortDirection
    $filter: ModelSeasonScoreFilterInput
    $limit: Int
    $nextToken: String
  ) {
    scoresBySeason(
      season: $season
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        season
        username
        totalScore
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const groupByJoinCode = /* GraphQL */ `
  query GroupByJoinCode(
    $joinCode: String!
    $sortDirection: ModelSortDirection
    $filter: ModelGroupFilterInput
    $limit: Int
    $nextToken: String
  ) {
    groupByJoinCode(
      joinCode: $joinCode
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        name
        joinCode
        createdBy
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const membersByGroup = /* GraphQL */ `
  query MembersByGroup(
    $groupId: String!
    $sortDirection: ModelSortDirection
    $filter: ModelGroupMemberFilterInput
    $limit: Int
    $nextToken: String
  ) {
    membersByGroup(
      groupId: $groupId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        groupId
        username
        displayName
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const groupsByUsername = /* GraphQL */ `
  query GroupsByUsername(
    $username: String!
    $sortDirection: ModelSortDirection
    $filter: ModelGroupMemberFilterInput
    $limit: Int
    $nextToken: String
  ) {
    groupsByUsername(
      username: $username
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        groupId
        username
        displayName
        id
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
