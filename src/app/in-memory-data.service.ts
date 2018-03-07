import { InMemoryDbService } from 'angular-in-memory-web-api';

export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const rooms = [
      {
        id: 'test',
        revision: '1',
        shortId: 't',
        abbreviation: 'abb',
        name: 'testroom',
        description: 'this is a test room',
        closed: true
      },
      {
        id: 'test1',
        revision: '11',
        shortId: 't1',
        abbreviation: 'abb1',
        name: 'testroom1',
        description: 'this is a test room1',
        closed: false
      }
    ];
    return { rooms };
  }
}
