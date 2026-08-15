export const TrafficLightPhase = {
    NorthSouthGreen: 'NorthSouthGreen',
    NorthSouthYellow: 'NorthSouthYellow',
    AllRedAfterNorthSouth: 'AllRedAfterNorthSouth',
    EastWestGreen: 'EastWestGreen',
    EastWestYellow: 'EastWestYellow',
    AllRedAfterEastWest: 'AllRedAfterEastWest',
} as const;

export type TrafficLightPhase = (typeof TrafficLightPhase)[keyof typeof TrafficLightPhase];
