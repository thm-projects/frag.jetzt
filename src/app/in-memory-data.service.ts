import { InMemoryDbService } from 'angular-in-memory-web-api';
import { Format } from './content';

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
        id: '1',
        revision: '1',
        roomId: '1',
        subject: 'Textaufgabe 1',
        body: 'testcontent alpha beta',
        round: 1,
        format: Format.TEXT
      },
      {
        id: '2',
        revision: '2',
        roomId: '3',
        subject: 'Textaufgabe 2',
        body: 'Ein Mann kauft 20 Melonen. Eine Melone wiegt jeweils 5kg. Berechnen Sie das Gesamtgewicht.',
        round: 5,
        format: Format.TEXT
      }
    ];

    const answerTexts = [
      {
        id: '1',
        revision: '1',
        contendId: '1',
        round: '1',
        subject: 'Textaufgabe 1',
        body: 'gamma, delta',
        read: 'yes',
        creationTimestamp: Date,
      },
      {
        id: '1',
        revision: '1',
        contendId: '1',
        round: '1',
        subject: 'Textaufgabe 1',
        body: 'epsilon, phi',
        read: 'yes',
        creationTimestamp: Date,
      },
      {
        id: '2',
        revision: '2',
        contendId: '2',
        round: '3',
        subject: 'Textaufgabe 2',
        body: 'Der Turm ist 20m hoch',
        read: 'yes',
        creationTimestamp: Date,
      }
    ];
    return { rooms, comments, contents, answerTexts };
  }
}
