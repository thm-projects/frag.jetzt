export interface TopicCloudAdminData {
    blacklist: string[];
    wantedLabels: Labels;
    considerVotes: boolean;
    profanityFilter: boolean;
    blacklistIsActive: boolean;
    keywordORfulltext: KeywordOrFulltext;
}

export enum KeywordOrFulltext {
    keyword,
    fulltext,
    both
}

export interface Label {
    readonly tag: string;
    readonly label: string;
}

export class Labels {
    readonly de: Label[];
    readonly en: Label[];

    constructor(_de: Label[], _en: Label[]) {
        this.de = _de;
        this.en = _en;
    }
}

const deLabels: Label[] = [
    {tag: 'sb',  label: 'Subjekt'},
    {tag: 'pd',  label: 'Prädikat'},
    {tag: 'og',  label: 'Genitivobjekt'},
    {tag: 'ag',  label: 'Genitivattribut'},
    {tag: 'app', label: 'Apposition'},
    {tag: 'da',  label: 'Dativobjekt'},
    {tag: 'oa',  label: 'Akkusativobjekt'},
    {tag: 'nk',  label: 'Noun Kernel Element'},
    {tag: 'mo',  label: 'Modifikator'},
    {tag: 'cj',  label: 'Konjunktor'}
];

const enLabels: Label[] = [
    {tag: 'no',   label: 'NOUN'},
    {tag: 'pro',  label: 'PRONOUN'},
    {tag: 've',   label: 'VERB'},
    {tag: 'adj',  label: 'ADJECTIVE'},
    {tag: 'adv',  label: 'ADVERB'},
    {tag: 'pre',  label: 'PREPOSITION'},
    {tag: 'con',  label: 'CONJUNCTION'},
    {tag: 'int',  label: 'INTERJECTION'}
];

export const spacyLabels = new Labels(deLabels, enLabels);
