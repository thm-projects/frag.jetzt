import { InMemoryDbService } from 'angular-in-memory-web-api';

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
        revision: '1',
        shortId: 't',
        abbreviation: 'abb',
        name: 'testroom',
        description: 'this is a test room',
        closed: true
      },
      {
        id: '2',
        revision: '11',
        shortId: 't1',
        abbreviation: 'abb1',
        name: 'testroom1',
        description: 'this is a test room1',
        closed: false
      }
    ];
    const comments = [
      {
        id: '1',
        roomId: '1',
        revision: '',
        subject: 'testcomment',
        body: 'adsasdasdasdasdas',
        read: false,
        creationTimestamp: new Date(Date.now()),
      },
      {
        id: '2',
        roomId: '1',
        revision: '',
        subject: 'asdaskldmaskld',
        body: 'knkdiasslkladskmdaskld',
        read: false,
        creationTimestamp: new Date(Date.now()),
      },
      {
        id: '3',
        roomId: '2',
        revision: '',
        subject: 'testcomment',
        body: 'adsasdasdasdasdas',
        read: false,
        creationTimestamp: new Date(Date.now()),
      }
    ];
    return { rooms, comments };
  }
}
