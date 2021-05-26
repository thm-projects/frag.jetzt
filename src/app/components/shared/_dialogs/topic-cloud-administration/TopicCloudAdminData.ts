export interface TopicCloudAdminData{
    blacklist: string[];
    considerVotes: boolean;
    profanityFilter: boolean;
    blacklistIsActive: boolean;
    keywordORfulltext: KeywordOrFulltext;
}

export enum KeywordOrFulltext{
    keyword,
    fulltext,
    both
}
