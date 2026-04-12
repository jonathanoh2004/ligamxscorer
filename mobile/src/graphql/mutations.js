/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const adminSync = /* GraphQL */ `
  mutation AdminSync($action: String!) {
    adminSync(action: $action)
  }
`;

export const createMatch = /* GraphQL */ `
  mutation CreateMatch(
    $input: CreateMatchInput!
    $condition: ModelMatchConditionInput
  ) {
    createMatch(input: $input, condition: $condition) {
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
export const updateMatch = /* GraphQL */ `
  mutation UpdateMatch(
    $input: UpdateMatchInput!
    $condition: ModelMatchConditionInput
  ) {
    updateMatch(input: $input, condition: $condition) {
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
export const deleteMatch = /* GraphQL */ `
  mutation DeleteMatch(
    $input: DeleteMatchInput!
    $condition: ModelMatchConditionInput
  ) {
    deleteMatch(input: $input, condition: $condition) {
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
export const createPrediction = /* GraphQL */ `
  mutation CreatePrediction(
    $input: CreatePredictionInput!
    $condition: ModelPredictionConditionInput
  ) {
    createPrediction(input: $input, condition: $condition) {
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
export const updatePrediction = /* GraphQL */ `
  mutation UpdatePrediction(
    $input: UpdatePredictionInput!
    $condition: ModelPredictionConditionInput
  ) {
    updatePrediction(input: $input, condition: $condition) {
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
export const deletePrediction = /* GraphQL */ `
  mutation DeletePrediction(
    $input: DeletePredictionInput!
    $condition: ModelPredictionConditionInput
  ) {
    deletePrediction(input: $input, condition: $condition) {
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
export const createWeeklyScore = /* GraphQL */ `
  mutation CreateWeeklyScore(
    $input: CreateWeeklyScoreInput!
    $condition: ModelWeeklyScoreConditionInput
  ) {
    createWeeklyScore(input: $input, condition: $condition) {
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
export const updateWeeklyScore = /* GraphQL */ `
  mutation UpdateWeeklyScore(
    $input: UpdateWeeklyScoreInput!
    $condition: ModelWeeklyScoreConditionInput
  ) {
    updateWeeklyScore(input: $input, condition: $condition) {
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
export const deleteWeeklyScore = /* GraphQL */ `
  mutation DeleteWeeklyScore(
    $input: DeleteWeeklyScoreInput!
    $condition: ModelWeeklyScoreConditionInput
  ) {
    deleteWeeklyScore(input: $input, condition: $condition) {
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
export const createSeasonScore = /* GraphQL */ `
  mutation CreateSeasonScore(
    $input: CreateSeasonScoreInput!
    $condition: ModelSeasonScoreConditionInput
  ) {
    createSeasonScore(input: $input, condition: $condition) {
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
export const updateSeasonScore = /* GraphQL */ `
  mutation UpdateSeasonScore(
    $input: UpdateSeasonScoreInput!
    $condition: ModelSeasonScoreConditionInput
  ) {
    updateSeasonScore(input: $input, condition: $condition) {
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
export const deleteSeasonScore = /* GraphQL */ `
  mutation DeleteSeasonScore(
    $input: DeleteSeasonScoreInput!
    $condition: ModelSeasonScoreConditionInput
  ) {
    deleteSeasonScore(input: $input, condition: $condition) {
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
export const createGroup = /* GraphQL */ `
  mutation CreateGroup(
    $input: CreateGroupInput!
    $condition: ModelGroupConditionInput
  ) {
    createGroup(input: $input, condition: $condition) {
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
export const updateGroup = /* GraphQL */ `
  mutation UpdateGroup(
    $input: UpdateGroupInput!
    $condition: ModelGroupConditionInput
  ) {
    updateGroup(input: $input, condition: $condition) {
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
export const deleteGroup = /* GraphQL */ `
  mutation DeleteGroup(
    $input: DeleteGroupInput!
    $condition: ModelGroupConditionInput
  ) {
    deleteGroup(input: $input, condition: $condition) {
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
export const createGroupMember = /* GraphQL */ `
  mutation CreateGroupMember(
    $input: CreateGroupMemberInput!
    $condition: ModelGroupMemberConditionInput
  ) {
    createGroupMember(input: $input, condition: $condition) {
      groupId
      username
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateGroupMember = /* GraphQL */ `
  mutation UpdateGroupMember(
    $input: UpdateGroupMemberInput!
    $condition: ModelGroupMemberConditionInput
  ) {
    updateGroupMember(input: $input, condition: $condition) {
      groupId
      username
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteGroupMember = /* GraphQL */ `
  mutation DeleteGroupMember(
    $input: DeleteGroupMemberInput!
    $condition: ModelGroupMemberConditionInput
  ) {
    deleteGroupMember(input: $input, condition: $condition) {
      groupId
      username
      id
      createdAt
      updatedAt
      __typename
    }
  }
`;
