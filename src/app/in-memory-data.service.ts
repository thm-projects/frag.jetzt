import { InMemoryDbService } from 'angular-in-memory-web-api';
import { ContentType } from './content-type';

export class InMemoryDataService implements InMemoryDbService {
  /**
   * Gets called by the in memory db for generating ids for newly inserted entities.
   * As the default genId function is only capable of generating numeric ids but we're
   * using string ids (as per api) we're overwriting it relying on a stupid fallback for strings:
   * append a '1' to the id of the last element
   * @param {any[]} collection
   * @param {string} collectionName
   * @returns {any}
   */
  genId(collection: any[], collectionName: string): any {
    // Get the id of the last element
    const lastElementId = collection[collection.length - 1].id;
    if (isNaN(lastElementId)) {
      // Append '1' to the string id when the id is not convertable to a number
      return lastElementId + '1';
    }
    // Convert id to a number, add 1 and convert back to string
    return (+lastElementId + 1).toString();
  }

  createDb() {
    const rooms = [
      {
        id: '1',
        revision: '10',
        shortId: '12345678',
        abbreviation: 'abb',
        name: 'ARSnova Testroom',
        description: 'Refactoring ARSnova to look and feel good',
        closed: true
      },
      {
        id: '2',
        revision: '11',
        shortId: '23456789',
        abbreviation: 'abb1',
        name: 'Darkroom',
        description: 'Here is where the 18+ stuff happens',
        closed: false
      },
      {
        id: '3',
        revision: '11',
        shortId: '34567890',
        abbreviation: 'abb1',
        name: 'Keller',
        description: 'This is where the beer stehs',
        closed: false
      }
    ];
    const comments = [
      {
        id: '1',
        roomId: '1',
        userId: '1',
        revision: '',
        subject: 'testcomment',
        body: 'adsasdasdasdasdas',
        read: false,
        creationTimestamp: new Date(Date.now()),
      },
      {
        id: '2',
        roomId: '1',
        userId: '2',
        revision: '',
        subject: 'asdaskldmaskld',
        body: 'knkdiasslkladskmdaskld',
        read: false,
        creationTimestamp: new Date(Date.now()),
      },
      {
        id: '3',
        roomId: '2',
        userId: '1',
        revision: '',
        subject: 'testcomment',
        body: 'adsasdasdasdasdas',
        read: false,
        creationTimestamp: new Date(Date.now()),
      }
    ];

    const contents = [
      {
        contentId: '1',
        revision: '1',
        roomId: '1',
        subject: 'Text Content 1',
        body: 'This is a body of a text content.',
        round: 1,
        format: ContentType.TEXT
      },
      {
        contentId: '2',
        revision: '2',
        roomId: '1',
        subject: 'Text Content 2',
        body: 'testcontent alpha beta',
        round: 1,
        format: ContentType.TEXT
      },
      {
        contentId: '3',
        revision: '3',
        roomId: '1',
        subject: 'Text Content 3',
        body: 'testcontent alpha beta',
        round: 1,
        format: ContentType.TEXT
      },
      {
        contentId: '4',
        revision: '4',
        roomId: '1',
        subject: 'Text Content 4',
        body: 'testcontent alpha beta',
        round: 1,
        format: ContentType.TEXT
      },
      {
        contentId: '5',
        revision: '2',
        roomId: '3',
        subject: 'Text Content 1',
        body: 'This is yet another body of a text content.',
        round: 2,
        format: ContentType.TEXT
      }
    ];

    const textAnswers = [
      {
        id: '1',
        revision: '1',
        contentId: '1',
        round: '1',
        subject: 'Textaufgabe 1',
        body: 'gamma, delta',
        read: 'yes',
        creationTimestamp: Date,
      },
      {
        id: '2',
        revision: '2',
        contentId: '1',
        round: '1',
        subject: 'Textaufgabe 1',
        body: 'epsilon, phi',
        read: 'yes',
        creationTimestamp: Date,
      },
      {
        id: '3',
        revision: '3',
        contentId: '2',
        round: '3',
        subject: 'Textaufgabe 2',
        body: 'Der Turm ist 20m hoch',
        read: 'yes',
        creationTimestamp: Date,
      }
    ];

    const choiceAnswers = [
      {
        id: '1',
        revision: '1',
        contentId: '1',
        round: 0,
        selectedChoiceIndexes: [ 1, 2 ],
      }
    ];
    return { rooms, comments, contents, textAnswers, choiceAnswers };
  }
}
