export interface TopicCloudAdminData{
    blacklist: string[];
    considerVotes: boolean;
    profanityFilter: boolean;
    blacklistIsActive: boolean;
    keywordORfulltext: KeywordORfulltext;
}

export enum KeywordORfulltext{
    keyword,
    fulltext,
    both
}
