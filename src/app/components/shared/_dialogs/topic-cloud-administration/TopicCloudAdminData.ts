export interface TopicCloudAdminData {
    blacklist: string[];
    wantedLabels: {
      de: string[];
      en: string[];
    };
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
    {tag: 'nk',  label: 'Nomen Kernelement'},
    {tag: 'mo',  label: 'Modifikator'},
    {tag: 'cj',  label: 'Konjunktor'},
    {tag: 'ROOT',  label: 'Satzkernelement'},
    {tag: 'par',  label: 'Klammerzusatz'}
];

const enLabels: Label[] = [
    {tag: 'nsubj',   label: 'Nominal subject'},
    {tag: 'nsubjpass',  label: 'Passive nominal subject'},
    {tag: 'pobj',   label: 'Object of preposition'},
    {tag: 'nummod',  label: 'Numeric modifier'},
    {tag: 'compound',  label: 'Compound'},
    {tag: 'dobj',  label: 'Direct object'},
    {tag: 'amod',  label: 'Adjectival modifier'},
    {tag: 'npadvmod',  label: 'Noun phrase as adverbial modifier'},
    {tag: 'conj',  label: 'Conjunct'},
    {tag: 'ROOT',  label: 'Sentence kernel element'},
    {tag: 'intj',  label: 'Interjection'}
];

export const spacyLabels = new Labels(deLabels, enLabels);
