/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateMatch = /* GraphQL */ `
  subscription OnCreateMatch($filter: ModelSubscriptionMatchFilterInput) {
    onCreateMatch(filter: $filter) {
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
export const onUpdateMatch = /* GraphQL */ `
  subscription OnUpdateMatch($filter: ModelSubscriptionMatchFilterInput) {
    onUpdateMatch(filter: $filter) {
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
export const onDeleteMatch = /* GraphQL */ `
  subscription OnDeleteMatch($filter: ModelSubscriptionMatchFilterInput) {
    onDeleteMatch(filter: $filter) {
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
export const onCreatePrediction = /* GraphQL */ `
  subscription OnCreatePrediction(
    $filter: ModelSubscriptionPredictionFilterInput
  ) {
    onCreatePrediction(filter: $filter) {
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
export const onUpdatePrediction = /* GraphQL */ `
  subscription OnUpdatePrediction(
    $filter: ModelSubscriptionPredictionFilterInput
  ) {
    onUpdatePrediction(filter: $filter) {
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
export const onDeletePrediction = /* GraphQL */ `
  subscription OnDeletePrediction(
    $filter: ModelSubscriptionPredictionFilterInput
  ) {
    onDeletePrediction(filter: $filter) {
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
export const onCreateWeeklyScore = /* GraphQL */ `
  subscription OnCreateWeeklyScore(
    $filter: ModelSubscriptionWeeklyScoreFilterInput
  ) {
    onCreateWeeklyScore(filter: $filter) {
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
export const onUpdateWeeklyScore = /* GraphQL */ `
  subscription OnUpdateWeeklyScore(
    $filter: ModelSubscriptionWeeklyScoreFilterInput
  ) {
    onUpdateWeeklyScore(filter: $filter) {
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
export const onDeleteWeeklyScore = /* GraphQL */ `
  subscription OnDeleteWeeklyScore(
    $filter: ModelSubscriptionWeeklyScoreFilterInput
  ) {
    onDeleteWeeklyScore(filter: $filter) {
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
export const onCreateSeasonScore = /* GraphQL */ `
  subscription OnCreateSeasonScore(
    $filter: ModelSubscriptionSeasonScoreFilterInput
  ) {
    onCreateSeasonScore(filter: $filter) {
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
export const onUpdateSeasonScore = /* GraphQL */ `
  subscription OnUpdateSeasonScore(
    $filter: ModelSubscriptionSeasonScoreFilterInput
  ) {
    onUpdateSeasonScore(filter: $filter) {
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
export const onDeleteSeasonScore = /* GraphQL */ `
  subscription OnDeleteSeasonScore(
    $filter: ModelSubscriptionSeasonScoreFilterInput
  ) {
    onDeleteSeasonScore(filter: $filter) {
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
export const onCreateGroup = /* GraphQL */ `
  subscription OnCreateGroup($filter: ModelSubscriptionGroupFilterInput) {
    onCreateGroup(filter: $filter) {
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
export const onUpdateGroup = /* GraphQL */ `
  subscription OnUpdateGroup($filter: ModelSubscriptionGroupFilterInput) {
    onUpdateGroup(filter: $filter) {
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
export const onDeleteGroup = /* GraphQL */ `
  subscription OnDeleteGroup($filter: ModelSubscriptionGroupFilterInput) {
    onDeleteGroup(filter: $filter) {
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
export const onCreateGroupMember = /* GraphQL */ `
  subscription OnCreateGroupMember(
    $filter: ModelSubscriptionGroupMemberFilterInput
  ) {
    onCreateGroupMember(filter: $filter) {
      groupId
      username
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateGroupMember = /* GraphQL */ `
  subscription OnUpdateGroupMember(
    $filter: ModelSubscriptionGroupMemberFilterInput
  ) {
    onUpdateGroupMember(filter: $filter) {
      groupId
      username
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteGroupMember = /* GraphQL */ `
  subscription OnDeleteGroupMember(
    $filter: ModelSubscriptionGroupMemberFilterInput
  ) {
    onDeleteGroupMember(filter: $filter) {
      groupId
      username
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
