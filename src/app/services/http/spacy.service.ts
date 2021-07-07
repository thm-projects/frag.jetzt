import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { catchError, map, tap } from 'rxjs/operators';
import { CreateCommentKeywords } from '../../utils/create-comment-keywords';

export type Model = 'de' | 'en' | 'fr' | 'es' | 'it' | 'nl' | 'pt' | 'auto';

export interface SpacyKeyword {
  lemma: string;
  dep: string[];
}

type EnglishParserLabels = 'ROOT' | //None
  'acl' | //clausal modifier of noun (adjectival clause)
  'acomp' | //adjectival complement
  'advcl' | //adverbial clause modifier
  'advmod' | //adverbial modifier
  'agent' | //agent
  'amod' | //adjectival modifier
  'appos' | //appositional modifier
  'attr' | //attribute
  'aux' | //auxiliary
  'auxpass' | //auxiliary (passive)
  'case' | //case marking
  'cc' | //coordinating conjunction
  'ccomp' | //clausal complement
  'compound' | //compound
  'conj' | //conjunct
  'csubj' | //clausal subject
  'csubjpass' | //clausal subject (passive)
  'dative' | //dative
  'dep' | //unclassified dependent
  'det' | //determiner
  'dobj' | //direct object
  'expl' | //expletive
  'intj' | //interjection
  'mark' | //marker
  'meta' | //meta modifier
  'neg' | //negation modifier
  'nmod' | //modifier of nominal
  'npadvmod' | //noun phrase as adverbial modifier
  'nsubj' | //nominal subject
  'nsubjpass' | //nominal subject (passive)
  'nummod' | //numeric modifier
  'oprd' | //object predicate
  'parataxis' | //parataxis
  'pcomp' | //complement of preposition
  'pobj' | //object of preposition
  'poss' | //possession modifier
  'preconj' | //pre-correlative conjunction
  'predet' | //None
  'prep' | //prepositional modifier
  'prt' | //particle
  'punct' | //punctuation
  'quantmod' | //modifier of quantifier
  'relcl' | //relative clause modifier
  'xcomp'; //open clausal complement

type GermanParserLabels = 'ROOT' | //None
  'ac' | //adpositional case marker
  'adc' | //adjective component
  'ag' | //genitive attribute
  'ams' | //measure argument of adjective
  'app' | //apposition
  'avc' | //adverbial phrase component
  'cc' | //coordinating conjunction
  'cd' | //coordinating conjunction
  'cj' | //conjunct
  'cm' | //comparative conjunction
  'cp' | //complementizer
  'cvc' | //collocational verb construction
  'da' | //dative
  'dep' | //unclassified dependent
  'dm' | //discourse marker
  'ep' | //expletive es
  'ju' | //junctor
  'mnr' | //postnominal modifier
  'mo' | //modifier
  'ng' | //negation
  'nk' | //noun kernel element
  'nmc' | //numerical component
  'oa' | //accusative object
  'oc' | //clausal object
  'og' | //genitive object
  'op' | //prepositional object
  'par' | //parenthetical element
  'pd' | //predicate
  'pg' | //phrasal genitive
  'ph' | //placeholder
  'pm' | //morphological particle
  'pnc' | //proper noun component
  'punct' | //punctuation
  'rc' | //relative clause
  're' | //repeated element
  'rs' | //reported speech
  'sb' | //subject
  'sbp' | //passivized subject (PP)
  'svp' | //separable verb prefix
  'uc' | //unit component
  'vo';  //vocative

type FrenchParserLabels = 'ROOT' | //None
  'acl' | //clausal modifier of noun (adjectival clause)
  'acl:relcl' | //None
  'advcl' | //adverbial clause modifier
  'advmod' | //adverbial modifier
  'amod' | //adjectival modifier
  'appos' | //appositional modifier
  'aux:pass' | //None
  'aux:tense' | //None
  'case' | //case marking
  'cc' | //coordinating conjunction
  'ccomp' | //clausal complement
  'conj' | //conjunct
  'cop' | //copula
  'dep' | //unclassified dependent
  'det' | //determiner
  'expl:comp' | //None
  'expl:pass' | //None
  'expl:subj' | //None
  'fixed' | //fixed multiword expression
  'flat:foreign' | //None
  'flat:name' | //None
  'iobj' | //indirect object
  'mark' | //marker
  'nmod' | //modifier of nominal
  'nsubj' | //nominal subject
  'nsubj:pass' | //None
  'nummod' | //numeric modifier
  'obj' | //object
  'obl:agent' | //None
  'obl:arg' | //None
  'obl:mod' | //None
  'parataxis' | //parataxis
  'punct' | //punctuation
  'vocative' | //vocative
  'xcomp'; //open clausal complement

const LABELS = {
  de: ['sb', 'pd', 'og', 'ag', 'app', 'da', 'oa', 'nk', 'mo', 'cj'] as GermanParserLabels[],
  en: [] as EnglishParserLabels[],
  fr: [] as FrenchParserLabels[],
};

type KeywordType = 'entity' | 'noun';

interface NounKeyword {
  type: KeywordType;
  lemma: string;
  text: string;
  dep: string;
  tag: string;
  pos: string;
}

interface EntityKeyword extends NounKeyword {
  entityType: string;
}

type AbstractKeyword = NounKeyword | EntityKeyword;

type KeywordList = AbstractKeyword[];

const httpOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class SpacyService extends BaseHttpService {

  constructor(private http: HttpClient) {
    super();
  }

  static getLabelsForModel(model: Model): string[] {
    return LABELS[model];
  }

  getKeywords(text: string, model: Model): Observable<SpacyKeyword[]> {
    const url = '/spacy';
    return this.http.post<KeywordList>(url, { text, model }, httpOptions)
      .pipe(
        tap(_ => ''),
        catchError(this.handleError<any>('getKeywords')),
        map((elem: KeywordList) => {
          const keywordsMap = new Map<string, { lemma: string; dep: Set<string> }>();
          elem.forEach(e => {
            const keyword = e.lemma.trim();
            if (!CreateCommentKeywords.isKeywordAcceptable(keyword)) {
              return;
            }
            let keywordObj = keywordsMap.get(keyword);
            if (!keywordObj) {
              keywordObj = {
                lemma: keyword,
                dep: new Set<string>()
              };
              keywordsMap.set(keyword, keywordObj);
            }
            keywordObj.dep.add(e.dep);
          });
          return [...keywordsMap.values()].map(e => ({ lemma: e.lemma, dep: [...e.dep] }));
        })
      );
  }
}
