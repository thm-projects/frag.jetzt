export interface TopicCloudAdminData{
    blacklist: string[];
    wantedLabels: Label[];
    considerVotes: boolean;
    profanityFilter: boolean;
    blacklistIsActive: boolean;
    keywordORfulltext: KeywordOrFulltext;
}

export interface Label{
    tag: string;
    label: string;
}

export enum KeywordOrFulltext{
    keyword,
    fulltext,
    both
}
