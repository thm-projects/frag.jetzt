import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';

export class KeycloakProvider {
  id: UUID;
  priority: number;
  url: string;
  frontendUrl: string;
  eventPassword: string;
  allowedIps: string;
  realm: string;
  clientId: string;
  nameDe: string;
  nameEn: string;
  nameFr: string;
  descriptionDe: string;
  descriptionEn: string;
  descriptionFr: string;
  createdAt: Date;
  updatedAt: Date;

  constructor({
    id = null,
    priority = 0,
    url = '',
    frontendUrl = '',
    eventPassword = '',
    allowedIps = '',
    realm = '',
    clientId = '',
    nameDe = '',
    nameEn = '',
    nameFr = '',
    descriptionDe = '',
    descriptionEn = '',
    descriptionFr = '',
    createdAt = new Date(),
    updatedAt = null,
  }: FieldsOf<KeycloakProvider>) {
    this.id = id;
    this.priority = priority;
    this.url = url;
    this.frontendUrl = frontendUrl;
    this.eventPassword = eventPassword;
    this.allowedIps = allowedIps;
    this.realm = realm;
    this.clientId = clientId;
    this.nameDe = nameDe;
    this.nameEn = nameEn;
    this.nameFr = nameFr;
    this.descriptionDe = descriptionDe;
    this.descriptionEn = descriptionEn;
    this.descriptionFr = descriptionFr;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}
